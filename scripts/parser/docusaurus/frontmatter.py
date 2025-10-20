# scripts/docusaurus/frontmatter.py - Enhanced frontmatter generation with pagination control
"""
Handles title extraction and frontmatter generation with enhanced metadata and pagination control.
"""

import logging
import re
import json
from pathlib import Path
from typing import Optional, Dict, Any, List

def load_enhanced_metadata(processed_dir: Path) -> tuple[Dict[str, Any], Dict[str, Any]]:
    """Load both TOC and metadata for frontmatter generation.
    
    Args:
        processed_dir: Base processed directory
        
    Returns:
        Tuple of (toc_data, metadata)
    """
    logger = logging.getLogger("docusaurus.frontmatter")
    
    # Load TOC data (contains reading times and descriptions)
    toc_data = {}
    toc_path = processed_dir / "preprocessed" / "toc.json5"
    if toc_path.exists():
        try:
            with open(toc_path, 'r', encoding='utf-8') as f:
                toc_data = json.load(f)
            logger.info(f"Loaded TOC data from {toc_path}")
        except Exception as e:
            logger.warning(f"Error loading TOC data: {e}")
    else:
        logger.warning(f"TOC file not found: {toc_path}")
    
    # Load metadata (contains authors, affiliations, links)
    metadata = {}
    metadata_path = processed_dir / "preprocessed" / "metadata.json5"
    if metadata_path.exists():
        try:
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            logger.info(f"Loaded metadata from {metadata_path}")
        except Exception as e:
            logger.warning(f"Error loading metadata: {e}")
    else:
        logger.warning(f"Metadata file not found: {metadata_path}")
    
    return toc_data, metadata

def calculate_pagination_for_section(chapter_num: int, section_num: int, toc_data: Dict[str, Any]) -> Dict[str, Optional[str]]:
    """Calculate correct pagination for a section based on TOC structure.
    
    Args:
        chapter_num: Chapter number
        section_num: Section number (1-based, matching document IDs)
        toc_data: TOC data with sections structure
        
    Returns:
        Dict with 'previous' and 'next' pagination document IDs (or None)
    """
    logger = logging.getLogger("docusaurus.frontmatter")
    
    sections = toc_data.get("sections", [])
    if not sections:
        logger.warning("No sections found in TOC data for pagination calculation")
        return {"previous": None, "next": None}
    
    # Build a list of actual document sections (excluding intro/index sections)
    doc_sections = []
    for idx, section in enumerate(sections):
        section_number = section.get('number', '')
        # Skip introduction sections (like "5.0")
        if not section_number.endswith('.0'):
            doc_sections.append({
                'index': idx,
                'section_num': len(doc_sections) + 1,  # 1-based for file naming
                'number': section_number,
                'title': section.get('title', ''),
                'doc_id': f"chapters/{chapter_num:02d}/{len(doc_sections) + 1}"  # Document ID format
            })
    
    logger.info(f"Found {len(doc_sections)} document sections for pagination")
    for doc_section in doc_sections:
        logger.debug(f"  Section {doc_section['section_num']}: {doc_section['number']} {doc_section['title']} -> {doc_section['doc_id']}")
    
    # Find current section in the list
    current_section_idx = None
    for idx, doc_section in enumerate(doc_sections):
        if doc_section['section_num'] == section_num:
            current_section_idx = idx
            break
    
    if current_section_idx is None:
        logger.warning(f"Could not find section {section_num} in document sections list")
        return {"previous": None, "next": None}
    
    # Calculate previous and next
    previous_id = None
    next_id = None
    
    # Previous: look backwards for actual document sections
    if current_section_idx > 0:
        previous_section = doc_sections[current_section_idx - 1]
        previous_id = previous_section['doc_id']
        logger.info(f"Previous for section {section_num}: {previous_id}")
    else:
        # First section - previous is the chapter index
        previous_id = f"chapters/{chapter_num:02d}/index"
        logger.info(f"Previous for section {section_num}: {previous_id} (chapter index)")
    
    # Next: look forwards for actual document sections
    if current_section_idx < len(doc_sections) - 1:
        next_section = doc_sections[current_section_idx + 1]
        next_id = next_section['doc_id']
        logger.info(f"Next for section {section_num}: {next_id}")
    else:
        # Last section - no next document in this chapter
        logger.info(f"Next for section {section_num}: None (last section in chapter)")
    
    return {"previous": previous_id, "next": next_id}

