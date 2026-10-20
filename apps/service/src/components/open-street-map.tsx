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
      className="relative rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl flex flex-col"
      style={{ height }}
    >
      {/* Top Map Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-800/90 bg-slate-900/95 px-3 py-1.5 shadow-lg backdrop-blur-md">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-cyan-400" /> OpenStreetMap (OSM) Live
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {activeLat.toFixed(4)}, {activeLng.toFixed(4)}
          </span>
        </div>

        {/* Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-slate-800/90 bg-slate-900/95 p-1 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => setCurrentZoom((z) => Math.min(18, z + 1))}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentZoom((z) => Math.max(12, z - 1))}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <a
            href={`https://www.openstreetmap.org/#map=${currentZoom}/${activeLat}/${activeLng}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-cyan-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition flex items-center gap-1 text-[11px] font-semibold px-2"
            title="View Full OpenStreetMap"
          >
            <span>OSM</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Embedded OpenStreetMap Iframe */}
      <div className="flex-1 w-full h-full relative bg-slate-950">
        <iframe
          title="OpenStreetMap Location"
          src={osmEmbedUrl}
          className="w-full h-full border-0 filter contrast-[0.95] brightness-[0.92]"
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
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold whitespace-nowrap shadow-lg backdrop-blur-md transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-slate-900 text-white ring-2 ring-cyan-400/40'
                      : 'border-slate-800/90 bg-slate-950/90 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <MapPin className={`h-3.5 w-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="font-bold">{pin.name}</span>
                  {pin.distanceKm !== undefined && (
                    <span className="rounded-md bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
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
        <div className="p-3.5 border-t border-slate-800/90 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{activePin.name}</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                Verified Center
              </span>
              {activePin.distanceKm !== undefined && (
                <span className="font-mono text-cyan-400 text-xs font-semibold">
                  {activePin.distanceKm} km away
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate max-w-md">
              <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
              <span>{activePin.address}, {activePin.city}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activePin.phone && (
              <a
                href={`tel:${activePin.phone}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white"
              >
                <Phone className="h-3 w-3 text-emerald-400" /> Call
              </a>
            )}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition shadow-sm"
            >
              <Navigation className="h-3 w-3" /> Get Directions (OSM)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
