import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TrendsAnalytics } from './components/TrendsAnalytics';
import InteractiveMap from './components/InteractiveMap';
import TrendsCorrelation from './components/TrendsCorrelation';
import { Methodology } from './components/Methodology';
import './App.css';

function App() {
  return (
    <DataProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/trends" element={<TrendsAnalytics />} />
              <Route path="/map" element={<InteractiveMap />} />
              <Route path="/correlation" element={<TrendsCorrelation />} />
              <Route path="/methodology" element={<Methodology />} />
            </Routes>
          </main>
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;
