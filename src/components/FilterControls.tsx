import { Filter } from 'lucide-react';

interface FilterControlsProps {
  minMagnitude: number;
  onMinMagnitudeChange: (value: number) => void;
  timeframe: string;
  onTimeframeChange: (value: string) => void;
}

export const FilterControls = ({
  minMagnitude,
  onMinMagnitudeChange,
  timeframe,
  onTimeframeChange
}: FilterControlsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
          <Filter className="w-4 h-4" />
          Minimum Magnitude: {minMagnitude.toFixed(1)}
        </label>
        <input
          type="range"
          min="0"
          max="7"
          step="0.5"
          value={minMagnitude}
          onChange={(e) => onMinMagnitudeChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      <div className="flex-1">
        <label className="block text-sm text-slate-300 mb-2">
          Time Period
        </label>
        <select
          value={timeframe}
          onChange={(e) => onTimeframeChange(e.target.value)}
          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
        >
          <option value="hour">Past Hour</option>
          <option value="day">Past Day</option>
          <option value="week">Past Week</option>
          <option value="month">Past Month</option>
        </select>
      </div>
    </div>
  );
};
