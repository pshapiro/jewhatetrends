import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  Database, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Info,
  Calculator,
  Clock,
  Shield
} from 'lucide-react';
import moment from 'moment';

function DataSources() {
  const dataSources = [
    {
      name: 'NYPD Hate Crimes',
      description: 'New York Police Department hate crime incident data',
      url: 'https://data.cityofnewyork.us/Public-Safety/NYPD-Hate-Crimes/bqiq-cu78',
      coverage: 'New York City (5 boroughs)',
      updateFrequency: 'Daily',
      fields: ['Date', 'Location', 'Bias Type', 'Offense Category'],
      status: 'active'
    },
    {
      name: 'LAPD Crime Data',
      description: 'Los Angeles Police Department crime incident data with hate crime indicators',
      url: 'https://data.lacity.org/Public-Safety/Crime-Data-from-2020-to-Present/2nrs-mtv8',
      coverage: 'Los Angeles County',
      updateFrequency: 'Weekly',
      fields: ['Date', 'Area', 'Crime Code', 'Description'],
      status: 'active'
    },
    {
      name: 'FBI UCR Program',
      description: 'Uniform Crime Reporting Program hate crime statistics',
      url: 'https://ucr.fbi.gov/hate-crime',
      coverage: 'National (participating agencies)',
      updateFrequency: 'Annual',
      fields: ['Incident Type', 'Bias Motivation', 'Location Type'],
      status: 'planned'
    },
    {
      name: 'NCVS Corrections',
      description: 'National Crime Victimization Survey under-reporting adjustments',
      url: 'https://bjs.ojp.gov/data-collection/ncvs',
      coverage: 'National statistical adjustments',
      updateFrequency: 'As needed',
      fields: ['Correction Factors', 'Confidence Intervals'],
      status: 'applied'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Database className="h-5 w-5 mr-2" />
        Data Sources
      </h3>
      
      <div className="space-y-4">
        {dataSources.map((source, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h4 className="font-medium text-gray-900">{source.name}</h4>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    source.status === 'active' ? 'bg-green-100 text-green-800' :
                    source.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {source.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{source.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Coverage:</span>
                    <span className="text-gray-600 ml-1">{source.coverage}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Updates:</span>
                    <span className="text-gray-600 ml-1">{source.updateFrequency}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="font-medium text-gray-700 text-sm">Key Fields:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {source.fields.map((field, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="ml-4">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProcessingMethodology() {
  const steps = [
    {
      title: 'Data Collection',
      description: 'Automated collection from law enforcement APIs and open data portals',
      icon: Database,
      details: [
        'Real-time API monitoring for new incident reports',
        'Standardized data extraction protocols',
        'Automated validation and quality checks',
        'Backup data sources for reliability'
      ]
    },
    {
      title: 'Schema Unification',
      description: 'Standardization of different data formats into common structure',
      icon: Calculator,
      details: [
        'Mapping diverse field names to unified schema',
        'Date format standardization (MM/DD/YYYY)',
        'Geographic normalization (state/county codes)',
        'Bias motivation categorization and cleaning'
      ]
    },
    {
      title: 'Under-reporting Correction',
      description: 'Application of NCVS statistical corrections for known under-reporting',
      icon: Shield,
      details: [
        'NCVS correction factor: 1.45x for antisemitic incidents',
        'Based on national victimization survey data',
        'Applied uniformly across all data sources',
        'Documented uncertainty and confidence intervals'
      ]
    },
    {
      title: 'Quality Assurance',
      description: 'Validation, deduplication, and error checking processes',
      icon: CheckCircle,
      details: [
        'Duplicate incident detection and removal',
        'Date range validation and outlier detection',
        'Cross-source consistency checking',
        'Manual review of anomalous patterns'
      ]
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Calculator className="h-5 w-5 mr-2" />
        Processing Methodology
      </h3>

      <div className="space-y-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
                  <Icon className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">{step.title}</h4>
                <p className="text-gray-600 mb-3">{step.description}</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-red-400 mr-2">•</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatisticalMethods() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Calculator className="h-5 w-5 mr-2" />
        Statistical Methods & Forecasting
      </h3>

      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Under-reporting Correction</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Formula:</strong> Corrected_Incidents = Raw_Incidents × 1.45
            </p>
            <p className="text-sm text-gray-600">
              This correction factor is derived from the National Crime Victimization Survey (NCVS) 
              which indicates that hate crimes, particularly those targeting religious minorities, 
              are significantly under-reported to law enforcement.
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Trend Analysis</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Time series decomposition for seasonal patterns</li>
            <li>• Moving averages for trend identification</li>
            <li>• Change point detection for significant events</li>
            <li>• Confidence intervals based on historical variance</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Forecasting Model</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Simple trend extrapolation based on recent 6-month average</li>
            <li>• Standard deviation-based confidence intervals</li>
            <li>• Weekly projections derived from monthly data (÷ 4.33)</li>
            <li>• Model validation against historical out-of-sample data</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Risk Levels:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><span className="text-green-600">• Low:</span> &lt; 30 incidents/month</li>
                <li><span className="text-yellow-600">• Moderate:</span> 30-60 incidents/month</li>
                <li><span className="text-orange-600">• High:</span> 60-100 incidents/month</li>
                <li><span className="text-red-600">• Critical:</span> &gt; 100 incidents/month</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Trend Indicators:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Month-over-month change &gt; 10% = Increasing</li>
                <li>• Month-over-month change &lt; -10% = Decreasing</li>
                <li>• Otherwise = Stable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LimitationsDisclaimer() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        Limitations & Disclaimers
      </h3>

      <div className="space-y-4 text-yellow-700">
        <div>
          <h4 className="font-medium mb-2">Data Coverage Limitations</h4>
          <ul className="text-sm space-y-1">
            <li>• Data primarily from NYPD and LAPD jurisdictions</li>
            <li>• Rural and smaller jurisdictions may be under-represented</li>
            <li>• Reporting practices vary significantly across agencies</li>
            <li>• Some incidents may be classified differently across jurisdictions</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-2">Statistical Limitations</h4>
          <ul className="text-sm space-y-1">
            <li>• Under-reporting correction is an estimate with uncertainty</li>
            <li>• Forecasts are projections, not predictions</li>
            <li>• Seasonal patterns may not account for unique events</li>
            <li>• Small sample sizes in some geographic areas</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-2">Interpretation Guidelines</h4>
          <ul className="text-sm space-y-1">
            <li>• Focus on trends rather than absolute numbers</li>
            <li>• Consider confidence intervals in all projections</li>
            <li>• Correlation does not imply causation</li>
            <li>• External events can significantly impact patterns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function DataExport() {
  const { data } = useData();

  const downloadReport = () => {
    // Create a simple text report
    const reportContent = `
HATE CRIME TRACKING SYSTEM - DATA METHODOLOGY REPORT
Generated: ${moment().format('MMMM DD, YYYY HH:mm')}

=== DATA SOURCES ===
1. NYPD Hate Crimes Database
2. LAPD Crime Data with Hate Crime Indicators
3. NCVS Under-reporting Corrections

=== PROCESSING METHODOLOGY ===
1. Data Collection: Automated API monitoring
2. Schema Unification: Standardized field mapping
3. Under-reporting Correction: 1.45x factor for antisemitic incidents
4. Quality Assurance: Validation and deduplication

=== STATISTICAL METHODS ===
- Trend Analysis: Time series decomposition
- Forecasting: Simple trend extrapolation
- Risk Assessment: Thresholds based on incident volume
- Confidence Intervals: Standard deviation-based

=== CURRENT DATASET SUMMARY ===
Total Records: ${data?.records.length || 'Loading...'}
Date Range: ${data?.records.length ? moment(data.records[0].parsed_date).format('MM/YYYY') + ' - ' + moment(data.records[data.records.length - 1].parsed_date).format('MM/YYYY') : 'Loading...'}
Geographic Coverage: ${data?.stateData.length || 'Loading...'} states
Data Sources: NYPD, LAPD

=== LIMITATIONS ===
- Limited geographic coverage
- Under-reporting corrections are estimates
- Forecasts are projections with uncertainty
- External events can significantly impact patterns

For questions about this methodology, please refer to the full documentation.
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hate_crime_methodology_report_${moment().format('YYYY-MM-DD')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Download className="h-5 w-5 mr-2" />
        Documentation & Reports
      </h3>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Methodology Report</h4>
          <p className="text-sm text-gray-600 mb-3">
            Complete documentation of data sources, processing methods, and statistical techniques.
          </p>
          <button
            onClick={downloadReport}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            Download Report
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Source Documentation</h4>
          <p className="text-sm text-gray-600 mb-3">
            Links to original data sources and methodology papers.
          </p>
          <div className="space-y-2">
            <a
              href="https://bjs.ojp.gov/content/pub/pdf/hcv0919.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              NCVS Hate Crime Victimization Report
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">Transparency Commitment</h4>
            <p className="text-sm text-blue-700 mt-1">
              We are committed to full transparency in our methodology and data processing. 
              All statistical methods, correction factors, and limitations are documented 
              and made publicly available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Methodology() {
  const { data, loading } = useData();
  const [activeTab, setActiveTab] = useState('sources');

  const tabs = [
    { id: 'sources', name: 'Data Sources', icon: Database },
    { id: 'processing', name: 'Processing', icon: Calculator },
    { id: 'statistics', name: 'Statistics', icon: Shield },
    { id: 'documentation', name: 'Documentation', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Data Sources & Methodology</h1>
          <p className="text-lg text-gray-600">
            Comprehensive documentation of our data collection, processing, and analysis methodologies.
            Transparency and scientific rigor are fundamental to our approach.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.name}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'sources' && <DataSources />}
          {activeTab === 'processing' && <ProcessingMethodology />}
          {activeTab === 'statistics' && <StatisticalMethods />}
          {activeTab === 'documentation' && <DataExport />}
        </div>

        {/* Always show limitations */}
        <div className="mt-8">
          <LimitationsDisclaimer />
        </div>

        {/* Dataset Summary */}
        {data && !loading && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Current Dataset Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{data.records.length.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Records</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {moment(data.records[0]?.parsed_date).format('MMM YYYY')} - {moment(data.records[data.records.length - 1]?.parsed_date).format('MMM YYYY')}
                </p>
                <p className="text-sm text-gray-600">Date Range</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{data.stateData.length}</p>
                <p className="text-sm text-gray-600">States Covered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{moment().format('MMM DD, YYYY')}</p>
                <p className="text-sm text-gray-600">Last Updated</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
