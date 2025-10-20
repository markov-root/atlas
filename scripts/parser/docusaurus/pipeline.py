# scripts/docusaurus/pipeline.py
"""
Main pipeline for Docusaurus processing with enhanced frontmatter.
Orchestrates the entire processing workflow.
"""

from pathlib import Path
import logging
import re

# Import common utilities
from common.logger import setup_logger, log_section

# Import processing modules
from .structure import create_structure, process_section_files
from .image import copy_images
from .audio import copy_audio_files
from .heading import process_headings
from .frontmatter import extract_title_from_content, load_enhanced_metadata
from .sidebar import generate_sidebar
from .component import process_components

# Import component processors - these register themselves with the component registry
from . import iframe
from . import video
from . import note
from . import quote
from . import footnote
from . import definition

def run(chapter_name, processed_dir, debug=False):
    """Run the Docusaurus processing pipeline with enhanced frontmatter.
    
    Args:
        chapter_name: Name of the chapter (e.g. 'ch5')
        processed_dir: Base directory for processed outputs
        debug: Whether to enable debug mode
        
    Returns:
        dict: Results with keys:
            - status: 'success' or 'error'
            - output_files: List of output files paths
            - messages: Any important messages
    """
    # Set up logger
    logger = setup_logger(f"docusaurus.{chapter_name}", debug=debug)
    
    # Set up component loggers
    setup_logger("docusaurus.structure", debug=debug)
    setup_logger("docusaurus.image", debug=debug)
    setup_logger("docusaurus.audio", debug=debug)
    setup_logger("docusaurus.heading", debug=debug)
    setup_logger("docusaurus.frontmatter", debug=debug)
    setup_logger("docusaurus.sidebar", debug=debug)
    setup_logger("docusaurus.component", debug=debug)
    setup_logger("docusaurus.component.video", debug=debug)
    
    # Start processing
    log_section(logger, "Docusaurus Processing")
    
    # Create output directory
    output_dir = processed_dir / "docusaurus"
    output_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Created output directory: {output_dir}")
    
    # Identify chapter number
    chapter_num = extract_chapter_number(processed_dir)
    logger.info(f"Processing chapter number: {chapter_num}")
    
    # Define target directory
    target_dir = output_dir / f"{chapter_num:02d}"
    target_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Created target directory: {target_dir}")
    
    try:
        # Load enhanced metadata early for validation
        try:
            toc_data, metadata = load_enhanced_metadata(processed_dir)
            logger.info("Successfully loaded enhanced metadata for frontmatter generation")
            
            # Log some metadata stats for verification
            if toc_data.get("reading_times"):
                reading_times = toc_data["reading_times"]
                logger.info(f"Chapter reading times - Core: {reading_times.get('core')}, Optional: {reading_times.get('optional')}, Appendix: {reading_times.get('appendix')}")
            
            if metadata.get("authors"):
                authors_count = len(metadata["authors"])
                logger.info(f"Found {authors_count} authors in metadata")
                
            if metadata.get("links"):
                links_count = len(metadata["links"])
                logger.info(f"Found {links_count} action links in metadata")
                
        except Exception as e:
            logger.warning(f"Could not load enhanced metadata: {e}")
            logger.warning("Will fall back to basic frontmatter generation")
            toc_data, metadata = {}, {}
        
        # Identify source directory
        source_dir = processed_dir / "preprocessed" / f"{chapter_num}"
        if not source_dir.exists():
            source_dir = processed_dir / "preprocessed" / f"{chapter_num:02d}"
        
        if not source_dir.exists():
            logger.error(f"Source directory not found: {source_dir}")
            # List contents of preprocessed directory for debugging
            preprocessed_dir = processed_dir / "preprocessed"
            logger.error(f"Contents of {preprocessed_dir}:")
            for item in preprocessed_dir.glob("*"):
                logger.error(f"  - {item.name}")
            return {
                "status": "error",
                "messages": ["Source directory not found"]
            }
        
        logger.info(f"Using source directory: {source_dir}")
        
        # List contents of source directory for debugging
        logger.info(f"Contents of source directory:")
        for item in source_dir.glob("*"):
            if item.is_dir():
                logger.info(f"  - {item.name}/ (directory)")
                # List subdirectory contents
                for subitem in item.glob("*"):
                    logger.info(f"    - {subitem.name}")
            else:
                logger.info(f"  - {item.name}")
        
        # 1. Create structure (index file, etc)
        structure_result = create_structure(target_dir, chapter_num)
        
        # 2. Copy images
        image_result = copy_images(source_dir, target_dir)
        copied_images = image_result.get('copied_images', [])
        
        # 3. Process section files with enhanced frontmatter
        section_result = process_section_files(source_dir, target_dir, chapter_num, copied_images, processed_dir)
        copied_audio = section_result.get('copied_audio', [])
        
        # 4. Generate sidebar
        sidebar_result = generate_sidebar(output_dir, chapter_num)
        
        # Collect all output files
        output_files = []
        for path in target_dir.glob("**/*"):
            if path.is_file():
                output_files.append(str(path))
        
        logger.info(f"Generated {len(output_files)} output files:")
        for output_file in output_files:
            logger.info(f"  - {output_file}")
        
        # Log enhanced frontmatter results
        if toc_data and metadata:
            logger.info("✓ Enhanced frontmatter generated with:")
            if toc_data.get("reading_times"):
                logger.info("  - Reading time breakdowns")
            if toc_data.get("chapter_description"):
                logger.info("  - Chapter description")
            if metadata.get("authors"):
                logger.info(f"  - {len(metadata['authors'])} authors")
            if metadata.get("affiliations"):
                logger.info(f"  - {len(metadata['affiliations'])} affiliations")
            
            # Count sections with descriptions
            sections_with_descriptions = sum(1 for section in toc_data.get("sections", []) if section.get("description"))
            if sections_with_descriptions > 0:
                logger.info(f"  - {sections_with_descriptions} section descriptions")
        else:
            logger.info("⚠ Basic frontmatter generated (enhanced metadata not available)")
        
        # Log media results
        if copied_images:
            logger.info(f"✓ Copied {len(copied_images)} images")
        if copied_audio:
            logger.info(f"✓ Copied {len(copied_audio)} audio files: {', '.join(copied_audio)}")
        else:
            logger.info("ℹ No audio files found for this chapter")
        
        return {
            "status": "success", 
            "output_files": output_files,
            "messages": ["Docusaurus processing completed successfully with enhanced frontmatter"]
        }
        
    except Exception as e:
        logger.error(f"Error during processing: {e}")
        import traceback
        logger.error(traceback.format_exc())
        
        return {
            "status": "error",
            "messages": [f"Error: {str(e)}"]
        }

def extract_chapter_number(processed_dir):
    """Extract chapter number from directory name or metadata."""
    logger = logging.getLogger("docusaurus.pipeline")
    
    try:
        # Try to get from metadata.json5
        metadata_path = processed_dir / "preprocessed" / "metadata.json5"
        if metadata_path.exists():
            logger.info(f"Found metadata file: {metadata_path}")
            with open(metadata_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Very basic extraction - just look for the number
                match = re.search(r'"number"\s*:\s*(\d+)', content)
                if match:
                    chapter_num = int(match.group(1))
                    logger.info(f"Extracted chapter number {chapter_num} from metadata")
                    return chapter_num
    except Exception as e:
        logger.warning(f"Error extracting chapter number from metadata: {e}")
    
    # Default to the chapter name (e.g., ch5 -> 5)
    chapter_name = processed_dir.name
    match = re.search(r'ch(\d+)', chapter_name)
    if match:
        chapter_num = int(match.group(1))
        logger.info(f"Extracted chapter number {chapter_num} from directory name")
        return chapter_num
    
    # Default to 0 if we can't extract
    logger.warning(f"Could not extract chapter number, using default 0")
    return 0
