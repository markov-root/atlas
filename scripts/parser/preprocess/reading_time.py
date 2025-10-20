# scripts/preprocess/reading_time.py
import re
import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
import math

# Get logger
logger = logging.getLogger("preprocess.reading_time")

# Reading speed constants
WORDS_PER_MINUTE = 200  # Using 200 WPM for all content as requested

def count_words(text: str) -> int:
   """
   Count words in a text string.
   
   Args:
       text: Text to count words in
       
   Returns:
       Number of words
   """
   if not text:
       return 0
   
   # Remove extra whitespace and split by whitespace
   words = text.strip().split()
   return len(words)

def extract_optional_content(content: str) -> Tuple[str, str, Dict[str, int]]:
   """
   Extract optional content (footnotes, captions, note-boxes) from section content.
   This matches the JavaScript calculator logic more closely.
   
   Args:
       content: Section content to process
       
   Returns:
       Tuple of (core_content, optional_content, stats)
   """
   optional_parts = []
   stats = {
       "footnotes": 0,
       "figure_captions": 0,
       "iframe_captions": 0,
       "note_boxes": 0,
       "code_blocks": 0,
       "inline_code": 0
   }
   
   # Start with the original content
   core_content = content
   
   # 1. Extract footnote definitions: [^key]: content
   footnote_pattern = r'\[\^([^\]]+)\]:\s*(.*?)(?=\n\n|\n\[\^|\Z)'
   footnote_matches = re.findall(footnote_pattern, core_content, re.DOTALL)
   
   for footnote_key, footnote_text in footnote_matches:
       footnote_text = footnote_text.strip()
       optional_parts.append(footnote_text)
       stats["footnotes"] += 1
       logger.debug(f"Found footnote [{footnote_key}]: {footnote_text[:50]}...")
   
   # Remove footnote definitions from core content
   core_content = re.sub(footnote_pattern, '', core_content, flags=re.DOTALL)
   
   # 2. Extract note boxes: <note-box>content</note-box>
   note_box_pattern = r'<note-box>\s*(.*?)\s*</note-box>'
   note_box_matches = re.findall(note_box_pattern, core_content, re.DOTALL)
   
   for note_content in note_box_matches:
       note_content = note_content.strip()
       optional_parts.append(note_content)
       stats["note_boxes"] += 1
       logger.debug(f"Found note box: {note_content[:50]}...")
   
   # Remove note boxes from core content
   core_content = re.sub(note_box_pattern, '', core_content, flags=re.DOTALL)
   
   # 3. Extract figure captions: <figure-caption>content</figure-caption>
   figure_caption_pattern = r'<figure-caption>\s*(.*?)\s*</figure-caption>'
   figure_caption_matches = re.findall(figure_caption_pattern, core_content, re.DOTALL)
   
   for caption_text in figure_caption_matches:
       caption_text = caption_text.strip()
       optional_parts.append(caption_text)
       stats["figure_captions"] += 1
       logger.debug(f"Found figure caption: {caption_text[:50]}...")
   
   # Remove figure captions from core content
   core_content = re.sub(figure_caption_pattern, '', core_content, flags=re.DOTALL)
   
   # 4. Extract iframe captions: <iframe-caption>content</iframe-caption>
   iframe_caption_pattern = r'<iframe-caption>\s*(.*?)\s*</iframe-caption>'
   iframe_caption_matches = re.findall(iframe_caption_pattern, core_content, re.DOTALL)
   
   for caption_text in iframe_caption_matches:
       caption_text = caption_text.strip()
       optional_parts.append(caption_text)
       stats["iframe_captions"] += 1
       logger.debug(f"Found iframe caption: {caption_text[:50]}...")
   
   # Remove iframe captions from core content
   core_content = re.sub(iframe_caption_pattern, '', core_content, flags=re.DOTALL)
   
   # 5. Extract video captions: <video-caption>content</video-caption>
   video_caption_pattern = r'<video-caption>\s*(.*?)\s*</video-caption>'
   video_caption_matches = re.findall(video_caption_pattern, core_content, re.DOTALL)
   
   for caption_text in video_caption_matches:
       caption_text = caption_text.strip()
       optional_parts.append(caption_text)
       stats["iframe_captions"] += 1  # Group with iframe captions in stats
       logger.debug(f"Found video caption: {caption_text[:50]}...")
   
   # Remove video captions from core content
   core_content = re.sub(video_caption_pattern, '', core_content, flags=re.DOTALL)
   
   # 6. Remove code blocks (matching JavaScript behavior)
   # Multi-line code blocks
   code_block_pattern = r'```[^`]*?```'
   code_block_matches = re.findall(code_block_pattern, core_content, re.DOTALL)
   stats["code_blocks"] = len(code_block_matches)
   
   if code_block_matches:
       logger.debug(f"Found {len(code_block_matches)} code blocks to remove from core content")
   
   # Remove code blocks from core content (don't add to optional, just remove)
   core_content = re.sub(code_block_pattern, '', core_content, flags=re.DOTALL)
   
   # 7. Remove inline code (matching JavaScript behavior)
   inline_code_pattern = r'`[^`]+`'
   inline_code_matches = re.findall(inline_code_pattern, core_content)
   stats["inline_code"] = len(inline_code_matches)
   
   if inline_code_matches:
       logger.debug(f"Found {len(inline_code_matches)} inline code snippets to remove from core content")
   
   # Remove inline code from core content (don't add to optional, just remove)
   core_content = re.sub(inline_code_pattern, '', core_content)
   
   # 8. Keep definitions and quotes in CORE content (they are educational/important)
   # These should NOT be removed as they are core educational content
   # The JavaScript calculator correctly keeps these in core content
   
   # Combine all optional content
   optional_content = '\n'.join(optional_parts)
   
   # Clean up extra whitespace in core content
   core_content = re.sub(r'\n{3,}', '\n\n', core_content)
   
   # Log summary
   total_optional_items = sum([
       stats["footnotes"], 
       stats["figure_captions"], 
       stats["iframe_captions"], 
       stats["note_boxes"]
   ])
   
   if total_optional_items > 0:
       logger.debug(f"Extracted {total_optional_items} optional content items")
   
   if stats["code_blocks"] > 0 or stats["inline_code"] > 0:
       logger.debug(f"Removed {stats['code_blocks']} code blocks and {stats['inline_code']} inline code snippets from core content")
   
   return core_content, optional_content, stats

