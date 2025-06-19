# ADL Data Integration Guide

## Quick Start

You've discovered accessible ADL H.E.A.T. Map API endpoints! Here's how to integrate this valuable data into your hate crime tracking system:

### Step 1: Collect ADL Data

```bash
# Run the ADL data collector
cd /workspace
python code/adl_data_collector.py
```

This will:
- Fetch data from all ADL API pages (0-15+)
- Analyze the data structure
- Convert to unified schema
- Save processed data to `data/adl/`

### Step 2: Integrate with Existing Data

```bash
# Run the multi-source integrator
python code/multi_source_integrator.py
```

This will:
- Combine NYPD, LAPD, and ADL data
- Remove duplicates using advanced matching
- Apply statistical corrections
- Create comprehensive dataset

### Step 3: Update Website

```bash
# Copy integrated data to website
cp data/integrated/integrated_hate_crimes.csv hate-crime-tracker/public/data/
cd hate-crime-tracker
npm run build
```

## Expected Data Enhancement

### Current System (NYPD + LAPD only):
- **Incidents**: ~2,400
- **Geographic Coverage**: ~15% of US Jewish population  
- **Time Range**: 2019-2024 (5 years)
- **Sources**: 2 police departments

### With ADL Integration:
- **Incidents**: ~10,000-20,000+ (estimated)
- **Geographic Coverage**: National representation
- **Time Range**: Extended historical coverage
- **Sources**: Police departments + verified ADL incidents
- **Antisemitism Focus**: ADL specializes in antisemitic incidents

## Data Quality Improvements

### Enhanced Coverage
- **Verified Incidents**: ADL manually verifies incidents
- **Underreported Areas**: ADL captures incidents police might miss
- **Context & Detail**: Rich incident descriptions and categorizations
- **Geographic Precision**: Detailed location data with coordinates

### Advanced Analytics
- **Cross-Source Validation**: Compare police vs. ADL reporting
- **Incident Verification**: ADL provides verification status
- **Enhanced Categorization**: ADL's specialized bias categorization
- **Event Correlation**: Link incidents to broader hate crime patterns

## Technical Implementation Details

### ADL Data Structure (Expected)
```json
{
  "incidents": [
    {
      "id": "unique_identifier",
      "date": "YYYY-MM-DD",
      "state": "State Name",
      "city": "City Name", 
      "latitude": 40.7128,
      "longitude": -74.0060,
      "bias_motivation": "Antisemitic",
      "incident_type": "Vandalism",
      "description": "Detailed incident description",
      "verified": true,
      "category": "ADL Category"
    }
  ],
  "pagination": {
    "current_page": 0,
    "total_pages": 15,
    "per_page": 50
  }
}
```

### Schema Mapping
| ADL Field | Unified Schema | Notes |
|-----------|----------------|-------|
| `id` | `incident_id` | Prefixed with "ADL_" |
| `date` | `date` | Standardized to MM/DD/YYYY |
| `state` | `state` | Converted to 2-letter codes |
| `city` | `city` | Direct mapping |
| `bias_motivation` | `bias_motivation` | Standardized categories |
| `incident_type` | `offense_type` | ADL terminology |
| `description` | `description` | Rich text descriptions |
| `latitude/longitude` | `latitude/longitude` | Geographic coordinates |

### Deduplication Logic
The integrator uses sophisticated matching to identify duplicates across sources:

1. **Temporal Proximity**: Incidents within 3 days
2. **Geographic Proximity**: Incidents within 2 miles
3. **Description Similarity**: 80%+ text matching
4. **Bias Category Match**: Same motivation type
5. **Location Similarity**: City/county name matching

**Priority System**: ADL verified incidents take priority over police reports when duplicates are found.

## Enhanced Website Features

### New Dashboard Elements
- **Multi-Source Risk Meter**: Incorporates ADL verified incidents
- **Enhanced Geographic Coverage**: National heat map with ADL data
- **Verification Status**: Shows which incidents are ADL verified
- **Source Attribution**: Clear labeling of data sources

