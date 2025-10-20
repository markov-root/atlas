# File: scripts/latex/figures.py
import re
import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("latex.figures")

def load_media_registry(processed_dir: Path) -> Dict[str, Any]:
    """Load media registry from preprocessed directory.
    
    Args:
        processed_dir: Base processed directory
        
    Returns:
        dict: Media registry data, or empty dict if not found
    """
    if not processed_dir:
        logger.warning("No processed_dir provided, cannot load media registry")
        return {}
    
    registry_path = processed_dir / "preprocessed" / "media_registry.json"
    
    if not registry_path.exists():
        logger.warning(f"Media registry not found at {registry_path}")
        return {}
    
    try:
        with open(registry_path, 'r', encoding='utf-8') as f:
            registry = json.load(f)
        
        figure_count = len([entry for entry in registry.get('media_registry', []) if entry['type'] == 'figure'])
        iframe_count = len([entry for entry in registry.get('media_registry', []) if entry['type'] == 'iframe'])
        logger.info(f"Loaded media registry with {figure_count} figure entries and {iframe_count} iframe entries")
        return registry
    except Exception as e:
        logger.error(f"Error loading media registry: {e}")
        return {}

def create_figure_lookup(media_registry: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
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
    
    logger.info(f"Created figure lookup with {len(figure_lookup)} entries")
    return figure_lookup

def process_interactive_figures(content: str, processed_dir: Path) -> Tuple[str, int]:
    """Process interactive figures (iframe-derived) with registry numbering."""
    
    # Load media registry
    media_registry = load_media_registry(processed_dir)
    
    interactive_count = 0
    
    # Pattern to match images with interactive figure captions (marked by iframe processor)
    interactive_pattern = r'!\[([^\]]*)\]\(Images/([^)]+)\)\s*\n*<figure-caption>\s*INTERACTIVE_FIGURE_(\d+|UNKNOWN)_([^:]*):([^<]*)\s*</figure-caption>'
    
    def replace_interactive_figure(match):
        nonlocal interactive_count
        interactive_count += 1
        
        alt_text = match.group(1).strip()
        image_filename = match.group(2).strip()
        iframe_number = match.group(3)
        iframe_label = match.group(4)
        caption = match.group(5).strip()
        
        logger.debug(f"Processing interactive figure #{interactive_count}: {image_filename}")
        logger.debug(f"  Registry number: {iframe_number}, label: {iframe_label}")
        logger.debug(f"  Caption: {caption[:50]}...")
        
        # Clean up image path
        image_path = image_filename.replace('*', '')
        
        # Process hyperlinks in caption
        caption = process_hyperlinks_in_caption(caption)
        
        # Escape special characters in caption
        caption = escape_latex_chars(caption)
        
        # Handle alt text - use it if it's meaningful, otherwise use empty string
        alt_for_latex = "" if alt_text == "Enter image alt description" else alt_text
        
        # Create customInteractiveFigure command with registry numbering
        if iframe_number != "UNKNOWN" and iframe_label:
            # Use registry numbering - pass number and label to LaTeX command
            latex_figure = f"\\customInteractiveFigure{{{image_path}}}{{{alt_for_latex}}}{{{caption}}}{{{iframe_number}}}{{{iframe_label}}}"
            logger.info(f"Converted interactive figure #{interactive_count} with registry numbering (Interactive Figure {iframe_label}): {image_filename}")
        else:
            # Fallback without numbering - pass empty number and label
            latex_figure = f"\\customInteractiveFigure{{{image_path}}}{{{alt_for_latex}}}{{{caption}}}{{}}{{}}"
            logger.warning(f"Converted interactive figure #{interactive_count} without registry numbering: {image_filename}")
        
        return latex_figure
    
    # Process all interactive figures
    processed_content = re.sub(interactive_pattern, replace_interactive_figure, content, flags=re.DOTALL)
    
    return processed_content, interactive_count

def process_regular_figures_with_captions(content: str, processed_dir: Path) -> Tuple[str, int]:
    """Process regular figures with captions using registry numbering."""
    
    # Load media registry
    media_registry = load_media_registry(processed_dir)
    figure_lookup = create_figure_lookup(media_registry)
    
    figure_count = 0
    
    # Pattern to match regular images with figure captions (not interactive)
    # This should match images that don't have the INTERACTIVE_FIGURE marker
    figure_pattern = r'!\[([^\]]*)\]\(Images/([^)]+)\)\s*\n*<figure-caption>\s*(?!INTERACTIVE_FIGURE)(.*?)\s*</figure-caption>'
    
    def replace_regular_figure(match):
        nonlocal figure_count
        figure_count += 1
        
        alt_text = match.group(1).strip()
        image_filename = match.group(2).strip()
        caption = match.group(3).strip()
        
        logger.debug(f"Processing regular figure #{figure_count}: {image_filename}")
        logger.debug(f"  Caption: {caption[:50]}...")
        
        # Clean up image path
        image_path = image_filename.replace('*', '')
        
        # Look up figure data in registry
        figure_data = figure_lookup.get(f"Images/{image_filename}")
        
        if figure_data:
            figure_number = figure_data["number"]
            figure_label = figure_data["label"]
            logger.info(f"Found figure in registry (Figure {figure_label}): {image_filename}")
            
            # Process hyperlinks in caption
            caption = process_hyperlinks_in_caption(caption)
            
            # Escape special characters in caption
            caption = escape_latex_chars(caption)
            
            # Handle alt text
            alt_for_latex = "" if alt_text == "Enter image alt description" else alt_text
            
            # Create customFigure command with registry numbering
            # Pass number and label to LaTeX command for proper numbering
            latex_figure = f"\\customFigure{{{image_path}}}{{{alt_for_latex}}}{{{caption}}}{{{figure_number}}}{{{figure_label}}}"
            
            logger.info(f"Converted regular figure #{figure_count} with registry numbering (Figure {figure_label}): {image_filename}")
        else:
            logger.warning(f"Figure not found in registry: {image_filename}")
            
            # Process hyperlinks in caption
            caption = process_hyperlinks_in_caption(caption)
            
            # Escape special characters in caption
            caption = escape_latex_chars(caption)
            
            # Handle alt text
            alt_for_latex = "" if alt_text == "Enter image alt description" else alt_text
            
            # Fallback without numbering - pass empty number and label
            latex_figure = f"\\customFigure{{{image_path}}}{{{alt_for_latex}}}{{{caption}}}{{}}{{}}"
            logger.warning(f"Converted regular figure #{figure_count} without registry numbering: {image_filename}")
        
        return latex_figure
    
    # Process all regular figures with captions
    processed_content = re.sub(figure_pattern, replace_regular_figure, content, flags=re.DOTALL)
    
    return processed_content, figure_count

def process_standalone_images(content: str, processed_dir: Path) -> Tuple[str, int]:
    """Process standalone images (without captions) using registry numbering if available."""
    
    # Load media registry
    media_registry = load_media_registry(processed_dir)
    figure_lookup = create_figure_lookup(media_registry)
    
    standalone_count = 0
    
    # Pattern to match standalone images that weren't caught by the caption patterns
    # This should only match images that don't have captions
    standalone_pattern = r'!\[([^\]]*)\]\(Images/([^)]+)\)(?!\s*\n*<figure-caption>)'
    
    def replace_standalone(match):
        nonlocal standalone_count
        standalone_count += 1
        
        alt_text = match.group(1).strip()
        image_filename = match.group(2).strip()
        
        logger.debug(f"Processing standalone image #{standalone_count}: {image_filename}")
        
        # Clean up image path
        image_path = image_filename.replace('*', '')
        
        # Look up figure data in registry
        figure_data = figure_lookup.get(f"Images/{image_filename}")
        
        if figure_data:
            figure_number = figure_data["number"]
            figure_label = figure_data["label"]
            logger.info(f"Found standalone image in registry (Figure {figure_label}): {image_filename}")
            
            # Use registry number as caption for standalone images
            caption = f"Figure {figure_label}"
            alt_for_latex = alt_text if alt_text and alt_text != "Enter image alt description" else ""
            
            latex_figure = f"\\customFigure{{{image_path}}}{{{alt_for_latex}}}{{{caption}}}"
            logger.info(f"Converted standalone image #{standalone_count} with registry numbering: {image_filename}")
        else:
            logger.warning(f"Standalone image not found in registry: {image_filename}")
            
            # Use alt text as caption if meaningful, otherwise no caption
            if alt_text and alt_text != "Enter image alt description":
                caption = escape_latex_chars(alt_text)
                alt_for_latex = alt_text
            else:
                caption = ""  # No caption for standalone images without meaningful alt text
                alt_for_latex = ""
            
            latex_figure = f"\\customFigure{{{image_path}}}{{{alt_for_latex}}}{{{caption}}}"
            logger.warning(f"Converted standalone image #{standalone_count} without registry numbering: {image_filename}")
        
        return latex_figure
    
    # Process standalone images
    processed_content = re.sub(standalone_pattern, replace_standalone, content)
    
    return processed_content, standalone_count

def process_hyperlinks_in_caption(caption: str) -> str:
    """Process markdown links in captions to LaTeX hyperref format."""
    # Pattern for markdown links: [text](url)
    link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    
    def convert_link(match):
        link_text = match.group(1)
        url = match.group(2)
        
        # Skip image paths
        if url.startswith('Images/'):
            return match.group(0)
        
        # Create LaTeX hyperref with protection for captions
        return f'\\protect\\href{{{url}}}{{{link_text}}}'
    
    return re.sub(link_pattern, convert_link, caption)

def escape_latex_chars(text: str) -> str:
    """Escape special LaTeX characters in text."""
    if not text:
        return text
    
    # Escape common special characters
    text = text.replace('_', '\\_')
    text = text.replace('#', '\\#')
    text = text.replace('%', '\\%')
    # text = text.replace('&', '\\&') # causes crashes in hyperlinks
    text = text.replace('$', '\\$')
    
    return text

def process(content: str, processed_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for LaTeX figure conversion with registry numbering and interactive figure support.
    
    Args:
        content: The markdown content to process
        processed_dir: Base processed directory for loading media registry
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Processing figures for LaTeX conversion with registry numbering and interactive figure support...")
    
    # Step 1: Process interactive figures (iframe-derived) first
    processed_content, interactive_count = process_interactive_figures(content, processed_dir)
    
    # Step 2: Process regular images with captions
    processed_content, captioned_count = process_regular_figures_with_captions(processed_content, processed_dir)
    
    # Step 3: Process any remaining standalone images
    processed_content, standalone_count = process_standalone_images(processed_content, processed_dir)
    
    total_figures = interactive_count + captioned_count + standalone_count
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "figures.tex"
        with open(debug_path, 'w', encoding='utf-8', errors='replace') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "interactive_figures": interactive_count,
        "figures_with_captions": captioned_count,
        "standalone_figures": standalone_count,
        "total_figures": total_figures
    }
    
    logger.info(f"Figure processing complete - {interactive_count} interactive figures, {captioned_count} captioned figures, {standalone_count} standalone figures")
    
    return processed_content, stats
