import Papa from 'papaparse';
import moment from 'moment';

// Helper function to determine if a month is complete
function isMonthComplete(monthStr: string): boolean {
  const currentDate = moment();
  const monthDate = moment(monthStr, 'YYYY-MM');
  
  // If the month is in the future, it's definitely incomplete
  if (monthDate.isAfter(currentDate, 'month')) {
    return false;
  }
  
  // If the month is before the current month, it's complete
  if (monthDate.isBefore(currentDate, 'month')) {
    return true;
  }
  
  // If it's the current month, check if we're past the 25th day
  // (assuming most reporting is complete by then)
  return currentDate.date() > 25;
}

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
  timeSeriesDataForForecast: Array<{ date: string; incidents: number }>;
  timeSeriesBySource: Array<{ date: string; incidents: number; source: string }>;
  stateData: Array<{ state: string; incidents: number }>;
  countyData: Array<{ county: string; state: string; incidents: number }>;
  biasMotivationData: Array<{ motivation: string; incidents: number }>;
  yearlyData: Array<{ year: number; incidents: number; isComplete: boolean; completionRate: number; projectedAnnual: number; label: string }>;
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
    const response = await fetch('/data/integrated_hate_crimes_4sources.csv');
    const csvText = await response.text();
    
    const parsed = Papa.parse<HateCrimeRecord>(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
        if (field === 'incidents_corrected') {
          return parseFloat(value) || 1;
        }
        if (field === 'verified') {
          return value === 'True' || value === 'true';
        }
        if (field === 'latitude' || field === 'longitude') {
          return parseFloat(value) || undefined;
        }
        return value ? value.trim() : value;
      }
    });

    const records = parsed.data
      .filter(record => {
        // Include records with antisemitic bias motivations from any field
        const cleanedBias = record.bias_motivation_cleaned?.toUpperCase() || '';
        const originalBias = record.bias_motivation?.toUpperCase() || '';
        
        // Exclude FBI total hate crimes from main display (used for correlation only)
        if (cleanedBias === 'FBI_TOTAL_HATE_CRIMES') {
          return false;
        }
        
        return cleanedBias === 'ANTI-JEWISH' || 
               originalBias === 'ANTI-JEWISH' || 
               originalBias === 'HOLOCAUST DENIAL' ||
               cleanedBias.includes('JEWISH') ||
               originalBias.includes('JEWISH');
      })
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

    // Create forecast-specific time series data (excluding incomplete months)
    const timeSeriesDataForForecast = timeSeriesData.filter(item => isMonthComplete(item.date));

    // Process time series data by source (for source-separated charts)
    const monthlyBySourceMap = new Map<string, Map<string, number>>();
    records.forEach(record => {
      const monthKey = moment(record.parsed_date).format('YYYY-MM');
      const source = record.source;
      
      if (!monthlyBySourceMap.has(source)) {
        monthlyBySourceMap.set(source, new Map<string, number>());
      }
      
      const sourceMap = monthlyBySourceMap.get(source)!;
      sourceMap.set(monthKey, (sourceMap.get(monthKey) || 0) + record.incidents_corrected);
    });

    const timeSeriesBySource: Array<{ date: string; incidents: number; source: string }> = [];
    monthlyBySourceMap.forEach((sourceMap, source) => {
      sourceMap.forEach((incidents, date) => {
        timeSeriesBySource.push({ date, incidents, source });
      });
    });
    timeSeriesBySource.sort((a, b) => a.date.localeCompare(b.date));

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

    // Process yearly data with completeness awareness
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const yearlyMap = new Map<number, number>();
    records.forEach(record => {
      yearlyMap.set(record.year, (yearlyMap.get(record.year) || 0) + record.incidents_corrected);
    });

    const yearlyData = Array.from(yearlyMap.entries())
      .map(([year, incidents]) => {
        const isComplete = year < currentYear;
        const completionRate = year === currentYear ? currentMonth / 12 : 1;
        const projectedAnnual = isComplete ? incidents : incidents / completionRate;
        
        return { 
          year, 
          incidents, 
          isComplete,
          completionRate: Math.round(completionRate * 100),
          projectedAnnual: Math.round(projectedAnnual),
          label: isComplete ? `${year}` : `${year}*`
        };
      })
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
      timeSeriesDataForForecast,
      timeSeriesBySource,
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
}