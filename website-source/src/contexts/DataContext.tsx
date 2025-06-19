import React, { createContext, useContext, useEffect, useState } from 'react';
import { ProcessedData, RiskAssessment, loadAndProcessData, calculateRiskAssessment } from '../utils/dataProcessor';

interface DataContextType {
  data: ProcessedData | null;
  riskAssessment: RiskAssessment | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ProcessedData | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const processedData = await loadAndProcessData();
      setData(processedData);
      
      const assessment = calculateRiskAssessment(processedData.timeSeriesData);
      setRiskAssessment(assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <DataContext.Provider value={{ data, riskAssessment, loading, error, refreshData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