def format_authors_list(authors: List[str]) -> List[str]:
    """Format authors list for YAML frontmatter.
    
    Args:
        authors: List of author names
        
    Returns:
        Formatted list of authors
    """
    if not authors:
        return []
    
    # Clean up author names and ensure proper formatting
    formatted_authors = []
    for author in authors:
        # Remove extra whitespace and ensure proper quoting
        clean_author = author.strip()
        if clean_author:
            formatted_authors.append(clean_author)
    
    return formatted_authors

def format_affiliations_list(affiliations: List[str]) -> List[str]:
    """Format affiliations list for YAML frontmatter.
    
    Args:
        affiliations: List of affiliation names
        
    Returns:
        Formatted list of affiliations
    """
    if not affiliations:
        return []
    
    # Clean up affiliation names
    formatted_affiliations = []
    for affiliation in affiliations:
        clean_affiliation = affiliation.strip()
        if clean_affiliation:
            formatted_affiliations.append(clean_affiliation)
    
    return formatted_affiliations

def extract_action_links(metadata: Dict[str, Any]) -> Dict[str, str]:
    """Extract action button links from metadata.
    
    Args:
        metadata: Metadata dictionary containing links
        
    Returns:
        Dict of action links for frontmatter
    """
    action_links = {}
    
    # Get links from metadata
    links = metadata.get("links", {})
    arxiv_info = metadata.get("arxiv", {})
    
    # Map different link types to action button names
    link_mappings = {
        "arxiv": "arxiv_link",
        "google_docs": "google_docs_link", 
        "docs": "google_docs_link",
        "alignment_forum": "alignment_forum_link",
        "alignmentforum": "alignment_forum_link",
        "video": "video_link",
        "youtube": "video_link",
        "audio": "audio_link",
        "podcast": "audio_link",
        "teach": "teach_link",
        "teaching": "teach_link",
        "facilitate": "teach_link",  # Added facilitate -> teach_link mapping
        "github": "teach_link",
        "download": "download_link",  # Added download -> download_link mapping
        "pdf": "download_link",
        "feedback": "feedback_link",  # Added feedback -> feedback_link mapping
        "ai_safety_atlas": "atlas_link"  # Added AI Safety Atlas link mapping
    }
    
    # Process regular links
    for link_key, url in links.items():
        if isinstance(url, str) and url.strip():
            link_key_lower = link_key.lower()
            
            # First try exact match
            if link_key_lower in link_mappings:
                target_key = link_mappings[link_key_lower]
                action_links[target_key] = url.strip()
                continue
            
            # Then try partial matches
            matched = False
            for source_key, target_key in link_mappings.items():
                if source_key in link_key_lower:
                    action_links[target_key] = url.strip()
                    matched = True
                    break
            
            # If no mapping found, log it for debugging
            if not matched:
                logger = logging.getLogger("docusaurus.frontmatter")
                logger.warning(f"No mapping found for link key '{link_key}' - consider adding to link_mappings")
    
    # Add arXiv link from arxiv metadata if available
    if arxiv_info.get("url"):
        action_links["arxiv_link"] = arxiv_info["url"]
    
    return action_links

