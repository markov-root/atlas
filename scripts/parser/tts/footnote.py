# File: scripts/tts/footnote.py
import re
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("tts.footnote")

def remove_react_footnote_components(content: str) -> Tuple[str, int]:
    """Remove React Footnote components completely for TTS.
    
    Removes components like:
    <Footnote id="footnote_RL" number="1" text="For the sake of explaining these problems..." />
    
    Args:
        content: The markdown content with React Footnote components
        
    Returns:
        Tuple of (processed_content, footnotes_removed_count)
    """
    footnotes_removed = 0
    
    # Pattern to match React Footnote components (self-closing style)
    footnote_pattern = r'<Footnote\s+[^>]*?/>'
    
    def remove_footnote(match):
        nonlocal footnotes_removed
        footnotes_removed += 1
        
        # Extract some info for logging
        footnote_match = match.group(0)
        id_match = re.search(r'id="([^"]*)"', footnote_match)
        number_match = re.search(r'number="([^"]*)"', footnote_match)
        text_match = re.search(r'text="([^"]*)"', footnote_match)
        
        footnote_id = id_match.group(1) if id_match else "unknown"
        number = number_match.group(1) if number_match else "unknown"
        text_preview = text_match.group(1)[:50] + "..." if text_match else ""
        
        logger.debug(f"Removing Footnote component #{footnotes_removed}")
        logger.debug(f"  ID: {footnote_id}")
        logger.debug(f"  Number: {number}")
        logger.debug(f"  Text preview: {text_preview}")
        
        return ""  # Remove completely
    
    processed_content = re.sub(footnote_pattern, remove_footnote, content, flags=re.DOTALL)
    
    # Also handle container Footnote components (just in case)
    container_pattern = r'<Footnote\s+[^>]*?>\s*.*?\s*</Footnote>'
    
    def remove_container_footnote(match):
        nonlocal footnotes_removed
        footnotes_removed += 1
        logger.debug(f"Removing container Footnote component #{footnotes_removed}")
        return ""  # Remove completely
    
    processed_content = re.sub(container_pattern, remove_container_footnote, processed_content, flags=re.DOTALL)
    
    # Remove FootnoteRegistry component if present
    registry_pattern = r'<FootnoteRegistry\s+[^>]*?/?>'
    
    def remove_footnote_registry(match):
        logger.debug("Removing FootnoteRegistry component")
        return ""
    
    processed_content = re.sub(registry_pattern, remove_footnote_registry, processed_content, flags=re.DOTALL)
    
    return processed_content, footnotes_removed

def process(content: str, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for TTS footnote removal.
    
    Args:
        content: The markdown content with React Footnote components
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Removing React Footnote components for TTS conversion...")
    
    # Remove all React Footnote components
    processed_content, footnotes_removed = remove_react_footnote_components(content)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "footnote_removal.md"
        with open(debug_path, 'w', encoding='utf-8') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "footnotes_removed": footnotes_removed
    }
    
    if footnotes_removed > 0:
        logger.info(f"Footnote removal complete - {footnotes_removed} React Footnote components removed")
    else:
        logger.info("No React Footnote components found to remove")
    
    return processed_content, stats
