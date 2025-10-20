# scripts/common/logger.py
import logging
import sys
from pathlib import Path
from datetime import datetime
import os

# Try to import colorama for colored terminal output
try:
    import colorama
    from colorama import Fore, Style
    colorama.init(autoreset=True)
    COLOR_ENABLED = True
except ImportError:
    COLOR_ENABLED = False
    class DummyFore:
        RED = GREEN = YELLOW = CYAN = BLUE = MAGENTA = ""
    class DummyStyle:
        BRIGHT = RESET_ALL = ""
    Fore = DummyFore()
    Style = DummyStyle()

class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors and timestamps"""
    
    FORMATS = {
        logging.DEBUG: Fore.CYAN + "DEBUG: %(message)s" + Style.RESET_ALL,
        logging.INFO: Fore.GREEN + "%(message)s" + Style.RESET_ALL,
        logging.WARNING: Fore.YELLOW + "WARNING: %(message)s" + Style.RESET_ALL,
        logging.ERROR: Fore.RED + "ERROR: %(message)s" + Style.RESET_ALL,
        logging.CRITICAL: Style.BRIGHT + Fore.RED + "CRITICAL: %(message)s" + Style.RESET_ALL
    }
    
    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)

# Configure root logger first
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
if not root_logger.handlers:
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(ColoredFormatter())
    root_logger.addHandler(console_handler)

def setup_logger(name, debug=False, log_file=None):
    """Set up and return a logger with the given name.
    
    Args:
        name: Logger name (usually module name)
        debug: Whether to enable debug mode
        log_file: Optional file path to write logs to
        
    Returns:
        logging.Logger: Configured logger
    """
    # Set global level to debug if debug is enabled for any module
    if debug:
        root_logger.setLevel(logging.DEBUG)
    
    # Get or create module logger
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG if debug else logging.INFO)
    
    # Don't propagate to root logger since we'll configure handlers directly
    logger.propagate = False
    
    # Remove existing handlers to avoid duplicates
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Add console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(ColoredFormatter())
    logger.addHandler(console_handler)
    
    # File handler if log_file is provided
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_format = logging.Formatter("[%(asctime)s] [%(name)s] %(levelname)s: %(message)s", 
                                       datefmt="%Y-%m-%d %H:%M:%S")
        file_handler.setFormatter(file_format)
        logger.addHandler(file_handler)
    
    return logger

def log_banner(logger, title):
    """Log a banner with the given title."""
    logger.info(f"{Fore.CYAN}{'='*80}{Style.RESET_ALL}")
    logger.info(f"{Fore.CYAN}{title:^80}{Style.RESET_ALL}")
    logger.info(f"{Fore.CYAN}{'='*80}{Style.RESET_ALL}")

def log_section(logger, title):
    """Log a section header with the given title."""
    logger.info(f"\n{Fore.YELLOW}{title:^80}{Style.RESET_ALL}")
    logger.info(f"{Fore.YELLOW}{'-'*80}{Style.RESET_ALL}")
