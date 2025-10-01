import { EarthquakeResponse } from '../types/earthquake';

// --- API BASES ---
const USGS_API_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';
const EMSC_API_BASE = 'https://www.seismicportal.eu/fdsnws/event/1/query';
const IRIS_API_BASE = 'https://service.iris.edu/fdsnws/event/1/query';
const GEONET_API_BASE = 'https://api.geonet.org.nz/quake';

// --- HELPERS ---
const getTimeRange = (timeframe: 'hour' | 'day' | 'week' | 'month') => {
  const now = new Date();
  let start: Date;

  switch (timeframe) {
    case 'hour':
      start = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      break;
    case 'day':
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { start: start.toISOString(), end: now.toISOString() };
};

// --- INDIVIDUAL FETCHERS ---
export const fetchUSGSEarthquakes = async (
  timeframe: 'hour' | 'day' | 'week' | 'month' = 'week'
) => {
  const endpoint = `${USGS_API_BASE}/all_${timeframe}.geojson`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error('Failed to fetch USGS earthquakes');
  return response.json();
};

export const fetchEMSCEarthquakes = async (startTime: string, endTime: string, minMag: number = 3) => {
  const url = `${EMSC_API_BASE}?starttime=${startTime}&endtime=${endTime}&minmag=${minMag}&format=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch EMSC earthquakes');
  return response.json();
};

export const fetchIRISEarthquakes = async (startTime: string, endTime: string, minMag: number = 3) => {
  const url = `${IRIS_API_BASE}?starttime=${startTime}&endtime=${endTime}&minmag=${minMag}&format=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch IRIS earthquakes');
  return response.json();
};

export const fetchGeoNetEarthquakes = async () => {
  const response = await fetch(GEONET_API_BASE);
  if (!response.ok) throw new Error('Failed to fetch GeoNet earthquakes');
  return response.json();
};

// --- UNIFIED FETCHER ---
export type EarthquakeSource = 'usgs' | 'emsc' | 'iris' | 'geonet';

export const fetchEarthquakes = async (
  source: EarthquakeSource,
  timeframe: 'hour' | 'day' | 'week' | 'month' = 'week',
  minMag: number = 3
): Promise<EarthquakeResponse> => {
  const { start, end } = getTimeRange(timeframe);

  switch (source) {
    case 'usgs':
      return fetchUSGSEarthquakes(timeframe);
    case 'emsc':
      return fetchEMSCEarthquakes(start, end, minMag);
    case 'iris':
      return fetchIRISEarthquakes(start, end, minMag);
    case 'geonet':
      return fetchGeoNetEarthquakes();
    default:
      throw new Error(`Unknown source: ${source}`);
  }
};

// --- HELPERS FOR MAP VISUALIZATION ---
export const getMagnitudeColor = (magnitude: number): string => {
  if (magnitude >= 7) return '#dc2626'; // red
  if (magnitude >= 6) return '#ea580c'; // orange
  if (magnitude >= 5) return '#f59e0b'; // amber
  if (magnitude >= 4) return '#eab308'; // yellow
  if (magnitude >= 3) return '#84cc16'; // lime
  return '#22c55e'; // green
};

export const getMagnitudeSize = (magnitude: number): number => {
  if (magnitude >= 7) return 24;
  if (magnitude >= 6) return 20;
  if (magnitude >= 5) return 16;
  if (magnitude >= 4) return 12;
  if (magnitude >= 3) return 10;
  return 8;
};
