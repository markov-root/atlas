# scripts/docusaurus/audio.py
import shutil
import logging
from pathlib import Path

def copy_audio_files(source_dir, target_dir):
    """Copy audio files from source to target directory.
    
    Args:
        source_dir: Source directory (preprocessed chapter directory)
        target_dir: Target directory (Docusaurus chapter directory)
        
    Returns:
        dict: Results of audio copying
    """
    logger = logging.getLogger("docusaurus.audio")
    
    # Create output audio directory
    audio_dir = target_dir / "audio"
    audio_dir.mkdir(exist_ok=True)
    logger.info(f"Created audio directory: {audio_dir}")
    
    # Track copied audio files
    copied_audio = []
    
    # Look for audio files in the preprocessed directory
    # Check both the chapter-specific directory and the main preprocessed directory
    audio_sources = []
    
    # First, check the main preprocessed directory
    preprocessed_dir = source_dir.parent.parent / "preprocessed"
    if preprocessed_dir.exists():
        audio_sources.append(preprocessed_dir)
        logger.info(f"Looking for audio files in: {preprocessed_dir}")
    
    # Also check the chapter-specific source directory
    audio_sources.append(source_dir)
    logger.info(f"Looking for audio files in: {source_dir}")
    
    # Copy audio files from any of the source locations
    for audio_source in audio_sources:
        if audio_source.exists():
            audio_count = 0
            # Look for common audio file extensions
            audio_extensions = ['*.mp3', '*.wav', '*.m4a', '*.aac', '*.ogg', '*.flac']
            
            for pattern in audio_extensions:
                for audio_file in audio_source.glob(pattern):
                    if audio_file.is_file():
                        dest_path = audio_dir / audio_file.name
                        # Don't copy if already exists (avoid duplicates)
                        if not dest_path.exists():
                            shutil.copy2(audio_file, dest_path)
                            copied_audio.append(audio_file.name)
                            logger.info(f"Copied audio file: {audio_file.name} -> {dest_path}")
                            audio_count += 1
                        else:
                            logger.info(f"Audio file already exists, skipping: {audio_file.name}")
            
            if audio_count > 0:
                logger.info(f"Copied {audio_count} audio files from {audio_source}")
    
    # List all audio files for debugging
    if copied_audio:
        logger.info("Available audio files in target directory:")
        for audio_file in audio_dir.glob("*"):
            logger.info(f"  - {audio_file.name}")
    else:
        logger.info("No audio files found to copy")
    
    return {
        "audio_dir": audio_dir,
        "copied_audio": copied_audio
    }
