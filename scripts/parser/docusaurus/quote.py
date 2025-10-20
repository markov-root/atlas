import logging
import re
from .component import register_component

@register_component('quote')
def process_quote(content):
    """Process quote components in content.
    
    Args:
        content: Content to process
        
    Returns:
        tuple: (processed_content, imports_list)
    """
    logger = logging.getLogger("docusaurus.component.quote")
    
    # Regular expression for full quotes with all components
    quote_pattern = r'<quote>\s*' + \
                    r'(?:<speaker>\s*(.*?)\s*)?(?:</speaker>)?\s*' + \
                    r'(?:<position>\s*(.*?)\s*)?(?:</position>)?\s*' + \
                    r'(?:<date>\s*(.*?)\s*)?(?:</date>)?\s*' + \
                    r'(?:<source>\s*(.*?)\s*)?(?:</source>)?\s*' + \
                    r'<content>\s*(.*?)\s*</content>' + \
                    r'\s*</quote>'
    
    # We'll need to import the Quote component
    imports = ['import Quote from "@site/src/components/chapters/Quote";']
    
    def replace_quote(match):
        speaker = match.group(1) or ""
        position = match.group(2) or ""
        date = match.group(3) or ""
        source = match.group(4) or ""
        content = match.group(5) or ""
        
        logger.info(f"Processing quote by {speaker}")
        
        # Create the Quote component
        return f'<Quote speaker="{speaker}" position="{position}" date="{date}" source="{source}">\n\n{content}\n\n</Quote>'
    
    # Replace quotes
    processed_content = re.sub(quote_pattern, replace_quote, content, flags=re.DOTALL)
    
    return processed_content, imports
