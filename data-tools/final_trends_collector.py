#!/usr/bin/env python3
"""
Google Trends Data Collector for jewhatetrends
Downloads fresh antisemitic search trend data using Google Trends CSV export URLs
"""

import json
import pandas as pd
import requests
from pathlib import Path
from datetime import datetime
import time
import urllib.parse

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

def get_google_session() -> requests.Session:
    """Return a session preloaded with Google Trends cookies."""
    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)
    try:
        session.get("https://trends.google.com/trends/", timeout=30)
    except Exception:
        pass
    return session

def update_trends_url(url: str, start: str, end: str) -> str:
    """Update the time range in a Google Trends export URL."""
    parsed = urllib.parse.urlparse(url)
    params = urllib.parse.parse_qs(parsed.query)
    if 'req' in params:
        req_json = json.loads(urllib.parse.unquote(params['req'][0]))
        req_json['time'] = f"{start} {end}"
        params['req'] = [urllib.parse.quote(json.dumps(req_json, separators=(',', ':')))]
    new_query = '&'.join(f"{k}={v[0]}" for k, v in params.items())
    return urllib.parse.urlunparse(parsed._replace(query=new_query))

def refresh_url_token(url: str, session: requests.Session) -> str:
    """Retrieve a fresh token for the provided Google Trends URL."""
    parsed = urllib.parse.urlparse(url)
    params = urllib.parse.parse_qs(parsed.query)
    if 'req' not in params:
        return url

    req_json = json.loads(urllib.parse.unquote(params['req'][0]))
    tz = params.get('tz', ['0'])[0]

    explore_req = {
        'comparisonItem': req_json.get('comparisonItem', []),
        'category': req_json.get('requestOptions', {}).get('category', 0),
        'property': req_json.get('requestOptions', {}).get('property', '')
    }

    explore_params = {
        'hl': req_json.get('locale', 'en-US'),
        'tz': tz,
        'req': json.dumps(explore_req, separators=(',', ':'))
    }

    headers = DEFAULT_HEADERS

    response = session.get(
        'https://trends.google.com/trends/api/explore',
        params=explore_params,
        headers=headers,
        timeout=30
    )
    response.raise_for_status()

    text = response.text
    if text.startswith(")]}'"):
        text = text[5:]

    data = json.loads(text)

    token = None
    for widget in data.get('widgets', []):
        if widget.get('id') == 'TIMESERIES':
            token = widget.get('token')
            break
    if not token and data.get('widgets'):
        token = data['widgets'][0].get('token')

    if token:
        params['token'] = [token]
        new_query = '&'.join(f"{k}={v[0]}" for k, v in params.items())
        return urllib.parse.urlunparse(parsed._replace(query=new_query))

    raise ValueError('Unable to retrieve token')
