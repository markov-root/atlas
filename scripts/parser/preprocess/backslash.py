# scripts/preprocess/backslash.py
import re
import logging
import json
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("preprocess.backslash")

def remove_stray_backslashes(content: str) -> Tuple[str, Dict[str, int]]:
    """
    Remove stray backslashes that appear alone on a line or surrounded by whitespace.
    
    Examples:
    - " \\\n" -> "\n"
    - "Text. \\ " -> "Text. "
    - "Text \\\nNext" -> "Text\nNext"
    
    This only targets isolated backslashes, not those used in formatting or URLs.
    """
    # Pattern 1: Standalone backslash on its own line (possibly with whitespace)
    pattern1 = r'^\s*\\\s*$'
    
    # Pattern 2: Backslash surrounded by whitespace (but not at beginning of a line)
    pattern2 = r'(?<!\n)\s+\\\s+'
    
    # Pattern 3: Backslash at end of line
    pattern3 = r'\\\s*$'
    
    # Count matches for reporting
    counts = {
        "standalone": len(re.findall(pattern1, content, re.MULTILINE)),
        "surrounded": len(re.findall(pattern2, content)),
        "end_of_line": len(re.findall(pattern3, content, re.MULTILINE))
    }
    
    # Log examples of what we're removing
    if counts["standalone"] > 0:
        logger.debug(f"Found {counts['standalone']} standalone backslashes (e.g., '\\' on its own line)")
    
    if counts["surrounded"] > 0:
        logger.debug(f"Found {counts['surrounded']} backslashes surrounded by whitespace (e.g., 'text \\ text')")
    
    if counts["end_of_line"] > 0:
        logger.debug(f"Found {counts['end_of_line']} backslashes at end of line (e.g., 'text\\' at line end)")
    
    # Apply each pattern
    content = re.sub(pattern1, '', content, flags=re.MULTILINE)
    content = re.sub(pattern2, ' ', content)
    content = re.sub(pattern3, '', content, flags=re.MULTILINE)
    
    return content, counts

def process(content: str, output_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """
    Process content to remove stray backslashes.
    
    Args:
        content: The markdown content to process
        output_dir: Directory for output files
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    # Log start of processing
    logger.info("Cleaning up backslashes...")
    
    # Remove stray backslashes
    content, stats = remove_stray_backslashes(content)
    
    # Total count for reporting
    stats["total"] = sum(stats.values())
    
    # Log results
    if stats["total"] > 0:
        logger.info(f"Removed {stats['total']} stray backslashes:")
        if stats["standalone"] > 0:
            logger.info(f"  - {stats['standalone']} standalone backslashes")
        if stats["surrounded"] > 0:
            logger.info(f"  - {stats['surrounded']} backslashes surrounded by whitespace")
        if stats["end_of_line"] > 0:
            logger.info(f"  - {stats['end_of_line']} backslashes at end of line")
    else:
        logger.info("No stray backslashes found")
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "backslash_fixes.json"
        with open(debug_path, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2)
    
    logger.info("Backslash cleanup complete")
    
    return content, stats
