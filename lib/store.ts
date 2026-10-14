import { ReliefRequest, ReliefSupply, RequestStatus } from "@/types";
import { isFirebaseConfigured, db } from "./firebase";
import { calculateUrgencyScore, recalculateAllScores } from "./scoring";
import { detectDuplicate } from "./geo";
import {
  getInitialSeedRequests,
  getInitialSeedSupplies,
  generateRandomCrisisRequest,
} from "./seedData";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";

const STORAGE_KEY_REQUESTS = "reliefhub_requests_v1";
const STORAGE_KEY_SUPPLIES = "reliefhub_supplies_v1";
const BROADCAST_CHANNEL_NAME = "reliefhub_sync_channel";

// In-memory caches
let inMemoryRequests: ReliefRequest[] = [];
let inMemorySupplies: ReliefSupply[] = [];
let isInitialized = false;

// Subscribers
type RequestsCallback = (requests: ReliefRequest[]) => void;
type SuppliesCallback = (supplies: ReliefSupply[]) => void;

const requestsSubscribers = new Set<RequestsCallback>();
const suppliesSubscribers = new Set<SuppliesCallback>();

// BroadcastChannel for cross-tab realtime sync in demo mode
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      const { type, data } = event.data || {};
      if (type === "SYNC_REQUESTS" && Array.isArray(data)) {
        inMemoryRequests = data;
        notifyRequests();
      } else if (type === "SYNC_SUPPLIES" && Array.isArray(data)) {
        inMemorySupplies = data;
        notifySupplies();
      } else if (type === "SYNC_ALL") {
        if (data.requests) inMemoryRequests = data.requests;
        if (data.supplies) inMemorySupplies = data.supplies;
        notifyRequests();
        notifySupplies();
      }
    };
  } catch (err) {
    console.warn("BroadcastChannel not supported or error:", err);
  }
}

export function isDemoMode(): boolean {
  return !isFirebaseConfigured || !db;
}

function notifyRequests() {
  const sorted = [...inMemoryRequests].sort((a, b) => b.urgencyScore - a.urgencyScore);
  requestsSubscribers.forEach((cb) => {
    try {
      cb(sorted);
    } catch (e) {
      console.error("Error in requests subscriber:", e);
    }
  });
}

function notifySupplies() {
  const copy = [...inMemorySupplies];
  suppliesSubscribers.forEach((cb) => {
    try {
      cb(copy);
    } catch (e) {
      console.error("Error in supplies subscriber:", e);
    }
  });
}

function saveToLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(inMemoryRequests));
    localStorage.setItem(STORAGE_KEY_SUPPLIES, JSON.stringify(inMemorySupplies));
  } catch (err) {
    console.warn("Failed to write to localStorage:", err);
  }
}

function broadcastChange(type: "SYNC_REQUESTS" | "SYNC_SUPPLIES" | "SYNC_ALL", data: any) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, data });
    } catch (err) {
      console.warn("BroadcastChannel message error:", err);
    }
  }
}

export function initializeStore() {
  if (isInitialized || typeof window === "undefined") return;
  isInitialized = true;

  if (isDemoMode()) {
    try {
      const storedReqs = localStorage.getItem(STORAGE_KEY_REQUESTS);
      const storedSups = localStorage.getItem(STORAGE_KEY_SUPPLIES);

      if (storedReqs && storedSups) {
        inMemoryRequests = JSON.parse(storedReqs);
        inMemorySupplies = JSON.parse(storedSups);
      } else {
        // First load auto-seed
        inMemoryRequests = getInitialSeedRequests();
        inMemorySupplies = getInitialSeedSupplies();
        saveToLocalStorage();
      }
    } catch {
      inMemoryRequests = getInitialSeedRequests();
      inMemorySupplies = getInitialSeedSupplies();
      saveToLocalStorage();
    }

    // Recalculate scores with current waiting time
    inMemoryRequests = recalculateAllScores(inMemoryRequests);

    // Setup 30-second interval for dynamic score updates (waiting-time bonus!)
    setInterval(() => {
      if (inMemoryRequests.length > 0) {
        inMemoryRequests = recalculateAllScores(inMemoryRequests);
        notifyRequests();
        saveToLocalStorage();
      }
    }, 30000);
  }
}

/**
 * Subscribes to requests updates. Returns unsubscribe function.
 */
