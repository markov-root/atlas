# scripts/docusaurus/image.py
import re
import shutil
import logging
import json
from pathlib import Path

def copy_images(source_dir, target_dir):
    """Copy images from source to target directory.
    
    Args:
        source_dir: Source directory
        target_dir: Target directory
        
    Returns:
        dict: Results of image copying
    """
    logger = logging.getLogger("docusaurus.image")
    
    # Create output directories
    img_dir = target_dir / "img"
    img_dir.mkdir(exist_ok=True)
    logger.info(f"Created image directory: {img_dir}")
    
    # Track copied images
    copied_images = []
    
    # Copy images if they exist
    images_source = source_dir / "Images"
    if images_source.exists():
        logger.info(f"Found images directory: {images_source}")
        image_count = 0
        for img_file in images_source.glob("*"):
            if img_file.is_file():
                dest_path = img_dir / img_file.name
                shutil.copy2(img_file, dest_path)
                copied_images.append(img_file.name)
                logger.info(f"Copied image: {img_file.name} -> {dest_path}")
                image_count += 1
        logger.info(f"Copied {image_count} images to {img_dir}")
    else:
        logger.warning(f"No Images directory found at {images_source}")
    
    # List all image files for debugging
    logger.info("Available images in target directory:")
    for img_file in img_dir.glob("*"):
        logger.info(f"  - {img_file.name}")
    
    return {
        "img_dir": img_dir,
        "copied_images": copied_images
    }

def load_media_registry(processed_dir):
    """Load media registry from preprocessed directory.
    
    Args:
        processed_dir: Base processed directory
        
    Returns:
        dict: Media registry data, or empty dict if not found
    """
    logger = logging.getLogger("docusaurus.image")
    
    registry_path = processed_dir / "preprocessed" / "media_registry.json"
    
    if not registry_path.exists():
        logger.warning(f"Media registry not found at {registry_path}")
        return {}
    
    try:
        with open(registry_path, 'r', encoding='utf-8') as f:
            registry = json.load(f)
        
        logger.info(f"Loaded media registry with {len(registry.get('media_registry', []))} entries")
        return registry
    except Exception as e:
        logger.error(f"Error loading media registry: {e}")
        return {}

def create_figure_lookup(media_registry):
    """Create a lookup dictionary for figures by file path.
    
    Args:
        media_registry: Media registry data
        
    Returns:
        dict: Mapping of file paths to figure data
    """
    figure_lookup = {}
    
    for entry in media_registry.get("media_registry", []):
        if entry["type"] == "figure":
            # Normalize path for lookup (handle both Images/ and ./Images/ formats)
            file_path = entry["file_path"]
            normalized_path = file_path.replace("./Images/", "Images/").replace("./img/", "Images/")
            
            figure_lookup[normalized_path] = entry
            
            # Also add variations for robust matching
            filename = Path(file_path).name
            figure_lookup[f"Images/{filename}"] = entry
            figure_lookup[f"./Images/{filename}"] = entry
    
    return figure_lookup

