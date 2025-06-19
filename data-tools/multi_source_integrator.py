#!/usr/bin/env python3
"""
Multi-Source Data Integrator
Combines NYPD, LAPD, and ADL data into comprehensive unified dataset
"""

import pandas as pd
import numpy as np
from datetime import datetime
import json
from pathlib import Path
import logging
from typing import List, Dict, Tuple
from fuzzywuzzy import fuzz
import geopy.distance

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MultiSourceIntegrator:
    """Integrates multiple hate crime data sources with advanced deduplication"""
    
    def __init__(self):
        self.data_dir = Path("data")
        self.output_dir = Path("data/integrated")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def load_existing_data(self) -> pd.DataFrame:
        """Load existing NYPD/LAPD unified data"""
        try:
            existing_file = self.data_dir / "unified_hate_crimes_corrected.csv"
            if existing_file.exists():
                df = pd.read_csv(existing_file)
                logger.info(f"Loaded {len(df)} existing incidents from NYPD/LAPD")
                return df
            else:
                logger.warning("No existing unified data found")
                return pd.DataFrame()
        except Exception as e:
            logger.error(f"Error loading existing data: {e}")
            return pd.DataFrame()
    
    def load_adl_data(self) -> pd.DataFrame:
        """Load ADL data if available"""
        try:
            adl_file = self.data_dir / "adl" / "adl_unified.csv"
            if adl_file.exists():
                df = pd.read_csv(adl_file)
                logger.info(f"Loaded {len(df)} ADL incidents")
                return df
            else:
                logger.warning("No ADL data found - run adl_data_collector.py first")
                return pd.DataFrame()
        except Exception as e:
            logger.error(f"Error loading ADL data: {e}")
            return pd.DataFrame()
    
    def load_fbi_data(self) -> pd.DataFrame:
        """Load FBI data if available"""
        try:
            # Look for FBI data files
            fbi_files = list(self.data_dir.glob("fbi/fbi_hate_crimes*.csv"))
            if fbi_files:
                # Use the most recent file
                fbi_file = max(fbi_files, key=lambda x: x.stat().st_mtime)
                df = pd.read_csv(fbi_file)
                logger.info(f"Loaded {len(df)} FBI monthly data points from {fbi_file.name}")
                
                # Transform FBI data to match our schema
                if not df.empty:
                    # Add standard columns for integration
                    df['source'] = 'FBI'
                    df['county'] = ''  # FBI data is state-level
                    df['incident_id'] = df['state'] + '_' + df['month_year'] + '_FBI'
                    df['offense_type'] = 'HATE_CRIME_MONTHLY_TOTAL'
                    df['victim_type'] = 'ALL'
                    df['incidents_corrected'] = df['incident_count']
                    df['city'] = ''
                    df['latitude'] = ''
                    df['longitude'] = ''
                    df['description'] = f"Monthly FBI hate crime total for {df['state_name']}"
                    df['verified'] = 'True'  # FBI data is officially verified
                
                return df
            else:
                logger.warning("No FBI data found - run download_fbi_data.py first")
                return pd.DataFrame()
        except Exception as e:
            logger.error(f"Error loading FBI data: {e}")
            return pd.DataFrame()
    
    def standardize_schemas(self, existing_df: pd.DataFrame, adl_df: pd.DataFrame, fbi_df: pd.DataFrame = None) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Standardize schemas across data sources"""
        
        # Standard unified schema columns
        standard_columns = [
            'date', 'state', 'county', 'bias_motivation', 'source', 
            'incident_id', 'offense_type', 'victim_type', 'incidents_corrected'
        ]
        
        # Extended columns for enhanced functionality
        extended_columns = [
            'city', 'latitude', 'longitude', 'description', 'verified'
        ]
        
        # Ensure existing data has all standard columns
        for col in standard_columns + extended_columns:
            if col not in existing_df.columns:
                existing_df[col] = ''
        
        # Ensure ADL data has all standard columns
        if not adl_df.empty:
            for col in standard_columns + extended_columns:
                if col not in adl_df.columns:
                    adl_df[col] = ''
        
        # Ensure FBI data has all standard columns
        if fbi_df is not None and not fbi_df.empty:
            for col in standard_columns + extended_columns:
                if col not in fbi_df.columns:
                    fbi_df[col] = ''
        
        # Standardize date formats
        existing_df['date'] = pd.to_datetime(existing_df['date'], errors='coerce').dt.strftime('%m/%d/%Y')
        if not adl_df.empty:
            adl_df['date'] = pd.to_datetime(adl_df['date'], errors='coerce').dt.strftime('%m/%d/%Y')
        if fbi_df is not None and not fbi_df.empty:
            fbi_df['date'] = pd.to_datetime(fbi_df['date'], errors='coerce').dt.strftime('%m/%d/%Y')
        
        # Standardize bias motivations
        existing_df['bias_motivation_cleaned'] = existing_df['bias_motivation'].apply(self.clean_bias_motivation)
        if not adl_df.empty:
            adl_df['bias_motivation_cleaned'] = adl_df['bias_motivation'].apply(self.clean_bias_motivation)
        if fbi_df is not None and not fbi_df.empty:
            fbi_df['bias_motivation_cleaned'] = fbi_df['bias_motivation'].apply(self.clean_bias_motivation)
        
        return existing_df, adl_df, fbi_df if fbi_df is not None else pd.DataFrame()
    
    def clean_bias_motivation(self, bias: str) -> str:
        """Clean and standardize bias motivation categories"""
        if pd.isna(bias) or bias == '':
            return 'UNKNOWN'
        
        bias_str = str(bias).upper().strip()
        
        # Standard mappings
        if any(term in bias_str for term in ['JEWISH', 'JUDAISM', 'ANTISEMIT', 'ANTI-SEMIT']):
            return 'ANTI-JEWISH'
        elif any(term in bias_str for term in ['MUSLIM', 'ISLAM', 'ISLAMIC']):
            return 'ANTI-ISLAMIC'
        elif any(term in bias_str for term in ['BLACK', 'AFRICAN']):
            return 'ANTI-BLACK'
        elif any(term in bias_str for term in ['HISPANIC', 'LATINO']):
            return 'ANTI-HISPANIC'
        elif any(term in bias_str for term in ['ASIAN', 'PACIFIC']):
            return 'ANTI-ASIAN'
        elif any(term in bias_str for term in ['WHITE', 'CAUCASIAN']):
            return 'ANTI-WHITE'
        elif any(term in bias_str for term in ['GAY', 'LESBIAN', 'LGBTQ', 'TRANSGENDER', 'BISEXUAL']):
            return 'ANTI-LGBTQ'
        elif any(term in bias_str for term in ['CATHOLIC', 'CHRISTIAN', 'PROTESTANT']):
            return 'ANTI-CHRISTIAN'
        else:
            return bias_str
    
    def advanced_deduplication(self, df: pd.DataFrame) -> pd.DataFrame:
        """Advanced deduplication across multiple sources"""
        logger.info("Starting advanced deduplication process")
        
        duplicates_to_remove = set()
        total_comparisons = 0
        
        # Sort by date for more efficient processing
        df_sorted = df.sort_values('date').reset_index(drop=True)
        
        for i in range(len(df_sorted)):
            if i in duplicates_to_remove:
                continue
                
            incident_a = df_sorted.iloc[i]
            
            # Only compare with incidents within 30 days
            incident_date = pd.to_datetime(incident_a['date'], errors='coerce')
            if pd.isna(incident_date):
                continue
            
            # Look ahead for potential duplicates
            for j in range(i + 1, len(df_sorted)):
                if j in duplicates_to_remove:
                    continue
                    
                incident_b = df_sorted.iloc[j]
                compare_date = pd.to_datetime(incident_b['date'], errors='coerce')
                
                if pd.isna(compare_date):
                    continue
                
                # Stop if we're beyond 30 days
                if (compare_date - incident_date).days > 30:
                    break
                
                total_comparisons += 1
                
                if self.is_duplicate(incident_a, incident_b):
                    # Prefer ADL data over police data for verified incidents
                    if incident_a['source'] == 'ADL' and incident_b['source'] in ['NYPD', 'LAPD']:
                        duplicates_to_remove.add(j)
                    elif incident_b['source'] == 'ADL' and incident_a['source'] in ['NYPD', 'LAPD']:
                        duplicates_to_remove.add(i)
                        break  # Current incident marked for removal
                    else:
                        # Both same source type, remove the one with less information
                        if len(str(incident_a.get('description', ''))) >= len(str(incident_b.get('description', ''))):
                            duplicates_to_remove.add(j)
                        else:
                            duplicates_to_remove.add(i)
                            break
        
        # Remove duplicates
        df_deduplicated = df_sorted.drop(duplicates_to_remove).reset_index(drop=True)
        
        logger.info(f"Deduplication complete:")
        logger.info(f"  Total comparisons: {total_comparisons}")
        logger.info(f"  Duplicates removed: {len(duplicates_to_remove)}")
        logger.info(f"  Original incidents: {len(df)}")
        logger.info(f"  Final incidents: {len(df_deduplicated)}")
        
        return df_deduplicated
    
    def is_duplicate(self, incident_a: pd.Series, incident_b: pd.Series) -> bool:
        """Determine if two incidents are duplicates using multiple criteria"""
        
        # Different sources can have duplicates
        if incident_a['source'] == incident_b['source']:
            # Same source - check incident IDs
            if (incident_a['incident_id'] and incident_b['incident_id'] and 
                incident_a['incident_id'] == incident_b['incident_id']):
                return True
        
        # Time proximity check (within 3 days)
        try:
            date_a = pd.to_datetime(incident_a['date'])
            date_b = pd.to_datetime(incident_b['date'])
            if abs((date_a - date_b).days) > 3:
                return False
        except:
            return False
        
        # Geographic proximity check (if coordinates available)
        try:
            lat_a, lon_a = float(incident_a.get('latitude', 0)), float(incident_a.get('longitude', 0))
            lat_b, lon_b = float(incident_b.get('latitude', 0)), float(incident_b.get('longitude', 0))
            
            if lat_a and lon_a and lat_b and lon_b:
                distance = geopy.distance.geodesic((lat_a, lon_a), (lat_b, lon_b)).miles
                if distance > 2.0:  # More than 2 miles apart
                    return False
        except:
            pass
        
        # State/county check
        if (incident_a.get('state') and incident_b.get('state') and 
            incident_a['state'] != incident_b['state']):
            return False
        
        # Bias motivation check
        if (incident_a.get('bias_motivation_cleaned') and incident_b.get('bias_motivation_cleaned') and
            incident_a['bias_motivation_cleaned'] != incident_b['bias_motivation_cleaned']):
            return False
        
        # Description similarity check (if available)
        desc_a = str(incident_a.get('description', ''))
        desc_b = str(incident_b.get('description', ''))
        
        if len(desc_a) > 20 and len(desc_b) > 20:
            similarity = fuzz.ratio(desc_a.lower(), desc_b.lower())
            if similarity > 80:
                return True
        
        # Location name similarity
        location_a = f"{incident_a.get('city', '')} {incident_a.get('county', '')}"
        location_b = f"{incident_b.get('city', '')} {incident_b.get('county', '')}"
        
        if len(location_a.strip()) > 5 and len(location_b.strip()) > 5:
            location_similarity = fuzz.ratio(location_a.lower(), location_b.lower())
            if location_similarity > 85:
                return True
        
        return False
    
    def generate_integration_report(self, original_df: pd.DataFrame, adl_df: pd.DataFrame, 
                                  final_df: pd.DataFrame, fbi_df: pd.DataFrame = None) -> Dict:
        """Generate comprehensive integration report"""
        
        fbi_len = len(fbi_df) if fbi_df is not None and not fbi_df.empty else 0
        
        report = {
            'integration_timestamp': datetime.now().isoformat(),
            'source_statistics': {
                'existing_incidents': len(original_df),
                'adl_incidents': len(adl_df),
                'fbi_incidents': fbi_len,
                'total_before_dedup': len(original_df) + len(adl_df) + fbi_len,
                'final_incidents': len(final_df),
                'duplicates_removed': len(original_df) + len(adl_df) + fbi_len - len(final_df)
            },
            'bias_motivation_breakdown': {},
            'temporal_coverage': {},
            'geographic_coverage': {},
            'data_quality_metrics': {}
        }
        
        # Bias motivation breakdown
        for source in ['NYPD', 'LAPD', 'ADL', 'FBI', 'Total']:
            if source == 'Total':
                subset = final_df
            else:
                subset = final_df[final_df['source'] == source]
            
            bias_counts = subset['bias_motivation_cleaned'].value_counts().to_dict()
            report['bias_motivation_breakdown'][source] = bias_counts
        
        # Temporal coverage
        final_df['year'] = pd.to_datetime(final_df['date'], errors='coerce').dt.year
        yearly_counts = final_df['year'].value_counts().sort_index().to_dict()
        report['temporal_coverage'] = {str(k): v for k, v in yearly_counts.items() if not pd.isna(k)}
        
        # Geographic coverage
        state_counts = final_df['state'].value_counts().to_dict()
        report['geographic_coverage'] = state_counts
        
        # Data quality metrics
        report['data_quality_metrics'] = {
            'incidents_with_coordinates': len(final_df[final_df['latitude'].notna() & final_df['longitude'].notna()]),
            'incidents_with_descriptions': len(final_df[final_df['description'].str.len() > 10]),
            'verified_incidents': len(final_df[final_df.get('verified', False) == True]),
            'antisemitic_incidents': len(final_df[final_df['bias_motivation_cleaned'] == 'ANTI-JEWISH']),
            'completeness_score': (final_df.notna().sum().sum() / (len(final_df) * len(final_df.columns))) * 100
        }
        
        return report
    
    def integrate_all_sources(self) -> Tuple[pd.DataFrame, Dict]:
        """Main integration function"""
        logger.info("Starting multi-source data integration")
        
        # Load data
        existing_df = self.load_existing_data()
        adl_df = self.load_adl_data()
        fbi_df = self.load_fbi_data()
        
        if existing_df.empty and adl_df.empty and fbi_df.empty:
            raise ValueError("No data sources available for integration")
        
        # Standardize schemas
        existing_df, adl_df, fbi_df = self.standardize_schemas(existing_df, adl_df, fbi_df)
        
        # Combine data
        dataframes_to_combine = [df for df in [existing_df, adl_df, fbi_df] if not df.empty]
        
        if len(dataframes_to_combine) > 1:
            combined_df = pd.concat(dataframes_to_combine, ignore_index=True)
            logger.info(f"Combined {len(existing_df)} existing + {len(adl_df)} ADL + {len(fbi_df)} FBI = {len(combined_df)} total incidents")
        elif len(dataframes_to_combine) == 1:
            combined_df = dataframes_to_combine[0]
            logger.info(f"Using single data source with {len(combined_df)} incidents")
        else:
            raise ValueError("No valid data to integrate")
        
        # Advanced deduplication
        final_df = self.advanced_deduplication(combined_df)
        
        # Generate integration report
        report = self.generate_integration_report(existing_df, adl_df, final_df, fbi_df)
        
        # Save integrated data
        output_file = self.output_dir / "integrated_hate_crimes.csv"
        final_df.to_csv(output_file, index=False, encoding='utf-8')
        
        # Save report
        report_file = self.output_dir / "integration_report.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Integration complete: {len(final_df)} incidents saved to {output_file}")
        
        return final_df, report

def main():
    """Main function to run integration"""
    integrator = MultiSourceIntegrator()
    
    print("Multi-Source Hate Crime Data Integrator")
    print("=====================================")
    
    try:
        final_df, report = integrator.integrate_all_sources()
        
        print(f"\n✅ Integration Complete!")
        print(f"📊 Final dataset: {len(final_df)} incidents")
        print(f"🔍 Duplicates removed: {report['source_statistics']['duplicates_removed']}")
        print(f"📅 Date range: {final_df['date'].min()} to {final_df['date'].max()}")
        
        print(f"\n📋 Source breakdown:")
        source_counts = final_df['source'].value_counts()
        for source, count in source_counts.items():
            print(f"   {source}: {count} incidents")
        
        print(f"\n🎯 Antisemitic incidents: {report['data_quality_metrics']['antisemitic_incidents']}")
        print(f"📍 Incidents with coordinates: {report['data_quality_metrics']['incidents_with_coordinates']}")
        print(f"✅ Data completeness: {report['data_quality_metrics']['completeness_score']:.1f}%")
        
        print(f"\n📁 Files created:")
        print(f"   - data/integrated/integrated_hate_crimes.csv")
        print(f"   - data/integrated/integration_report.json")
        
    except Exception as e:
        logger.error(f"Error in integration: {e}")
        raise

if __name__ == "__main__":
    main()
