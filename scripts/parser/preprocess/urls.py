# scripts/preprocess/urls.py
import re
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any, List, Set
from urllib.parse import urlparse

# Get logger
logger = logging.getLogger("preprocess.urls")

def extract_urls(content: str) -> List[str]:
    """
    Extract all URLs from the content.
    
    Looks for URLs in:
    - Markdown links [text](url)
    - Bare URLs in text http://example.com
    - URLs in angle brackets <http://example.com>
    
    Returns a sorted list of unique URLs.
    """
    # URL patterns to extract
    patterns = [
        # Markdown links
        r'\[.*?\]\((https?://[^\s\)]+)',
        # Bare URLs
        r'(?<!\(|\[|<)(https?://[^\s\)\]>]+)',
        # URLs in angle brackets
        r'<(https?://[^\s>]+)>'
    ]
    
    # Collect all URLs
    urls = set()
    for pattern in patterns:
        for match in re.finditer(pattern, content):
            url = match.group(1).strip()
            # Remove trailing punctuation that might have been captured
            url = re.sub(r'[,.:;]+$', '', url)
            urls.add(url)
    
    # Sort URLs for consistent output
    return sorted(list(urls))

def categorize_urls(urls: List[str]) -> Dict[str, List[str]]:
    """
    Categorize URLs by domain.
    
    Returns a dictionary with domains as keys and lists of URLs as values.
    """
    categories = {}
    
    for url in urls:
        try:
            domain = urlparse(url).netloc
            if domain not in categories:
                categories[domain] = []
            categories[domain].append(url)
        except Exception as e:
            logger.warning(f"Error parsing URL {url}: {e}")
            continue
    
    return categories

def process(content: str, output_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """
    Process content to extract URLs and write them to sources.txt.
    
    Args:
        content: The markdown content to process
        output_dir: Directory for output files
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (unchanged content, stats_dict)
    """
    # Log start of processing
    logger.info("Extracting URLs from content...")
    
    # Extract URLs
    urls = extract_urls(content)
    
    # Categorize URLs by domain
    categorized = categorize_urls(urls)
    
    # Write URLs to sources.txt
    sources_path = output_dir / "sources.txt"
    with open(sources_path, 'w', encoding='utf-8') as f:
        for url in urls:
            f.write(f"{url}\n")
    
    # Write categorized URLs to a JSON file if debug dir is provided
    if debug_dir:
        import json
        debug_path = debug_dir / "urls.json"
        with open(debug_path, 'w', encoding='utf-8') as f:
            json.dump({
                "all_urls": urls,
                "by_domain": categorized
            }, f, indent=2)
    
    # Log results
    domain_count = len(categorized)
    logger.info(f"Found {len(urls)} unique URLs from {domain_count} domains")
    
    # Log up to 5 domains with URL counts
    if categorized:
        top_domains = sorted(categorized.items(), key=lambda x: len(x[1]), reverse=True)[:5]
        for domain, domain_urls in top_domains:
            logger.info(f"  - {domain}: {len(domain_urls)} URLs")
        
        if len(categorized) > 5:
            logger.info(f"  - ...and {len(categorized) - 5} more domains")
    
    logger.info(f"URLs written to {sources_path}")
    
    return content, {
        "url_count": len(urls),
        "domain_count": domain_count,
        "sources_file": str(sources_path)
    }