def process_image_references(content, copied_images, chapter_num=None, processed_dir=None):
    """Process image references in markdown content using media registry for numbering.
    
    Args:
        content: Original markdown content
        copied_images: List of copied image filenames
        chapter_num: Chapter number (kept for backward compatibility)
        processed_dir: Base processed directory for loading media registry
        
    Returns:
        str: Processed content with Figure components
    """
    logger = logging.getLogger("docusaurus.image")
    
    # Load media registry
    if processed_dir:
        media_registry = load_media_registry(processed_dir)
        figure_lookup = create_figure_lookup(media_registry)
        logger.info(f"Created figure lookup with {len(figure_lookup)} entries")
    else:
        logger.warning("No processed_dir provided, cannot load media registry")
        media_registry = {}
        figure_lookup = {}
    
    # Debug initial image references
    img_refs_before = re.findall(r'!\[(.*?)\]\((.*?)\)', content)
    figure_refs_before = re.findall(r'<Figure src="(.*?)"', content)
    logger.info(f"Before image fix - Found {len(img_refs_before)} markdown image references")
    logger.info(f"Before image fix - Found {len(figure_refs_before)} Figure components")
    
    for alt, path in img_refs_before:
        logger.debug(f"  - Markdown: alt='{alt}', path='{path}'")
    for src in figure_refs_before:
        logger.debug(f"  - Figure: src='{src}'")
    
    # Fix broken Figure tags (unclosed quotes, etc.)
    broken_figure_pattern = r'<Figure src="([^"]+)(?:\)|\s)'
    def fix_broken_figure(match):
        src = match.group(1)
        logger.info(f"Fixing broken Figure tag with src='{src}'")
        return f'<Figure src="{src}" '
    
    content = re.sub(broken_figure_pattern, fix_broken_figure, content)
    
    # Process image-caption pairs
    # Find all image+caption pairs (image followed by <figure-caption>)
    image_caption_pattern = r'!\[(.*?)\]\((Images/.*?)\)\s*\n*<figure-caption>\s*\n*(.*?)\s*\n*</figure-caption>'
    
    def replace_image_with_caption(match):
        alt = match.group(1)
        img_path = match.group(2)
        caption = match.group(3).strip()
        
        # Extract just the filename from the path
        img_filename = Path(img_path).name
        
        # Use relative path that works in Docusaurus: ./img/filename
        docusaurus_path = f"./img/{img_filename}"
        
        # Look up figure data in registry
        figure_data = figure_lookup.get(img_path)
        if figure_data:
            figure_number = figure_data["number"]
            figure_label = figure_data["label"]
            logger.info(f"Processing image with caption (Figure {figure_label}): {img_filename}")
            
            # Create a Figure component with registry data
            return f'<Figure src="{docusaurus_path}" alt="{alt}" number="{figure_number}" label="{figure_label}" caption="{caption}" />'
        else:
            logger.warning(f"Figure not found in registry: {img_path}")
            # Fallback without numbering
            return f'<Figure src="{docusaurus_path}" alt="{alt}" caption="{caption}" />'
    
    # Replace image+caption pairs
    content = re.sub(image_caption_pattern, replace_image_with_caption, content, flags=re.DOTALL)
    
    # Replace standalone <caption> tags (sometimes used under images)
    caption_pattern = r'<caption>\s*(.*?)\s*</caption>'
    
    def replace_caption(match):
        caption_text = match.group(1).strip()
        return f'<figcaption>{caption_text}</figcaption>'
    
    content = re.sub(caption_pattern, replace_caption, content, flags=re.DOTALL)
    
    # Process remaining standalone images
    
    # First, handle the "Enter image alt description" case which is common
    def fix_enter_image_alt(match):
        img_filename = match.group(1)
        img_path = f"Images/{img_filename}"
        
        # Use relative path: ./img/filename
        docusaurus_path = f"./img/{img_filename}"
        
        # Look up figure data in registry
        figure_data = figure_lookup.get(img_path)
        if figure_data:
            figure_number = figure_data["number"]
            figure_label = figure_data["label"]
            logger.info(f"Processing standalone image (Figure {figure_label}): {img_filename}")
            
            # Create Figure component with registry data
            return f'<Figure src="{docusaurus_path}" alt="{img_filename}" number="{figure_number}" label="{figure_label}" />'
        else:
            logger.warning(f"Figure not found in registry: {img_path}")
            # Fallback without numbering
            return f'<Figure src="{docusaurus_path}" alt="{img_filename}" />'
    
    content = re.sub(
        r'!\[Enter image alt description\]\(Images/(.*?)\)',
        fix_enter_image_alt,
        content
    )
    
    # Fix broken image tags with quotes in the wrong place
    def fix_broken_image_tags(match):
        alt = match.group(3) if match.group(3) else match.group(1)
        img_filename = match.group(2)
        caption = match.group(4) if len(match.groups()) >= 4 and match.group(4) else ""
        img_path = f"Images/{img_filename}"
        
        # Use relative path: ./img/filename
        docusaurus_path = f"./img/{img_filename}"
        
        # Look up figure data in registry
        figure_data = figure_lookup.get(img_path)
        if figure_data:
            figure_number = figure_data["number"]
            figure_label = figure_data["label"]
            logger.info(f"Processing broken image tag (Figure {figure_label}): {img_filename}")
            
            # Create Figure component with registry data
            if caption:
                return f'<Figure src="{docusaurus_path}" alt="{alt}" number="{figure_number}" label="{figure_label}" caption="{caption}" />'
            else:
                return f'<Figure src="{docusaurus_path}" alt="{alt}" number="{figure_number}" label="{figure_label}" />'
        else:
            logger.warning(f"Figure not found in registry: {img_path}")
            # Fallback without numbering
            if caption:
                return f'<Figure src="{docusaurus_path}" alt="{alt}" caption="{caption}" />'
            else:
                return f'<Figure src="{docusaurus_path}" alt="{alt}" />'
    
    content = re.sub(
        r'!\[([^\]]+)\]\(./img/([^"]+)"\s+alt="([^"]+)"\s+caption="([^"]+)"\s*/?>',
        fix_broken_image_tags,
        content
    )
    
    # Replace general image paths - this is the main fix
    def fix_general_images(match):
        alt = match.group(1)
        img_filename = match.group(2)
        img_path = f"Images/{img_filename}"
        
        # Use relative path: ./img/filename
        docusaurus_path = f"./img/{img_filename}"
        
        # Look up figure data in registry
        figure_data = figure_lookup.get(img_path)
        if figure_data:
            figure_number = figure_data["number"]
            figure_label = figure_data["label"]
            logger.info(f"Processing general image (Figure {figure_label}): {img_filename}")
            
            # Create Figure component with registry data
            return f'<Figure src="{docusaurus_path}" alt="{alt}" number="{figure_number}" label="{figure_label}" />'
        else:
            logger.warning(f"Figure not found in registry: {img_path}")
            # Fallback without numbering
            return f'<Figure src="{docusaurus_path}" alt="{alt}" />'
    
    content = re.sub(
        r'!\[(.*?)\]\(Images/(.*?)\)',
        fix_general_images,
        content
    )
    
    # Also handle any ./Images/ paths
    content = re.sub(
        r'!\[(.*?)\]\(./Images/(.*?)\)',
        fix_general_images,
        content
    )
    
    # Process existing Figure components and add numbering if missing
    def process_existing_figures(match):
        full_tag = match.group(0)
        
        # Check if number/label attributes already exist
        has_number = 'number=' in full_tag
        has_label = 'label=' in full_tag
        
        if not has_number and not has_label:
            # Try to extract src to look up in registry
            src_match = re.search(r'src="([^"]+)"', full_tag)
            if src_match:
                src_path = src_match.group(1)
                # Convert docusaurus path back to registry path for lookup
                if src_path.startswith('./img/'):
                    img_filename = src_path.replace('./img/', '')
                    img_path = f"Images/{img_filename}"
                    
                    figure_data = figure_lookup.get(img_path)
                    if figure_data:
                        figure_number = figure_data["number"]
                        figure_label = figure_data["label"]
                        
                        # Insert number and label before the closing />
                        updated_tag = full_tag.replace('/>', f' number="{figure_number}" label="{figure_label}" />')
                        logger.info(f"Added numbering to existing Figure (Figure {figure_label})")
                        return updated_tag
        
        return full_tag
    
    # Process existing Figure components
    content = re.sub(
        r'<Figure[^>]*\/?>',
        process_existing_figures,
        content
    )
    
    # Fix any standalone figure captions not caught by the image+caption pattern
    content = re.sub(
        r'<figure-caption>(.*?)</figure-caption>',
        r'<figcaption>\1</figcaption>',
        content,
        flags=re.DOTALL
    )
    
    # Associate any standalone figcaptions with the preceding Figure
    figure_with_caption_pattern = r'(<Figure[^>]*/>)\s*\n*<figcaption>(.*?)</figcaption>'
    
    def combine_figure_and_caption(match):
        figure_tag = match.group(1)
        caption = match.group(2).strip()
        
        # Insert caption into the Figure component
        if 'caption="' in figure_tag:
            # Already has a caption, don't replace
            return f'{figure_tag}\n<figcaption>{caption}</figcaption>'
        else:
            # Replace the closing tag with caption attribute
            return figure_tag.replace('/>', f' caption="{caption}" />')
    
    content = re.sub(figure_with_caption_pattern, combine_figure_and_caption, content, flags=re.DOTALL)
    
    # Add Figure import if there are any Figure components
    if '<Figure' in content and 'import Figure from "@site/src/components/chapters/Figure"' not in content:
        logger.info("Adding Figure import after frontmatter")
        
        # Try to add after existing imports first
        if re.search(r'import .+ from "@site/src/components/chapters/', content):
            logger.info("Adding Figure import after existing component imports")
            content = re.sub(
                r'(import .+ from "@site/src/components/chapters/[^"]+";)(\s*)',
                r'\1\2import Figure from "@site/src/components/chapters/Figure";\2',
                content
            )
        # Otherwise, add after frontmatter if it exists
        elif '---' in content:
            logger.info("Adding Figure import after frontmatter")
            content = re.sub(
                r'(---\s*[\s\S]*?---\s*\n+)',
                r'\1import Figure from "@site/src/components/chapters/Figure";\n\n',
                content
            )
        # Last resort: add at the beginning of the file
        else:
            logger.info("Adding Figure import at the beginning of the file")
            content = 'import Figure from "@site/src/components/chapters/Figure";\n\n' + content
    
    # Debug final image references
    figure_refs = re.findall(r'<Figure src="(.*?)"', content)
    logger.info(f"After image fix - Found {len(figure_refs)} Figure components")
    for src in figure_refs:
        logger.debug(f"  - After: src='{src}'")
    
    return content
