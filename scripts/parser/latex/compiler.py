# File: scripts/latex/compiler.py
import os
import subprocess
import logging
from pathlib import Path

# Get logger
logger = logging.getLogger("latex.compiler")

def compile_pdf(latex_dir):
    """Compile LaTeX to PDF.
    
    Args:
        latex_dir: LaTeX directory containing main.tex
        
    Returns:
        dict: Compilation results
    """
    logger.info("Compiling LaTeX to PDF...")
    
    try:
        current_dir = Path.cwd()
        os.chdir(latex_dir)
        
        # Check if pdflatex is available
        try:
            subprocess.run(["pdflatex", "--version"], 
                         capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.error("pdflatex not found - please install a LaTeX distribution")
            return {
                "success": False,
                "error": "pdflatex not available"
            }
        
        # First compilation run
        logger.info("Running pdflatex (first pass)...")
        result1 = subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", "main.tex"],
            capture_output=True,
            text=True,
            encoding='utf-8',  # Add explicit encoding
            errors='replace'   # Replace problematic characters instead of failing
        )
        
        # Second compilation run for references
        logger.info("Running pdflatex (second pass)...")
        result2 = subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", "main.tex"],
            capture_output=True,
            text=True,
            encoding='utf-8',  # Add explicit encoding
            errors='replace'   # Replace problematic characters instead of failing
        )
        
        os.chdir(current_dir)
        
        # Check compilation success
        success = result1.returncode == 0 and result2.returncode == 0
        pdf_path = latex_dir / "main.pdf"
        
        if success and pdf_path.exists():
            logger.info(f"PDF compilation successful: {pdf_path}")
            return {
                "success": True,
                "pdf_path": str(pdf_path)
            }
        else:
            logger.warning("PDF compilation failed")
            
            # Extract and log error information
            if result1.returncode != 0:
                logger.warning(f"First pdflatex run failed with code {result1.returncode}")
                log_latex_errors(result1.stdout)
            
            if result2.returncode != 0:
                logger.warning(f"Second pdflatex run failed with code {result2.returncode}")
                log_latex_errors(result2.stdout)
            
            return {
                "success": False,
                "error": "Compilation failed",
                "returncode_1": result1.returncode,
                "returncode_2": result2.returncode
            }
        
    except Exception as e:
        logger.error(f"PDF compilation error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def log_latex_errors(latex_output):
    """Extract and log LaTeX error messages.
    
    Args:
        latex_output: Output from pdflatex command
    """
    if not latex_output:
        return
    
    lines = latex_output.split('\n')
    error_lines = []
    
    # Look for common LaTeX error patterns
    for i, line in enumerate(lines):
        if any(error_word in line.lower() for error_word in ['error', 'undefined', 'missing', 'illegal']):
            # Capture the error line and a few lines of context
            start = max(0, i - 2)
            end = min(len(lines), i + 3)
            error_context = lines[start:end]
            error_lines.extend(error_context)
            error_lines.append("---")
    
    # Log the most relevant error lines
    if error_lines:
        logger.warning("LaTeX compilation errors detected:")
        for line in error_lines[-20:]:  # Last 20 lines to avoid spam
            if line.strip():
                logger.warning(f"LaTeX: {line}")
    else:
        # If no specific errors found, log the last few lines
        last_lines = [line for line in lines[-10:] if line.strip()]
        if last_lines:
            logger.warning("LaTeX output (last few lines):")
            for line in last_lines:
                logger.warning(f"LaTeX: {line}")
