# scripts/docusaurus/sidebar.py
"""
Handles sidebar configuration generation with hierarchical structure.

Example
Source Files    →    Target Files    →    Document IDs    →    URLs
00.md           →    index.md        →    index           →    /chapters/06/
01.md           →    01.md           →    1               →    /chapters/06/01
02.md           →    02.md           →    2               →    /chapters/06/02
03.md           →    03.md           →    3               →    /chapters/06/03

Key Points:

Document IDs: chapters/06/1, chapters/06/2 (what Docusaurus expects)
URLs: /chapters/06/01, /chapters/06/02 (from slug frontmatter)
Sidebar: References chapters/06/1, chapters/06/2 (matches available docs)
Chapter titles: "6. Evaluations" format with chapter number

Anchor Structure Maintained:

H2 headings: #01, #02, #03, etc.
H3 headings: #01-01, #01-02, #02-01, etc.
H4 headings: #01-01-01, #01-01-02, #02-01-01, etc.


"""

from pathlib import Path
import logging
import re
import json

def load_toc_data(output_dir):
    """Load table of contents data from toc.json5 file.
    
    Args:
        output_dir: Output directory containing processed files
        
    Returns:
        dict or None: TOC data if found
    """
    logger = logging.getLogger("docusaurus.sidebar")
    
    # Try to find toc.json5 in preprocessed directory
    toc_path = output_dir.parent / "preprocessed" / "toc.json5"
    if toc_path.exists():
        logger.info(f"Found TOC file: {toc_path}")
        try:
            with open(toc_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Simple JSON5 parsing - remove comments and trailing commas
                content = re.sub(r'//.*?\n', '\n', content)  # Remove line comments
                content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)  # Remove block comments
                content = re.sub(r',(\s*[}\]])', r'\1', content)  # Remove trailing commas
                
                toc_data = json.loads(content)
                logger.info(f"Loaded TOC data with {len(toc_data.get('sections', []))} sections")
                return toc_data
        except Exception as e:
            logger.warning(f"Error parsing TOC file: {e}")
    else:
        logger.warning(f"TOC file not found at: {toc_path}")
    
    return None

def create_sidebar_items_from_toc(toc_data, chapter_num, chapter_dir):
    """Create sidebar items from TOC data with hierarchical structure.
    
    Mapping strategy:
    - TOC section 5.0 → index.md (skipped in sidebar items, handled by chapter link)
    - TOC section 5.1 → 01.md (document ID: chapters/05/1)
    - TOC section 5.2 → 02.md (document ID: chapters/05/2)
    - etc.
    
    Args:
        toc_data: TOC data structure
        chapter_num: Chapter number
        chapter_dir: Chapter directory path
        
    Returns:
        list: Sidebar items with hierarchical structure
    """
    logger = logging.getLogger("docusaurus.sidebar")
    
    if not toc_data or 'sections' not in toc_data:
        logger.warning("No sections found in TOC data")
        return []
    
    sidebar_items = []
    
    for section_index, section in enumerate(toc_data['sections']):
        section_number = section.get('number', '')
        section_title = section.get('title', '')
        section_anchor = section.get('anchor', '')
        subsections = section.get('subsections', [])
        
        # Skip introduction (5.0) as it's handled by index.md
        if section_number.endswith('.0'):
            logger.info(f"Skipping introduction section {section_number} (content goes to index.md)")
            continue
        
        # For all other sections, map to document files
        # Section 5.1 (index 1) → 01.md (document ID 1)
        # Section 5.2 (index 2) → 02.md (document ID 2)
        # etc.
        doc_id_num = section_index
        
        # Document ID: chapters/XX/1, chapters/XX/2, etc. (what Docusaurus expects)
        section_doc_id = f"chapters/{chapter_num:02d}/{doc_id_num}"
        
        # Check if the actual file exists (01.md, 02.md, etc.)
        section_file = chapter_dir / f"{doc_id_num:02d}.md"
        if not section_file.exists():
            logger.warning(f"Section file not found: {section_file} (for doc ID {section_doc_id})")
            continue
        
        logger.info(f"Mapping TOC section {section_number} → doc ID {section_doc_id} (file: {section_file.name})")
        
        # If there are subsections, create a category
        if subsections:
            logger.info(f"Creating category for section {section_number} with {len(subsections)} subsections")
            
            # Create subsection items
            subsection_items = []
            subsection_counter = 1
            
            for subsection in subsections:
                subsection_number = subsection.get('number', '')
                subsection_title = subsection.get('title', '')
                subsection_anchor = subsection.get('anchor', '')
                sub_subsections = subsection.get('subsections', [])
                
                # Create anchor ID for subsection (01, 02, etc.)
                subsection_anchor_id = f"{subsection_counter:02d}"
                
                # If this subsection has its own subsections, create a nested category
                if sub_subsections:
                    logger.info(f"Creating nested category for subsection {subsection_number}")
                    
                    # Create sub-subsection items
                    sub_subsection_items = []
                    sub_subsection_counter = 1
                    
                    for sub_subsection in sub_subsections:
                        sub_subsection_number = sub_subsection.get('number', '')
                        sub_subsection_title = sub_subsection.get('title', '')
                        
                        # Create hierarchical anchor ID (01-01, 01-02, etc.)
                        sub_subsection_anchor_id = f"{subsection_counter:02d}-{sub_subsection_counter:02d}"
                        
                        sub_subsection_item = {
                            "type": "link",
                            "label": f"{sub_subsection_number} {sub_subsection_title}",
                            "href": f"/chapters/{chapter_num:02d}/{doc_id_num:02d}#{sub_subsection_anchor_id}"
                        }
                        sub_subsection_items.append(sub_subsection_item)
                        sub_subsection_counter += 1
                        logger.info(f"Added sub-subsection: {sub_subsection_number} {sub_subsection_title} → #{sub_subsection_anchor_id}")
                    
                    # Create nested category for subsection with sub-subsections
                    nested_category = {
                        "type": "category",
                        "label": f"{subsection_number} {subsection_title}",
                        "link": {
                            "type": "generated-index",
                            "title": f"{subsection_number} {subsection_title}",
                            "slug": f"/chapters/{chapter_num:02d}/{doc_id_num:02d}#{subsection_anchor_id}"
                        },
                        "items": sub_subsection_items
                    }
                    subsection_items.append(nested_category)
                else:
                    # Simple subsection without further nesting
                    subsection_item = {
                        "type": "link",
                        "label": f"{subsection_number} {subsection_title}",
                        "href": f"/chapters/{chapter_num:02d}/{doc_id_num:02d}#{subsection_anchor_id}"
                    }
                    subsection_items.append(subsection_item)
                    logger.info(f"Added subsection: {subsection_number} {subsection_title} → #{subsection_anchor_id}")
                
                subsection_counter += 1
            
            # Create category with subsections
            category_item = {
                "type": "category",
                "label": f"{section_number} {section_title}",
                "link": {
                    "type": "doc",
                    "id": section_doc_id
                },
                "items": subsection_items
            }
            sidebar_items.append(category_item)
        else:
            # No subsections, just add the doc item
            section_item = {
                "type": "doc",
                "id": section_doc_id,
                "label": f"{section_number} {section_title}"
            }
            sidebar_items.append(section_item)
            logger.info(f"Added section: {section_number} {section_title} → {section_doc_id}")
    
    return sidebar_items

