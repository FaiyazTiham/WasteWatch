import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import SeverityBadge from '../common/SeverityBadge';
import { ArrowRight, MapPin } from 'lucide-react';

// Status-based Pin Marker Factory
const createCustomIcon = (status, severity) => {
  const colors = {
    reported: '#F43F5E',    // Rose
    verified: '#3B82F6',    // Blue
    assigned: '#A855F7',    // Purple
    in_progress: '#F59E0B', // Amber
    cleaned: '#10B981',     // Emerald
    closed: '#64748B'       // Slate
  };

  const pinColor = colors[status] || '#10B981';

  const svgHtml = `
    <div style="position: relative; width: 32px; height: 38px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
      <svg viewBox="0 0 24 28" width="32" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 28 12 28C12 28 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="${pinColor}"/>
        <circle cx="12" cy="11" r="5" fill="#0F172A" />
        <circle cx="12" cy="11" r="3" fill="#FFFFFF" />
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'custom-map-pin',
    html: svgHtml,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -38]
  });
};

// Component to dynamically pan and fit bounds
function MapController({ reports, center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 14, { duration: 1.2 });
    } else if (reports && reports.length > 0) {
      const bounds = L.latLngBounds(
        reports.map((r) => [Number(r.latitude) || 40.7128, Number(r.longitude) || -74.0060])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [reports, center, zoom, map]);

  return null;
}

export default function WasteMap({
  reports = [],
  selectedReportId = null,
  onSelectReport = null,
  center = null,
  zoom = 13,
  height = '550px'
}) {
  const defaultCenter = [40.7128, -74.0060]; // Default city hub

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl z-0" style={{ height }}>
      <MapContainer
        center={center || (reports.length > 0 ? [reports[0].latitude, reports[0].longitude] : defaultCenter)}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Modern Crisp Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapController reports={reports} center={center} zoom={zoom} />

        {reports.map((r) => {
          const lat = Number(r.latitude);
          const lng = Number(r.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          const isSelected = selectedReportId && Number(selectedReportId) === Number(r.id);

          return (
            <Marker
              key={r.id}
              position={[lat, lng]}
              icon={createCustomIcon(r.status, r.severity)}
              eventHandlers={{
                click: () => {
                  if (onSelectReport) onSelectReport(r);
                }
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="w-64 p-3 bg-slate-900 text-slate-100 rounded-xl overflow-hidden">
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-2.5 bg-slate-800">
                    <img
                      src={r.status === 'cleaned' && r.cleaned_photo ? r.cleaned_photo : r.primary_photo}
                      alt={r.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <StatusBadge status={r.status} size="sm" />
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    {r.category_name || 'Waste Issue'}
                  </span>

                  <h4 className="font-bold text-sm text-slate-100 line-clamp-1 mb-1 leading-snug">
                    {r.title}
                  </h4>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-2 leading-tight">
                    {r.description}
                  </p>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-3 truncate">
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{r.address}</span>
                  </div>

                  <Link
                    to={`/reports/${r.id}`}
                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span>View Full Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
