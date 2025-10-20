# File: scripts/latex/headers.py
import re
import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional

# Get logger
logger = logging.getLogger("latex.headers")

def remove_style_tags(content: str) -> str:
    """Remove userStyle tags and similar."""
    logger.debug("Removing style tags")
    cleaned = re.sub(r'<userStyle>.*?</userStyle>\s*', '', content, flags=re.DOTALL)
    return cleaned

def get_chapter_number(processed_dir: Path) -> int:
    """Get chapter number from metadata file."""
    try:
        metadata_path = processed_dir / "preprocessed" / "metadata.json5"
        if metadata_path.exists():
            metadata = json.loads(metadata_path.read_text(encoding='utf-8'))
            chapter_num = metadata.get('chapter', {}).get('number', 1)
            logger.info(f"Found chapter number: {chapter_num}")
            return chapter_num
    except (json.JSONDecodeError, FileNotFoundError) as e:
        logger.warning(f"Could not read metadata: {e}")
    
    logger.warning("Using default chapter number: 1")
    return 1

def is_appendix_section(title: str) -> bool:
    """Check if a section is an appendix based on its title."""
    return title.lower().strip().startswith("appendix")

def extract_appendix_title(title: str) -> str:
    """Extract the actual title from an appendix heading."""
    # Remove "Appendix:", "Appendix A:", "Appendix A.", etc. from the beginning
    cleaned = re.sub(r'^appendix\s*[a-z]?\.?\s*:?\s*', '', title, flags=re.IGNORECASE).strip()
    return cleaned if cleaned else title

def convert_headers(content: str, chapter_num: int = 1, is_first_appendix_file: bool = False) -> str:
    """Convert markdown headers to LaTeX sections with proper appendix support.
    
    Promotes all headers up one level since chapter title is handled separately.
    Uses LaTeX's built-in \\appendix command only for the first appendix file.
    
    Args:
        content: Markdown content to process
        chapter_num: Chapter number
        is_first_appendix_file: Whether this is the first file containing appendix content
    """
    
    appendix_found = False
    
    def process_header_line(match: re.Match) -> str:
        nonlocal appendix_found
        
        level = len(match.group(1))  # Number of #
        title = match.group(2).strip()

        # Check if this is an appendix section
        if level == 1 and is_appendix_section(title):
            # This is a top-level appendix
            if is_first_appendix_file and not appendix_found:
                # First appendix in first appendix file - start the appendix environment
                appendix_found = True
                
                # Extract the actual title (without "Appendix:")
                clean_title = extract_appendix_title(title)
                
                logger.info(f"Starting appendix mode with '{title}' -> Appendix A: {clean_title}")
                logger.info("This is the first appendix file - adding \\appendix command")
                
                # Start appendix environment and add first section
                return f'\\appendix\n\\section{{{clean_title}}}'
            else:
                # Subsequent appendix or appendix in non-first file
                # Extract the actual title (without "Appendix:")
                clean_title = extract_appendix_title(title)
                
                if is_first_appendix_file:
                    logger.info(f"Converting subsequent appendix '{title}' -> {clean_title}")
                else:
                    logger.info(f"Converting appendix in continuation file '{title}' -> {clean_title}")
                
                return f'\\section{{{clean_title}}}'
        
        # Regular section processing (promote everything up one level)
        if level == 1:
            logger.debug(f"Converting H1 '{title}' to \\section")
            return f'\\section{{{title}}}'
        elif level == 2:
            logger.debug(f"Converting H2 '{title}' to \\subsection")
            return f'\\subsection{{{title}}}'
        elif level == 3:
            logger.debug(f"Converting H3 '{title}' to \\subsubsection")
            return f'\\subsubsection{{{title}}}'
        elif level == 4:
            logger.debug(f"Converting H4 '{title}' to \\paragraph")
            return f'\\paragraph{{{title}}}'
        elif level == 5:
            logger.debug(f"Converting H5 '{title}' to \\subparagraph")
            return f'\\subparagraph{{{title}}}'
        
        logger.warning(f"Header level {level} not supported, keeping as-is")
        return match.group(0)

    # Only match actual markdown headers
    pattern = r'^(#+)\s+(.+?)(?:\s*#*)?$'
    processed_content = re.sub(pattern, process_header_line, content, flags=re.MULTILINE)
    
    # Count headers processed
    header_count = len(re.findall(pattern, content, flags=re.MULTILINE))
    
    if appendix_found:
        logger.info(f"Processed {header_count} headers including appendix sections (first appendix file)")
    else:
        logger.info(f"Processed {header_count} headers")
    
    return processed_content

def validate_headers_against_toc(content: str, processed_dir: Path) -> None:
    """Validate processed headers against TOC structure."""
    try:
        toc_path = processed_dir / "preprocessed" / "toc.json5"
        if not toc_path.exists():
            logger.warning("No TOC file found for validation")
            return
        
        with open(toc_path, 'r', encoding='utf-8') as f:
            toc_data = json.load(f)
        
        # Extract headers from content
        pattern = r'^(#+)\s+(.+?)(?:\s*#*)?$'
        content_headers = re.findall(pattern, content, flags=re.MULTILINE)
        content_titles = [title.strip() for _, title in content_headers]
        
        # Extract section titles from TOC
        toc_titles = []
        for section in toc_data.get("sections", []):
            toc_titles.append(section.get("title", ""))
            # Add subsections
            for subsection in section.get("subsections", []):
                toc_titles.append(subsection.get("title", ""))
                # Add sub-subsections
                for sub_subsection in subsection.get("subsections", []):
                    toc_titles.append(sub_subsection.get("title", ""))
        
        # Compare
        logger.info(f"Header validation: {len(content_titles)} content headers vs {len(toc_titles)} TOC entries")
        
        missing_in_content = set(toc_titles) - set(content_titles)
        missing_in_toc = set(content_titles) - set(toc_titles)
        
        if missing_in_content:
            logger.warning(f"Headers in TOC but not in content: {list(missing_in_content)[:5]}")
        
        if missing_in_toc:
            logger.warning(f"Headers in content but not in TOC: {list(missing_in_toc)[:5]}")
        
        if not missing_in_content and not missing_in_toc:
            logger.info("✓ All headers match between content and TOC")
            
    except Exception as e:
        logger.warning(f"Header validation failed: {e}")

def process(content: str, processed_dir: Path, debug_dir: Optional[Path] = None, is_first_appendix_file: bool = False) -> Tuple[str, Dict]:
    """Main processing function to convert headers with proper appendix support.
    
    Args:
        content: The markdown content to process
        processed_dir: Base processed directory for accessing metadata
        debug_dir: Optional directory for debug output
        is_first_appendix_file: Whether this is the first file containing appendix content
        
    Returns:
        Tuple of (processed_content, stats_dict)
    """
    logger.info("Processing headers for LaTeX conversion with proper appendix support...")
    
    # Remove style tags first
    content = remove_style_tags(content)
    
    # Get chapter number (for stats only)
    chapter_num = get_chapter_number(processed_dir)
    
    # Count headers before processing and validate against TOC
    pattern = r'^(#+)\s+(.+?)(?:\s*#*)?$'
    header_count = len(re.findall(pattern, content, flags=re.MULTILINE))
    validate_headers_against_toc(content, processed_dir)
    
    # Convert headers with proper appendix support
    content = convert_headers(content, chapter_num, is_first_appendix_file)
    
    # Clean up extra newlines
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    # Save debug output if requested
    if debug_dir:
        debug_path = debug_dir / "headers.tex"
        with open(debug_path, 'w', encoding='utf-8') as f:
            f.write(content)
        logger.info(f"Saved debug output to {debug_path}")
    
    stats = {
        "chapter_number": chapter_num,
        "headers_processed": header_count
    }
    
    logger.info(f"Header processing complete - {header_count} headers processed with proper LaTeX appendix support")
    
    return content, stats
