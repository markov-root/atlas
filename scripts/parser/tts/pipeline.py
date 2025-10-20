# File: scripts/tts/pipeline.py
import os
import re
import logging
import json
from pathlib import Path
from datetime import datetime

# Import common utilities
from common.logger import setup_logger, log_section

# Import TTS processing modules
from .setup import setup_tts_project

# Import TTS processors
from .iframe import process as process_iframe
from .video import process as process_video
from .image import process as process_image
from .note import process as process_note
from .quote import process as process_quote
from .definition import process as process_definition
from .footnote import process as process_footnote
from .hyperlinks import process as process_hyperlinks
from .headers import process as process_headers

def run(chapter_name, processed_dir, debug=False):
    """Run the TTS processing pipeline.
    
    Args:
        chapter_name: Name of the chapter (e.g. 'ch1')
        processed_dir: Base directory for processed outputs
        debug: Whether to enable debug mode
        
    Returns:
        dict: Results with keys:
            - status: 'success' or 'error'
            - output_files: List of output file paths
            - messages: Any important messages
    """
    # Set up main logger
    logger = setup_logger(f"tts.{chapter_name}", debug=debug)
    
    # Set up module loggers
    setup_logger("tts.setup", debug=debug)
    setup_logger("tts.iframe", debug=debug)
    setup_logger("tts.video", debug=debug)
    setup_logger("tts.image", debug=debug)
    setup_logger("tts.note", debug=debug)
    setup_logger("tts.quote", debug=debug)
    setup_logger("tts.definition", debug=debug)
    setup_logger("tts.footnote", debug=debug)
    setup_logger("tts.hyperlinks", debug=debug)
    setup_logger("tts.headers", debug=debug)
    
    logger.info("TTS module loggers configured")
    
    # Start processing
    log_section(logger, "TTS Processing")
    
    try:
        # Phase 1: Project Setup
        logger.info("Phase 1: Setting up TTS project structure...")
        setup_result = setup_tts_project(processed_dir, debug)
        logger.info(f"Setup result status: {setup_result['status']}")
        if setup_result["status"] != "success":
            logger.error(f"Setup failed: {setup_result}")
            return setup_result
        
        tts_dir = setup_result["tts_dir"]
        debug_run_dir = setup_result.get("debug_run_dir")
        chapter_num = setup_result["chapter_num"]
        
        logger.info(f"TTS directory: {tts_dir}")
        logger.info(f"Chapter number: {chapter_num}")
        logger.info(f"Debug directory: {debug_run_dir}")
        
        # Phase 2: Load TOC data (still needed for section metadata)
        logger.info("Phase 2: Loading TOC data...")
        toc_data = load_toc_data(processed_dir)
        if not toc_data:
            logger.error("Could not load TOC data")
            return {
                "status": "error",
                "messages": ["Could not load TOC data"]
            }
        logger.info(f"Loaded TOC with {len(toc_data.get('sections', []))} sections")
        
        # Phase 3: Process section files from Docusaurus output
        logger.info("Phase 3: Processing Docusaurus section files...")
        section_result = process_section_files(
            processed_dir, tts_dir, chapter_num, toc_data, debug_run_dir, logger
        )
        if section_result["status"] != "success":
            return section_result
        
        # Collect output files
        output_files = []
        for path in tts_dir.glob("**/*"):
            if path.is_file():
                output_files.append(str(path))
        
        # Compile final results
        messages = [
            "TTS processing completed successfully",
            f"Processed {section_result['sections_processed']} sections",
            f"Generated {section_result['files_created']} TTS files"
        ]
        
        logger.info(f"TTS processing complete. Generated {len(output_files)} files.")
        
        return {
            "status": "success",
            "output_files": output_files,
            "messages": messages
        }
        
    except Exception as e:
        logger.error(f"Error during TTS processing: {e}")
        if debug:
            import traceback
            logger.debug(traceback.format_exc())
        
        return {
            "status": "error",
            "messages": [f"Error: {str(e)}"]
        }

