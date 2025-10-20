# File: scripts/tts/quote.py
import re
import logging
import random
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("tts.quote")

# Variety of quote introductions
QUOTE_INTROS = [
    "Here is a quote",
    "According to a quote",
    "As stated in a quote", 
    "In the words of a quote",
    "A quote says",
    "One quote states",
    "As mentioned in a quote"
]

def convert_react_quote_components(content: str) -> Tuple[str, int]:
    """Convert React Quote components to readable TTS format.
    
    Handles React components like:
    <Quote speaker="CAIS" position="Statement on AI Risk" date="2023" source="([CAIS, 2023](link))">
    Mitigating the risk of extinction from AI should be a global priority...
    </Quote>
    """
    quotes_converted = 0
    
    # Pattern to match React Quote components (multiline, with attributes)
    # This handles both self-closing and container Quote components
    quote_pattern = r'<Quote\s+([^>]*?)>\s*(.*?)\s*</Quote>'
    
    def convert_quote(match):
        nonlocal quotes_converted
        quotes_converted += 1
        
        attributes_str = match.group(1)
        quote_content = match.group(2).strip()
        
        # Parse attributes from the component
        attributes = parse_quote_attributes(attributes_str)
        
        speaker = attributes.get('speaker', '').strip()
        position = attributes.get('position', '').strip()
        date = attributes.get('date', '').strip()
        source = attributes.get('source', '').strip()
        
        logger.debug(f"Converting React quote #{quotes_converted} by: {speaker}")
        logger.debug(f"  Position: {position}")
        logger.debug(f"  Date: {date}")
        logger.debug(f"  Content preview: {quote_content[:50]}...")
        
        # Build the readable format with variation
        quote_intro = random.choice(QUOTE_INTROS)
        
        if speaker:
            quote_intro += f" by {speaker}"
            if position:
                quote_intro += f", who is {position}" if not position.startswith(speaker) else f", {position}"
        elif position:
            quote_intro += f" from {position}"
        
        if date:
            quote_intro += f" in {date}"
        
        quote_intro += " - "
        
        # Clean up the quote content - remove any remaining markdown links
        clean_content = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', quote_content)
        clean_content = clean_content.strip()
        
        # Format the final quote
        readable_quote = f'{quote_intro}"{clean_content}"'
        
        logger.debug(f"  Converted to: {readable_quote[:100]}...")
        
        return readable_quote
    
    # Process all React Quote components
    processed_content = re.sub(quote_pattern, convert_quote, content, flags=re.DOTALL)
    
    return processed_content, quotes_converted

def parse_quote_attributes(attributes_str):
    """Parse React component attributes from a string.
    
    Args:
        attributes_str: String containing React component attributes
        
    Returns:
        dict: Parsed attributes
    """
    attributes = {}
    
    # Pattern to match attribute="value" pairs, handling quotes and nested content
    # This handles: speaker="John Doe" position="CEO" source="([Link](url))"
    attr_pattern = r'(\w+)="([^"]*(?:\\.[^"]*)*)"'
    
    for match in re.finditer(attr_pattern, attributes_str):
        attr_name = match.group(1)
        attr_value = match.group(2)
        
        # Unescape any escaped quotes in the value
        attr_value = attr_value.replace('\\"', '"')
        
        attributes[attr_name] = attr_value
    
    return attributes

def process(content: str, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for TTS quote conversion.
    
    Args:
        content: The markdown content with React Quote components
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Converting React Quote components for TTS format...")
    
    # Convert React Quote components to readable format
    processed_content, quotes_converted = convert_react_quote_components(content)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "quote_conversion.md"
        with open(debug_path, 'w', encoding='utf-8') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "quotes_converted": quotes_converted
    }
    
    if quotes_converted > 0:
        logger.info(f"Quote conversion complete - {quotes_converted} React Quote components converted to readable format")
    else:
        logger.info("No React Quote components found to convert")
    
    return processed_content, stats
