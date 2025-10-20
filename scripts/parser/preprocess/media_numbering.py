# scripts/preprocess/media_numbering.py
import re
import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any, List
from urllib.parse import urlparse

# Get logger
logger = logging.getLogger("preprocess.media_numbering")

def extract_youtube_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various YouTube URL formats."""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]+)',
        r'youtube\.com.*[?&]v=([a-zA-Z0-9_-]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def extract_vimeo_id(url: str) -> Optional[str]:
    """Extract Vimeo video ID from Vimeo URL."""
    patterns = [
        r'vimeo\.com/(\d+)',
        r'player\.vimeo\.com/video/(\d+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def detect_video_platform(url: str) -> Dict[str, Any]:
    """Detect video platform and extract relevant IDs."""
    try:
        parsed_url = urlparse(url)
        domain = parsed_url.netloc.lower()
        
        # YouTube detection
        if 'youtube.com' in domain or 'youtu.be' in domain:
            video_id = extract_youtube_id(url)
            return {
                "platform": "youtube",
                "video_id": video_id,
                "embed_url": f"https://www.youtube.com/embed/{video_id}" if video_id else None
            }
        
        # Vimeo detection
        elif 'vimeo.com' in domain:
            video_id = extract_vimeo_id(url)
            return {
                "platform": "vimeo", 
                "video_id": video_id,
                "embed_url": f"https://player.vimeo.com/video/{video_id}" if video_id else None
            }
        
        # Odysee detection
        elif 'odysee.com' in domain:
            return {
                "platform": "odysee",
                "video_id": None,
                "embed_url": url
            }
        
        # Generic/unknown platform
        else:
            return {
                "platform": "generic",
                "video_id": None,
                "embed_url": url
            }
            
    except Exception as e:
        logger.warning(f"Error parsing video URL {url}: {e}")
        return {
            "platform": "unknown",
            "video_id": None,
            "embed_url": url
        }

def find_iframe_static_blocks(content: str) -> List[Dict[str, Any]]:
    """Find all iframe-static-figure blocks and extract their content."""
    static_blocks = []
    
    # Pattern to match iframe-static-figure blocks
    static_pattern = r'<iframe-static-figure>\s*(.*?)\s*</iframe-static-figure>'
    
    for match in re.finditer(static_pattern, content, re.DOTALL):
        block_content = match.group(1).strip()
        
        # Extract image from the block content
        img_pattern = r'!\[([^\]]*)\]\(([^)]+)\)'
        img_match = re.search(img_pattern, block_content)
        
        if img_match:
            alt_text = img_match.group(1)
            img_path = img_match.group(2)
            
            static_blocks.append({
                "full_match": match.group(0),
                "img_path": img_path,
                "alt_text": alt_text,
                "start_pos": match.start(),
                "end_pos": match.end()
            })
            
            logger.debug(f"Found iframe static block with image: {img_path}")
        else:
            logger.error(f"Invalid iframe-static-figure block content: {block_content[:50]}...")
            raise ValueError(f"iframe-static-figure block contains invalid content: {block_content}")
    
    return static_blocks

def find_iframe_elements(content: str, static_blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Find iframe elements and match them with their static figures."""
    iframe_elements = []
    
    # Pattern to match iframe + optional caption
    iframe_pattern = r'<iframe([^>]*)>\s*</iframe>\s*(?:<iframe-caption>\s*(.*?)\s*</iframe-caption>)?'
    
    for match in re.finditer(iframe_pattern, content, re.DOTALL):
        iframe_attrs = match.group(1).strip()
        caption = match.group(2).strip() if match.group(2) else ""
        
        # Extract src attribute
        src_match = re.search(r'src="([^"]*)"', iframe_attrs)
        iframe_src = src_match.group(1) if src_match else ""
        
        if not iframe_src:
            logger.warning(f"Iframe found without src attribute: {iframe_attrs}")
            continue
        
        # Find associated static block (should be immediately before this iframe)
        associated_static = None
        iframe_start = match.start()
        
        # Look for static block that ends just before this iframe (with some whitespace tolerance)
        for static_block in static_blocks:
            # Check if static block ends within 100 characters before iframe starts
            if static_block["end_pos"] <= iframe_start <= static_block["end_pos"] + 100:
                associated_static = static_block
                break
        
        if not caption:
            logger.warning(f"Iframe found without caption: {iframe_src}")
        
        iframe_data = {
            "iframe_src": iframe_src,
            "caption": caption,
            "static_figure": associated_static,
            "match_start": match.start(),
            "match_end": match.end()
        }
        
        iframe_elements.append(iframe_data)
        logger.debug(f"Found iframe: {iframe_src}")
        
        if associated_static:
            logger.debug(f"  Associated with static figure: {associated_static['img_path']}")
    
    return iframe_elements

