# File: scripts/tts/note.py
import re
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("tts.note")

def remove_react_note_components(content: str) -> Tuple[str, int]:
    """Remove React Note components completely for TTS.
    
    Removes components like:
    <Note title="Vingean Uncertainty - The problem of predicting..." collapsed={true}>
    Imagine you're an amateur chess player...
    </Note>
    
    Args:
        content: The markdown content with React Note components
        
    Returns:
        Tuple of (processed_content, notes_removed_count)
    """
    notes_removed = 0
    
    # Pattern to match React Note components (container style)
    note_pattern = r'<Note\s+[^>]*?>\s*.*?\s*</Note>'
    
    def remove_note(match):
        nonlocal notes_removed
        notes_removed += 1
        
        # Extract some info for logging
        note_match = match.group(0)
        title_match = re.search(r'title="([^"]*)"', note_match)
        type_match = re.search(r'type="([^"]*)"', note_match)
        collapsed_match = re.search(r'collapsed=\{([^}]*)\}', note_match)
        
        title = title_match.group(1) if title_match else ""
        note_type = type_match.group(1) if type_match else ""
        collapsed = collapsed_match.group(1) if collapsed_match else "false"
        
        logger.debug(f"Removing Note component #{notes_removed}")
        if title:
            logger.debug(f"  Title: {title[:50]}...")
        if note_type:
            logger.debug(f"  Type: {note_type}")
        logger.debug(f"  Collapsed: {collapsed}")
        
        return ""  # Remove completely
    
    processed_content = re.sub(note_pattern, remove_note, content, flags=re.DOTALL)
    
    # Also handle self-closing Note components (just in case)
    self_closing_pattern = r'<Note\s+[^>]*?/>'
    
    def remove_self_closing_note(match):
        nonlocal notes_removed
        notes_removed += 1
        logger.debug(f"Removing self-closing Note component #{notes_removed}")
        return ""  # Remove completely
    
    processed_content = re.sub(self_closing_pattern, remove_self_closing_note, processed_content, flags=re.DOTALL)
    
    return processed_content, notes_removed

def process(content: str, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for TTS note removal.
    
    Args:
        content: The markdown content with React Note components
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Removing React Note components for TTS conversion...")
    
    # Remove all React Note components
    processed_content, notes_removed = remove_react_note_components(content)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "note_removal.md"
        with open(debug_path, 'w', encoding='utf-8') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "notes_removed": notes_removed
    }
    
    if notes_removed > 0:
        logger.info(f"Note removal complete - {notes_removed} React Note components removed")
    else:
        logger.info("No React Note components found to remove")
    
    return processed_content, stats