def calculate_reading_time(word_count: int) -> str:
   """
   Calculate reading time from word count.
   
   Args:
       word_count: Number of words
       
   Returns:
       Reading time as formatted string (e.g., "5 min", "1 min")
   """
   if word_count == 0:
       return "0 min"
   
   # Calculate minutes and round up
   minutes = math.ceil(word_count / WORDS_PER_MINUTE)
   return f"{minutes} min"

def is_appendix_section(section_title: str) -> bool:
   """
   Check if a section is an appendix based on its title.
   
   Args:
       section_title: Title of the section
       
   Returns:
       True if section is an appendix
   """
   return section_title.lower().strip().startswith("appendix")

def process_section_file(section_file: Path) -> Dict[str, Any]:
   """
   Process a single section file to calculate reading times.
   
   Args:
       section_file: Path to section file
       
   Returns:
       Dict with reading time data
   """
   try:
       with open(section_file, 'r', encoding='utf-8') as f:
           content = f.read()
       
       # Extract optional content
       core_content, optional_content, extraction_stats = extract_optional_content(content)
       
       # Count words
       core_words = count_words(core_content)
       optional_words = count_words(optional_content)
       total_words = core_words + optional_words
       
       # Calculate reading times
       core_time = calculate_reading_time(core_words)
       optional_time = calculate_reading_time(optional_words)
       total_time = calculate_reading_time(total_words)
       
       logger.info(f"Section {section_file.name}: {core_words} core words ({core_time}), {optional_words} optional words ({optional_time})")
       
       # Log breakdown if debug enabled
       if logger.isEnabledFor(logging.DEBUG):
           logger.debug(f"  Content breakdown for {section_file.name}:")
           logger.debug(f"    - {extraction_stats['note_boxes']} note boxes")
           logger.debug(f"    - {extraction_stats['footnotes']} footnotes") 
           logger.debug(f"    - {extraction_stats['figure_captions']} figure captions")
           logger.debug(f"    - {extraction_stats['iframe_captions']} iframe/video captions")
           logger.debug(f"    - {extraction_stats['code_blocks']} code blocks (removed)")
           logger.debug(f"    - {extraction_stats['inline_code']} inline code snippets (removed)")
       
       return {
           "core_words": core_words,
           "optional_words": optional_words,
           "total_words": total_words,
           "core_time": core_time,
           "optional_time": optional_time,
           "total_time": total_time,
           "extraction_stats": extraction_stats
       }
       
   except Exception as e:
       logger.error(f"Error processing section file {section_file}: {e}")
       return {
           "core_words": 0,
           "optional_words": 0,
           "total_words": 0,
           "core_time": "0 min",
           "optional_time": "0 min",
           "total_time": "0 min",
           "extraction_stats": {},
           "error": str(e)
       }