def find_figure_elements(content: str, static_blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Find figure elements, excluding those in static blocks."""
    figure_elements = []
    
    # Get all static figure paths to exclude
    static_paths = {block["img_path"] for block in static_blocks}
    
    # Pattern to match image + optional caption
    figure_pattern = r'!\[([^\]]*)\]\(([^)]+)\)\s*(?:\n*<figure-caption>\s*(.*?)\s*</figure-caption>)?'
    
    for match in re.finditer(figure_pattern, content, re.DOTALL):
        alt_text = match.group(1)
        img_path = match.group(2)
        caption = match.group(3).strip() if match.group(3) else ""
        
        # Skip if this image is part of a static block
        if img_path in static_paths:
            logger.debug(f"Skipping figure {img_path} (part of iframe static block)")
            continue
        
        if not caption:
            logger.warning(f"Figure found without caption: {img_path}")
        
        figure_data = {
            "file_path": img_path,
            "alt_text": alt_text,
            "caption": caption,
            "match_start": match.start(),
            "match_end": match.end()
        }
        
        figure_elements.append(figure_data)
        logger.debug(f"Found figure: {img_path}")
    
    return figure_elements

def find_video_elements(content: str) -> List[Dict[str, Any]]:
    """Find video elements."""
    video_elements = []
    
    # Pattern to match video + optional caption
    video_pattern = r'<video>\s*(.*?)\s*</video>\s*(?:<video-caption>\s*(.*?)\s*</video-caption>)?'
    
    for match in re.finditer(video_pattern, content, re.DOTALL):
        video_url = match.group(1).strip()
        caption = match.group(2).strip() if match.group(2) else ""
        
        # Clean up URL - handle markdown link syntax
        url_match = re.match(r'\[([^\]]+)\]\([^)]*\)', video_url)
        if url_match:
            video_url = url_match.group(1)
        
        if not caption:
            logger.warning(f"Video found without caption: {video_url}")
        
        # Detect platform and extract metadata
        platform_info = detect_video_platform(video_url)
        
        video_data = {
            "url": video_url,
            "caption": caption,
            "platform": platform_info["platform"],
            "video_id": platform_info["video_id"],
            "embed_url": platform_info["embed_url"],
            "match_start": match.start(),
            "match_end": match.end()
        }
        
        video_elements.append(video_data)
        logger.debug(f"Found video: {video_url} (platform: {platform_info['platform']})")
    
    return video_elements

def find_definition_elements(content: str) -> List[Dict[str, Any]]:
    """Find definition elements."""
    definition_elements = []
    
    # Pattern to match definition blocks with term, source, and content
    # Note: <term> and <source> don't have closing tags, but <content> does
    definition_pattern = r'<definition>\s*(?:<term>\s*(.*?)\s*(?=<source>|<content>))?\s*(?:<source>\s*(.*?)\s*(?=<content>))?\s*<content>\s*(.*?)\s*</content>\s*</definition>'
    
    for match in re.finditer(definition_pattern, content, re.DOTALL):
        term = match.group(1).strip() if match.group(1) else ""
        source = match.group(2).strip() if match.group(2) else ""
        definition_content = match.group(3).strip() if match.group(3) else ""
        
        if not term:
            logger.warning(f"Definition found without term at position {match.start()}")
            term = "Untitled Definition"
        
        if not definition_content:
            logger.warning(f"Definition '{term}' found without content")
        
        definition_data = {
            "term": term,
            "source": source,
            "content": definition_content,
            "match_start": match.start(),
            "match_end": match.end()
        }
        
        definition_elements.append(definition_data)
        logger.debug(f"Found definition: {term}")
        if source:
            logger.debug(f"  With source: {source}")
    
    return definition_elements

def validate_static_iframe_pairing(static_blocks: List[Dict[str, Any]], iframe_elements: List[Dict[str, Any]]) -> None:
    """Validate that all static blocks have corresponding iframes."""
    # Find static blocks without associated iframes
    associated_static_blocks = {iframe["static_figure"]["img_path"] for iframe in iframe_elements if iframe["static_figure"]}
    all_static_paths = {block["img_path"] for block in static_blocks}
    
    orphaned_static = all_static_paths - associated_static_blocks
    
    if orphaned_static:
        logger.error(f"Found orphaned iframe-static-figure blocks without corresponding iframes:")
        for path in orphaned_static:
            logger.error(f"  - {path}")
        raise ValueError(f"Found {len(orphaned_static)} orphaned iframe-static-figure blocks. Please fix source content.")

def create_media_registry(chapter_num: int, figures: List[Dict[str, Any]], 
                         videos: List[Dict[str, Any]], iframes: List[Dict[str, Any]],
                         definitions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Create the media registry with numbered entries."""
    
    registry = {
        "chapter_number": chapter_num,
        "media_counts": {
            "figures": len(figures),
            "videos": len(videos), 
            "iframes": len(iframes),
            "definitions": len(definitions)
        },
        "media_registry": []
    }
    
    # Add figures
    for i, figure in enumerate(figures, 1):
        registry["media_registry"].append({
            "type": "figure",
            "number": i,
            "label": f"{chapter_num}.{i}",
            "file_path": figure["file_path"],
            "alt_text": figure["alt_text"],
            "caption": figure["caption"]
        })
    
    # Add videos
    for i, video in enumerate(videos, 1):
        registry["media_registry"].append({
            "type": "video",
            "number": i,
            "label": f"{chapter_num}.{i}",
            "url": video["url"],
            "platform": video["platform"],
            "video_id": video["video_id"],
            "embed_url": video["embed_url"],
            "caption": video["caption"]
        })
    
    # Add iframes
    for i, iframe in enumerate(iframes, 1):
        iframe_entry = {
            "type": "iframe",
            "number": i,
            "label": f"{chapter_num}.{i}",
            "iframe_src": iframe["iframe_src"],
            "caption": iframe["caption"]
        }
        
        # Add static figure info if present
        if iframe["static_figure"]:
            iframe_entry["static_figure_path"] = iframe["static_figure"]["img_path"]
            iframe_entry["static_figure_alt"] = iframe["static_figure"]["alt_text"]
        
        registry["media_registry"].append(iframe_entry)
    
    # Add definitions
    for i, definition in enumerate(definitions, 1):
        definition_entry = {
            "type": "definition",
            "number": i,
            "label": f"{chapter_num}.{i}",
            "term": definition["term"],
            "source": definition["source"],
            "content": definition["content"]
        }
        
        registry["media_registry"].append(definition_entry)
    
    return registry

def get_chapter_number(output_dir: Path) -> int:
    """Get chapter number from metadata file."""
    # Try to find metadata file
    metadata_files = list(output_dir.glob("chapter_*_metadata.json5"))
    metadata_file = output_dir / "metadata.json5"
    
    if metadata_file.exists():
        metadata_path = metadata_file
    elif metadata_files:
        metadata_path = metadata_files[0]
    else:
        logger.warning("No metadata file found, defaulting to chapter 0")
        return 0
    
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
            return metadata.get("chapter", {}).get("number", 0)
    except Exception as e:
        logger.error(f"Error reading chapter number from metadata: {e}")
        return 0

def process(content: str, output_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """
    Process content to create media numbering registry.
    
    Args:
        content: The markdown content to process
        output_dir: Directory for output files
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (unchanged content, stats_dict)
    """
    # Log start of processing
    logger.info("Creating media numbering registry...")
    
    # Get chapter number
    chapter_num = get_chapter_number(output_dir)
    logger.info(f"Processing media for chapter {chapter_num}")
    
    try:
        # Step 1: Find iframe static blocks
        static_blocks = find_iframe_static_blocks(content)
        logger.info(f"Found {len(static_blocks)} iframe static blocks")
        
        # Step 2: Find iframe elements and match with static blocks
        iframe_elements = find_iframe_elements(content, static_blocks)
        logger.info(f"Found {len(iframe_elements)} iframe elements")
        
        # Step 3: Validate static-iframe pairing
        validate_static_iframe_pairing(static_blocks, iframe_elements)
        
        # Step 4: Find figure elements (excluding static ones)
        figure_elements = find_figure_elements(content, static_blocks)
        logger.info(f"Found {len(figure_elements)} figure elements")
        
        # Step 5: Find video elements
        video_elements = find_video_elements(content)
        logger.info(f"Found {len(video_elements)} video elements")
        
        # Step 6: Find definition elements
        definition_elements = find_definition_elements(content)
        logger.info(f"Found {len(definition_elements)} definition elements")
        
        # Step 7: Create media registry
        registry = create_media_registry(chapter_num, figure_elements, video_elements, iframe_elements, definition_elements)
        
        # Step 8: Save registry
        registry_path = output_dir / "media_registry.json"
        with open(registry_path, 'w', encoding='utf-8') as f:
            json.dump(registry, f, indent=2)
        
        logger.info(f"Created media registry: {registry_path}")
        logger.info(f"Registry contains: {len(figure_elements)} figures, {len(video_elements)} videos, {len(iframe_elements)} iframes, {len(definition_elements)} definitions")
        
        # Save debug output if requested
        if debug_dir:
            debug_path = debug_dir / "media_numbering.json"
            debug_data = {
                "registry": registry,
                "static_blocks": static_blocks,
                "processing_stats": {
                    "static_blocks_found": len(static_blocks),
                    "figures_processed": len(figure_elements),
                    "videos_processed": len(video_elements),
                    "iframes_processed": len(iframe_elements),
                    "definitions_processed": len(definition_elements)
                }
            }
            with open(debug_path, 'w', encoding='utf-8') as f:
                json.dump(debug_data, f, indent=2)
        
        # Prepare stats
        stats = {
            "chapter_number": chapter_num,
            "figures_count": len(figure_elements),
            "videos_count": len(video_elements),
            "iframes_count": len(iframe_elements),
            "definitions_count": len(definition_elements),
            "static_blocks_count": len(static_blocks),
            "registry_file": str(registry_path)
        }
        
        logger.info("Media numbering registry creation complete")
        
        return content, stats
        
    except Exception as e:
        logger.error(f"Error creating media registry: {e}")
        raise