### Improved Analytics
- **Cross-Source Correlation**: Compare ADL vs. police reporting patterns
- **Verification Trends**: Track verified vs. unverified incident ratios
- **Enhanced Forecasting**: More comprehensive data improves predictions
- **Event Detection**: Better ability to identify hate crime spikes

### Advanced Visualizations
- **Dual-Source Charts**: Side-by-side ADL vs. police data
- **Verification Heatmap**: Geographic view of verification rates
- **Temporal Patterns**: Enhanced time series with multiple sources
- **Bias Category Breakdown**: ADL's specialized categorizations

## Data Quality Assurance

### Automated Validation
```python
# Quality checks performed automatically
quality_metrics = {
    'completeness': 'Percentage of complete records',
    'accuracy': 'Cross-source validation scores', 
    'timeliness': 'Data freshness indicators',
    'consistency': 'Schema adherence rates'
}
```

### Manual Review Points
- **Geographic Accuracy**: Verify state/city mappings
- **Date Consistency**: Check temporal alignment
- **Bias Categories**: Ensure proper standardization
- **Duplicate Detection**: Review deduplication results

## Troubleshooting

### Common Issues

**API Access Problems**:
```bash
# Check if endpoints are accessible
curl "https://www.adl.org/apps/heatmap/json?page=0"

# If blocked, try different network or contact ADL
```

**Schema Mapping Errors**:
```python
# Check data structure
python -c "
import json
with open('data/adl/adl_page_0.json') as f:
    data = json.load(f)
    print(json.dumps(data, indent=2)[:500])
"
```

**Integration Failures**:
```bash
# Check logs for detailed error messages
tail -f integration.log

# Validate existing data
python -c "
import pandas as pd
df = pd.read_csv('data/unified_hate_crimes_corrected.csv')
print(f'Existing data: {len(df)} incidents')
print(df.columns.tolist())
"
```

## Performance Optimization

### Large Dataset Handling
- **Chunked Processing**: Process ADL data in batches
- **Memory Management**: Efficient pandas operations
- **Index Optimization**: Proper database indexing for queries
- **Caching Strategy**: Cache processed results

### API Rate Limiting
```python
# Respectful API usage
time.sleep(1.0)  # 1 second between requests
session.headers.update({
    'User-Agent': 'Research Project - Hate Crime Tracking'
})
```

## Next Steps After Integration

### 1. Enhanced Forecasting
With ADL data integrated, you can:
- Improve model accuracy with comprehensive coverage
- Develop ADL-specific predictive indicators
- Cross-validate police data against verified incidents
- Implement real-time alert systems

### 2. Research Applications
- **Academic Research**: Publish findings with multi-source validation
- **Policy Analysis**: Provide evidence-based recommendations
- **Community Impact**: Demonstrate comprehensive hate crime patterns
- **Media Reports**: Support journalism with verified data

### 3. System Expansion
- **Additional Sources**: FBI Hate Crime Statistics integration
- **Real-time Updates**: Automated daily/weekly data collection
- **API Development**: Provide clean data API for other researchers
- **Mobile App**: Extend reach with mobile interface

## Success Metrics

### Quantitative Improvements
- **10x+ Data Coverage**: Increase from 2,400 to 20,000+ incidents
- **National Representation**: Coverage beyond NY/CA metropolitan areas
- **Verification Rate**: Percentage of ADL-verified incidents
- **Temporal Coverage**: Extended historical analysis capability

### Qualitative Enhancements
- **Research Credibility**: Multi-source validation improves reliability
- **Community Impact**: Better serve affected communities with comprehensive data
- **Policy Influence**: Provide evidence for hate crime legislation
- **Public Awareness**: Raise awareness with verified, comprehensive reporting

---

**Ready to begin?** Run the ADL data collector script and transform your hate crime tracking system into a comprehensive, nationally representative platform!
