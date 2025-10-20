# scripts/docusaurus/heading.py
"""
Handles heading processing: adding numbered IDs to headings for hierarchical navigation.
"""

import logging
import re
import json
from pathlib import Path

def load_toc_for_section(processed_dir, section_num):
    """Load TOC data and find the relevant section.
    
    Args:
        processed_dir: Base processed directory
        section_num: Section number to find
        
    Returns:
        dict or None: Section data from TOC
    """
    logger = logging.getLogger("docusaurus.heading")
    
    try:
        toc_path = processed_dir / "preprocessed" / "toc.json5"
        if not toc_path.exists():
            logger.warning(f"TOC file not found: {toc_path}")
            return None
        
        with open(toc_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Simple JSON5 parsing - remove comments and trailing commas
            content = re.sub(r'//.*?\n', '\n', content)  # Remove line comments
            content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)  # Remove block comments
            content = re.sub(r',(\s*[}\]])', r'\1', content)  # Remove trailing commas
            
            toc_data = json.loads(content)
            
            # Find the section that matches our section number
            for section in toc_data.get('sections', []):
                section_number = section.get('number', '')
                # Extract section number (e.g., "5.1" -> "1")
                section_match = re.search(r'\.(\d+)$', section_number)
                if section_match and int(section_match.group(1)) == section_num:
                    logger.info(f"Found TOC section for {section_num}: {section.get('title')}")
                    return section
                    
        logger.warning(f"No TOC section found for section number {section_num}")
        return None
        
    except Exception as e:
        logger.warning(f"Error loading TOC data: {e}")
        return None

def process_headings(content, section_num, processed_dir=None):
    """Process headings to use numbered anchor IDs for hierarchical navigation.
    
    Args:
        content: Markdown content
        section_num: Section number
        processed_dir: Base processed directory (for TOC lookup)
        
    Returns:
        str: Processed content with proper heading IDs
    """
    logger = logging.getLogger("docusaurus.heading")
    
    # Load TOC data for this section
    section_toc = None
    if processed_dir:
        section_toc = load_toc_for_section(processed_dir, section_num)
    
    # Split content into lines
    lines = content.split('\n')
    
    # Track current heading levels with numbered counters
    h2_counter = 0  # For ## headings -> 01, 02, 03, etc.
    h3_counter = 0  # For ### headings within current H2 -> 01-01, 01-02, etc.
    h4_counter = 0  # For #### headings within current H3 -> 01-01-01, etc.
    
    # Process each line
    for i, line in enumerate(lines):
        # Check if line is a heading
        heading_match = re.match(r'^(#{2,6})\s+(.*?)(?:\s+\{#.*\})?$', line)
        if heading_match:
            level = len(heading_match.group(1))
            heading_text = heading_match.group(2).strip()
            
            # For H2 headings (##) - main subsections
            if level == 2:
                h2_counter += 1
                h3_counter = 0  # Reset H3 counter
                h4_counter = 0  # Reset H4 counter
                
                heading_id = f"{h2_counter:02d}"
                lines[i] = f"## {heading_text} {{#{heading_id}}}"
                logger.info(f"Processed H2 '{heading_text}' -> #{heading_id}")
            
            # For H3 headings (###) - sub-subsections
            elif level == 3:
                h3_counter += 1
                h4_counter = 0  # Reset H4 counter
                
                heading_id = f"{h2_counter:02d}-{h3_counter:02d}"
                lines[i] = f"### {heading_text} {{#{heading_id}}}"
                logger.info(f"Processed H3 '{heading_text}' -> #{heading_id}")
            
            # For H4 headings (####) - sub-sub-subsections
            elif level == 4:
                h4_counter += 1
                
                heading_id = f"{h2_counter:02d}-{h3_counter:02d}-{h4_counter:02d}"
                lines[i] = f"#### {heading_text} {{#{heading_id}}}"
                logger.info(f"Processed H4 '{heading_text}' -> #{heading_id}")
            
            # For H5 and H6 headings - extend the pattern
            elif level == 5:
                # For now, treat H5 as simple text-based anchors or extend numbering
                heading_id = re.sub(r'[^\w\s-]', '', heading_text.lower())
                heading_id = re.sub(r'[-\s]+', '-', heading_id)
                heading_id = heading_id.strip('-')
                
                if not heading_id:
                    heading_id = f"heading-h5-{i}"
                
                lines[i] = f"##### {heading_text} {{#{heading_id}}}"
                logger.info(f"Processed H5 '{heading_text}' -> #{heading_id}")
            
            elif level == 6:
                # For H6, also use text-based anchors
                heading_id = re.sub(r'[^\w\s-]', '', heading_text.lower())
                heading_id = re.sub(r'[-\s]+', '-', heading_id)
                heading_id = heading_id.strip('-')
                
                if not heading_id:
                    heading_id = f"heading-h6-{i}"
                
                lines[i] = f"###### {heading_text} {{#{heading_id}}}"
                logger.info(f"Processed H6 '{heading_text}' -> #{heading_id}")
    
    # Join lines back into content
    return '\n'.join(lines)
