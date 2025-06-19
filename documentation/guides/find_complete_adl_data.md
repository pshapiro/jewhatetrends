# Finding Complete ADL Data (2023-2025)

Since you discovered that the API endpoints only go to 2022 but the web UI has 2023-2025 data, here's a systematic approach to find the complete data access methods.

## 🕵️ Investigation Strategy

The discrepancy suggests one of these scenarios:
1. **Different API endpoints** for recent data
2. **Additional parameters** needed for newer data  
3. **Separate data sources** or systems for current incidents
4. **Dynamic loading** of recent data via different requests

## 🔍 Step-by-Step Investigation

### Phase 1: Browser Network Analysis

#### 1.1 Capture All Network Requests
```bash
# In your browser:
1. Go to: https://www.adl.org/resources/tools-to-track-hate/heat-map
2. Open Dev Tools (F12) → Network tab
3. Click "Clear" to clear all requests
4. Reload the page completely
5. Look for ALL requests containing:
   - "heatmap"
   - "incident" 
   - "json"
   - "api"
   - "data"
   - Numbers like "2023", "2024", "2025"
```

#### 1.2 Interactive Analysis
```bash
# Try these interactions while monitoring Network tab:
1. Change date filters (if available)
2. Click on different map regions
3. Use any year/time period selectors
4. Scroll through incident lists
5. Apply different filters (type, location, etc.)
6. Look for lazy-loading requests as you scroll
```

#### 1.3 Request Pattern Analysis
Look for patterns like:
```
✅ LOOK FOR:
- /apps/heatmap/json?year=2024
- /api/v2/incidents?from=2023-01-01
- /heatmap/recent?limit=100
- /incidents/search?date_range=current
- WebSocket connections for real-time data
- GraphQL endpoints with date parameters

❌ IGNORE:
- Static assets (CSS, JS, images)
- Analytics requests
- Ad tracking
- Social media widgets
```

### Phase 2: JavaScript Source Analysis

#### 2.1 Find API Configuration
```bash
# In Dev Tools → Sources tab, search for:
1. "api" + "endpoint" 
2. "baseURL" or "API_BASE"
3. "heatmap" + "url"
4. Date filtering logic
5. "fetch(" or "axios(" calls
6. Configuration objects with URLs
```

#### 2.2 Common JavaScript Patterns
```javascript
// Look for code like:
const API_BASE = 'https://www.adl.org/api/v2';
const HEATMAP_ENDPOINT = '/incidents/search';

// Or date-based URL construction:
const url = `/api/incidents?from=${startDate}&to=${endDate}`;

// Or conditional endpoints:
const endpoint = year >= 2023 ? '/api/v2/incidents' : '/apps/heatmap/json';
```

### Phase 3: Systematic API Testing

#### 3.1 Test Endpoint Variations
```bash
# Run the API explorer I created:
cd /workspace
python code/adl_api_explorer.py

# This will test dozens of endpoint variations automatically
```

#### 3.2 Manual Parameter Testing
If you find the base endpoint, test these parameters:
```bash
# Date-based parameters:
?year=2023
?year=2024
?year=2025
?from_date=2023-01-01
?start_date=2023-01-01
?since=2023-01-01
?date_range=2023-2025
?filter=recent
?period=current

# API version parameters:
?version=2
?api_version=2
?v=2

# Pagination for larger datasets:
?limit=1000
?per_page=1000
?offset=0
?page_size=1000
```

### Phase 4: Advanced Investigation

#### 4.1 Check for Multiple Data Sources
```bash
# The recent data might come from:
1. Different API endpoints (/api/v2/ vs /apps/heatmap/)
2. Real-time databases (different from historical)
3. External services (CDN, microservices)
4. WebSocket connections for live updates
5. GraphQL endpoints instead of REST
```

#### 4.2 Look for Authentication Changes
```bash
# Check if recent data requires:
1. Different authentication
2. Additional cookies
3. API keys in headers
4. Session tokens
5. CSRF tokens for newer endpoints
```

## 🎯 Specific Things to Look For