def generate_chapter_frontmatter(chapter_num: int, toc_data: Dict[str, Any], metadata: Dict[str, Any]) -> str:
    """Generate frontmatter for a chapter index file.
    
    Args:
        chapter_num: Chapter number
        toc_data: TOC data with reading times and descriptions
        metadata: Metadata with authors, affiliations, links
        
    Returns:
        Frontmatter content
    """
    logger = logging.getLogger("docusaurus.frontmatter")
    
    # Extract basic info
    chapter_title = metadata.get("chapter", {}).get("title", f"Chapter {chapter_num}")
    chapter_description = toc_data.get("chapter_description")  # Don't provide fallback
    
    # Extract reading times from TOC
    reading_times = toc_data.get("reading_times", {})
    core_time = reading_times.get("core", "0 min")
    optional_time = reading_times.get("optional", "0 min") 
    appendix_time = reading_times.get("appendix", "0 min")
    
    # Extract authors and affiliations
    authors = format_authors_list(metadata.get("authors", []))
    affiliations = format_affiliations_list(metadata.get("affiliations", []))
    
    # Extract action links
    action_links = extract_action_links(metadata)
    
    # Build frontmatter
    frontmatter_lines = ["---"]
    
    # Required fields
    frontmatter_lines.append(f'title: "{chapter_title}"')
    frontmatter_lines.append(f"chapter_number: {chapter_num}")
    if chapter_description:  # Only add if description exists
        frontmatter_lines.append(f'chapter_description: "{chapter_description}"')
    
    # Reading times
    frontmatter_lines.append(f'reading_time_core: "{core_time}"')
    if optional_time != "0 min":
        frontmatter_lines.append(f'reading_time_optional: "{optional_time}"')
    if appendix_time != "0 min":
        frontmatter_lines.append(f'reading_time_appendix: "{appendix_time}"')
    
    # Authors (required)
    if authors:
        if len(authors) == 1:
            frontmatter_lines.append(f'authors: ["{authors[0]}"]')
        else:
            frontmatter_lines.append("authors:")
            for author in authors:
                frontmatter_lines.append(f'  - "{author}"')
    else:
        # Provide default if no authors found
        frontmatter_lines.append('authors: ["Unknown Author"]')
    
    # Affiliations (required)
    if affiliations:
        if len(affiliations) == 1:
            frontmatter_lines.append(f'affiliations: ["{affiliations[0]}"]')
        else:
            frontmatter_lines.append("affiliations:")
            for affiliation in affiliations:
                frontmatter_lines.append(f'  - "{affiliation}"')
    else:
        # Provide default if no affiliations found
        frontmatter_lines.append('affiliations: ["Unknown Institution"]')
    
    # Acknowledgements (optional)
    acknowledgements = metadata.get("acknowledgements", [])
    if acknowledgements:
        if len(acknowledgements) == 1:
            frontmatter_lines.append(f'acknowledgements: ["{acknowledgements[0]}"]')
        else:
            frontmatter_lines.append("acknowledgements:")
            for acknowledgement in acknowledgements:
                frontmatter_lines.append(f'  - "{acknowledgement}"')
    
    # Optional action buttons (only include if links are available)
    for link_type, url in action_links.items():
        frontmatter_lines.append(f'{link_type}: "{url}"')
    
    # Standard Docusaurus fields
    frontmatter_lines.append(f"sidebar_position: {chapter_num}")
    frontmatter_lines.append(f"slug: /chapters/{chapter_num:02d}/")
    
    # Chapter index pages typically don't need pagination overrides
    # since they're not part of the main pagination sequence
    
    frontmatter_lines.append("---")
    frontmatter_lines.append("")  # Empty line after frontmatter
    
    result = "\n".join(frontmatter_lines)
    
    logger.info(f"Generated chapter frontmatter for Chapter {chapter_num}")
    logger.debug(f"Chapter frontmatter includes: {len(authors)} authors, {len(affiliations)} affiliations, {len(action_links)} action links")
    if chapter_description:
        logger.debug(f"Chapter includes description: {chapter_description[:50]}...")
    else:
        logger.debug(f"No chapter description available")
    
    # Log which action links were included
    for link_type, url in action_links.items():
        logger.debug(f"Added action link: {link_type} -> {url}")
    
    return result

def find_section_in_toc(toc_data: Dict[str, Any], section_num: int) -> Optional[Dict[str, Any]]:
    """Find section data in TOC by section number.
    
    Args:
        toc_data: TOC data structure
        section_num: Section number to find
        
    Returns:
        Section data if found, None otherwise
    """
    sections = toc_data.get("sections", [])
    
    # Use array index to find section (section_num corresponds to array position)
    if 0 <= section_num < len(sections):
        return sections[section_num]
    
    return None

