# scripts/preprocess/descriptions.py
import re
import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("preprocess.descriptions")

def extract_chapter_description(content: str) -> Tuple[str, Optional[str]]:
    """
    Extract chapter description from content.
    
    Args:
        content: The markdown content to search
        
    Returns:
        Tuple of (content_without_tag, extracted_description)
    """
    # Pattern to match <chapter-description>content</chapter-description>
    pattern = r'<chapter-description>\s*(.*?)\s*</chapter-description>'
    
    match = re.search(pattern, content, re.DOTALL)
    if match:
        description = match.group(1).strip()
        # Remove the tag from content
        content_without_tag = re.sub(pattern, '', content, flags=re.DOTALL)
        # Clean up extra whitespace
        content_without_tag = re.sub(r'\n{3,}', '\n\n', content_without_tag)
        
        logger.info(f"Extracted chapter description: {description[:50]}...")
        return content_without_tag, description
    
    logger.info("No chapter description found")
    return content, None

def remove_chapter_description_from_sections(section_content: str) -> str:
    """
    Remove chapter description tags from section content (they shouldn't be there).
    
    Args:
        section_content: The markdown content of a section
        
    Returns:
        Content with chapter description tags removed
    """
    # Pattern to match <chapter-description>content</chapter-description>
    pattern = r'<chapter-description>\s*(.*?)\s*</chapter-description>'
    
    if re.search(pattern, section_content, re.DOTALL):
        logger.warning("Found chapter-description tag in section file - removing it")
        # Remove the tag from content
        content_without_tag = re.sub(pattern, '', section_content, flags=re.DOTALL)
        # Clean up extra whitespace
        content_without_tag = re.sub(r'\n{3,}', '\n\n', content_without_tag)
        return content_without_tag
    
    return section_content

def extract_section_description(section_content: str) -> Tuple[str, Optional[str]]:
    """
    Extract section description from section content.
    
    Args:
        section_content: The markdown content of a section
        
    Returns:
        Tuple of (content_without_tag, extracted_description)
    """
    # Pattern to match <section-description>content</section-description>
    pattern = r'<section-description>\s*(.*?)\s*</section-description>'
    
    match = re.search(pattern, section_content, re.DOTALL)
    if match:
        description = match.group(1).strip()
        # Remove the tag from content
        content_without_tag = re.sub(pattern, '', section_content, flags=re.DOTALL)
        # Clean up extra whitespace
        content_without_tag = re.sub(r'\n{3,}', '\n\n', content_without_tag)
        
        logger.debug(f"Extracted section description: {description[:50]}...")
        return content_without_tag, description
    
    logger.debug("No section description found in this section")
    return section_content, None

def update_toc_with_descriptions(toc_data: Dict[str, Any], chapter_description: Optional[str], 
                                section_descriptions: Dict[str, str]) -> Dict[str, Any]:
    """
    Update TOC data structure with chapter and section descriptions.
    
    Args:
        toc_data: Existing TOC data
        chapter_description: Extracted chapter description
        section_descriptions: Dict mapping section numbers to descriptions
        
    Returns:
        Updated TOC data
    """
    # Add chapter description at the top level
    if chapter_description:
        toc_data["chapter_description"] = chapter_description
        logger.info("Added chapter description to TOC")
    
    # Add section descriptions to each section using array index
    sections_updated = 0
    for index, section in enumerate(toc_data.get('sections', [])):
        section_number = section.get('number', '')
        section_title = section.get('title', '')
        
        # Use the array index as the file number (0 -> 00.md, 1 -> 01.md, etc.)
        section_file_num = str(index)
        
        if section_file_num in section_descriptions:
            section["description"] = section_descriptions[section_file_num]
            sections_updated += 1
            logger.info(f"Added description to section {section_number} ({section_title}) from file {int(section_file_num):02d}.md")
        else:
            logger.debug(f"No description found for section {section_number} ({section_title}) - looking for file {int(section_file_num):02d}.md")
    
    logger.info(f"Updated {sections_updated} sections with descriptions")
    return toc_data

