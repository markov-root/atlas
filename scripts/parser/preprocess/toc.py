# scripts/preprocess/toc.py
import re
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import logging

# Get logger
logger = logging.getLogger("preprocess.toc")

def extract_toc(content: str) -> Optional[str]:
    """Extract the table of contents section."""
    toc_heading_match = re.search(r'#\s*(?:Table of Contents|Contents|TOC)\s*\n', content, re.IGNORECASE)
    if not toc_heading_match:
        return None
    
    toc_start = toc_heading_match.end()
    next_heading = re.search(r'\n#', content[toc_start:])
    if next_heading:
        toc_end = toc_start + next_heading.start()
    else:
        toc_end = len(content)
    
    return content[toc_start:toc_end].strip()

def should_skip_heading(title: str, chapter_number: int) -> bool:
    """
    Determine if a heading should be skipped from the TOC.
    
    Args:
        title: The heading title
        chapter_number: Chapter number for context
        
    Returns:
        bool: True if the heading should be skipped
    """
    title_lower = title.lower().strip()
    
    # Skip "Table of Contents" and variations
    toc_variations = [
        'table of contents',
        'contents', 
        'toc'
    ]
    
    if any(variation in title_lower for variation in toc_variations):
        logger.info(f"Skipping TOC heading: '{title}'")
        return True
    
    # Skip chapter title headings (like "Chapter 5 - Title")
    if 'chapter' in title_lower and str(chapter_number) in title_lower:
        logger.info(f"Skipping chapter title heading: '{title}'")
        return True
    
    return False

def build_hierarchical_toc_from_headings(content: str, chapter_number: int) -> List[Dict[str, Any]]:
    """Build TOC structure directly from document headings."""
    headings = find_section_headings(content)
    
    # Filter out headings we don't want in the TOC
    section_headings = []
    
    for heading in headings:
        if should_skip_heading(heading['title'], chapter_number):
            continue
        section_headings.append(heading)
    
    # Build hierarchical structure with proper numbering
    toc_structure = []
    section_counter = 0  # Start from 0 for main sections (Introduction = 5.0)
    
    # Stack to keep track of current parents at each level
    parent_stack = []
    counters = {}  # counters[level] = current counter for that level
    
    for heading in section_headings:
        level = heading['level']
        title = heading['title']
        anchor = heading['id']
        
        # Reset counters for deeper levels
        for l in list(counters.keys()):
            if l > level:
                del counters[l]
        
        # Initialize or increment counter for current level
        if level not in counters:
            if level == 1:
                counters[level] = section_counter
                section_counter += 1
            else:
                counters[level] = 1
        else:
            if level == 1:
                section_counter += 1
                counters[level] = section_counter - 1  # section_counter is already incremented
            else:
                counters[level] += 1
        
        # Build section number based on hierarchy
        if level == 1:
            # Main section (H1) - use chapter.section format (e.g., 5.0, 5.1, 5.2)
            section_number = f"{chapter_number}.{counters[level]}"
            section = {
                "title": title,
                "anchor": anchor,
                "number": section_number,
                "subsections": []
            }
            toc_structure.append(section)
            
            # Reset parent stack and set current H1 as the base
            parent_stack = [section]
            logger.info(f"Added main section {section_number}: {title}")
            
        elif level == 2:
            # Subsection (H2) - goes under current H1
            if parent_stack and len(parent_stack) >= 1:
                parent = parent_stack[0]
                subsection_num = len(parent['subsections']) + 1
                section_number = f"{parent['number']}.{subsection_num}"
                
                subsection = {
                    "title": title,
                    "anchor": anchor,
                    "number": section_number,
                    "subsections": []
                }
                parent['subsections'].append(subsection)
                
                # Update parent stack for level 2
                if len(parent_stack) > 1:
                    parent_stack = parent_stack[:1]
                parent_stack.append(subsection)
                logger.info(f"Added subsection {section_number}: {title}")
            
        elif level == 3:
            # Sub-subsection (H3) - goes under current H2
            if parent_stack and len(parent_stack) >= 2:
                parent = parent_stack[1]  # The H2 parent
                sub_subsection_num = len(parent['subsections']) + 1
                section_number = f"{parent['number']}.{sub_subsection_num}"
                
                sub_subsection = {
                    "title": title,
                    "anchor": anchor,
                    "number": section_number,
                    "subsections": []
                }
                parent['subsections'].append(sub_subsection)
                
                # Update parent stack for level 3
                if len(parent_stack) > 2:
                    parent_stack = parent_stack[:2]
                parent_stack.append(sub_subsection)
                logger.info(f"Added sub-subsection {section_number}: {title}")
            
        elif level == 4:
            # Sub-sub-subsection (H4) - goes under current H3
            if parent_stack and len(parent_stack) >= 3:
                parent = parent_stack[2]  # The H3 parent
                sub_sub_subsection_num = len(parent['subsections']) + 1
                section_number = f"{parent['number']}.{sub_sub_subsection_num}"
                
                sub_sub_subsection = {
                    "title": title,
                    "anchor": anchor,
                    "number": section_number,
                    "subsections": []
                }
                parent['subsections'].append(sub_sub_subsection)
                logger.info(f"Added sub-sub-subsection {section_number}: {title}")
    
    logger.info(f"Built TOC structure with {len(toc_structure)} main sections")
    return toc_structure

