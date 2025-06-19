import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface YearlyData {
  year: number;
  [source: string]: number;
}

interface SourceSummary {
  source: string;
  total_records: number;
  start_date: string;
  end_date: string;
}

interface BreakdownData {
  yearly_data: YearlyData[];
  source_summary: SourceSummary[];
  total_records: number;
  years_covered: string;
  sources: string[];
}

const YearlyBreakdown: React.FC = () => {
  const [data, setData] = useState<BreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'bar' | 'line'>('bar');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/yearly_breakdown_by_source.json`);
        const breakdownData = await response.json();
        setData(breakdownData);
      } catch (error) {
        console.error('Error loading yearly breakdown data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Yearly Breakdown by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading yearly breakdown...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Yearly Breakdown by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading yearly breakdown data</div>
        </CardContent>
      </Card>
    );
  }

  const sourceColors = {
    'FBI': '#dc2626',    // Red
    'ADL': '#2563eb',    // Blue  
    'NYPD': '#059669',   // Green
    'LAPD': '#d97706'    // Orange
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.source_summary.map((source) => (
          <Card key={source.source}>
            <CardContent className="p-4">
              <div className="text-center">
                <div 
                  className="text-2xl font-bold mb-1"
                  style={{ color: sourceColors[source.source as keyof typeof sourceColors] || '#666' }}
                >
                  {formatNumber(source.total_records)}
                </div>
                <div className="text-sm font-medium text-gray-700">{source.source}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {source.start_date.split('-')[0]} - {source.end_date.split('-')[0]}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>📊 Yearly Breakdown by Source ({data.years_covered})</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('bar')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'bar' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Bar Chart
              </button>
              <button
                onClick={() => setViewMode('line')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'line' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Line Chart
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'bar' ? (
                <BarChart data={data.yearly_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatNumber(value), name]}
                  />
                  <Legend />
                  {data.sources.map((source) => (
                    <Bar
                      key={source}
                      dataKey={source}
                      fill={sourceColors[source as keyof typeof sourceColors] || '#8884d8'}
                      name={source}
                    />
                  ))}
                </BarChart>
              ) : (
                <LineChart data={data.yearly_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatNumber(value), name]}
                  />
                  <Legend />
                  {data.sources.map((source) => (
                    <Line
                      key={source}
                      type="monotone"
                      dataKey={source}
                      stroke={sourceColors[source as keyof typeof sourceColors] || '#8884d8'}
                      strokeWidth={3}
                      name={source}
                      dot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Detailed Yearly Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-semibold">Year</th>
                  {data.sources.map((source) => (
                    <th
                      key={source}
                      className="text-right py-2 px-4 font-semibold"
                      style={{ color: sourceColors[source as keyof typeof sourceColors] || '#666' }}
                    >
                      {source}
                    </th>
                  ))}
                  <th className="text-right py-2 px-4 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.yearly_data.map((yearData) => {
                  const yearTotal = data.sources.reduce((sum, source) => sum + (yearData[source] || 0), 0);
                  return (
                    <tr key={yearData.year} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-medium">{yearData.year}</td>
                      {data.sources.map((source) => (
                        <td key={source} className="text-right py-2 px-4">
                          {formatNumber(yearData[source] || 0)}
                        </td>
                      ))}
                      <td className="text-right py-2 px-4 font-semibold">
                        {formatNumber(yearTotal)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 font-semibold bg-gray-50">
                  <td className="py-2 px-4">Total</td>
                  {data.sources.map((source) => {
                    const sourceTotal = data.source_summary.find(s => s.source === source)?.total_records || 0;
                    return (
                      <td key={source} className="text-right py-2 px-4">
                        {formatNumber(sourceTotal)}
                      </td>
                    );
                  })}
                  <td className="text-right py-2 px-4">
                    {formatNumber(data.total_records)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Information */}
      <Card>
        <CardHeader>
          <CardTitle>📅 Data Coverage by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.source_summary.map((source) => (
              <div key={source.source} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 
                    className="font-semibold text-lg"
                    style={{ color: sourceColors[source.source as keyof typeof sourceColors] || '#666' }}
                  >
                    {source.source}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {formatNumber(source.total_records)} incidents
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div><strong>Coverage:</strong> {source.start_date} to {source.end_date}</div>
                  <div><strong>Duration:</strong> {
                    Math.round((new Date(source.end_date).getTime() - new Date(source.start_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25) * 10) / 10
                  } years</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YearlyBreakdown;
