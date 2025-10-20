# scripts/preprocess/whitespace.py
import re
import logging
import json
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger - use the same logger name pattern as other modules
logger = logging.getLogger("preprocess.whitespace")

def normalize_line_breaks(content: str) -> Tuple[str, int]:
    """
    Normalize line breaks to ensure consistent paragraph breaks.
    
    - Converts multiple consecutive line breaks (3+) into double line breaks
    - Removes trailing whitespace from lines
    """
    # Count original matches for reporting
    pattern = r'\n{3,}'
    matches = re.findall(pattern, content)
    count = len(matches)
    
    if count > 0:
        logger.debug(f"Found {count} instances of excessive line breaks")
    
    # Fix multiple newlines
    content = re.sub(pattern, '\n\n', content)
    
    # Fix trailing whitespace on lines
    content = re.sub(r'[ \t]+\n', '\n', content)
    
    return content, count

def fix_indentation(content: str) -> Tuple[str, int]:
    """
    Fix inconsistent indentation in lists and code blocks.
    
    - Ensures list items have consistent indentation
    - Fixes code block indentation
    """
    # Count inconsistent list indentation
    list_pattern = r'^([ \t]*)[*-+][ \t]+'
    list_matches = re.findall(list_pattern, content, re.MULTILINE)
    
    # Normalize list indentation (replace tabs with spaces where mixed)
    list_fixes = 0
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if re.match(list_pattern, line):
            # Standardize indentation for list items (replace tabs with spaces)
            if '\t' in line[:line.find('*')] or '\t' in line[:line.find('-')] or '\t' in line[:line.find('+')]:
                indent = line[:max(line.find('*'), line.find('-'), line.find('+'))]
                standardized_indent = ' ' * (len(indent.expandtabs(4)))
                list_marker = line[len(indent)]
                rest_of_line = line[len(indent) + 1:].lstrip()
                lines[i] = f"{standardized_indent}{list_marker} {rest_of_line}"
                list_fixes += 1
    
    # Fix code block indentation
    code_block_pattern = r'```[^\n]*\n(.*?)```'
    code_blocks = re.findall(code_block_pattern, content, re.DOTALL)
    code_fixes = 0
    
    # Process each code block
    for block in code_blocks:
        # Find common indentation
        block_lines = block.split('\n')
        non_empty_lines = [line for line in block_lines if line.strip()]
        if not non_empty_lines:
            continue
            
        # Find common leading whitespace
        indents = [len(line) - len(line.lstrip()) for line in non_empty_lines]
        common_indent = min(indents) if indents else 0
        
        if common_indent > 0:
            # Re-indent the code block
            new_block = '\n'.join([line[common_indent:] if line.strip() else '' for line in block_lines])
            content = content.replace(block, new_block)
            code_fixes += 1
            
    return content, list_fixes + code_fixes

def collapse_multiple_spaces(content: str) -> Tuple[str, int]:
    """
    Fix multiple consecutive spaces in text (not in code blocks).
    
    - Collapses multiple spaces to single space
    - Preserves spaces in code blocks
    """
    # First, protect code blocks 
    code_blocks = {}
    code_pattern = r'```[^\n]*\n(.*?)```'
    
    def replace_code(match):
        placeholder = f"__CODE_BLOCK_{len(code_blocks)}__"
        code_blocks[placeholder] = match.group(0)
        return placeholder
    
    protected = re.sub(code_pattern, replace_code, content, flags=re.DOTALL)
    
    # Count and fix multiple spaces (outside of code blocks)
    spaces_pattern = r'[ ]{2,}'
    space_matches = re.findall(spaces_pattern, protected)
    space_count = len(space_matches)
    
    # Fix multiple spaces
    fixed = re.sub(spaces_pattern, ' ', protected)
    
    # Restore code blocks
    for placeholder, code in code_blocks.items():
        fixed = fixed.replace(placeholder, code)
        
    return fixed, space_count

def process(content: str, output_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """
    Process content to fix whitespace issues.
    
    Args:
        content: The markdown content to process
        output_dir: Directory for output files
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    # Log start of processing
    logger.info("Processing whitespace issues...")
    
    # Keep track of changes for reporting
    stats = {
        "line_break_fixes": 0,
        "indentation_fixes": 0,
        "multiple_space_fixes": 0
    }
    
    # Fix line breaks
    content, line_break_count = normalize_line_breaks(content)
    stats["line_break_fixes"] = line_break_count
    
    # Fix indentation
    content, indent_count = fix_indentation(content)
    stats["indentation_fixes"] = indent_count
    
    # Fix multiple spaces
    content, space_count = collapse_multiple_spaces(content)
    stats["multiple_space_fixes"] = space_count
    
    # Log results
    total_fixes = sum(stats.values())
    if total_fixes > 0:
        logger.info(f"Fixed {total_fixes} whitespace issues:")
        if stats["line_break_fixes"] > 0:
            logger.info(f"  - {stats['line_break_fixes']} line break normalizations")
        if stats["indentation_fixes"] > 0:
            logger.info(f"  - {stats['indentation_fixes']} indentation fixes")
        if stats["multiple_space_fixes"] > 0:
            logger.info(f"  - {stats['multiple_space_fixes']} multiple space collapses")
    else:
        logger.info("No whitespace issues found")
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "whitespace_fixes.json"
        with open(debug_path, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2)
    
    logger.info("Whitespace processing complete")
    
    return content, stats