export function subscribeRequests(callback: RequestsCallback): () => void {
  initializeStore();
  requestsSubscribers.add(callback);

  if (isDemoMode()) {
    // Immediately invoke with current state
    const sorted = [...inMemoryRequests].sort((a, b) => b.urgencyScore - a.urgencyScore);
    callback(sorted);

    return () => {
      requestsSubscribers.delete(callback);
    };
  }

  // Firebase Mode
  try {
    const requestsCol = collection(db!, "requests");
    const unsubscribe = onSnapshot(
      requestsCol,
      (snapshot) => {
        const reqs: ReliefRequest[] = [];
        snapshot.forEach((docSnap) => {
          reqs.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        const scored = recalculateAllScores(reqs);
        const sorted = scored.sort((a, b) => b.urgencyScore - a.urgencyScore);
        inMemoryRequests = sorted;
        callback(sorted);
      },
      (error) => {
        console.error("Firestore onSnapshot requests error, falling back to local:", error);
        callback(inMemoryRequests);
      }
    );

    return () => {
      requestsSubscribers.delete(callback);
      unsubscribe();
    };
  } catch (err) {
    console.error("Failed to connect to Firestore requests:", err);
    callback(inMemoryRequests);
    return () => {
      requestsSubscribers.delete(callback);
    };
  }
}

/**
 * Subscribes to supplies updates. Returns unsubscribe function.
 */
export function subscribeSupplies(callback: SuppliesCallback): () => void {
  initializeStore();
  suppliesSubscribers.add(callback);

  if (isDemoMode()) {
    callback([...inMemorySupplies]);

    return () => {
      suppliesSubscribers.delete(callback);
    };
  }

  // Firebase Mode
  try {
    const suppliesCol = collection(db!, "supplies");
    const unsubscribe = onSnapshot(
      suppliesCol,
      (snapshot) => {
        const sups: ReliefSupply[] = [];
        snapshot.forEach((docSnap) => {
          sups.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        inMemorySupplies = sups;
        callback(sups);
      },
      (error) => {
        console.error("Firestore onSnapshot supplies error, falling back to local:", error);
        callback(inMemorySupplies);
      }
    );

    return () => {
      suppliesSubscribers.delete(callback);
      unsubscribe();
    };
  } catch (err) {
    console.error("Failed to connect to Firestore supplies:", err);
    callback(inMemorySupplies);
    return () => {
      suppliesSubscribers.delete(callback);
    };
  }
}

/**
 * Creates a new citizen relief request
 */
export async function createRequest(
  data: Omit<ReliefRequest, "id" | "createdAt" | "urgencyScore" | "status"> & {
    id?: string;
    createdAt?: number;
    status?: RequestStatus;
  }
): Promise<ReliefRequest> {
  initializeStore();
  const now = data.createdAt || Date.now();
  const id = data.id || `REQ-${Math.floor(1000 + Math.random() * 9000)}`;

  // Duplicate detection check
  const isDuplicate = detectDuplicate(
    { category: data.category, lat: data.lat, lng: data.lng, createdAt: now },
    inMemoryRequests
  );

  const { score } = calculateUrgencyScore(
    data.category,
    data.peopleAffected,
    data.vulnerable,
    now,
    now
  );

  const newRequest: ReliefRequest = {
    ...data,
    id,
    status: data.status || "open",
    createdAt: now,
    urgencyScore: score,
    duplicateWarning: isDuplicate,
    verified: false,
  };

  if (isDemoMode()) {
    inMemoryRequests = [newRequest, ...inMemoryRequests];
    saveToLocalStorage();
    notifyRequests();
    broadcastChange("SYNC_REQUESTS", inMemoryRequests);
    return newRequest;
  }

  try {
    await setDoc(doc(db!, "requests", id), {
      ...newRequest,
      createdAtServer: serverTimestamp(),
    });
    return newRequest;
  } catch (err) {
    console.error("Firestore createRequest error, persisting locally:", err);
    inMemoryRequests = [newRequest, ...inMemoryRequests];
    saveToLocalStorage();
    notifyRequests();
    return newRequest;
  }
}

/**
 * Creates a new supply offering
 */
export async function createSupply(
  data: Omit<ReliefSupply, "id" | "createdAt"> & { id?: string; createdAt?: number }
): Promise<ReliefSupply> {
  initializeStore();
  const now = data.createdAt || Date.now();
  const id = data.id || `SUP-${Math.floor(100 + Math.random() * 900)}`;

  const newSupply: ReliefSupply = {
    ...data,
    id,
    createdAt: now,
    available: data.available !== undefined ? data.available : true,
  };

  if (isDemoMode()) {
    inMemorySupplies = [newSupply, ...inMemorySupplies];
    saveToLocalStorage();
    notifySupplies();
    broadcastChange("SYNC_SUPPLIES", inMemorySupplies);
    return newSupply;
  }

  try {
    await setDoc(doc(db!, "supplies", id), {
      ...newSupply,
      createdAtServer: serverTimestamp(),
    });
    return newSupply;
  } catch (err) {
    console.error("Firestore createSupply error, persisting locally:", err);
    inMemorySupplies = [newSupply, ...inMemorySupplies];
    saveToLocalStorage();
    notifySupplies();
    return newSupply;
  }
}

/**
 * Updates status of a request: open | assigned | fulfilled
 */
export async function updateRequestStatus(id: string, status: RequestStatus): Promise<void> {
  initializeStore();

  if (isDemoMode()) {
    inMemoryRequests = inMemoryRequests.map((req) =>
      req.id === id ? { ...req, status, updatedAt: Date.now() } : req
    );
    saveToLocalStorage();
    notifyRequests();
    broadcastChange("SYNC_REQUESTS", inMemoryRequests);
    return;
  }

  try {
    await updateDoc(doc(db!, "requests", id), {
      status,
      updatedAtServer: serverTimestamp(),
    });
  } catch (err) {
    console.error("Firestore updateRequestStatus error:", err);
    inMemoryRequests = inMemoryRequests.map((req) =>
      req.id === id ? { ...req, status, updatedAt: Date.now() } : req
    );
    saveToLocalStorage();
    notifyRequests();
  }
}

/**
 * Assigns a supply to a request:
 * - Links request.assignedSupplyId
 * - Sets request status to "assigned"
 * - Decrements supply quantity (if > 0)
 * - If quantity reaches 0, sets supply.available to false
 */
export async function assignSupply(requestId: string, supplyId: string): Promise<void> {
  initializeStore();

  if (isDemoMode()) {
    let assignedSupply: ReliefSupply | undefined;

    inMemorySupplies = inMemorySupplies.map((s) => {
      if (s.id === supplyId) {
        const newQty = Math.max(0, s.quantity - 1);
        assignedSupply = {
          ...s,
          quantity: newQty,
          available: newQty > 0,
          updatedAt: Date.now(),
        };
        return assignedSupply;
      }
      return s;
    });

    inMemoryRequests = inMemoryRequests.map((req) => {
      if (req.id === requestId) {
        return {
          ...req,
          assignedSupplyId: supplyId,
          status: "assigned" as const,
          updatedAt: Date.now(),
        };
      }
      return req;
    });

    saveToLocalStorage();
    notifyRequests();
    notifySupplies();
    broadcastChange("SYNC_ALL", { requests: inMemoryRequests, supplies: inMemorySupplies });
    return;
  }

  try {
    const supply = inMemorySupplies.find((s) => s.id === supplyId);
    const newQty = supply ? Math.max(0, supply.quantity - 1) : 0;

    await updateDoc(doc(db!, "requests", requestId), {
      assignedSupplyId: supplyId,
      status: "assigned",
      updatedAtServer: serverTimestamp(),
    });

    await updateDoc(doc(db!, "supplies", supplyId), {
      quantity: newQty,
      available: newQty > 0,
      updatedAtServer: serverTimestamp(),
    });
  } catch (err) {
    console.error("Firestore assignSupply error:", err);
    // fallback local update
    inMemoryRequests = inMemoryRequests.map((req) =>
      req.id === requestId
        ? { ...req, assignedSupplyId: supplyId, status: "assigned", updatedAt: Date.now() }
        : req
    );
    saveToLocalStorage();
    notifyRequests();
  }
}

/**
 * Toggles "Verified by dispatcher" badge
 */
export async function toggleVerifyRequest(requestId: string): Promise<void> {
  initializeStore();

  if (isDemoMode()) {
    inMemoryRequests = inMemoryRequests.map((req) =>
      req.id === requestId ? { ...req, verified: !req.verified, updatedAt: Date.now() } : req
    );
    saveToLocalStorage();
    notifyRequests();
    broadcastChange("SYNC_REQUESTS", inMemoryRequests);
    return;
  }

  try {
    const target = inMemoryRequests.find((r) => r.id === requestId);
    const newVal = target ? !target.verified : true;
    await updateDoc(doc(db!, "requests", requestId), {
      verified: newVal,
      updatedAtServer: serverTimestamp(),
    });
  } catch (err) {
    console.error("Firestore toggleVerifyRequest error:", err);
    inMemoryRequests = inMemoryRequests.map((req) =>
      req.id === requestId ? { ...req, verified: !req.verified, updatedAt: Date.now() } : req
    );
    saveToLocalStorage();
    notifyRequests();
  }
}

/**
 * Seeds demo data (18 requests & 12 supplies in Jaipur zone)
 */
export async function seedDemoData(force = false): Promise<void> {
  initializeStore();

  const seedReqs = getInitialSeedRequests();
  const seedSups = getInitialSeedSupplies();

  inMemoryRequests = seedReqs;
  inMemorySupplies = seedSups;

  saveToLocalStorage();
  notifyRequests();
  notifySupplies();
  broadcastChange("SYNC_ALL", { requests: inMemoryRequests, supplies: inMemorySupplies });

  if (!isDemoMode() && force) {
    try {
      const batch = writeBatch(db!);
      seedReqs.forEach((r) => {
        batch.set(doc(db!, "requests", r.id), r);
      });
      seedSups.forEach((s) => {
        batch.set(doc(db!, "supplies", s.id), s);
      });
      await batch.commit();
    } catch (err) {
      console.warn("Could not batch write seed to Firestore:", err);
    }
  }
}

/**
 * Simulates a realistic new incoming crisis request for live demos!
 */
export async function simulateIncomingRequest(): Promise<ReliefRequest> {
  const newReq = generateRandomCrisisRequest();
  await createRequest(newReq);
  return newReq;
}
