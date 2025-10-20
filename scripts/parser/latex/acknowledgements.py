# File: scripts/latex/acknowledgements.py
import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Get logger
logger = logging.getLogger("latex.acknowledgements")

def format_acknowledgement_names(acknowledgements: str) -> str:
    """Format acknowledgements text for LaTeX output."""
    
    # Split by commas and clean up
    names = [name.strip() for name in acknowledgements.split(',') if name.strip()]
    
    if not names:
        return ""
    
    # Format as a nicely structured list
    if len(names) == 1:
        return names[0]
    elif len(names) == 2:
        return f"{names[0]} and {names[1]}"
    else:
        return ", ".join(names[:-1]) + f", and {names[-1]}"

def create_acknowledgements_section(metadata: Dict[str, Any]) -> str:
    """Create acknowledgements section from metadata."""
    
    # Try different possible keys for acknowledgements
    acknowledgements_keys = ['acknowledgements', 'Acknowledgements', 'acknowledgments', 'Acknowledgments']
    acknowledgements_text = ""
    
    for key in acknowledgements_keys:
        if key in metadata:
            acknowledgements_text = metadata[key]
            break
    
    if not acknowledgements_text:
        logger.info("No acknowledgements found in metadata")
        return ""
    
    # Handle both string and list formats
    if isinstance(acknowledgements_text, list):
        acknowledgements_text = ", ".join(acknowledgements_text)
    
    # Format names
    formatted_names = format_acknowledgement_names(acknowledgements_text)
    
    if not formatted_names:
        return ""
    
    # Create LaTeX section
    ack_section = f"""\\section*{{Acknowledgements}}
\\addcontentsline{{toc}}{{section}}{{Acknowledgements}}

We would like to express our gratitude to {formatted_names} for their valuable feedback, discussions, and contributions to this work.
"""
    
    logger.info(f"Created acknowledgements section with {len(formatted_names.split(','))} contributors")
    
    return ack_section

def add_acknowledgements_to_content(content: str, ack_section: str) -> str:
    """Add acknowledgements section to the content before bibliography."""
    
    if not ack_section:
        return content
    
    import re
    
    # Find where to insert acknowledgements
    # Try to insert before bibliography, references, or end of document
    
    # Pattern 1: Before bibliography
    if '\\clearpage' in content and '\\bibliography' in content:
        # Simple string replacement to avoid regex issues
        content = content.replace('\\clearpage\n\\bibliography', ack_section + '\n\\clearpage\n\\bibliography')
        logger.info("Inserted acknowledgements before bibliography (string replacement)")
        return content
    
    # Pattern 2: Before bibliography environment
    if '\\begin{thebibliography}' in content:
        content = content.replace('\\begin{thebibliography}', ack_section + '\n\\begin{thebibliography}')
        logger.info("Inserted acknowledgements before bibliography environment")
        return content
    
    # Pattern 3: Before end of document
    if '\\end{document}' in content:
        content = content.replace('\\end{document}', ack_section + '\n\\end{document}')
        logger.info("Inserted acknowledgements before end of document")
        return content
    
    # If no good insertion point found, append to the end
    content += '\n' + ack_section
    logger.info("Appended acknowledgements section to end")
    return content

def process(content: str, processed_dir: Path, latex_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
    """Main processing function for LaTeX acknowledgements generation.
    
    Args:
        content: The document content (not modified)
        processed_dir: Base processed directory for loading metadata
        latex_dir: LaTeX directory for creating acknowledgements file
        debug_dir: Optional directory for debug output
        
    Returns:
        Tuple of (unchanged content, stats_dict)
    """
    logger.info("Processing acknowledgements for LaTeX conversion...")
    
    try:
        # Load metadata
        metadata_path = processed_dir / "preprocessed" / "metadata.json5"
        if not metadata_path.exists():
            logger.warning(f"Metadata file not found: {metadata_path}")
            return content, {"acknowledgements_file_created": False, "error": "No metadata file found"}
        
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        # Create acknowledgements section
        ack_section = create_acknowledgements_section(metadata)
        
        if not ack_section:
            logger.info("No acknowledgements to add")
            return content, {"acknowledgements_file_created": False}
        
        # Write acknowledgements to a separate file
        ack_file_path = latex_dir / "sections" / "acknowledgements.tex"
        with open(ack_file_path, 'w', encoding='utf-8') as f:
            f.write(ack_section)
        
        logger.info(f"Created acknowledgements file: {ack_file_path}")
        
        # Save debug output if requested
        if debug_dir:
            debug_path = debug_dir / "acknowledgements.tex"
            with open(debug_path, 'w', encoding='utf-8') as f:
                f.write(ack_section)
            logger.info(f"Saved acknowledgements debug output to {debug_path}")
        
        stats = {
            "acknowledgements_file_created": True,
            "acknowledgements_file": str(ack_file_path),
            "acknowledgements_length": len(ack_section),
            "contributors_mentioned": len([name.strip() for name in 
                                         str(metadata.get('acknowledgements', metadata.get('Acknowledgements', ''))).split(',') 
                                         if name.strip()])
        }
        
        logger.info("Acknowledgements processing complete")
        
        return content, stats
        
    except Exception as e:
        logger.error(f"Error processing acknowledgements: {e}")
        return content, {"acknowledgements_file_created": False, "error": str(e)}
