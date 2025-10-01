import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (coordinates: { lat: number; lng: number } | null) => void;
}

export const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const parseCoordinates = (input: string): { lat: number; lng: number } | null => {
    const cleaned = input.replace(/[°,]/g, ' ').trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);

    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);

      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }

    return null;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!searchTerm.trim()) {
      onSearch(null);
      return;
    }

    const coords = parseCoordinates(searchTerm);

    if (coords) {
      onSearch(coords);
    } else {
      setError('Invalid coordinates. Use format: lat lng (e.g., 37.7749 -122.4194)');
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setError('');
    onSearch(null);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by coordinates (e.g., 37.7749 -122.4194)"
            className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};
