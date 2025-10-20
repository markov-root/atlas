# File: scripts/convert.py
#!/usr/bin/env python3
# scripts/convert.py
import sys
import os
import argparse
import logging
from pathlib import Path

# Add scripts directory to path
scripts_dir = Path(__file__).parent
if str(scripts_dir) not in sys.path:
    sys.path.append(str(scripts_dir))

# Import common utilities
from common.logger import setup_logger, log_banner
from common.config import get_chapter_dir, get_source_zip

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description='Document Converter',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python convert.py source_zips/ch5.zip --preprocess      # Run preprocessing only
  python convert.py ch5 --docusaurus                      # Run Docusaurus processing on existing directory
  python convert.py source_zips/ch5.zip --full            # Run all processing steps
  python convert.py source_zips/ch5.zip --latex --debug   # Run LaTeX processing with debug output
  python convert.py ch5 --tts                            # Run TTS processing on existing directory
        """
    )
    
    # Add source argument
    parser.add_argument('source', help='Path to source zip file or directory')
    
    # Add processing options as a mutually exclusive group
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--preprocess', action='store_true', help='Run preprocessing only')
    group.add_argument('--docusaurus', action='store_true', help='Run Docusaurus processing')
    group.add_argument('--latex', action='store_true', help='Run LaTeX processing')
    group.add_argument('--tts', action='store_true', help='Run TTS processing')
    group.add_argument('--full', action='store_true', help='Run all processing steps')
    
    # Add optional arguments
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    parser.add_argument('--output', help='Specify output directory (default: same as source)')
    parser.add_argument('--no-color', action='store_true', help='Disable colored output')
    parser.add_argument('--no-timestamps', action='store_true', help='Omit timestamps from console output')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show more detailed output')
    
    return parser.parse_args()

def get_chapter_name(source_path):
    """Extract chapter name from source path."""
    source_path = Path(source_path)
    
    # If source is a zip file, extract the name without extension
    if source_path.suffix.lower() == '.zip':
        return source_path.stem
    
    # If source is a directory, use the directory name
    elif source_path.is_dir():
        return source_path.name
    
    # Try to extract name if it's just a string
    else:
        try:
            path = Path(source_path)
            if path.exists():
                if path.is_dir():
                    return path.name
                elif path.suffix.lower() == '.zip':
                    return path.stem
        except:
            pass
    
    return source_path

def configure_logging(debug=False, no_timestamps=False):
    """Configure global logging settings"""
    # Configure root logger
    root_logger = logging.getLogger()
    
    # Set level based on debug flag
    if debug:
        root_logger.setLevel(logging.DEBUG)
    else:
        root_logger.setLevel(logging.INFO)
    
    # Clear existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Add console handler
    handler = logging.StreamHandler(sys.stdout)
    
    # Set formatter
    if no_timestamps:
        formatter = logging.Formatter('%(levelname)s: %(message)s')
    else:
        formatter = logging.Formatter('[%(asctime)s] %(levelname)s: %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)

def run_processing_step(step_name, run_function, chapter_name, processed_dir, debug, logger):
    """Run a single processing step with error handling."""
    try:
        logger.info(f"Starting {step_name} processing...")
        result = run_function(chapter_name, processed_dir, debug=debug)
        
        # Display any messages from the result
        if result and 'messages' in result:
            for msg in result['messages']:
                logger.info(f"{step_name}: {msg}")
        
        # Check if the step was successful
        if result and result.get('status') == 'success':
            logger.info(f"✓ {step_name} processing completed successfully")
            return True
        elif result and result.get('status') == 'error':
            logger.error(f"✗ {step_name} processing failed")
            if result.get('messages'):
                for msg in result['messages']:
                    logger.error(f"{step_name} error: {msg}")
            return False
        else:
            logger.warning(f"⚠ {step_name} processing completed with unknown status")
            return True
            
    except Exception as e:
        logger.error(f"✗ Error in {step_name} processing: {e}")
        if debug:
            import traceback
            logger.error(traceback.format_exc())
        return False

def main():
    """Main entry point for the converter."""
    args = parse_arguments()
    
    # Configure global logging
    configure_logging(debug=args.debug, no_timestamps=args.no_timestamps)
    
    # Set up logger
    logger = setup_logger("converter", debug=args.debug)
    
    # Print banner
    log_banner(logger, "Document Converter")
    
    try:
        # Get chapter name from source
        chapter_name = get_chapter_name(args.source)
        logger.info(f"Processing chapter: {chapter_name}")
        
        # Get the processed directory
        if args.output:
            processed_dir = Path(args.output)
        else:
            processed_dir = get_chapter_dir(chapter_name)
        
        # Ensure processed directory exists
        processed_dir.mkdir(parents=True, exist_ok=True)
        
        # Track overall success
        overall_success = True
        
        # Run the requested processing
        if args.preprocess:
            from preprocess import run
            success = run_processing_step("Preprocessing", run, chapter_name, processed_dir, args.debug, logger)
            overall_success = overall_success and success

        elif args.docusaurus:
            from docusaurus import run
            success = run_processing_step("Docusaurus", run, chapter_name, processed_dir, args.debug, logger)
            overall_success = overall_success and success

        elif args.latex:
            from latex import run
            success = run_processing_step("LaTeX", run, chapter_name, processed_dir, args.debug, logger)
            overall_success = overall_success and success

        elif args.tts:
            from tts import run
            success = run_processing_step("TTS", run, chapter_name, processed_dir, args.debug, logger)
            overall_success = overall_success and success

        elif args.full:
            # Run all available processing steps in sequence
            logger.info("Running full processing pipeline...")
            
            # Step 1: Preprocessing
            from preprocess import run as run_preprocess
            success = run_processing_step("Preprocessing", run_preprocess, chapter_name, processed_dir, args.debug, logger)
            overall_success = overall_success and success
            
            # Step 2: Docusaurus (only if preprocessing succeeded)
            if success:
                try:
                    from docusaurus import run as run_docusaurus
                    success = run_processing_step("Docusaurus", run_docusaurus, chapter_name, processed_dir, args.debug, logger)
                    overall_success = overall_success and success
                except ImportError as e:
                    logger.warning(f"Docusaurus module not available: {e}")
                    overall_success = False
            else:
                logger.error("Skipping remaining steps due to preprocessing failure")
                overall_success = False
            
            # Step 3: LaTeX (only if preprocessing succeeded)  
            if success:
                try:
                    from latex import run as run_latex
                    success = run_processing_step("LaTeX", run_latex, chapter_name, processed_dir, args.debug, logger)
                    overall_success = overall_success and success
                except ImportError as e:
                    logger.warning(f"LaTeX module not available: {e}")
                    overall_success = False
            
            # Step 4: TTS (only if preprocessing succeeded)
            if success:
                try:
                    from tts import run as run_tts
                    success = run_processing_step("TTS", run_tts, chapter_name, processed_dir, args.debug, logger)
                    overall_success = overall_success and success
                except ImportError as e:
                    logger.warning(f"TTS module not available: {e}")
                    overall_success = False
            
            if overall_success:
                logger.info("🎉 Full processing pipeline completed successfully!")
            else:
                logger.error("❌ Full processing pipeline completed with errors")
        
        if overall_success:
            logger.info("Processing complete!")
        else:
            logger.error("Processing completed with errors")
            sys.exit(1)
        
    except Exception as e:
        logger.error(f"Error processing {args.source}: {e}")
        if args.debug:
            import traceback
            traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