def load_toc_data(processed_dir):
    """Load table of contents data from preprocessed directory.
    
    Args:
        processed_dir: Base processed directory
        
    Returns:
        dict or None: TOC data if found
    """
    logger = logging.getLogger("tts.pipeline")
    
    toc_path = processed_dir / "preprocessed" / "toc.json5"
    if not toc_path.exists():
        logger.error(f"TOC file not found: {toc_path}")
        return None
    
    try:
        with open(toc_path, 'r', encoding='utf-8') as f:
            toc_data = json.load(f)
        
        sections_count = len(toc_data.get('sections', []))
        logger.info(f"Loaded TOC data with {sections_count} sections")
        return toc_data
        
    except Exception as e:
        logger.error(f"Error loading TOC data: {e}")
        return None

def find_docusaurus_section_files(processed_dir, chapter_num):
    """Find all Docusaurus section files to process.
    
    Args:
        processed_dir: Base processed directory
        chapter_num: Chapter number
        
    Returns:
        List of section file paths from docusaurus output
    """
    logger = logging.getLogger("tts.pipeline")
    
    # Look for Docusaurus files in the chapter directory
    docusaurus_chapter_dir = processed_dir / "docusaurus" / f"{chapter_num:02d}"
    
    if not docusaurus_chapter_dir.exists():
        logger.error(f"Docusaurus chapter directory not found: {docusaurus_chapter_dir}")
        return []
    
    # Find all .md files except index.md and sidebar.js, and sort them
    section_files = sorted([
        f for f in docusaurus_chapter_dir.glob("*.md") 
        if f.name != "index.md"
    ])
    
    logger.info(f"Found {len(section_files)} Docusaurus section files in {docusaurus_chapter_dir}")
    for section_file in section_files:
        logger.info(f"  - {section_file.name}")
    
    return section_files

def process_section_files(processed_dir, tts_dir, chapter_num, toc_data, debug_run_dir, logger):
    """Process all Docusaurus section files through the TTS pipeline.
    
    Args:
        processed_dir: Base processed directory
        tts_dir: TTS output directory
        chapter_num: Chapter number
        toc_data: TOC data for section mapping
        debug_run_dir: Debug directory for intermediate files
        logger: Logger instance
        
    Returns:
        dict: Processing results
    """
    try:
        # Find Docusaurus section files
        section_files = find_docusaurus_section_files(processed_dir, chapter_num)
        if not section_files:
            return {
                "status": "error",
                "messages": ["No Docusaurus section files found to process"]
            }
        
        sections_processed = 0
        files_created = 0
        
        # Process each Docusaurus section file
        for section_file in section_files:
            logger.info(f"Processing Docusaurus section file: {section_file.name}")
            
            # Extract section number from filename (e.g., "03.md" -> 3)
            section_match = re.match(r'(\d+)\.md', section_file.name)
            if not section_match:
                logger.warning(f"Skipping file with unexpected name: {section_file.name}")
                continue
            
            section_num = int(section_match.group(1))
            
            # Read Docusaurus section content (includes frontmatter + React components)
            with open(section_file, 'r', encoding='utf-8') as f:
                docusaurus_content = f.read()
            
            # Create section-specific debug directory
            section_debug_dir = None
            if debug_run_dir:
                section_debug_dir = debug_run_dir / f"section_{section_file.stem}"
                section_debug_dir.mkdir(exist_ok=True)
                
                # Save initial Docusaurus content
                with open(section_debug_dir / "00_docusaurus_input.md", 'w', encoding='utf-8') as f:
                    f.write(docusaurus_content)
            
            # Process through TTS pipeline
            section_result = process_single_section(
                docusaurus_content, section_num, toc_data, section_debug_dir, logger
            )
            
            if section_result["status"] != "success":
                logger.error(f"Failed to process section {section_file.name}")
                return {
                    "status": "error",
                    "messages": [f"Failed to process section {section_file.name}"]
                }
            
            # Write processed sections to TTS directory
            section_files_created = write_section_files(
                section_result["processed_sections"], tts_dir, section_num, logger
            )
            
            sections_processed += 1
            files_created += section_files_created
            
            logger.info(f"✓ Processed {section_file.name} -> {section_files_created} TTS files")
        
        return {
            "status": "success",
            "sections_processed": sections_processed,
            "files_created": files_created
        }
        
    except Exception as e:
        logger.error(f"Error processing section files: {e}")
        return {
            "status": "error",
            "messages": [f"Section processing error: {str(e)}"]
        }

