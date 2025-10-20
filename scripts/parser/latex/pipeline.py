# File: scripts/latex/pipeline.py
import os
import shutil
import logging
import re
from pathlib import Path
from datetime import datetime

# Import common utilities
from common.logger import setup_logger, log_section

# Import LaTeX processing modules
from .headers import process as process_headers
from .unicode import process as process_unicode
from .equations import process as process_equations
from .footnotes import process as process_footnotes
from .iframes import process as process_iframes
from .video import process as process_video
from .figures import process as process_figures
from .hyperlinks import process as process_hyperlinks
from .typography import process as process_typography
from .lists import process as process_lists
from .definition import process as process_definition
from .quote import process as process_quote
from .note import process as process_note
from .bibliography import process as process_bibliography
from .acknowledgements import process as process_acknowledgements
from .gif_converter import process as process_gif_conversion, apply_gif_conversions_to_content
from .setup import setup_latex_project
from .templates import generate_latex_structure
from .compiler import compile_pdf

def run(chapter_name, processed_dir, debug=False):
    """Run the LaTeX processing pipeline on individual section files.
    
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
    logger = setup_logger(f"latex.{chapter_name}", debug=debug)
    
    # Set up module loggers
    setup_logger("latex.headers", debug=debug)
    setup_logger("latex.unicode", debug=debug)
    setup_logger("latex.equations", debug=debug)
    setup_logger("latex.footnotes", debug=debug)
    setup_logger("latex.iframes", debug=debug)
    setup_logger("latex.video", debug=debug)
    setup_logger("latex.figures", debug=debug)
    setup_logger("latex.hyperlinks", debug=debug)
    setup_logger("latex.typography", debug=debug)
    setup_logger("latex.lists", debug=debug)
    setup_logger("latex.definition", debug=debug)
    setup_logger("latex.quote", debug=debug)
    setup_logger("latex.note", debug=debug)
    setup_logger("latex.bibliography", debug=debug)
    setup_logger("latex.acknowledgements", debug=debug)
    setup_logger("latex.gif_converter", debug=debug)
    setup_logger("latex.setup", debug=debug)
    setup_logger("latex.templates", debug=debug)
    setup_logger("latex.compiler", debug=debug)
    
    # Start processing
    log_section(logger, "LaTeX Processing")
    
    try:
        # Phase 1: Project Setup
        logger.info("Phase 1: Setting up LaTeX project structure...")
        setup_result = setup_latex_project(processed_dir, debug)
        if setup_result["status"] != "success":
            return setup_result
        
        latex_dir = setup_result["latex_dir"]
        debug_run_dir = setup_result.get("debug_run_dir")
        chapter_num = setup_result["chapter_num"]
        
        # Phase 2: GIF to PNG Conversion
        logger.info("Phase 2: Converting GIF files to PNG...")
        gif_result = process_gif_conversion("", latex_dir, processed_dir, debug_run_dir)
        # Note: We pass empty string for content since this phase works on files directly
        
        # Phase 3: Template and Structure Generation (basic files only)
        logger.info("Phase 3: Generating LaTeX templates...")
        template_result = generate_latex_structure(latex_dir, processed_dir)
        if template_result["status"] != "success":
            return template_result
        
        # Phase 4: Process Individual Section Files
        logger.info("Phase 4: Processing individual section files...")
        section_result = process_section_files(
            processed_dir, latex_dir, debug_run_dir, chapter_num, logger, gif_result[1]
        )
        if section_result["status"] != "success":
            return section_result
        
        # Phase 5: Generate Bibliography Files
        logger.info("Phase 5: Generating bibliography...")
        bibliography_result = process_bibliography("", processed_dir, latex_dir, debug_run_dir)
        
        # Phase 6: Generate Acknowledgements File
        logger.info("Phase 6: Generating acknowledgements...")
        acknowledgements_result = process_acknowledgements("", processed_dir, latex_dir, debug_run_dir)
        
        # Phase 7: Generate Main Document
        logger.info("Phase 7: Generating main document...")
        main_result = generate_main_document(
            latex_dir, processed_dir, section_result["processed_sections"], 
            chapter_num, acknowledgements_result[1], debug_run_dir
        )
        if main_result["status"] != "success":
            return main_result
        
        # Phase 8: PDF Compilation
        logger.info("Phase 8: Compiling PDF...")
        compilation_result = compile_pdf(latex_dir)
        
        # Collect output files
        output_files = []
        for path in latex_dir.glob("**/*"):
            if path.is_file():
                output_files.append(str(path))
        
        # Compile final results
        messages = [
            "LaTeX processing completed successfully",
            f"Processed {len(section_result['processed_sections'])} sections",
            f"GIF conversion: {gif_result[1]['conversions_successful']} files converted",
            f"PDF compilation: {'successful' if compilation_result['success'] else 'failed'}"
        ]
        
        if bibliography_result[1].get("bib_file_created"):
            messages.append(f"Generated bibliography with {bibliography_result[1].get('estimated_pages', 'unknown')} estimated pages")
        
        if compilation_result["success"]:
            messages.append(f"PDF generated: {compilation_result['pdf_path']}")
        
        logger.info(f"LaTeX processing complete. Generated {len(output_files)} files.")
        
        return {
            "status": "success",
            "output_files": output_files,
            "messages": messages
        }
        
    except Exception as e:
        logger.error(f"Error during LaTeX processing: {e}")
        if debug:
            import traceback
            logger.debug(traceback.format_exc())
        
        return {
            "status": "error",
            "messages": [f"Error: {str(e)}"]
        }

def find_section_files(processed_dir, chapter_num):
    """Find all section files to process.
    
    Args:
        processed_dir: Base processed directory
        chapter_num: Chapter number
        
    Returns:
        List of section file paths
    """
    logger = logging.getLogger("latex.pipeline")
    
    # Look for section files in the chapter directory
    chapter_dir = processed_dir / "preprocessed" / f"{chapter_num:02d}"
    if not chapter_dir.exists():
        # Try without zero padding
        chapter_dir = processed_dir / "preprocessed" / str(chapter_num)
    
    if not chapter_dir.exists():
        logger.error(f"Chapter directory not found: {chapter_dir}")
        return []
    
    # Find all .md files and sort them
    section_files = sorted([f for f in chapter_dir.glob("*.md")])
    
    logger.info(f"Found {len(section_files)} section files in {chapter_dir}")
    for section_file in section_files:
        logger.info(f"  - {section_file.name}")
    
    return section_files

def process_section_files(processed_dir, latex_dir, debug_run_dir, chapter_num, logger, gif_stats=None):
    """Process all individual section files through the LaTeX pipeline.
    
    Args:
        processed_dir: Base processed directory
        latex_dir: LaTeX output directory
        debug_run_dir: Debug directory for intermediate files
        chapter_num: Chapter number
        logger: Logger instance
        gif_stats: GIF conversion statistics (optional)
        
    Returns:
        dict: Processing results
    """
    try:
        # Find section files
        section_files = find_section_files(processed_dir, chapter_num)
        if not section_files:
            return {
                "status": "error",
                "messages": ["No section files found to process"]
            }
        
        # Determine which file contains the first appendix
        first_appendix_file_index = None
        for i, section_file in enumerate(section_files):
            with open(section_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if this file contains an appendix section
            if re.search(r'^#+\s+appendix', content, re.MULTILINE | re.IGNORECASE):
                first_appendix_file_index = i
                logger.info(f"First appendix found in file: {section_file.name}")
                break
        
        processed_sections = []
        
        # Process each section file individually
        for i, section_file in enumerate(section_files):
            logger.info(f"Processing section file: {section_file.name}")
            
            # Read section content
            with open(section_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Create section-specific debug directory
            section_debug_dir = None
            if debug_run_dir:
                section_debug_dir = debug_run_dir / f"section_{section_file.stem}"
                section_debug_dir.mkdir(exist_ok=True)
                
                # Save initial content
                with open(section_debug_dir / "00_initial.md", 'w', encoding='utf-8') as f:
                    f.write(content)
            
            # Determine if this is the first appendix file
            is_first_appendix_file = (i == first_appendix_file_index)
            
            # Process through pipeline
            section_result = process_single_section(
                content, section_file.stem, processed_dir, section_debug_dir, 
                is_first_appendix_file, logger, gif_stats
            )
            
            if section_result["status"] != "success":
                logger.error(f"Failed to process section {section_file.name}")
                return {
                    "status": "error",
                    "messages": [f"Failed to process section {section_file.name}"]
                }
            
            # Write processed section to LaTeX sections directory
            section_output_path = latex_dir / "sections" / f"{section_file.stem}.tex"
            with open(section_output_path, 'w', encoding='utf-8') as f:
                f.write(section_result["processed_content"])
            
            processed_sections.append({
                "filename": section_file.stem,
                "output_path": section_output_path,
                "stats": section_result["stats"]
            })
            
            logger.info(f"✓ Processed {section_file.name} -> {section_output_path.name}")
        
        return {
            "status": "success",
            "processed_sections": processed_sections
        }
        
    except Exception as e:
        logger.error(f"Error processing section files: {e}")
        return {
            "status": "error",
            "messages": [f"Section processing error: {str(e)}"]
        }

def process_single_section(content, section_name, processed_dir, debug_dir, is_first_appendix_file, logger, gif_stats=None):
    """Process a single section through the LaTeX pipeline."""
    try:
        logger.debug(f"Starting pipeline for section {section_name}")
        
        # Step 0: Apply GIF conversions if available
        gif_conversions_applied = 0
        if gif_stats and gif_stats.get('gif_to_png_mapping'):
            content, gif_conversions_applied = apply_gif_conversions_to_content(content, gif_stats['gif_to_png_mapping'])
            if gif_conversions_applied > 0:
                logger.info(f"Applied {gif_conversions_applied} GIF to PNG conversions in section {section_name}")
        
        if debug_dir:
            with open(debug_dir / "00_after_gif_conversion.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 1: Process headers with appendix information
        content, headers_stats = process_headers(content, processed_dir, debug_dir, is_first_appendix_file)
        
        if debug_dir:
            with open(debug_dir / "01_after_headers.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 2: Process unicode
        content, unicode_stats = process_unicode(content, processed_dir, debug_dir)
        
        if debug_dir:
            with open(debug_dir / "02_after_unicode.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 3: Process equations (NEW - after unicode, before footnotes)
        content, equations_stats = process_equations(content, processed_dir, debug_dir)
        
        if debug_dir:
            with open(debug_dir / "03_after_equations.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 4: Process footnotes
        content, footnotes_stats = process_footnotes(content, processed_dir, debug_dir)
        
        if debug_dir:
            with open(debug_dir / "04_after_footnotes.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 5: Process iframes (can contain static figures for images)
        content, iframes_stats = process_iframes(content, processed_dir, debug_dir)
        
        if debug_dir:
            with open(debug_dir / "05_after_iframes.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 6: Process videos (remove video content for LaTeX)
        content, video_stats = process_video(content, processed_dir, debug_dir)
        
        if debug_dir:
            with open(debug_dir / "06_after_videos.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 7: Process figures (after iframes to handle static figures)
        content, figures_stats = process_figures(content, processed_dir, debug_dir)
        
        if debug_dir:
            with open(debug_dir / "07_after_figures.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 8: Process hyperlinks (after figures to avoid processing image links)
        content, hyperlinks_stats = process_hyperlinks(content, processed_dir, debug_dir)
        
        if debug_dir:
            with open(debug_dir / "08_after_hyperlinks.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 9: Process typography (bold, italic, spacing)
        content, typography_stats = process_typography(content, processed_dir, debug_dir)
        
        if debug_dir:
            with open(debug_dir / "09_after_typography.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 10: Process lists (after typography to handle formatted list items)
        content, lists_stats = process_lists(content, processed_dir, debug_dir)
        
        if debug_dir:
            with open(debug_dir / "10_after_lists.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 11: Process definitions (after lists to handle definitions that might contain lists)
        content, definition_stats = process_definition(content, processed_dir, debug_dir)
        
        if debug_dir:
            with open(debug_dir / "11_after_definitions.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 12: Process quotes (after definitions to handle quotes that might contain definitions)
        content, quote_stats = process_quote(content, processed_dir, debug_dir)
        
        if debug_dir:
            with open(debug_dir / "12_after_quotes.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Step 13: Note processing
        content, note_stats = process_note(content, processed_dir, debug_dir)
        
        if debug_dir:
            with open(debug_dir / "13_after_notes.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Save final processed content
        if debug_dir:
            with open(debug_dir / "99_final.tex", 'w', encoding='utf-8') as f:
                f.write(content)
        
        stats = {
            "headers_processed": headers_stats.get('headers_processed', 0),
            "unicode_replacements": unicode_stats.get('unicode_replacements', 0),
            "display_equations": equations_stats.get('display_equations', 0),
            "inline_equations": equations_stats.get('inline_equations', 0),
            "footnotes_processed": footnotes_stats.get('footnotes_processed', 0),
            "iframes_processed": iframes_stats.get('iframes_processed', 0),
            "videos_removed": video_stats.get('videos_removed', 0),
            "figures_processed": figures_stats.get('total_figures', 0),
            "hyperlinks_processed": hyperlinks_stats.get('hyperlinks_processed', 0),
            "formatting_conversions": typography_stats.get('formatting_conversions', 0),
            "lists_processed": lists_stats.get('total_lists', 0),
            "definitions_processed": definition_stats.get('definitions_processed', 0),
            "quotes_processed": quote_stats.get('quotes_processed', 0),
            "notes_processed": note_stats.get('notes_processed', 0),
            "gif_references_updated": gif_conversions_applied
        }
        
        # Add GIF conversion stats if available
        if gif_stats:
            stats["gifs_converted"] = gif_stats.get('conversions_successful', 0)
        
        logger.debug(f"Completed pipeline for section {section_name}: {stats}")
        
        return {
            "status": "success",
            "processed_content": content,
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Error processing section {section_name}: {e}")
        return {
            "status": "error",
            "messages": [f"Error processing section {section_name}: {str(e)}"]
        }

def generate_main_document(latex_dir, processed_dir, processed_sections, chapter_num, ack_stats, debug_dir=None):
    """Generate the main.tex file with chapter setup, bibliography, and acknowledgements.
    
    Args:
        latex_dir: LaTeX directory
        processed_dir: Base processed directory
        processed_sections: List of processed section info
        chapter_num: Chapter number
        ack_stats: Acknowledgements processing stats
        debug_dir: Optional debug directory
        
    Returns:
        dict: Generation results
    """
    logger = logging.getLogger("latex.pipeline")
    
    try:
        # Build section includes
        section_includes = []
        for section in processed_sections:
            section_includes.append(f"\\input{{sections/{section['filename']}}}")
        
        # Add acknowledgements include if file was created
        if ack_stats.get("acknowledgements_file_created"):
            section_includes.append("\\input{sections/acknowledgements}")
            logger.info("Added acknowledgements.tex to main document includes")
        
        # Create main.tex with chapter setup
        main_content = f"""\\input{{templates/preamble}}

