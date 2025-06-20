#!/usr/bin/env python3
"""
Enhanced Geographic Data Processor
Adds proper coordinates and location names for comprehensive mapping
"""

import pandas as pd
import json
from pathlib import Path

def enhance_geographic_data():
    """Enhance the integrated dataset with proper geographic information"""
    
    print("🗺️ Enhanced Geographic Data Processor")
    print("=" * 50)
    
    # Load current dataset
    df = pd.read_csv('data/integrated/integrated_hate_crimes.csv')
    print(f"📊 Processing {len(df):,} incidents")
    
    # Create enhanced copy
    enhanced_df = df.copy()

    # Ensure location columns use object dtype so string assignment works cleanly
    for col in ['city', 'county', 'state']:
        if col in enhanced_df.columns:
            enhanced_df[col] = enhanced_df[col].astype('object')
    
    # 1. Fix Los Angeles identification
    print("\n🌴 Processing Los Angeles data...")
    
    # LAPD divisions to Los Angeles mapping
    lapd_divisions = [
        'Central', 'Olympic', 'Wilshire', 'Northeast', 'Rampart', 'Hollywood',
        'Van Nuys', 'West LA', 'Southwest', 'West Valley', 'Pacific', 'Mission',
        'Foothill', 'Devonshire', 'North Hollywood', 'Southeast', 'Harbor',
        'Newton', 'Hollenbeck', '77th Street', 'Topanga'
    ]
    
    # Update LAPD records to show Los Angeles
    lapd_mask = enhanced_df['source'] == 'LAPD'
    enhanced_df.loc[lapd_mask, 'city'] = 'Los Angeles'
    enhanced_df.loc[lapd_mask, 'county'] = 'Los Angeles County'
    enhanced_df.loc[lapd_mask, 'state'] = 'CA'
    
    # Add coordinates for LAPD data (Los Angeles center)
    la_lat, la_lon = 34.0522, -118.2437
    lapd_no_coords = lapd_mask & (enhanced_df['latitude'].isna())
    enhanced_df.loc[lapd_no_coords, 'latitude'] = la_lat
    enhanced_df.loc[lapd_no_coords, 'longitude'] = la_lon
    
    print(f"   ✅ Enhanced {lapd_no_coords.sum():,} LAPD records with LA coordinates")
    
    # 2. Fix NYPD borough mapping
    print("\n🗽 Processing New York data...")
    
    # NYC boroughs mapping
    nyc_boroughs = {
        'NEW YORK': 'Manhattan',
        'KINGS': 'Brooklyn', 
        'QUEENS': 'Queens',
        'BRONX': 'Bronx',
        'RICHMOND': 'Staten Island'
    }
    
    # NYC borough coordinates (centers)
    borough_coords = {
        'Manhattan': (40.7831, -73.9712),
        'Brooklyn': (40.6782, -73.9442),
        'Queens': (40.7282, -73.7949),
        'Bronx': (40.8448, -73.8648),
        'Staten Island': (40.5795, -74.1502)
    }
    
    nypd_mask = enhanced_df['source'] == 'NYPD'
    enhanced_df.loc[nypd_mask, 'city'] = 'New York'
    enhanced_df.loc[nypd_mask, 'state'] = 'NY'
    
    # Add borough names and coordinates
    for county_code, borough_name in nyc_boroughs.items():
        borough_mask = nypd_mask & (enhanced_df['county'] == county_code)
        if borough_mask.any():
            enhanced_df.loc[borough_mask, 'borough'] = borough_name
            coords = borough_coords.get(borough_name)
            if coords:
                enhanced_df.loc[borough_mask, 'latitude'] = coords[0]
                enhanced_df.loc[borough_mask, 'longitude'] = coords[1]
    
    nypd_coords_added = nypd_mask & enhanced_df['latitude'].notna()
    print(f"   ✅ Enhanced {nypd_coords_added.sum():,} NYPD records with NYC coordinates")
    
    # 3. Analyze final geographic coverage
    print("\n📍 Final Geographic Analysis:")
    
    # Coordinates coverage
    total_with_coords = enhanced_df[['latitude', 'longitude']].dropna()
    print(f"   Incidents with coordinates: {len(total_with_coords):,} / {len(enhanced_df):,} ({len(total_with_coords)/len(enhanced_df)*100:.1f}%)")
    
    # Major cities
    major_cities = enhanced_df['city'].value_counts()
    print(f"\n🏙️ Major Cities:")
    for city, count in major_cities.head(10).items():
        if pd.notna(city):
            city_data = enhanced_df[enhanced_df['city'] == city]
            city_coords = city_data[['latitude', 'longitude']].dropna()
            print(f"   {city}: {count:,} incidents ({len(city_coords):,} with coordinates)")
    
    # State coverage
    state_coverage = enhanced_df['state'].value_counts()
    print(f"\n🏛️ State Coverage:")
    for state, count in state_coverage.items():
        if pd.notna(state):
            print(f"   {state}: {count:,} incidents")
    
    # 4. Create geographic summary for map
    geographic_summary = []
    
    # Group by city/state for mapping
    city_groups = enhanced_df.groupby(['city', 'state']).agg({
        'latitude': 'first',
        'longitude': 'first',
        'date': 'count'
    }).reset_index()
    
    city_groups = city_groups.dropna(subset=['city', 'latitude', 'longitude'])
    city_groups.columns = ['city', 'state', 'latitude', 'longitude', 'incident_count']
    
    # Sort by incident count
    city_groups = city_groups.sort_values('incident_count', ascending=False)
    
    print(f"\n🎯 Top Cities for Mapping:")
    for _, row in city_groups.head(15).iterrows():
        print(f"   {row['city']}, {row['state']}: {row['incident_count']:,} incidents @ ({row['latitude']:.4f}, {row['longitude']:.4f})")
    
    # 5. Save enhanced data
    output_file = 'data/integrated/integrated_hate_crimes_enhanced.csv'
    enhanced_df.to_csv(output_file, index=False)
    print(f"\n💾 Enhanced dataset saved to: {output_file}")
    
    # Save geographic summary for mapping
    map_data_file = 'data/integrated/map_data.json'
    map_data = {
        'city_data': city_groups.to_dict('records'),
        'summary': {
            'total_incidents': len(enhanced_df),
            'incidents_with_coords': len(total_with_coords),
            'cities_mapped': len(city_groups),
            'states_covered': enhanced_df['state'].nunique()
        }
    }
    
    with open(map_data_file, 'w') as f:
        json.dump(map_data, f, indent=2)
    print(f"💾 Map data saved to: {map_data_file}")
    
    return enhanced_df, city_groups

if __name__ == "__main__":
    enhanced_df, city_groups = enhance_geographic_data()
    
    print(f"\n🎉 Geographic Enhancement Complete!")
    print(f"   Enhanced {len(enhanced_df):,} total incidents")
    print(f"   {len(city_groups):,} cities ready for mapping")
    print(f"   Includes Los Angeles, New York, and {enhanced_df['state'].nunique() - 2} other states")