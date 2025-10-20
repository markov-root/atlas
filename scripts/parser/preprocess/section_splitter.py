# scripts/preprocess/section_splitter.py
import re
import os
import logging
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional

# Get logger
logger = logging.getLogger("preprocess.section_splitter")

def find_all_headings_in_content(content: str) -> List[Dict[str, Any]]:
    """
    Find all headings in content with their positions and levels.
    
    Args:
        content: Full markdown content
        
    Returns:
        List of heading dictionaries with position info
    """
    headings = []
    lines = content.split('\n')
    
    for line_idx, line in enumerate(lines):
        line = line.strip()
        if line.startswith('#'):
            # Extract heading level and title
            heading_match = re.match(r'^(#{1,6})\s+(.+)', line)
            if heading_match:
                level = len(heading_match.group(1))
                title = heading_match.group(2).strip()
                
                headings.append({
                    'level': level,
                    'title': title,
                    'line_index': line_idx,
                    'line_content': line
                })
    
    logger.info(f"Found {len(headings)} headings in content")
    return headings

def match_toc_to_content_headings(toc_data: Dict[str, Any], content_headings: List[Dict[str, Any]], document_lines: List[str]) -> List[Dict[str, Any]]:
    """
    Match TOC sections to actual content headings by position and hierarchy.
    
    Args:
        toc_data: TOC structure
        content_headings: List of headings found in content
        document_lines: List of lines in the document for end line calculation
        
    Returns:
        List of matched sections with content positions
    """
    matched_sections = []
    
    # Build a flat list of all sections from TOC
    def collect_main_sections(sections, level=1):
        main_sections = []
        for section in sections:
            if level == 1:  # Only collect main sections (H1 level)
                main_sections.append({
                    'toc_section': section,
                    'expected_level': 1,
                    'title': section.get('title', ''),
                    'number': section.get('number', '')
                })
        return main_sections
    
    toc_sections = collect_main_sections(toc_data.get('sections', []))
    
    logger.info(f"Matching {len(toc_sections)} TOC sections to {len(content_headings)} content headings")
    
    # Find H1 headings in content (main sections)
    h1_headings = [h for h in content_headings if h['level'] == 1]
    logger.info(f"Found {len(h1_headings)} H1 headings in content")
    
    # Match TOC sections to H1 headings by order
    for i, toc_section in enumerate(toc_sections):
        toc_title = toc_section['title']
        toc_number = toc_section['number']
        
        if i < len(h1_headings):
            content_heading = h1_headings[i]
            content_title = content_heading['title']
            
            logger.info(f"Matching TOC section {toc_number} '{toc_title}' to content heading '{content_title}' at line {content_heading['line_index']}")
            
            # Add position info to the section
            matched_section = {
                'toc_section': toc_section['toc_section'],
                'title': toc_title,
                'number': toc_number,
                'start_line': content_heading['line_index'],
                'section_index': i
            }
            matched_sections.append(matched_section)
        else:
            logger.warning(f"No content heading found for TOC section {toc_number} '{toc_title}'")
    
    # Add end positions
    total_lines = len(document_lines)
    
    for i, section in enumerate(matched_sections):
        if i < len(matched_sections) - 1:
            section['end_line'] = matched_sections[i + 1]['start_line']
        else:
            # For the last section, use the total number of lines in the document
            section['end_line'] = total_lines
    
    return matched_sections

def write_section_files(section_contents: Dict[str, str], output_dir: Path, metadata: Dict[str, Any]) -> Dict[str, Path]:
    """
    Write each section to a separate file in a chapter-numbered folder.
    
    Args:
        section_contents: Dictionary mapping section IDs to their content
        output_dir: Directory to write section files
        metadata: Chapter metadata with chapter number
        
    Returns:
        Dict: Dictionary mapping section IDs to their file paths
    """
    # Get chapter number from metadata
    chapter_num = metadata.get('chapter', {}).get('number', 0)
    chapter_dir_name = f"{chapter_num:02d}"
    
    # Create chapter directory directly in preprocessed
    chapter_dir = output_dir / chapter_dir_name
    chapter_dir.mkdir(parents=True, exist_ok=True)
    
    # Track file paths
    file_paths = {}
    
    # Write section files as 00.md, 01.md, etc.
    for section_id, file_content in sorted(section_contents.items()):
        # Create sequential filename
        section_index = int(section_id)
        filename = f"{section_index:02d}.md"
        file_path = chapter_dir / filename
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(file_content)
            
        file_paths[section_id] = file_path
    
    logger.info(f"Wrote {len(file_paths)} section files to {chapter_dir}")
    return file_paths