def load_trends_urls():
    """Return the working Google Trends URLs"""
    return {
        "antisemitic_slurs_1": "https://trends.google.com/trends/api/widgetdata/multiline/csv?req=%7B%22time%22%3A%222020-06-18%202025-06-18%22%2C%22resolution%22%3A%22WEEK%22%2C%22locale%22%3A%22en-US%22%2C%22comparisonItem%22%3A%5B%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22kike%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22church%20of%20satan%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22israhell%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22iof%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22george%20soros%22%7D%5D%7D%7D%5D%2C%22requestOptions%22%3A%7B%22property%22%3A%22%22%2C%22backend%22%3A%22IZG%22%2C%22category%22%3A0%7D%2C%22userConfig%22%3A%7B%22userType%22%3A%22USER_TYPE_LEGIT_USER%22%7D%7D&token=APP6_UEAAAAAaFRv_79WaDPL2e7ViNFRK3VPsLGgjk66&tz=240",
        
        "antisemitic_hate_terms": "https://trends.google.com/trends/api/widgetdata/multiline/csv?req=%7B%22time%22%3A%222020-06-18%202025-06-18%22%2C%22resolution%22%3A%22WEEK%22%2C%22locale%22%3A%22en-US%22%2C%22comparisonItem%22%3A%5B%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22hate%20jews%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22zionazi%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22Zionist%20conspiracy%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22Jewish%20cabal%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22globalist%20Jews%22%7D%5D%7D%7D%5D%2C%22requestOptions%22%3A%7B%22property%22%3A%22%22%2C%22backend%22%3A%22IZG%22%2C%22category%22%3A0%7D%2C%22userConfig%22%3A%7B%22userType%22%3A%22USER_TYPE_LEGIT_USER%22%7D%7D&token=APP6_UEAAAAAaFRwgmtQjMJp_4a4i2v3PTLVsOtmI8zN&tz=240",
        
        "conspiracy_theories": "https://trends.google.com/trends/api/widgetdata/multiline/csv?req=%7B%22time%22%3A%222020-06-18%202025-06-18%22%2C%22resolution%22%3A%22WEEK%22%2C%22locale%22%3A%22en-US%22%2C%22comparisonItem%22%3A%5B%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22Jewish%20elite%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22Jews%20control%20media%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22Jewish%20bankers%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22Jewish%20world%20order%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22Zionist%20Occupied%20Government%22%7D%5D%7D%7D%5D%2C%22requestOptions%22%3A%7B%22property%22%3A%22%22%2C%22backend%22%3A%22IZG%22%2C%22category%22%3A0%7D%2C%22userConfig%22%3A%7B%22userType%22%3A%22USER_TYPE_LEGIT_USER%22%7D%7D&token=APP6_UEAAAAAaFRw_t0AsHE2_UFZBe4SC_Kx6-m46jCg&tz=240",
        
        "antisemitic_memes": "https://trends.google.com/trends/api/widgetdata/multiline/csv?req=%7B%22time%22%3A%222020-06-18%202025-06-18%22%2C%22resolution%22%3A%22WEEK%22%2C%22locale%22%3A%22en-US%22%2C%22comparisonItem%22%3A%5B%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22zog%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22goyim%20know%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22happy%20merchant%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22jewish%20problem%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22jewish%20question%22%7D%5D%7D%7D%5D%2C%22requestOptions%22%3A%7B%22property%22%3A%22%22%2C%22backend%22%3A%22IZG%22%2C%22category%22%3A0%7D%2C%22userConfig%22%3A%7B%22userType%22%3A%22USER_TYPE_LEGIT_USER%22%7D%7D&token=APP6_UEAAAAAaFRxUg8lNBAmqfMC_2SiexOO7OWllFEv&tz=240",
        
        "holocaust_denial": "https://trends.google.com/trends/api/widgetdata/multiline/csv?req=%7B%22time%22%3A%222020-06-18%202025-06-18%22%2C%22resolution%22%3A%22WEEK%22%2C%22locale%22%3A%22en-US%22%2C%22comparisonItem%22%3A%5B%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22Zionist%20puppet%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22AIPAC%20control%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22Holocaust%20hoax%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22Did%20the%20Holocaust%20happen%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%226%20million%20lie%22%7D%5D%7D%7D%5D%2C%22requestOptions%22%3A%7B%22property%22%3A%22%22%2C%22backend%22%3A%22IZG%22%2C%22category%22%3A0%7D%2C%22userConfig%22%3A%7B%22userType%22%3A%22USER_TYPE_LEGIT_USER%22%7D%7D&token=APP6_UEAAAAAaFRxpXXJbmpoKfupR-OtRdSK3WZI0dik&tz=240",
        
        "extreme_antisemitism": "https://trends.google.com/trends/api/widgetdata/multiline/csv?req=%7B%22time%22%3A%222020-06-18%202025-06-18%22%2C%22resolution%22%3A%22WEEK%22%2C%22locale%22%3A%22en-US%22%2C%22comparisonItem%22%3A%5B%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22based%20antisemitism%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22hitler%20war%20right%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22dancing%20israelis%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22fuck%20jews%22%7D%5D%7D%7D%2C%7B%22geo%22%3A%7B%22country%22%3A%22US%22%7D%2C%22complexKeywordsRestriction%22%3A%7B%22keyword%22%3A%5B%7B%22type%22%3A%22BROAD%22%2C%22value%22%3A%22fuck%20the%20jews%22%7D%5D%7D%7D%5D%2C%22requestOptions%22%3A%7B%22property%22%3A%22%22%2C%22backend%22%3A%22IZG%22%2C%22category%22%3A0%7D%2C%22userConfig%22%3A%7B%22userType%22%3A%22USER_TYPE_LEGIT_USER%22%7D%7D&token=APP6_UEAAAAAaFRyNe94XGxLTszr7tmnYFOpAfcro_lu&tz=240"
    }

