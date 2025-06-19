import React from 'react';
import { useData } from '../contexts/DataContext';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Calendar, MapPin, BarChart, Shield, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import moment from 'moment';
import DataCoverageWarning from './DataCoverageWarning';
import YearlyBreakdown from './YearlyBreakdown';

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
      name: 'ADL', 
      count: sourceStats['ADL'] || 0, 
      icon: '🛡️', 
      description: 'Anti-Defamation League',
      coverage: 'National Coverage',
      verified: adlVerified
    },
    { 
      name: 'NYPD', 
      count: sourceStats['NYPD'] || 0, 
      icon: '🗽', 
      description: 'New York Police Department',
      coverage: 'NYC Metro Area'
    },
    { 
      name: 'FBI', 
      count: sourceStats['FBI'] || 0, 
      icon: '🏛️', 
      description: 'Federal Bureau of Investigation',
      coverage: '20 States Coverage'
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
          This dataset combines FBI national data, local police reports (NYPD, LAPD), and ADL's comprehensive incident tracking 
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
          Real-time tracking and analysis powered by FBI, NYPD, LAPD, and ADL data sources
        </p>
      </div>

      <DataCoverageWarning />

      <StatsOverview />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <RiskMeter />
        <DataSourceBreakdown />
      </div>
      
      {/* Yearly Breakdown by Source */}
      <YearlyBreakdown />
    </div>
  );
}

export { Dashboard };