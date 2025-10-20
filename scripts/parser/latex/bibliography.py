# File: scripts/latex/bibliography.py
import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
from datetime import datetime

# Get logger
logger = logging.getLogger("latex.bibliography")

def create_dummy_bib_entry(metadata: Dict[str, Any], page_count: int = 1) -> str:
    """Create a dummy bibliography entry from metadata."""
    
    # Extract information from metadata
    chapter_info = metadata.get("chapter", {})
    chapter_title = chapter_info.get("title", "Unknown Chapter")
    chapter_number = chapter_info.get("number", 1)
    authors = metadata.get("authors", ["Unknown Author"])
    
    # Format authors for BibTeX
    if len(authors) == 1:
        author_str = authors[0]
    elif len(authors) == 2:
        author_str = f"{authors[0]} and {authors[1]}"
    else:
        # For more than 2 authors, use first author et al. or list all
        if len(authors) > 3:
            author_str = f"{authors[0]} and others"
        else:
            author_str = " and ".join(authors)
    
    # Get current year
    current_year = datetime.now().year
    
    # Create BibTeX entry
    bib_entry = f"""@article{{dummy,
  author = {{{author_str}}},
  title = {{{chapter_title}}},
  journal = {{AI Safety Atlas}},
  year = {{{current_year}}},
  volume = {{{chapter_number}}},
  pages = {{{page_count}}},
  note = {{This document uses hyperlinked citations throughout the text. Each citation is directly linked to its source using HTML hyperlinks rather than traditional numbered references. Please refer to the inline citations for complete source information.}}
}}"""
    
    return bib_entry

def create_bibliography_files(latex_dir: Path, metadata: Dict[str, Any], page_count: int = 1) -> Tuple[Path, Path]:
    """Create .bib and .bbl files for the bibliography."""
    
    # Create .bib file
    bib_path = latex_dir / "references.bib"
    bib_content = create_dummy_bib_entry(metadata, page_count)
    
    with open(bib_path, 'w', encoding='utf-8') as f:
        f.write(bib_content)
    
    logger.info(f"Created bibliography file: {bib_path}")
    
    # Create .bbl file (compiled bibliography for LaTeX)
    bbl_path = latex_dir / "main.bbl"
    
    # Extract info for bbl
    chapter_info = metadata.get("chapter", {})
    chapter_title = chapter_info.get("title", "Unknown Chapter")
    authors = metadata.get("authors", ["Unknown Author"])
    current_year = datetime.now().year
    
    # Format authors for display
    if len(authors) == 1:
        author_display = authors[0]
    elif len(authors) == 2:
        author_display = f"{authors[0]} and {authors[1]}"
    else:
        if len(authors) > 3:
            author_display = f"{authors[0]} et al."
        else:
            author_display = ", ".join(authors[:-1]) + f", and {authors[-1]}"
    
    bbl_content = f"""\\begin{{thebibliography}}{{1}}

\\bibitem{{dummy}}
{author_display}.
\\newblock {chapter_title}.
\\newblock \\emph{{AI Safety Atlas}}, {current_year}.
\\newblock This document uses hyperlinked citations throughout the text. Each citation is directly linked to its source using HTML hyperlinks rather than traditional numbered references. Please refer to the inline citations for complete source information.

\\end{{thebibliography}}
"""
    
    with open(bbl_path, 'w', encoding='utf-8') as f:
        f.write(bbl_content)
    
    logger.info(f"Created compiled bibliography file: {bbl_path}")
    
    return bib_path, bbl_path

def add_bibliography_to_content(content: str) -> str:
    """Add bibliography section to the end of the content."""
    
    # Add bibliography section before \end{document}
    if "\\end{document}" in content:
        # Insert before \end{document}
        bibliography_section = """
\\clearpage
\\bibliography{references}
\\bibliographystyle{plain}

"""
        content = content.replace("\\end{document}", bibliography_section + "\\end{document}")
    else:
        # Append to end if no \end{document} found
        bibliography_section = """
\\clearpage
\\bibliography{references}
\\bibliographystyle{plain}
"""
        content += bibliography_section
    
    return content

def estimate_page_count(latex_dir: Path) -> int:
    """Estimate page count from content size."""
    
    total_chars = 0
    sections_dir = latex_dir / "sections"
    
    if sections_dir.exists():
        for tex_file in sections_dir.glob("*.tex"):
            try:
                with open(tex_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Count non-whitespace characters
                    total_chars += len([c for c in content if not c.isspace()])
            except Exception as e:
                logger.warning(f"Could not read {tex_file} for page estimation: {e}")
    
    # Very rough estimate: ~2000 characters per page
    estimated_pages = max(1, total_chars // 2000)
    
    logger.info(f"Estimated page count: {estimated_pages} (based on {total_chars} characters)")
    
    return estimated_pages

def process(content: str, processed_dir: Path, latex_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for LaTeX bibliography generation.
    
    Args:
        content: The current document content (not modified)
        processed_dir: Base processed directory for loading metadata
        latex_dir: LaTeX directory for creating bibliography files
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (unchanged content, stats_dict)
    """
    logger.info("Processing bibliography for LaTeX conversion...")
    
    try:
        # Load metadata
        metadata_path = processed_dir / "preprocessed" / "metadata.json5"
        if not metadata_path.exists():
            logger.warning(f"Metadata file not found: {metadata_path}")
            return content, {"error": "No metadata file found"}
        
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        # Estimate page count
        page_count = estimate_page_count(latex_dir)
        
        # Create bibliography files
        bib_path, bbl_path = create_bibliography_files(latex_dir, metadata, page_count)
        
        # Save debug output if requested
        if debug_dir:
            debug_path = debug_dir / "bibliography_info.json"
            debug_data = {
                "metadata": metadata,
                "page_count": page_count,
                "bib_file": str(bib_path),
                "bbl_file": str(bbl_path)
            }
            with open(debug_path, 'w', encoding='utf-8') as f:
                json.dump(debug_data, f, indent=2)
        
        stats = {
            "bib_file_created": str(bib_path),
            "bbl_file_created": str(bbl_path),
            "estimated_pages": page_count,
            "authors_count": len(metadata.get("authors", [])),
            "chapter_number": metadata.get("chapter", {}).get("number", 0)
        }
        
        logger.info(f"Bibliography processing complete - created {bib_path.name} and {bbl_path.name}")
        
        return content, stats
        
    except Exception as e:
        logger.error(f"Error processing bibliography: {e}")
        return content, {"error": str(e)}