def find_section_headings(content: str) -> List[Dict[str, Any]]:
    """Extract all section headings from the content."""
    headings = []
    
    # Find headings - looking for lines starting with one or more # characters
    heading_pattern = r'^(#{1,6})\s+(.+?)(?:\s+\{#([^}]+)\})?$'
    
    # Process line by line
    for line_idx, line in enumerate(content.split('\n')):
        line = line.strip()
        if not line:
            continue
            
        if line.startswith('#'):
            match = re.match(heading_pattern, line)
            if match:
                level = len(match.group(1))
                title = match.group(2).strip()
                section_id = match.group(3) if match.group(3) else None
                
                # Generate ID if not provided
                if not section_id:
                    section_id = title.lower().replace(' ', '-')
                    section_id = re.sub(r'[^\w\-]', '', section_id)
                
                logger.debug(f"Found heading at line {line_idx+1} - Level: {level}, Title: '{title}'")
                headings.append({
                    "level": level,
                    "title": title,
                    "id": section_id,
                    "line": line_idx + 1
                })
            else:
                logger.debug(f"Line starts with # but doesn't match pattern: {line[:40]}...")
    
    # Log summary of found headings
    if headings:
        logger.info(f"Found {len(headings)} headings in document")
        for i, h in enumerate(headings[:8]):  # Show first 8 headings
            logger.info(f"  {'#' * h['level']} {h['title']}")
        if len(headings) > 8:
            logger.info(f"  ... and {len(headings) - 8} more")
    else:
        logger.warning("No headings found in document!")
        
    return headings

def remove_toc_from_content(content: str) -> str:
    """Remove the table of contents section from the content."""
    toc_heading_match = re.search(r'#\s*(?:Table of Contents|Contents|TOC)\s*\n', content, re.IGNORECASE)
    if not toc_heading_match:
        return content
    
    toc_start = toc_heading_match.start()
    next_heading = re.search(r'\n#', content[toc_start:])
    if next_heading:
        toc_end = toc_start + next_heading.start()
    else:
        toc_end = len(content)
    
    return content[:toc_start] + content[toc_end:]

