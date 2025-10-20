import logging
import re
from .component import register_component

@register_component('note')
def process_note(content):
    """Process note/admonition components in content.
    
    Args:
        content: Content to process
        
    Returns:
        tuple: (processed_content, imports_list)
    """
    logger = logging.getLogger("docusaurus.component.note")
    
    # Debug logs for input
    logger.info(f"Checking for note-box tags in content...")
    
    # Simple pattern to check if note-box tags exist in the content
    has_note_box = '<note-box>' in content
    logger.info(f"Content contains note-box tags: {has_note_box}")
    
    if has_note_box:
        # Extract all note-box blocks for manual processing
        blocks = []
        start_indices = [m.start() for m in re.finditer(r'<note-box>', content)]
        end_indices = [m.start() for m in re.finditer(r'</note-box>', content)]
        
        if len(start_indices) == len(end_indices):
            for i in range(len(start_indices)):
                block = content[start_indices[i]:end_indices[i] + len('</note-box>')]
                blocks.append(block)
                logger.info(f"Extracted note-box block #{i+1} with length {len(block)}")
                
                # For debugging, print the first 200 characters of the block
                logger.info(f"Block preview: {block[:200].replace('\n', '\\n')}")
        else:
            logger.warning(f"Mismatched note-box tags: {len(start_indices)} opening, {len(end_indices)} closing")
        
        # Process each block individually
        for i, block in enumerate(blocks):
            logger.info(f"Processing note-box block #{i+1}")
            
            # Extract collapsed attribute - handle unclosed tags
            # Pattern for the collapsed tag that may not be properly closed
            collapsed_match = re.search(r'<collapsed>\s*(.*?)(?:</collapsed>|\s*<title>|\s*<content>)', block, re.DOTALL)
            collapsed_text = collapsed_match.group(1).strip() if collapsed_match else "false"
            logger.info(f"Found collapsed value: '{collapsed_text}'")
            
            # Convert to actual JSX boolean syntax with braces
            collapsed_bool = collapsed_text.lower() in ["true", "1", "yes"]
            collapsed_str = "{" + ("true" if collapsed_bool else "false") + "}"
            
            # Extract title - handle unclosed tags
            # Pattern for the title tag that may not be properly closed
            title_match = re.search(r'<title>\s*(.*?)(?:</title>|\s*<collapsed>|\s*<content>)', block, re.DOTALL)
            title = title_match.group(1).strip() if title_match and title_match.group(1).strip() else "Note"
            logger.info(f"Found title: '{title}'")
            
            # Extract content
            content_match = re.search(r'<content>\s*(.*?)\s*</content>', block, re.DOTALL)
            note_content = content_match.group(1) if content_match else ""
            
            # Create replacement with proper JSX syntax
            replacement = f'<Note title="{title}" collapsed={collapsed_str}>\n\n{note_content}\n\n</Note>'
            
            # Replace in main content
            content = content.replace(block, replacement)
            logger.info(f"Replaced note-box block #{i+1} with Note component (title: {title}, collapsed: {collapsed_str})")
    
    # Process simple note types
    simple_note_pattern = r'<note\s+type="([^"]+)">\s*(.*?)\s*</note>'
    
    def replace_simple_note(match):
        note_type = match.group(1).lower()
        note_content = match.group(2)
        
        logger.info(f"Processing note of type '{note_type}'")
        
        # Create Note component with type attribute
        return f'<Note type="{note_type}">\n\n{note_content}\n\n</Note>'
    
    # Replace simple notes
    processed_content = re.sub(simple_note_pattern, replace_simple_note, content, flags=re.DOTALL)
    
    # Import for Note component
    imports = ['import Note from "@site/src/components/chapters/Note";']
    
    return processed_content, imports
