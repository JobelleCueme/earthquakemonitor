import type { VercelRequest, VercelResponse } from '@vercel/node';

const USGS_API_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';
const EMSC_API_BASE = 'https://www.seismicportal.eu/fdsnws/event/1/query';
const IRIS_API_BASE = 'https://service.iris.edu/fdsnws/event/1/query';
const GEONET_API_BASE = 'https://api.geonet.org.nz/quake';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { source = 'usgs', timeframe = 'week', minMag = '3' } = req.query as Record<string, string>;
  const { start, end } = getTimeRange(timeframe as 'hour' | 'day' | 'week' | 'month');

  try {
    let response;

    switch (source) {
      case 'usgs':
        response = await fetch(`${USGS_API_BASE}/all_${timeframe}.geojson`);
        res.status(200).json(await response.json());
        break;

      case 'emsc':
        response = await fetch(
          `${EMSC_API_BASE}?starttime=${start}&endtime=${end}&minmag=${minMag}&format=quakeml`
        );
        res.status(200).send(await response.text()); // XML from EMSC
        break;

      case 'iris':
        response = await fetch(
          `${IRIS_API_BASE}?starttime=${start}&endtime=${end}&minmag=${minMag}&format=geojson`
        );
        res.status(200).json(await response.json());
        break;

      case 'geonet':
        response = await fetch(GEONET_API_BASE);
        res.status(200).json(await response.json());
        break;

      default:
        res.status(400).json({ error: 'Unknown source' });
        break;
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch earthquakes', details: err });
  }
}
