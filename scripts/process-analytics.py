#!/usr/bin/env python3
"""
Plausible Analytics Export Processor for AI Safety Atlas

This script processes Plausible analytics CSV exports and converts them
into a structured JSON format for use in the React impact dashboard.

Usage:
    python scripts/process-analytics.py path/to/plausible-export.zip

Output:
    src/data/analytics.json - Structured analytics data for React components
"""

import pandas as pd
import json
import zipfile
import sys
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
import re
from urllib.parse import urlparse

# Country code mapping for world map visualization
COUNTRY_CODES = {
    'United Kingdom': 'GB',
    'United States': 'US', 
    'France': 'FR',
    'Germany': 'DE',
    'Canada': 'CA',
    'Australia': 'AU',
    'Japan': 'JP',
    'South Korea': 'KR',
    'India': 'IN',
    'China': 'CN',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Argentina': 'AR',
    'Chile': 'CL',
    'Colombia': 'CO',
    'Italy': 'IT',
    'Spain': 'ES',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Switzerland': 'CH',
    'Austria': 'AT',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Poland': 'PL',
    'Czech Republic': 'CZ',
    'Hungary': 'HU',
    'Portugal': 'PT',
    'Greece': 'GR',
    'Turkey': 'TR',
    'Russian Federation': 'RU',
    'Ukraine': 'UA',
    'Israel': 'IL',
    'South Africa': 'ZA',
    'Nigeria': 'NG',
    'Egypt': 'EG',
    'Thailand': 'TH',
    'Vietnam': 'VN',
    'Singapore': 'SG',
    'Malaysia': 'MY',
    'Indonesia': 'ID',
    'Philippines': 'PH',
    'New Zealand': 'NZ',
    'Ireland': 'IE',
    'Romania': 'RO',
    'Bulgaria': 'BG',
    'Croatia': 'HR',
    'Slovenia': 'SI',
    'Slovakia': 'SK',
    'Lithuania': 'LT',
    'Latvia': 'LV',
    'Estonia': 'EE'
}

def extract_zip(zip_path):
    """Extract Plausible export ZIP to temporary directory."""
    temp_dir = tempfile.mkdtemp()
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_file:
            zip_file.extractall(temp_dir)
        
        # Find the actual export directory (may be nested)
        for item in Path(temp_dir).iterdir():
            if item.is_dir() and 'Plausible export' in item.name:
                return item
        
        # If no nested directory, return temp_dir
        return Path(temp_dir)
    except Exception as e:
        shutil.rmtree(temp_dir)
        raise e

def load_csv_safe(csv_path, required=True):
    """Safely load CSV file with error handling."""
    try:
        if not csv_path.exists():
            if required:
                print(f"⚠️  Required file not found: {csv_path.name}")
                return pd.DataFrame()
            else:
                print(f"ℹ️  Optional file not found: {csv_path.name}")
                return pd.DataFrame()
        
        df = pd.read_csv(csv_path)
        print(f"✅ Loaded {csv_path.name}: {len(df)} rows")
        return df
    except Exception as e:
        print(f"❌ Error loading {csv_path.name}: {e}")
        return pd.DataFrame()

def clean_chapter_name(path):
    """Convert chapter path to readable name."""
    if not path or pd.isna(path):
        return "Unknown"
    
    # Handle different chapter path formats
    if path == '/chapters/':
        return "Chapters Index"
    
    # Match /chapters/01, /chapters/01/, /chapters/01/02, etc.
    chapter_match = re.match(r'/chapters/(\d+)(?:/(\d+))?/?', path)
    if chapter_match:
        chapter_num = int(chapter_match.group(1))
        section_num = chapter_match.group(2)
        
        if section_num:
            return f"Chapter {chapter_num}.{int(section_num)}"
        else:
            return f"Chapter {chapter_num}"
    
    # Fallback for other formats
    return path.replace('/chapters/', 'Chapter ').replace('/', ' ').title()

def categorize_outbound_link(url):
    """Categorize outbound links by type/domain."""
    if not url or url == '(none)':
        return {'type': 'internal', 'domain': 'ai-safety-atlas.com'}
    
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        
        # PDF downloads (internal)
        if url.endswith('.pdf') and 'ai-safety-atlas.com' in domain:
            return {'type': 'pdf_download', 'domain': domain}
        
        # Google Docs
        if 'docs.google.com' in domain:
            return {'type': 'google_docs', 'domain': domain}
        
        # GitHub
        if 'github.com' in domain:
            return {'type': 'github', 'domain': domain}
        
        # Academic/Research sites
        if any(x in domain for x in ['arxiv.org', 'scholar.google', 'researchgate', 'semanticscholar']):
            return {'type': 'academic', 'domain': domain}
        
        # Social/Community
        if any(x in domain for x in ['youtube.com', 'twitter.com', 'linkedin.com']):
            return {'type': 'social', 'domain': domain}
        
        # Tools/Services
        if any(x in domain for x in ['plausible.io', 'openai.com', 'anthropic.com']):
            return {'type': 'tools', 'domain': domain}
        
        # Default external
        return {'type': 'external', 'domain': domain}
        
    except Exception:
        return {'type': 'unknown', 'domain': 'unknown'}

