import { EarthquakeResponse } from '../types/earthquake';

const USGS_API_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';

export const fetchEarthquakes = async (timeframe: string = 'week'): Promise<EarthquakeResponse> => {
  const endpoint = `${USGS_API_BASE}/all_${timeframe}.geojson`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error('Failed to fetch earthquake data');
  }

  return response.json();
};

export const getMagnitudeColor = (magnitude: number): string => {
  if (magnitude >= 7) return '#dc2626'; // red-600
  if (magnitude >= 6) return '#ea580c'; // orange-600
  if (magnitude >= 5) return '#f59e0b'; // amber-500
  if (magnitude >= 4) return '#eab308'; // yellow-500
  if (magnitude >= 3) return '#84cc16'; // lime-500
  return '#22c55e'; // green-500
};

export const getMagnitudeSize = (magnitude: number): number => {
  if (magnitude >= 7) return 24;
  if (magnitude >= 6) return 20;
  if (magnitude >= 5) return 16;
  if (magnitude >= 4) return 12;
  if (magnitude >= 3) return 10;
  return 8;
};
