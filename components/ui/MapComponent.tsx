'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
  latitude: number;
  longitude: number;
  popupText?: string;
}

export function MapComponent({ latitude, longitude, popupText = 'Last Known Location' }: MapComponentProps) {
  const position: [number, number] = [latitude, longitude];

  return (
    <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          {popupText} <br /> Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
