#!/usr/bin/env python3
# File: scripts/speech_generation.py
"""
Google Gemini TTS Speech Generation Script

This script processes TTS markdown files and converts them to audio using Google's Gemini 2.5 Flash TTS API.
It reads .md files from the TTS output directory and generates corresponding .wav files.

Requirements:
- requests library: pip install requests
- Your API key (set in script or as environment variable)

Usage:
    python speech_generation.py path/to/processed/ch2/tts/
    python speech_generation.py path/to/processed/ch2/tts/ --voice Kore
    python speech_generation.py path/to/processed/ch2/tts/ --delay 2
"""

import os
import sys
import re
import argparse
import requests
import time
import json
import wave
from pathlib import Path
from typing import List, Optional

# Configuration, put your own key in here
DEFAULT_API_KEY = ""

# This is for English
DEFAULT_VOICE = "Achird"
DEFAULT_MODEL = "gemini-2.5-flash-preview-tts"
DEFAULT_DELAY = 1.5  # seconds between requests
STYLE_PROMPT = "Read as a knowledgeable professor explaining complex concepts in a upbeat, friendly, clear, conversational and engaging manner:"

def setup_logging():
    """Set up basic logging."""
    import logging
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%H:%M:%S'
    )
    return logging.getLogger(__name__)

def read_markdown_file(file_path: Path) -> str:
    """Read markdown file and return clean text content.
    
    Args:
        file_path: Path to the markdown file
        
    Returns:
        str: Clean text content without markdown formatting
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove markdown headers (# ## ###)
        content = re.sub(r'^#{1,6}\s+', '', content, flags=re.MULTILINE)
        
        # Remove bold/italic formatting (**text** *text*)
        content = re.sub(r'\*\*([^*]+)\*\*', r'\1', content)
        content = re.sub(r'\*([^*]+)\*', r'\1', content)
        
        # Clean up extra whitespace
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = content.strip()
        
        return content
        
    except Exception as e:
        raise Exception(f"Error reading file {file_path}: {e}")

def save_wav_file(filename: Path, audio_data: bytes) -> bool:
    """Save PCM audio data as a WAV file.
    
    Args:
        filename: Output WAV file path
        audio_data: Raw PCM audio data
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Gemini TTS returns 16-bit PCM at 24kHz, mono
        with wave.open(str(filename), 'wb') as wav_file:
            wav_file.setnchannels(1)      # Mono
            wav_file.setsampwidth(2)      # 16-bit
            wav_file.setframerate(24000)  # 24kHz
            wav_file.writeframes(audio_data)
        
        return True
        
    except Exception as e:
        print(f"Error saving WAV file {filename}: {e}")
        return False

def generate_speech(text: str, voice_name: str, api_key: str, model: str, logger) -> Optional[bytes]:
    """Generate speech from text using Gemini TTS API.
    
    Args:
        text: Text to convert to speech
        voice_name: Voice name (e.g., "Achird")
        api_key: Gemini API key
        model: Model name (e.g., "gemini-2.5-flash-preview-tts")
        logger: Logger instance
        
    Returns:
        bytes: Audio data as PCM bytes, or None if failed
    """
    # Combine style prompt with text
    full_prompt = f"{STYLE_PROMPT} {text}"
    
    # API endpoint
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    
    # Request headers
    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json"
    }
    
    # Request payload
    payload = {
        "contents": [{
            "parts": [{
                "text": full_prompt
            }]
        }],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": voice_name
                    }
                }
            }
        }
    }
    
    try:
        logger.info(f"Generating speech with voice '{voice_name}'...")
        logger.debug(f"Text preview: {text[:100]}...")
        
        # Make API request
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        
        if response.status_code == 200:
            response_data = response.json()
            
            # Extract audio data
            candidates = response_data.get("candidates", [])
            if candidates and len(candidates) > 0:
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                
                if parts and len(parts) > 0:
                    inline_data = parts[0].get("inlineData", {})
                    audio_base64 = inline_data.get("data")
                    
                    if audio_base64:
                        # Decode base64 to bytes
                        import base64
                        audio_bytes = base64.b64decode(audio_base64)
                        logger.info(f"Successfully generated {len(audio_bytes)} bytes of audio")
                        return audio_bytes
                    else:
                        logger.error("No audio data found in response")
                else:
                    logger.error("No parts found in response content")
            else:
                logger.error("No candidates found in response")
                
        elif response.status_code == 429:
            logger.error("Rate limit exceeded (429). Please wait before making more requests.")
        else:
            logger.error(f"API request failed with status {response.status_code}")
            logger.error(f"Response: {response.text}")
            
    except requests.exceptions.Timeout:
        logger.error("Request timed out after 60 seconds")
    except Exception as e:
        logger.error(f"Error in API request: {e}")
    
    return None

