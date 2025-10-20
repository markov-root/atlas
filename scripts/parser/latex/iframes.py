# File: scripts/latex/iframes.py
import re
import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("latex.iframes")

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
        
        iframe_count = len([entry for entry in registry.get('media_registry', []) if entry['type'] == 'iframe'])
        logger.info(f"Loaded media registry with {iframe_count} iframe entries")
        return registry
    except Exception as e:
        logger.error(f"Error loading media registry: {e}")
        return {}

def create_iframe_lookup(media_registry: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Create a lookup dictionary for iframes by source URL.
    
    Args:
        media_registry: Media registry data
        
    Returns:
        dict: Mapping of iframe sources to iframe data
    """
    iframe_lookup = {}
    
    for entry in media_registry.get("media_registry", []):
        if entry["type"] == "iframe":
            # Use iframe_src as the key for lookup
            iframe_src = entry["iframe_src"]
            iframe_lookup[iframe_src] = entry
    
    logger.info(f"Created iframe lookup with {len(iframe_lookup)} entries")
    return iframe_lookup

def process_iframe_static_combinations(content: str, processed_dir: Path) -> Tuple[str, int]:
    """Process iframe + static figure combinations for LaTeX conversion.
    
    For LaTeX output:
    1. Keep the static figure content (usually an image)
    2. Remove the actual iframe element  
    3. Convert iframe-caption to figure-caption with Interactive Figure labeling
    4. Let the figure processor handle the resulting image + figure-caption combination
    """
    
    # Load media registry for iframe numbering
    media_registry = load_media_registry(processed_dir)
    iframe_lookup = create_iframe_lookup(media_registry)
    
    iframe_count = 0
    
    # Pattern 1: iframe-static-figure + iframe + iframe-caption
    # This handles the complete combination that should become an interactive figure
    full_pattern = r'<iframe-static-figure>\s*(.*?)\s*</iframe-static-figure>\s*<iframe([^>]*)>.*?</iframe>\s*<iframe-caption>\s*(.*?)\s*</iframe-caption>'
    
    def replace_full_iframe(match):
        nonlocal iframe_count
        iframe_count += 1
        
        static_content = match.group(1).strip()  # Content inside iframe-static-figure (usually an image)
        iframe_attrs = match.group(2).strip()    # Iframe attributes
        caption = match.group(3).strip()         # Content inside iframe-caption
        
        logger.debug(f"Processing full iframe combination #{iframe_count}")
        logger.debug(f"  Static content: {static_content[:50]}...")
        logger.debug(f"  Caption: {caption[:50]}...")
        
        # Extract src attribute from iframe to look up in registry
        src_match = re.search(r'src="([^"]*)"', iframe_attrs)
        iframe_src = src_match.group(1) if src_match else ""
        
        # Also try to extract image filename from static content for additional lookup
        img_match = re.search(r'Images/([^)]+)', static_content)
        img_filename = img_match.group(1) if img_match else ""
        
        logger.debug(f"  Extracted iframe src: {iframe_src}")
        logger.debug(f"  Extracted image filename: {img_filename}")
        
        # Look up iframe data in registry by src first
        iframe_data = iframe_lookup.get(iframe_src)
        
        # If not found by src, try to find by matching static_figure_path
        if not iframe_data and img_filename:
            logger.debug(f"  No match by src, trying static figure path matching...")
            for entry in media_registry.get("media_registry", []):
                if entry.get("type") == "iframe" and entry.get("static_figure_path"):
                    static_path = entry["static_figure_path"]
                    logger.debug(f"    Checking against registry static_figure_path: {static_path}")
                    if img_filename in static_path or static_path.endswith(img_filename):
                        iframe_data = entry
                        logger.info(f"Found iframe by static figure path match: {static_path}")
                        break
        
        # Debug: show all iframe entries if we still haven't found a match
        if not iframe_data:
            logger.warning(f"  No iframe found in registry. Available iframe entries:")
            for entry in media_registry.get("media_registry", []):
                if entry.get("type") == "iframe":
                    logger.warning(f"    - src: {entry.get('iframe_src', 'N/A')}")
                    logger.warning(f"      static_figure_path: {entry.get('static_figure_path', 'N/A')}")
                    logger.warning(f"      label: {entry.get('label', 'N/A')}")
        
        if iframe_data:
            iframe_number = iframe_data["number"]
            iframe_label = iframe_data["label"]
            logger.info(f"Found iframe in registry (Interactive Figure {iframe_label}): {iframe_src}")
            
            # Add interactive figure marker to caption for the figure processor to recognize
            enhanced_caption = f"INTERACTIVE_FIGURE_{iframe_number}_{iframe_label}:{caption}"
        else:
            logger.warning(f"Iframe not found in registry: {iframe_src}")
            if img_filename:
                logger.warning(f"  Also tried matching by static figure filename: {img_filename}")
            # Fallback without numbering
            enhanced_caption = f"INTERACTIVE_FIGURE_UNKNOWN:{caption}"
        
        # Convert to image + figure-caption format that the figure processor expects
        # The figure processor will see the INTERACTIVE_FIGURE marker and use customInteractiveFigure
        result = f"{static_content}\n<figure-caption>\n{enhanced_caption}\n</figure-caption>"
        
        logger.debug(f"  Converted to interactive figure format for figure processor")
        return result
    
    processed_content = re.sub(full_pattern, replace_full_iframe, content, flags=re.DOTALL)
    
    # Pattern 2: standalone iframe + iframe-caption (without static figure)
    # Remove these entirely since LaTeX can't handle iframes without static content
    standalone_iframe_pattern = r'<iframe[^>]*>.*?</iframe>\s*<iframe-caption>\s*(.*?)\s*</iframe-caption>'
    
    def remove_standalone_iframe(match):
        nonlocal iframe_count
        iframe_count += 1
        
        caption = match.group(1).strip()
        logger.info(f"Removing standalone iframe #{iframe_count} (no static figure available for LaTeX)")
        logger.debug(f"  Lost caption: {caption[:50]}...")
        
        # For LaTeX, we can't include iframes without static content
        return ""
    
    processed_content = re.sub(standalone_iframe_pattern, remove_standalone_iframe, processed_content, flags=re.DOTALL)
    
    # Pattern 3: orphaned iframe-static-figure (without iframe)
    # Just remove the tags and keep the content
    orphan_static_pattern = r'<iframe-static-figure>\s*(.*?)\s*</iframe-static-figure>'
    
    def preserve_orphan_static(match):
        static_content = match.group(1).strip()
        logger.debug(f"Preserving orphaned iframe-static-figure content: {static_content[:50]}...")
        return static_content
    
    processed_content = re.sub(orphan_static_pattern, preserve_orphan_static, processed_content, flags=re.DOTALL)
    
    # Pattern 4: standalone iframe without caption
    # Remove these entirely
    standalone_iframe_no_caption_pattern = r'<iframe[^>]*>.*?</iframe>'
    
    def remove_iframe_no_caption(match):
        logger.debug("Removing standalone iframe without caption")
        return ""
    
    processed_content = re.sub(standalone_iframe_no_caption_pattern, remove_iframe_no_caption, processed_content, flags=re.DOTALL)
    
    # Clean up extra newlines
    processed_content = re.sub(r'\n{3,}', '\n\n', processed_content)
    
    return processed_content, iframe_count

def process(content: str, processed_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for LaTeX iframe conversion with registry numbering.
    
    Args:
        content: The markdown content to process
        processed_dir: Base processed directory for loading media registry
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Processing iframes for LaTeX conversion with registry numbering...")
    
    # Process iframe combinations with registry numbering
    processed_content, iframe_count = process_iframe_static_combinations(content, processed_dir)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "iframes.tex"
        with open(debug_path, 'w', encoding='utf-8', errors='replace') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "iframes_processed": iframe_count
    }
    
    logger.info(f"Iframe processing complete - {iframe_count} iframes processed with registry numbering")
    
    return processed_content, stats