def update_toc_with_reading_times(toc_data: Dict[str, Any], section_reading_times: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
   """
   Update TOC data structure with reading times for sections and chapter.
   
   Args:
       toc_data: Existing TOC data
       section_reading_times: Dict mapping section indices to reading time data
       
   Returns:
       Updated TOC data with reading times
   """
   # Track totals for chapter-level aggregation
   chapter_core_words = 0
   chapter_optional_words = 0
   appendix_core_words = 0
   appendix_optional_words = 0
   
   # Update each section with reading times
   sections_updated = 0
   for index, section in enumerate(toc_data.get('sections', [])):
       section_title = section.get('title', '')
       section_number = section.get('number', '')
       
       # Use the array index as the key
       section_key = str(index)
       
       if section_key in section_reading_times:
           reading_data = section_reading_times[section_key]
           
           # Add reading times to section
           section["reading_times"] = {
               "core": reading_data["core_time"],
               "optional": reading_data["optional_time"],
               "total": reading_data["total_time"]
           }
           
           # Check if this is an appendix section
           is_appendix = is_appendix_section(section_title)
           section["is_appendix"] = is_appendix
           
           # Aggregate for chapter totals
           if is_appendix:
               appendix_core_words += reading_data["core_words"]
               appendix_optional_words += reading_data["optional_words"]
               logger.info(f"Added appendix section {section_number} to appendix totals")
           else:
               chapter_core_words += reading_data["core_words"]
               chapter_optional_words += reading_data["optional_words"]
               logger.info(f"Added regular section {section_number} to chapter totals")
           
           sections_updated += 1
           logger.info(f"Updated section {section_number} ({section_title}) with reading times")
       else:
           logger.warning(f"No reading time data found for section {section_number} ({section_title})")
   
   # Calculate chapter-level reading times
   chapter_core_time = calculate_reading_time(chapter_core_words)
   chapter_optional_time = calculate_reading_time(chapter_optional_words)
   appendix_time = calculate_reading_time(appendix_core_words + appendix_optional_words)
   
   # Add chapter-level reading times to TOC
   toc_data["reading_times"] = {
       "core": chapter_core_time,
       "optional": chapter_optional_time,
       "appendix": appendix_time
   }
   
   logger.info(f"Chapter reading times - Core: {chapter_core_time}, Optional: {chapter_optional_time}, Appendix: {appendix_time}")
   logger.info(f"Updated {sections_updated} sections with reading times")
   
   return toc_data

def process(content: str, output_dir: Path, debug_dir: Optional[Path] = None) -> Tuple[str, Dict[str, Any]]:
   """
   Process content to calculate reading times for all sections and update TOC.
   
   Args:
       content: The markdown content to process (main content, unchanged)
       output_dir: Directory containing output files and sections
       debug_dir: Optional directory for debug output
       
   Returns:
       Tuple of (unchanged content, stats_dict)
   """
   # Log start of processing
   logger.info("Calculating reading times for sections and chapter...")
   
   # Find the chapter directory (should be a number like "05")
   chapter_dirs = [d for d in output_dir.iterdir() if d.is_dir() and d.name.isdigit()]
   if not chapter_dirs:
       logger.error("No chapter directory found")
       return content, {"error": "No chapter directory found"}
   
   chapter_dir = chapter_dirs[0]
   logger.info(f"Processing section files in {chapter_dir}")
   
   # Process all section files
   section_reading_times = {}
   section_files = sorted([f for f in chapter_dir.glob("*.md")])
   
   for section_file in section_files:
       # Extract section number from filename (e.g., "01.md" -> "1")
       section_match = re.match(r'0*(\d+)\.md', section_file.name)
       if not section_match:
           logger.debug(f"Skipping non-section file: {section_file.name}")
           continue
           
       section_num = section_match.group(1)  # Get number without leading zeros
       
       # Process the section file
       reading_data = process_section_file(section_file)
       section_reading_times[section_num] = reading_data
   
   # Load and update TOC data
   toc_file = output_dir / "toc.json5"
   if not toc_file.exists():
       logger.error(f"TOC file not found: {toc_file}")
       return content, {"error": "TOC file not found"}
   
   try:
       # Load existing TOC data
       with open(toc_file, 'r', encoding='utf-8') as f:
           toc_data = json.load(f)
       
       # Update with reading times
       updated_toc_data = update_toc_with_reading_times(toc_data, section_reading_times)
       
       # Save updated TOC data
       with open(toc_file, 'w', encoding='utf-8') as f:
           json.dump(updated_toc_data, f, indent=2)
       
       logger.info(f"Updated TOC file with reading times: {toc_file}")
       
   except Exception as e:
       logger.error(f"Error updating TOC file with reading times: {e}")
       return content, {"error": f"Error updating TOC: {e}"}
   
   # Prepare stats
   total_sections = len(section_reading_times)
   total_core_words = sum(data["core_words"] for data in section_reading_times.values())
   total_optional_words = sum(data["optional_words"] for data in section_reading_times.values())
   
   stats = {
       "sections_processed": total_sections,
       "total_core_words": total_core_words,
       "total_optional_words": total_optional_words,
       "total_words": total_core_words + total_optional_words,
       "chapter_core_time": updated_toc_data["reading_times"]["core"],
       "chapter_optional_time": updated_toc_data["reading_times"]["optional"],
       "chapter_appendix_time": updated_toc_data["reading_times"]["appendix"]
   }
   
   # Save debug output if requested
   if debug_dir:
       debug_path = debug_dir / "reading_times.json"
       debug_data = {
           "section_reading_times": section_reading_times,
           "chapter_totals": updated_toc_data["reading_times"],
           "stats": stats
       }
       with open(debug_path, 'w', encoding='utf-8') as f:
           json.dump(debug_data, f, indent=2)
   
   logger.info(f"Reading time calculation complete - {total_sections} sections processed")
   logger.info(f"Chapter totals - Core: {stats['chapter_core_time']}, Optional: {stats['chapter_optional_time']}, Appendix: {stats['chapter_appendix_time']}")
   
   return content, stats
