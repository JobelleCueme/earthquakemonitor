import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, Waves, RefreshCw, MapPin } from 'lucide-react';
import { Earthquake } from './types/earthquake';
import { fetchEarthquakes } from './services/earthquakeService';
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

  // Filters
  const [minMagnitude, setMinMagnitude] = useState(0);
  const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'week' | 'month'>('week');
  const [apiSource, setApiSource] = useState<'usgs' | 'emsc' | 'iris' | 'geonet'>('usgs');

  // Location & refresh
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
      if (data.features) setEarthquakes(data.features);
      else setEarthquakes([]);
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
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(location);
        setSearchCoordinates(location);
      },
      (error) => console.error('Error getting location:', error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // --- INITIAL LOAD ---
  useEffect(() => { loadEarthquakes(); }, [loadEarthquakes]);

  // --- AUTO REFRESH ---
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const interval = setInterval(loadEarthquakes, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, loadEarthquakes]);

  // --- FILTER EARTHQUAKES ---
  useEffect(() => {
    const filtered = earthquakes.filter(q => q.properties?.mag >= minMagnitude);
    setFilteredEarthquakes(filtered);
  }, [earthquakes, minMagnitude]);

  // --- ALERT HANDLER ---
  const alertForNearbyEarthquakes = useCallback(() => {
    if (!searchCoordinates) return;
    filteredEarthquakes.forEach(quake => {
      const quakeLat = quake.geometry.coordinates[1];
      const quakeLng = quake.geometry.coordinates[0];
      const distance = getDistance(searchCoordinates.lat, searchCoordinates.lng, quakeLat, quakeLng);
      if (quake.properties.mag >= minMagnitude && distance <= 100) {
        alert(`Earthquake nearby! Mag: ${quake.properties.mag}, Location: ${quake.properties.place}`);
        const audio = new Audio('/alert.mp3'); audio.play();
      }
    });
  }, [filteredEarthquakes, searchCoordinates, minMagnitude]);

  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2)**2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2)**2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  useEffect(() => {
    if (filteredEarthquakes.length > 0) alertForNearbyEarthquakes();
  }, [filteredEarthquakes, alertForNearbyEarthquakes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Waves className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-100">
                  Earthquake Detector
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Real-time seismic activity monitoring
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {userLocation && (
                <button
                  onClick={() => setSearchCoordinates(userLocation)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm"
                  title="Go to my location"
                >
                  <MapPin className="w-4 h-4" /> My Location
                </button>
              )}

              <button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${autoRefreshEnabled
                  ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'}`}
                title={autoRefreshEnabled ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
              >
                <div className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                Live
              </button>

              <button
                onClick={loadEarthquakes}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <SearchBar onSearch={setSearchCoordinates} />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <FilterControls
                minMagnitude={minMagnitude}
                onMinMagnitudeChange={setMinMagnitude}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
              />
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

        {/* Map + Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 h-80 sm:h-96 md:h-[500px] lg:h-[600px]">
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

          {/* Recent Events */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-100">Recent Events</h2>
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs sm:text-sm text-blue-400 font-medium">
                  {filteredEarthquakes.length} events
                </span>
              </div>

              <div className="space-y-3 max-h-64 sm:max-h-96 md:max-h-[400px] lg:max-h-[540px] overflow-y-auto custom-scrollbar">
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
