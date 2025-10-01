import { EarthquakeResponse } from '../types/earthquake';

// --- UNIFIED FETCHER USING SERVERLESS BACKEND ---
export type EarthquakeSource = 'usgs' | 'emsc' | 'iris' | 'geonet';

/**
 * Fetch earthquakes from the serverless backend.
 * All sources are proxied through `/api/service` to avoid CORS issues.
 */
export const fetchEarthquakes = async (
  source: EarthquakeSource,
  timeframe: 'hour' | 'day' | 'week' | 'month' = 'week',
  minMag: number = 3
): Promise<EarthquakeResponse> => {
  const url = `/api/service?source=${source}&timeframe=${timeframe}&minMag=${minMag}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${source} earthquakes`);
  return response.json(); // All sources return JSON now
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
