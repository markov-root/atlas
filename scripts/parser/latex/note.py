# File: scripts/latex/note.py
import re
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("latex.note")

def escape_latex_chars(text: str) -> str:
    """Escape special LaTeX characters in text."""
    if not text:
        return text
    
    # Simple escaping - avoid & since it causes issues with URLs
    text = text.replace('_', '\\_')
    text = text.replace('#', '\\#') 
    text = text.replace('%', '\\%')
    text = text.replace('$', '\\$')
    # Not escaping & to avoid double-escaping in URLs
    
    return text

def process_note_blocks(content: str) -> Tuple[str, int]:
    """Process note-box blocks and convert to customNote commands."""
    
    note_count = 0
    
    # Pattern to match note-box blocks
    note_pattern = r'<note-box>\s*(.*?)\s*</note-box>'
    
    def replace_note(match):
        nonlocal note_count
        note_count += 1
        
        block_content = match.group(1).strip()
        
        logger.debug(f"Processing note #{note_count}")
        
        # Extract title
        title_match = re.search(r'<title>\s*(.*?)(?:\s*<(?:collapsed|content)|$)', block_content, re.DOTALL)
        title = title_match.group(1).strip() if title_match else "Note"
        
        # Extract content
        content_match = re.search(r'<content>\s*(.*?)\s*(?:</content>|$)', block_content, re.DOTALL)
        note_content = content_match.group(1).strip() if content_match else "No note content provided"
        
        # Clean up any remaining XML tags
        note_content = re.sub(r'</?(?:collapsed|title|content).*?>', '', note_content)
        note_content = note_content.strip()
        
        # Escape special characters
        title_escaped = escape_latex_chars(title)
        content_escaped = escape_latex_chars(note_content)
        
        # Create customNote command
        latex_note = f"\\customNote{{{title_escaped}}}{{{content_escaped}}}"
        
        logger.info(f"Converted note #{note_count}: {title}")
        
        return latex_note
    
    # Process all note-box blocks
    processed_content = re.sub(note_pattern, replace_note, content, flags=re.DOTALL)
    
    return processed_content, note_count

def process(content: str, processed_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for LaTeX note conversion."""
    logger.info("Processing notes for LaTeX conversion...")
    
    # Process note-box blocks
    processed_content, note_count = process_note_blocks(content)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "notes.tex"
        with open(debug_path, 'w', encoding='utf-8', errors='replace') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "notes_processed": note_count
    }
    
    logger.info(f"Note processing complete - {note_count} notes converted")
    
    return processed_content, stats
