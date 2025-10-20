# scripts/preprocess/cleanup.py
import re
import os
import logging
import json
import shutil
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional

# Get logger
logger = logging.getLogger("preprocess.cleanup")

def move_images_directory(output_dir: Path) -> bool:
    """
    Move the Images directory from the preprocessed folder to the chapter folder.
    
    Args:
        output_dir: Preprocessed directory
        
    Returns:
        bool: True if successful, False otherwise
    """
    # Find the Images directory
    images_dir = output_dir / "Images"
    if not images_dir.exists() or not images_dir.is_dir():
        logger.warning(f"Images directory not found at {images_dir}")
        return False
    
    # Find the chapter directory (should be a number like "05")
    chapter_dirs = [d for d in output_dir.iterdir() if d.is_dir() and d.name.isdigit()]
    if not chapter_dirs:
        logger.warning("No chapter directory found")
        return False
    
    chapter_dir = chapter_dirs[0]
    
    # Create target Images directory if it doesn't exist
    target_images_dir = chapter_dir / "Images"
    target_images_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy all images to the chapter directory
    image_count = 0
    for img_file in images_dir.glob("*"):
        if img_file.is_file():
            shutil.copy2(img_file, target_images_dir / img_file.name)
            image_count += 1
    
    # Remove the original Images directory
    shutil.rmtree(images_dir)
    logger.info(f"Moved {image_count} images to {target_images_dir} and removed original")
    return True

def rename_metadata_file(output_dir: Path) -> bool:
    """
    Rename chapter_X_metadata.json5 to metadata.json5.
    
    Args:
        output_dir: Preprocessed directory
        
    Returns:
        bool: True if successful, False otherwise
    """
    # Find chapter metadata file
    metadata_files = list(output_dir.glob("chapter_*_metadata.json5"))
    if not metadata_files:
        # Check if we already have a metadata.json5 file
        if (output_dir / "metadata.json5").exists():
            logger.info("metadata.json5 already exists")
            return True
        else:
            logger.warning("No metadata file found to rename")
            return False
    
    # Rename to metadata.json5
    metadata_file = metadata_files[0]
    new_name = output_dir / "metadata.json5"
    
    try:
        # Check if the new file already exists
        if new_name.exists():
            # If both files exist and are the same, remove the chapter_*_metadata.json5 file
            with open(metadata_file, 'r', encoding='utf-8') as f1:
                content1 = f1.read()
                
            with open(new_name, 'r', encoding='utf-8') as f2:
                content2 = f2.read()
                
            if content1 == content2:
                # Files are identical, remove the old one
                metadata_file.unlink()
                logger.info(f"Removed duplicate metadata file: {metadata_file}")
                return True
            else:
                # Files are different, keep both but log a warning
                logger.warning(f"Different versions of metadata files exist: {metadata_file} and {new_name}")
                return False
        
        # If new file doesn't exist, rename the old one
        shutil.move(metadata_file, new_name)
        logger.info(f"Renamed metadata file to {new_name}")
        return True
    except Exception as e:
        logger.error(f"Error renaming metadata file: {e}")
        return False

def remove_redundant_files(output_dir: Path) -> Dict[str, bool]:
    """
    Remove redundant files like the original Output.md.
    
    Args:
        output_dir: Preprocessed directory
        
    Returns:
        Dict: Status of each cleanup operation
    """
    results = {}
    
    # Remove original Output.md
    output_md = output_dir / "Output.md"
    if output_md.exists():
        try:
            output_md.unlink()
            logger.info(f"Removed redundant file: {output_md}")
            results["output_md"] = True
        except Exception as e:
            logger.error(f"Error removing {output_md}: {e}")
            results["output_md"] = False
    else:
        results["output_md"] = True  # Already not there
    
    return results

def process(content: str, output_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """
    Clean up the preprocessed directory.
    
    Args:
        content: The markdown content to process
        output_dir: Directory for output files
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (unchanged content, stats_dict)
    """
    # Log start of processing
    logger.info("Cleaning up preprocessed directory...")
    
    stats = {}
    
    # Step 1: Rename metadata file
    metadata_renamed = rename_metadata_file(output_dir)
    stats["metadata_renamed"] = metadata_renamed
    
    # Step 2: Move Images directory to chapter folder
    images_moved = move_images_directory(output_dir)
    stats["images_moved"] = images_moved
    
    # Step 3: Remove redundant files
    cleanup_results = remove_redundant_files(output_dir)
    stats.update(cleanup_results)
    
    # Save debug info if requested
    if debug_dir:
        debug_path = debug_dir / "cleanup.json"
        with open(debug_path, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2)
    
    logger.info("Cleanup complete")
    
    # Return content unchanged
    return content, stats
