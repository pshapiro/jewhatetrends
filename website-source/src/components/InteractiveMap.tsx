import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import USMap from './USMap';

interface MapDataPoint {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  incident_count: number;
}

interface MapData {
  major_cities: MapDataPoint[];
  summary: {
    total_incidents: number;
    cities_mapped: number;
    date_range: string;
  };
}

interface SelectedCity {
  city: string;
  state: string;
  incident_count: number;
}

interface StateData {
  state: string;
  state_name: string;
  incident_count: number;
}

interface StateAnalysis {
  state_data: StateData[];
  summary: {
    total_states: number;
    total_incidents: number;
  };
}

const InteractiveMap: React.FC = () => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [stateData, setStateData] = useState<StateAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);
  const [selectedState, setSelectedState] = useState<StateData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load map data
        const mapResponse = await fetch(`${import.meta.env.BASE_URL}data/map_analysis.json`);
        const mapDataResult = await mapResponse.json();
        setMapData(mapDataResult);

        // Load state data
        const stateResponse = await fetch(`${import.meta.env.BASE_URL}data/state_analysis.json`);
        const stateDataResult = await stateResponse.json();
        setStateData(stateDataResult);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getMarkerSize = (incidentCount: number): number => {
    if (incidentCount >= 1000) return 20;
    if (incidentCount >= 500) return 16;
    if (incidentCount >= 100) return 12;
    if (incidentCount >= 50) return 10;
    return 8;
  };

  const getMarkerColor = (incidentCount: number): string => {
    if (incidentCount >= 1000) return '#dc2626'; // Red
    if (incidentCount >= 500) return '#ea580c';  // Orange-red
    if (incidentCount >= 100) return '#d97706';  // Orange
    if (incidentCount >= 50) return '#ca8a04';   // Yellow
    return '#16a34a'; // Green
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🇺🇸 National Hate Crime Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-96">
              <div className="text-gray-500">Loading map data...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🇺🇸 National Hate Crime Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-500">Error loading map data</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const majorCities = mapData.major_cities || [];

  return (
    <div className="space-y-6">
      {/* Main Map */}
      <Card>
        <CardHeader>
          <CardTitle>🇺🇸 National Hate Crime Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Interactive US Map */}
            <div className="relative w-full h-96 border-2 border-gray-300 rounded-lg bg-white overflow-hidden shadow-sm">
              <USMap 
                className="absolute inset-0" 
                cities={mapData.major_cities}
                states={stateData?.state_data || []}
                onCityClick={(city) => setSelectedCity(city)}
                onStateClick={(state) => setSelectedState(state)}
              />
              
              {/* Title Overlay */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center z-10">
                <h3 className="text-lg font-bold text-gray-800 bg-white/90 px-4 py-2 rounded-md shadow-sm">
                  Antisemitic Hate Crime Incidents by Location
                </h3>
                <p className="text-sm text-gray-600 bg-white/80 px-3 py-1 rounded-md mt-1">
                  {mapData.summary.total_incidents.toLocaleString()} incidents across {mapData.summary.cities_mapped} cities
                </p>
              </div>
              
              {/* Map markers for major cities */}
              {majorCities.map((city, index) => {
                // Convert lat/lon to map coordinates (simplified projection)
                const x = ((city.longitude + 130) / 60) * 100; // Convert to percentage
                const y = ((50 - city.latitude) / 25) * 100; // Convert to percentage
                const size = getMarkerSize(city.incident_count);
                const color = getMarkerColor(city.incident_count);
                
                return (
                  <div
                    key={index}
                    className="absolute cursor-pointer hover:scale-110 transition-all z-20"
                    style={{
                      left: `${Math.max(2, Math.min(96, x))}%`,
                      top: `${Math.max(5, Math.min(90, y))}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => setSelectedCity(city)}
                  >
                    <div
                      className="rounded-full border-2 border-white shadow-lg"
                      style={{
                        width: size * 2,
                        height: size * 2,
                        backgroundColor: color,
                        opacity: 0.8
                      }}
                    />
                    {city.incident_count >= 500 && (
                      <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-800 bg-white/90 px-2 py-1 rounded whitespace-nowrap">
                        {city.city}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-white/95 border border-gray-300 rounded-lg p-3 shadow-lg z-10">
                <h4 className="text-sm font-bold text-gray-800 mb-2">Incident Count</h4>
                {[
                  { size: 10, color: '#dc2626', label: '1000+' },
                  { size: 8, color: '#ea580c', label: '500-999' },
                  { size: 6, color: '#d97706', label: '100-499' },
                  { size: 5, color: '#ca8a04', label: '50-99' },
                  { size: 4, color: '#16a34a', label: '<50' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center mb-1">
                    <div
                      className="rounded-full mr-2"
                      style={{
                        width: item.size * 2,
                        height: item.size * 2,
                        backgroundColor: item.color,
                        opacity: 0.8
                      }}
                    />
                    <span className="text-xs text-gray-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Major Cities Table */}
      <Card>
        <CardHeader>
          <CardTitle>🏙️ Major Cities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Rank</th>
                  <th className="text-left py-2 px-4">City</th>
                  <th className="text-left py-2 px-4">State</th>
                  <th className="text-right py-2 px-4">Incidents</th>
                </tr>
              </thead>
              <tbody>
                {majorCities.slice(0, 15).map((city, index) => (
                  <tr
                    key={index}
                    className={`border-b hover:bg-gray-50 cursor-pointer ${
                      selectedCity?.city === city.city ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedCity(city)}
                  >
                    <td className="py-2 px-4 font-medium">#{index + 1}</td>
                    <td className="py-2 px-4">{city.city}</td>
                    <td className="py-2 px-4">{city.state}</td>
                    <td className="py-2 px-4 text-right font-semibold">
                      {city.incident_count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Selected City Details */}
      {selectedCity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-800">
              📍 {selectedCity.city}, {selectedCity.state}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-800">
                  {selectedCity.incident_count.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600">Total Incidents</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">
                  {Math.round((selectedCity.incident_count / mapData.summary.total_incidents) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Of National Total</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-800">
                  {majorCities.findIndex(c => c.city === selectedCity.city) + 1}
                </div>
                <div className="text-sm text-orange-600">National Rank</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <button 
                onClick={() => setSelectedCity(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected State Details */}
      {selectedState && stateData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">
              🏛️ {selectedState.state_name} State
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-800">
                  {selectedState.incident_count.toLocaleString()}
                </div>
                <div className="text-sm text-green-600">Total Incidents</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">
                  {Math.round((selectedState.incident_count / stateData.summary.total_incidents) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Of National Total</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-800">
                  {stateData.state_data.findIndex(s => s.state === selectedState.state || s.state_name === selectedState.state_name) + 1}
                </div>
                <div className="text-sm text-blue-600">National Rank</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <button 
                onClick={() => setSelectedState(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* State Analysis Table */}
      {stateData && (
        <Card>
          <CardHeader>
            <CardTitle>🏛️ Incidents by State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800">
                  {stateData.summary.total_incidents.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600">
                  Total incidents across {stateData.summary.total_states} states
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Rank</th>
                    <th className="text-left py-2 px-4">State</th>
                    <th className="text-right py-2 px-4">Incidents</th>
                    <th className="text-right py-2 px-4">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stateData.state_data.slice(0, 15).map((state, index) => (
                    <tr
                      key={state.state}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-2 px-4 font-medium">#{index + 1}</td>
                      <td className="py-2 px-4">
                        <div>
                          <div className="font-medium">{state.state_name}</div>
                          <div className="text-sm text-gray-500">{state.state}</div>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right font-semibold">
                        {state.incident_count.toLocaleString()}
                      </td>
                      <td className="py-2 px-4 text-right text-sm text-gray-600">
                        {((state.incident_count / stateData.summary.total_incidents) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InteractiveMap;
