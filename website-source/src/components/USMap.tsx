import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from 'react-simple-maps';

interface CityMarker {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  incident_count: number;
}

interface StateData {
  state: string;
  state_name: string;
  incident_count: number;
}

interface USMapProps {
  width?: number;
  height?: number;
  className?: string;
  cities?: CityMarker[];
  states?: StateData[];
  onCityClick?: (city: CityMarker) => void;
  onStateClick?: (state: StateData) => void;
}

const USMap: React.FC<USMapProps> = ({ 
  width = 900, 
  height = 500, 
  className = "",
  cities = [],
  states = [],
  onCityClick,
  onStateClick
}) => {
  // US states TopoJSON URL (from a reliable CDN)
  const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

  // Create a map of state data for quick lookup
  const stateDataMap = React.useMemo(() => {
    const map = new Map<string, StateData>();
    states.forEach(state => {
      // Handle both state codes and full names
      map.set(state.state, state);
      map.set(state.state_name, state);
    });
    return map;
  }, [states]);

  // Color scale for choropleth
  const getStateColor = (stateName: string, stateCode?: string): string => {
    const stateData = stateDataMap.get(stateName) || stateDataMap.get(stateCode || '');
    if (!stateData) return '#f3f4f6'; // Light gray for no data
    
    const count = stateData.incident_count;
    if (count >= 1000) return '#7f1d1d';      // Very dark red
    if (count >= 500) return '#b91c1c';       // Dark red  
    if (count >= 200) return '#dc2626';       // Red
    if (count >= 100) return '#ef4444';       // Light red
    if (count >= 50) return '#f87171';        // Very light red
    if (count >= 10) return '#fca5a5';        // Pink
    if (count > 0) return '#fecaca';          // Very light pink
    return '#f3f4f6';                         // Light gray
  };

  // Get state data for tooltip
  const getStateData = (stateName: string, stateCode?: string): StateData | null => {
    return stateDataMap.get(stateName) || stateDataMap.get(stateCode || '') || null;
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <ComposableMap
        projection="geoAlbersUsa"
        width={width}
        height={height}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateName = geo.properties.name;
                const stateCode = geo.id;
                const fillColor = getStateColor(stateName, stateCode);
                const stateData = getStateData(stateName, stateCode);
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="#9ca3af"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        fill: fillColor,
                        stroke: "#9ca3af",
                        strokeWidth: 0.5,
                        outline: "none",
                        cursor: stateData ? "pointer" : "default"
                      },
                      hover: {
                        fill: fillColor === '#f3f4f6' ? "#e5e7eb" : fillColor,
                        stroke: "#6b7280",
                        strokeWidth: 1,
                        outline: "none",
                        filter: "brightness(1.1)"
                      },
                      pressed: {
                        fill: fillColor,
                        stroke: "#6b7280",
                        strokeWidth: 1,
                        outline: "none"
                      }
                    }}
                    onClick={() => {
                      if (stateData && onStateClick) {
                        onStateClick(stateData);
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
          
          {/* City markers */}
          {cities.map((city, index) => {
            const markerSize = Math.min(40, Math.max(8, Math.sqrt(city.incident_count) * 2));
            
            return (
              <Marker
                key={index}
                coordinates={[city.longitude, city.latitude]}
              >
                <circle
                  r={markerSize}
                  fill="rgba(220, 38, 38, 0.8)"
                  stroke="#dc2626"
                  strokeWidth={2}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onCityClick && onCityClick(city)}
                  onMouseEnter={(e) => {
                    (e.target as SVGCircleElement).setAttribute('fill', '#b91c1c');
                  }}
                  onMouseLeave={(e) => {
                    (e.target as SVGCircleElement).setAttribute('fill', 'rgba(220, 38, 38, 0.8)');
                  }}
                />
                <text
                  textAnchor="middle"
                  y={markerSize + 15}
                  style={{
                    fontFamily: 'system-ui',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    fill: '#111827',
                    pointerEvents: 'none'
                  }}
                >
                  {city.city}
                </text>
                <text
                  textAnchor="middle"
                  y={markerSize + 28}
                  style={{
                    fontFamily: 'system-ui',
                    fontSize: '10px',
                    fill: '#6b7280',
                    pointerEvents: 'none'
                  }}
                >
                  {city.incident_count.toLocaleString()} incidents
                </text>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border">
        <h4 className="text-sm font-semibold mb-2 text-gray-800">Incidents by State</h4>
        <div className="space-y-1">
          {[
            { label: '1000+', color: '#7f1d1d' },
            { label: '500-999', color: '#b91c1c' },
            { label: '200-499', color: '#dc2626' },
            { label: '100-199', color: '#ef4444' },
            { label: '50-99', color: '#f87171' },
            { label: '10-49', color: '#fca5a5' },
            { label: '1-9', color: '#fecaca' },
            { label: 'No data', color: '#f3f4f6' }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-4 h-3 border border-gray-300"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* City Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
        <h4 className="text-sm font-semibold mb-2 text-gray-800">City Markers</h4>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-red-700" />
          <span className="text-xs text-gray-600">Major cities</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Click for details</p>
      </div>
    </div>
  );
};

export default USMap;
