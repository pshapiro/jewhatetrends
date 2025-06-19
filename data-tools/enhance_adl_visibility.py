#!/usr/bin/env python3
"""
Enhance ADL Visibility Across Website Components
Adds proper source attribution and ADL-specific features to all views
"""

from pathlib import Path

def enhance_dashboard_component():
    """Add source breakdown and ADL features to Dashboard"""
    
    dashboard_enhancement = '''import React from 'react';
import { useData } from '../contexts/DataContext';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Calendar, MapPin, BarChart, Shield, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import moment from 'moment';

function RiskMeter() {
  const { riskAssessment } = useData();

  if (!riskAssessment) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const getIcon = () => {
    switch (riskAssessment.trend) {
      case 'increasing': return <TrendingUp className="h-5 w-5 text-red-500" />;
      case 'decreasing': return <TrendingDown className="h-5 w-5 text-green-500" />;
      default: return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
        {getIcon()}
      </div>
      
      <div className="text-center mb-6">
        <div
          className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl"
          style={{ backgroundColor: riskAssessment.color }}
        >
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h4 className={clsx('text-2xl font-bold mb-2', {
          'text-green-700': riskAssessment.level === 'low',
          'text-yellow-700': riskAssessment.level === 'moderate',
          'text-orange-700': riskAssessment.level === 'high',
          'text-red-700': riskAssessment.level === 'critical',
        })}>
          {riskAssessment.level.toUpperCase()} RISK
        </h4>
        <p className="text-gray-600">{riskAssessment.description}</p>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Current Week Projection:</span>
          <span className="font-semibold">{riskAssessment.currentWeekProjection}</span>
        </div>
        <div className="flex justify-between">
          <span>Confidence Range:</span>
          <span className="font-semibold">
            {riskAssessment.confidenceInterval.lower}-{riskAssessment.confidenceInterval.upper}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Last Updated:</span>
          <span className="font-semibold">{riskAssessment.lastUpdated}</span>
        </div>
      </div>
    </div>
  );
}

function DataSourceBreakdown() {
  const { data } = useData();

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate source statistics
  const sourceStats = data.records.reduce((acc, record) => {
    acc[record.source] = (acc[record.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalIncidents = data.records.length;
  const adlVerified = data.records.filter(r => r.source === 'ADL' && r.verified).length;

  const sources = [
    { 
      name: 'NYPD', 
      count: sourceStats['NYPD'] || 0, 
      icon: '🗽', 
      description: 'New York Police Department',
      coverage: 'NYC Metro Area'
    },
    { 
      name: 'ADL', 
      count: sourceStats['ADL'] || 0, 
      icon: '🛡️', 
      description: 'Anti-Defamation League',
      coverage: 'National Coverage',
      verified: adlVerified
    },
    { 
      name: 'LAPD', 
      count: sourceStats['LAPD'] || 0, 
      icon: '🌴', 
      description: 'Los Angeles Police Department',
      coverage: 'LA Metro Area'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Data Sources</h3>
      </div>
      
      <div className="space-y-4">
        {sources.map((source) => {
          const percentage = ((source.count / totalIncidents) * 100).toFixed(1);
          return (
            <div key={source.name} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{source.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{source.name}</h4>
                    <p className="text-sm text-gray-600">{source.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">{source.count.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{percentage}%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{source.coverage}</span>
                {source.verified && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>{source.verified.toLocaleString()} verified</span>
                  </div>
                )}
              </div>
              
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 text-blue-800">
          <Shield className="h-4 w-4" />
          <span className="font-semibold">Multi-Source Validation</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          This dataset combines verified police reports with ADL's comprehensive incident tracking 
          for the most complete antisemitic hate crime coverage available.
        </p>
      </div>
    </div>
  );
}

function StatsOverview() {
  const { data } = useData();

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const totalIncidents = data.records.length;
  const statesCount = data.stateData.length;
  const currentYear = new Date().getFullYear();
  const currentYearIncidents = data.records.filter(r => r.year === currentYear).length;
  const adlIncidents = data.records.filter(r => r.source === 'ADL').length;

  const stats = [
    {
      title: 'Total Incidents',
      value: totalIncidents.toLocaleString(),
      icon: <AlertTriangle className="h-6 w-6" />,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      title: 'States Covered',
      value: statesCount.toString(),
      icon: <MapPin className="h-6 w-6" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: `${currentYear} Incidents`,
      value: currentYearIncidents.toLocaleString(),
      icon: <Calendar className="h-6 w-6" />,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'ADL Verified',
      value: adlIncidents.toLocaleString(),
      icon: <Shield className="h-6 w-6" />,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bg} rounded-lg p-6 border border-gray-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`${stat.color}`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          National Antisemitic Hate Crime Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Real-time tracking and analysis powered by NYPD, LAPD, and ADL data sources
        </p>
      </div>

      <StatsOverview />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RiskMeter />
        <DataSourceBreakdown />
      </div>
    </div>
  );
}

export { Dashboard };'''

    # Write enhanced dashboard
    dashboard_file = Path('website-source/src/components/Dashboard.tsx')
    with open(dashboard_file, 'w') as f:
        f.write(dashboard_enhancement)
    
    print("✅ Enhanced Dashboard component with ADL source visibility")

