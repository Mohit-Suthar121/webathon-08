"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { DEFAULT_MAP_CENTER } from "@/lib/geo";

interface LocationPickerInnerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPickerInner({
  lat,
  lng,
  onChange,
}: LocationPickerInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat || DEFAULT_MAP_CENTER.lat, lng || DEFAULT_MAP_CENTER.lng],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
        maxZoom: 18,
      }
    ).addTo(map);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 18,
      }
    ).addTo(map);

    const pinIcon = L.divIcon({
      className: "custom-picker-pin",
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full" style="width: 36px; height: 36px;">
          <div class="absolute -bottom-1 w-3 h-1.5 bg-black/60 rounded-full blur-[1px]"></div>
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-xl shadow-rose-950/80 text-white animate-bounce">
            📍
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    const marker = L.marker([lat, lng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.on("dragend", (e: any) => {
      const position = e.target.getLatLng();
      onChange(position.lat, position.lng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker position when prop coordinates change externally (e.g. GPS button)
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng]);
    }
  }, [lat, lng]);

  return <div ref={mapContainerRef} className="h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-slate-700/80" />;
}
