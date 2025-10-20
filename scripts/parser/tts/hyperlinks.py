# File: scripts/tts/hyperlinks.py
import re
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("tts.hyperlinks")

def remove_markdown_links(content: str) -> Tuple[str, int]:
    """Remove markdown hyperlinks but preserve link text.
    
    Converts:
    - [link text](url) -> link text
    - [text](url "title") -> text
    
    Args:
        content: The markdown content to process
        
    Returns:
        Tuple of (processed_content, links_removed_count)
    """
    links_removed = 0
    
    def replace_link(match):
        nonlocal links_removed
        links_removed += 1
        link_text = match.group(1)
        logger.debug(f"Removing markdown link #{links_removed}: [{link_text}]")
        return link_text
    
    # Simple, safe pattern to match markdown links: [text](url)
    link_pattern = r'\[([^\[\]]*?)\]\([^)]+\)'
    
    try:
        processed_content = re.sub(link_pattern, replace_link, content)
    except Exception as e:
        logger.error(f"Error processing markdown links: {e}")
        return content, 0
    
    return processed_content, links_removed

def remove_citation_references(content: str) -> Tuple[str, int]:
    """Remove citation references in various formats."""
    citations_removed = 0
    
    def count_citation(match):
        nonlocal citations_removed
        citations_removed += 1
        logger.debug(f"Removing citation #{citations_removed}: {match.group(0)}")
        return ""
    
    processed_content = content
    
    # Pattern 1: Simple parentheses with years (2023) or (Author, 2023)
    try:
        year_pattern = r'\([^()]*(?:19|20)\d{2}[^()]*\)'
        processed_content = re.sub(year_pattern, count_citation, processed_content)
    except Exception as e:
        logger.warning(f"Error with year pattern: {e}")
    
    return processed_content, citations_removed

def remove_bare_urls(content: str) -> Tuple[str, int]:
    """Remove bare URLs from content."""
    urls_removed = 0
    
    def count_url(match):
        nonlocal urls_removed
        urls_removed += 1
        logger.debug(f"Removing bare URL #{urls_removed}: {match.group(0)}")
        return ""
    
    # Pattern for bare URLs (http/https)
    url_pattern = r'https?://[^\s<>\[\]()]+'
    
    try:
        processed_content = re.sub(url_pattern, count_url, content)
    except Exception as e:
        logger.warning(f"Error removing URLs: {e}")
        return content, 0
    
    return processed_content, urls_removed

def clean_spacing(content: str) -> str:
    """Clean up extra spaces and punctuation left after link removal."""
    try:
        # Remove double spaces
        content = re.sub(r'  +', ' ', content)
        
        # Fix spacing around punctuation
        content = re.sub(r'\s+([,.;!?])', r'\1', content)
        
        # Remove spaces at line starts/ends
        lines = content.split('\n')
        cleaned_lines = [line.strip() if line.strip() else line for line in lines]
        content = '\n'.join(cleaned_lines)
        
        # Remove excessive blank lines
        content = re.sub(r'\n{3,}', '\n\n', content)
    except Exception as e:
        logger.warning(f"Error cleaning spacing: {e}")
    
    return content

def process(content: str, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for TTS hyperlink and citation removal.
    
    Args:
        content: The markdown content to process
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Removing hyperlinks and citations for TTS format...")
    
    try:
        # Step 1: Remove markdown links but preserve text
        processed_content, links_removed = remove_markdown_links(content)
        
        if debug_dir:
            with open(debug_dir / "01_after_markdown_links.md", 'w', encoding='utf-8') as f:
                f.write(processed_content)
        
        # Step 2: Remove citation references
        processed_content, citations_removed = remove_citation_references(processed_content)
        
        if debug_dir:
            with open(debug_dir / "02_after_citations.md", 'w', encoding='utf-8') as f:
                f.write(processed_content)
        
        # Step 3: Remove bare URLs
        processed_content, urls_removed = remove_bare_urls(processed_content)
        
        if debug_dir:
            with open(debug_dir / "03_after_bare_urls.md", 'w', encoding='utf-8') as f:
                f.write(processed_content)
        
        # Step 4: Clean up spacing
        processed_content = clean_spacing(processed_content)
        
        # Save final debug output if requested
        if debug_dir:
            debug_path = debug_dir / "hyperlink_removal_final.md"
            with open(debug_path, 'w', encoding='utf-8') as f:
                f.write(processed_content)
            logger.info(f"Saved debug output to {debug_path}")
        
        stats = {
            "markdown_links_removed": links_removed,
            "citations_removed": citations_removed,
            "bare_urls_removed": urls_removed,
            "total_hyperlinks_removed": links_removed + citations_removed + urls_removed
        }
        
        total_removed = stats["total_hyperlinks_removed"]
        if total_removed > 0:
            logger.info(f"Hyperlink removal complete - {total_removed} items removed "
                       f"({links_removed} links, {citations_removed} citations, {urls_removed} URLs)")
        else:
            logger.info("No hyperlinks or citations found to remove")
        
        return processed_content, stats
        
    except Exception as e:
        logger.error(f"Error in hyperlinks processing: {e}")
        return content, {
            "markdown_links_removed": 0,
            "citations_removed": 0,
            "bare_urls_removed": 0,
            "total_hyperlinks_removed": 0
        }
