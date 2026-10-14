import { ReliefRequest } from "@/types";

export const DEFAULT_MAP_CENTER = {
  lat: 26.9124,
  lng: 75.7873,
  zoom: 12,
  cityName: "Jaipur Metropolitan Relief Zone",
};

export const COMMON_AREAS = [
  { name: "C-Scheme Central", lat: 26.9110, lng: 75.8015 },
  { name: "Malviya Nagar Sector 3", lat: 26.8530, lng: 75.8050 },
  { name: "Mansarovar Ward 14", lat: 26.8640, lng: 75.7590 },
  { name: "Vaishali Nagar West", lat: 26.9080, lng: 75.7410 },
  { name: "Raja Park Block B", lat: 26.8995, lng: 75.8290 },
  { name: "Civil Lines High Ground", lat: 26.9025, lng: 75.7870 },
  { name: "Sanganer Lowland Basin", lat: 26.8150, lng: 75.7720 },
  { name: "Vidhyadhar Nagar Sector 2", lat: 26.9680, lng: 75.7790 },
  { name: "Amer Valley Ward 9", lat: 26.9855, lng: 75.8510 },
  { name: "Jagatpura Railway Colony", lat: 26.8280, lng: 75.8360 },
  { name: "Bani Park Camp", lat: 26.9290, lng: 75.7920 },
  { name: "Tonk Road Flyover Hub", lat: 26.8770, lng: 75.8000 },
];

/**
 * Calculates great-circle distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Resolves human-readable address and GPS coordinates from lat/lng
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const coordSuffix = `(${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;

  // Find nearest pre-defined common area as baseline
  let nearestArea = COMMON_AREAS[0];
  let minDistance = calculateDistanceKm(lat, lng, nearestArea.lat, nearestArea.lng);
  for (const area of COMMON_AREAS) {
    const dist = calculateDistanceKm(lat, lng, area.lat, area.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestArea = area;
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr) {
        const parts = [
          addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.quarter,
          addr.city || addr.town || addr.county || "Jaipur",
        ].filter(Boolean);

        if (parts.length > 0) {
          return `${parts.join(", ")} ${coordSuffix}`;
        }
      }
    }
  } catch (err) {
    // fallback gracefully
  }

  return `${nearestArea.name} ${coordSuffix}`;
}

/**
 * Detects whether a request is a duplicate (same category, within 300m, within 1 hour)
 */
export function detectDuplicate(
  candidate: { category: string; lat: number; lng: number; createdAt?: number },
  existingRequests: ReliefRequest[],
  thresholdMeters = 300,
  timeWindowMs = 3600000 // 1 hour
): boolean {
  const now = candidate.createdAt || Date.now();
  const thresholdKm = thresholdMeters / 1000;

  return existingRequests.some((req) => {
    if (req.category !== candidate.category) return false;
    const timeDiff = Math.abs(now - req.createdAt);
    if (timeDiff > timeWindowMs) return false;

    const distKm = calculateDistanceKm(candidate.lat, candidate.lng, req.lat, req.lng);
    return distKm <= thresholdKm;
  });
}
