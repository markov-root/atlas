# scripts/docusaurus/structure.py - Enhanced with rich frontmatter
"""
Handles directory structure and creating files with enhanced frontmatter.
"""

from pathlib import Path
import logging
import re

from .frontmatter import (
    extract_title_from_content, 
    generate_chapter_frontmatter, 
    generate_section_frontmatter,
    load_enhanced_metadata,
    # Legacy fallbacks
    generate_frontmatter,
    create_index_frontmatter
)
from .image import process_image_references
from .audio import copy_audio_files
from .heading import process_headings
from .component import process_components, process_components_with_registry

def create_structure(target_dir, chapter_num):
    """Create the basic directory structure for Docusaurus content.
    
    Args:
        target_dir: Target directory for Docusaurus content
        chapter_num: Chapter number
        
    Returns:
        dict: Results of structure creation
    """
    logger = logging.getLogger("docusaurus.structure")
    
    # Create images directory if it doesn't exist
    img_dir = target_dir / "img"
    img_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Created images directory: {img_dir}")
    
    # Create audio directory if it doesn't exist
    audio_dir = target_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Created audio directory: {audio_dir}")
    
    return {
        "status": "success",
        "chapter_dir": str(target_dir),
        "img_dir": str(img_dir),
        "audio_dir": str(audio_dir)
    }

