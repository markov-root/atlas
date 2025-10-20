# scripts/docusaurus/video.py
import logging
import re
import json
from pathlib import Path
from urllib.parse import urlparse
from .component import register_component

def load_media_registry(processed_dir):
    """Load media registry from preprocessed directory.
    
    Args:
        processed_dir: Base processed directory
        
    Returns:
        dict: Media registry data, or empty dict if not found
    """
    logger = logging.getLogger("docusaurus.component.video")
    
    if not processed_dir:
        logger.warning("No processed_dir provided, cannot load media registry")
        return {}
    
    registry_path = processed_dir / "preprocessed" / "media_registry.json"
    
    if not registry_path.exists():
        logger.warning(f"Media registry not found at {registry_path}")
        return {}
    
    try:
        with open(registry_path, 'r', encoding='utf-8') as f:
            registry = json.load(f)
        
        video_count = len([entry for entry in registry.get('media_registry', []) if entry['type'] == 'video'])
        logger.info(f"Loaded media registry with {video_count} video entries")
        return registry
    except Exception as e:
        logger.error(f"Error loading media registry: {e}")
        return {}

def create_video_lookup(media_registry):
    """Create a lookup dictionary for videos by URL.
    
    Args:
        media_registry: Media registry data
        
    Returns:
        dict: Mapping of video URLs to video data
    """
    video_lookup = {}
    
    for entry in media_registry.get("media_registry", []):
        if entry["type"] == "video":
            # Use original URL as the key for lookup
            video_url = entry["url"]
            video_lookup[video_url] = entry
    
    return video_lookup

@register_component('video')
def process_video(content, processed_dir=None):
    """Process video components in content using media registry for numbering.
    
    This processor handles:
    1. <video> blocks with URLs and optional captions
    2. Converts YouTube, Vimeo, and other video URLs to appropriate embed components
    
    Args:
        content: Content to process
        processed_dir: Base processed directory for loading media registry
        
    Returns:
        tuple: (processed_content, imports_list)
    """
    logger = logging.getLogger("docusaurus.component.video")
    
    # Load media registry
    media_registry = load_media_registry(processed_dir)
    video_lookup = create_video_lookup(media_registry)
    logger.info(f"Created video lookup with {len(video_lookup)} entries")
    
    # Track what we process
    video_count = 0
    
    # Pattern to match video blocks with optional captions
    # Matches: <video>URL</video> optionally followed by <video-caption>caption</video-caption>
    video_pattern = r'<video>\s*(.*?)\s*</video>\s*(?:<video-caption>\s*(.*?)\s*</video-caption>)?'
    
    def process_video_block(match):
        nonlocal video_count
        video_count += 1
        
        # Extract URL and optional caption
        video_url = match.group(1).strip()
        video_caption = match.group(2).strip() if match.group(2) else ""
        
        logger.info(f"Processing video #{video_count}: {video_url}")
        if video_caption:
            logger.info(f"  With caption: {video_caption}")
        
        # Clean up the URL - remove markdown link syntax if present
        # Handle cases like [https://www.youtube.com/watch?v=jwSbzNHGflM](null)
        url_match = re.match(r'\[([^\]]+)\]\([^)]*\)', video_url)
        if url_match:
            video_url = url_match.group(1)
            logger.info(f"  Extracted URL from markdown syntax: {video_url}")
        
        # Look up video data in registry
        video_data = video_lookup.get(video_url)
        
        if video_data:
            video_number = video_data["number"]
            video_label = video_data["label"]
            platform = video_data["platform"]
            video_id = video_data["video_id"]
            
            logger.info(f"Found video in registry (Video {video_label}): {video_url}")
            logger.info(f"  Platform: {platform}, Video ID: {video_id}")
            
            # Create video component with registry data
            if platform == "youtube" and video_id:
                return create_youtube_component(video_id, video_caption, video_number, video_label)
            elif platform == "vimeo" and video_id:
                return create_vimeo_component(video_id, video_caption, video_number, video_label)
            else:
                return create_generic_video_component(video_url, video_caption, video_number, video_label)
        else:
            logger.warning(f"Video not found in registry: {video_url}")
            
            # Fallback: Try to detect platform manually
            try:
                parsed_url = urlparse(video_url)
                domain = parsed_url.netloc.lower()
                
                # YouTube processing
                if 'youtube.com' in domain or 'youtu.be' in domain:
                    video_id = extract_youtube_id(video_url)
                    if video_id:
                        logger.info(f"  Detected YouTube video: {video_id}")
                        return create_youtube_component(video_id, video_caption)
                    else:
                        logger.warning(f"  Could not extract YouTube video ID from: {video_url}")
                        return create_generic_video_component(video_url, video_caption)
                
                # Vimeo processing
                elif 'vimeo.com' in domain:
                    video_id = extract_vimeo_id(video_url)
                    if video_id:
                        logger.info(f"  Detected Vimeo video: {video_id}")
                        return create_vimeo_component(video_id, video_caption)
                    else:
                        logger.warning(f"  Could not extract Vimeo video ID from: {video_url}")
                        return create_generic_video_component(video_url, video_caption)
                
                # Generic video processing (direct video files, other platforms)
                else:
                    logger.info(f"  Detected generic video URL: {video_url}")
                    return create_generic_video_component(video_url, video_caption)
                    
            except Exception as e:
                logger.error(f"  Error parsing video URL {video_url}: {e}")
                return create_generic_video_component(video_url, video_caption)
    
    # Process all video blocks
    processed_content = re.sub(video_pattern, process_video_block, content, flags=re.DOTALL)
    
    # Log results
    if video_count > 0:
        logger.info(f"Processed {video_count} video blocks")
    else:
        logger.info("No video blocks found")
    
    # Return imports if videos were processed
    if video_count > 0:
        imports = ['import Video from "@site/src/components/chapters/Video";']
        return processed_content, imports
    else:
        return processed_content, []

