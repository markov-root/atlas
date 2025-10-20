# scripts/docusaurus/iframe.py
import logging
import re
import json
from pathlib import Path
from .component import register_component

def load_media_registry(processed_dir):
    """Load media registry from preprocessed directory.
    
    Args:
        processed_dir: Base processed directory
        
    Returns:
        dict: Media registry data, or empty dict if not found
    """
    logger = logging.getLogger("docusaurus.component.iframe")
    
    if not processed_dir:
        logger.warning("No processed_dir provided, cannot load media registry")
        return {}
    
    registry_path = processed_dir / "preprocessed" / "media_registry.json"
    
    if not registry_path.exists():
        logger.warning(f"Media registry not found at {registry_path}")
        return {}
    
    try:
        with open(registry_path, 'r', encoding='utf-8') as f:
            registry = json.load(f)
        
        iframe_count = len([entry for entry in registry.get('media_registry', []) if entry['type'] == 'iframe'])
        logger.info(f"Loaded media registry with {iframe_count} iframe entries")
        return registry
    except Exception as e:
        logger.error(f"Error loading media registry: {e}")
        return {}

def create_iframe_lookup(media_registry):
    """Create a lookup dictionary for iframes by source URL.
    
    Args:
        media_registry: Media registry data
        
    Returns:
        dict: Mapping of iframe sources to iframe data
    """
    iframe_lookup = {}
    
    for entry in media_registry.get("media_registry", []):
        if entry["type"] == "iframe":
            # Use iframe_src as the key for lookup
            iframe_src = entry["iframe_src"]
            iframe_lookup[iframe_src] = entry
    
    return iframe_lookup

