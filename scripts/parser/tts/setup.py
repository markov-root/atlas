# File: scripts/tts/setup.py
import os
import shutil
import logging
from pathlib import Path
from datetime import datetime

# Get logger
logger = logging.getLogger("tts.setup")

def extract_chapter_number(processed_dir):
    """Extract chapter number from preprocessed metadata."""
    try:
        metadata_path = processed_dir / "preprocessed" / "metadata.json5"
        if metadata_path.exists():
            import json
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            chapter_num = metadata.get("chapter", {}).get("number", 0)
            logger.info(f"Extracted chapter number {chapter_num} from metadata")
            return chapter_num
    except Exception as e:
        logger.warning(f"Error extracting chapter number: {e}")
    
    return 0

def setup_debug_directories(processed_dir, debug=False):
    """Set up debug directories if debug mode is enabled.
    
    Args:
        processed_dir: Base processed directory
        debug: Whether debug mode is enabled
        
    Returns:
        Path or None: Debug run directory if created
    """
    if not debug:
        return None
    
    # Create debug directory structure
    debug_dir = processed_dir / "debug" / "tts"
    debug_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    debug_run_dir = debug_dir / timestamp
    debug_run_dir.mkdir(parents=True, exist_ok=True)
    
    # Create latest symlink
    latest_link = debug_dir / "latest"
    if latest_link.exists():
        if latest_link.is_symlink():
            latest_link.unlink()
        else:
            shutil.rmtree(latest_link)
    
    try:
        os.symlink(timestamp, str(latest_link), target_is_directory=True)
        logger.info(f"Created debug symlink: {latest_link} -> {timestamp}")
    except (OSError, AttributeError):
        if not latest_link.exists():
            shutil.copytree(debug_run_dir, latest_link)
        logger.info(f"Created debug directory copy: {latest_link}")
    
    logger.info(f"Debug output will be saved to: {debug_run_dir}")
    return debug_run_dir

def setup_tts_directories(processed_dir, chapter_num):
    """Set up TTS output directory structure.
    
    Args:
        processed_dir: Base processed directory
        chapter_num: Chapter number
        
    Returns:
        Path: TTS directory
    """
    # Create TTS output directory
    tts_dir = processed_dir / "tts"
    tts_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Created TTS directory: {tts_dir}")
    return tts_dir

def setup_tts_project(processed_dir, debug=False):
    """Set up complete TTS project structure."""
    logger.info("Setting up TTS project structure...")
    
    try:
        # Extract chapter information
        chapter_num = extract_chapter_number(processed_dir)
        
        # Set up debug directories
        debug_run_dir = setup_debug_directories(processed_dir, debug)
        
        # Set up TTS directories
        tts_dir = setup_tts_directories(processed_dir, chapter_num)
        
        logger.info("TTS project setup complete")
        
        return {
            "status": "success",
            "tts_dir": tts_dir,
            "debug_run_dir": debug_run_dir,
            "chapter_num": chapter_num
        }
        
    except Exception as e:
        logger.error(f"Error setting up TTS project: {e}")
        return {
            "status": "error",
            "messages": [f"Setup error: {str(e)}"]
        }
