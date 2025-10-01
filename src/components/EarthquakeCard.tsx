import { Earthquake } from '../types/earthquake';
import { getMagnitudeColor } from '../services/earthquakeService';
import { MapPin, Clock, Activity } from 'lucide-react';

interface EarthquakeCardProps {
  earthquake: Earthquake;
  onClick: () => void;
  isSelected: boolean;
}

export const EarthquakeCard = ({ earthquake, onClick, isSelected }: EarthquakeCardProps) => {
  const { properties, geometry } = earthquake;
  const [longitude, latitude, depth] = geometry.coordinates as [number?, number?, number?];
  const magnitudeColor = getMagnitudeColor(properties.mag);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:border-slate-500 ${
        isSelected
          ? "bg-slate-800 border-slate-500"
          : "bg-slate-900/50 border-slate-700 hover:bg-slate-800/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-slate-100 font-medium text-sm mb-2 truncate">
            {properties.place || "Unknown location"}
          </h3>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {properties.time ? formatDate(properties.time) : "Unknown time"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {latitude != null && longitude != null
                  ? `${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`
                  : "Coordinates unavailable"}
                {depth != null && ` (${depth.toFixed(1)}km deep)`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <Activity className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="capitalize">
                {properties.type || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-center w-12 h-12 rounded-lg text-white font-bold text-lg flex-shrink-0"
          style={{ backgroundColor: magnitudeColor }}
        >
          {properties.mag != null ? properties.mag.toFixed(1) : "N/A"}
        </div>
      </div>
    </div>
  );
};
