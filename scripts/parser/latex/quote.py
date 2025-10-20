# File: scripts/latex/quote.py
import re
import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("latex.quote")

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
        
        quote_count = len([entry for entry in registry.get('media_registry', []) if entry['type'] == 'quote'])
        logger.info(f"Loaded media registry with {quote_count} quote entries")
        return registry
    except Exception as e:
        logger.error(f"Error loading media registry: {e}")
        return {}

def create_quote_lookup(media_registry: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Create a lookup dictionary for quotes by speaker and content.
    
    Args:
        media_registry: Media registry data
        
    Returns:
        dict: Mapping of quote identifiers to quote data
    """
    quote_lookup = {}
    
    for entry in media_registry.get("media_registry", []):
        if entry["type"] == "quote":
            # Create lookup key from speaker + first 50 chars of content for uniqueness
            speaker = entry.get("speaker", "")
            content_preview = entry.get("content", "")[:50]
            lookup_key = f"{speaker}:{content_preview}"
            quote_lookup[lookup_key] = entry
    
    logger.info(f"Created quote lookup with {len(quote_lookup)} entries")
    return quote_lookup

def escape_latex_chars(text: str) -> str:
    """Escape special LaTeX characters in text."""
    if not text:
        return text
    
    # Escape common special characters
    text = text.replace('_', '\\_')
    text = text.replace('#', '\\#') 
    text = text.replace('%', '\\%')
    text = text.replace('&', '\\&')
    text = text.replace('$', '\\$')
    # text = text.replace('{', '\\{')
    # text = text.replace('}', '\\}')
    # DO NOT escape { and } - they're needed for \href and other LaTeX commands   
    return text

def process_hyperlinks_in_content(content: str) -> str:
    """Process markdown links in quote content to LaTeX hyperref format."""
    # Pattern for markdown links: [text](url)
    link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    
    def convert_link(match):
        link_text = match.group(1)
        url = match.group(2)
        
        # Skip image paths
        if url.startswith('Images/'):
            return match.group(0)
        
        # Create LaTeX hyperref
        return f'\\href{{{url}}}{{{link_text}}}'
    
    return re.sub(link_pattern, convert_link, content)

def process_quote_blocks(content: str, processed_dir: Path) -> Tuple[str, int]:
    """Process quote blocks and convert to customQuote commands with registry numbering."""
    
    # Load media registry
    media_registry = load_media_registry(processed_dir)
    quote_lookup = create_quote_lookup(media_registry)
    
    quote_count = 0
    
    # Pattern to match quote blocks with optional nested tags
    quote_pattern = r'<quote>\s*(.*?)\s*</quote>'
    
    def replace_quote(match):
        nonlocal quote_count
        quote_count += 1
        
        block_content = match.group(1).strip()
        
        logger.debug(f"Processing quote #{quote_count}")
        logger.debug(f"  Block content: {block_content[:100]}...")
        
        # Extract speaker (optional)
        speaker_match = re.search(r'<speaker>\s*(.*?)(?:\s*<(?:position|date|source|content)|$)', block_content, re.DOTALL)
        speaker = speaker_match.group(1).strip() if speaker_match else ""
        
        # Extract position (optional)
        position_match = re.search(r'<position>\s*(.*?)(?:\s*<(?:speaker|date|source|content)|$)', block_content, re.DOTALL)
        position = position_match.group(1).strip() if position_match else ""
        
        # Extract date/year (optional)
        date_match = re.search(r'<date>\s*(.*?)(?:\s*<(?:speaker|position|source|content)|$)', block_content, re.DOTALL)
        date_year = date_match.group(1).strip() if date_match else ""
        
        # Extract source (optional)
        source_match = re.search(r'<source>\s*(.*?)(?:\s*<(?:speaker|position|date|content)|$)', block_content, re.DOTALL)
        source = source_match.group(1).strip() if source_match else ""
        
        # Extract content (required)
        content_match = re.search(r'<content>\s*(.*?)\s*(?:</content>|$)', block_content, re.DOTALL)
        quote_content = content_match.group(1).strip() if content_match else "No quote content provided"
        
        logger.debug(f"  Speaker: {speaker}")
        logger.debug(f"  Position: {position}")
        logger.debug(f"  Date: {date_year}")
        logger.debug(f"  Source: {source}")
        logger.debug(f"  Content: {quote_content[:50]}...")
        
        # Look up quote data in registry (optional - quotes might not be in registry)
        lookup_key = f"{speaker}:{quote_content[:50]}"
        quote_data = quote_lookup.get(lookup_key)
        
        if quote_data:
            quote_number = quote_data["number"]
            quote_label = quote_data["label"]
            logger.info(f"Found quote in registry (Quote {quote_label}): {speaker}")
        else:
            logger.debug(f"Quote not found in registry (this is normal): {speaker}")
            quote_number = None
            quote_label = None
        
        # Clean up any remaining XML tags that might be in the content
        quote_content = re.sub(r'</?(?:speaker|position|date|source|content).*?>', '', quote_content)
        quote_content = quote_content.strip()
        
        # Process hyperlinks in content
        quote_content = process_hyperlinks_in_content(quote_content)
        
        # Escape special characters
        speaker_escaped = escape_latex_chars(speaker)
        position_escaped = escape_latex_chars(position)
        date_escaped = escape_latex_chars(date_year)
        source_escaped = escape_latex_chars(source)
        content_escaped = escape_latex_chars(quote_content)
        
        # Create customQuote command: \customQuote{speaker}{position}{year}{source}{content}
        latex_quote = f"\\customQuote{{{speaker_escaped}}}{{{position_escaped}}}{{{date_escaped}}}{{{source_escaped}}}{{{content_escaped}}}"
        
        if quote_data:
            logger.info(f"Converted quote #{quote_count} with registry data (Quote {quote_label}): {speaker}")
        else:
            logger.info(f"Converted quote #{quote_count} without registry data: {speaker}")
        
        return latex_quote
    
    # Process all quote blocks
    processed_content = re.sub(quote_pattern, replace_quote, content, flags=re.DOTALL)
    
    return processed_content, quote_count

def process(content: str, processed_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for LaTeX quote conversion with optional media registry support.
    
    Args:
        content: The markdown content to process
        processed_dir: Base processed directory for loading media registry
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Processing quotes for LaTeX conversion...")
    
    # Process quote blocks with optional registry support
    processed_content, quote_count = process_quote_blocks(content, processed_dir)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "quotes.tex"
        with open(debug_path, 'w', encoding='utf-8', errors='replace') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "quotes_processed": quote_count
    }
    
    logger.info(f"Quote processing complete - {quote_count} quotes converted")
    
    return processed_content, stats