\\begin{{document}}

\\input{{sections/title}}

% Chapter-level numbering setup
\\renewcommand\\thesection{{{chapter_num}.\\arabic{{section}}}}
\\renewcommand\\thefigure{{{chapter_num}.\\arabic{{figure}}}}
\\renewcommand\\thetable{{{chapter_num}.\\arabic{{table}}}}
\\renewcommand\\theequation{{{chapter_num}.\\arabic{{equation}}}}
\\setcounter{{section}}{{0}}
\\setcounter{{figure}}{{0}}
\\setcounter{{table}}{{0}}
\\setcounter{{equation}}{{0}}

\\tableofcontents
\\pagebreak

% Include individual sections
{chr(10).join(section_includes)}

% Bibliography
\\clearpage
\\bibliography{{references}}
\\bibliographystyle{{plain}}

\\end{{document}}
"""
        
        main_path = latex_dir / "main.tex"
        with open(main_path, 'w', encoding='utf-8') as f:
            f.write(main_content)
        
        logger.info(f"Generated main.tex with chapter {chapter_num} numbering setup")
        logger.info(f"Directly includes {len(processed_sections)} sections:")
        for section in processed_sections:
            logger.info(f"  - sections/{section['filename']}.tex")
        
        if ack_stats.get("acknowledgements_file_created"):
            logger.info("  - sections/acknowledgements.tex")
        
        return {
            "status": "success",
            "main_path": main_path,
            "acknowledgements_included": ack_stats.get("acknowledgements_file_created", False)
        }
        
    except Exception as e:
        logger.error(f"Error generating main document: {e}")
        return {
            "status": "error",
            "messages": [f"Main document generation error: {str(e)}"]
        }
