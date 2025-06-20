#!/usr/bin/env python3
"""
ADL Data Collector - Automated Collection System
Attempts to collect fresh ADL data using various methods
"""

import requests
import json
import time
import argparse
import sys
from pathlib import Path
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ADLDataCollector:
    """Automated ADL data collection with multiple fallback methods"""
    
    def __init__(self):
        self.base_url = "https://www.adl.org/apps/heatmap/json"
        self.output_dir = Path("data/adl")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Default headers
        self.headers = {
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
            'Referer': 'https://www.adl.org/resources/tools-to-track-hate/heat-map',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
    
    def init_session(self) -> requests.Session:
        """Return a requests session preloaded with ADL cookies."""
        session = requests.Session()
        session.headers.update(self.headers)

        # Visiting the heatmap page seeds session cookies that are
        # required to access the JSON API.  Ignore any errors here and
        # continue with whatever cookies we obtain.
        try:
            session.get("https://www.adl.org/resources/tools-to-track-hate/heat-map", timeout=10)
        except Exception:
            pass

        return session

    def fetch_fresh_cookies(self) -> requests.Session:
        """Initialize a session and save the acquired cookies.

        The cookies are written to ``adl_cookies.txt`` so future
        runs can reuse them via ``--auto-cookies``.
        """

        session = self.init_session()

        # Persist cookies for reuse
        cookie_string = '; '.join(
            f"{c.name}={c.value}" for c in session.cookies
        )
        try:
            with open('adl_cookies.txt', 'w', encoding='utf-8') as f:
                f.write(cookie_string)
            logger.info('Saved fresh cookies to adl_cookies.txt')
        except Exception as e:
            logger.warning(f'Could not save cookies: {e}')

        return session

    def collect_with_cookies(self, cookies_string):
        """Collect data using provided cookies.

        The method first initializes a session by visiting the
        heatmap page to obtain the required session cookies and then
        applies the user-provided cookies if supplied.
        """

        logger.info("Attempting ADL data collection with provided cookies")

        session = self.init_session()
        
        # Parse cookies string into proper format
        if cookies_string:
            # Simple cookie parsing - assumes format "key1=value1; key2=value2"
            cookie_dict = {}
            for cookie in cookies_string.split(';'):
                if '=' in cookie:
                    key, value = cookie.strip().split('=', 1)
                    cookie_dict[key] = value
            
            session.cookies.update(cookie_dict)
        
        try:
            # Test with first page
            response = session.get(f"{self.base_url}?page=0", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if we got valid data
                if 'incidents' in data and isinstance(data['incidents'], list):
                    logger.info(f"✅ Successful connection - found {len(data['incidents'])} incidents on page 0")
                    
                    # Collect all pages
                    return self.collect_all_pages(session)
                else:
                    logger.warning("❌ Got response but no valid incident data")
                    return False
            else:
                logger.warning(f"❌ HTTP {response.status_code} - cookies may be expired")
                return False
                
        except Exception as e:
            logger.error(f"❌ Collection failed: {e}")
            return False
    
    def collect_all_pages(self, session):
        """Collect all available pages"""
        
        page = 0
        total_incidents = 0
        
        while True:
            try:
                logger.info(f"Collecting page {page}...")
                
                response = session.get(f"{self.base_url}?page={page}", timeout=10)
                
                if response.status_code != 200:
                    logger.warning(f"Failed to get page {page}: HTTP {response.status_code}")
                    break
                
                data = response.json()
                
                if not data.get('incidents') or len(data['incidents']) == 0:
                    logger.info(f"No more data at page {page}, stopping")
                    break
                
                # Save page data
                page_file = self.output_dir / f"adl_page_{page}.json"
                with open(page_file, 'w') as f:
                    json.dump(data, f, indent=2)
                
                incidents_count = len(data['incidents'])
                total_incidents += incidents_count
                logger.info(f"✅ Saved page {page}: {incidents_count} incidents")
                
                # Check if we've reached the end (no more pages)
                if incidents_count < 50:  # Assuming 50 per page is normal
                    logger.info("Reached end of data (partial page)")
                    break
                
                page += 1
                time.sleep(0.5)  # Be respectful to the server
                
                # Safety limit
                if page > 200:
                    logger.warning("Reached safety limit of 200 pages")
                    break
                    
            except Exception as e:
                logger.error(f"Error collecting page {page}: {e}")
                break
        
        if total_incidents > 0:
            logger.info(f"🎉 Collection complete: {total_incidents} total incidents across {page + 1} pages")
            
            # Create collection summary
            summary = {
                'collection_date': datetime.now().isoformat(),
                'total_pages': page + 1,
                'total_incidents': total_incidents,
                'status': 'success'
            }
            
            with open(self.output_dir / 'collection_summary.json', 'w') as f:
                json.dump(summary, f, indent=2)
            
            return True
        else:
            logger.error("❌ No incidents collected")
            return False
    
    def auto_cookie_attempt(self):
        """Attempt to use cached cookies or environment variables"""
        
        logger.info("Attempting automatic cookie discovery...")
        
        # Try environment variable
        import os
        env_cookies = os.environ.get('ADL_COOKIES')
        if env_cookies:
            logger.info("Found cookies in environment variable")
            return self.collect_with_cookies(env_cookies)
        
        # Try cached cookies file
        cookie_file = Path('adl_cookies.txt')
        if cookie_file.exists():
            logger.info("Found cached cookies file")
            cookies = cookie_file.read_text().strip()
            return self.collect_with_cookies(cookies)
        
        logger.info("No stored cookies found, fetching fresh cookies...")
        try:
            session = self.fetch_fresh_cookies()
            return self.collect_all_pages(session)
        except Exception as e:
            logger.error(f"Failed to fetch fresh cookies automatically: {e}")
            logger.warning("No automatic cookies found")
            logger.info("To enable automatic collection:")
            logger.info("1. Set environment variable: export ADL_COOKIES='your_cookies_here'")
            logger.info("2. Or save cookies to: adl_cookies.txt")
            return False
    
    def print_manual_instructions(self):
        """Print instructions for manual data collection"""
        
        print("""
📋 MANUAL ADL DATA COLLECTION INSTRUCTIONS

If automated collection fails, collect data manually:

1. 🌐 Open ADL Heat Map in your browser:
   https://www.adl.org/resources/tools-to-track-hate/heat-map

2. 🔧 Open Developer Tools (F12) → Network tab

3. 🔄 Reload the page and look for requests to:
   https://www.adl.org/apps/heatmap/json?page=X

4. 📋 Right-click a working request → Copy as cURL

5. 💾 Save data for each page:
   curl 'https://www.adl.org/apps/heatmap/json?page=0' [headers] > data/adl/adl_page_0.json
   curl 'https://www.adl.org/apps/heatmap/json?page=1' [headers] > data/adl/adl_page_1.json
   # Continue until no more data

6. 🔄 Process the collected data:
   python code/process_manual_adl_data.py

Alternative: Extract cookies from working request and run:
python code/collect_adl_data.py --cookies "your_cookies_here"
You can also let the script fetch fresh cookies automatically:
python code/collect_adl_data.py --fetch-cookies
        """)

def main():
    parser = argparse.ArgumentParser(description='ADL Data Collector')
    parser.add_argument('--cookies', help='Cookie string from browser')
    parser.add_argument('--auto-cookies', action='store_true', help='Try to find cookies automatically')
    parser.add_argument('--fetch-cookies', action='store_true',
                        help='Fetch fresh cookies and store them to adl_cookies.txt before collecting')
    parser.add_argument('--instructions', action='store_true', help='Show manual collection instructions')
    
    args = parser.parse_args()
    
    collector = ADLDataCollector()
    
    if args.instructions:
        collector.print_manual_instructions()
        return
    
    success = False

    if args.cookies:
        success = collector.collect_with_cookies(args.cookies)
    elif args.auto_cookies:
        success = collector.auto_cookie_attempt()
    elif args.fetch_cookies:
        session = collector.fetch_fresh_cookies()
        success = collector.collect_all_pages(session)
    else:
        logger.info("No options supplied, attempting automatic collection")
        success = collector.auto_cookie_attempt()
        if not success:
            logger.info("Usage:")
            logger.info("  --cookies 'cookie_string'  : Use provided cookies")
            logger.info("  --auto-cookies             : Try automatic cookie discovery")
            logger.info("  --fetch-cookies            : Fetch fresh cookies then collect")
            logger.info("  --instructions             : Show manual collection guide")
            return
    
    if success:
        logger.info("🎉 ADL data collection completed successfully!")
        logger.info("Next step: python code/process_manual_adl_data.py")
        sys.exit(0)
    else:
        logger.error("❌ ADL data collection failed")
        logger.info("Try manual collection or check cookie freshness")
        collector.print_manual_instructions()
        sys.exit(1)

if __name__ == "__main__":
    main()
