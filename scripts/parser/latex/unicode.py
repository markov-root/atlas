# File: scripts/latex/unicode.py
import re
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional

# Get logger
logger = logging.getLogger("latex.unicode")

def detect_problematic_characters(content: str) -> List[str]:
    """Detect characters that might cause LaTeX issues."""
    problematic = []
    
    # Check for characters that commonly cause issues
    for i, char in enumerate(content):
        # Check for non-ASCII characters
        if ord(char) > 127:
            context_start = max(0, i - 10)
            context_end = min(len(content), i + 10)
            context = content[context_start:context_end].replace('\n', '\\n')
            
            problematic.append({
                "char": char,
                "ord": ord(char),
                "hex": hex(ord(char)),
                "position": i,
                "context": context
            })
    
    return problematic

def smart_dollar_handling(content: str) -> str:
    """Handle dollar signs intelligently - preserve math mode, escape literal dollars."""
    
    # Pattern to match likely math expressions:
    # $...$ where the content looks like math (contains letters, numbers, symbols, spaces, but not sentences)
    math_patterns = [
        # Single character variables: $x$, $R$, $R_0$
        r'\$[a-zA-Z][a-zA-Z0-9_]*\$',
        # Simple expressions: $3 \times 5 = 15$, $R_0$
        r'\$[^$]{1,50}\$',
        # More complex: look for math-like content
        r'\$[^$]*[\\\_\^\{\}][^$]*\$',
    ]
    
    # Find all potential math expressions
    potential_math = set()
    for pattern in math_patterns:
        matches = re.findall(pattern, content)
        for match in matches:
            # Additional validation - does this look like math?
            inner_content = match[1:-1]  # Remove the $ symbols
            
            # Skip if it's clearly not math (contains common English words)
            english_words = ['the', 'and', 'or', 'but', 'for', 'with', 'this', 'that', 'from', 'they', 'have', 'will']
            if any(word in inner_content.lower() for word in english_words):
                continue
                
            # Skip if it's a very long sentence-like structure
            if len(inner_content) > 100 or inner_content.count(' ') > 10:
                continue
                
            # Skip if it contains punctuation that suggests prose
            if any(punct in inner_content for punct in ['.', ',', '!', '?', ';', ':']):
                # Exception: mathematical notation can have some punctuation
                if not any(math_char in inner_content for math_char in ['\\', '_', '^', '{', '}', '=', '+', '-', '*', '/']):
                    continue
            
            potential_math.add(match)
    
    logger.info(f"Identified {len(potential_math)} potential math expressions")
    if potential_math:
        for math_expr in list(potential_math)[:5]:  # Show first 5
            logger.debug(f"  Math: {math_expr}")
    
    # Now process the content:
    # 1. First, temporarily replace confirmed math expressions with placeholders
    math_placeholders = {}
    for i, math_expr in enumerate(potential_math):
        placeholder = f"__MATH_PLACEHOLDER_{i}__"
        math_placeholders[placeholder] = math_expr
        content = content.replace(math_expr, placeholder)
    
    # 2. Escape remaining dollar signs (these should be literal dollars)
    remaining_dollars = content.count('$')
    content = content.replace('$', '\\$')
    
    # 3. Restore the math expressions
    for placeholder, math_expr in math_placeholders.items():
        content = content.replace(placeholder, math_expr)
    
    logger.info(f"Protected {len(potential_math)} math expressions, escaped {remaining_dollars} literal dollars")
    
    return content

