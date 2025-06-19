import React from 'react';
import { AlertTriangle, Calendar, Database } from 'lucide-react';

interface DataCoverageInfo {
  source: string;
  startDate: string;
  endDate: string;
  gapMonths: number;
  color: string;
}

const DataCoverageWarning: React.FC = () => {
  const dataCoverage: DataCoverageInfo[] = [
    {
      source: "FBI",
      startDate: "Jan 2022",
      endDate: "Dec 2023",
      gapMonths: 18,
      color: "bg-blue-100 border-blue-300"
    },
    {
      source: "NYPD", 
      startDate: "Jan 2019",
      endDate: "Mar 2025",
      gapMonths: 0,
      color: "bg-green-100 border-green-300"
    },
    {
      source: "LAPD",
      startDate: "Nov 2024", 
      endDate: "Mar 2025",
      gapMonths: 0,
      color: "bg-purple-100 border-purple-300"
    },
    {
      source: "ADL",
      startDate: "Jun 2022",
      endDate: "Jun 2025", 
      gapMonths: 0,
      color: "bg-green-100 border-green-300"
    }
  ];

  return (
    <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">
            ⚠️ Data Coverage Limitations
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            <strong>Note:</strong> Most data sources are current through 2025. FBI data has an 18-month lag (last updated Dec 2023), which is typical for federal reporting cycles.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {dataCoverage.map((source) => (
              <div key={source.source} className={`p-3 rounded border ${source.color}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-800">{source.source}</span>
                  <Database className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-xs text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {source.startDate} → {source.endDate}
                  </div>
                  {source.gapMonths > 0 && (
                    <div className="text-red-600 font-medium mt-1">
                      ⚠️ {source.gapMonths}+ month gap to present
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-amber-700 space-y-1">
            <p><strong>Impact on Analysis:</strong></p>
            <p>• <strong>Search Correlation:</strong> Full data available for overlapping periods</p>
            <p>• <strong>Forecasting:</strong> Uses current data through 2025 where available</p>
            <p>• <strong>Current Trends:</strong> 2024-2025 data includes ADL, NYPD, and LAPD</p>
            <p>• <strong>2024-2025 Data:</strong> ADL (2,500 records), NYPD (1,660 records), LAPD (13 records)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCoverageWarning;