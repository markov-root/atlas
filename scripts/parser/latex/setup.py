# File: scripts/latex/setup.py
import os
import shutil
import logging
from pathlib import Path
from datetime import datetime

# Get logger
logger = logging.getLogger("latex.setup")

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
    debug_dir = processed_dir / "debug" / "latex"
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

def setup_latex_directories(processed_dir, chapter_num):
    """Set up LaTeX output directory structure.
    
    Args:
        processed_dir: Base processed directory
        chapter_num: Chapter number
        
    Returns:
        Path: LaTeX directory
    """
    # Create main LaTeX output directory
    output_dir = processed_dir / "latex"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create chapter-specific directory
    latex_dir = output_dir / f"{chapter_num:02d}"
    latex_dir.mkdir(parents=True, exist_ok=True)
    
    # Set up subdirectories
    (latex_dir / "Images").mkdir(exist_ok=True)
    (latex_dir / "sections").mkdir(exist_ok=True)
    
    logger.info(f"Created LaTeX directory structure: {latex_dir}")
    return latex_dir


def copy_images(preprocessed_dir, latex_dir, chapter_num):
    """Copy images from preprocessed directory to LaTeX directory.
    
    Args:
        preprocessed_dir: Preprocessed directory
        latex_dir: LaTeX output directory
        chapter_num: Chapter number for finding the correct subdirectory
        
    Returns:
        dict: Copy results
    """
    # Look for images in the chapter-specific subdirectory
    possible_image_locations = [
        preprocessed_dir / f"{chapter_num:02d}" / "Images",  # e.g., preprocessed/01/Images
        preprocessed_dir / str(chapter_num) / "Images",     # e.g., preprocessed/1/Images  
        preprocessed_dir / "Images",                        # Direct images directory (fallback)
    ]
    
    # Find the first existing images directory
    images_source = None
    for location in possible_image_locations:
        if location.exists():
            images_source = location
            logger.info(f"Found images directory at: {images_source}")
            break
    
    if not images_source:
        logger.warning(f"No images directory found for chapter {chapter_num} in any of these locations:")
        for location in possible_image_locations:
            logger.warning(f"  - {location}")
        return {"images_copied": False, "count": 0}
    
    images_dest = latex_dir / "Images"
    
    # Remove existing images directory if it exists
    if images_dest.exists():
        shutil.rmtree(images_dest)
    
    # Copy images preserving structure
    shutil.copytree(images_source, images_dest)
    
    # Count copied images
    image_count = len([f for f in images_dest.glob("*") if f.is_file()])
    
    logger.info(f"Copied {image_count} images from {images_source} to {images_dest}")
    return {"images_copied": True, "count": image_count}

def setup_latex_project(processed_dir, debug=False):
    """Set up complete LaTeX project structure."""
    logger.info("Setting up LaTeX project structure...")
    
    try:
        # Extract chapter information
        chapter_num = extract_chapter_number(processed_dir)
        
        # Set up debug directories
        debug_run_dir = setup_debug_directories(processed_dir, debug)
        
        # Set up LaTeX directories
        latex_dir = setup_latex_directories(processed_dir, chapter_num)
        
        # Copy images (now with chapter_num parameter)
        preprocessed_dir = processed_dir / "preprocessed"
        image_result = copy_images(preprocessed_dir, latex_dir, chapter_num)
        
        logger.info("LaTeX project setup complete")
        
        return {
            "status": "success",
            "latex_dir": latex_dir,
            "debug_run_dir": debug_run_dir,
            "chapter_num": chapter_num,
            "images_copied": image_result["images_copied"],
            "image_count": image_result["count"]
        }
        
    except Exception as e:
        logger.error(f"Error setting up LaTeX project: {e}")
        return {
            "status": "error",
            "messages": [f"Setup error: {str(e)}"]
        }

