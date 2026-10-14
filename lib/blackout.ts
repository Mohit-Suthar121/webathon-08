import { BlackoutAlert, HubHeartbeat, ReliefRequest, ReliefSupply } from "@/types";
import { COMMON_AREAS } from "./geo";

const HEARTBEAT_STORAGE_KEY = "reliefhub_hub_heartbeats_v1";
const SIMULATED_BLACKOUT_KEY = "reliefhub_simulated_blackout_v1";
const BROADCAST_BLACKOUT_CHANNEL = "reliefhub_blackout_sync_channel";

let activeHeartbeats: Record<string, HubHeartbeat> = {};
let simulatedAlerts: BlackoutAlert[] = [];
let listeners: Array<(alerts: BlackoutAlert[]) => void> = [];

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_BLACKOUT_CHANNEL);
    broadcastChannel.onmessage = (event) => {
      const { type, data } = event.data || {};
      if (type === "SYNC_HEARTBEATS") {
        activeHeartbeats = data || {};
      } else if (type === "SYNC_BLACKOUTS") {
        simulatedAlerts = data || [];
        notifyListeners();
      }
    };
  } catch (err) {
    console.warn("BroadcastChannel blackout sync failed:", err);
  }
}

function notifyListeners() {
  const current = getActiveBlackoutAlerts();
  listeners.forEach((cb) => {
    try {
      cb(current);
    } catch (e) {
      console.error("Error in blackout listener:", e);
    }
  });
}

/**
 * Initializes heartbeat and blackout persistence
 */
export function initBlackoutService() {
  if (typeof window === "undefined") return;

  try {
    const rawHeartbeats = localStorage.getItem(HEARTBEAT_STORAGE_KEY);
    if (rawHeartbeats) {
      activeHeartbeats = JSON.parse(rawHeartbeats);
    }

    const rawSim = localStorage.getItem(SIMULATED_BLACKOUT_KEY);
    if (rawSim) {
      simulatedAlerts = JSON.parse(rawSim);
    }
  } catch (err) {
    console.warn("Could not load blackouts from localStorage:", err);
  }
}

/**
 * Pings a heartbeat for a supply hub / volunteer depot
 */
export function pingHubHeartbeat(
  hubId: string,
  hubName: string,
  areaName: string,
  lat: number,
  lng: number
) {
  if (typeof window === "undefined") return;

  activeHeartbeats[hubId] = {
    hubId,
    hubName,
    areaName,
    lat,
    lng,
    lastSeen: Date.now(),
  };

  try {
    localStorage.setItem(HEARTBEAT_STORAGE_KEY, JSON.stringify(activeHeartbeats));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: "SYNC_HEARTBEATS", data: activeHeartbeats });
    }
  } catch (e) {
    // safe ignore
  }

  notifyListeners();
}

/**
 * Computes live blackout alerts across all municipal wards
 */
export function getActiveBlackoutAlerts(
  requests: ReliefRequest[] = [],
  supplies: ReliefSupply[] = []
): BlackoutAlert[] {
  const alerts: BlackoutAlert[] = [...simulatedAlerts];
  const now = Date.now();

  // 1. Check for missed hub heartbeats (>180 seconds without check-in, i.e. 3 missed 60s pings)
  Object.values(activeHeartbeats).forEach((hb) => {
    const elapsedMs = now - hb.lastSeen;
    const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
    const missedPings = Math.floor(elapsedMs / 60000);

    if (missedPings >= 3) {
      const existing = alerts.find((a) => a.wardName === hb.areaName);
      if (!existing) {
        alerts.push({
          id: `BLACKOUT-HUB-${hb.hubId}`,
          wardName: hb.areaName,
          lat: hb.lat,
          lng: hb.lng,
          radiusMeters: 650,
          lastSignalAgoMinutes: Math.max(3, elapsedMinutes),
          missedPings,
          severity: "possible",
          detectedAt: now,
          reason: `Supply Hub "${hb.hubName}" missed ${missedPings} scheduled check-ins. Last signal ${elapsedMinutes} min ago. Verify with local responders.`,
        });
      }
    }
  });

  return alerts;
}

/**
 * Toggles a simulated blackout for live hackathon judging demos
 */
export function simulateBlackout(wardName = "Mansarovar Ward 14"): BlackoutAlert {
  initBlackoutService();

  const area = COMMON_AREAS.find((a) => a.name.includes(wardName.split(" ")[0])) || COMMON_AREAS[2];
  const newAlert: BlackoutAlert = {
    id: `BLACKOUT-SIM-${Date.now()}`,
    wardName: area.name,
    lat: area.lat,
    lng: area.lng,
    radiusMeters: 800,
    lastSignalAgoMinutes: 14,
    missedPings: 4,
    severity: "possible",
    detectedAt: Date.now(),
    reason: `Activity dropped >70% vs 15-min baseline and hub telemetry unresponsive. Last signal 14 min ago. Verify.`,
  };

  simulatedAlerts = [newAlert];

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SIMULATED_BLACKOUT_KEY, JSON.stringify(simulatedAlerts));
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: "SYNC_BLACKOUTS", data: simulatedAlerts });
      }
    } catch {
      // safe
    }
  }

  notifyListeners();
  return newAlert;
}

/**
 * Clears all active blackout alerts
 */
export function clearBlackouts() {
  simulatedAlerts = [];
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(SIMULATED_BLACKOUT_KEY);
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: "SYNC_BLACKOUTS", data: [] });
      }
    } catch {
      // safe
    }
  }
  notifyListeners();
}

/**
 * Subscribes to blackout state changes
 */
export function subscribeBlackouts(callback: (alerts: BlackoutAlert[]) => void): () => void {
  initBlackoutService();
  listeners.push(callback);
  callback(getActiveBlackoutAlerts());

  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}
