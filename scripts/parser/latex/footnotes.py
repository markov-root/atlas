# File: scripts/latex/footnotes.py
import re
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("latex.footnotes")

def process_footnotes(content: str) -> Tuple[str, int]:
    """Process mkdocs-style footnotes into LaTeX footnotes.
    
    Converts markdown-style footnotes to LaTeX footnotes.
    Instead of using \footnotemark and \footnotetext separately, 
    directly uses \footnote{} for better numbering and linking.
    
    Handles:
    - Inline markers: [^footnote_name]
    - Footnote text: [^footnote_name]: The footnote text
    
    Returns content with LaTeX \footnote commands.
    """
    # First collect all footnote definitions
    footnote_defs = {}
    text_pattern = r'\[\^([^\]]+)\]:\s*(.*?)(?=\n\n|\n\[|\Z)'
    
    footnote_count = 0
    
    # Extract all footnote definitions
    for match in re.finditer(text_pattern, content, flags=re.DOTALL):
        footnote_name = match.group(1)
        footnote_text = match.group(2).strip()
        footnote_defs[footnote_name] = footnote_text
        footnote_count += 1
        logger.debug(f"Found footnote definition [{footnote_name}]: {footnote_text[:50]}...")
    
    # Then replace footnote references with \footnote commands
    def replace_footnote_reference(match):
        footnote_name = match.group(1)
        if footnote_name in footnote_defs:
            footnote_text = footnote_defs[footnote_name]
            # Escape special LaTeX characters in footnote text
            footnote_text = footnote_text.replace('&', '\\&').replace('%', '\\%').replace('_', '\\_')
            return f'\\footnote{{{footnote_text}}}'
        else:
            # If no definition found, just return a generic footnote
            logger.warning(f"Missing footnote definition for: {footnote_name}")
            return f'\\footnote{{Missing footnote definition for {footnote_name}}}'
    
    # Find and replace footnote references
    marker_pattern = r'\[\^([^\]]+)\](?!:)'
    processed_content = re.sub(marker_pattern, replace_footnote_reference, content)
    
    # Remove the original footnote definitions
    processed_content = re.sub(text_pattern, '', processed_content, flags=re.DOTALL)
    
    # Clean up any extra newlines created
    processed_content = re.sub(r'\n{3,}', '\n\n', processed_content)
    
    return processed_content, footnote_count

def process(content: str, processed_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for LaTeX footnote conversion.
    
    Args:
        content: The markdown content to process
        processed_dir: Base processed directory (not used in this module)
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Processing footnotes for LaTeX conversion...")
    
    # Process footnotes
    processed_content, footnote_count = process_footnotes(content)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "footnotes.tex"
        with open(debug_path, 'w', encoding='utf-8', errors='replace') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "footnotes_processed": footnote_count
    }
    
    logger.info(f"Footnote processing complete - {footnote_count} footnotes converted")
    
    return processed_content, stats
