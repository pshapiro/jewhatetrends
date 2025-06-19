# ADL Cookie Extraction Guide

Since you have working access to the ADL endpoints, here's how to extract fresh cookies and complete the integration:

## Method 1: Extract Fresh Cookies from Browser

### Step 1: Get Fresh Cookies
1. Open Chrome/Firefox and go to: https://www.adl.org/resources/tools-to-track-hate/heat-map
2. Open Developer Tools (F12)
3. Go to **Network** tab
4. Reload the page or interact with the heat map
5. Find a request to `heatmap/json?page=0`
6. Right-click → **Copy as cURL**

### Step 2: Update the Collector Script
Replace the cookies in `code/adl_data_collector_working.py` with your fresh ones.

## Method 2: Browser Extension Method

### Step 1: Install Cookie Exporter
- Install "Cookie-Editor" extension for Chrome/Firefox
- Or use "EditThisCookie" extension

### Step 2: Export Cookies
1. Go to ADL heat map page
2. Click the cookie extension
3. Export cookies for `adl.org` domain
4. Copy the cookie string

## Method 3: Manual Data Collection (Recommended)

Since the integration framework is ready, you can manually collect a few pages to get started:

### Step 1: Save Sample Data
```bash
# In your terminal where the curl works:
curl 'https://www.adl.org/apps/heatmap/json?page=0' [your_curl_parameters] > /workspace/data/adl/adl_page_0.json
curl 'https://www.adl.org/apps/heatmap/json?page=1' [your_curl_parameters] > /workspace/data/adl/adl_page_1.json
curl 'https://www.adl.org/apps/heatmap/json?page=2' [your_curl_parameters] > /workspace/data/adl/adl_page_2.json
# ... continue for more pages
```

### Step 2: Combine Data
Create `/workspace/data/adl/combine_manual_data.py`:
```python
import json
import glob
from pathlib import Path

data_dir = Path("data/adl")
all_incidents = []

# Load all page files
for json_file in glob.glob(str(data_dir / "adl_page_*.json")):
    with open(json_file, 'r') as f:
        data = json.load(f)
        if isinstance(data, dict) and 'incidents' in data:
            all_incidents.extend(data['incidents'])
        elif isinstance(data, list):
            all_incidents.extend(data)

# Save combined data
with open(data_dir / "adl_all_incidents.json", 'w') as f:
    json.dump(all_incidents, f, indent=2)

print(f"Combined {len(all_incidents)} incidents from manual collection")
```

### Step 3: Run Integration
```bash
# After you have ADL data
python code/multi_source_integrator.py
python code/enhanced_website_updater.py
```

## Method 4: Cookie String Format

If you can copy your working curl command, update this in the Python script:

```python
# Replace the cookie string in adl_data_collector_working.py
cookie_string = "sucuri_cloudproxy_uuid_f514a4599=NEW_VALUE; _vwo_uuid_v2=NEW_VALUE; ..."

# Parse cookies
cookies = {}
for cookie in cookie_string.split('; '):
    if '=' in cookie:
        key, value = cookie.split('=', 1)
        cookies[key] = value

for key, value in cookies.items():
    self.session.cookies.set(key, value)
```

## Testing Your Access

Once you have fresh cookies, test with:

```bash
cd /workspace
python code/adl_data_collector_working.py
```

## What the ADL Data Structure Looks Like

Based on typical H.E.A.T. Map data, expect structure like:
```json
{
  "incidents": [
    {
      "id": "12345",
      "date": "2024-01-15",
      "state": "New York", 
      "city": "Brooklyn",
      "latitude": 40.6782,
      "longitude": -73.9442,
      "category": "Antisemitic",
      "type": "Vandalism",
      "description": "Incident description...",
      "verified": true
    }
  ],
  "pagination": {
    "current_page": 0,
    "total_pages": 15,
    "per_page": 50
  }
}
```

## Next Steps After Collection

1. **Verify Data**: Check that incidents look reasonable
2. **Run Integration**: Combine with NYPD/LAPD data  
3. **Update Website**: Deploy enhanced multi-source dashboard
4. **Test Results**: Verify new features work correctly

The integration framework is ready - you just need to get the ADL data into the system!