def download_category_data(category, url, output_dir, start_date: str, end_date: str, session: requests.Session):
    """Download data for a specific category"""
    try:
        print(f"🔍 Downloading {category}...")
        
        # Set up request headers
        headers = DEFAULT_HEADERS
        
        # Update URL with the desired date range and refresh token
        url = update_trends_url(url, start_date, end_date)
        url = refresh_url_token(url, session)
        retries = 1

        while retries >= 0:
            try:
                response = session.get(url, headers=headers, timeout=30)
                response.raise_for_status()
                break
            except Exception as e:
                if retries == 0:
                    raise
                # refresh session and token once more
                session = get_google_session()
                url = refresh_url_token(url, session)
                retries -= 1

        # Parse CSV data - find where actual CSV starts
        text = response.text.strip()
        lines = text.split('\n')
        
        # Find the line that starts the actual data (skip metadata)
        csv_start = 0
        for i, line in enumerate(lines):
            if 'Week' in line or line.startswith('2020') or line.startswith('2021') or line.startswith('2022'):
                csv_start = i
                break
        
        # Join lines from CSV start
        csv_data = '\n'.join(lines[csv_start:])
        
        # Parse with pandas
        from io import StringIO
        df = pd.read_csv(StringIO(csv_data))
        
        if df.empty:
            raise ValueError("Empty DataFrame")
        
        # Save the data
        output_file = output_dir / f"google_trends_{category}.csv"
        df.to_csv(output_file, index=False)
        
        print(f"✅ SUCCESS: {category} - {len(df)} rows saved to {output_file.name}")
        
        return {
            'category': category,
            'success': True,
            'rows': len(df),
            'file': str(output_file),
            'date_range': f"{df.iloc[0, 0]} to {df.iloc[-1, 0]}" if len(df) > 0 else "Unknown"
        }
        
    except Exception as e:
        print(f"❌ FAILED: {category} - {str(e)}")
        return {
            'category': category,
            'success': False,
            'error': str(e)
        }

def main():
    """Main function"""
    print("📈 Google Trends Data Collector for jewhatetrends")
    print("=" * 55)
    print(f"🚀 Started at {datetime.now()}")
    
    # Set up output directory
    script_dir = Path(__file__).parent
    output_dir = Path("website-source/public/data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"📁 Data will be saved to: {output_dir}")
    
    # Load URLs
    urls = load_trends_urls()
    print(f"🔗 Configured for {len(urls)} trend categories")

    start_date = "2020-06-18"
    end_date = datetime.now().strftime("%Y-%m-%d")
    
    # Prepare session with cookies
    session = get_google_session()

    # Download each category
    results = []
    for category, url in urls.items():
        result = download_category_data(category, url, output_dir, start_date, end_date, session)
        results.append(result)
        
        # Wait between requests
        if category != list(urls.keys())[-1]:  # Not the last one
            time.sleep(3)
    
    # Create summary metadata
    successful = [r for r in results if r['success']]
    
    if successful:
        metadata = {
            'last_updated': datetime.now().isoformat(),
            'total_categories': len(urls),
            'successful_downloads': len(successful),
            'categories': {
                r['category']: {
                    'rows': r['rows'],
                    'date_range': r['date_range'],
                    'file': Path(r['file']).name
                } for r in successful
            }
        }
        
        # Save metadata
        metadata_file = output_dir / "google_trends_metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"📋 Metadata saved to {metadata_file.name}")
    
    # Final summary
    total = len(results)
    success_count = len(successful)
    
    print("\n" + "=" * 55)
    print("✅ COLLECTION COMPLETED")
    print("=" * 55)
    print(f"📊 Categories processed: {total}")
    print(f"✅ Successful downloads: {success_count}")
    print(f"❌ Failed downloads: {total - success_count}")
    
    if success_count > 0:
        print(f"📁 Data files saved to: {output_dir}")
        print("🎉 Google Trends data collection completed successfully!")
        print("💡 Your jewhatetrends website now has fresh data")
        return True
    else:
        print("❌ No data collected")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
