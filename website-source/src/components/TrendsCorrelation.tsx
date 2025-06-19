import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { TrendingUp, Search, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';

interface CorrelationData {
  Week: string;
  antisemitic_index_mean: number;
  hate_crime_incidents: number;
  active_terms: number;
}

interface CorrelationStats {
  correlation: number;
  p_value: number;
}

const TrendsCorrelation: React.FC = () => {
  const [correlationData, setCorrelationData] = useState<CorrelationData[]>([]);
  const [correlationStats, setCorrelationStats] = useState<{
    antisemitic_index_mean: CorrelationStats;
    antisemitic_index_max: CorrelationStats;
    antisemitic_index_sum: CorrelationStats;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataFreshness, setDataFreshness] = useState<{
    days: number;
    status: 'fresh' | 'acceptable' | 'stale';
  }>({ days: 0, status: 'fresh' });

  useEffect(() => {
    loadCorrelationData();
  }, []);

  const loadCorrelationData = async () => {
    try {
      // Load correlation data
      const correlationResponse = await fetch(`${import.meta.env.BASE_URL}data/trends_crime_correlation.csv`);
      
      if (correlationResponse.ok) {
        const csvText = await correlationResponse.text();
        const parsedData = parseCSV(csvText);
        setCorrelationData(parsedData);
      }

      // Load correlation statistics
      const statsResponse = await fetch(`${import.meta.env.BASE_URL}data/correlation_analysis.json`);
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setCorrelationStats(stats.correlations);
        
        // Calculate data freshness
        const analysisDate = new Date(stats.analysis_date);
        const daysSince = Math.floor((Date.now() - analysisDate.getTime()) / (1000 * 60 * 60 * 24));
        setDataFreshness({
          days: daysSince,
          status: daysSince <= 7 ? 'fresh' : daysSince <= 30 ? 'acceptable' : 'stale'
        });
      }
    } catch (error) {
      console.error('Error loading correlation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (csvText: string): CorrelationData[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        Week: values[0]?.trim(),
        antisemitic_index_mean: parseFloat(values[1]) || 0,
        hate_crime_incidents: parseInt(values[5]) || 0,
        active_terms: parseInt(values[4]) || 0
      };
    }).filter(item => item.Week && !isNaN(item.antisemitic_index_mean));
  };

  const getFreshnessColor = (status: string) => {
    switch (status) {
      case 'fresh': return 'text-green-600';
      case 'acceptable': return 'text-yellow-600';
      case 'stale': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getFreshnessIcon = (status: string) => {
    switch (status) {
      case 'fresh': return <CheckCircle className="h-4 w-4" />;
      case 'acceptable': return <AlertTriangle className="h-4 w-4" />;
      case 'stale': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading correlation analysis...</p>
        </div>
      </div>
    );
  }

  if (!correlationData.length || !correlationStats) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Correlation analysis data is not available. This feature requires Google Trends data collection.
        </AlertDescription>
      </Alert>
    );
  }

  const primaryCorrelation = correlationStats.antisemitic_index_mean;
  const isSignificant = primaryCorrelation.p_value < 0.05;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Search Trends vs Hate Crime Correlation
        </h2>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          Statistical analysis of the relationship between antisemitic search patterns and hate crime incidents
        </p>
        
        {/* Data Freshness Indicator */}
        <div className={`flex items-center justify-center mt-4 ${getFreshnessColor(dataFreshness.status)}`}>
          {getFreshnessIcon(dataFreshness.status)}
          <span className="ml-2 text-sm">
            Data age: {dataFreshness.days} days ({dataFreshness.status})
          </span>
        </div>
      </div>

      {/* Data Coverage Warning */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>⚠️ Limited Data Coverage:</strong> Search correlation analysis is based on available crime data periods only. 
          Recent correlations (2024-2025) reflect limited geographic coverage as FBI data ends Dec 2023, 
          NYPD data ends Dec 2022. Current analysis includes LAPD and ADL (through Jun 2025) reporting areas.
        </AlertDescription>
      </Alert>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Correlation Strength</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              r = {primaryCorrelation.correlation.toFixed(3)}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.abs(primaryCorrelation.correlation) > 0.3 ? 'Strong' : 
               Math.abs(primaryCorrelation.correlation) > 0.1 ? 'Moderate' : 'Weak'} correlation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statistical Significance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              p {primaryCorrelation.p_value < 0.001 ? '< 0.001' : `= ${primaryCorrelation.p_value.toFixed(3)}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {isSignificant ? '✅ Statistically significant' : '❌ Not significant'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analysis Period</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{correlationData.length}</div>
            <p className="text-xs text-muted-foreground">
              Weeks of data analyzed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Search Trends vs Hate Crimes Over Time</CardTitle>
          <CardDescription>
            Weekly comparison of antisemitic search volume and reported hate crime incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={correlationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="Week" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis yAxisId="searches" orientation="left" />
                <YAxis yAxisId="crimes" orientation="right" />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(2) : value,
                    name === 'antisemitic_index_mean' ? 'Search Index' : 'Hate Crimes'
                  ]}
                />
                <Legend />
                <Line
                  yAxisId="searches"
                  type="monotone"
                  dataKey="antisemitic_index_mean"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Search Index"
                  dot={false}
                />
                <Line
                  yAxisId="crimes"
                  type="monotone"
                  dataKey="hate_crime_incidents"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Hate Crimes"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle>Correlation Scatter Plot</CardTitle>
          <CardDescription>
            Direct relationship between search index and weekly hate crime incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={correlationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="antisemitic_index_mean" 
                  name="Search Index"
                  label={{ value: 'Antisemitic Search Index', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey="hate_crime_incidents" 
                  name="Hate Crimes"
                  label={{ value: 'Weekly Hate Crimes', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(2) : value,
                    name === 'antisemitic_index_mean' ? 'Search Index' : 'Hate Crimes'
                  ]}
                />
                <Scatter 
                  name="Data Points" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <Badge variant={isSignificant ? "default" : "secondary"}>
              Correlation: r = {primaryCorrelation.correlation.toFixed(3)}, 
              p {primaryCorrelation.p_value < 0.001 ? '< 0.001' : `= ${primaryCorrelation.p_value.toFixed(3)}`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card>
        <CardHeader>
          <CardTitle>Methodology & Interpretation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Data Sources</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Google Trends:</strong> Weekly search volume indices for 30 antisemitic terms</li>
              <li>• <strong>Hate Crime Data:</strong> NYPD, LAPD, FBI, and ADL incident reports</li>
              <li>• <strong>Time Period:</strong> June 2020 - June 2025 (262 weeks)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Statistical Analysis</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Correlation Method:</strong> Pearson correlation coefficient</li>
              <li>• <strong>Significance Level:</strong> p &lt; 0.05 for statistical significance</li>
              <li>• <strong>Effect Size:</strong> |r| &gt; 0.1 (small), |r| &gt; 0.3 (medium), |r| &gt; 0.5 (large)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Key Findings</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • <strong>Correlation Strength:</strong> {Math.abs(primaryCorrelation.correlation) > 0.3 ? '🔴 Strong' : 
                   Math.abs(primaryCorrelation.correlation) > 0.1 ? '🟡 Moderate' : '🟢 Weak'} positive correlation
              </li>
              <li>
                • <strong>Statistical Significance:</strong> {isSignificant ? '✅ Highly significant' : '❌ Not significant'} 
                  (p {primaryCorrelation.p_value < 0.001 ? '< 0.001' : `= ${primaryCorrelation.p_value.toFixed(3)}`})
              </li>
              <li>
                • <strong>Interpretation:</strong> {isSignificant ? 
                  'Increased antisemitic search activity is significantly associated with higher hate crime incidents' :
                  'No significant relationship found between search trends and hate crimes'}
              </li>
            </ul>
          </div>

          {dataFreshness.status === 'stale' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Data Update Needed:</strong> Google Trends data is {dataFreshness.days} days old. 
                Consider updating for the most current correlation analysis.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrendsCorrelation;
