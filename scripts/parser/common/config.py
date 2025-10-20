# scripts/common/config.py
import json
import os
from pathlib import Path

# Try to import JSON5 for more flexible JSON parsing
try:
    import json5
    parse_json = json5.load
except ImportError:
    parse_json = json.load

# Get the base directory (repo root)
BASE_DIR = Path(__file__).parent.parent.parent

# Configuration cache
_config = None

def load_config():
    """Load the configuration from config.json5."""
    global _config
    
    if _config is not None:
        return _config
        
    config_path = BASE_DIR / "scripts" / "config.json5"
    
    # Default configuration
    default_config = {
        "paths": {
            "source_dir": "source_zips",
            "processed_dir": "processed"
        }
    }
    
    # Load configuration if it exists
    if config_path.exists():
        with open(config_path, 'r') as f:
            try:
                loaded_config = parse_json(f)
                # Merge with defaults
                default_config.update(loaded_config)
            except Exception as e:
                print(f"Error loading config: {e}")
    else:
        # Create default config file
        with open(config_path, 'w') as f:
            json.dump(default_config, f, indent=2)
    
    _config = default_config
    return _config

def get_path(path_name, *subdirs):
    """Get an absolute path from the configuration.
    
    Args:
        path_name: Name of the path in the config
        *subdirs: Optional subdirectories to join
        
    Returns:
        Path: Absolute path
    """
    config = load_config()
    
    if path_name not in config["paths"]:
        raise ValueError(f"Path '{path_name}' not found in configuration")
        
    # Get the base path
    base_path = Path(config["paths"][path_name])
    
    # Make absolute if relative
    if not base_path.is_absolute():
        base_path = BASE_DIR / base_path
    
    # Join subdirectories if provided
    if subdirs:
        return base_path.joinpath(*subdirs)
    
    return base_path

def get_chapter_dir(chapter_name):
    """Get the processed directory for a chapter."""
    return get_path("processed_dir", chapter_name)

def get_source_zip(chapter_name):
    """Get the source zip path for a chapter."""
    return get_path("source_dir", f"{chapter_name}.zip")
