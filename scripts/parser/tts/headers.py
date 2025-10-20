# File: scripts/tts/headers.py
import re
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any, List

# Get logger
logger = logging.getLogger("tts.headers")

def add_section_numbering(content: str, section_data: Dict[str, Any], chapter_num: int) -> str:
    """Add explicit section numbering to headers using TOC data.
    
    Converts:
    - # Intelligence -> # Chapter 1 Section 3 - Intelligence
    - ## Case Studies -> ## Sub Section 1 - Case Studies
    - ## Measurement -> ## Sub Section 2 - Measurement
    
    Args:
        content: The markdown content to process
        section_data: Section data from TOC with title, number, subsections
        chapter_num: Chapter number
        
    Returns:
        Processed content with numbered headers
    """
    logger.info(f"Adding section numbering for: {section_data.get('title', 'Unknown')}")
    
    processed_content = content
    
    # Find the main section title and convert it
    section_title = section_data.get('title', '')
    section_number = section_data.get('number', '')
    
    if section_title:
        # Pattern to match the main section header (# Title)
        main_header_pattern = rf'^#\s+{re.escape(section_title)}(?:\s+\{{#[^}}]*\}})?$'
        
        # Extract section number from TOC (e.g., "1.3" -> "Section 3")
        if '.' in section_number:
            chapter_part, section_part = section_number.split('.', 1)
            new_header = f"# Chapter {chapter_part} Section {section_part} - {section_title}"
        else:
            new_header = f"# Chapter {chapter_num} Section {section_number} - {section_title}"
        
        processed_content = re.sub(main_header_pattern, new_header, processed_content, flags=re.MULTILINE)
        logger.debug(f"Converted main header: {section_title} -> {new_header}")
    
    # Process subsections
    subsections = section_data.get('subsections', [])
    for idx, subsection in enumerate(subsections):
        subsection_title = subsection.get('title', '')
        if subsection_title:
            # Pattern to match subsection header (## Title)
            sub_header_pattern = rf'^##\s+{re.escape(subsection_title)}(?:\s+\{{#[^}}]*\}})?$'
            sub_section_num = idx + 1
            new_sub_header = f"## Sub Section {sub_section_num} - {subsection_title}"
            
            processed_content = re.sub(sub_header_pattern, new_sub_header, processed_content, flags=re.MULTILINE)
            logger.debug(f"Converted subsection header: {subsection_title} -> {new_sub_header}")
    
    return processed_content

def split_content_by_subsections(content: str, section_data: Dict[str, Any]) -> Dict[str, str]:
    """Split content by H2 subsections based on TOC data.
    
    Args:
        content: The markdown content to process
        section_data: Section data from TOC
        
    Returns:
        Dict mapping filenames to content
    """
    subsections = section_data.get('subsections', [])
    
    # If no subsections, return content as single file
    if not subsections:
        logger.info("No subsections found in TOC, keeping as single file")
        return {"content": content}
    
    logger.info(f"TOC indicates {len(subsections)} subsections, attempting to split content")
    for i, sub in enumerate(subsections):
        logger.debug(f"  Subsection {i+1}: {sub.get('title', 'Unknown')}")
    
    # Split content by lines for better processing
    lines = content.split('\n')
    
    # Find all H2 headers and their positions
    h2_positions = []
    for i, line in enumerate(lines):
        # Check for H2 header with flexible whitespace
        if re.match(r'^##\s+.+', line.strip()):
            h2_title = re.sub(r'^##\s+', '', line.strip())
            h2_positions.append((i, line.strip(), h2_title))
    
    logger.info(f"Found {len(h2_positions)} H2 headers in content:")
    for i, (pos, header, title) in enumerate(h2_positions):
        logger.info(f"  H2 #{i+1} at line {pos}: {title}")
    
    # If no H2 headers found, return as single file
    if not h2_positions:
        logger.warning("No H2 headers found in content, keeping as single file")
        return {"content": content}
    
    sections = {}
    
    # NEW LOGIC: Split intro content from subsections
    intro_content = lines[:h2_positions[0][0]]
    intro_text = '\n'.join(intro_content).strip()
    
    if intro_text:
        # Create intro file (xx-00.md) with content before first H2
        sections["intro"] = intro_text
        logger.info(f"Created intro section with {len(intro_content)} lines")
    
    # Process each H2 section separately (without intro content)
    for idx, (line_pos, header_line, title) in enumerate(h2_positions):
        # Determine end position
        if idx < len(h2_positions) - 1:
            end_pos = h2_positions[idx + 1][0]
        else:
            end_pos = len(lines)
        
        # Extract ONLY this section's content (don't include intro)
        section_lines = lines[line_pos:end_pos]
        section_content = '\n'.join(section_lines).strip()
        
        # Use subsection index for filename  
        filename = f"subsection_{idx + 1}"
        sections[filename] = section_content
        
        logger.info(f"Created subsection {idx + 1}: '{title}' ({len(section_content)} chars)")
    
    return sections

def process(content: str, section_data: Dict[str, Any], chapter_num: int, debug_dir: Optional[Path] = None) -> Tuple[Dict[str, str], Dict[str, Any]]:
    """Main processing function for TTS header numbering and splitting.
    
    Args:
        content: The markdown content to process
        section_data: Section data from TOC
        chapter_num: Chapter number
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (split_sections_dict, stats_dict)
    """
    logger.info("Processing headers and splitting content for TTS...")
    
    # Step 1: Add section numbering
    numbered_content = add_section_numbering(content, section_data, chapter_num)
    
    # Step 2: Split content by subsections (NEW LOGIC)
    split_sections = split_content_by_subsections(numbered_content, section_data)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "headers_and_split.md"
        with open(debug_path, 'w', encoding='utf-8') as f:
            f.write(numbered_content)
        
        # Save individual sections
        for filename, section_content in split_sections.items():
            section_debug_path = debug_dir / f"split_{filename}.md"
            with open(section_debug_path, 'w', encoding='utf-8') as f:
                f.write(section_content)
        
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "sections_created": len(split_sections),
        "has_subsections": len(section_data.get('subsections', [])) > 0
    }
    
    logger.info(f"Header processing complete - created {len(split_sections)} sections")
    
    return split_sections, stats
