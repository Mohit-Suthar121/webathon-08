import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(timestamp: number): string {
  const elapsed = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(elapsed / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function maskPhone(phone: string): string {
  const cleaned = phone.trim();
  if (cleaned.length <= 4) return "••••";
  const start = cleaned.slice(0, 3);
  return `${start} •••• ${cleaned.slice(-2)}`;
}

export function maskCoords(lat: number, lng: number): string {
  return `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E (Approx)`;
}
