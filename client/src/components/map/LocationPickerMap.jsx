import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, MapPin, Navigation } from 'lucide-react';
import axios from 'axios';

// Pin Icon
const pickerIcon = L.divIcon({
  className: 'picker-pin',
  html: `
    <div style="position: relative; width: 36px; height: 44px; filter: drop-shadow(0 6px 8px rgba(0,0,0,0.5));">
      <svg viewBox="0 0 24 28" width="36" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 28 12 28C12 28 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="#10B981"/>
        <circle cx="12" cy="11" r="5" fill="#0F172A" />
        <circle cx="12" cy="11" r="3" fill="#FFFFFF" />
      </svg>
    </div>
  `,
  iconSize: [36, 44],
  iconAnchor: [18, 44]
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function CenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.lat && coords.lng) {
      map.flyTo([coords.lat, coords.lng], map.getZoom() || 15, { duration: 1 });
    }
  }, [coords, map]);
  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  address,
  onAddressChange,
  onAreaDistrictChange
}) {
  const [position, setPosition] = useState({
    lat: Number(latitude) || 23.8103,
    lng: Number(longitude) || 90.4125
  });
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (latitude && longitude && (latitude !== position.lat || longitude !== position.lng)) {
      setPosition({ lat: Number(latitude), lng: Number(longitude) });
    }
  }, [latitude, longitude]);

  // Reverse Geocoding via Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.data && res.data.display_name) {
        const addr = res.data.display_name;
        if (onAddressChange) {
          onAddressChange(addr);
        }

        if (onAreaDistrictChange && res.data.address) {
          const a = res.data.address;
          const district = a.city_district || a.suburb || a.city || a.county || a.state_district || 'Metropolitan';
          onAreaDistrictChange(district);
        }
      }
    } catch (err) {
      // Fallback
      if (onAddressChange && !address) {
        onAddressChange(`Location at (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    }
  };

  const handleSelect = (lat, lng) => {
    setPosition({ lat, lng });
    if (onLocationChange) {
      onLocationChange(lat, lng);
    }
    reverseGeocode(lat, lng);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        handleSelect(lat, lng);
        setDetecting(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setDetecting(false);
        // Fallback to default
        handleSelect(23.8103, 90.4125);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pinpoint Exact Waste Location</span>
        </label>
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={detecting}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/50 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Navigation className={`w-3.5 h-3.5 ${detecting ? 'animate-spin' : ''}`} />
          <span>{detecting ? 'Detecting GPS...' : 'Use My GPS Location'}</span>
        </button>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-xl h-72">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={15}
          scrollWheelZoom={false}
          className="w-full h-full cursor-crosshair"
        >
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            subdomains={['0', '1', '2', '3']}
            maxZoom={20}
          />
          <MapClickHandler onLocationSelect={handleSelect} />
          <CenterMap coords={position} />
          <Marker
            position={[position.lat, position.lng]}
            icon={pickerIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                handleSelect(pos.lat, pos.lng);
              }
            }}
          />
        </MapContainer>

        <div className="absolute bottom-3 left-3 right-3 pointer-events-none z-[1000]">
          <div className="bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700 text-xs text-slate-300 shadow-lg flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span>Click or drag marker on map to set position</span>
            </span>
            <span className="font-mono text-emerald-400 text-[11px] font-semibold">
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
