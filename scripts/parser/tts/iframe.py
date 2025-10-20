# File: scripts/tts/iframe.py
import re
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("tts.iframe")

def remove_react_iframe_components(content: str) -> Tuple[str, int]:
    """Remove React Iframe components completely for TTS.
    
    Removes components like:
    <Iframe src="https://example.com/interactive" title="Interactive Demo" number="1" label="2.1" caption="Interactive visualization" />
    <Iframe src="https://colab.research.google.com/..." width="100%" height="600px" loading="lazy" />
    
    Args:
        content: The markdown content with React Iframe components
        
    Returns:
        Tuple of (processed_content, iframes_removed_count)
    """
    iframes_removed = 0
    
    # Pattern to match React Iframe components (both self-closing and container styles)
    
    # Pattern 1: Self-closing Iframe components <Iframe ... />
    self_closing_pattern = r'<Iframe\s+[^>]*?/>'
    
    def remove_self_closing_iframe(match):
        nonlocal iframes_removed
        iframes_removed += 1
        
        # Extract some info for logging
        iframe_match = match.group(0)
        src_match = re.search(r'src="([^"]*)"', iframe_match)
        title_match = re.search(r'title="([^"]*)"', iframe_match)
        number_match = re.search(r'number="([^"]*)"', iframe_match)
        label_match = re.search(r'label="([^"]*)"', iframe_match)
        caption_match = re.search(r'caption="([^"]*)"', iframe_match)
        
        src_url = src_match.group(1) if src_match else "unknown"
        title = title_match.group(1) if title_match else ""
        number = number_match.group(1) if number_match else "unknown"
        label = label_match.group(1) if label_match else ""
        caption = caption_match.group(1) if caption_match else ""
        
        # Identify iframe type for better logging
        iframe_type = "unknown"
        if "colab.research.google.com" in src_url:
            iframe_type = "Google Colab"
        elif "github.com" in src_url or "githubusercontent.com" in src_url:
            iframe_type = "GitHub"
        elif "jupyter" in src_url.lower():
            iframe_type = "Jupyter Notebook"
        elif "observablehq.com" in src_url:
            iframe_type = "Observable"
        elif "plotly" in src_url:
            iframe_type = "Plotly"
        
        logger.debug(f"Removing {iframe_type} Iframe #{iframes_removed}: number={number}")
        logger.debug(f"  Source: {src_url[:60]}...")
        if title:
            logger.debug(f"  Title: {title}")
        if caption:
            logger.debug(f"  Caption: {caption[:50]}...")
        
        return ""  # Remove completely
    
    processed_content = re.sub(self_closing_pattern, remove_self_closing_iframe, content, flags=re.DOTALL)
    
    # Pattern 2: Container Iframe components <Iframe ...>...</Iframe> (just in case)
    container_pattern = r'<Iframe\s+[^>]*?>\s*.*?\s*</Iframe>'
    
    def remove_container_iframe(match):
        nonlocal iframes_removed
        iframes_removed += 1
        logger.debug(f"Removing container Iframe component #{iframes_removed}")
        return ""  # Remove completely
    
    processed_content = re.sub(container_pattern, remove_container_iframe, processed_content, flags=re.DOTALL)
    
    return processed_content, iframes_removed

def process(content: str, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for TTS iframe removal.
    
    Args:
        content: The markdown content with React Iframe components
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Removing React Iframe components for TTS conversion...")
    
    # Remove all React Iframe components
    processed_content, iframes_removed = remove_react_iframe_components(content)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "iframe_removal.md"
        with open(debug_path, 'w', encoding='utf-8') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "iframes_removed": iframes_removed
    }
    
    if iframes_removed > 0:
        logger.info(f"Iframe removal complete - {iframes_removed} React Iframe components removed")
    else:
        logger.info("No React Iframe components found to remove")
    
    return processed_content, stats
