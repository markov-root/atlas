# scripts/docusaurus/definition.py
import logging
import re
import json
from pathlib import Path
from .component import register_component

def load_media_registry(processed_dir):
    """Load media registry from preprocessed directory.
    
    Args:
        processed_dir: Base processed directory
        
    Returns:
        dict: Media registry data, or empty dict if not found
    """
    logger = logging.getLogger("docusaurus.component.definition")
    
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

def create_definition_lookup(media_registry):
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
    
    return definition_lookup

@register_component('definition')
def process_definition(content, processed_dir=None):
    """Process definition components in content using media registry for numbering.
    
    Args:
        content: Content to process
        processed_dir: Base processed directory for loading media registry
        
    Returns:
        tuple: (processed_content, imports_list)
    """
    logger = logging.getLogger("docusaurus.component.definition")
    
    # Load media registry
    media_registry = load_media_registry(processed_dir)
    definition_lookup = create_definition_lookup(media_registry)
    logger.info(f"Created definition lookup with {len(definition_lookup)} entries")
    
    # Track what we process
    definition_count = 0
    
    # Regular expression for definition pattern with term and content
    # Note: <term> and <source> don't have closing tags, but <content> does
    definition_pattern = r'<definition>\s*' + \
                         r'(?:<term>\s*(.*?)\s*(?=<source>|<content>))?\s*' + \
                         r'(?:<source>\s*(.*?)\s*(?=<content>))?\s*' + \
                         r'<content>\s*(.*?)\s*</content>' + \
                         r'\s*</definition>'
    
    # Also match simplified format with no tags inside (just raw text)
    simple_definition_pattern = r'<definition>\s*(.*?)\s*</definition>'
    
    # Import Definition component
    imports = ['import Definition from "@site/src/components/chapters/Definition";']
    
    def replace_definition(match):
        nonlocal definition_count
        definition_count += 1
        
        term = match.group(1) or "Term"
        source = match.group(2) or ""
        content = match.group(3) or ""
        
        # Properly escape quotes in attributes to prevent JSX syntax errors
        term = term.replace('"', '\\"')
        source = source.replace('"', '\\"')
        
        logger.info(f"Processing definition #{definition_count} of term: {term}")
        
        # Look up definition data in registry
        definition_data = definition_lookup.get(term)
        
        if definition_data:
            definition_number = definition_data["number"]
            definition_label = definition_data["label"]
            logger.info(f"Found definition in registry (Definition {definition_label}): {term}")
            
            # Create the Definition component with registry data
            return f'<Definition term="{term}" source="{source}" number="{definition_number}" label="{definition_label}">\n\n{content}\n\n</Definition>'
        else:
            logger.warning(f"Definition not found in registry: {term}")
            # Fallback without numbering
            return f'<Definition term="{term}" source="{source}">\n\n{content}\n\n</Definition>'
    
    # Replace definitions with structured tags
    processed_content = re.sub(definition_pattern, replace_definition, content, flags=re.DOTALL)
    
    # Process simple definitions without inner tags
    def replace_simple_definition(match):
        nonlocal definition_count
        definition_count += 1
        
        # For simple definitions, we'll just use a default term and the whole content
        content = match.group(1).strip()
        logger.info(f"Processing simple definition #{definition_count}")
        
        # For simple definitions, we can't easily look up in registry since we don't have a clear term
        # So we'll just use default numbering or skip registry lookup
        return f'<Definition term="Definition" source="">\n\n{content}\n\n</Definition>'
    
    # Apply second pattern only if the first one didn't match all instances
    if '<definition>' in processed_content:
        processed_content = re.sub(simple_definition_pattern, replace_simple_definition, processed_content, flags=re.DOTALL)
    
    # Log results
    if definition_count > 0:
        logger.info(f"Processed {definition_count} definition(s) into Definition components")
    else:
        logger.info("No definitions found to process")
    
    return processed_content, imports
