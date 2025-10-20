# scripts/common/file_utils.py
import os
import zipfile
import shutil
from pathlib import Path

def extract_zip(zip_path, extract_dir, overwrite=True):
    """Extract a zip file to the specified directory.
    
    Args:
        zip_path: Path to the zip file
        extract_dir: Directory to extract to
        overwrite: Whether to overwrite existing files
        
    Returns:
        Path: Path to the extraction directory
    """
    zip_path = Path(zip_path)
    extract_dir = Path(extract_dir)
    
    # Create extraction directory if it doesn't exist
    extract_dir.mkdir(parents=True, exist_ok=True)
    
    # Clear directory if overwrite is True
    if overwrite and extract_dir.exists():
        for item in extract_dir.iterdir():
            if item.is_file():
                item.unlink()
            elif item.is_dir():
                shutil.rmtree(item)
    
    # Extract the zip file
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)
    
    return extract_dir

def find_markdown_file(directory, potential_names=None):
    """Find a markdown file in the directory.
    
    Args:
        directory: Directory to search
        potential_names: Optional list of potential filenames to look for
        
    Returns:
        Path: Path to the markdown file, or None if not found
    """
    directory = Path(directory)
    
    # Default potential names
    if potential_names is None:
        potential_names = [
            "Chapter.md",
            "chapter.md",
            "Chapter Document.md",
            "chapter document.md",
            "Document.md",
            "document.md",
            "Output.md"
        ]
    
    # Check if any of the potential names exist
    for name in potential_names:
        file_path = directory / name
        if file_path.exists():
            return file_path
    
    # If none found, look for any markdown file
    for file_path in directory.glob("*.md"):
        return file_path
    
    # No markdown file found
    return None

def copy_directory(src, dest, overwrite=True):
    """Copy a directory to another location.
    
    Args:
        src: Source directory
        dest: Destination directory
        overwrite: Whether to overwrite existing files
    """
    src = Path(src)
    dest = Path(dest)
    
    # Create destination directory if it doesn't exist
    dest.mkdir(parents=True, exist_ok=True)
    
    # Clear directory if overwrite is True
    if overwrite and dest.exists():
        for item in dest.iterdir():
            if item.is_file():
                item.unlink()
            elif item.is_dir():
                shutil.rmtree(item)
    
    # Copy the directory
    shutil.copytree(src, dest, dirs_exist_ok=True)