def process(document_content: str, output_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """
    Process content to split into separate section files.
    
    Args:
        document_content: The markdown content to process
        output_dir: Directory for output files
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (unchanged content, stats_dict)
    """
    # Log start of processing
    logger.info("Splitting content into separate section files...")
    
    # Load TOC data to identify sections
    toc_file = output_dir / "toc.json5"
    if not toc_file.exists():
        logger.error(f"TOC file not found: {toc_file}")
        return document_content, {"error": "TOC file not found"}
    
    # Load metadata to get chapter number
    metadata_files = list(output_dir.glob("chapter_*_metadata.json5"))
    metadata_file = output_dir / "metadata.json5"
    
    if not metadata_files and not metadata_file.exists():
        logger.error("No metadata file found")
        return document_content, {"error": "No metadata file found"}
    
    try:
        # Determine which metadata file to use
        actual_metadata_file = metadata_file if metadata_file.exists() else metadata_files[0]
        
        # Try to import JSON5 first for more flexible parsing
        try:
            import json5
            with open(toc_file, 'r', encoding='utf-8') as f:
                toc_data = json5.load(f)
                
            with open(actual_metadata_file, 'r', encoding='utf-8') as f:
                metadata = json5.load(f)
        except ImportError:
            # Fall back to standard JSON
            with open(toc_file, 'r', encoding='utf-8') as f:
                toc_data = json.load(f)
                
            with open(actual_metadata_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
    except Exception as e:
        logger.error(f"Error loading TOC or metadata file: {e}")
        return document_content, {"error": f"Error loading files: {e}"}
    
    # Step 1: Find all headings in content
    content_headings = find_all_headings_in_content(document_content)
    
    # Step 2: Split document into lines for line-based processing
    document_lines = document_content.split('\n')
    
    # Step 3: Match TOC sections to content headings by position
    matched_sections = match_toc_to_content_headings(toc_data, content_headings, document_lines)
    
    # Step 4: Extract sections by line position
    section_contents = {}
    
    for section in matched_sections:
        section_index = section['section_index']
        start_line = section['start_line']
        end_line = section['end_line']
        title = section['title']
        number = section['number']
        
        # Extract lines for this section
        section_lines = document_lines[start_line:end_line]
        section_text = '\n'.join(section_lines).strip()
        
        section_contents[str(section_index)] = section_text
        
        logger.info(f"Extracted section {section_index} ({number} - {title}): lines {start_line}-{end_line}, {len(section_text)} chars")
    
    # Step 5: Write section files
    file_paths = write_section_files(section_contents, output_dir, metadata)
    
    # Get chapter number and directory for stats
    chapter_num = metadata.get('chapter', {}).get('number', 0)
    chapter_dir_name = f"{chapter_num:02d}"
    chapter_dir = output_dir / chapter_dir_name
    
    # Save debug info if requested
    if debug_dir:
        debug_path = debug_dir / "section_splitter.json"
        # Convert paths to strings for JSON serialization
        file_paths_str = {k: str(v) for k, v in file_paths.items()}
        
        debug_data = {
            "chapter_number": chapter_num,
            "section_count": len(section_contents),
            "file_paths": file_paths_str,
            "matched_sections": [
                {
                    "index": s['section_index'],
                    "title": s['title'],
                    "number": s['number'],
                    "start_line": s['start_line'],
                    "end_line": s['end_line']
                }
                for s in matched_sections
            ]
        }
        
        with open(debug_path, 'w', encoding='utf-8') as f:
            json.dump(debug_data, f, indent=2)
        
        # Also save content headings for debugging
        headings_debug_path = debug_dir / "content_headings.json"
        with open(headings_debug_path, 'w', encoding='utf-8') as f:
            json.dump(content_headings, f, indent=2)
    
    logger.info(f"Section splitting complete for Chapter {chapter_num}")
    
    # Return content unchanged (we're just creating additional files)
    return document_content, {
        "chapter_number": chapter_num,
        "section_count": len(section_contents),
        "files_created": len(file_paths),
        "chapter_dir": str(chapter_dir)
    }
