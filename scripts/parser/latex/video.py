# File: scripts/latex/video.py
import re
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("latex.video")

def process_video_blocks(content: str) -> Tuple[str, int]:
    """Remove video blocks since LaTeX cannot display video content.
    
    Removes:
    - <video>URL</video> blocks
    - <video-caption>caption</video-caption> blocks
    - The combination of both
    
    Optionally adds a note about video content being available in web version.
    """
    
    video_count = 0
    
    # Pattern 1: Video + caption combination
    video_with_caption_pattern = r'<video>\s*(.*?)\s*</video>\s*<video-caption>\s*(.*?)\s*</video-caption>'
    
    def remove_video_with_caption(match):
        nonlocal video_count
        video_count += 1
        
        video_url = match.group(1).strip()
        caption = match.group(2).strip()
        
        logger.debug(f"Removing video #{video_count} with caption")
        logger.debug(f"  URL: {video_url}")
        logger.debug(f"  Caption: {caption[:50]}...")
        
        # Option 1: Complete removal (silent)
        return ""
        
        # Option 2: Add a note about missing video (uncomment if desired)
        # return f"\\textit{{[Video content available in web version: {caption}]}}\n\n"
    
    # Apply video + caption removal
    processed_content = re.sub(video_with_caption_pattern, remove_video_with_caption, content, flags=re.DOTALL)
    
    # Pattern 2: Standalone video blocks (without captions)
    standalone_video_pattern = r'<video>\s*(.*?)\s*</video>(?!\s*<video-caption>)'
    
    def remove_standalone_video(match):
        nonlocal video_count
        video_count += 1
        
        video_url = match.group(1).strip()
        
        logger.debug(f"Removing standalone video #{video_count}")
        logger.debug(f"  URL: {video_url}")
        
        # Complete removal
        return ""
    
    # Apply standalone video removal
    processed_content = re.sub(standalone_video_pattern, remove_standalone_video, processed_content, flags=re.DOTALL)
    
    # Pattern 3: Orphaned video captions (captions without videos)
    orphan_caption_pattern = r'<video-caption>\s*(.*?)\s*</video-caption>'
    
    def remove_orphan_caption(match):
        caption = match.group(1).strip()
        logger.debug(f"Removing orphaned video caption: {caption[:50]}...")
        return ""
    
    # Apply orphan caption removal
    processed_content = re.sub(orphan_caption_pattern, remove_orphan_caption, processed_content, flags=re.DOTALL)
    
    # Clean up extra newlines
    processed_content = re.sub(r'\n{3,}', '\n\n', processed_content)
    
    return processed_content, video_count

def process(content: str, processed_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for LaTeX video removal.
    
    Args:
        content: The markdown content to process
        processed_dir: Base processed directory (not used in this module)
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Removing video content for LaTeX conversion...")
    
    # Remove all video blocks
    processed_content, video_count = process_video_blocks(content)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "videos.tex"
        with open(debug_path, 'w', encoding='utf-8', errors='replace') as f:
            f.write(processed_content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "videos_removed": video_count
    }
    
    logger.info(f"Video removal complete - {video_count} video blocks removed")
    
    return processed_content, stats
