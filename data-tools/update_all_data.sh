#!/bin/bash

# Comprehensive Data Update System
# Automatically updates all data sources and rebuilds website

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$WORKSPACE_DIR/update.log"
ERROR_LOG="$WORKSPACE_DIR/error.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

error_log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ERROR: $1" | tee -a "$ERROR_LOG"
    echo -e "${RED}ERROR: $1${NC}"
}

success_log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - SUCCESS: $1" | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ $1${NC}"
}

warning_log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - WARNING: $1" | tee -a "$LOG_FILE"
    echo -e "${YELLOW}⚠️ $1${NC}"
}

info_log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - INFO: $1" | tee -a "$LOG_FILE"
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Change to workspace directory
cd "$WORKSPACE_DIR"

echo -e "${BLUE}"
echo "🔄 HATE CRIME DATA UPDATE SYSTEM"
echo "=================================="
echo -e "${NC}"

log "Starting comprehensive data update process"

# Check if this is a full update
FULL_UPDATE=false
if [ "$1" = "--full" ]; then
    FULL_UPDATE=true
    info_log "Running full update with complete data refresh"
fi

# 1. Update NYPD Data
info_log "Step 1: Updating NYPD data..."
if python data-tools/download_nypd_data.py; then
    success_log "NYPD data updated successfully"
else
    error_log "NYPD data update failed, continuing with existing data"
fi

# 2. Update LAPD Data
info_log "Step 2: Updating LAPD data..."
if python data-tools/download_lapd_data.py; then
    success_log "LAPD data updated successfully"
else
    error_log "LAPD data update failed, continuing with existing data"
fi

# 3. Update FBI Data (Official Federal Data)
info_log "Step 3: Updating FBI data..."
if python data-tools/download_fbi_data.py; then
    success_log "FBI data updated successfully"
else
    error_log "FBI data update failed, continuing with existing data"
fi

# 4. Check for ADL data updates
info_log "Step 4: Checking ADL data updates..."
if [ -f "data-tools/collect_adl_data.py" ]; then
    info_log "ADL collector found, attempting automatic update..."
    if python data-tools/collect_adl_data.py --auto-cookies; then
        success_log "ADL data updated successfully"
        # Process the collected ADL data
        python data-tools/process_manual_adl_data.py
    else
        warning_log "ADL automatic update failed - using existing data"
        info_log "To update ADL data manually:"
        info_log "1. Extract fresh cookies from browser"
        info_log "2. Run: python data-tools/collect_adl_data.py --cookies 'YOUR_COOKIES'"
        info_log "3. Then run: python data-tools/process_manual_adl_data.py"
    fi
else
    info_log "Using existing ADL data"
fi

# 5. Integrate all data sources
info_log "Step 11: Integrating all data sources..."
if python data-tools/multi_source_integrator.py; then
    success_log "Data integration completed successfully"
else
    error_log "Data integration failed"
    exit 1
fi

# 5. Enhance geographic data
info_log "Step 11: Enhancing geographic data..."
if python data-tools/enhance_geographic_data.py; then
    success_log "Geographic enhancement completed"
else
    error_log "Geographic enhancement failed"
    exit 1
fi

# 6. Enhance ADL visibility (if needed)
if [ "$FULL_UPDATE" = true ]; then
    info_log "Step 11: Enhancing ADL visibility across components..."
    if python data-tools/enhance_adl_visibility.py; then
        success_log "ADL visibility enhancement completed"
    else
        warning_log "ADL visibility enhancement failed, continuing..."
    fi
fi

# 7. Update website data
info_log "Step 11: Updating website data files..."
# Copy enhanced data to website
cp data/integrated/integrated_hate_crimes_enhanced.csv hate-crime-tracker/public/data/unified_hate_crimes_corrected.csv
cp data/integrated/map_data.json hate-crime-tracker/public/data/map_data.json

# Update integration report
if [ -f "data/integrated/integration_report.json" ]; then
    cp data/integrated/integration_report.json hate-crime-tracker/public/data/integration_report.json
