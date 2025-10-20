# File: scripts/latex/gif_converter.py
import os
import re
import subprocess
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any, List

# Get logger
logger = logging.getLogger("latex.gif_converter")

def check_imagemagick_available() -> bool:
    """Check if ImageMagick's convert command is available."""
    try:
        result = subprocess.run(['convert', '-version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            logger.info("ImageMagick convert command available")
            return True
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    logger.warning("ImageMagick convert command not available")
    return False

def check_ffmpeg_available() -> bool:
    """Check if ffmpeg is available."""
    try:
        result = subprocess.run(['ffmpeg', '-version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            logger.info("FFmpeg available")
            return True
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    logger.warning("FFmpeg not available")
    return False

def find_gif_files(images_dir: Path) -> List[Path]:
    """Find all GIF files in the images directory."""
    if not images_dir.exists():
        logger.warning(f"Images directory does not exist: {images_dir}")
        return []
    
    gif_files = []
    
    # Search for .gif files (case insensitive)
    for pattern in ['*.gif', '*.GIF']:
        gif_files.extend(images_dir.glob(pattern))
    
    # Also check subdirectories
    for pattern in ['**/*.gif', '**/*.GIF']:
        gif_files.extend(images_dir.glob(pattern))
    
    # Remove duplicates and sort
    gif_files = sorted(list(set(gif_files)))
    
    logger.info(f"Found {len(gif_files)} GIF files in {images_dir}")
    for gif_file in gif_files:
        logger.debug(f"  - {gif_file.relative_to(images_dir)}")
    
    return gif_files

def convert_gif_with_imagemagick(gif_path: Path, png_path: Path) -> bool:
    """Convert GIF to PNG using ImageMagick convert command."""
    try:
        # Use convert with options to get first frame and good quality
        cmd = [
            'convert',
            str(gif_path) + '[0]',  # [0] gets first frame of animated GIF
            '-background', 'white',  # Set background to white for transparency
            '-alpha', 'remove',      # Remove alpha channel to avoid issues
            '-quality', '95',        # High quality
            str(png_path)
        ]
        
        logger.debug(f"Running ImageMagick command: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            logger.debug(f"ImageMagick conversion successful: {gif_path.name} -> {png_path.name}")
            return True
        else:
            logger.error(f"ImageMagick conversion failed for {gif_path.name}")
            logger.error(f"Error output: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        logger.error(f"ImageMagick conversion timeout for {gif_path.name}")
        return False
    except Exception as e:
        logger.error(f"ImageMagick conversion error for {gif_path.name}: {e}")
        return False

def convert_gif_with_ffmpeg(gif_path: Path, png_path: Path) -> bool:
    """Convert GIF to PNG using FFmpeg."""
    try:
        # Use ffmpeg to extract first frame
        cmd = [
            'ffmpeg',
            '-i', str(gif_path),
            '-vf', 'select=eq(n\\,0)',  # Select first frame
            '-vframes', '1',           # Output only 1 frame
            '-y',                      # Overwrite output file
            '-loglevel', 'error',      # Reduce noise
            str(png_path)
        ]
        
        logger.debug(f"Running FFmpeg command: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            logger.debug(f"FFmpeg conversion successful: {gif_path.name} -> {png_path.name}")
            return True
        else:
            logger.error(f"FFmpeg conversion failed for {gif_path.name}")
            logger.error(f"Error output: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        logger.error(f"FFmpeg conversion timeout for {gif_path.name}")
        return False
    except Exception as e:
        logger.error(f"FFmpeg conversion error for {gif_path.name}: {e}")
        return False

def convert_single_gif(gif_path: Path, use_imagemagick: bool = True) -> bool:
    """Convert a single GIF file to PNG."""
    # Create PNG path (same name, different extension)
    png_path = gif_path.with_suffix('.png')
    
    logger.info(f"Converting {gif_path.name} to {png_path.name}")
    
    # Try conversion based on available tools
    success = False
    
    if use_imagemagick and check_imagemagick_available():
        success = convert_gif_with_imagemagick(gif_path, png_path)
    
    if not success and check_ffmpeg_available():
        logger.info(f"Trying FFmpeg as fallback for {gif_path.name}")
        success = convert_gif_with_ffmpeg(gif_path, png_path)
    
    if success:
        # Verify the PNG was created and has content
        if png_path.exists() and png_path.stat().st_size > 0:
            logger.info(f"✓ Successfully converted {gif_path.name} to {png_path.name}")
            return True
        else:
            logger.error(f"Conversion appeared successful but PNG is empty: {png_path}")
            return False
    else:
        logger.error(f"✗ Failed to convert {gif_path.name}")
        return False

def update_content_references(content: str, gif_conversions: Dict[str, str]) -> Tuple[str, int]:
    """Update content to reference PNG files instead of GIF files and add animated version notes."""
    if not gif_conversions:
        return content, 0
    
    replacements_made = 0
    
    for gif_name, png_name in gif_conversions.items():
        # Look for figure-caption blocks that mention the GIF file
        # Pattern: <figure-caption>...</figure-caption> that comes after an image reference
        
        # First, let's find image references with captions that use this GIF
        figure_with_caption_pattern = rf'!\[([^\]]*)\]\(Images/{re.escape(gif_name)}\)\s*\n*<figure-caption>\s*(.*?)\s*</figure-caption>'
        
        def update_gif_figure_with_caption(match):
            nonlocal replacements_made
            alt_text = match.group(1)
            caption = match.group(2).strip()
            
            # Add animated version note to the caption
            enhanced_caption = f"{caption} \\\\ \\small\\textit{{[Intended as a Gif. Animated version available on the website]}}"
            
            # Replace the GIF reference with PNG
            updated_figure = f"![{alt_text}](Images/{png_name})\n<figure-caption>\n{enhanced_caption}\n</figure-caption>"
            
            replacements_made += 1
            logger.debug(f"Updated GIF figure with caption and animation note: {gif_name} -> {png_name}")
            
            return updated_figure
        
        # Apply the figure + caption update
        content = re.sub(figure_with_caption_pattern, update_gif_figure_with_caption, content, flags=re.DOTALL)
        
        # Now handle any remaining direct references that weren't caught by the figure pattern
        patterns = [
            # Direct image references
            f"Images/{gif_name}",
            f"./Images/{gif_name}",
            f"../Images/{gif_name}",
            # Just the filename
            gif_name,
        ]
        
        for pattern in patterns:
            if pattern in content:
                replacement = pattern.replace(gif_name, png_name)
                old_count = content.count(pattern)
                content = content.replace(pattern, replacement)
                
                if old_count > 0:
                    replacements_made += old_count
                    logger.debug(f"Replaced {old_count} direct references: {pattern} -> {replacement}")
    
    if replacements_made > 0:
        logger.info(f"Updated {replacements_made} content references from GIF to PNG with animation notes")
    
    return content, replacements_made

def process_gif_conversion(latex_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[Dict[str, str], Dict[str, Any]]:
    """Convert all GIF files in the LaTeX images directory to PNG.
    
    Args:
        latex_dir: LaTeX directory containing Images folder
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (gif_to_png_mapping, stats_dict)
    """
    logger.info("Converting GIF files to PNG for LaTeX compatibility...")
    
    # Find images directory
    images_dir = latex_dir / "Images"
    
    # Find all GIF files
    gif_files = find_gif_files(images_dir)
    
    if not gif_files:
        logger.info("No GIF files found to convert")
        return {}, {"gifs_found": 0, "conversions_successful": 0, "conversions_failed": 0}
    
    # Check what conversion tools are available
    has_imagemagick = check_imagemagick_available()
    has_ffmpeg = check_ffmpeg_available()
    
    if not has_imagemagick and not has_ffmpeg:
        logger.error("Neither ImageMagick nor FFmpeg available - cannot convert GIFs")
        return {}, {
            "gifs_found": len(gif_files),
            "conversions_successful": 0,
            "conversions_failed": len(gif_files),
            "error": "No conversion tools available"
        }
    
    # Convert each GIF
    successful_conversions = {}
    failed_conversions = []
    
    for gif_path in gif_files:
        success = convert_single_gif(gif_path, use_imagemagick=has_imagemagick)
        
        if success:
            gif_name = gif_path.name
            png_name = gif_path.with_suffix('.png').name
            successful_conversions[gif_name] = png_name
        else:
            failed_conversions.append(gif_path.name)
    
    # Log results
    logger.info(f"GIF conversion complete: {len(successful_conversions)} successful, {len(failed_conversions)} failed")
    
    if successful_conversions:
        logger.info("Successful conversions:")
        for gif_name, png_name in successful_conversions.items():
            logger.info(f"  ✓ {gif_name} -> {png_name}")
    
    if failed_conversions:
        logger.warning("Failed conversions:")
        for gif_name in failed_conversions:
            logger.warning(f"  ✗ {gif_name}")
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "gif_conversion.json"
        debug_data = {
            "gifs_found": [str(p) for p in gif_files],
            "successful_conversions": successful_conversions,
            "failed_conversions": failed_conversions,
            "tools_available": {
                "imagemagick": has_imagemagick,
                "ffmpeg": has_ffmpeg
            }
        }
        
        import json
        with open(debug_path, 'w', encoding='utf-8') as f:
            json.dump(debug_data, f, indent=2)
        
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "gifs_found": len(gif_files),
        "conversions_successful": len(successful_conversions),
        "conversions_failed": len(failed_conversions),
        "tools_available": {"imagemagick": has_imagemagick, "ffmpeg": has_ffmpeg}
    }
    
    return successful_conversions, stats

def process(content: str, latex_dir: Path, processed_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for GIF to PNG conversion.
    
    Args:
        content: The markdown content to process (will update GIF references)
        latex_dir: LaTeX directory containing Images folder
        processed_dir: Base processed directory (not used in this module)
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Processing GIF to PNG conversion for LaTeX compatibility...")
    
    # Convert GIF files
    gif_conversions, conversion_stats = process_gif_conversion(latex_dir, debug_dir)
    
    # Update content references
    processed_content, reference_updates = update_content_references(content, gif_conversions)
    
    # Combine stats
    stats = {
        **conversion_stats,
        "content_references_updated": reference_updates,
        "gif_to_png_mapping": gif_conversions
    }
    
    logger.info(f"GIF conversion processing complete - {conversion_stats['conversions_successful']} files converted, {reference_updates} content references updated")
    
    return processed_content, stats

def apply_gif_conversions_to_content(content: str, gif_conversions: Dict[str, str]) -> Tuple[str, int]:
    """Apply GIF to PNG conversions to content.
    
    This is a helper function for the pipeline to apply conversions to individual sections.
    
    Args:
        content: Content to update
        gif_conversions: Mapping of GIF filenames to PNG filenames
        
    Returns:
        Tuple of (updated_content, replacements_made)
    """
    return update_content_references(content, gif_conversions)
