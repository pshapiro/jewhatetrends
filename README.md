# Antisemitic Hate Crime Tracker - Complete Package

## 🎯 Overview

This package contains a complete, production-ready hate crime tracking system with:
- **🗺️ Advanced Interactive Maps** with state choropleth visualization and city markers
- **📊 Multi-source Data Integration** from NYPD, LAPD, FBI, and ADL (4,653+ records)
- **📈 Real-time Analytics** with time series analysis and trend correlation
- **🚀 Professional Website** built with React, TypeScript, and react-simple-maps
- **🔄 Automated Update System** for continuous data refresh

## 🌐 Live Demo
**Production Website**: https://6mxwdwiuxo.space.minimax.io

## 📊 Data Sources

1. **🗽 NYPD** - New York Police Department (1,660 records)
2. **🌴 LAPD** - Los Angeles Police Department (13 records)
3. **🏛️ FBI** - Federal hate crime statistics (480 records)
4. **📋 ADL** - Anti-Defamation League incident tracking (2,500 records)

**Total**: 4,653 records across 27 states (2019-2025)

## 🚀 Quick Start

### Option 1: Deploy Static Website (Easiest)

The `website/` folder contains the complete, ready-to-deploy website:

```bash
# Just upload the 'website/' folder to any hosting service:
# ✅ Netlify - Drag and drop deployment
# ✅ Vercel - Import and auto-deploy
# ✅ Cloudflare Pages - Upload or Git integration
# ✅ GitHub Pages - Push to repository
# ✅ Any web server - FTP/SFTP upload
```

### Option 2: Development & Customization

Use the `website-source/` folder for customization:

```bash
cd website-source/
npm install                    # Install dependencies
npm run dev                   # Development server
npm run build                 # Build for production
```

**Dependencies**: React, TypeScript, Tailwind CSS, react-simple-maps, Recharts

### Option 3: Self-Updating Data System

For automated data updates:

```bash
cd data-tools/
pip install -r requirements.txt    # Install Python dependencies
chmod +x update_all_data.sh        # Make executable
./update_all_data.sh              # Run full data update
python auto_deploy.py              # Deploy updated website
```

## 🔄 Data Updates

### Automated Updates (Recommended)

Run the update script daily/weekly:
```bash
cd data-tools/
bash update_all_data.sh
```

### Manual Updates

Update specific sources as needed:
```bash
python download_nypd_data.py      # NYPD data
python download_lapd_data.py      # LAPD data  
python download_fbi_data.py       # FBI data (all states)
python collect_adl_data.py        # ADL data (requires cookies)
python multi_source_integrator.py # Combine all sources
```

## 🌐 Hosting Options

### Static Hosting (No Updates)
- ✅ **Pros**: Simple, fast, free options available
- ❌ **Cons**: Manual updates required
- **Best for**: Basic information display

### Dynamic Hosting (With Updates)  
- ✅ **Pros**: Automatic data refresh, always current
- ❌ **Cons**: Requires server/compute resources
- **Best for**: Production use, research applications

## 📋 Hosting Platform Guides

### Netlify (Free Tier Available)
1. Create account at netlify.com
2. Drag `website/` folder to deployment area
3. Site deployed instantly
4. For updates: Re-upload folder or connect Git

### Cloudflare Pages (Free Tier Available)  
1. Create account at cloudflare.com
2. Go to Pages → Create project
3. Upload `website/` folder or connect Git repository
4. Configure build settings if using source

### GitHub Pages (Free)
1. Create GitHub repository
2. Upload `website/` contents to repository
3. Enable Pages in repository settings
4. Site available at `username.github.io/repository`

### Vercel (Free Tier Available)
1. Create account at vercel.com  
2. Import Git repository or upload files
3. Auto-detects static site configuration
4. Deploys automatically

### Traditional Web Hosting
1. Purchase hosting with file upload capability
2. Upload `website/` contents via FTP/SFTP
3. Point domain to uploaded files
4. Site accessible immediately

## ⚙️ Customization

### Data Sources
- Modify `data-tools/multi_source_integrator.py` to add/remove sources
- Update collection scripts to change data filters
- Adjust deduplication rules as needed

### Website Appearance  
- Edit files in `website-source/src/` 
- Modify styling in `website-source/src/index.css`
- Update components in `website-source/src/components/`
- Rebuild with: `npm run build`

### Geographic Coverage
- Add new city data sources in collection scripts
- Update geographic enhancement in `enhance_geographic_data.py`  
- Modify state/region focus as needed

## 📊 System Architecture

```
Data Collection → Integration → Website → Deployment
     ↓               ↓           ↓           ↓
NYPD/LAPD/FBI → Deduplication → React App → Web Host
     ↓               ↓           ↓           ↓  
   ADL Data   → Schema Unify → Analytics → Updates
```

## 🔧 Troubleshooting

### Data Collection Issues
- **NYPD/LAPD**: Check internet connection, data portal availability
- **FBI**: Verify endpoint accessibility 
- **ADL**: Requires fresh browser cookies (see guides/)

### Website Build Issues  
- Ensure Node.js 16+ installed
- Run `npm install` in website-source/
- Check for TypeScript errors
- Verify data file availability

### Deployment Issues
- Check file permissions
- Verify hosting platform requirements  
- Ensure data files are accessible
- Test locally before deployment

## 📞 Support

For issues or questions:
1. Check documentation in `documentation/`
2. Review error logs for specific issues  
3. Verify data source availability
4. Test components individually

## 📄 License & Usage

This system is designed for research, advocacy, and public safety purposes.
Please respect data source terms of service and rate limits.

---

**🏗️ Built with**: React, TypeScript, Tailwind CSS, Python, Pandas
**📊 Data Sources**: NYPD, LAPD, FBI Crime Data Explorer, ADL
**🌐 Deployment**: Static sites, CDNs, traditional hosting