def process_section_files(source_dir, target_dir, chapter_num, copied_images, processed_dir=None):
    """Process section files from preprocessed to target directory with enhanced frontmatter.
    
    Args:
        source_dir: Source directory with preprocessed content
        target_dir: Target directory for Docusaurus content
        chapter_num: Chapter number
        copied_images: List of copied image filenames
        processed_dir: Base processed directory for loading metadata
        
    Returns:
        dict: Results of processing
    """
    logger = logging.getLogger("docusaurus.structure")
    
    # Load enhanced metadata for frontmatter generation
    toc_data = {}
    metadata = {}
    if processed_dir:
        try:
            toc_data, metadata = load_enhanced_metadata(processed_dir)
            logger.info("Loaded enhanced metadata for frontmatter generation")
        except Exception as e:
            logger.warning(f"Could not load enhanced metadata: {e}")
            logger.warning("Falling back to basic frontmatter generation")
    
    # Copy audio files from preprocessed directory
    logger.info("Copying audio files...")
    audio_result = copy_audio_files(source_dir, target_dir)
    copied_audio = audio_result.get('copied_audio', [])
    if copied_audio:
        logger.info(f"Copied {len(copied_audio)} audio files: {', '.join(copied_audio)}")
    else:
        logger.info("No audio files found to copy")
    
    # Track processed files
    processed_files = []
    md_count = 0
    
    # Define the processing sequence for components
    # Order is important - some components might contain others
    component_processors = [
        "iframe",     # Process iframes FIRST to remove iframe-static-figure blocks
        "video",      # Process videos SECOND (before footnotes that might reference them)
        "footnote",   # Process footnotes before other text-modifying components
        "quote",      # Process quotes which have their own structure
        "note",       # Process notes which may contain other components
        "definition", # Process definitions
    ]
    
    # Process intro section (00.md) into index.md if it exists
    intro_file = source_dir / "00.md"
    if intro_file.exists():
        logger.info(f"Processing intro file {intro_file} into index.md")
        with open(intro_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract title
        title = extract_title_from_content(content) or f"Chapter {chapter_num}"
        
        # Process components FIRST (including iframe and video processors)
        # Pass processed_dir to components that need media registry
        processed_content, component_imports = process_components_with_registry(content, component_processors, processed_dir)
        
        # THEN process image references with processed_dir for media registry
        processed_content = process_image_references(
            processed_content, copied_images, chapter_num, processed_dir
        )
        
        # Finally, add headings after all content is processed
        processed_content = process_headings(processed_content, 0, processed_dir)
        
        # Generate enhanced frontmatter if metadata is available
        if toc_data and metadata:
            try:
                frontmatter = generate_chapter_frontmatter(chapter_num, toc_data, metadata)
                logger.info("Generated enhanced chapter frontmatter")
            except Exception as e:
                logger.warning(f"Error generating enhanced chapter frontmatter: {e}")
                frontmatter = create_index_frontmatter(chapter_num, title)
                logger.info("Fell back to basic chapter frontmatter")
        else:
            frontmatter = create_index_frontmatter(chapter_num, title)
            logger.info("Using basic chapter frontmatter (no enhanced metadata)")
        
        # Add component imports if any
        if component_imports:
            import_str = "\n".join(component_imports)
            frontmatter += import_str + "\n\n"
        
        # Write to index.md
        index_path = target_dir / "index.md"
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(frontmatter + processed_content)
        
        md_count += 1
        processed_files.append(str(index_path))
        logger.info(f"Created index.md with enhanced frontmatter from 00.md")
    else:
        # Create basic index file if 00.md doesn't exist
        index_path = create_index_file(target_dir, chapter_num, toc_data, metadata)
        md_count += 1
        processed_files.append(str(index_path))
    
    # Process other section files (01.md and up)
    section_files = sorted([f for f in source_dir.glob("*.md") 
                           if f.name.lower() not in ["index.md", "readme.md", "00.md"]])
    logger.info(f"Found {len(section_files)} additional section files to process")
    
    for md_file in section_files:
        logger.info(f"Processing file: {md_file}")
        
        # Get section number from filename
        match = re.match(r"(\d+)\.md", md_file.name)
        if match:
            section_num = int(match.group(1))
            logger.info(f"Extracted section number: {section_num}")
            
            # Read content
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract title
            title = extract_title_from_content(content)
            
            # Process components FIRST (including iframe and video processors)
            # Pass processed_dir to components that need media registry
            processed_content, component_imports = process_components_with_registry(content, component_processors, processed_dir)
            
            # THEN process image references with processed_dir for media registry
            processed_content = process_image_references(
                processed_content, copied_images, chapter_num, processed_dir
            )
            
            # Finally, add headings after all content is processed
            processed_content = process_headings(processed_content, section_num, processed_dir)
            
            # Generate enhanced frontmatter if metadata is available
            if toc_data:
                try:
                    frontmatter = generate_section_frontmatter(chapter_num, section_num, toc_data, title)
                    logger.info(f"Generated enhanced section frontmatter for section {section_num}")
                except Exception as e:
                    logger.warning(f"Error generating enhanced section frontmatter: {e}")
                    frontmatter = generate_frontmatter(chapter_num, section_num, title)
                    logger.info(f"Fell back to basic section frontmatter for section {section_num}")
            else:
                frontmatter = generate_frontmatter(chapter_num, section_num, title)
                logger.info(f"Using basic section frontmatter for section {section_num} (no enhanced metadata)")
            
            # Add component imports if any
            if component_imports:
                import_str = "\n".join(component_imports)
                frontmatter += import_str + "\n\n"
            
            # Write to target file with padded number (01.md, 02.md, etc.)
            output_file = target_dir / f"{section_num:02d}.md"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(frontmatter + processed_content)
            
            md_count += 1
            processed_files.append(str(output_file))
            logger.info(f"Processed: {md_file.name} -> {output_file.name}")
        else:
            logger.warning(f"Skipping file with non-matching name pattern: {md_file.name}")
    
    logger.info(f"Processed {md_count} markdown files with media registry numbering")
    return {
        "processed_files": processed_files,
        "count": md_count,
        "copied_audio": copied_audio
    }

def create_index_file(target_dir, chapter_num, toc_data=None, metadata=None):
    """Create an index.md file for the chapter with enhanced frontmatter if available."""
    logger = logging.getLogger("docusaurus.structure")
    
    index_path = target_dir / "index.md"
    
    # Try to generate enhanced frontmatter if metadata is available
    if toc_data and metadata:
        try:
            frontmatter = generate_chapter_frontmatter(chapter_num, toc_data, metadata)
            logger.info("Generated enhanced chapter frontmatter for index file")
        except Exception as e:
            logger.warning(f"Error generating enhanced frontmatter: {e}")
            frontmatter = create_index_frontmatter(chapter_num)
            logger.info("Fell back to basic frontmatter for index file")
    else:
        frontmatter = create_index_frontmatter(chapter_num)
        logger.info("Using basic frontmatter for index file (no enhanced metadata)")
    
    # Create content
    chapter_title = metadata.get("chapter", {}).get("title", f"Chapter {chapter_num}") if metadata else f"Chapter {chapter_num}"
    content = f"""
# {chapter_title}

Welcome to {chapter_title}. Please select a section from the sidebar to start reading.
"""
    
    # Write to file
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(frontmatter + content)
    
    logger.info(f"Created index file at {index_path}")
    return index_path
