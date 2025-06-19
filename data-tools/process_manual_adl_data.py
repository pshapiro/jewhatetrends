#!/usr/bin/env python3
"""
Process Manually Collected ADL Data
Processes ADL data that was manually collected via curl commands
"""

import json
import pandas as pd
import glob
from pathlib import Path
from datetime import datetime
import logging
import re

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ManualADLProcessor:
    """Process manually collected ADL data files"""
    
    def __init__(self):
        self.data_dir = Path("data/adl")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def combine_json_files(self) -> list:
        """Combine all manually collected JSON files"""
        all_incidents = []
        page_files = []
        
        # Find all ADL page files
        for pattern in ["adl_page_*.json", "adl_test_response.json", "manual_page_*.json"]:
            page_files.extend(glob.glob(str(self.data_dir / pattern)))
        
        if not page_files:
            logger.warning("No ADL JSON files found. Please collect data first.")
            return []
        
        logger.info(f"Found {len(page_files)} ADL data files")
        
        for json_file in sorted(page_files):
            try:
                logger.info(f"Processing {json_file}")
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Handle different response formats
                incidents = self.extract_incidents(data)
                if incidents:
                    all_incidents.extend(incidents)
                    logger.info(f"  Added {len(incidents)} incidents")
                else:
                    logger.warning(f"  No incidents found in {json_file}")
                    
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing {json_file}: {e}")
            except Exception as e:
                logger.error(f"Error processing {json_file}: {e}")
        
        logger.info(f"Total incidents collected: {len(all_incidents)}")
        
        # Save combined data
        if all_incidents:
            with open(self.data_dir / "adl_all_incidents.json", 'w', encoding='utf-8') as f:
                json.dump(all_incidents, f, indent=2, ensure_ascii=False)
        
        return all_incidents
    
    def extract_incidents(self, data) -> list:
        """Extract incidents from various data formats"""
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            # Try different possible keys
            for key in ['incidents', 'data', 'results', 'items']:
                if key in data and isinstance(data[key], list):
                    return data[key]
            
            # If it's a single incident object
            if any(field in data for field in ['id', 'date', 'incident_id', 'type', 'category']):
                return [data]
        
        return []
    
    def analyze_data_structure(self, incidents: list) -> dict:
        """Analyze the structure of collected ADL data"""
        if not incidents:
            return {"error": "No incidents to analyze"}
        
        # Sample incident for structure analysis
        sample = incidents[0]
        logger.info("Sample ADL incident:")
        logger.info(json.dumps(sample, indent=2)[:500] + "...")
        
        # Field analysis
        field_stats = {}
        for incident in incidents[:100]:  # Analyze first 100
            for key, value in incident.items():
                if key not in field_stats:
                    field_stats[key] = {
                        'type': type(value).__name__,
                        'sample_values': set(),
                        'null_count': 0,
                        'present_count': 0
                    }
                
                field_stats[key]['present_count'] += 1
                
                if value is None or value == '':
                    field_stats[key]['null_count'] += 1
                else:
                    # Add sample value (truncated)
                    sample_val = str(value)[:50]
                    field_stats[key]['sample_values'].add(sample_val)
                    
                    # Limit sample values
                    if len(field_stats[key]['sample_values']) > 5:
                        field_stats[key]['sample_values'] = set(list(field_stats[key]['sample_values'])[:5])
        
        # Convert sets to lists for JSON serialization
        for field_info in field_stats.values():
            field_info['sample_values'] = list(field_info['sample_values'])
        
        analysis = {
            'total_incidents': len(incidents),
            'sample_incident': sample,
            'field_analysis': field_stats,
            'analysis_timestamp': datetime.now().isoformat()
        }
        
        # Save analysis
        with open(self.data_dir / "adl_data_analysis.json", 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, ensure_ascii=False)
        
        return analysis
    
    def convert_to_unified_schema(self, incidents: list) -> pd.DataFrame:
        """Convert ADL incidents to unified schema"""
        unified_data = []
        
        logger.info(f"Converting {len(incidents)} incidents to unified schema")
        
        for i, incident in enumerate(incidents):
            try:
                unified_incident = {
                    'date': self.parse_date(incident),
                    'state': self.parse_state(incident),
                    'county': self.get_field(incident, ['county', 'County']),
                    'city': self.get_field(incident, ['city', 'City', 'location_city']),
                    'bias_motivation': self.standardize_bias_motivation(incident),
                    'source': 'ADL',
                    'incident_id': self.get_field(incident, ['id', 'incident_id', 'ID']) or f"ADL_{i}",
                    'offense_type': self.get_field(incident, ['type', 'incident_type', 'Type', 'offense_type']),
                    'victim_type': self.get_field(incident, ['victim_type', 'Victim_Type', 'target']),
                    'description': self.get_field(incident, ['description', 'Description', 'summary', 'details']),
                    'latitude': self.safe_float(self.get_field(incident, ['latitude', 'lat', 'Latitude'])),
                    'longitude': self.safe_float(self.get_field(incident, ['longitude', 'lng', 'Longitude'])),
                    'verified': self.get_field(incident, ['verified', 'Verified'], default=True),
                    'adl_category': self.get_field(incident, ['category', 'Category', 'bias_type']),
                    'raw_data': json.dumps(incident)
                }
                
                # Apply NCVS correction for antisemitic incidents
                bias = unified_incident['bias_motivation']
                if bias and ('JEWISH' in bias.upper() or 'ANTISEMIT' in bias.upper()):
                    unified_incident['incidents_corrected'] = 1.45
                else:
                    unified_incident['incidents_corrected'] = 1.0
                
                # Clean up empty strings
                for key, value in unified_incident.items():
                    if value == '':
                        unified_incident[key] = None
                
                unified_data.append(unified_incident)
                
            except Exception as e:
                logger.warning(f"Error processing incident {i}: {e}")
                continue
        
        df = pd.DataFrame(unified_data)
        
        # Remove rows with no useful data
        essential_fields = ['date', 'state', 'bias_motivation']
        df = df.dropna(subset=essential_fields, how='all')
        
        # Save unified data
        df.to_csv(self.data_dir / "adl_unified.csv", index=False, encoding='utf-8')
        
        logger.info(f"Successfully converted {len(df)} incidents to unified schema")
        return df
    
    def get_field(self, incident: dict, field_names: list, default='') -> str:
        """Get field value trying multiple possible field names"""
        for field_name in field_names:
            if field_name in incident and incident[field_name] is not None:
                return str(incident[field_name]).strip()
        return default
    
    def safe_float(self, value) -> float:
        """Safely convert to float"""
        if not value:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def parse_date(self, incident: dict) -> str:
        """Parse date from incident data"""
        date_fields = ['date', 'incident_date', 'Date', 'created_date', 'timestamp']
        
        for field in date_fields:
            if field in incident and incident[field]:
                try:
                    date_str = str(incident[field])
                    
                    # Try different date formats
                    for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%S.%fZ']:
                        try:
                            dt = datetime.strptime(date_str[:19], fmt)
                            return dt.strftime('%m/%d/%Y')
                        except ValueError:
                            continue
                    
                    # Try pandas parsing as last resort
                    dt = pd.to_datetime(date_str, errors='coerce')
                    if not pd.isna(dt):
                        return dt.strftime('%m/%d/%Y')
                        
                except Exception:
                    continue
        
        return ''
    
    def parse_state(self, incident: dict) -> str:
        """Parse state from incident data"""
        state_fields = ['state', 'State', 'location_state', 'region']
        
        for field in state_fields:
            if field in incident and incident[field]:
                state_val = str(incident[field]).strip()
                return self.normalize_state(state_val)
        
        # Try to extract from full location string
        location_fields = ['location', 'Location', 'address', 'full_location']
        for field in location_fields:
            if field in incident and incident[field]:
                return self.extract_state_from_location(str(incident[field]))
        
        return ''
    
    def normalize_state(self, state_str: str) -> str:
        """Normalize state name to abbreviation"""
        state_mapping = {
            'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
            'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
            'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
            'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
            'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
            'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
            'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
            'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
            'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
            'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
            'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
            'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
            'wisconsin': 'WI', 'wyoming': 'WY'
        }
        
        state_lower = state_str.lower().strip()
        
        # Direct mapping
        if state_lower in state_mapping:
            return state_mapping[state_lower]
        
        # Already an abbreviation?
        if len(state_str) == 2 and state_str.upper() in state_mapping.values():
            return state_str.upper()
        
        return state_str.upper()[:2] if state_str else ''
    
    def extract_state_from_location(self, location_str: str) -> str:
        """Extract state from full location string"""
        # Look for state patterns in location string
        state_pattern = r'\b([A-Z]{2})\b'
        matches = re.findall(state_pattern, location_str)
        
        if matches:
            return matches[-1]  # Take the last match (likely the state)
        
        return self.normalize_state(location_str.split(',')[-1].strip() if ',' in location_str else '')
    
    def standardize_bias_motivation(self, incident: dict) -> str:
        """Standardize bias motivation field"""
        bias_fields = ['bias_motivation', 'category', 'Category', 'type', 'bias_type', 'incident_type']
        
        for field in bias_fields:
            if field in incident and incident[field]:
                bias_str = str(incident[field]).lower().strip()
                
                # Map to standard categories
                if any(term in bias_str for term in ['jewish', 'antisemit', 'anti-semit', 'judaism']):
                    return 'ANTI-JEWISH'
                elif any(term in bias_str for term in ['muslim', 'islam', 'islamic']):
                    return 'ANTI-ISLAMIC'
                elif any(term in bias_str for term in ['black', 'african']):
                    return 'ANTI-BLACK'
                elif any(term in bias_str for term in ['hispanic', 'latino']):
                    return 'ANTI-HISPANIC'
                elif any(term in bias_str for term in ['asian', 'pacific']):
                    return 'ANTI-ASIAN'
                elif any(term in bias_str for term in ['white', 'caucasian']):
                    return 'ANTI-WHITE'
                elif any(term in bias_str for term in ['gay', 'lesbian', 'lgbtq', 'transgender']):
                    return 'ANTI-LGBTQ'
                else:
                    return str(incident[field]).upper()
        
        return ''