def process_section_files(output_dir: Path) -> Dict[str, str]:
    """
    Process all section files to extract section descriptions.
    
    Args:
        output_dir: Directory containing section files
        
    Returns:
        Dict mapping section numbers to descriptions
    """
    section_descriptions = {}
    
    # Find the chapter directory (should be a number like "05")
    chapter_dirs = [d for d in output_dir.iterdir() if d.is_dir() and d.name.isdigit()]
    if not chapter_dirs:
        logger.warning("No chapter directory found")
        return section_descriptions
    
    chapter_dir = chapter_dirs[0]
    logger.info(f"Processing section files in {chapter_dir}")
    
    # Find all section files (00.md, 01.md, etc.)
    section_files = sorted([f for f in chapter_dir.glob("*.md")])
    
    for section_file in section_files:
        # Extract section number from filename (e.g., "01.md" -> "1")
        section_match = re.match(r'0*(\d+)\.md', section_file.name)
        if not section_match:
            logger.debug(f"Skipping non-section file: {section_file.name}")
            continue
            
        section_num = section_match.group(1)  # Get number without leading zeros
        logger.info(f"Processing section file: {section_file.name} (section {section_num})")
        
        # Read the section file
        try:
            with open(section_file, 'r', encoding='utf-8') as f:
                section_content = f.read()
            
            # Extract description
            updated_content, description = extract_section_description(section_content)
            
            # Also remove any chapter description tags that shouldn't be in section files
            updated_content = remove_chapter_description_from_sections(updated_content)
            
            if description:
                section_descriptions[section_num] = description
                logger.info(f"Extracted section description from section {section_num}")
            
            # Always write back the updated content (removes tags)
            with open(section_file, 'w', encoding='utf-8') as f:
                f.write(updated_content)
                
            if description:
                logger.info(f"Updated section file {section_file.name} (removed description tag)")
            else:
                logger.info(f"Updated section file {section_file.name} (cleaned up any stray tags)")
                
        except Exception as e:
            logger.error(f"Error processing section file {section_file}: {e}")
    
    logger.info(f"Processed {len(section_files)} section files, found {len(section_descriptions)} descriptions")
    return section_descriptions

def process(content: str, output_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """
    Process content to extract chapter and section descriptions.
    
    Args:
        content: The markdown content to process (main content)
        output_dir: Directory containing output files and sections
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    # Log start of processing
    logger.info("Extracting chapter and section descriptions...")
    
    # Step 1: Extract chapter description from main content
    processed_content, chapter_description = extract_chapter_description(content)
    
    # Step 2: Process section files to extract section descriptions
    section_descriptions = process_section_files(output_dir)
    
    # Step 3: Load and update TOC data
    toc_file = output_dir / "toc.json5"
    if not toc_file.exists():
        logger.error(f"TOC file not found: {toc_file}")
        return processed_content, {"error": "TOC file not found"}
    
    try:
        # Load existing TOC data
        with open(toc_file, 'r', encoding='utf-8') as f:
            toc_data = json.load(f)
        
        # Update with descriptions
        updated_toc_data = update_toc_with_descriptions(toc_data, chapter_description, section_descriptions)
        
        # Save updated TOC data
        with open(toc_file, 'w', encoding='utf-8') as f:
            json.dump(updated_toc_data, f, indent=2)
        
        logger.info(f"Updated TOC file: {toc_file}")
        
    except Exception as e:
        logger.error(f"Error updating TOC file: {e}")
        return processed_content, {"error": f"Error updating TOC: {e}"}
    
    # Prepare stats
    stats = {
        "chapter_description_found": chapter_description is not None,
        "section_descriptions_found": len(section_descriptions),
        "total_descriptions": (1 if chapter_description else 0) + len(section_descriptions)
    }
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "descriptions.json"
        debug_data = {
            "chapter_description": chapter_description,
            "section_descriptions": section_descriptions,
            "stats": stats
        }
        with open(debug_path, 'w', encoding='utf-8') as f:
            json.dump(debug_data, f, indent=2)
    
    logger.info(f"Description extraction complete - Chapter: {'✓' if chapter_description else '✗'}, Sections: {len(section_descriptions)}")
    
    return processed_content, stats
