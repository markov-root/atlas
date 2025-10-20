# File: scripts/latex/equations.py
import re
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any, List

# Get logger
logger = logging.getLogger("latex.equations")

def fix_malformed_equation_tags(content: str) -> Tuple[str, int]:
    """Fix any malformed equation tags that might exist in the content."""
    
    fixes = 0
    
    # Pattern 1: Fix \begin{equation\textit{}} ... \end{equation}}
    malformed_pattern1 = r'\\begin\{equation\\textit\{\}\s*(.*?)\s*\\end\{equation\}\}'
    
    def fix_malformed_equation(match):
        nonlocal fixes
        fixes += 1
        equation_content = match.group(1).strip()
        logger.debug(f"Fixing malformed equation #{fixes}: {equation_content[:50]}...")
        
        # Convert to proper equation* environment
        return f"\\begin{{equation*}}\n{equation_content}\n\\end{{equation*}}"
    
    content = re.sub(malformed_pattern1, fix_malformed_equation, content, flags=re.DOTALL)
    
    # Pattern 2: Fix any other malformed equation patterns
    malformed_pattern2 = r'\\begin\{equation[^}]*\}\s*(.*?)\s*\\end\{equation\}'
    
    def fix_other_malformed(match):
        nonlocal fixes
        equation_content = match.group(1).strip()
        
        # Skip if it's already a proper equation environment
        if not ('\\textit{' in match.group(0) or other_malformed_indicators(match.group(0))):
            return match.group(0)
        
        fixes += 1
        logger.debug(f"Fixing other malformed equation #{fixes}: {equation_content[:50]}...")
        
        # Convert to proper equation* environment
        return f"\\begin{{equation*}}\n{equation_content}\n\\end{{equation*}}"
    
    content = re.sub(malformed_pattern2, fix_other_malformed, content, flags=re.DOTALL)
    
    if fixes > 0:
        logger.info(f"Fixed {fixes} malformed equation tags")
    
    return content, fixes

def other_malformed_indicators(equation_text: str) -> bool:
    """Check if an equation environment has malformed indicators."""
    malformed_indicators = [
        '\\textit{',
        '\\end{equation}}',  # Double closing brace
        '\\begin{equation\\',  # Backslash in begin tag
    ]
    
    return any(indicator in equation_text for indicator in malformed_indicators)

def process_display_equations(content: str) -> Tuple[str, int]:
    """Process display equations ($$...$$) for LaTeX."""
    
    display_count = 0
    
    # Pattern for display equations: $$...$$
    display_pattern = r'\$\$([^$]+?)\$\$'
    
    def replace_display_equation(match):
        nonlocal display_count
        display_count += 1
        
        equation_content = match.group(1).strip()
        
        logger.debug(f"Processing display equation #{display_count}: {equation_content[:50]}...")
        
        # For LaTeX, use proper equation* environment for unnumbered equations
        latex_equation = f"\\begin{{equation*}}\n{equation_content}\n\\end{{equation*}}"
        
        return latex_equation
    
    # Process all display equations
    processed_content = re.sub(display_pattern, replace_display_equation, content, flags=re.DOTALL)
    
    return processed_content, display_count

def process_inline_equations(content: str) -> Tuple[str, int]:
    """Process inline equations ($...$) for LaTeX."""
    
    inline_count = 0
    
    # Pattern for inline equations: $...$ (but not $$)
    # We need to be careful not to match display equations
    inline_pattern = r'(?<!\$)\$([^$\n]+?)\$(?!\$)'
    
    def replace_inline_equation(match):
        nonlocal inline_count
        inline_count += 1
        
        equation_content = match.group(1).strip()
        
        logger.debug(f"Processing inline equation #{inline_count}: {equation_content}")
        
        # For LaTeX, inline math is just $...$, so we keep it as is
        # But we might want to clean up any problematic characters
        
        # Clean up common issues
        cleaned_content = equation_content
        
        # LaTeX inline math - keep the same format
        return f"${cleaned_content}$"
    
    # Process all inline equations
    processed_content = re.sub(inline_pattern, replace_inline_equation, content)
    
    return processed_content, inline_count

def process_equation_environments(content: str) -> Tuple[str, int]:
    """Process any existing LaTeX equation environments and clean them up."""
    
    env_count = 0
    
    # Look for existing equation environments that might need cleaning
    env_patterns = [
        (r'\\begin\{equation\}(.*?)\\end\{equation\}', 'equation'),
        (r'\\begin\{equation\*\}(.*?)\\end\{equation\*\}', 'equation*'),
        (r'\\begin\{align\}(.*?)\\end\{align\}', 'align'),
        (r'\\begin\{align\*\}(.*?)\\end\{align\*\}', 'align*')
    ]
    
    for pattern, env_name in env_patterns:
        def clean_environment(match):
            nonlocal env_count
            env_count += 1
            
            equation_content = match.group(1).strip()
            
            logger.debug(f"Cleaning existing {env_name} environment #{env_count}")
            
            # Return cleaned version
            return f"\\begin{{{env_name}}}\n{equation_content}\n\\end{{{env_name}}}"
        
        content = re.sub(pattern, clean_environment, content, flags=re.DOTALL)
    
    return content, env_count

def validate_math_syntax(content: str) -> List[str]:
    """Validate math syntax and report potential issues."""
    
    issues = []
    
    # Check for common problematic patterns
    
    # Unmatched dollar signs
    dollar_count = content.count('$')
    if dollar_count % 2 != 0:
        issues.append(f"Unmatched dollar signs found (total: {dollar_count})")
    
    # Look for backslashes that might need escaping in math mode
    problematic_backslashes = re.findall(r'\$[^$]*\\(?![a-zA-Z])[^$]*\$', content)
    if problematic_backslashes:
        issues.append(f"Found {len(problematic_backslashes)} potentially problematic backslashes in math mode")
    
    # Check for underscores outside math mode (these need escaping)
    text_underscores = re.findall(r'(?<!\$)[^$\n]*_[^$\n]*(?!\$)', content)
    if text_underscores:
        issues.append(f"Found {len(text_underscores)} underscores outside math mode (may need escaping)")
    
    return issues

def process(content: str, processed_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for LaTeX equation conversion.
    
    Args:
        content: The markdown content to process
        processed_dir: Base processed directory (not used in this module)
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Processing equations for LaTeX conversion...")
    
    # FIRST: Fix any malformed equation tags that might be in the content
    content, malformed_fixes = fix_malformed_equation_tags(content)
    
    # Validate math syntax first
    validation_issues = validate_math_syntax(content)
    if validation_issues:
        logger.warning("Math syntax validation issues:")
        for issue in validation_issues:
            logger.warning(f"  - {issue}")
    
    # Process in order: existing environments, display equations, inline equations
    
    # 1. Clean up any existing equation environments
    processed_content, env_count = process_equation_environments(content)
    
    # 2. Process display equations ($$...$$)
    processed_content, display_count = process_display_equations(processed_content)
    
    # 3. Process inline equations ($...$)
    processed_content, inline_count = process_inline_equations(processed_content)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "equations.tex"
        with open(debug_path, 'w', encoding='utf-8', errors='replace') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "malformed_fixes": malformed_fixes,
        "display_equations": display_count,
        "inline_equations": inline_count,
        "equation_environments": env_count,
        "validation_issues": len(validation_issues)
    }
    
    logger.info(f"Equation processing complete - {malformed_fixes} malformed fixes, {display_count} display equations, {inline_count} inline equations, {env_count} environments cleaned")
    
    if validation_issues:
        logger.warning(f"Found {len(validation_issues)} validation issues - check output carefully")
    
    return processed_content, stats
