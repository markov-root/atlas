# scripts/preprocess/pipeline.py
import os
import re
from pathlib import Path
from datetime import datetime
import shutil
import logging

# Import common utilities
from common.logger import setup_logger, log_section
from common.config import get_source_zip
from common.file_utils import extract_zip, find_markdown_file

# Import preprocessing steps
from .metadata import process as process_metadata
from .toc import process as process_toc
from .bold_fix import process as process_bold_fix
from .backslash import process as process_backslash
from .whitespace import process as process_whitespace
from .urls import process as process_urls
from .media_numbering import process as process_media_numbering
from .section_splitter import process as process_section_splitter
from .cleanup import process as process_cleanup
from .descriptions import process as process_descriptions
from .reading_time import process as process_reading_times
from .audio import process as process_audio

def create_original_directory(output_dir: Path, markdown_file: Path, logger: logging.Logger) -> None:
    """
    Create 'original' directory with unprocessed files.
    
    Args:
        output_dir: Preprocessed output directory
        markdown_file: Original markdown file
        logger: Logger instance
    """
    # Create original directory
    original_dir = output_dir.parent / "original"
    original_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Creating original files backup in {original_dir}")
    
    # Copy the original markdown file
    original_md = original_dir / "Output.md"
    shutil.copy2(markdown_file, original_md)
    logger.info(f"Copied original markdown to {original_md}")
    
    # Copy Images directory if it exists
    images_dir = markdown_file.parent / "Images"
    if images_dir.exists() and images_dir.is_dir():
        original_images_dir = original_dir / "Images"
        
        # Create the directory if it doesn't exist
        if not original_images_dir.exists():
            original_images_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy all images
        image_count = 0
        for img_file in images_dir.glob("*"):
            if img_file.is_file():
                shutil.copy2(img_file, original_images_dir / img_file.name)
                image_count += 1
                
        logger.info(f"Copied {image_count} images to {original_images_dir}")

