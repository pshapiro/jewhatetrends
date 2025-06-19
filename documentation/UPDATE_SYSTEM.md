# Comprehensive Self-Update System

## 🚀 How to Update Data Without Assistance

This system allows you to update your hate crime tracking website with the latest data completely independently.

## 📋 Quick Update Process

### **Option 1: Complete Automated Update** (Recommended)
```bash
cd /workspace
chmod +x update_all_data.sh
./update_all_data.sh
```

### **Option 2: Manual Step-by-Step**
```bash
# 1. Collect latest data
python code/collect_latest_data.py

# 2. Process and integrate
python code/auto_integrate_data.py

# 3. Update website
python code/auto_update_website.py

# 4. Deploy
python code/auto_deploy.py
```

## 🔄 Update Schedule Recommendations

- **Daily**: ADL data (if using automated collection)
- **Weekly**: NYPD data (usually updated weekly)
- **Monthly**: LAPD data + full integration check
- **Quarterly**: Full system validation and cleanup

## 📊 Data Source Update Methods

### **ADL Data Updates**

**Method 1: Using Your Working Browser Session**
```bash
# 1. Go to ADL Heat Map in your browser
# 2. Open Dev Tools → Network tab
# 3. Copy fresh cookies from working requests
# 4. Update the collector:

python code/collect_adl_data.py --cookies "YOUR_FRESH_COOKIES_HERE"
```

**Method 2: Manual Collection + Processing**
```bash
# If automated collection fails, manually save data:
# 1. Use your working curl commands to save JSON files
# 2. Process them:

python code/process_manual_adl_data.py
```

### **NYPD Data Updates**
```bash
# NYPD updates automatically via their open data API
python code/download_nypd_data.py
```

### **LAPD Data Updates**
```bash
# LAPD updates automatically via their open data API  
python code/download_lapd_data.py
```

## 🛠️ System Components

### **Core Update Scripts**
- `update_all_data.sh` - Master update script
- `collect_latest_data.py` - Collects from all sources
- `auto_integrate_data.py` - Processes and integrates data
- `auto_update_website.py` - Updates website components
- `auto_deploy.py` - Rebuilds and deploys website

### **Individual Source Collectors**
- `download_nypd_data.py` - NYPD data collection
- `download_lapd_data.py` - LAPD data collection
- `collect_adl_data.py` - ADL data collection (requires cookies)

### **Data Processing**
- `process_manual_adl_data.py` - Process manually collected ADL data
- `multi_source_integrator.py` - Advanced data integration
- `enhance_geographic_data.py` - Geographic enhancement

## 🔧 Troubleshooting Updates

### **ADL Collection Issues**
```bash
# If ADL collection fails:
1. Check if cookies are fresh (they expire quickly)
2. Extract new cookies from working browser session
3. Use manual collection as backup

# To extract fresh cookies:
# 1. Open ADL Heat Map in browser
# 2. Dev Tools → Application → Cookies
# 3. Copy cookie string from working Network requests
```

### **Website Build Issues**
```bash
# If website build fails:
cd hate-crime-tracker
npm install  # Reinstall dependencies
npm run build  # Manual build

# Check for TypeScript errors:
npm run build 2>&1 | grep -i error
```

### **Deploy Issues**
```bash
# If deployment fails, manual deploy:
cd hate-crime-tracker
npm run build
# Then upload dist/ folder to your hosting platform
```

## 📈 Monitoring Update Success

### **Data Quality Checks**
```bash
# Check latest data integration:
python -c "
import pandas as pd
df = pd.read_csv('data/integrated/integrated_hate_crimes_enhanced.csv')
print(f'Total incidents: {len(df):,}')
print(f'Latest date: {df[\"date\"].max()}')
print(f'Source breakdown:')
print(df['source'].value_counts())
"
```

### **Website Health Check**
```bash
# Verify website data:
python -c "
import pandas as pd
import json
df = pd.read_csv('hate-crime-tracker/public/data/unified_hate_crimes_corrected.csv')
print(f'Website has {len(df):,} incidents')
print(f'Latest date: {df[\"date\"].max()}')

with open('hate-crime-tracker/public/data/map_data.json') as f:
    map_data = json.load(f)
print(f'Map data: {map_data[\"summary\"][\"cities_mapped\"]} cities')
"
```

## 📅 Setting Up Automated Updates

### **Using Cron (Linux/Mac)**
```bash
# Edit crontab
crontab -e

# Add daily update at 6 AM:
0 6 * * * cd /workspace && ./update_all_data.sh >> update.log 2>&1

# Add weekly full update on Sundays at 2 AM:
0 2 * * 0 cd /workspace && ./update_all_data.sh --full >> update_full.log 2>&1
```

### **Manual Scheduling**
Set reminders to run updates:
- **Daily**: Check for new ADL data
- **Weekly**: Full update cycle
- **Monthly**: Verify all sources and data quality

## 🚨 Emergency Procedures

### **If ADL API Access is Lost**
1. Continue with NYPD + LAPD data (still valuable)
2. Contact ADL for official API access: research@adl.org
3. Use existing ADL data as baseline

### **If Website Won't Deploy**
1. Check build logs: `cd hate-crime-tracker && npm run build`
2. Fix any TypeScript errors
3. Manually upload `dist/` folder to hosting platform

### **If Data Integration Fails**
1. Revert to last known good dataset
2. Check individual source data quality
3. Run integration step-by-step

## 📞 Support Resources

### **Documentation**
- `README_ADL_Integration.md` - ADL-specific guidance
- `QUICK_START_ADL.md` - Quick ADL setup
- `docs/adl_integration_guide.md` - Detailed ADL integration

### **Logs and Debugging**
- `update.log` - Daily update logs
- `update_full.log` - Weekly full update logs
- `error.log` - Error tracking

### **Community Resources**
- ADL Research Team: research@adl.org
- NYPD Open Data: opendata@nypd.org
- LAPD Data: [data.lacity.org](https://data.lacity.org)

## 🎯 Success Metrics

After successful updates, you should see:
- ✅ Incident count increased (if new data available)
- ✅ Latest date reflects recent incidents
- ✅ All three sources (NYPD, LAPD, ADL) represented
- ✅ Website displays updated statistics
- ✅ Map shows current geographic distribution

**Your system is designed to be self-sufficient and maintainable!**