def extract_youtube_id(url):
    """Extract YouTube video ID from various YouTube URL formats.
    
    Supports:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    
    Args:
        url: YouTube URL
        
    Returns:
        str or None: Video ID if found
    """
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]+)',
        r'youtube\.com.*[?&]v=([a-zA-Z0-9_-]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None

def extract_vimeo_id(url):
    """Extract Vimeo video ID from Vimeo URL.
    
    Supports:
    - https://vimeo.com/VIDEO_ID
    - https://player.vimeo.com/video/VIDEO_ID
    
    Args:
        url: Vimeo URL
        
    Returns:
        str or None: Video ID if found
    """
    patterns = [
        r'vimeo\.com/(\d+)',
        r'player\.vimeo\.com/video/(\d+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None

def create_youtube_component(video_id, caption="", video_number=None, video_label=None):
    """Create a YouTube video component.
    
    Args:
        video_id: YouTube video ID
        caption: Optional caption
        video_number: Sequential video number from registry
        video_label: Formatted video label from registry (e.g., "5.1")
        
    Returns:
        str: YouTube video component JSX
    """
    props = [f'type="youtube"', f'videoId="{video_id}"']
    
    # Add number and label if available from registry
    if video_number is not None:
        props.append(f'number="{video_number}"')
    
    if video_label is not None:
        props.append(f'label="{video_label}"')
    
    if caption:
        # Escape quotes in caption
        caption = caption.replace('"', '\\"')
        props.append(f'caption="{caption}"')
    
    props_string = ' '.join(props)
    return f'<Video {props_string} />'

def create_vimeo_component(video_id, caption="", video_number=None, video_label=None):
    """Create a Vimeo video component.
    
    Args:
        video_id: Vimeo video ID
        caption: Optional caption
        video_number: Sequential video number from registry
        video_label: Formatted video label from registry (e.g., "5.1")
        
    Returns:
        str: Vimeo video component JSX
    """
    props = [f'type="vimeo"', f'videoId="{video_id}"']
    
    # Add number and label if available from registry
    if video_number is not None:
        props.append(f'number="{video_number}"')
    
    if video_label is not None:
        props.append(f'label="{video_label}"')
    
    if caption:
        # Escape quotes in caption
        caption = caption.replace('"', '\\"')
        props.append(f'caption="{caption}"')
    
    props_string = ' '.join(props)
    return f'<Video {props_string} />'

def create_generic_video_component(url, caption="", video_number=None, video_label=None):
    """Create a generic video component for direct video files or other platforms.
    
    Args:
        url: Video URL
        caption: Optional caption
        video_number: Sequential video number from registry
        video_label: Formatted video label from registry (e.g., "5.1")
        
    Returns:
        str: Generic video component JSX
    """
    # Escape quotes in URL
    url = url.replace('"', '\\"')
    
    props = [f'type="url"', f'src="{url}"']
    
    # Add number and label if available from registry
    if video_number is not None:
        props.append(f'number="{video_number}"')
    
    if video_label is not None:
        props.append(f'label="{video_label}"')
    
    if caption:
        caption = caption.replace('"', '\\"')
        props.append(f'caption="{caption}"')
    
    props_string = ' '.join(props)
    return f'<Video {props_string} />'
