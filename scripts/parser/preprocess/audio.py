# scripts/preprocess/audio.py
import shutil
import logging
import json
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("preprocess.audio")

def find_chapter_mp3(chapter_name: str, source_zips_dir: Path) -> Optional[Path]:
    """
    Find the MP3 file for a given chapter in the source_zips directory.
    
    Args:
        chapter_name: Chapter name (e.g., 'ch5')
        source_zips_dir: Path to source_zips directory
        
    Returns:
        Path to MP3 file if found, None otherwise
    """
    # Try exact match first (e.g., ch5.mp3)
    mp3_file = source_zips_dir / f"{chapter_name}.mp3"
    if mp3_file.exists():
        logger.info(f"Found MP3 file: {mp3_file}")
        return mp3_file
    
    # Try without 'ch' prefix if chapter_name starts with 'ch'
    if chapter_name.startswith('ch'):
        chapter_num = chapter_name[2:]  # Remove 'ch' prefix
        mp3_file = source_zips_dir / f"ch{chapter_num}.mp3"
        if mp3_file.exists():
            logger.info(f"Found MP3 file: {mp3_file}")
            return mp3_file
    
    # Try with 'ch' prefix if chapter_name is just a number
    elif chapter_name.isdigit():
        mp3_file = source_zips_dir / f"ch{chapter_name}.mp3"
        if mp3_file.exists():
            logger.info(f"Found MP3 file: {mp3_file}")
            return mp3_file
    
    logger.info(f"No MP3 file found for chapter: {chapter_name}")
    return None

def copy_chapter_audio(chapter_name: str, output_dir: Path) -> bool:
    """
    Copy the chapter's MP3 file to the output directory if it exists.
    
    Args:
        chapter_name: Chapter name (e.g., 'ch5')
        output_dir: Preprocessed output directory
        
    Returns:
        bool: True if MP3 was copied, False otherwise
    """
    # Find source_zips directory relative to output_dir
    # output_dir is typically: .../processed/ch5/preprocessed
    # We need to go up to find source_zips: .../source_zips
    
    # Navigate up from output_dir to find source_zips
    current_dir = output_dir.parent.parent  # Go up from preprocessed -> ch5 -> processed
    source_zips_dir = current_dir / "source_zips"
    
    # If not found, try going up one more level
    if not source_zips_dir.exists():
        current_dir = current_dir.parent
        source_zips_dir = current_dir / "source_zips"
    
    # If still not found, try looking in common locations
    if not source_zips_dir.exists():
        # Try looking in the project root (current working directory)
        source_zips_dir = Path.cwd() / "source_zips"
    
    if not source_zips_dir.exists():
        logger.warning(f"source_zips directory not found. Searched paths:")
        logger.warning(f"  - {output_dir.parent.parent / 'source_zips'}")
        logger.warning(f"  - {output_dir.parent.parent.parent / 'source_zips'}")
        logger.warning(f"  - {Path.cwd() / 'source_zips'}")
        return False
    
    logger.info(f"Found source_zips directory: {source_zips_dir}")
    
    # Find the MP3 file for this chapter
    mp3_file = find_chapter_mp3(chapter_name, source_zips_dir)
    if not mp3_file:
        return False
    
    # Create target path in output directory
    target_mp3 = output_dir / mp3_file.name
    
    try:
        # Copy the MP3 file
        shutil.copy2(mp3_file, target_mp3)
        logger.info(f"Copied MP3 file: {mp3_file} -> {target_mp3}")
        return True
    except Exception as e:
        logger.error(f"Error copying MP3 file: {e}")
        return False

def process(content: str, output_dir: Path, debug_dir: Optional[Path] = None, chapter_name: str = None) -> Tuple[str, Dict[str, Any]]:
    """
    Process content to copy chapter audio files.
    
    Args:
        content: The markdown content to process (unchanged)
        output_dir: Directory for output files
        debug_dir: Optional directory for debug output
        chapter_name: Chapter name for finding the corresponding MP3
        
    Returns:
        Tuple of (unchanged content, stats_dict)
    """
    # Log start of processing
    logger.info("Processing chapter audio files...")
    
    # Extract chapter name if not provided
    if not chapter_name:
        # Try to extract from output_dir path
        # output_dir might be: .../processed/ch5/preprocessed
        chapter_name = output_dir.parent.name
        logger.info(f"Extracted chapter name from path: {chapter_name}")
    
    # Copy the MP3 file if it exists
    mp3_copied = copy_chapter_audio(chapter_name, output_dir)
    
    # Prepare stats
    stats = {
        "chapter_name": chapter_name,
        "mp3_copied": mp3_copied,
    }
    
    if mp3_copied:
        mp3_filename = f"{chapter_name}.mp3"
        stats["mp3_filename"] = mp3_filename
        logger.info(f"Audio processing complete - copied {mp3_filename}")
    else:
        logger.info("Audio processing complete - no MP3 file found or copied")
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "audio.json"
        with open(debug_path, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2)
    
    # Return content unchanged
    return content, stats