def format_duration(seconds):
    """Format duration in seconds to human readable format."""
    if pd.isna(seconds) or seconds is None:
        return "0s"
    
    seconds = int(seconds)
    if seconds < 60:
        return f"{seconds}s"
    elif seconds < 3600:
        minutes = seconds // 60
        secs = seconds % 60
        return f"{minutes}m {secs}s" if secs > 0 else f"{minutes}m"
    else:
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        return f"{hours}h {minutes}m"

def process_plausible_export(export_dir):
    """Process all CSV files and create structured analytics data."""
    
    print(f"🔄 Processing Plausible export from: {export_dir}")
    
    # Load all CSV files
    csv_files = {
        'visitors': load_csv_safe(export_dir / 'visitors.csv'),
        'pages': load_csv_safe(export_dir / 'pages.csv'),
        'countries': load_csv_safe(export_dir / 'countries.csv'),
        'cities': load_csv_safe(export_dir / 'cities.csv'),
        'custom_props': load_csv_safe(export_dir / 'custom_props.csv', required=False),
        'referrers': load_csv_safe(export_dir / 'referrers.csv', required=False),
        'entry_pages': load_csv_safe(export_dir / 'entry_pages.csv', required=False),
    }
    
    # Process metadata and overview
    visitors_df = csv_files['visitors']
    meta_data = {}
    overview_data = {}
    
    if not visitors_df.empty:
        # Filter out zero-visitor days for date range
        active_days = visitors_df[visitors_df['visitors'] > 0]
        if not active_days.empty:
            start_date = active_days['date'].min()
            end_date = active_days['date'].max()
            meta_data = {
                'dateRange': f"{start_date} to {end_date}",
                'totalDays': len(active_days),
                'exportDate': datetime.now().isoformat(),
                'dataSource': 'Plausible Analytics'
            }
        
        # Calculate overview metrics
        overview_data = {
            'totalVisitors': int(visitors_df['visitors'].sum()),
            'totalPageviews': int(visitors_df['pageviews'].sum()),
            'totalVisits': int(visitors_df['visits'].sum()),
            'avgVisitDuration': float(visitors_df['visit_duration'].mean()) if 'visit_duration' in visitors_df.columns else 0,
            'avgViewsPerVisit': float(visitors_df['views_per_visit'].mean()) if 'views_per_visit' in visitors_df.columns else 0,
            'avgBounceRate': float(visitors_df['bounce_rate'].mean()) if 'bounce_rate' in visitors_df.columns else 0
        }
    
    # Process geography data
    geography_data = {'countries': [], 'cities': []}
    
    countries_df = csv_files['countries']
    if not countries_df.empty:
        geography_data['countries'] = [
            {
                'name': row['name'],
                'visitors': int(row['visitors']),
                'code': COUNTRY_CODES.get(row['name'], 'XX'),  # XX for unknown
                'percentage': round((row['visitors'] / overview_data.get('totalVisitors', 1)) * 100, 1)
            }
            for _, row in countries_df.iterrows()
        ]
    
    cities_df = csv_files['cities']
    if not cities_df.empty:
        geography_data['cities'] = [
            {
                'name': row['name'],
                'visitors': int(row['visitors']),
                'percentage': round((row['visitors'] / overview_data.get('totalVisitors', 1)) * 100, 1)
            }
            for _, row in cities_df.head(20).iterrows()  # Top 20 cities only
        ]
    
    # Process content performance (chapters)
    content_data = {'chapters': [], 'topPages': []}
    
    pages_df = csv_files['pages']
    if not pages_df.empty:
        # Filter for chapter pages
        chapter_pages = pages_df[pages_df['name'].str.contains('/chapters/', na=False)]
        
        content_data['chapters'] = [
            {
                'name': clean_chapter_name(row['name']),
                'path': row['name'],
                'visitors': int(row['visitors']),
                'pageviews': int(row['pageviews']),
                'timeOnPage': int(row['time_on_page']) if pd.notna(row['time_on_page']) else 0,
                'timeOnPageFormatted': format_duration(row['time_on_page'] if pd.notna(row['time_on_page']) else 0),
                'scrollDepth': int(row['scroll_depth']) if pd.notna(row['scroll_depth']) else 0,
                'bounceRate': int(row['bounce_rate']) if pd.notna(row['bounce_rate']) else 0
            }
            for _, row in chapter_pages.sort_values('visitors', ascending=False).iterrows()
        ]
        
        # Top pages overall (non-chapter pages for context)
        non_chapter_pages = pages_df[~pages_df['name'].str.contains('/chapters/', na=False)]
        content_data['topPages'] = [
            {
                'name': row['name'],
                'visitors': int(row['visitors']),
                'pageviews': int(row['pageviews']),
                'timeOnPage': int(row['time_on_page']) if pd.notna(row['time_on_page']) else 0,
                'timeOnPageFormatted': format_duration(row['time_on_page'] if pd.notna(row['time_on_page']) else 0)
            }
            for _, row in non_chapter_pages.head(10).iterrows()
        ]
    
    # Process outbound links
    outbound_data = []
    
    custom_props_df = csv_files['custom_props']
    if not custom_props_df.empty:
        # Filter for URL events (outbound links)
        url_events = custom_props_df[
            (custom_props_df['property'] == 'url') & 
            (custom_props_df['value'] != '(none)')
        ]
        
        outbound_data = []
        for _, row in url_events.iterrows():
            category_info = categorize_outbound_link(row['value'])
            outbound_data.append({
                'url': row['value'],
                'clicks': int(row['events']),
                'visitors': int(row['visitors']),
                'type': category_info['type'],
                'domain': category_info['domain'],
                'percentage': float(row['percentage'])
            })
        
        # Sort by clicks/events
        outbound_data.sort(key=lambda x: x['clicks'], reverse=True)
    
    # Process timeline
    timeline_data = []
    
    if not visitors_df.empty:
        timeline_data = [
            {
                'date': row['date'],
                'visitors': int(row['visitors']),
                'pageviews': int(row['pageviews']),
                'visits': int(row['visits']),
                'visitDuration': float(row['visit_duration']) if pd.notna(row['visit_duration']) else 0,
                'bounceRate': float(row['bounce_rate']) if pd.notna(row['bounce_rate']) else 0
            }
            for _, row in visitors_df.iterrows()
            if row['visitors'] > 0  # Only include days with actual traffic
        ]
    
    # Process referrers (traffic sources)
    referrers_data = []
    
    referrers_df = csv_files['referrers']
    if not referrers_df.empty:
        referrers_data = [
            {
                'name': row['name'],
                'visitors': int(row['visitors']),
                'bounceRate': int(row['bounce_rate']) if pd.notna(row['bounce_rate']) else 0,
                'visitDuration': int(row['visit_duration']) if pd.notna(row['visit_duration']) else 0,
                'visitDurationFormatted': format_duration(row['visit_duration'] if pd.notna(row['visit_duration']) else 0)
            }
            for _, row in referrers_df.head(10).iterrows()
        ]
    
    # Combine all data
    analytics_data = {
        'meta': meta_data,
        'overview': overview_data,
        'geography': geography_data,
        'content': content_data,
        'outboundLinks': outbound_data,
        'timeline': timeline_data,
        'referrers': referrers_data
    }
    
    return analytics_data

