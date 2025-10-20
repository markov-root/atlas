# File: scripts/latex/typography.py
import re
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("latex.typography")

def protect_math_environments(content: str) -> Tuple[str, Dict[str, str]]:
    """Temporarily replace math environments with placeholders to protect them during typography processing."""
    
    math_placeholders = {}
    placeholder_counter = 0
    
    # Protect display math $$...$$
    def replace_display_math(match):
        nonlocal placeholder_counter
        placeholder = f"__MATH_DISPLAY_{placeholder_counter}__"
        math_placeholders[placeholder] = match.group(0)
        placeholder_counter += 1
        return placeholder
    
    content = re.sub(r'\$\$.*?\$\$', replace_display_math, content, flags=re.DOTALL)
    
    # Protect inline math $...$
    def replace_inline_math(match):
        nonlocal placeholder_counter
        placeholder = f"__MATH_INLINE_{placeholder_counter}__"
        math_placeholders[placeholder] = match.group(0)
        placeholder_counter += 1
        return placeholder
    
    content = re.sub(r'(?<!\$)\$[^$\n]+?\$(?!\$)', replace_inline_math, content)
    
    # Protect existing LaTeX equation environments
    equation_patterns = [
        r'\\begin\{equation\*?\}.*?\\end\{equation\*?\}',
        r'\\begin\{align\*?\}.*?\\end\{align\*?\}',
        r'\\begin\{eqnarray\*?\}.*?\\end\{eqnarray\*?\}',
    ]
    
    for pattern in equation_patterns:
        def replace_equation_env(match):
            nonlocal placeholder_counter
            placeholder = f"__MATH_ENV_{placeholder_counter}__"
            math_placeholders[placeholder] = match.group(0)
            placeholder_counter += 1
            return placeholder
        
        content = re.sub(pattern, replace_equation_env, content, flags=re.DOTALL)
    
    logger.debug(f"Protected {len(math_placeholders)} math environments during typography processing")
    
    return content, math_placeholders

def restore_math_environments(content: str, math_placeholders: Dict[str, str]) -> str:
    """Restore protected math environments after typography processing."""
    
    for placeholder, original in math_placeholders.items():
        content = content.replace(placeholder, original)
    
    logger.debug(f"Restored {len(math_placeholders)} math environments after typography processing")
    
    return content

def process_inline_formatting(content: str) -> Tuple[str, int]:
    """Process bold and italic text while avoiding math environments."""
    formatting_count = 0
    
    def replace_bold(match: re.Match) -> str:
        nonlocal formatting_count
        formatting_count += 1
        text = match.group(1)
        
        # Check if this text contains math placeholders - if so, don't format
        if '__MATH_' in text:
            logger.debug(f"Skipping bold formatting for text containing math: {text[:30]}...")
            return match.group(0)  # Return original
        
        # Don't add extra backslash to already-escaped ampersands
        text = text.replace('\\&', '\\&')  # Keep as is
        logger.debug(f"Converting bold text: **{text}** -> \\textbf{{{text}}}")
        return f'\\textbf{{{text}}}'
    
    def replace_italic(match: re.Match) -> str:
        nonlocal formatting_count
        formatting_count += 1
        text = match.group(1)
        
        # Check if this text contains math placeholders - if so, don't format
        if '__MATH_' in text:
            logger.debug(f"Skipping italic formatting for text containing math: {text[:30]}...")
            return match.group(0)  # Return original
        
        # Don't add extra backslash to already-escaped ampersands
        text = text.replace('\\&', '\\&')  # Keep as is
        logger.debug(f"Converting italic text: *{text}* -> \\textit{{{text}}}")
        return f'\\textit{{{text}}}'
    
    # Process bold first (**text**)
    content = re.sub(r'\*\*([^*]+?)\*\*', replace_bold, content)
    
    # Then italic (*text*) - but be more careful to avoid conflicts
    # Use negative lookbehind/lookahead to avoid matching ** patterns
    content = re.sub(r'(?<!\*)\*([^*\n]+?)\*(?!\*)', replace_italic, content)
    
    return content, formatting_count

def fix_spacing(content: str) -> Tuple[str, int]:
    """Fix paragraph spacing and line breaks."""
    spacing_fixes = 0
    
    # Add blank line before sections
    before_sections = len(re.findall(r'(\\(?:sub)*section{[^}]+})', content))
    content = re.sub(r'(\\(?:sub)*section{[^}]+})', r'\n\n\1', content)
    
    # Ensure blank line after sections
    content = re.sub(r'(\\(?:sub)*section{[^}]+})\n(?!\n)', r'\1\n\n', content)
    
    # Convert single newlines to spaces within paragraphs
    single_newlines = len(re.findall(r'([^\n])\n([^\n])', content))
    content = re.sub(r'([^\n])\n([^\n])', r'\1 \2', content)
    
    # Clean up multiple newlines
    multiple_newlines = len(re.findall(r'\n{3,}', content))
    content = re.sub(r'\n{3,}', r'\n\n', content)
    
    spacing_fixes = before_sections + single_newlines + multiple_newlines
    
    if spacing_fixes > 0:
        logger.debug(f"Fixed {spacing_fixes} spacing issues")
    
    return content, spacing_fixes

def process(content: str, processed_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for LaTeX typography conversion.
    
    Args:
        content: The markdown content to process
        processed_dir: Base processed directory (not used in this module)
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Processing typography for LaTeX conversion...")
    
    # STEP 1: Protect all math environments before processing
    content, math_placeholders = protect_math_environments(content)
    
    # STEP 2: Process inline formatting (now safe from math interference)
    content, formatting_count = process_inline_formatting(content)
    
    # STEP 3: Fix spacing
    content, spacing_fixes = fix_spacing(content)
    
    # STEP 4: Restore protected math environments
    content = restore_math_environments(content, math_placeholders)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "typography.tex"
        with open(debug_path, 'w', encoding='utf-8', errors='replace') as f:
            f.write(content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "formatting_conversions": formatting_count,
        "spacing_fixes": spacing_fixes,
        "math_environments_protected": len(math_placeholders)
    }
    
    logger.info(f"Typography processing complete - {formatting_count} formatting conversions, {spacing_fixes} spacing fixes, {len(math_placeholders)} math environments protected")
    
    return content, stats