def enhance_data_processor():
    """Update data processor to include source information"""
    
    # Add source field to the interface
    processor_enhancement = '''import Papa from 'papaparse';
import moment from 'moment';

export interface HateCrimeRecord {
  date: string;
  state: string;
  county: string;
  bias_motivation: string;
  source: string;
  incident_id: string;
  offense_type: string;
  victim_type: string;
  bias_motivation_cleaned: string;
  incidents_corrected: number;
  parsed_date: Date;
  year: number;
  month: number;
  verified?: boolean;
  adl_category?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
}

export interface ProcessedData {
  records: HateCrimeRecord[];
  timeSeriesData: Array<{ date: string; incidents: number }>;
  stateData: Array<{ state: string; incidents: number }>;
  countyData: Array<{ county: string; state: string; incidents: number }>;
  biasMotivationData: Array<{ motivation: string; incidents: number }>;
  yearlyData: Array<{ year: number; incidents: number }>;
  monthlyData: Array<{ month: string; incidents: number }>;
  sourceData: Array<{ source: string; incidents: number; verified?: number }>;
}

export interface RiskAssessment {
  level: 'low' | 'moderate' | 'high' | 'critical';
  color: string;
  description: string;
  currentWeekProjection: number;
  confidenceInterval: { lower: number; upper: number };
  lastUpdated: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export async function loadAndProcessData(): Promise<ProcessedData> {
  try {
    const response = await fetch('/data/unified_hate_crimes_corrected.csv');
    const csvText = await response.text();
    
    const parsed = Papa.parse<HateCrimeRecord>(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
        if (field === 'incidents_corrected') {
          return parseFloat(value) || 1;
        }
        if (field === 'verified') {
          return value === 'True' || value === 'true' || value === true;
        }
        if (field === 'latitude' || field === 'longitude') {
          return parseFloat(value) || undefined;
        }
        return value ? value.trim() : value;
      }
    });

    const records = parsed.data
      .filter(record => record.bias_motivation_cleaned === 'ANTI-JEWISH')
      .map(record => {
        const parsedDate = moment(record.date, 'MM/DD/YYYY').toDate();
        return {
          ...record,
          parsed_date: parsedDate,
          year: parsedDate.getFullYear(),
          month: parsedDate.getMonth() + 1,
          incidents_corrected: typeof record.incidents_corrected === 'number' ? record.incidents_corrected : parseFloat(record.incidents_corrected as any) || 1
        };
      })
      .filter(record => !isNaN(record.parsed_date.getTime()))
      .sort((a, b) => a.parsed_date.getTime() - b.parsed_date.getTime());

    // Process time series data (monthly aggregation)
    const monthlyMap = new Map<string, number>();
    records.forEach(record => {
      const monthKey = moment(record.parsed_date).format('YYYY-MM');
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + record.incidents_corrected);
    });

    const timeSeriesData = Array.from(monthlyMap.entries())
      .map(([date, incidents]) => ({ date, incidents }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Process state data
    const stateMap = new Map<string, number>();
    records.forEach(record => {
      stateMap.set(record.state, (stateMap.get(record.state) || 0) + record.incidents_corrected);
    });

    const stateData = Array.from(stateMap.entries())
      .map(([state, incidents]) => ({ state, incidents }))
      .sort((a, b) => b.incidents - a.incidents);

    // Process county data
    const countyMap = new Map<string, { state: string; incidents: number }>();
    records.forEach(record => {
      const key = `${record.county}-${record.state}`;
      const existing = countyMap.get(key) || { state: record.state, incidents: 0 };
      countyMap.set(key, { 
        state: record.state, 
        incidents: existing.incidents + record.incidents_corrected 
      });
    });

    const countyData = Array.from(countyMap.entries())
      .map(([key, data]) => ({
        county: key.split('-')[0],
        state: data.state,
        incidents: data.incidents
      }))
      .sort((a, b) => b.incidents - a.incidents);

    // Process bias motivation data
    const motivationMap = new Map<string, number>();
    records.forEach(record => {
      motivationMap.set(record.bias_motivation, (motivationMap.get(record.bias_motivation) || 0) + record.incidents_corrected);
    });

    const biasMotivationData = Array.from(motivationMap.entries())
      .map(([motivation, incidents]) => ({ motivation, incidents }))
      .sort((a, b) => b.incidents - a.incidents);

    // Process yearly data
    const yearlyMap = new Map<number, number>();
    records.forEach(record => {
      yearlyMap.set(record.year, (yearlyMap.get(record.year) || 0) + record.incidents_corrected);
    });

    const yearlyData = Array.from(yearlyMap.entries())
      .map(([year, incidents]) => ({ year, incidents }))
      .sort((a, b) => a.year - b.year);

    // Process monthly data (across all years)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyDataMap = new Map<number, number>();
    records.forEach(record => {
      monthlyDataMap.set(record.month, (monthlyDataMap.get(record.month) || 0) + record.incidents_corrected);
    });

    const monthlyData = Array.from(monthlyDataMap.entries())
      .map(([month, incidents]) => ({ month: monthNames[month - 1], incidents }))
      .sort((a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month));

    // Process source data
    const sourceMap = new Map<string, { incidents: number; verified: number }>();
    records.forEach(record => {
      const existing = sourceMap.get(record.source) || { incidents: 0, verified: 0 };
      sourceMap.set(record.source, {
        incidents: existing.incidents + record.incidents_corrected,
        verified: existing.verified + (record.verified ? record.incidents_corrected : 0)
      });
    });

    const sourceData = Array.from(sourceMap.entries())
      .map(([source, data]) => ({ source, incidents: data.incidents, verified: data.verified }))
      .sort((a, b) => b.incidents - a.incidents);

    return {
      records,
      timeSeriesData,
      stateData,
      countyData,
      biasMotivationData,
      yearlyData,
      monthlyData,
      sourceData
    };
  } catch (error) {
    throw new Error(`Failed to load and process data: ${error}`);
  }
}

export function calculateRiskAssessment(timeSeriesData: Array<{ date: string; incidents: number }>): RiskAssessment {
  if (!timeSeriesData || timeSeriesData.length === 0) {
    return {
      level: 'low',
      color: '#10b981',
      description: 'No data available',
      currentWeekProjection: 0,
      confidenceInterval: { lower: 0, upper: 0 },
      lastUpdated: new Date().toLocaleDateString(),
      trend: 'stable'
    };
  }

  // Simple risk calculation based on recent trends
  const recentData = timeSeriesData.slice(-6); // Last 6 months
  const avgIncidents = recentData.reduce((sum, item) => sum + item.incidents, 0) / recentData.length;
  
  // Calculate trend
  const firstHalf = recentData.slice(0, 3).reduce((sum, item) => sum + item.incidents, 0) / 3;
  const secondHalf = recentData.slice(-3).reduce((sum, item) => sum + item.incidents, 0) / 3;
  const trend = secondHalf > firstHalf * 1.1 ? 'increasing' : 
                secondHalf < firstHalf * 0.9 ? 'decreasing' : 'stable';

  // Determine risk level
  let level: 'low' | 'moderate' | 'high' | 'critical';
  let color: string;
  let description: string;

  if (avgIncidents < 50) {
    level = 'low';
    color = '#10b981';
    description = 'Incident levels are within normal ranges';
  } else if (avgIncidents < 100) {
    level = 'moderate';
    color = '#f59e0b';
    description = 'Elevated incident levels require monitoring';
  } else if (avgIncidents < 200) {
    level = 'high';
    color = '#f97316';
    description = 'High incident levels indicate increased risk';
  } else {
    level = 'critical';
    color = '#ef4444';
    description = 'Critical incident levels require immediate attention';
  }

  // Weekly projection (simplified)
  const weeklyProjection = Math.round(avgIncidents / 4.33); // Monthly to weekly
  const margin = Math.round(weeklyProjection * 0.3);

  return {
    level,
    color,
    description,
    currentWeekProjection: weeklyProjection,
    confidenceInterval: {
      lower: Math.max(0, weeklyProjection - margin),
      upper: weeklyProjection + margin
    },
    lastUpdated: new Date().toLocaleDateString(),
    trend
  };
}'''

    processor_file = Path('website-source/src/utils/dataProcessor.ts')
    with open(processor_file, 'w') as f:
        f.write(processor_enhancement)
    
    print("✅ Enhanced data processor with source information")

def main():
    """Main enhancement function"""
    print("🔧 Enhancing ADL Visibility Across Website")
    print("=" * 50)
    
    enhance_dashboard_component()
    enhance_data_processor()
    
    print(f"\n🎉 ADL Visibility Enhancement Complete!")
    print(f"   ✅ Dashboard now shows source breakdown with ADL highlighted")
    print(f"   ✅ Data processor includes ADL verification status")
    print(f"   ✅ Multi-source validation prominently displayed")

if __name__ == "__main__":
    main()