def main():
    """Main function to process Plausible export."""
    
    if len(sys.argv) != 2:
        print("Usage: python scripts/process-analytics.py <plausible-export.zip>")
        print("Example: python scripts/process-analytics.py ~/Downloads/plausible-export.zip")
        sys.exit(1)
    
    zip_path = Path(sys.argv[1])
    
    if not zip_path.exists():
        print(f"❌ File not found: {zip_path}")
        sys.exit(1)
    
    if not zip_path.suffix.lower() == '.zip':
        print(f"❌ Expected a ZIP file, got: {zip_path.suffix}")
        sys.exit(1)
    
    print(f"🚀 Processing Plausible export: {zip_path}")
    
    try:
        # Extract ZIP file
        export_dir = extract_zip(zip_path)
        print(f"📁 Extracted to: {export_dir}")
        
        # Process the data
        analytics_data = process_plausible_export(export_dir)
        
        # Ensure output directory exists (relative to project root, not script location)
        script_dir = Path(__file__).parent
        project_root = script_dir.parent  # Go up one level from scripts/ to project root
        output_dir = project_root / "src" / "data"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save to JSON
        output_path = output_dir / "analytics.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(analytics_data, f, indent=2, ensure_ascii=False)
        
        # Print summary
        print(f"\n✅ Analytics data processed successfully!")
        print(f"📊 Output: {output_path}")
        print(f"📈 Total visitors: {analytics_data['overview'].get('totalVisitors', 0):,}")
        print(f"🌍 Countries: {len(analytics_data['geography']['countries'])}")
        print(f"📖 Chapters tracked: {len(analytics_data['content']['chapters'])}")
        print(f"🔗 Outbound links: {len(analytics_data['outboundLinks'])}")
        print(f"📅 Date range: {analytics_data['meta'].get('dateRange', 'Unknown')}")
        
        # Cleanup temporary files
        try:
            if 'tmp' in str(export_dir):
                shutil.rmtree(export_dir)
                print("🧹 Cleaned up temporary files")
        except Exception as cleanup_error:
            print(f"⚠️  Could not clean up temp files (not critical): {cleanup_error}")
        
    except Exception as e:
        print(f"❌ Error processing export: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
