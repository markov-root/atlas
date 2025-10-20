# File: scripts/latex/definition.py
import re
import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("latex.definition")

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
        
        definition_count = len([entry for entry in registry.get('media_registry', []) if entry['type'] == 'definition'])
        logger.info(f"Loaded media registry with {definition_count} definition entries")
        return registry
    except Exception as e:
        logger.error(f"Error loading media registry: {e}")
        return {}

def create_definition_lookup(media_registry: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Create a lookup dictionary for definitions by term.
    
    Args:
        media_registry: Media registry data
        
    Returns:
        dict: Mapping of definition terms to definition data
    """
    definition_lookup = {}
    
    for entry in media_registry.get("media_registry", []):
        if entry["type"] == "definition":
            # Use term as the key for lookup
            term = entry["term"]
            definition_lookup[term] = entry
    
    logger.info(f"Created definition lookup with {len(definition_lookup)} entries")
    return definition_lookup

def escape_latex_chars(text: str) -> str:
    """Escape special LaTeX characters in text."""
    if not text:
        return text
    
    # Escape common special characters
    text = text.replace('_', '\\_')
    text = text.replace('#', '\\#') 
    text = text.replace('%', '\\%')
    text = text.replace('&', '\\&')
    text = text.replace('$', '\\$')  # Fixed: was ', '\\'
    # text = text.replace('{', '\\{')
    # text = text.replace('}', '\\}')
    
    return text

def process_hyperlinks_in_content(content: str) -> str:
    """Process markdown links in definition content to LaTeX hyperref format."""
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

def process_definition_blocks(content: str, processed_dir: Path) -> Tuple[str, int]:
    """Process definition blocks and convert to customDefinition commands with registry numbering."""
    
    # Load media registry
    media_registry = load_media_registry(processed_dir)
    definition_lookup = create_definition_lookup(media_registry)
    
    definition_count = 0
    
    # Pattern to match definition blocks with optional nested tags
    definition_pattern = r'<definition>\s*(.*?)\s*</definition>'
    
    def replace_definition(match):
        nonlocal definition_count
        definition_count += 1
        
        block_content = match.group(1).strip()
        
        logger.debug(f"Processing definition #{definition_count}")
        logger.debug(f"  Block content: {block_content[:100]}...")
        
        # Extract term (required)
        term_match = re.search(r'<term>\s*(.*?)(?:\s*<(?:source|content)|$)', block_content, re.DOTALL)
        term = term_match.group(1).strip() if term_match else "Unknown Term"
        
        # Extract source (optional)
        source_match = re.search(r'<source>\s*(.*?)(?:\s*<(?:term|content)|$)', block_content, re.DOTALL)
        source = source_match.group(1).strip() if source_match else ""
        
        # Extract content (required)
        content_match = re.search(r'<content>\s*(.*?)\s*(?:</content>|$)', block_content, re.DOTALL)
        definition_content = content_match.group(1).strip() if content_match else "No definition provided"
        
        logger.debug(f"  Term: {term}")
        logger.debug(f"  Source: {source}")
        logger.debug(f"  Content: {definition_content[:50]}...")
        
        # Look up definition data in registry
        definition_data = definition_lookup.get(term)
        
        if definition_data:
            definition_number = definition_data["number"]
            definition_label = definition_data["label"]
            logger.info(f"Found definition in registry (Definition {definition_label}): {term}")
        else:
            logger.warning(f"Definition not found in registry: {term}")
            definition_number = None
            definition_label = None
        
        # Clean up any remaining XML tags that might be in the content
        definition_content = re.sub(r'</?(?:term|source|content).*?>', '', definition_content)
        definition_content = definition_content.strip()
        
        # Process hyperlinks in content
        definition_content = process_hyperlinks_in_content(definition_content)
        
        # Escape special characters
        term_escaped = escape_latex_chars(term)
        source_escaped = escape_latex_chars(source)
        content_escaped = escape_latex_chars(definition_content)
        
        # Create customDefinition command with numbering if available
        if definition_number is not None and definition_label is not None:
            # Include number and label from registry
            latex_definition = f"\\customDefinition{{{term_escaped}}}{{{source_escaped}}}{{{content_escaped}}}{{{definition_number}}}{{{definition_label}}}"
            logger.info(f"Converted definition #{definition_count} with registry numbering (Definition {definition_label}): {term}")
        else:
            # Fallback without numbering
            latex_definition = f"\\customDefinition{{{term_escaped}}}{{{source_escaped}}}{{{content_escaped}}}{{}}{{}}"
            logger.warning(f"Converted definition #{definition_count} without registry numbering: {term}")
        
        return latex_definition
    
    # Process all definition blocks
    processed_content = re.sub(definition_pattern, replace_definition, content, flags=re.DOTALL)
    
    return processed_content, definition_count

def process(content: str, processed_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for LaTeX definition conversion with media registry numbering.
    
    Args:
        content: The markdown content to process
        processed_dir: Base processed directory for loading media registry
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Processing definitions for LaTeX conversion with media registry numbering...")
    
    # Process definition blocks with registry numbering
    processed_content, definition_count = process_definition_blocks(content, processed_dir)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "definitions.tex"
        with open(debug_path, 'w', encoding='utf-8', errors='replace') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "definitions_processed": definition_count
    }
    
    logger.info(f"Definition processing complete - {definition_count} definitions converted with registry numbering")
    
    return processed_content, stats