def generate_sidebar(output_dir, chapter_num, chapter_title=None):
    """Generate sidebar configuration for a chapter with hierarchical structure.
    
    Args:
        output_dir: Output directory containing processed files
        chapter_num: Chapter number
        chapter_title: Optional chapter title
        
    Returns:
        dict: Results with generated sidebar path
    """
    logger = logging.getLogger("docusaurus.sidebar")
    
    try:
        # Try to get chapter title from multiple sources in order of preference
        if not chapter_title:
            # 1. First try to get from metadata.json5
            metadata_path = output_dir.parent / "preprocessed" / "metadata.json5"
            if metadata_path.exists():
                logger.info(f"Looking for chapter title in metadata: {metadata_path}")
                try:
                    with open(metadata_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # Try to find title in the chapter object
                        chapter_title_match = re.search(r'"chapter"\s*:\s*\{[^}]*"title"\s*:\s*"([^"]+)"', content)
                        if chapter_title_match:
                            chapter_title = chapter_title_match.group(1)
                            logger.info(f"Extracted chapter title from metadata: {chapter_title}")
                except Exception as e:
                    logger.warning(f"Error reading metadata: {e}")
            
            # 2. If not found in metadata, try from TOC
            if not chapter_title:
                toc_data = load_toc_data(output_dir)
                if toc_data and 'title' in toc_data:
                    chapter_title = toc_data['title']
                    logger.info(f"Extracted chapter title from TOC: {chapter_title}")
            
            # 3. If not found in TOC, try from index file
            if not chapter_title:
                chapter_dir = output_dir / f"{chapter_num:02d}"
                index_path = chapter_dir / "index.md"
                if index_path.exists():
                    with open(index_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        title_match = re.search(r'title:\s*"([^"]+)"', content)
                        if title_match:
                            chapter_title = title_match.group(1)
                            logger.info(f"Extracted chapter title from index: {chapter_title}")
            
            # 4. Fallback to default
            if not chapter_title:
                chapter_title = f"Chapter {chapter_num}"
                logger.info(f"Using default chapter title: {chapter_title}")
        
        # Format the sidebar title as "1. Title" instead of just "Title"
        sidebar_title = f"{chapter_num}. {chapter_title}"
        logger.info(f"Using sidebar title: {sidebar_title}")
        
        # Get chapter directory
        chapter_dir = output_dir / f"{chapter_num:02d}"
        
        # Load TOC data for hierarchical structure
        toc_data = load_toc_data(output_dir)
        
        if toc_data:
            # Create sidebar items from TOC data
            section_items = create_sidebar_items_from_toc(toc_data, chapter_num, chapter_dir)
            logger.info(f"Created {len(section_items)} sidebar items from TOC data")
        else:
            # Fallback to file-based generation
            logger.warning("No TOC data found, falling back to file-based sidebar generation")
            section_items = create_sidebar_items_from_files(chapter_dir, chapter_num)
        
        # Convert sidebar items to JavaScript format
        js_items = []
        for item in section_items:
            js_items.append(format_sidebar_item_as_js(item))
        
        # Generate sidebar JS content with proper newlines
        items_content = ',\n    '.join(js_items)
        
        # Use the formatted title with chapter number
        sidebar_content = f"""// Generated by Docusaurus Parser
/** @type {{import('@docusaurus/plugin-content-docs').SidebarsConfig}} */
module.exports = {{
  type: 'category',
  label: '{sidebar_title}',
  link: {{
    type: 'doc',
    id: 'chapters/{chapter_num:02d}/index',
  }},
  items: [
    {items_content}
  ],
}};
"""
        
        # Write sidebar file to the chapter directory
        sidebar_path = chapter_dir / "sidebar.js"
        with open(sidebar_path, 'w', encoding='utf-8') as f:
            f.write(sidebar_content)
        
        logger.info(f"Generated hierarchical sidebar configuration: {sidebar_path}")
        
        return {
            "status": "success",
            "sidebar_path": str(sidebar_path),
            "messages": [f"Generated hierarchical sidebar configuration for Chapter {chapter_num}"]
        }
            
    except Exception as e:
        logger.error(f"Error generating sidebar: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {
            "status": "error",
            "messages": [f"Error generating sidebar: {e}"]
        }

def format_sidebar_item_as_js(item, indent=0):
    """Format a sidebar item as JavaScript object string.
    
    Args:
        item: Sidebar item dictionary
        indent: Indentation level
        
    Returns:
        str: JavaScript object string
    """
    indent_str = "  " * indent
    
    if item["type"] == "doc":
        return f'{indent_str}{{ type: "doc", id: "{item["id"]}", label: "{item["label"]}" }}'
    elif item["type"] == "link":
        return f'{indent_str}{{ type: "link", label: "{item["label"]}", href: "{item["href"]}" }}'
    elif item["type"] == "category":
        items_js = []
        for subitem in item["items"]:
            items_js.append(format_sidebar_item_as_js(subitem, indent + 1))
        
        # Join with proper newlines and spacing
        items_str = ',\n'.join(items_js)
        
        # Handle different link types
        if item["link"]["type"] == "doc":
            link_str = f'{indent_str}    type: "doc",\n{indent_str}    id: "{item["link"]["id"]}"'
        elif item["link"]["type"] == "generated-index":
            link_str = f'{indent_str}    type: "generated-index",\n{indent_str}    title: "{item["link"]["title"]}",\n{indent_str}    slug: "{item["link"]["slug"]}"'
        else:
            link_str = f'{indent_str}    type: "doc",\n{indent_str}    id: "{item["link"]["id"]}"'
        
        return f"""{indent_str}{{
{indent_str}  type: "category",
{indent_str}  label: "{item["label"]}",
{indent_str}  link: {{
{link_str}
{indent_str}  }},
{indent_str}  items: [
{items_str}
{indent_str}  ]
{indent_str}}}"""

def create_sidebar_items_from_files(chapter_dir, chapter_num):
    """Fallback method to create sidebar items from files.
    
    Creates proper document IDs for files: 01.md → chapters/XX/1, 02.md → chapters/XX/2
    
    Args:
        chapter_dir: Chapter directory path
        chapter_num: Chapter number
        
    Returns:
        list: Sidebar items
    """
    logger = logging.getLogger("docusaurus.sidebar")
    
    section_items = []
    
    # Find all section files (excluding index.md) - these are 01.md, 02.md, etc.
    section_files = sorted([f for f in chapter_dir.glob("*.md") 
                           if f.stem != "index" and f.stem.isdigit()])
    
    logger.info(f"Found {len(section_files)} section files for fallback sidebar")
    
    # Add each section file with the format Docusaurus expects
    for section_file in section_files:
        # The filename is already the document ID (01, 02, 03, etc.)
        doc_id_num = int(section_file.stem)
        
        # Read the file to get the title and sidebar_label
        with open(section_file, 'r', encoding='utf-8') as f:
            content = f.read()
            title_match = re.search(r'title:\s*"([^"]+)"', content)
            sidebar_label_match = re.search(r'sidebar_label:\s*"([^"]+)"', content)
        
        # Use sidebar_label if available, otherwise use title or default
        if sidebar_label_match:
            label = sidebar_label_match.group(1)
            logger.info(f"Using sidebar_label for section {doc_id_num}: {label}")
        elif title_match:
            label = title_match.group(1)
            logger.info(f"Using title for section {doc_id_num}: {label}")
        else:
            label = f"Section {doc_id_num}"
            logger.info(f"Using default label for section {doc_id_num}")
        
        # Create a proper sidebar item with label
        section_id = f"chapters/{chapter_num:02d}/{doc_id_num}"
        section_items.append({
            "type": "doc",
            "id": section_id,
            "label": label
        })
        logger.info(f"Added section to fallback sidebar: {section_id} with label '{label}'")
    
    return section_items
