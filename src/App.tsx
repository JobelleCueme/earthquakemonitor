import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, Waves, RefreshCw, MapPin } from 'lucide-react';
import { Earthquake } from './types/earthquake';

import { fetchEarthquakes } from './services/earthquakeService'; // ✅ use unified fetcher
import { EarthquakeMap } from './components/EarthquakeMap';
import { EarthquakeCard } from './components/EarthquakeCard';
import { SearchBar } from './components/SearchBar';
import { FilterControls } from './components/FilterControls';
import "leaflet/dist/leaflet.css";

const AUTO_REFRESH_INTERVAL = 60000;

function App() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [filteredEarthquakes, setFilteredEarthquakes] = useState<Earthquake[]>([]);
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [minMagnitude, setMinMagnitude] = useState(0);
  const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'week' | 'month'>('week');
  const [apiSource, setApiSource] = useState<'usgs' | 'emsc' | 'iris' | 'geonet'>('usgs');

  // location & refresh
  const [searchCoordinates, setSearchCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // --- FETCH HANDLER ---
  const loadEarthquakes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchEarthquakes(apiSource, timeframe, minMagnitude);

      // normalize response (all services should return geojson-like with `features`)
      if (data.features) {
        setEarthquakes(data.features);
      } else {
        setEarthquakes([]);
      }

      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to load earthquake data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [timeframe, apiSource, minMagnitude]);

  // --- USER LOCATION ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setSearchCoordinates(location);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);


  // --- INITIAL LOAD ---
  useEffect(() => {
    loadEarthquakes();
  }, [loadEarthquakes]);

  // --- AUTO REFRESH ---
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const interval = setInterval(() => {
      loadEarthquakes();
    }, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, loadEarthquakes]);

  // --- FILTER EARTHQUAKES ---
  useEffect(() => {
    const filtered = earthquakes.filter(
      quake => quake.properties?.mag >= minMagnitude
    );
    setFilteredEarthquakes(filtered);
  }, [earthquakes, minMagnitude]);

  // --- ALERT HANDLER ---
  const alertForNearbyEarthquakes = useCallback(() => {
    if (!searchCoordinates) return;

    filteredEarthquakes.forEach(quake => {
      const quakeLat = quake.geometry.coordinates[1];
      const quakeLng = quake.geometry.coordinates[0];
      const distance = getDistance(searchCoordinates.lat, searchCoordinates.lng, quakeLat, quakeLng);

      // Alert if within 100 km and above minMagnitude
      if (quake.properties.mag >= minMagnitude && distance <= 100) {
        // Browser alert
        alert(`Earthquake detected nearby! Magnitude: ${quake.properties.mag}, Location: ${quake.properties.place}`);

        // Play sound alert (add alert.mp3 in public folder)
        const audio = new Audio('/alert.mp3');
        audio.play();
      }
    });
  }, [filteredEarthquakes, searchCoordinates, minMagnitude]);

  // --- HELPER FUNCTION: distance in km ---
  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth radius km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // --- TRIGGER ALERT ON FILTERED EARTHQUAKES UPDATE ---
  useEffect(() => {
    if (filteredEarthquakes.length > 0) {
      alertForNearbyEarthquakes();
    }
  }, [filteredEarthquakes, alertForNearbyEarthquakes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Waves className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-100">
                  Earthquake Detector
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Real-time seismic activity monitoring
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {userLocation && (
                <button
                  onClick={() => setSearchCoordinates(userLocation)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                  title="Go to my location"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">My Location</span>
                </button>
              )}

              <button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-lg transition-colors ${autoRefreshEnabled
                    ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  }`}
                title={autoRefreshEnabled ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
              >
                <div className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-sm">Live</span>
              </button>

              <button
                onClick={loadEarthquakes}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <SearchBar onSearch={setSearchCoordinates} />

            <div className="flex items-center justify-between gap-4">
              <FilterControls
                minMagnitude={minMagnitude}
                onMinMagnitudeChange={setMinMagnitude}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
              />

              {/* API Selector */}
              <select
                value={apiSource}
                onChange={(e) => setApiSource(e.target.value as any)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
              >
                <option value="usgs">USGS (Global)</option>
                <option value="emsc">EMSC (Europe/Global)</option>
                <option value="iris">IRIS (Research Data)</option>
                <option value="geonet">GeoNet (New Zealand)</option>
              </select>

              {lastUpdate && (
                <div className="text-xs text-slate-500 whitespace-nowrap">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 h-[600px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                    <p className="text-slate-400">Loading earthquake data...</p>
                  </div>
                </div>
              ) : (
                <EarthquakeMap
                  earthquakes={filteredEarthquakes}
                  onSelectEarthquake={setSelectedEarthquake}
                  selectedEarthquake={selectedEarthquake}
                  searchCoordinates={searchCoordinates}
                  userLocation={userLocation}
                />
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-100">
                  Recent Events
                </h2>
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400 font-medium">
                  {filteredEarthquakes.length} events
                </span>
              </div>

              <div className="space-y-3 max-h-[540px] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 text-sm">Loading events...</p>
                  </div>
                ) : filteredEarthquakes.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No events found</p>
                  </div>
                ) : (
                  filteredEarthquakes
                    .sort((a, b) => b.properties.time - a.properties.time)
                    .map(quake => (
                      <EarthquakeCard
                        key={quake.id}
                        earthquake={quake}
                        onClick={() => setSelectedEarthquake(quake)}
                        isSelected={selectedEarthquake?.id === quake.id}
                      />
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
