'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issues with Leaflet in Webpack environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

interface MapComponentProps {
  latitude?: number;
  longitude?: number;
  popupText?: string;
  markers?: Array<{ lat: number; lng: number; popupText: string }>;
}

function RecenterAutomatically({ lat, lng, markers }: { lat?: number; lng?: number, markers?: Array<{ lat: number; lng: number }> }) {
  const map = useMap();

  React.useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (lat && lng) {
      map.setView([lat, lng]);
    }
  }, [lat, lng, markers, map]);

  return null;
}

export function MapComponent({ latitude, longitude, popupText = 'Last Known Location', markers = [] }: MapComponentProps) {
  // Default to Mecca if no data provided
  const defaultPos: [number, number] = [21.4225, 39.8262];

  // Determine center (fallback to first marker or default)
  const center: [number, number] =
    (latitude && longitude) ? [latitude, longitude] :
      (markers.length > 0) ? [markers[0].lat, markers[0].lng] :
        defaultPos;

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
      <RecenterAutomatically lat={latitude} lng={longitude} markers={markers} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render single marker if lat/lng provided */}
      {latitude && longitude && (
        <Marker position={[latitude, longitude]}>
          <Popup>
            {popupText} <br /> Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
          </Popup>
        </Marker>
      )}

      {/* Render multiple markers */}
      {markers.map((marker, idx) => (
        <Marker key={idx} position={[marker.lat, marker.lng]}>
          <Popup>
            {marker.popupText}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