def find_markdown_files(directory: Path) -> List[Path]:
    """Find all markdown files in directory.
    
    Args:
        directory: Directory to search
        
    Returns:
        List of markdown file paths, sorted by name
    """
    md_files = list(directory.glob("*.md"))
    return sorted(md_files)

def process_tts_directory(tts_dir: Path, voice_name: str, api_key: str, model: str, delay: float, logger) -> None:
    """Process all markdown files in TTS directory.
    
    Args:
        tts_dir: TTS directory containing markdown files
        voice_name: Voice name for TTS
        api_key: Gemini API key
        model: TTS model name
        delay: Delay between requests in seconds
        logger: Logger instance
    """
    # Find all markdown files
    md_files = find_markdown_files(tts_dir)
    
    if not md_files:
        logger.error(f"No markdown files found in {tts_dir}")
        return
    
    logger.info(f"Found {len(md_files)} markdown files to process:")
    for md_file in md_files:
        logger.info(f"  - {md_file.name}")
    
    # Process each file
    success_count = 0
    for i, md_file in enumerate(md_files):
        logger.info(f"\nProcessing ({i+1}/{len(md_files)}): {md_file.name}")
        
        # Create output filename
        wav_filename = tts_dir / f"{md_file.stem}.wav"
        
        # Check if output already exists
        if wav_filename.exists():
            logger.info(f"Output file already exists: {wav_filename.name}")
            response = input("Overwrite? (y/n): ").strip().lower()
            if response != 'y':
                logger.info("Skipping...")
                continue
        
        try:
            # Read markdown content
            text_content = read_markdown_file(md_file)
            
            if not text_content.strip():
                logger.warning(f"File {md_file.name} is empty, skipping")
                continue
            
            logger.info(f"Text length: {len(text_content)} characters")
            
            # Generate speech
            audio_data = generate_speech(text_content, voice_name, api_key, model, logger)
            
            if audio_data:
                # Save as WAV file
                if save_wav_file(wav_filename, audio_data):
                    logger.info(f"✓ Created: {wav_filename.name}")
                    success_count += 1
                else:
                    logger.error(f"✗ Failed to save: {wav_filename.name}")
            else:
                logger.error(f"✗ Failed to generate speech for: {md_file.name}")
                
        except Exception as e:
            logger.error(f"Error processing {md_file.name}: {e}")
        
        # Add delay between requests (except for last file)
        if i < len(md_files) - 1:
            logger.debug(f"Waiting {delay} seconds before next request...")
            time.sleep(delay)
    
    logger.info(f"\n=== Summary ===")
    logger.info(f"Successfully processed: {success_count}/{len(md_files)} files")
    logger.info(f"Generated audio files in: {tts_dir}")

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Generate speech from TTS markdown files using Gemini API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python speech_generation.py ../processed/ch2/tts/
  python speech_generation.py ../processed/ch2/tts/ --voice Kore --delay 2
  python speech_generation.py ../processed/ch2/tts/ --model gemini-2.5-pro-preview-tts
        """
    )
    
    parser.add_argument('tts_directory', help='Path to TTS directory containing .md files')
    parser.add_argument('--voice', default=DEFAULT_VOICE, help=f'Voice name (default: {DEFAULT_VOICE})')
    parser.add_argument('--api-key', default=DEFAULT_API_KEY, help='Gemini API key (or use GEMINI_API_KEY env var)')
    parser.add_argument('--model', default=DEFAULT_MODEL, help=f'TTS model name (default: {DEFAULT_MODEL})')
    parser.add_argument('--delay', type=float, default=DEFAULT_DELAY, help=f'Delay between requests in seconds (default: {DEFAULT_DELAY})')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    
    args = parser.parse_args()
    
    # Set up logging
    logger = setup_logging()
    if args.debug:
        logger.setLevel(10)  # DEBUG level
    
    # Validate TTS directory
    tts_dir = Path(args.tts_directory)
    if not tts_dir.exists():
        logger.error(f"TTS directory not found: {tts_dir}")
        sys.exit(1)
    
    if not tts_dir.is_dir():
        logger.error(f"Path is not a directory: {tts_dir}")
        sys.exit(1)
    
    # Get API key (from args, env var, or default)
    api_key = args.api_key
    if not api_key:
        api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        logger.error("No API key provided. Use --api-key or set GEMINI_API_KEY environment variable")
        sys.exit(1)
    
    logger.info(f"Using TTS directory: {tts_dir}")
    logger.info(f"Using voice: {args.voice}")
    logger.info(f"Using model: {args.model}")
    logger.info(f"Using delay: {args.delay} seconds")
    
    # Process the directory
    try:
        process_tts_directory(tts_dir, args.voice, api_key, args.model, args.delay, logger)
    except KeyboardInterrupt:
        logger.info("\nOperation cancelled by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
