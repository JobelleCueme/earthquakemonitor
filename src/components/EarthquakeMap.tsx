import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Earthquake } from "../types/earthquake";
import { getMagnitudeColor, getMagnitudeSize } from "../services/earthquakeService";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface EarthquakeMapProps {
  earthquakes: Earthquake[];
  onSelectEarthquake: (earthquake: Earthquake) => void;
  selectedEarthquake: Earthquake | null;
  searchCoordinates: { lat: number; lng: number } | null;
  userLocation: { lat: number; lng: number } | null;
}

export const EarthquakeMap = ({
  earthquakes,
  onSelectEarthquake,
  selectedEarthquake,
  searchCoordinates,
  userLocation,
}: EarthquakeMapProps) => {
  const center = searchCoordinates || userLocation || { lat: 20, lng: 0 };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-slate-700">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={searchCoordinates ? 5 : 2}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Earthquake markers */}
        {earthquakes.map((quake) => {
          const [lng, lat] = quake.geometry.coordinates;
          const isSelected = selectedEarthquake?.id === quake.id;
          const color = getMagnitudeColor(quake.properties.mag);

          // use pixel size (CircleMarker radius is in px, not meters)
          const pixelSize = Math.max(2, getMagnitudeSize(quake.properties.mag));

          return (
            <CircleMarker
              key={quake.id}
              center={[lat, lng]}
              radius={pixelSize}
              pathOptions={{
                color: isSelected ? "white" : color,
                fillColor: color,
                fillOpacity: isSelected ? 0.9 : 0.6,
                weight: isSelected ? 2 : 1,
              }}
              eventHandlers={{
                click: () => onSelectEarthquake(quake),
              }}
            >
              <Popup>
                <strong>{quake.properties.place || "Unknown"}</strong>
                <br />
                Magnitude: {quake.properties.mag}
                <br />
                {new Date(quake.properties.time).toLocaleString()}
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Search marker */}
        {searchCoordinates && (
          <Marker position={[searchCoordinates.lat, searchCoordinates.lng]}>
            <Popup>Search Location</Popup>
          </Marker>
        )}

        {/* User marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>You are here</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
