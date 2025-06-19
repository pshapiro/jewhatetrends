import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Calendar, TrendingUp, Download, Filter } from 'lucide-react';
import moment from 'moment';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

function TimeSeriesChart() {
  const { data } = useData();
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');
  const [sourceView, setSourceView] = useState<'combined' | 'separated'>('separated');
  const [selectedSources, setSelectedSources] = useState<string[]>(['all']);
  const [yearlyBreakdownData, setYearlyBreakdownData] = useState<any>(null);

  // Load yearly breakdown data
  useEffect(() => {
    const loadYearlyBreakdown = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/yearly_breakdown_by_source.json`);
        const yearlyData = await response.json();
        setYearlyBreakdownData(yearlyData);
      } catch (error) {
        console.error('Error loading yearly breakdown data:', error);
      }
    };

    loadYearlyBreakdown();
  }, []);

  if (!data) return <div className="h-64 bg-gray-200 animate-pulse rounded"></div>;

  // Get available sources from the data
  const availableSources = [...new Set(data.records.map(r => r.source))].sort();

  // Prepare chart data based on view type and source selection
  let chartConfig;
  
  if (sourceView === 'combined') {
    // Use combined data when combined is selected
    const chartData = viewType === 'monthly' ? data.timeSeriesData : data.yearlyData;
    
    const labels = viewType === 'monthly' 
      ? chartData.map(item => moment(item.date, 'YYYY-MM').format('MMM YYYY'))
      : chartData.map(item => item.year.toString());
       
    const incidents = chartData.map(item => Math.round(item.incidents));

    chartConfig = {
      labels,
      datasets: [{
        label: 'Total Incidents',
        data: incidents,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      }]
    };
  } else if (viewType === 'yearly' && yearlyBreakdownData) {
    // Use yearly data by source from the yearly breakdown JSON
    const yearlyData = yearlyBreakdownData.yearly_data || [];
    const years = yearlyData.map((item: any) => item.year).sort();
    const labels = years.map((year: number) => year.toString());
    
    // Color palette for different sources
    const sourceColors = {
      'ADL': 'rgb(239, 68, 68)',    // Red
      'FBI': 'rgb(59, 130, 246)',   // Blue  
      'NYPD': 'rgb(34, 197, 94)',   // Green
      'LAPD': 'rgb(168, 85, 247)',  // Purple
    };
    
    const datasets = (yearlyBreakdownData.sources || availableSources)
      .filter((source: string) => selectedSources.includes('all') || selectedSources.includes(source))
      .map((source: string) => {
        const sourceData = years.map((year: number) => {
          const record = yearlyData.find((item: any) => item.year === year);
          return record && record[source] ? Math.round(record[source]) : 0;
        });
        
        return {
          label: source,
          data: sourceData,
          borderColor: sourceColors[source as keyof typeof sourceColors] || 'rgb(156, 163, 175)',
          backgroundColor: (sourceColors[source as keyof typeof sourceColors] || 'rgb(156, 163, 175)') + '20',
          tension: 0.1,
        };
      });

    chartConfig = { labels, datasets };
  } else {
    // Use separated data by source for monthly view
    const monthlyDates = [...new Set(data.timeSeriesBySource.map(item => item.date))].sort();
    const labels = monthlyDates.map(date => moment(date, 'YYYY-MM').format('MMM YYYY'));
    
    // Color palette for different sources
    const sourceColors = {
      'ADL': 'rgb(239, 68, 68)',    // Red
      'FBI': 'rgb(59, 130, 246)',   // Blue  
      'NYPD': 'rgb(34, 197, 94)',   // Green
      'LAPD': 'rgb(168, 85, 247)',  // Purple
    };
    
    const datasets = availableSources
      .filter(source => selectedSources.includes('all') || selectedSources.includes(source))
      .map(source => {
        const sourceData = monthlyDates.map(date => {
          const record = data.timeSeriesBySource.find(item => item.date === date && item.source === source);
          return record ? Math.round(record.incidents) : 0;
        });
        
        return {
          label: source,
          data: sourceData,
          borderColor: sourceColors[source as keyof typeof sourceColors] || 'rgb(156, 163, 175)',
          backgroundColor: (sourceColors[source as keyof typeof sourceColors] || 'rgb(156, 163, 175)') + '20',
          tension: 0.1,
        };
      });

    chartConfig = { labels, datasets };
  }

  // Add annotations for significant events
  const annotations = [];
  const oct2023Index = chartConfig.labels.findIndex((label: string) => label.includes('Oct 2023'));
  if (oct2023Index !== -1) {
    annotations.push({
      type: 'line',
      xMin: oct2023Index,
      xMax: oct2023Index,
      borderColor: 'red',
      borderWidth: 2,
      label: {
        content: 'Oct 7, 2023',
        enabled: true,
        position: 'start'
      }
    });
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Antisemitic Hate Crime Incidents - ${viewType === 'monthly' ? 'Monthly' : 'Yearly'} Trends`,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Incidents: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Incidents'
        }
      },
      x: {
        title: {
          display: true,
          text: viewType === 'monthly' ? 'Month' : 'Year'
        }
      }
    },
    elements: {
      point: {
        backgroundColor: '#dc2626',
        borderColor: '#dc2626',
        hoverBackgroundColor: '#991b1b',
        hoverBorderColor: '#991b1b',
      },
      line: {
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: true,
      }
    }
  };

  const chartDataConfig = chartConfig;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Time Series Analysis</h3>
        <div className="flex space-x-4">
          {/* View Type Controls */}
          <div className="flex space-x-2">
            <button
              onClick={() => setViewType('monthly')}
              className={`px-3 py-1 text-sm rounded ${
                viewType === 'monthly' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewType('yearly')}
              className={`px-3 py-1 text-sm rounded ${
                viewType === 'yearly' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Yearly
            </button>
          </div>
          
          {/* Source View Controls */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSourceView('combined')}
              className={`px-3 py-1 text-sm rounded ${
                sourceView === 'combined'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Combined
            </button>
            <button
              onClick={() => setSourceView('separated')}
              className={`px-3 py-1 text-sm rounded ${
                sourceView === 'separated'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              By Source
            </button>
          </div>
        </div>
      </div>
      
      {/* Source Selection (when separated view is active) */}
      {sourceView === 'separated' && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter by Data Source:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedSources(['all'])}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedSources.includes('all')
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              All Sources
            </button>
            {availableSources.map(source => (
              <button
                key={source}
                onClick={() => {
                  if (selectedSources.includes('all')) {
                    setSelectedSources([source]);
                  } else if (selectedSources.includes(source)) {
                    const newSources = selectedSources.filter(s => s !== source);
                    setSelectedSources(newSources.length === 0 ? ['all'] : newSources);
                  } else {
                    setSelectedSources([...selectedSources.filter(s => s !== 'all'), source]);
                  }
                }}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedSources.includes(source) || selectedSources.includes('all')
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
              >
                {source} ({data.records.filter(r => r.source === source).length})
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="h-96">
        <Line data={chartDataConfig} options={chartOptions} />
      </div>
    </div>
  );
}

function GeographicDistribution() {
  const { data } = useData();

  if (!data) return <div className="h-64 bg-gray-200 animate-pulse rounded"></div>;

  const topStates = data.stateData.slice(0, 10);
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Incidents by State (Top 10)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Incidents'
        }
      },
      x: {
        title: {
          display: true,
          text: 'State'
        }
      }
    },
  };

  const chartData = {
    labels: topStates.map(item => item.state),
    datasets: [
      {
        label: 'Incidents',
        data: topStates.map(item => Math.round(item.incidents)),
        backgroundColor: 'rgba(220, 38, 38, 0.8)',
        borderColor: '#dc2626',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
      <div className="h-80">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

function SeasonalPatterns() {
  const { data } = useData();

  if (!data) return <div className="h-64 bg-gray-200 animate-pulse rounded"></div>;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Seasonal Patterns (Monthly Averages)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Average Incidents'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month'
        }
      }
    },
  };

  const chartData = {
    labels: data.monthlyData.map(item => item.month),
    datasets: [
      {
        label: 'Average Incidents',
        data: data.monthlyData.map(item => Math.round(item.incidents)),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: '#22c55e',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Patterns</h3>
      <div className="h-80">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

function ForecastChart() {
  const { data } = useData();

  if (!data) return <div className="h-64 bg-gray-200 animate-pulse rounded"></div>;

  // Create simple forecast by extending the trend using complete months only
  const historicalData = data.timeSeriesDataForForecast; // Use forecast-specific data
  const lastSixMonths = historicalData.slice(-6);
  const avgGrowthRate = lastSixMonths.length > 1 
    ? (lastSixMonths[lastSixMonths.length - 1].incidents - lastSixMonths[0].incidents) / lastSixMonths.length
    : 0;

  // Generate 6 months of forecast
  const forecastData = [];
  const lastDate = moment(historicalData[historicalData.length - 1].date, 'YYYY-MM');
  const lastValue = historicalData[historicalData.length - 1].incidents;

  for (let i = 1; i <= 6; i++) {
    const forecastDate = lastDate.clone().add(i, 'month').format('YYYY-MM');
    const forecastValue = Math.max(0, lastValue + (avgGrowthRate * i));
    forecastData.push({
      date: forecastDate,
      incidents: forecastValue
    });
  }

  // Include incomplete current month data for display but not forecasting
  const allTimeSeriesData = data.timeSeriesData;
  const incompleteData = allTimeSeriesData.filter(item => !historicalData.find(h => h.date === item.date));
  
  const combinedLabels = [
    ...historicalData.slice(-12).map(item => moment(item.date, 'YYYY-MM').format('MMM YYYY')),
    ...incompleteData.map(item => moment(item.date, 'YYYY-MM').format('MMM YYYY')),
    ...forecastData.map(item => moment(item.date, 'YYYY-MM').format('MMM YYYY'))
  ];

  const historicalValues = [
    ...historicalData.slice(-12).map(item => Math.round(item.incidents)),
    ...new Array(incompleteData.length + forecastData.length).fill(null)
  ];
  
  const incompleteValues = [
    ...new Array(Math.max(0, historicalData.slice(-12).length)).fill(null),
    ...incompleteData.map(item => Math.round(item.incidents)),
    ...new Array(forecastData.length).fill(null)
  ];
  
  const forecastValues = [
    ...new Array(Math.max(0, historicalData.slice(-12).length + incompleteData.length)).fill(null),
    ...forecastData.map(item => Math.round(item.incidents))
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Historical Data vs. Forecast Projection',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Incidents'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month'
        }
      }
    },
  };

  const chartData = {
    labels: combinedLabels,
    datasets: [
      {
        label: 'Historical Data (Complete)',
        data: historicalValues,
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.1,
        spanGaps: false,
      },
      ...(incompleteData.length > 0 ? [{
        label: 'Current Month (Incomplete)',
        data: incompleteValues,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderDash: [3, 3],
        tension: 0.1,
        spanGaps: false,
      }] : []),
      {
        label: 'Forecast Projection',
        data: forecastValues,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderDash: [5, 5],
        tension: 0.1,
        spanGaps: false,
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Forecast Projection</h3>
      <div className="h-80">
        <Line data={chartData} options={chartOptions} />
      </div>
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Forecast Disclaimer:</strong> Projections are based on complete months only and limited historical data. 
          FBI data ends Dec 2023, NYPD data ends Dec 2022. Recent forecasts include LAPD and ADL data (current through Jun 2025).
          Incomplete current month data is shown separately and excluded from forecasting calculations.
          Actual incidents may vary significantly due to various factors including policy changes, 
          social events, reporting variations, and geographic coverage limitations.
        </p>
      </div>
    </div>
  );
}

function ExportData() {
  const { data } = useData();

  const exportToCSV = (dataType: string) => {
    if (!data) return;

    let csvContent = '';
    let filename = '';

    switch (dataType) {
      case 'timeseries':
        csvContent = 'Date,Incidents\n' + 
          data.timeSeriesData.map(row => `${row.date},${row.incidents}`).join('\n');
        filename = 'hate_crimes_timeseries.csv';
        break;
      case 'states':
        csvContent = 'State,Incidents\n' + 
          data.stateData.map(row => `${row.state},${row.incidents}`).join('\n');
        filename = 'hate_crimes_by_state.csv';
        break;
      case 'yearly':
        csvContent = 'Year,Incidents\n' + 
          data.yearlyData.map(row => `${row.year},${row.incidents}`).join('\n');
        filename = 'hate_crimes_yearly.csv';
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
      <p className="text-gray-600 mb-4">
        Download processed datasets for your own analysis and research.
      </p>
      <div className="space-y-3">
        <button
          onClick={() => exportToCSV('timeseries')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Time Series Data
        </button>
        <button
          onClick={() => exportToCSV('states')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          State Summary
        </button>
        <button
          onClick={() => exportToCSV('yearly')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Yearly Summary
        </button>
      </div>
    </div>
  );
}

export function TrendsAnalytics() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Trends & Analytics</h1>
          <p className="text-lg text-gray-600">
            Comprehensive statistical analysis of antisemitic hate crime trends, patterns, and projections.
          </p>
        </div>

        <div className="space-y-8">
          {/* Time Series Chart */}
          <TimeSeriesChart />

          {/* Geographic and Seasonal Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GeographicDistribution />
            <SeasonalPatterns />
          </div>

          {/* Forecast and Export */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ForecastChart />
            </div>
            <div className="lg:col-span-1">
              <ExportData />
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Temporal Patterns</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Significant spike observed in October 2023 following global events</li>
                  <li>• General upward trend in recent years requiring continued monitoring</li>
                  <li>• Seasonal variations show patterns that may correlate with holidays and events</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Geographic Distribution</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• New York and California show highest absolute numbers</li>
                  <li>• Urban areas with larger Jewish populations see more incidents</li>
                  <li>• Data availability varies by jurisdiction and reporting practices</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