def main():
    """Main processing function"""
    processor = ManualADLProcessor()
    
    print("Manual ADL Data Processor")
    print("========================")
    
    try:
        # Combine JSON files
        incidents = processor.combine_json_files()
        
        if not incidents:
            print("❌ No ADL incidents found.")
            print("\nTo collect ADL data manually:")
            print("1. Use your working curl command to save pages:")
            print("   curl 'https://www.adl.org/apps/heatmap/json?page=0' [your_params] > data/adl/adl_page_0.json")
            print("2. Repeat for multiple pages")
            print("3. Run this script again")
            return
        
        print(f"✅ Found {len(incidents)} total incidents")
        
        # Analyze structure
        analysis = processor.analyze_data_structure(incidents)
        print(f"📊 Data structure analyzed")
        print(f"   Fields found: {len(analysis['field_analysis'])}")
        
        # Convert to unified schema
        unified_df = processor.convert_to_unified_schema(incidents)
        print(f"🔄 Converted to unified schema: {len(unified_df)} incidents")
        
        # Show antisemitic incidents
        antisemitic = unified_df[unified_df['bias_motivation'] == 'ANTI-JEWISH']
        print(f"🎯 Antisemitic incidents: {len(antisemitic)}")
        
        # Show geographic distribution
        state_counts = unified_df['state'].value_counts().head()
        print(f"🗺️  Top states: {dict(state_counts)}")
        
        print(f"\n📁 Files created:")
        print(f"   - data/adl/adl_all_incidents.json")
        print(f"   - data/adl/adl_data_analysis.json")
        print(f"   - data/adl/adl_unified.csv")
        
        print(f"\n🚀 Next steps:")
        print(f"   1. python code/multi_source_integrator.py")
        print(f"   2. python code/enhanced_website_updater.py")
        
    except Exception as e:
        logger.error(f"Error in processing: {e}")
        raise

if __name__ == "__main__":
    main()
