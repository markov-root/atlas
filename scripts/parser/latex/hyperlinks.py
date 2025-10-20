# File: scripts/latex/hyperlinks.py
import re
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("latex.hyperlinks")

def process_hyperlinks(content: str, in_caption: bool = False) -> Tuple[str, int]:
    """Convert markdown links to LaTeX href commands.
    
    Args:
        content: The text content to process
        in_caption: Whether this content is being processed inside a caption environment
        
    Returns:
        Tuple of (processed_content, links_processed_count)
    """
    links_processed = 0
    
    def convert_link(match: re.Match, is_citation: bool = False) -> str:
        nonlocal links_processed
        links_processed += 1
        
        text = match.group(1)
        url = match.group(2)
        
        logger.debug(f"Processing link #{links_processed}: '{text}' -> {url}")
        
        # Skip image paths
        if url.startswith('Images/'):
            logger.debug(f"  Skipping image path: {url}")
            return match.group(0)
        
        # Escape special characters in URL for caption environment
        if in_caption:
            url = url.replace('_', '\\_').replace('#', '\\#').replace('%', '\\%')
            # Use url package's \url command for better URL handling in captions
            href = f'\\protect\\href{{{url}}}{{{text}}}'
            logger.debug(f"  Created protected href for caption: {href}")
        else:
            href = f'\\href{{{url}}}{{{text}}}'
            logger.debug(f"  Created href: {href}")
        
        # Add parentheses only if this is a citation style link
        # (matched from the first pattern which includes surrounding parentheses)
        if is_citation:
            return f'({href})'
        return href
    
    # First pattern: ([text](url)) - citation style with parentheses
    content = re.sub(
        r'\(\[([^\]]+)\]\(([^)]+)\)\)',
        lambda m: convert_link(m, is_citation=True),
        content
    )
    
    # Second pattern: [text](url) but not ![text](url) - regular links
    content = re.sub(
        r'(?<!\!)\[([^\]]+)\]\(([^)]+)\)',
        lambda m: convert_link(m, is_citation=False),
        content
    )
    
    return content, links_processed

def process(content: str, processed_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for LaTeX hyperlink conversion.
    
    Args:
        content: The markdown content to process
        processed_dir: Base processed directory (not used in this module)
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Processing hyperlinks for LaTeX conversion...")
    
    # Process hyperlinks (not in caption mode for main content)
    processed_content, links_count = process_hyperlinks(content, in_caption=False)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "hyperlinks.tex"
        with open(debug_path, 'w', encoding='utf-8', errors='replace') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "hyperlinks_processed": links_count
    }
    
    logger.info(f"Hyperlink processing complete - {links_count} links converted")
    
    return processed_content, stats