fi

success_log "Website data files updated"

# 8. Rebuild website
info_log "Step 11: Rebuilding website..."
cd hate-crime-tracker

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ "$FULL_UPDATE" = true ]; then
    info_log "Installing/updating dependencies..."
    npm install
fi

# Build website
if npm run build; then
    success_log "Website built successfully"
else
    error_log "Website build failed"
    cd "$WORKSPACE_DIR"
    exit 1
fi

cd "$WORKSPACE_DIR"

# 9. Generate update report
info_log "Step 11: Generating update report..."
python -c "
import pandas as pd
import json
from datetime import datetime

# Load updated data
df = pd.read_csv('hate-crime-tracker/public/data/unified_hate_crimes_corrected.csv')

# Generate report
report = {
    'update_timestamp': datetime.now().isoformat(),
    'total_incidents': len(df),
    'latest_incident_date': df['date'].max(),
    'source_breakdown': df['source'].value_counts().to_dict(),
    'geographic_coverage': {
        'states': df['state'].nunique(),
        'cities': df['city'].nunique() if 'city' in df.columns else 'N/A'
    },
    'data_quality': {
        'incidents_with_coordinates': len(df[df['latitude'].notna()]),
        'coordinate_coverage_percent': round(len(df[df['latitude'].notna()]) / len(df) * 100, 1)
    }
}

# Save report
with open('update_report.json', 'w') as f:
    json.dump(report, f, indent=2)

print(f'📊 UPDATE REPORT')
print(f'================')
print(f'Total incidents: {report[\"total_incidents\"]:,}')
print(f'Latest incident: {report[\"latest_incident_date\"]}')
print(f'Geographic coverage: {report[\"geographic_coverage\"][\"states\"]} states')
print(f'Coordinate coverage: {report[\"data_quality\"][\"coordinate_coverage_percent\"]}%')
print(f'Source breakdown:')
for source, count in report['source_breakdown'].items():
    print(f'  {source}: {count:,} incidents')
"

success_log "Update report generated"

# 10. Optional: Deploy website
if [ "$2" = "--deploy" ] || [ "$FULL_UPDATE" = true ]; then
    info_log "Step 11: Deploying website..."
    # Note: This would need to be customized based on your hosting platform
    info_log "Website ready for deployment from: hate-crime-tracker/dist/"
    info_log "Manual deployment step required for your hosting platform"
else
    info_log "Skipping deployment (add --deploy flag to deploy automatically)"
fi

# Summary
echo ""
echo -e "${GREEN}"
echo "🎉 UPDATE PROCESS COMPLETED SUCCESSFULLY!"
echo "========================================="
echo -e "${NC}"

log "Update process completed successfully"

# Display summary
python -c "
import json
try:
    with open('update_report.json') as f:
        report = json.load(f)
    print(f'✅ {report[\"total_incidents\"]:,} total incidents processed')
    print(f'✅ Data current through {report[\"latest_incident_date\"]}')
    print(f'✅ {report[\"geographic_coverage\"][\"states\"]} states covered')
    print(f'✅ {report[\"data_quality\"][\"coordinate_coverage_percent\"]}% coordinate coverage')
    print(f'✅ Website ready at: hate-crime-tracker/dist/')
except:
    print('✅ Update completed (report generation failed)')
"

echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Review update_report.json for details"
echo "2. Deploy website from hate-crime-tracker/dist/"
echo "3. Monitor data quality and coverage"
echo ""
echo -e "${BLUE}📅 Schedule Next Update:${NC}"
echo "- Daily: Run this script for fresh data"
echo "- Weekly: Run with --full flag for complete refresh"
echo ""
echo -e "${BLUE}🔧 Troubleshooting:${NC}"
echo "- Check error.log for issues"
echo "- See UPDATE_SYSTEM.md for detailed guidance"
echo ""

log "Update system ready for next run"
