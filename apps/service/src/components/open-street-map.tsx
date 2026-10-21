'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Layers,
  ZoomIn,
  ZoomOut,
  Compass,
  Phone,
  Clock,
  ShieldCheck,
  Star,
} from 'lucide-react';

export interface MapCenterPin {
  id: string;
  name: string;
  slug: string;
  type: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  phone?: string;
  rating?: number;
  isOpen?: boolean;
}

interface OpenStreetMapProps {
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  userLat?: number | null;
  userLng?: number | null;
  pins?: MapCenterPin[];
  selectedPinId?: string;
  onSelectPin?: (pin: MapCenterPin) => void;
  height?: string;
  showDirections?: boolean;
}

export function OpenStreetMap({
  centerLat = 17.437462,
  centerLng = 78.448288,
  zoom = 15,
  userLat = null,
  userLng = null,
  pins = [],
  selectedPinId,
  onSelectPin,
  height = '420px',
  showDirections = true,
}: OpenStreetMapProps) {
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [activePin, setActivePin] = useState<MapCenterPin | null>(
    pins.find((p) => p.id === selectedPinId) || pins[0] || null,
  );

  const activeLat = activePin?.lat ?? centerLat;
  const activeLng = activePin?.lng ?? centerLng;

  // Calculate bounding box for OpenStreetMap embed
  const delta = 0.015 / Math.pow(1.5, currentZoom - 14);
  const minLng = (activeLng - delta).toFixed(6);
  const minLat = (activeLat - delta * 0.7).toFixed(6);
  const maxLng = (activeLng + delta).toFixed(6);
  const maxLat = (activeLat + delta * 0.7).toFixed(6);

  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${activeLat}%2C${activeLng}`;

  const directionsUrl = userLat && userLng
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLat}%2C${userLng}%3B${activeLat}%2C${activeLng}`
    : `https://www.openstreetmap.org/?mlat=${activeLat}&mlon=${activeLng}#map=16/${activeLat}/${activeLng}`;

  return (
    <div
      className="relative rounded-[28px] border border-[#d5deea] bg-white overflow-hidden shadow-clay-card flex flex-col"
      style={{ height }}
    >
      {/* Top Map Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-md">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-[#082046] flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-[#0e7bf4]" /> OpenStreetMap (OSM) Live
          </span>
          <span className="text-[10px] text-[#526987] font-mono">
            {activeLat.toFixed(4)}, {activeLng.toFixed(4)}
          </span>
        </div>

        {/* Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-white bg-white/95 p-1 shadow-md backdrop-blur-md">
          <button
            type="button"
            onClick={() => setCurrentZoom((z) => Math.min(18, z + 1))}
            className="p-1.5 text-[#082046] hover:bg-[#edf2f8] rounded-xl transition"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentZoom((z) => Math.max(12, z - 1))}
            className="p-1.5 text-[#082046] hover:bg-[#edf2f8] rounded-xl transition"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <a
            href={`https://www.openstreetmap.org/#map=${currentZoom}/${activeLat}/${activeLng}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-[#0e7bf4] hover:bg-[#edf2f8] rounded-xl transition flex items-center gap-1 text-[11px] font-bold px-2"
            title="View Full OpenStreetMap"
          >
            <span>OSM</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Embedded OpenStreetMap Iframe */}
      <div className="flex-1 w-full h-full relative bg-[#F0F4F8]">
        <iframe
          title="OpenStreetMap Location"
          src={osmEmbedUrl}
          className="w-full h-full border-0 filter contrast-[0.98] brightness-[0.98]"
          loading="lazy"
        />

        {/* Interactive Center Pins Overlay Bar (if multiple pins provided) */}
        {pins.length > 1 && (
          <div className="absolute bottom-3 left-3 right-3 z-10 flex gap-2 overflow-x-auto pb-1 pointer-events-auto">
            {pins.map((pin) => {
              const isSelected = activePin?.id === pin.id;
              return (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => {
                    setActivePin(pin);
                    onSelectPin?.(pin);
                  }}
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold whitespace-nowrap shadow-md backdrop-blur-md transition-all ${
                    isSelected
                      ? 'border-[#0e7bf4] bg-[#0e7bf4] text-white ring-2 ring-[#0e7bf4]/30'
                      : 'border-white bg-white/95 text-[#082046] hover:border-[#0e7bf4]'
                  }`}
                >
                  <MapPin className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-[#0e7bf4]'}`} />
                  <span>{pin.name}</span>
                  {pin.distanceKm !== undefined && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#e0edfb] text-[#0e7bf4]'
                      }`}
                    >
                      {pin.distanceKm} km
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Center Info & Directions Strip */}
      {activePin && showDirections && (
        <div className="p-4 border-t border-[#d5deea] bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-black text-[#082046] text-sm">{activePin.name}</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                Verified Center
              </span>
              {activePin.distanceKm !== undefined && (
                <span className="font-mono text-[#0e7bf4] text-xs font-bold">
                  📍 {activePin.distanceKm} km away
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#526987] flex items-center gap-1 truncate max-w-md font-medium">
              <MapPin className="h-3 w-3 text-[#0e7bf4] shrink-0" />
              <span>{activePin.address}, {activePin.city}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activePin.phone && (
              <a
                href={`tel:${activePin.phone}`}
                className="cut-corner-btn inline-flex items-center gap-1.5 rounded-xl border border-[#d5deea] bg-white px-3 py-1.5 text-xs font-bold text-[#082046] hover:border-[#0e7bf4] hover:text-[#0e7bf4] transition shadow-sm"
              >
                <Phone className="h-3 w-3 text-emerald-600" /> Call
              </a>
            )}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="cut-corner-btn inline-flex items-center gap-1.5 rounded-xl bg-[#0e7bf4] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#0c6fdc] transition shadow-clay-btn-azure active:scale-95"
            >
              <Navigation className="h-3 w-3" /> Get Directions (OSM)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
