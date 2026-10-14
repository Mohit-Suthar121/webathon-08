"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { ReliefRequest, ReliefSupply } from "@/types";
import { DEFAULT_MAP_CENTER } from "@/lib/geo";

interface LiveMapInnerProps {
  requests: ReliefRequest[];
  supplies: ReliefSupply[];
  selectedRequestId?: string | null;
  selectedSupplyId?: string | null;
  onSelectRequest?: (req: ReliefRequest) => void;
  onSelectSupply?: (sup: ReliefSupply) => void;
}

export default function LiveMapInner({
  requests,
  supplies,
  selectedRequestId,
  selectedSupplyId,
  onSelectRequest,
  onSelectSupply,
}: LiveMapInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const linesLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
      zoom: DEFAULT_MAP_CENTER.zoom,
      zoomControl: false,
    });

    // Dark CARTO Basemap Tiles (No API key needed)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const linesGroup = L.layerGroup().addTo(map);

    markersLayerRef.current = markersGroup;
    linesLayerRef.current = linesGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Connections when requests or supplies change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const linesLayer = linesLayerRef.current;

    if (!map || !markersLayer || !linesLayer) return;

    markersLayer.clearLayers();
    linesLayer.clearLayers();

    // Map supplies lookup
    const supplyMap = new Map<string, ReliefSupply>();
    supplies.forEach((s) => supplyMap.set(s.id, s));

    // 1. Render Supplies (Emerald glowing hubs)
    supplies.forEach((sup) => {
      const isSelected = selectedSupplyId === sup.id;
      const supplyIcon = L.divIcon({
        className: "custom-supply-marker",
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group" style="width: 32px; height: 32px;">
            <div class="absolute inset-0 rounded-full bg-emerald-500/20 ${isSelected ? "animate-ping" : ""}"></div>
            <div class="relative flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 border ${
              isSelected ? "border-emerald-400 ring-2 ring-emerald-400" : "border-emerald-500/70"
            } text-emerald-400 shadow-lg shadow-emerald-950/60 font-mono text-[10px] font-bold">
              📦
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([sup.lat, sup.lng], { icon: supplyIcon });
      marker.bindPopup(`
        <div style="min-width: 180px; font-family: inherit;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 10px; font-family: monospace; color: #34d399; font-weight: bold;">${sup.id}</span>
            <span style="font-size: 9px; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: rgba(52, 211, 153, 0.15); color: #34d399;">${sup.type}</span>
          </div>
          <div style="font-weight: bold; color: #fff; font-size: 13px; margin-bottom: 4px;">${sup.providerName}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">${sup.item} (${sup.quantity} avail)</div>
          <div style="font-size: 10px; color: #cbd5e1; font-family: monospace;">📍 ${sup.areaName}</div>
        </div>
      `);

      marker.on("click", () => {
        onSelectSupply?.(sup);
      });

      marker.addTo(markersLayer);
    });

    // 2. Render Requests (Color-coded, Pulsing Red for Critical)
    requests.forEach((req) => {
      const isCritical = req.urgency === "critical";
      const isSelected = selectedRequestId === req.id;
      const isFulfilled = req.status === "fulfilled";

      let colorHex = "#38BDF8"; // water default
      if (req.category === "rescue") colorHex = "#FB7185";
      if (req.category === "medical") colorHex = "#F43F5E";
      if (req.category === "food") colorHex = "#F59E0B";
      if (req.category === "shelter") colorHex = "#A78BFA";

      const categoryEmoji = {
        rescue: "🚨",
        medical: "🩺",
        water: "💧",
        shelter: "⛺",
        food: "🍲",
      }[req.category] || "⚠️";

      const requestIcon = L.divIcon({
        className: "custom-request-marker",
        html: `
          <div class="relative flex items-center justify-center cursor-pointer" style="width: 36px; height: 36px;">
            ${
              isCritical && req.status === "open"
                ? `<div class="absolute inset-0 rounded-full bg-rose-500/40 animate-ping"></div>
                   <div class="absolute -inset-1 rounded-full border border-rose-500/60 animate-pulse"></div>`
                : ""
            }
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border-2 ${
              isSelected ? "border-white ring-4 ring-rose-500/50 scale-110" : ""
            }" style="border-color: ${colorHex}; box-shadow: 0 0 15px ${colorHex}55;">
              <span style="font-size: 13px;">${categoryEmoji}</span>
            </div>
            <div class="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full px-1 text-[8px] font-mono font-bold bg-slate-950 text-white border border-slate-700">
              ${Math.round(req.urgencyScore)}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([req.lat, req.lng], { icon: requestIcon });
      marker.bindPopup(`
        <div style="min-width: 200px; font-family: inherit;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-family: monospace; color: #f43f5e; font-weight: bold;">${req.id}</span>
            <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: rgba(244, 63, 94, 0.2); color: #fb7185;">
              ${req.urgency} (${Math.round(req.urgencyScore)} pts)
            </span>
          </div>
          <div style="font-size: 12px; font-weight: bold; color: #fff; margin-bottom: 4px;">${req.category.toUpperCase()} • ${req.peopleAffected} People</div>
          <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 6px; line-height: 1.3;">${req.description}</div>
          <div style="font-size: 10px; color: #94a3b8; font-family: monospace;">📍 ${req.areaName}</div>
          <div style="margin-top: 6px; font-size: 10px; text-transform: uppercase; font-weight: bold; color: ${
            req.status === "open" ? "#f43f5e" : req.status === "assigned" ? "#f59e0b" : "#34d399"
          };">Status: ${req.status}</div>
        </div>
      `);

      marker.on("click", () => {
        onSelectRequest?.(req);
      });

      marker.addTo(markersLayer);

      // 3. Draw connection line between assigned request & supply
      if (req.assignedSupplyId && req.status !== "fulfilled") {
        const sup = supplyMap.get(req.assignedSupplyId);
        if (sup) {
          const polyline = L.polyline(
            [
              [req.lat, req.lng],
              [sup.lat, sup.lng],
            ],
            {
              color: "#34D399",
              weight: 2,
              opacity: 0.7,
              dashArray: "6, 8",
            }
          );
          polyline.addTo(linesLayer);
        }
      }
    });

    // Pan to selected request if any
    if (selectedRequestId) {
      const selected = requests.find((r) => r.id === selectedRequestId);
      if (selected) {
        map.flyTo([selected.lat, selected.lng], 14, { duration: 1 });
      }
    }
  }, [requests, supplies, selectedRequestId, selectedSupplyId, onSelectRequest, onSelectSupply]);

  return <div ref={mapContainerRef} className="h-full w-full rounded-2xl overflow-hidden" />;
}