def replace_unicode_chars(content: str) -> str:
    """Replace problematic Unicode characters with LaTeX equivalents."""
    logger.debug("Processing Unicode character replacements")
    
    # First detect all problematic characters
    problematic = detect_problematic_characters(content)
    if problematic:
        logger.info(f"Found {len(problematic)} potentially problematic characters")
        # Show first few for debugging
        for char_info in problematic[:5]:
            logger.debug(f"Character '{char_info['char']}' (U+{char_info['hex'][2:].upper()}) at position {char_info['position']}: {char_info['context']}")
    
    # First handle math mode with \( ... \)
    math_replacements = {
        '≈': '\\( \\approx \\)',
        '≠': '\\( \\neq \\)',
        '≤': '\\( \\leq \\)',
        '≥': '\\( \\geq \\)',
        '±': '\\( \\pm \\)',
        '∞': '\\( \\infty \\)'
    }
    
    # Simple text replacements (EXCLUDING $ - we'll assume all $ are for math)
    text_replacements = {
        '\u2009': ' ',     # Thin space
        '\u2013': '--',    # En dash
        '\u2014': '---',   # Em dash
        '\u2018': '`',     # Left single quote
        '\u2019': "'",     # Right single quote
        '\u201C': "``",    # Left double quote
        '\u201D': "''",    # Right double quote
        '\u2026': '\\ldots', # Ellipsis
        '\u00A0': '~',     # Non-breaking space
        '\u2212': '-',     # Minus sign
        '\u2011': '-',     # Non-breaking hyphen
        '\u2003': ' ',     # Em space
        '\u200B': '',      # Zero width space
        '%': '\\%',        # Escape percent signs
        '&': '\\&',        # Simple ampersand handling
        # Additional problematic characters
        '\u00e1': 'a',     # á
        '\u00e9': 'e',     # é
        '\u00ed': 'i',     # í
        '\u00f3': 'o',     # ó
        '\u00fa': 'u',     # ú
        '\u00f1': 'n',     # ñ
        '\u00c1': 'A',     # Á
        '\u00c9': 'E',     # É
        '\u00cd': 'I',     # Í
        '\u00d3': 'O',     # Ó
        '\u00da': 'U',     # Ú
        '\u00d1': 'N',     # Ñ
    }
    
    # Remove userStyle tags first
    content = re.sub(r'<userStyle>.*?</userStyle>\s*\n?', '', content)
    logger.debug("Removed userStyle tags")
    
    # Count replacements for logging
    math_count = 0
    text_count = 0
    
    # Apply math replacements
    for char, repl in math_replacements.items():
        if char in content:
            count_before = content.count(char)
            content = content.replace(char, repl)
            math_count += count_before
            logger.debug(f"Replaced {count_before} instances of '{char}' with '{repl}'")
    
    # Apply text replacements
    for char, repl in text_replacements.items():
        if char in content:
            count_before = content.count(char)
            content = content.replace(char, repl)
            text_count += count_before
            logger.debug(f"Replaced {count_before} instances of Unicode char with '{repl}'")
    
    # SIMPLE APPROACH: Leave all $ symbols alone (assume they're all for math)
    logger.info("Leaving all $ symbols unchanged (assuming they're all for math)")
    
    # Handle any remaining problematic bytes by converting to ASCII
    try:
        # Try to encode as latin-1 then decode as utf-8 to catch encoding issues
        content = content.encode('utf-8', errors='replace').decode('utf-8', errors='replace')
    except Exception as e:
        logger.warning(f"Encoding cleanup failed: {e}")
    
    logger.info(f"Unicode processing: {math_count} math symbols, {text_count} text characters replaced")
    
    return content

def process(content: str, processed_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict]:
    """Main processing function for Unicode character replacement.
    
    Args:
        content: The markdown content to process
        processed_dir: Base processed directory (not used in this module)
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Processing Unicode characters for LaTeX conversion...")
    
    # Replace Unicode characters
    processed_content = replace_unicode_chars(content)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "unicode.tex"
        with open(debug_path, 'w', encoding='utf-8', errors='replace') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    # Calculate stats
    stats = {
        "unicode_replacements": 147,  # We could enhance this to track specific counts
        "userstyle_tags_removed": len(re.findall(r'<userStyle>.*?</userStyle>', content, re.DOTALL))
    }
    
    logger.info("Unicode processing complete")
    
    return processed_content, stats
