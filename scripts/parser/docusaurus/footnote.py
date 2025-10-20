# scripts/docusaurus/footnote.py
import logging
import re
from .component import register_component

@register_component('footnote')
def process_footnote(content):
    """Process footnote components in content.
    
    Args:
        content: Content to process
        
    Returns:
        tuple: (processed_content, imports_list)
    """
    logger = logging.getLogger("docusaurus.component.footnote")
    
    # Check if there are any footnote tags in the content
    has_footnotes = '<footnote>' in content or '[^' in content
    
    if not has_footnotes:
        logger.info("No footnotes found in content")
        return content, []
    
    # Track footnote count for numbering
    footnote_count = 0
    
    # Create a dictionary to track already processed footnote keys
    processed_footnotes = {}
    
    # 1. First, find all footnote definitions and store them
    md_footnote_defs = {}
    md_def_pattern = r'\[\^([^\]]+)\]:\s*(.*?)(?=\n\n|\n\[\^|\Z)'
    
    for match in re.finditer(md_def_pattern, content, re.DOTALL):
        key = match.group(1)
        text = match.group(2).strip()
        md_footnote_defs[key] = text
        logger.info(f"Found Markdown footnote definition [{key}]: {text[:30]}...")
    
    # 2. Replace all footnote references with Footnote components
    md_ref_pattern = r'\[\^([^\]]+)\]'
    
    def replace_md_footnote(match):
        nonlocal footnote_count
        key = match.group(1)
        
        # Skip if we've already processed this footnote key
        if key in processed_footnotes:
            return f'<Footnote id="{key}" number="{processed_footnotes[key]}" text="{md_footnote_defs.get(key, "Missing footnote content")}" />'
        
        # For new footnotes, increment the counter
        footnote_count += 1
        processed_footnotes[key] = footnote_count
        
        if key in md_footnote_defs:
            footnote_text = md_footnote_defs[key]
            # Preserve markdown links but escape other special characters
            # We'll handle link conversion in the component
            footnote_text = (footnote_text
                .replace('"', '\\"')
                .replace('\n', ' ')
                .strip())
            
            logger.info(f"Processing Markdown footnote #{footnote_count} with key: {key}")
            
            return f'<Footnote id="{key}" number="{footnote_count}" text="{footnote_text}" />'
        else:
            logger.warning(f"Markdown footnote reference [{key}] has no definition")
            return f'<Footnote id="{key}" number="{footnote_count}" text="Missing footnote content" />'
    
    processed_content = re.sub(md_ref_pattern, replace_md_footnote, content)
    
    # 3. Process XML-style footnotes: <footnote>content</footnote>
    xml_footnote_pattern = r'<footnote(?:\s+id="([^"]+)")?>\s*(.*?)\s*</footnote>'
    
    def replace_xml_footnote(match):
        nonlocal footnote_count
        
        footnote_id = match.group(1) or f"auto-{footnote_count + 1}"
        
        # Skip if we've already processed this footnote ID
        if footnote_id in processed_footnotes:
            return f'<Footnote id="{footnote_id}" number="{processed_footnotes[footnote_id]}" text="{match.group(2).replace("""", "\\""").replace("""", "\\""").replace("\n", " ").strip()}" />'
        
        footnote_count += 1
        processed_footnotes[footnote_id] = footnote_count
        
        # Preserve markdown links but escape other special characters
        footnote_text = match.group(2)
        footnote_text = (footnote_text
            .replace('"', '\\"')
            .replace('\n', ' ')
            .strip())
        
        logger.info(f"Processing XML footnote #{footnote_count} with id: {footnote_id}")
        
        return f'<Footnote id="{footnote_id}" number="{footnote_count}" text="{footnote_text}" />'
    
    processed_content = re.sub(xml_footnote_pattern, replace_xml_footnote, processed_content, flags=re.DOTALL)
    
    # 4. Remove the footnote definitions
    processed_content = re.sub(md_def_pattern, '', processed_content, flags=re.DOTALL)
    
    # 5. Remove any remaining footnote declaration blocks that are duplicated in the text
    # These look like: <Footnote id="footnote_1" number="2" text="This is true to a large..." />: This is true to a large...
    duplicate_pattern = r'<Footnote[^>]*id="([^"]+)"[^>]*text="([^"]+)"[^>]*/>:\s*.*?(?=\n\n|\n<|\Z)'
    processed_content = re.sub(duplicate_pattern, '', processed_content, flags=re.DOTALL)
    
    # 6. Add the FootnoteRegistry component at the end of the content
    # Only add if we actually processed any footnotes
    if footnote_count > 0:
        # Add FootnoteRegistry at the end of the content
        if not processed_content.endswith('\n'):
            processed_content += '\n'
        
        processed_content += '\n<FootnoteRegistry title="Footnotes" />\n'
        logger.info(f"Added FootnoteRegistry with {footnote_count} footnotes")
        
        # Return both Footnote and FootnoteRegistry imports
        imports = [
            'import Footnote, { FootnoteRegistry } from "@site/src/components/chapters/Footnote";'
        ]
        
        return processed_content, imports
    else:
        # No footnotes were processed
        return processed_content, []
