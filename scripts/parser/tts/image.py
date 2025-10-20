# File: scripts/tts/image.py
import re
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("tts.image")

def remove_react_figure_components(content: str) -> Tuple[str, int]:
    """Remove React Figure components completely for TTS.
    
    Removes components like:
    <Figure src="./img/qax_Image_1.png" alt="Enter image alt description" number="1" label="2.1" caption="The two-dimensional view..." />
    
    Args:
        content: The markdown content with React Figure components
        
    Returns:
        Tuple of (processed_content, figures_removed_count)
    """
    figures_removed = 0
    
    # Pattern to match React Figure components (both self-closing and container styles)
    # Handles: <Figure ... /> and <Figure ...>...</Figure>
    
    # Pattern 1: Self-closing Figure components <Figure ... />
    self_closing_pattern = r'<Figure\s+[^>]*?/>'
    
    def remove_self_closing_figure(match):
        nonlocal figures_removed
        figures_removed += 1
        
        # Extract some info for logging
        figure_match = match.group(0)
        alt_match = re.search(r'alt="([^"]*)"', figure_match)
        src_match = re.search(r'src="([^"]*)"', figure_match)
        number_match = re.search(r'number="([^"]*)"', figure_match)
        
        alt_text = alt_match.group(1) if alt_match else "unknown"
        src_path = src_match.group(1) if src_match else "unknown"
        number = number_match.group(1) if number_match else "unknown"
        
        logger.debug(f"Removing Figure component #{figures_removed}: number={number}, alt='{alt_text}', src='{src_path}'")
        return ""  # Remove completely
    
    processed_content = re.sub(self_closing_pattern, remove_self_closing_figure, content, flags=re.DOTALL)
    
    # Pattern 2: Container Figure components <Figure ...>...</Figure> (just in case)
    container_pattern = r'<Figure\s+[^>]*?>\s*.*?\s*</Figure>'
    
    def remove_container_figure(match):
        nonlocal figures_removed
        figures_removed += 1
        logger.debug(f"Removing container Figure component #{figures_removed}")
        return ""  # Remove completely
    
    processed_content = re.sub(container_pattern, remove_container_figure, processed_content, flags=re.DOTALL)
    
    return processed_content, figures_removed

def process(content: str, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for TTS figure removal.
    
    Args:
        content: The markdown content with React Figure components
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Removing React Figure components for TTS conversion...")
    
    # Remove all React Figure components
    processed_content, figures_removed = remove_react_figure_components(content)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "figure_removal.md"
        with open(debug_path, 'w', encoding='utf-8') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "figures_removed": figures_removed
    }
    
    if figures_removed > 0:
        logger.info(f"Figure removal complete - {figures_removed} React Figure components removed")
    else:
        logger.info("No React Figure components found to remove")
    
    return processed_content, stats
