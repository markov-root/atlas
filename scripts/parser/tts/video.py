# File: scripts/tts/video.py
import re
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("tts.video")

def remove_react_video_components(content: str) -> Tuple[str, int]:
    """Remove React Video components completely for TTS.
    
    Removes components like:
    <Video type="youtube" videoId="dhr4u-w75aQ" number="1" label="2.1" caption="AI Safety Overview" />
    <Video type="vimeo" videoId="123456" caption="Example video" />
    <Video type="url" src="https://example.com/video.mp4" />
    
    Args:
        content: The markdown content with React Video components
        
    Returns:
        Tuple of (processed_content, videos_removed_count)
    """
    videos_removed = 0
    
    # Pattern to match React Video components (both self-closing and container styles)
    
    # Pattern 1: Self-closing Video components <Video ... />
    self_closing_pattern = r'<Video\s+[^>]*?/>'
    
    def remove_self_closing_video(match):
        nonlocal videos_removed
        videos_removed += 1
        
        # Extract some info for logging
        video_match = match.group(0)
        type_match = re.search(r'type="([^"]*)"', video_match)
        video_id_match = re.search(r'videoId="([^"]*)"', video_match)
        src_match = re.search(r'src="([^"]*)"', video_match)
        number_match = re.search(r'number="([^"]*)"', video_match)
        caption_match = re.search(r'caption="([^"]*)"', video_match)
        
        video_type = type_match.group(1) if type_match else "unknown"
        video_id = video_id_match.group(1) if video_id_match else ""
        src_url = src_match.group(1) if src_match else ""
        number = number_match.group(1) if number_match else "unknown"
        caption = caption_match.group(1) if caption_match else ""
        
        # Log different info based on video type
        if video_type == "youtube" and video_id:
            logger.debug(f"Removing YouTube Video #{videos_removed}: number={number}, videoId={video_id}")
        elif video_type == "vimeo" and video_id:
            logger.debug(f"Removing Vimeo Video #{videos_removed}: number={number}, videoId={video_id}")
        elif video_type == "url" and src_url:
            logger.debug(f"Removing URL Video #{videos_removed}: number={number}, src={src_url[:50]}...")
        else:
            logger.debug(f"Removing Video #{videos_removed}: type={video_type}")
        
        if caption:
            logger.debug(f"  Caption: {caption[:50]}...")
        
        return ""  # Remove completely
    
    processed_content = re.sub(self_closing_pattern, remove_self_closing_video, content, flags=re.DOTALL)
    
    # Pattern 2: Container Video components <Video ...>...</Video> (just in case)
    container_pattern = r'<Video\s+[^>]*?>\s*.*?\s*</Video>'
    
    def remove_container_video(match):
        nonlocal videos_removed
        videos_removed += 1
        logger.debug(f"Removing container Video component #{videos_removed}")
        return ""  # Remove completely
    
    processed_content = re.sub(container_pattern, remove_container_video, processed_content, flags=re.DOTALL)
    
    return processed_content, videos_removed

def process(content: str, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for TTS video removal.
    
    Args:
        content: The markdown content with React Video components
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Removing React Video components for TTS conversion...")
    
    # Remove all React Video components
    processed_content, videos_removed = remove_react_video_components(content)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "video_removal.md"
        with open(debug_path, 'w', encoding='utf-8') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "videos_removed": videos_removed
    }
    
    if videos_removed > 0:
        logger.info(f"Video removal complete - {videos_removed} React Video components removed")
    else:
        logger.info("No React Video components found to remove")
    
    return processed_content, stats
