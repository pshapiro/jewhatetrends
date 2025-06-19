#!/usr/bin/env python3
"""
FBI Crime Data Explorer (CDE) Data Collector
Collects hate crime data from the official FBI CDE API for all states
"""

import requests
import json
import pandas as pd
import time
from pathlib import Path
from datetime import datetime, timedelta
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FBIDataCollector:
    """Collects hate crime data from FBI Crime Data Explorer API"""
    
    def __init__(self):
        self.base_url = "https://cde.ucr.cjis.gov/LATEST/hate-crime/state"
        self.output_dir = Path("data/fbi")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # US State codes
        self.state_codes = [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
        ]
        
        # State name mapping
        self.state_names = {
            'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
            'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
            'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
            'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
            'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
            'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
            'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
            'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
            'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
            'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
            'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
            'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
            'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
        }
    
    def collect_state_data(self, state_code, from_date="01-2022", to_date="12-2023", data_type="counts"):
        """Collect data for a specific state"""
        
        url = f"{self.base_url}/{state_code}/?from={from_date}&to={to_date}&type={data_type}"
        
        try:
            logger.info(f"Collecting {state_code} data from {from_date} to {to_date}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Save raw response
                state_file = self.output_dir / f"fbi_{state_code}_{from_date.replace('-', '')}_{to_date.replace('-', '')}.json"
                with open(state_file, 'w') as f:
                    json.dump(data, f, indent=2)
                
                # Extract incident data
                incidents_data = self.extract_incidents(data, state_code)
                
                logger.info(f"✅ {state_code}: {len(incidents_data)} monthly data points")
                return incidents_data
                
            else:
                logger.warning(f"❌ {state_code}: HTTP {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"❌ {state_code}: {e}")
            return []
    
    def extract_incidents(self, data, state_code):
        """Extract incident data from FBI API response"""
        
        incidents = []
        
        if 'actuals' in data and f'{self.state_names[state_code]} Incidents' in data['actuals']:
            monthly_data = data['actuals'][f'{self.state_names[state_code]} Incidents']
            
            for month_year, count in monthly_data.items():
                try:
                    # Parse date (format: MM-YYYY)
                    month, year = month_year.split('-')
                    date_str = f"{month}/01/{year}"
                    
                    incident = {
                        'date': date_str,
                        'month_year': month_year,
                        'state': state_code,
                        'state_name': self.state_names[state_code],
                        'incident_count': int(count) if count else 0,
                        'source': 'FBI',
                        'data_type': 'monthly_total',
                        'bias_motivation': 'ALL_HATE_CRIMES',  # FBI endpoint gives all hate crimes
                        'collection_date': datetime.now().isoformat()
                    }
                    
                    incidents.append(incident)
                    
                except Exception as e:
                    logger.warning(f"Error parsing {month_year} for {state_code}: {e}")
        
        return incidents
    
    def collect_all_states(self, from_date="01-2022", to_date="12-2023"):
        """Collect data for all states"""
        
        logger.info(f"🇺🇸 Starting FBI data collection for all states ({from_date} to {to_date})")
        
        all_incidents = []
        successful_states = []
        failed_states = []
        
        for i, state_code in enumerate(self.state_codes):
            try:
                incidents = self.collect_state_data(state_code, from_date, to_date)
                
                if incidents:
                    all_incidents.extend(incidents)
                    successful_states.append(state_code)
                else:
                    failed_states.append(state_code)
                
                # Be respectful to the API
                time.sleep(0.5)
                
                # Progress update
                if (i + 1) % 10 == 0:
                    logger.info(f"Progress: {i + 1}/{len(self.state_codes)} states processed")
                    
            except Exception as e:
                logger.error(f"Failed to process {state_code}: {e}")
                failed_states.append(state_code)
        
        # Save combined data
        if all_incidents:
            # Convert to DataFrame and save
            df = pd.DataFrame(all_incidents)
            
            # Save as CSV
            csv_file = self.output_dir / f"fbi_hate_crimes_{from_date.replace('-', '')}_{to_date.replace('-', '')}.csv"
            df.to_csv(csv_file, index=False)
            
            # Save summary
            summary = {
                'collection_timestamp': datetime.now().isoformat(),
                'date_range': f"{from_date} to {to_date}",
                'total_incidents': len(all_incidents),
                'successful_states': len(successful_states),
                'failed_states': len(failed_states),
                'successful_state_codes': successful_states,
                'failed_state_codes': failed_states,
                'monthly_data_points': len(all_incidents),
                'states_covered': len(successful_states)
            }
            
            summary_file = self.output_dir / "fbi_collection_summary.json"
            with open(summary_file, 'w') as f:
                json.dump(summary, f, indent=2)
            
            logger.info(f"🎉 FBI Collection Complete!")
            logger.info(f"   ✅ {len(successful_states)} states successful")
            logger.info(f"   ❌ {len(failed_states)} states failed")
            logger.info(f"   📊 {len(all_incidents)} total monthly data points")
            logger.info(f"   💾 Saved to: {csv_file}")
            
            return df
        else:
            logger.error("❌ No data collected from any state")
            return None
    
    def get_latest_data_info(self):
        """Check what's the latest available data"""
        
        # Test with NY to see latest available data
        try:
            url = f"{self.base_url}/NY/?from=01-2023&to=12-2023&type=counts"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'cde_properties' in data:
                    max_date = data['cde_properties'].get('max_data_date', {}).get('UCR', 'Unknown')
                    last_refresh = data['cde_properties'].get('last_refresh_date', {}).get('UCR', 'Unknown')
                    
                    logger.info(f"📅 FBI Data Availability:")
                    logger.info(f"   Latest data: {max_date}")
                    logger.info(f"   Last refresh: {last_refresh}")
                    
                    return max_date, last_refresh
        except Exception as e:
            logger.warning(f"Could not check latest data info: {e}")
        
        return None, None

def main():
    """Main collection function"""
    
    print("🏛️ FBI Crime Data Explorer Collector")
    print("=" * 40)
    
    collector = FBIDataCollector()
    
    # Check latest data availability
    max_date, last_refresh = collector.get_latest_data_info()
    
    # Collect data
    # Default: collect 2022-2023 data (adjust based on availability)
    df = collector.collect_all_states(from_date="01-2022", to_date="12-2023")
    
    if df is not None:
        print(f"\n📊 Collection Summary:")
        print(f"   Total monthly data points: {len(df):,}")
        print(f"   States covered: {df['state'].nunique()}")
        print(f"   Date range: {df['month_year'].min()} to {df['month_year'].max()}")
        print(f"   Total incidents: {df['incident_count'].sum():,}")
        
        # Show top states by incidents
        top_states = df.groupby('state_name')['incident_count'].sum().sort_values(ascending=False).head(10)
        print(f"\n🔝 Top 10 States by Total Incidents:")
        for state, count in top_states.items():
            print(f"   {state}: {count:,} incidents")
        
        print(f"\n✅ FBI data ready for integration!")
        print(f"💡 Next: Run multi_source_integrator.py to combine with other sources")
        
    else:
        print("❌ FBI data collection failed")

if __name__ == "__main__":
    main()