def validate_toc_against_headings(toc_sections: List[Dict], content: str) -> List[Dict]:
    """Validate TOC entries against actual headings in the content."""
    validation_issues = []
    
    # Get content headings
    content_headings = find_section_headings(content)
    
    # Build a mapping of heading titles to their levels for better matching
    heading_map = {}
    for heading in content_headings:
        title_key = heading['title'].lower().strip()
        if title_key not in heading_map:
            heading_map[title_key] = []
        heading_map[title_key].append(heading)
    
    # Build a list of all section titles from the TOC (flattened)
    toc_titles = []
    
    def collect_titles(sections, depth=0):
        for section in sections:
            title = section['title'].strip()
            toc_titles.append({
                "title": title,
                "number": section['number'],
                "found": False,
                "depth": depth
            })
            if 'subsections' in section and section['subsections']:
                collect_titles(section['subsections'], depth + 1)
    
    collect_titles(toc_sections)
    
    # Log validation start
    logger.info(f"Validating TOC against document headings...")
    
    # Check if TOC entries exist in content
    matched_titles = set()
    for toc_entry in toc_titles:
        title_key = toc_entry["title"].lower().strip()
        
        if title_key in heading_map and title_key not in matched_titles:
            # Found matching title
            toc_entry["found"] = True
            matched_titles.add(title_key)
            logger.info(f"✓ Validated TOC section: {toc_entry['number']} - {toc_entry['title']}")
        else:
            logger.warning(f"✗ TOC section not found in content: {toc_entry['number']} - {toc_entry['title']}")
    
    # Log validation summary
    missing_count = len([entry for entry in toc_titles if not entry["found"]])
    if missing_count > 0:
        logger.warning(f"TOC validation completed with {missing_count} missing entries")
    else:
        logger.info("TOC validation completed successfully - all sections match")
    
    return validation_issues

def get_chapter_number(output_dir: Path) -> int:
    """Get chapter number from metadata.json5 file."""
    metadata_path = output_dir / "chapter_metadata.json5"
    
    # Look for any metadata JSON file
    if not metadata_path.exists():
        metadata_files = list(output_dir.glob("chapter_*_metadata.json5"))
        if metadata_files:
            metadata_path = metadata_files[0]
        else:
            # No metadata file found, fallback to 0
            return 0
    
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
            if "chapter" in metadata and "number" in metadata["chapter"]:
                return metadata["chapter"]["number"]
    except Exception as e:
        logger.error(f"Error reading metadata file: {e}")
    
    return 0  # Default to 0 if not found

def process(content: str, output_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Process TOC in the content, removing it and creating a TOC structure."""
    # Get chapter number from metadata
    chapter_number = get_chapter_number(output_dir)
    logger.info(f"Using chapter number: {chapter_number}")
    
    # Extract TOC section (but we'll ignore it and use document headings instead)
    toc_text = extract_toc(content)
    if toc_text:
        logger.info("Found table of contents section in document, but building structure from actual headings")
    else:
        logger.info("No table of contents section found, building structure from document headings")
    
    # Always build TOC structure from actual document headings for accuracy
    logger.info("Building TOC structure from document headings for accurate hierarchy")
    toc_structure = build_hierarchical_toc_from_headings(content, chapter_number)
    
    # Create TOC dictionary
    toc_dict = {
        "title": "Table of Contents",
        "chapter": chapter_number,
        "sections": toc_structure
    }
    
    # Log the TOC structure we created
    logger.info("Created TOC structure with sections:")
    for i, section in enumerate(toc_structure[:5]):
        logger.info(f"  {section['number']} - {section['title']}")
        if section['subsections']:
            for subsection in section['subsections'][:3]:
                logger.info(f"    {subsection['number']} - {subsection['title']}")
                if subsection['subsections']:
                    for sub_subsection in subsection['subsections'][:2]:
                        logger.info(f"      {sub_subsection['number']} - {sub_subsection['title']}")
    if len(toc_structure) > 5:
        logger.info(f"  ...and {len(toc_structure) - 5} more sections")
    
    # Remove TOC from content
    processed_content = remove_toc_from_content(content)
    
    # Validate TOC against content headings
    validation_issues = validate_toc_against_headings(toc_structure, processed_content)
    
    # Save TOC to JSON file
    json_path = output_dir / "toc.json5"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(toc_dict, f, indent=2)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "toc.json5"
        with open(debug_path, 'w', encoding='utf-8') as f:
            json.dump(toc_dict, f, indent=2)
        
        # Also save the TOC text if found
        if toc_text:
            with open(debug_dir / "toc_text.md", 'w', encoding='utf-8') as f:
                f.write(toc_text)
    
    # Clean up extra newlines
    processed_content = re.sub(r'\n{3,}', '\n\n', processed_content)
    
    return processed_content, toc_dict
