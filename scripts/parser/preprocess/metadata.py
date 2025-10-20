# scripts/preprocess/metadata.py
import re
import json
import logging
from pathlib import Path
from typing import Dict, Optional, Any, Tuple, List

# Get logger
logger = logging.getLogger("preprocess.metadata")

def extract_chapter_info(content: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract chapter number and title from the content."""
    chapter_pattern = r'^#\s*Chapter\s+(\d+)\s*[-–—]\s*(.+?)$'
    
    # Look for the chapter heading in the first few lines
    for line in content.split('\n')[:10]:  # Check first 10 lines
        match = re.match(chapter_pattern, line.strip())
        if match:
            return match.group(1), match.group(2).strip()
    
    return None, None

def parse_list_from_text(text: str) -> List[str]:
    """Parse a comma-separated list into individual items."""
    # Split by commas and clean up
    items = [item.strip() for item in re.split(r'[,;\n]', text)]
    # Filter out empty entries
    return [item for item in items if item]

def extract_metadata_section(content: str) -> Optional[str]:
    """Extract the entire metadata section from the content."""
    pattern = r'<metadata>(.*?)</metadata>'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        logger.debug("Found <metadata> section")
        return match.group(1).strip()
    logger.debug("No <metadata> section found")
    return None

def extract_arxiv_section(content: str) -> Optional[str]:
    """Extract the entire arxiv metadata section from the content."""
    pattern = r'<metadata-arxiv>(.*?)</metadata-arxiv>'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        logger.debug("Found <metadata-arxiv> section")
        return match.group(1).strip()
    logger.debug("No <metadata-arxiv> section found")
    return None

def process_links(text: str) -> Dict[str, str]:
    """Extract markdown links from text and convert to a dictionary.
    
    [Arxiv](https://arxiv.org/abs/2505.05541) becomes {"arxiv": "https://arxiv.org/abs/2505.05541"}
    """
    links = {}
    link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    
    for match in re.finditer(link_pattern, text):
        text, url = match.groups()
        # Convert the text to a key name (lowercase, no spaces)
        key = text.strip().lower().replace(' ', '_')
        links[key] = url.strip()
    
    logger.debug(f"Found {len(links)} links in metadata")
    return links

def extract_arxiv_metadata(arxiv_section: str) -> Dict[str, Any]:
    """Extract ArXiv metadata properly handling nested tags."""
    arxiv_metadata = {}
    
    # Extract paper title
    title_match = re.search(r'<paper-title>(.*?)(?=<paper-subtitle>|<paper-abstract>|<paper-authors>|<paper-date>|<paper-url>|$)', 
                            arxiv_section, re.DOTALL)
    if title_match:
        arxiv_metadata["title"] = title_match.group(1).strip()
    
    # Extract paper subtitle
    subtitle_match = re.search(r'<paper-subtitle>(.*?)(?=<paper-title>|<paper-abstract>|<paper-authors>|<paper-date>|<paper-url>|$)', 
                               arxiv_section, re.DOTALL)
    if subtitle_match:
        arxiv_metadata["subtitle"] = subtitle_match.group(1).strip()
    
    # Extract paper abstract
    abstract_match = re.search(r'<paper-abstract>(.*?)(?=<paper-title>|<paper-subtitle>|<paper-authors>|<paper-date>|<paper-url>|$)', 
                               arxiv_section, re.DOTALL)
    if abstract_match:
        arxiv_metadata["abstract"] = abstract_match.group(1).strip()
    
    # Extract paper authors
    authors_match = re.search(r'<paper-authors>(.*?)(?=<paper-title>|<paper-subtitle>|<paper-abstract>|<paper-date>|<paper-url>|$)', 
                              arxiv_section, re.DOTALL)
    if authors_match:
        arxiv_metadata["authors"] = authors_match.group(1).strip()
    
    # Extract paper date
    date_match = re.search(r'<paper-date>(.*?)(?=<paper-title>|<paper-subtitle>|<paper-abstract>|<paper-authors>|<paper-url>|$)', 
                           arxiv_section, re.DOTALL)
    if date_match:
        arxiv_metadata["date"] = date_match.group(1).strip()
    
    # Extract paper URL
    url_match = re.search(r'<paper-url>(.*?)(?=<paper-title>|<paper-subtitle>|<paper-abstract>|<paper-authors>|<paper-date>|$)', 
                          arxiv_section, re.DOTALL)
    if url_match:
        arxiv_metadata["url"] = url_match.group(1).strip()
    
    logger.debug(f"Extracted {len(arxiv_metadata)} arXiv metadata fields")
    return arxiv_metadata

def extract_metadata(content: str) -> Dict[str, Any]:
    """Extract all metadata from the content."""
    chapter_num, chapter_title = extract_chapter_info(content)
    
    metadata = {
        "chapter": {
            "number": int(chapter_num) if chapter_num else None,
            "title": chapter_title
        }
    }
    
    # Log chapter info
    if chapter_num and chapter_title:
        logger.info(f"Found chapter info: Chapter {chapter_num} - {chapter_title}")
    else:
        logger.warning("No chapter number or title found")
    
    # Extract metadata section
    metadata_section = extract_metadata_section(content)
    if metadata_section:
        logger.info("Processing <metadata> section...")
        
        # Extract authors
        authors_match = re.search(r'<authors>(.*?)(?=<affiliations>|<acknowledgements>|<links>|$)', 
                                 metadata_section, re.DOTALL)
        if authors_match:
            authors_text = authors_match.group(1).strip()
            metadata["authors"] = parse_list_from_text(authors_text)
            logger.info(f"Found {len(metadata['authors'])} authors")
            if metadata['authors']:
                first_few = metadata['authors'][:3]
                logger.info(f"  Authors: {', '.join(first_few)}" + 
                           (f" and {len(metadata['authors']) - 3} more" if len(metadata['authors']) > 3 else ""))
        
        # Extract affiliations
        affiliations_match = re.search(r'<affiliations>(.*?)(?=<authors>|<acknowledgements>|<links>|$)', 
                                      metadata_section, re.DOTALL)
        if affiliations_match:
            affiliations_text = affiliations_match.group(1).strip()
            metadata["affiliations"] = parse_list_from_text(affiliations_text)
            logger.info(f"Found {len(metadata.get('affiliations', []))} affiliations")
        
        # Extract acknowledgements
        ack_match = re.search(r'<acknowledgements>(.*?)(?=<authors>|<affiliations>|<links>|$)', 
                             metadata_section, re.DOTALL)
        if ack_match:
            ack_text = ack_match.group(1).strip()
            metadata["acknowledgements"] = parse_list_from_text(ack_text)
            logger.info(f"Found {len(metadata.get('acknowledgements', []))} acknowledgements")
        
        # Extract links
        links_match = re.search(r'<links>(.*?)(?=<authors>|<affiliations>|<acknowledgements>|$)', 
                               metadata_section, re.DOTALL)
        if links_match:
            links_text = links_match.group(1).strip()
            metadata["links"] = process_links(links_text)
            logger.info(f"Found {len(metadata.get('links', {}))} links")
    else:
        logger.warning("No <metadata> section found")
    
    # Extract arXiv metadata
    arxiv_section = extract_arxiv_section(content)
    if arxiv_section:
        logger.info("Processing <metadata-arxiv> section...")
        arxiv_metadata = extract_arxiv_metadata(arxiv_section)
        if arxiv_metadata:
            metadata["arxiv"] = arxiv_metadata
            if "title" in arxiv_metadata:
                logger.info(f"Found arXiv paper: {arxiv_metadata['title']}")
            if "authors" in arxiv_metadata:
                logger.info(f"Found arXiv authors: {arxiv_metadata['authors']}")
    else:
        logger.debug("No <metadata-arxiv> section found")
    
    return metadata

def process(content: str, output_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Process metadata in the content and save to a JSON file.
    
    Args:
        content: The markdown content to process
        output_dir: Directory to save the JSON file
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, metadata_dict)
    """
    logger.info("Processing metadata...")
    
    # Extract metadata
    metadata = extract_metadata(content)
    
    # Save metadata to JSON file
    chapter_num = metadata["chapter"]["number"]
    json_path = output_dir / f"chapter_{chapter_num}_metadata.json5"
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "metadata.json5"
        with open(debug_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
    
    # Remove metadata sections from content
    logger.info("Removing metadata sections from content...")
    
    content = re.sub(r'<metadata>.*?</metadata>\s*', '', content, flags=re.DOTALL)
    content = re.sub(r'<metadata-arxiv>.*?</metadata-arxiv>\s*', '', content, flags=re.DOTALL)
    
    # Also remove the chapter heading
    content = re.sub(r'^#\s*Chapter\s+\d+\s*[-–—].*?\n', '', content)
    
    # Clean up extra newlines
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    logger.info(f"Metadata processing complete, saved to {json_path}")
    
    return content, metadata