def run(chapter_name, processed_dir, debug=False):
    """Run the preprocessing pipeline.
    
    Args:
        chapter_name: Name of the chapter (e.g. 'ch5')
        processed_dir: Base directory for processed outputs
        debug: Whether to enable debug mode
        
    Returns:
        dict: Results with keys:
            - status: 'success' or 'error'
            - output_files: List of output file paths
            - messages: Any important messages
    """
    # Set up main logger
    logger = setup_logger(f"preprocess.{chapter_name}", debug=debug)
    
    # Ensure module loggers are set up
    setup_logger("preprocess.metadata", debug=debug)
    setup_logger("preprocess.toc", debug=debug)
    setup_logger("preprocess.bold_fix", debug=debug)
    setup_logger("preprocess.backslash", debug=debug)
    setup_logger("preprocess.whitespace", debug=debug)
    setup_logger("preprocess.urls", debug=debug)
    setup_logger("preprocess.media_numbering", debug=debug)
    setup_logger("preprocess.section_splitter", debug=debug)
    setup_logger("preprocess.descriptions", debug=debug)
    setup_logger("preprocess.reading_time", debug=debug)
    setup_logger("preprocess.audio", debug=debug)
    setup_logger("preprocess.cleanup", debug=debug)

    # Start processing
    log_section(logger, "Preprocessing")
    
    # Create output and debug directories
    output_dir = processed_dir / "preprocessed"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    debug_dir = processed_dir / "debug" / "preprocessed"
    debug_dir.mkdir(parents=True, exist_ok=True)
    
    # If debug mode, create timestamped debug directory
    if debug:
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
        
        # Create relative symlink if possible
        try:
            os.symlink(timestamp, str(latest_link), target_is_directory=True)
        except (OSError, AttributeError):
            # On systems without symlink support (like Windows)
            # just create a copy
            if not latest_link.exists():
                shutil.copytree(debug_run_dir, latest_link)
    else:
        debug_run_dir = None
    
    try:
        # Get source ZIP file
        source_zip = get_source_zip(chapter_name)
        logger.info(f"Using source ZIP: {source_zip}")
        
        # Extract to output directory
        logger.info(f"Extracting to: {output_dir}")
        extract_zip(source_zip, output_dir)
        
        # Find markdown file
        markdown_file = find_markdown_file(output_dir)
        if not markdown_file:
            logger.error("No markdown file found in extracted ZIP")
            return {
                "status": "error",
                "messages": ["No markdown file found"]
            }
            
        logger.info(f"Found markdown file: {markdown_file}")
        
        # Create original directory with unprocessed files - EARLY in the process
        create_original_directory(output_dir, markdown_file, logger)
        
        # Read content
        with open(markdown_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Save initial state if debugging
        if debug_run_dir:
            with open(debug_run_dir / "00_initial.md", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Process content - apply preprocessing steps sequentially
        
        # Step 1: Process metadata
        step_debug_dir = debug_run_dir if debug else None
        content, metadata = process_metadata(content, output_dir, step_debug_dir)
        
        if debug_run_dir:
            with open(debug_run_dir / "01_metadata.md", 'w', encoding='utf-8') as f:
                f.write(content)

        # Step 2: Process table of contents
        content, toc_data = process_toc(content, output_dir, step_debug_dir)

        if debug_run_dir:
            with open(debug_run_dir / "02_toc.md", 'w', encoding='utf-8') as f:
                f.write(content)

        # Step 3: Fix bold formatting
        content, bold_stats = process_bold_fix(content, output_dir, step_debug_dir)

        if debug_run_dir:
            with open(debug_run_dir / "03_bold_fix.md", 'w', encoding='utf-8') as f:
                f.write(content)

        # Step 4: Clean up backslashes
        content, backslash_stats = process_backslash(content, output_dir, step_debug_dir)

        if debug_run_dir:
            with open(debug_run_dir / "04_backslash.md", 'w', encoding='utf-8') as f:
                f.write(content)

        # Step 5: Fix whitespace issues
        content, whitespace_stats = process_whitespace(content, output_dir, step_debug_dir)

        if debug_run_dir:
            with open(debug_run_dir / "05_whitespace.md", 'w', encoding='utf-8') as f:
                f.write(content)

        # Step 6: Extract URLs to sources.txt
        content, url_stats = process_urls(content, output_dir, step_debug_dir)

        if debug_run_dir:
            with open(debug_run_dir / "06_urls.md", 'w', encoding='utf-8') as f:
                f.write(content)

        # Step 7: Create media numbering registry
        content, media_stats = process_media_numbering(content, output_dir, step_debug_dir)

        if debug_run_dir:
            with open(debug_run_dir / "07_media_numbering.md", 'w', encoding='utf-8') as f:
                f.write(content)

        # Save processed content
        output_file = output_dir / "Output-clean.md"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
            
        # Step 8: Split content into separate section files
        content, section_stats = process_section_splitter(content, output_dir, step_debug_dir)

        if debug_run_dir:
            with open(debug_run_dir / "08_section_splitter.md", 'w', encoding='utf-8') as f:
                f.write(content)
                
        # Step 9: Extract descriptions
        content, description_stats = process_descriptions(content, output_dir, step_debug_dir)

        if debug_run_dir:
            with open(debug_run_dir / "09_descriptions.md", 'w', encoding='utf-8') as f:
                f.write(content)

        # Step 10: Calculate reading times
        content, reading_time_stats = process_reading_times(content, output_dir, step_debug_dir)

        if debug_run_dir:
            with open(debug_run_dir / "10_reading_times.md", 'w', encoding='utf-8') as f:
                f.write(content)

        # Step 11: Copy chapter audio files (MP3)
        content, audio_stats = process_audio(content, output_dir, step_debug_dir, chapter_name=chapter_name)

        if debug_run_dir:
            with open(debug_run_dir / "11_audio.md", 'w', encoding='utf-8') as f:
                f.write(content)

        # Step 12: Final cleanup (move Images, rename metadata, remove redundant files)
        content, cleanup_stats = process_cleanup(content, output_dir, step_debug_dir)

        if debug_run_dir:
            with open(debug_run_dir / "12_cleanup.md", 'w', encoding='utf-8') as f:
                f.write(content)

        # Save final state if debugging
        if debug_run_dir:
            with open(debug_run_dir / "99_final.md", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Collect all output files
        output_files = [str(output_file)]
        
        # Add chapter directory files if they were created
        if 'chapter_dir' in section_stats:
            chapter_dir = Path(section_stats['chapter_dir'])
            if chapter_dir.exists():
                for md_file in chapter_dir.glob("**/*.md"):
                    output_files.append(str(md_file))
                
                # Also add images in the chapter directory
                for img_file in (chapter_dir / "Images").glob("*") if (chapter_dir / "Images").exists() else []:
                    output_files.append(str(img_file))
        
        # Add MP3 file to output files if it was copied
        if audio_stats.get('mp3_copied'):
            mp3_file_path = output_dir / audio_stats.get('mp3_filename', f"{chapter_name}.mp3")
            if mp3_file_path.exists():
                output_files.append(str(mp3_file_path))
        
        logger.info(f"Main output: {output_file}")
        logger.info(f"Split into {section_stats.get('section_count', 0)} separate section files")
        logger.info(f"Media registry created with {media_stats.get('figures_count', 0)} figures, {media_stats.get('videos_count', 0)} videos, {media_stats.get('iframes_count', 0)} iframes")
        logger.info(f"Reading times calculated: Core {reading_time_stats.get('chapter_core_time', 'N/A')}, Optional {reading_time_stats.get('chapter_optional_time', 'N/A')}")
        
        # Log audio processing results
        if audio_stats.get('mp3_copied'):
            logger.info(f"Audio file copied: {audio_stats.get('mp3_filename', 'unknown')}")
        else:
            logger.info("No audio file found for this chapter")
            
        logger.info("="*60 + "\n")
        
        return {
            "status": "success",
            "output_files": output_files,
            "messages": ["Preprocessing completed successfully"]
        }
            
    except Exception as e:
        logger.error(f"Error during preprocessing: {e}")
        if debug:
            import traceback
            logger.debug(traceback.format_exc())
            
        return {
            "status": "error",
            "messages": [f"Error: {str(e)}"]
        }