def process_single_section(docusaurus_content, section_num, toc_data, debug_dir, logger):
    """Process a single Docusaurus section through the TTS pipeline."""
    try:
        logger.debug(f"Starting TTS pipeline for section {section_num}")
        
        # Remove frontmatter from Docusaurus content to get clean markdown + components
        content = remove_frontmatter(docusaurus_content)
        
        if debug_dir:
            with open(debug_dir / "01_after_frontmatter_removal.md", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 1: Remove/convert iframes
        content, iframe_stats = process_iframe(content, debug_dir)
        if debug_dir:
            with open(debug_dir / "02_after_iframe.md", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 2: Remove/convert videos
        content, video_stats = process_video(content, debug_dir)
        if debug_dir:
            with open(debug_dir / "03_after_video.md", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 3: Remove images
        content, image_stats = process_image(content, debug_dir)
        if debug_dir:
            with open(debug_dir / "04_after_image.md", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 4: Remove/convert note boxes
        content, note_stats = process_note(content, debug_dir)
        if debug_dir:
            with open(debug_dir / "05_after_note.md", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 5: Convert quotes
        content, quote_stats = process_quote(content, debug_dir)
        if debug_dir:
            with open(debug_dir / "06_after_quote.md", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 6: Convert definitions
        content, definition_stats = process_definition(content, debug_dir)
        if debug_dir:
            with open(debug_dir / "07_after_definition.md", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 7: Remove footnotes
        content, footnote_stats = process_footnote(content, debug_dir)
        if debug_dir:
            with open(debug_dir / "08_after_footnote.md", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 8: Clean up any remaining links/imports (simplified since Docusaurus already cleaned most)
        content, hyperlink_stats = process_hyperlinks(content, debug_dir)
        if debug_dir:
            with open(debug_dir / "09_after_hyperlinks.md", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 9: Split content by subsections and add numbering (still needed)
        processed_sections = split_and_number_content(content, section_num, toc_data, logger)
        
        # Save final processed sections
        if debug_dir:
            for filename, section_content in processed_sections.items():
                with open(debug_dir / f"10_final_{filename}", 'w', encoding='utf-8') as f:
                    f.write(section_content)
        
        stats = {
            "iframes_removed": iframe_stats.get('iframes_removed', 0),
            "videos_removed": video_stats.get('videos_removed', 0),
            "images_removed": image_stats.get('images_removed', 0),
            "notes_removed": note_stats.get('notes_removed', 0),
            "quotes_converted": quote_stats.get('quotes_converted', 0),
            "definitions_converted": definition_stats.get('definitions_converted', 0),
            "footnotes_removed": footnote_stats.get('footnotes_removed', 0),
            "hyperlinks_removed": hyperlink_stats.get('total_hyperlinks_removed', 0),
            "sections_created": len(processed_sections)
        }
        
        logger.debug(f"Completed TTS pipeline for section {section_num}: {stats}")
        
        return {
            "status": "success",
            "processed_sections": processed_sections,
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Error processing section {section_num}: {e}")
        return {
            "status": "error",
            "messages": [f"Error processing section {section_num}: {str(e)}"]
        }

def remove_frontmatter(docusaurus_content):
    """Remove YAML frontmatter and imports from Docusaurus content.
    
    Args:
        docusaurus_content: Content with frontmatter and imports
        
    Returns:
        str: Content without frontmatter or imports
    """
    logger = logging.getLogger("tts.pipeline")
    
    # Step 1: Remove YAML frontmatter (everything between first --- and second ---)
    frontmatter_pattern = r'^---\s*\n.*?\n---\s*\n'
    content = re.sub(frontmatter_pattern, '', docusaurus_content, flags=re.DOTALL | re.MULTILINE)
    
    # Step 2: Remove all import statements (they can be multiple and varied)
    # Pattern matches: import ... from "...";
    import_pattern = r'^import\s+.*?from\s+["\'][^"\']*["\'];?\s*$'
    content = re.sub(import_pattern, '', content, flags=re.MULTILINE)
    
    # Step 3: Remove any standalone import lines that might remain
    # Handle cases like: import { Something } from "@site/...";
    standalone_import_pattern = r'^import\s+\{[^}]*\}\s+from\s+["\'][^"\']*["\'];?\s*$'
    content = re.sub(standalone_import_pattern, '', content, flags=re.MULTILINE)
    
    # Step 4: Remove any remaining lines that look like imports
    general_import_pattern = r'^import\s+.*?;?\s*$'
    content = re.sub(general_import_pattern, '', content, flags=re.MULTILINE)
    
    # Step 5: Clean up excessive whitespace
    content = re.sub(r'\n{3,}', '\n\n', content)  # Max 2 consecutive newlines
    content = content.strip()
    
    if logger.isEnabledFor(logging.DEBUG):
        remaining_lines = content.split('\n')[:5]  # First 5 lines for debugging
        logger.debug(f"Content after frontmatter removal (first 5 lines): {remaining_lines}")
    
    return content

def split_and_number_content(content, section_num, toc_data, logger):
    """Split content by subsections and add proper numbering using TOC data."""
    try:
        # Find the corresponding section in TOC data
        sections = toc_data.get('sections', [])
        chapter_num = toc_data.get('chapter', 0)
        
        logger.info(f"Processing section {section_num}, TOC has {len(sections)} sections")
        
        # Find section by index (section_num corresponds to the array index in TOC)
        if 0 <= section_num < len(sections):
            section_data = sections[section_num]
            section_title = section_data.get('title', 'Unknown')
            section_number = section_data.get('number', '')
            subsections = section_data.get('subsections', [])
            
            logger.info(f"Found TOC data for section {section_num}:")
            logger.info(f"  Title: {section_title}")
            logger.info(f"  Number: {section_number}")
            logger.info(f"  Subsections: {len(subsections)}")
            for i, sub in enumerate(subsections):
                logger.info(f"    {i+1}. {sub.get('title', 'Unknown')}")
            
            # Process headers and split content using the updated headers module
            split_sections, stats = process_headers(content, section_data, chapter_num)
            
            # Convert to the expected filename format: section-subsection.md
            result = {}
            if len(split_sections) == 1 and "content" in split_sections:
                # No subsections, single file
                filename = f"{section_num:02d}.md"
                result[filename] = split_sections["content"]
                logger.info(f"Single file: {filename}")
            else:
                # Multiple subsections - handle intro and subsections separately
                for section_key, section_content in split_sections.items():
                    if section_key == "intro":
                        # Intro content goes to xx-00.md
                        filename = f"{section_num:02d}-00.md"
                        result[filename] = section_content
                        logger.info(f"Created intro file: {filename}")
                    elif section_key.startswith("subsection_"):
                        # Extract subsection number
                        subsection_idx = int(section_key.split('_')[1])
                        filename = f"{section_num:02d}-{subsection_idx:02d}.md"
                        result[filename] = section_content
                        logger.info(f"Created subsection file: {filename}")
            
            logger.info(f"Split section {section_num} into {len(result)} files")
            return result
            
        else:
            logger.warning(f"Section {section_num} not found in TOC data (TOC has {len(sections)} sections), using single file")
            filename = f"{section_num:02d}.md"
            return {filename: content}
            
    except Exception as e:
        logger.error(f"Error splitting content for section {section_num}: {e}")
        if logger.isEnabledFor(logging.DEBUG):
            import traceback
            logger.debug(traceback.format_exc())
        # Fallback to single file
        filename = f"{section_num:02d}.md"
        return {filename: content}

def write_section_files(processed_sections, tts_dir, section_num, logger):
    """Write processed section files to TTS directory."""
    files_created = 0
    
    for filename, content in processed_sections.items():
        output_path = tts_dir / filename
        
        # Ensure content is properly formatted (preserve newlines)
        if not content.endswith('\n'):
            content += '\n'
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        files_created += 1
        logger.debug(f"Created TTS file: {output_path}")
    
    return files_created
