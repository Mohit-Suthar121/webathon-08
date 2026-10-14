# ReliefHub — Real-Time Crisis Coordination & Dispatch Portal

> **Connect help to those who need it. In real time.**  
> A high-velocity crisis response platform connecting flood/disaster-affected citizens with volunteer depots and providing emergency dispatchers with a live AI-prioritized command center.

---

## ⚡ Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling & Aesthetics:** Tailwind CSS v4, dark crisis command-center aesthetic (`#070B14`), glassmorphism, glowing telemetry radar rings
- **Icons & Animation:** `lucide-react`, `framer-motion`, `canvas-confetti`
- **Charts:** `recharts` (Donut category breakdown, Area volume timeline)
- **Map:** Leaflet + React Leaflet with dark CARTO tiles (no API key required)
- **Real-Time Data Layer:** Dual-mode architecture (`lib/store.ts`):
  - **Firebase Firestore:** Realtime `onSnapshot` sync when credentials exist in `.env.local`.
  - **Demo Mode Fallback:** In-memory store persisted to `localStorage` and synced instantaneously across open browser tabs via `BroadcastChannel`.

---

## 🚀 Quickstart (Runs in 60 Seconds)

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Run local development server
npm run dev

# 3. Open browser
http://localhost:3000
```

Zero configuration is needed to run immediately: the app defaults to **Demo Mode**, pre-populated with **18 realistic flood requests and 12 relief depots** in Jaipur, India.

---

## 🧠 Smart Logic Engine

1. **Dynamic Urgency Scoring (0–100):**
   - **Category Base Weight:** Rescue (40), Medical (32), Water (24), Shelter (20), Food (16)
   - **Impact Bonus:** `min(peopleAffected, 20)`
   - **Vulnerability Bonus:** `+12` points if children, elderly, pregnant, or disabled are affected
   - **Waiting Time Dynamic Bonus:** `+1` point per 5 minutes elapsed (max 20 points). Recalculates dynamically every 30 seconds.
   - **Interactive Breakdown:** Hover or tap any Urgency Ring to inspect the formula.

2. **Auto-Match Engine:**
   - Evaluates each open request against available supply depots in the same category.
   - Computes precise Haversine distance in kilometers.
   - Recommends the top 3 nearest depots.
   - Features **1-Click "Assign"**: links supply to request, transitions status to `assigned`, and decrements depot stock.

3. **Duplicate Detection:**
   - Detects requests in the same category logged within **300 meters** in the last hour and flags them with an amber `"Possible duplicate"` badge.

4. **Public vs. Private Privacy Shield:**
   - **Public Citizens (`/track/[id]`):** Shows approximate area and masked phone numbers to protect citizen safety.
   - **Authorized Dispatchers (`/dispatch`):** Displays exact GPS coordinates and unmasked emergency contact lines.

5. **Client Rate Limiting:**
   - Limits emergency submissions to **3 per hour per phone number** to prevent panic flooding.

---

## 🗺️ Application Architecture

- `/` — **Cinematic Landing Page:** Animated radar waves, live counter KPIs, ticker, and 3-step crisis workflow.
- `/request` — **Citizen SOS Form:** Mobile-first, large tappable category cards, urgency selector, people stepper, vulnerable toggle, GPS location button, interactive Leaflet pin-drop map, and confetti timeline ticket on submission.
- `/offer` — **Volunteer & Depot Registration:** Register stock (water, food, medicine, boats, shelter) with location pins.
- `/dispatch` — **Command Center (Hero Dashboard):**
  - **Top KPI Strip:** Open, Critical Queue, Assigned, Fulfilled, Avg Response Time.
  - **Left (40%):** Live triage cards sorted by Urgency Score, filter chips, search, and expandable match recommendations.
  - **Right (60%):** Full-height dark CARTO map with pulsing red pins for critical SOS and green glowing depot markers, connected by animated polylines when assigned.
  - **Telemetry Drawer:** Recharts donut category distribution and 3-hour surge volume.
  - **Demo Ingestion Simulator:** "Simulate Incoming SOS" injects randomized live requests for live hackathon presentations.
- `/track/[id]` — **Citizen Incident Tracker:** Public link showing 3-stage timeline and emergency hotlines.

---

## 🎬 60-Second Hackathon Demo Script

1. **Start on `/`:**
   - Point out the **"DEMO MODE" / "LIVE"** badge in the navbar and explain the zero-config `BroadcastChannel` real-time sync.
   - Highlight the live animated count-up stats wired to the crisis database and the live ticker at the top.
2. **Citizen Flow on `/request`:**
   - Pick **"Rescue"** or **"Medical"**, set people to `4`, toggle **"Vulnerable"** ON, click **"Use My GPS"** or pick a sector, and enter a phone number.
   - Click **"Broadcast Emergency SOS"**.
   - Show the celebration confetti and tracking ticket with Urgency Score (e.g. `76/100`). Click **"Track Live Status"** to view the public timeline.
3. **Dispatcher Flow on `/dispatch`:**
   - Notice the new request is already at the top of the command feed (sorted by urgency score).
   - Click the request card: notice the map pans to the exact coordinates with a pulsing red beacon.
   - Expand **"Suggested Matches"**: demonstrate the Haversine distance calculation (e.g. `1.8 km away`) and click **"Assign"**.
   - See the status turn to **Assigned**, stock decrement, and a green dashed connection line drawn on the map.
4. **Live Ingestion Simulation:**
   - Click **"Simulate Incoming SOS"**: watch an emergency request slide into the queue with a toast notification and instant map pin.
   - Click **"Telemetry Charts"** to show real-time Recharts category analytics.

---

## 🔑 Optional Firebase Configuration

To switch from Demo Mode to Firebase Cloud Firestore:
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Copy `.env.example` to `.env.local`
3. Add your Firestore credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=reliefhub.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=reliefhub-prod
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=reliefhub-prod.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```
4. Restart `npm run dev`. The badge in the navbar will flip to **"Live Cloud"** with Firestore `onSnapshot` real-time sync.

---

Built with ❤️ for rapid disaster humanitarian relief.
