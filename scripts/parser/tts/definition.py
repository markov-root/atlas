# File: scripts/tts/definition.py
import re
import logging
import random
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("tts.definition")

# Variety of definition introductions
DEFINITION_INTROS = [
    "Here is our definition of",
    "Let's define",
    "We define", 
    "Our definition of",
    "The definition of",
    "For our purposes, we define",
    "According to our definition,",
    "Let me define"
]

def convert_react_definition_components(content: str) -> Tuple[str, int]:
    """Convert React Definition components to readable TTS format.
    
    Handles React components like:
    <Definition term="Existential Risks (x-risks)" source="([Conn, 2015](https://futureoflife.org/existential-risk/existential-risk/))" number="1" label="2.1">
    An existential risk is any risk that has the potential to eliminate all of humanity...
    </Definition>
    """
    definitions_converted = 0
    
    # Pattern to match React Definition components (multiline, with attributes)
    definition_pattern = r'<Definition\s+([^>]*?)>\s*(.*?)\s*</Definition>'
    
    def convert_definition(match):
        nonlocal definitions_converted
        definitions_converted += 1
        
        attributes_str = match.group(1)
        definition_content = match.group(2).strip()
        
        # Parse attributes from the component
        attributes = parse_definition_attributes(attributes_str)
        
        term = attributes.get('term', '').strip()
        source = attributes.get('source', '').strip()
        number = attributes.get('number', '').strip()
        label = attributes.get('label', '').strip()
        
        logger.debug(f"Converting React definition #{definitions_converted}: {term}")
        logger.debug(f"  Source: {source}")
        logger.debug(f"  Number/Label: {number}/{label}")
        logger.debug(f"  Content preview: {definition_content[:50]}...")
        
        if not definition_content:
            logger.warning(f"No content found for definition: {term}")
            return match.group(0)  # Return original if can't parse
        
        # Clean up the definition content - remove hyperlinks
        clean_content = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', definition_content)
        clean_content = clean_content.strip()
        
        # Build the readable format with variation
        definition_intro = random.choice(DEFINITION_INTROS)
        
        if definition_intro.endswith(','):
            # For "According to our definition," we need different structure
            readable_definition = f"{definition_intro} {term} is {clean_content}"
        else:
            # For "Here is our definition of" we use " - "
            readable_definition = f"{definition_intro} {term} - {clean_content}"
        
        logger.debug(f"  Converted to: {readable_definition[:100]}...")
        
        return readable_definition
    
    # Process all React Definition components
    processed_content = re.sub(definition_pattern, convert_definition, content, flags=re.DOTALL)
    
    return processed_content, definitions_converted

def parse_definition_attributes(attributes_str):
    """Parse React Definition component attributes from a string.
    
    Args:
        attributes_str: String containing React component attributes
        
    Returns:
        dict: Parsed attributes
    """
    attributes = {}
    
    # Pattern to match attribute="value" pairs, handling quotes and nested content
    # This handles complex cases like: source="([Conn, 2015](https://futureoflife.org/...))"
    attr_pattern = r'(\w+)="([^"]*(?:\\.[^"]*)*)"'
    
    for match in re.finditer(attr_pattern, attributes_str):
        attr_name = match.group(1)
        attr_value = match.group(2)
        
        # Unescape any escaped quotes in the value
        attr_value = attr_value.replace('\\"', '"')
        
        attributes[attr_name] = attr_value
    
    return attributes

def process(content: str, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for TTS definition conversion.
    
    Args:
        content: The markdown content with React Definition components
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Converting React Definition components for TTS format...")
    
    # Convert React Definition components to readable format
    processed_content, definitions_converted = convert_react_definition_components(content)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "definition_conversion.md"
        with open(debug_path, 'w', encoding='utf-8') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "definitions_converted": definitions_converted
    }
    
    if definitions_converted > 0:
        logger.info(f"Definition conversion complete - {definitions_converted} React Definition components converted to readable format")
    else:
        logger.info("No React Definition components found to convert")
    
    return processed_content, stats