### Network Tab Checklist
```bash
✅ Domain variations:
   - api.adl.org
   - data.adl.org  
   - heatmap.adl.org
   - cdn.adl.org

✅ Path variations:
   - /api/v2/incidents
   - /apps/heatmap/v2/
   - /data/incidents/
   - /heatmap/search
   - /incidents/recent

✅ Query parameters:
   - ?recent=true
   - ?live=true
   - ?current=true
   - ?updated_since=2023-01-01
```

### Response Analysis
```bash
✅ Check response headers for:
   - API version indicators
   - Cache headers (recent data might not be cached)
   - Rate limiting info
   - Authentication requirements

✅ Check response data for:
   - Date ranges in incidents
   - Total count indicators  
   - Pagination metadata
   - API version in response
```

## 🛠️ Tools to Help You

### 1. Browser Extensions
```bash
# Install these to help capture requests:
- "HTTP Toolkit" - Intercepts all HTTP traffic
- "Postman Interceptor" - Captures requests for testing
- "Insomnia" - API testing tool
```

### 2. Command Line Tools
```bash
# Use these for systematic testing:
curl -s "https://www.adl.org/apps/heatmap/json?year=2024" | jq '.'
curl -s "https://www.adl.org/api/v2/incidents?from=2023-01-01" | jq '.'

# Test with your working cookies:
curl -b "your_cookies_here" "https://www.adl.org/api/incidents/recent" | jq '.'
```

## 🚨 Common Scenarios & Solutions

### Scenario 1: Separate API for Recent Data
```bash
# If newer data is in a different system:
- Look for /api/v2/ endpoints
- Check for different authentication
- Test with ?version=2 parameter
```

### Scenario 2: Real-time vs Historical Split
```bash
# Many systems split data:
- Historical: /apps/heatmap/json (2019-2022)
- Recent: /api/incidents/live (2023-2025)
- You might need both endpoints
```

### Scenario 3: Date Parameter Required
```bash
# Recent data might require explicit date filters:
curl "https://www.adl.org/apps/heatmap/json?from_date=2023-01-01&to_date=2025-12-31"
```

### Scenario 4: Pagination Changes
```bash
# Newer data might use different pagination:
- Old: ?page=0 (max 50 pages to 2022)
- New: ?offset=1000&limit=1000 (gets recent data)
```

## 📋 Action Plan

### Immediate Steps (Next 30 minutes)
1. **Open ADL Heat Map in browser**
2. **Monitor Network tab while interacting**
3. **Copy any new requests as cURL commands**
4. **Run the API explorer script**
5. **Document all findings**

### If You Find New Endpoints
```bash
# Test immediately:
1. Verify data quality and completeness
2. Check date ranges in responses
3. Test pagination to get all data
4. Update the data collector script
5. Re-run integration pipeline
```

### If No New Endpoints Found
```bash
# Alternative approaches:
1. Contact ADL directly for API access
2. Web scraping approach (last resort)
3. Use available 2019-2022 data + other sources
4. Monitor for API updates/announcements
```

## 💡 Pro Tips

### Developer Tools Shortcuts
```bash
# Chrome/Firefox shortcuts:
- Ctrl+Shift+I: Open Dev Tools
- Ctrl+R: Reload with Dev Tools open
- Ctrl+F in Network tab: Search requests
- Right-click request → Copy as cURL
```

### Network Request Analysis
```bash
# Focus on requests that:
✅ Return JSON data
✅ Have incident/event data
✅ Show recent dates in URL or response
✅ Have authentication headers
✅ Use POST (might be search endpoints)

❌ Ignore requests that:
❌ Return HTML/CSS/JS files
❌ Are analytics/tracking
❌ Are social media embeds
❌ Are advertisements
```

### Testing Methodology
```bash
# Systematic approach:
1. Document current working endpoint
2. Test variations methodically  
3. Save all responses for analysis
4. Compare data structures
5. Look for patterns in successful requests
```

## 📞 Backup Plan

If technical investigation doesn't work:
1. **Contact ADL Research Team**: research@adl.org
2. **Request data partnership** for academic/research use
3. **Explain your hate crime tracking project**
4. **Ask specifically about accessing 2023-2025 data**

The goal is to find the complete data access method so you can build the most comprehensive hate crime tracking system possible!