def generate_section_frontmatter(chapter_num: int, section_num: int, toc_data: Dict[str, Any], title: Optional[str] = None) -> str:
    """Generate frontmatter for a section file with pagination control.
    
    Args:
        chapter_num: Chapter number
        section_num: Section number
        toc_data: TOC data with reading times and descriptions
        title: Optional title override
        
    Returns:
        Frontmatter content
    """
    logger = logging.getLogger("docusaurus.frontmatter")
    
    # Find section data in TOC
    section_data = find_section_in_toc(toc_data, section_num)
    
    # Determine section title and description
    if title:
        section_title = title
    elif section_data:
        section_title = section_data.get("title", f"Section {section_num}")
    elif section_num == 0:
        section_title = "Introduction"
    else:
        section_title = f"Section {section_num}"
    
    # Get section description (only if it exists)
    section_description = None
    if section_data and "description" in section_data:
        section_description = section_data["description"]
    
    # Get reading times from section data
    reading_times = section_data.get("reading_times", {}) if section_data else {}
    core_time = reading_times.get("core", "0 min")
    optional_time = reading_times.get("optional", "0 min")
    
    # Build sidebar label
    if section_data:
        section_number_str = section_data.get("number", f"{chapter_num}.{section_num}")
        sidebar_label = f"{section_number_str} {section_title}"
    else:
        sidebar_label = f"{chapter_num}.{section_num} {section_title}"
    
    # Calculate pagination based on TOC structure
    pagination = calculate_pagination_for_section(chapter_num, section_num, toc_data)
    
    # Build frontmatter
    frontmatter_lines = ["---"]
    
    # Required Docusaurus fields
    frontmatter_lines.append(f"id: {section_num}")
    frontmatter_lines.append(f'title: "{section_title}"')
    frontmatter_lines.append(f'sidebar_label: "{sidebar_label}"')
    frontmatter_lines.append(f"sidebar_position: {section_num + 1}")  # +1 because index.md is position 0
    frontmatter_lines.append(f"slug: /chapters/{chapter_num:02d}/{section_num:02d}")
    
    # Section-specific fields (only add description if it exists)
    if section_description:
        frontmatter_lines.append(f'section_description: "{section_description}"')
    
    # Reading times
    frontmatter_lines.append(f'reading_time_core: "{core_time}"')
    if optional_time != "0 min":
        frontmatter_lines.append(f'reading_time_optional: "{optional_time}"')
    
    # ADD PAGINATION CONTROL - This is the key fix!
    # Override Docusaurus pagination with our calculated document IDs
    if pagination["previous"] or pagination["next"]:
        frontmatter_lines.append("# Pagination control - override automatic sidebar-based pagination")
        if pagination["previous"]:
            frontmatter_lines.append(f'pagination_prev: {pagination["previous"]}')
        else:
            frontmatter_lines.append('pagination_prev: null')
        
        if pagination["next"]:
            frontmatter_lines.append(f'pagination_next: {pagination["next"]}')
        else:
            frontmatter_lines.append('pagination_next: null')
        
        logger.info(f"Added pagination control for section {section_num}: prev={pagination['previous']}, next={pagination['next']}")
    
    frontmatter_lines.append("---")
    frontmatter_lines.append("")  # Empty line after frontmatter
    
    result = "\n".join(frontmatter_lines)
    
    logger.info(f"Generated section frontmatter for {chapter_num}.{section_num} - {section_title}")
    if section_data and "description" in section_data:
        logger.debug(f"Section includes description: {section_description[:50]}...")
    
    return result

def extract_title_from_content(content: str) -> Optional[str]:
    """Extract title from markdown content.
    
    Args:
        content: Markdown content
        
    Returns:
        Extracted title or None
    """
    # Look for first h1 heading
    match = re.search(r'^#\s+(.*?)$', content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    return None

# Legacy function names for backward compatibility
def generate_frontmatter(chapter_num, section_num, title=None):
    """Legacy function - generates basic frontmatter without enhanced metadata."""
    logger = logging.getLogger("docusaurus.frontmatter")
    logger.warning("Using legacy frontmatter generation - enhanced metadata not available")
    
    # Determine section title
    if title:
        section_title = title
    elif section_num == 0:
        section_title = "Introduction"
    else:
        section_title = f"Section {section_num}"
    
    # Basic frontmatter without enhanced features or pagination control
    frontmatter = f"""---
id: {section_num}
title: "{section_title}"
sidebar_label: "{chapter_num}.{section_num} {section_title}"
sidebar_position: {section_num + 1}
slug: /chapters/{chapter_num:02d}/{section_num:02d}
# Basic pagination - may not work correctly with complex hierarchies
pagination_prev: null
pagination_next: null
---

"""
    logger.info(f"Generated basic frontmatter for section {section_num} with title '{section_title}'")
    return frontmatter

def create_index_frontmatter(chapter_num, chapter_title=None):
    """Legacy function - generates basic chapter frontmatter."""
    logger = logging.getLogger("docusaurus.frontmatter")
    logger.warning("Using legacy chapter frontmatter generation - enhanced metadata not available")
    
    if not chapter_title:
        chapter_title = f"Chapter {chapter_num}"
    
    frontmatter = f"""---
id: index
title: "{chapter_title}"
sidebar_label: "{chapter_num}. {chapter_title}"
sidebar_position: 0
---

"""
    logger.info(f"Generated basic index frontmatter with title '{chapter_title}'")
    return frontmatter