@register_component('iframe')
def process_iframe(content, processed_dir=None):
    """Process iframe-related components in content using media registry for numbering.
    
    This processor handles:
    1. <iframe-static-figure> blocks - removes them entirely (they're for non-iframe formats like LaTeX)
    2. <iframe> + <iframe-caption> combinations - converts to single IFrame component
    3. Standalone <iframe> tags - converts to IFrame component
    
    Args:
        content: Content to process
        processed_dir: Base processed directory for loading media registry
        
    Returns:
        tuple: (processed_content, imports_list)
    """
    logger = logging.getLogger("docusaurus.component.iframe")
    
    # Load media registry
    media_registry = load_media_registry(processed_dir)
    iframe_lookup = create_iframe_lookup(media_registry)
    logger.info(f"Created iframe lookup with {len(iframe_lookup)} entries")
    
    # Track what we process
    static_figure_count = 0
    iframe_count = 0
    
    # Pattern to match iframe-static-figure blocks
    static_figure_pattern = r'<iframe-static-figure>\s*(.*?)\s*</iframe-static-figure>'
    
    def validate_and_remove_static_figure(match):
        nonlocal static_figure_count
        static_figure_count += 1
        
        # Extract the content inside the iframe-static-figure block
        inner_content = match.group(1).strip()
        
        logger.info(f"Processing iframe-static-figure block #{static_figure_count}")
        
        # Validate that the content is only an image
        # Should match pattern: ![alt text](Images/filename.ext)
        image_pattern = r'^\!\[.*?\]\(Images\/[^)]+\)$'
        
        if not re.match(image_pattern, inner_content):
            # Check if there's extra content beyond just the image
            lines = [line.strip() for line in inner_content.split('\n') if line.strip()]
            if len(lines) != 1 or not re.match(image_pattern, lines[0]):
                logger.error(f"Invalid content in iframe-static-figure block #{static_figure_count}")
                logger.error(f"Expected only an image, found: {inner_content}")
                raise ValueError(f"iframe-static-figure block #{static_figure_count} contains invalid content. "
                               f"Expected only a markdown image, found: {inner_content}")
        
        logger.info(f"Removing iframe-static-figure block #{static_figure_count} (alternative for LaTeX)")
        logger.debug(f"  Removed image: {inner_content}")
        
        # Return empty string to remove the entire block
        return ""
    
    # Process iframe-static-figure blocks first
    processed_content = re.sub(static_figure_pattern, validate_and_remove_static_figure, content, flags=re.DOTALL)
    
    # Pattern to match iframe + iframe-caption combinations
    iframe_with_caption_pattern = r'<iframe([^>]*)>\s*</iframe>\s*<iframe-caption>\s*(.*?)\s*</iframe-caption>'
    
    def process_iframe_with_caption(match):
        nonlocal iframe_count
        iframe_count += 1
        
        iframe_attrs = match.group(1).strip()
        caption = match.group(2).strip()
        
        logger.info(f"Processing iframe with caption #{iframe_count}")
        logger.debug(f"  Caption: {caption[:50]}...")
        
        # Extract attributes from iframe
        attrs = parse_iframe_attributes(iframe_attrs)
        
        # Look up iframe data in registry
        iframe_src = attrs.get('src', '')
        iframe_data = iframe_lookup.get(iframe_src)
        
        if iframe_data:
            iframe_number = iframe_data["number"]
            iframe_label = iframe_data["label"]
            logger.info(f"Found iframe in registry (Interactive {iframe_label}): {iframe_src}")
            
            # Create IFrame component with registry data
            return create_iframe_component(attrs, caption, iframe_number, iframe_label)
        else:
            logger.warning(f"Iframe not found in registry: {iframe_src}")
            # Fallback without numbering
            return create_iframe_component(attrs, caption)
    
    # Process iframe + caption combinations
    processed_content = re.sub(iframe_with_caption_pattern, process_iframe_with_caption, processed_content, flags=re.DOTALL)
    
    # Pattern to match standalone iframe tags (without captions)
    standalone_iframe_pattern = r'<iframe([^>]*)>\s*</iframe>'
    
    def process_standalone_iframe(match):
        nonlocal iframe_count
        iframe_count += 1
        
        iframe_attrs = match.group(1).strip()
        
        logger.info(f"Processing standalone iframe #{iframe_count}")
        
        # Extract attributes from iframe
        attrs = parse_iframe_attributes(iframe_attrs)
        
        # Look up iframe data in registry
        iframe_src = attrs.get('src', '')
        iframe_data = iframe_lookup.get(iframe_src)
        
        if iframe_data:
            iframe_number = iframe_data["number"]
            iframe_label = iframe_data["label"]
            logger.info(f"Found iframe in registry (Interactive {iframe_label}): {iframe_src}")
            
            # Create Iframe component with registry data
            return create_iframe_component(attrs, "", iframe_number, iframe_label)
        else:
            logger.warning(f"Iframe not found in registry: {iframe_src}")
            # Fallback without numbering
            return create_iframe_component(attrs, "")
    
    # Process standalone iframes (only if they weren't already processed with captions)
    processed_content = re.sub(standalone_iframe_pattern, process_standalone_iframe, processed_content, flags=re.DOTALL)
    
    # Clean up any extra whitespace left behind
    processed_content = re.sub(r'\n{3,}', '\n\n', processed_content)
    
    # Log results
    if static_figure_count > 0:
        logger.info(f"Removed {static_figure_count} iframe-static-figure blocks (LaTeX alternatives)")
    
    if iframe_count > 0:
        logger.info(f"Processed {iframe_count} iframe(s) into Iframe components")
        # Return Iframe component import
        return processed_content, ['import Iframe from "@site/src/components/chapters/Iframe";']
    else:
        logger.info("No iframes found to process")
        return processed_content, []

def parse_iframe_attributes(attrs_string):
    """Parse iframe attributes from the attributes string.
    
    Args:
        attrs_string: String containing iframe attributes
        
    Returns:
        dict: Parsed attributes with clean values
    """
    logger = logging.getLogger("docusaurus.component.iframe")
    
    attrs = {}
    
    # Extract src
    src_match = re.search(r'src="([^"]*)"', attrs_string)
    if src_match:
        attrs['src'] = src_match.group(1)
    
    # Extract loading attribute
    loading_match = re.search(r'loading="([^"]*)"', attrs_string)
    if loading_match:
        attrs['loading'] = loading_match.group(1)
    
    # Extract allow attribute
    allow_match = re.search(r'allow="([^"]*)"', attrs_string)
    if allow_match:
        attrs['allow'] = allow_match.group(1)
    
    # Extract title attribute
    title_match = re.search(r'title="([^"]*)"', attrs_string)
    if title_match:
        attrs['title'] = title_match.group(1)
    
    # Extract style attribute and convert to simple string values
    style_match = re.search(r'style=\{\{([^}]*)\}\}', attrs_string)
    if style_match:
        style_content = style_match.group(1)
        attrs.update(parse_style_object_to_props(style_content))
        logger.debug(f"Parsed React style object to props")
    else:
        # Try to parse old-style CSS string
        css_style_match = re.search(r'style="([^"]*)"', attrs_string)
        if css_style_match:
            css_style = css_style_match.group(1)
            attrs.update(convert_css_to_props(css_style))
            logger.debug(f"Converted CSS style to props")
    
    # Extract width and height attributes directly if present
    width_match = re.search(r'width="([^"]*)"', attrs_string)
    if width_match:
        attrs['width'] = width_match.group(1)
    
    height_match = re.search(r'height="([^"]*)"', attrs_string)
    if height_match:
        attrs['height'] = height_match.group(1)
    
    return attrs

