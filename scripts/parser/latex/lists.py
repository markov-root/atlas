# File: scripts/latex/lists.py
import re
import logging
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any

# Get logger
logger = logging.getLogger("latex.lists")

def find_numbered_list_blocks(content: str) -> List[Tuple[str, int, int]]:
    """
    Find all numbered list blocks in the content.
    Returns a list of tuples (raw_list_text, start_pos, end_pos)
    """
    # Find the start of each potential numbered list
    list_blocks = []
    lines = content.split('\n')
    current_list = []
    in_list = False
    list_start = -1
    
    for i, line in enumerate(lines):
        line = line.strip()
        # Check if line is a numbered list item
        if re.match(r'^\d+\.\s+', line):
            if not in_list:
                # Start new list
                in_list = True
                list_start = i
                current_list = [lines[i]]
            else:
                # Continue current list
                current_list.append(lines[i])
        elif in_list and (not line or line.isspace()):
            # Empty line might be part of the list structure
            current_list.append(lines[i])
        elif in_list:
            # End of list reached
            in_list = False
            if current_list:
                # Calculate positions for replacement
                start_pos = sum(len(lines[j]) + 1 for j in range(list_start))
                end_pos = start_pos + sum(len(line) + 1 for line in current_list) - 1
                list_text = '\n'.join(current_list)
                list_blocks.append((list_text, start_pos, end_pos))
                current_list = []
    
    # Don't forget potential list at end of file
    if in_list and current_list:
        start_pos = sum(len(lines[j]) + 1 for j in range(list_start))
        end_pos = start_pos + sum(len(line) + 1 for line in current_list) - 1
        list_text = '\n'.join(current_list)
        list_blocks.append((list_text, start_pos, end_pos))
    
    return list_blocks

def find_bullet_list_blocks(content: str) -> List[Tuple[str, int, int]]:
    """
    Find all bullet list blocks in the content.
    Returns a list of tuples (raw_list_text, start_pos, end_pos)
    """
    # Find the start of each potential bullet list
    list_blocks = []
    lines = content.split('\n')
    current_list = []
    in_list = False
    list_start = -1
    
    for i, line in enumerate(lines):
        line = line.strip()
        # Check if line is a bullet list item
        if line.startswith('- '):
            if not in_list:
                # Start new list
                in_list = True
                list_start = i
                current_list = [lines[i]]
            else:
                # Continue current list
                current_list.append(lines[i])
        elif in_list and (not line or line.isspace()):
            # Empty line might be part of the list structure
            current_list.append(lines[i])
        elif in_list:
            # End of list reached
            in_list = False
            if current_list:
                # Calculate positions for replacement
                start_pos = sum(len(lines[j]) + 1 for j in range(list_start))
                end_pos = start_pos + sum(len(line) + 1 for line in current_list) - 1
                list_text = '\n'.join(current_list)
                list_blocks.append((list_text, start_pos, end_pos))
                current_list = []
    
    # Don't forget potential list at end of file
    if in_list and current_list:
        start_pos = sum(len(lines[j]) + 1 for j in range(list_start))
        end_pos = start_pos + sum(len(line) + 1 for line in current_list) - 1
        list_text = '\n'.join(current_list)
        list_blocks.append((list_text, start_pos, end_pos))
    
    return list_blocks

def convert_numbered_list_block(block_content: str) -> str:
    """Convert a raw numbered list block to LaTeX enumerate environment."""
    items = []
    for line in block_content.split('\n'):
        line = line.strip()
        if re.match(r'^\d+\.\s+', line):
            # Extract the content after the number
            item_content = re.sub(r'^\d+\.\s+', '', line)
            items.append(f'    \\item {item_content}')
    
    if not items:
        return block_content
    
    return '\\begin{enumerate}\n' + '\n'.join(items) + '\n\\end{enumerate}'

def convert_bullet_list_block(block_content: str) -> str:
    """Convert a raw bullet list block to LaTeX itemize environment."""
    items = []
    for line in block_content.split('\n'):
        line = line.strip()
        if line.startswith('- '):
            # Extract the content after the dash
            item_content = line[2:].strip()
            items.append(f'    \\item {item_content}')
    
    if not items:
        return block_content
    
    return '\\begin{itemize}\n' + '\n'.join(items) + '\n\\end{itemize}'

def process_lists(content: str) -> Tuple[str, int, int]:
    """Process both bullet points and numbered lists."""
    numbered_count = 0
    bullet_count = 0
    
    # Find and convert numbered lists first (working from end to start to preserve positions)
    numbered_blocks = find_numbered_list_blocks(content)
    numbered_count = len(numbered_blocks)
    
    for i, (block_text, start, end) in enumerate(reversed(numbered_blocks)):
        logger.debug(f"Converting numbered list block {numbered_count - i}")
        converted = convert_numbered_list_block(block_text)
        content = content[:start] + converted + content[end:]
    
    # Then find and convert bullet lists
    bullet_blocks = find_bullet_list_blocks(content)
    bullet_count = len(bullet_blocks)
    
    for i, (block_text, start, end) in enumerate(reversed(bullet_blocks)):
        logger.debug(f"Converting bullet list block {bullet_count - i}")
        converted = convert_bullet_list_block(block_text)
        content = content[:start] + converted + content[end:]
    
    return content, numbered_count, bullet_count

def process(content: str, processed_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for LaTeX list conversion.
    
    Args:
        content: The markdown content to process
        processed_dir: Base processed directory (not used in this module)
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Processing lists for LaTeX conversion...")
    
    # Process lists
    content, numbered_count, bullet_count = process_lists(content)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "lists.tex"
        with open(debug_path, 'w', encoding='utf-8', errors='replace') as f:
            f.write(content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "numbered_lists": numbered_count,
        "bullet_lists": bullet_count,
        "total_lists": numbered_count + bullet_count
    }
    
    logger.info(f"List processing complete - {numbered_count} numbered lists, {bullet_count} bullet lists")
    
    return content, stats
