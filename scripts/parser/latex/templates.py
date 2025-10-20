# File: scripts/latex/templates.py
import logging
from pathlib import Path
import json
import shutil

# Get logger
logger = logging.getLogger("latex.templates")

def copy_template_files(latex_dir):
    """Copy all template files from the templates directory."""
    # Get the scripts directory and find templates
    script_dir = Path(__file__).parent.parent
    templates_dir = script_dir / "latex" / "templates"
    
    if not templates_dir.exists():
        logger.warning(f"Templates directory not found: {templates_dir}")
        # Fall back to creating basic templates
        create_basic_preamble(latex_dir)
        return
    
    # Create templates subdirectory in output
    output_templates_dir = latex_dir / "templates"
    output_templates_dir.mkdir(exist_ok=True)
    
    # Copy all .tex files from templates directory to templates subfolder
    template_files = list(templates_dir.glob("*.tex"))
    
    for template_file in template_files:
        dest_file = output_templates_dir / template_file.name
        shutil.copy2(template_file, dest_file)
        logger.info(f"Copied template: {template_file.name}")
    
    logger.info(f"Copied {len(template_files)} template files to templates/ subdirectory")

def create_basic_preamble(latex_dir):
    """Create a basic preamble if no template exists."""
    preamble_content = r"""\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{amsmath,amsfonts,amssymb}
\usepackage{graphicx}
\usepackage{hyperref}
\usepackage{geometry}
\usepackage{fancyhdr}
\usepackage{titlesec}
\usepackage{footnote}
\usepackage{longtable}
\usepackage{booktabs}
\usepackage{xcolor}
\usepackage{tcolorbox}
\usepackage{enumitem}
\usepackage{float}  % Add float package for [H] option

\geometry{margin=1in}
\setlength{\parindent}{0pt}
\setlength{\parskip}{6pt}

% Configure hyperref
\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    urlcolor=blue,
    citecolor=blue
}

% Figure and table formatting
\renewcommand{\figurename}{Figure}
\renewcommand{\tablename}{Table}
"""
    
    preamble_path = latex_dir / "preamble.tex"
    with open(preamble_path, 'w', encoding='utf-8') as f:
        f.write(preamble_content)
    
    logger.info(f"Created basic preamble: {preamble_path}")

def create_title_page(latex_dir, processed_dir):
    """Generate title page from metadata."""
    try:
        metadata_path = processed_dir / "preprocessed" / "metadata.json5"
        if metadata_path.exists():
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            chapter_info = metadata.get("chapter", {})
            chapter_title = chapter_info.get("title", "Chapter")
            chapter_number = chapter_info.get("number", 1)
            authors = metadata.get("authors", ["Unknown Author"])
            
            title_content = f"""\\title{{Chapter {chapter_number}: {chapter_title}}}
\\author{{{' \\\\ '.join(authors)}}}
\\date{{\\today}}
\\maketitle
\\newpage
"""
            logger.info(f"Generated title page for Chapter {chapter_number}: {chapter_title}")
        else:
            title_content = r"""\title{Chapter Title}
\author{Authors}
\date{\today}
\maketitle
\newpage
"""
            logger.warning("No metadata found, using default title page")
        
        title_path = latex_dir / "sections" / "title.tex"
        with open(title_path, 'w', encoding='utf-8') as f:
            f.write(title_content)
        
        logger.info(f"Created title page: {title_path}")
        
    except Exception as e:
        logger.error(f"Error generating title page: {e}")
        raise

def generate_latex_structure(latex_dir, processed_dir):
    """Generate LaTeX project structure with modular templates.
    
    Args:
        latex_dir: LaTeX output directory
        processed_dir: Base processed directory
        
    Returns:
        dict: Structure generation results
    """
    logger.info("Generating modular LaTeX project structure...")
    
    try:
        # Copy all modular template files
        copy_template_files(latex_dir)
        
        # Create title page
        create_title_page(latex_dir, processed_dir)
        
        logger.info("Modular LaTeX project structure generated successfully")
        
        return {
            "status": "success",
            "files_created": [
                "preamble.tex", "01-packages.tex", "02-geometry.tex", 
                "03-colors.tex", "04-typography.tex", "05-headers.tex",
                "06-figures.tex", "07-definitions.tex", "08-quotes.tex",
                "09-notes.tex", "10-bibliography.tex", "11-page-layout.tex",
                "main.tex", "sections/title.tex"
            ]
        }
        
    except Exception as e:
        logger.error(f"Error generating LaTeX structure: {e}")
        return {
            "status": "error",
            "messages": [f"Structure generation error: {str(e)}"]
        }