def parse_style_object_to_props(style_content):
    """Parse React style object content to individual props.
    
    Args:
        style_content: Content inside {{...}} style object
        
    Returns:
        dict: Individual style properties as props
    """
    props = {}
    
    # Parse key-value pairs from React style object
    # Example: "width": "100%", "height": "600px", "border": "0px none"
    pairs = re.findall(r'"([^"]+)":\s*"([^"]*)"', style_content)
    
    for key, value in pairs:
        # Convert React style keys to standard HTML attributes where appropriate
        if key == 'width':
            props['width'] = value
        elif key == 'height':
            props['height'] = value
        elif key == 'border':
            if value in ['0px none', '0', 'none']:
                props['frameBorder'] = "0"
        # Add more conversions as needed
    
    return props

def convert_css_to_props(css_style):
    """Convert CSS style string to individual props.
    
    Args:
        css_style: CSS style string
        
    Returns:
        dict: Individual style properties as props
    """
    props = {}
    
    # Parse CSS declarations
    declarations = [d.strip() for d in css_style.split(';') if d.strip()]
    
    for declaration in declarations:
        if ':' in declaration:
            prop, value = declaration.split(':', 1)
            prop = prop.strip()
            value = value.strip()
            
            # Convert common CSS properties to HTML attributes
            if prop == 'width':
                props['width'] = value
            elif prop == 'height':
                props['height'] = value
            elif prop == 'border':
                if value in ['0px none', '0', 'none']:
                    props['frameBorder'] = "0"
    
    return props

def create_iframe_component(attrs, caption="", iframe_number=None, iframe_label=None):
    """Create an Iframe React component with all necessary props.
    
    Args:
        attrs: Dictionary of iframe attributes
        caption: Optional caption text
        iframe_number: Sequential iframe number from registry
        iframe_label: Formatted iframe label from registry (e.g., "5.1")
        
    Returns:
        str: Iframe component JSX
    """
    logger = logging.getLogger("docusaurus.component.iframe")
    
    # Start building the component
    props = []
    
    # Add src (required)
    src = attrs.get('src', '')
    if src:
        props.append(f'src="{src}"')
    
    # Add title if available
    title = attrs.get('title', '')
    if title:
        # Escape quotes in title
        title = title.replace('"', '\\"')
        props.append(f'title="{title}"')
    
    # Add dimensions
    width = attrs.get('width', '100%')
    height = attrs.get('height', '600px')
    props.append(f'width="{width}"')
    props.append(f'height="{height}"')
    
    # Add loading attribute
    loading = attrs.get('loading', 'lazy')
    props.append(f'loading="{loading}"')
    
    # Add allow attribute
    allow = attrs.get('allow', '')
    if allow:
        props.append(f'allow="{allow}"')
    
    # Add frameBorder
    frame_border = attrs.get('frameBorder', '0')
    props.append(f'frameBorder="{frame_border}"')
    
    # Add number and label if available from registry
    if iframe_number is not None:
        props.append(f'number="{iframe_number}"')
    
    if iframe_label is not None:
        props.append(f'label="{iframe_label}"')
    
    # Add caption if provided
    if caption:
        # Escape quotes in caption and preserve any markdown links
        caption = caption.replace('"', '\\"')
        props.append(f'caption="{caption}"')
    
    # Join all props
    props_string = ' '.join(props)
    
    # Create the component
    component = f'<Iframe {props_string} />'
    
    if iframe_label:
        logger.info(f"Created Iframe component (Interactive {iframe_label})")
    else:
        logger.info(f"Created Iframe component (no registry data)")
    logger.debug(f"  Props: {props_string}")
    
    return component
