"use client";

import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import LiveMap from "@/components/LiveMap";
import RequestCard from "@/components/RequestCard";
import DispatchCharts from "@/components/DispatchCharts";
import {
  subscribeRequests,
  subscribeSupplies,
  simulateIncomingRequest,
  seedDemoData,
} from "@/lib/store";
import {
  subscribeBlackouts,
  simulateBlackout,
  clearBlackouts,
} from "@/lib/blackout";
import {
  BlackoutAlert,
  FloodAdvisory,
  ReliefRequest,
  ReliefSupply,
} from "@/types";
import {
  Radio,
  Search,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  BarChart3,
  Map as MapIcon,
  ListFilter,
  X,
  CloudRain,
  FileText,
  AlertOctagon,
  Copy,
  Check,
  Shield,
  Layers,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DispatchCommandCenter() {
  const [requests, setRequests] = useState<ReliefRequest[]>([]);
  const [supplies, setSupplies] = useState<ReliefSupply[]>([]);
  const [blackoutAlerts, setBlackoutAlerts] = useState<BlackoutAlert[]>([]);

  // Selection states
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedSupplyId, setSelectedSupplyId] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Mobile active tab (feed vs map)
  const [mobileTab, setMobileTab] = useState<"feed" | "map">("feed");
  const [showChartsDrawer, setShowChartsDrawer] = useState<boolean>(false);

  // Flood Forecast state
  const [floodAdvisory, setFloodAdvisory] = useState<FloodAdvisory | null>(null);
  const [showFloodOverlay, setShowFloodOverlay] = useState<boolean>(false);
  const [showFloodPanel, setShowFloodPanel] = useState<boolean>(false);
  const [loadingFlood, setLoadingFlood] = useState<boolean>(false);

  // Situation Report (SitRep) Modal
  const [showSitRepModal, setShowSitRepModal] = useState<boolean>(false);
  const [sitRepData, setSitRepData] = useState<any | null>(null);
  const [loadingSitRep, setLoadingSitRep] = useState<boolean>(false);
  const [sitRepCopied, setSitRepCopied] = useState<boolean>(false);

  // Live simulation notice toast
  const [simulating, setSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubReq = subscribeRequests((newReqs) => setRequests(newReqs));
    const unsubSup = subscribeSupplies((newSups) => setSupplies(newSups));
    const unsubBlackout = subscribeBlackouts((alerts) => setBlackoutAlerts(alerts));

    // Fetch initial flood forecast
    fetchFloodForecast();

    return () => {
      unsubReq();
      unsubSup();
      unsubBlackout();
    };
  }, []);

  const fetchFloodForecast = async () => {
    setLoadingFlood(true);
    try {
      const res = await fetch("/api/ai/flood-forecast");
      if (res.ok) {
        const data = await res.json();
        setFloodAdvisory(data);
      }
    } catch (err) {
      console.warn("Could not fetch flood forecast:", err);
    } finally {
      setLoadingFlood(false);
    }
  };

  const handleGenerateSitRep = async () => {
    setShowSitRepModal(true);
    setLoadingSitRep(true);
    try {
      const res = await fetch("/api/ai/sitrep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests, supplies }),
      });
      if (res.ok) {
        const data = await res.json();
        setSitRepData(data);
      }
    } catch (err) {
      console.error("SitRep error:", err);
    } finally {
      setLoadingSitRep(false);
    }
  };

  const handleCopySitRep = () => {
    if (!sitRepData) return;
    const text = `SITUATION REPORT (SITREP) — RELIEF COMMAND
${sitRepData.sitrep}

TOP 5 PRIORITIES:
${sitRepData.topPriorities?.map((p: string) => `• ${p}`).join("\n")}

RECOMMENDED ACTIONS:
${sitRepData.recommendedActions?.map((a: string) => `✓ ${a}`).join("\n")}

RESOURCE BOTTLENECKS:
${sitRepData.resourceBottlenecks?.map((b: string) => `! ${b}`).join("\n")}`;

    navigator.clipboard.writeText(text);
    setSitRepCopied(true);
    setTimeout(() => setSitRepCopied(false), 2500);
  };

  // Blackout Demo Simulator
  const handleToggleBlackoutDemo = () => {
    if (blackoutAlerts.length > 0) {
      clearBlackouts();
      setToastMessage("Blackout alert cleared.");
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      const alert = simulateBlackout("Mansarovar Ward 14");
      setToastMessage(
        `Possible communication blackout in ${alert.wardName}, last signal ${alert.lastSignalAgoMinutes} min ago. Verify.`
      );
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.id.toLowerCase().includes(q) ||
          r.areaName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.contactPhone.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [requests, categoryFilter, statusFilter, searchQuery]);

  // KPIs
  const openCount = requests.filter((r) => r.status === "open").length;
  const criticalCount = requests.filter(
    (r) => r.status === "open" && r.urgency === "critical"
  ).length;
  const assignedCount = requests.filter((r) => r.status === "assigned").length;
  const fulfilledCount = requests.filter((r) => r.status === "fulfilled").length;
  const activeSupplies = supplies.filter((s) => s.available).length;

  const handleSimulateIncoming = async () => {
    setSimulating(true);
    try {
      const simulated = await simulateIncomingRequest();
      setToastMessage(
        `New ${simulated.urgency.toUpperCase()} SOS: ${simulated.category.toUpperCase()} (${simulated.peopleAffected} people) in ${simulated.areaName}`
      );
      setSelectedRequestId(simulated.id);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setSimulating(false);
    }
  };

  const handleResetSeed = async () => {
    if (confirm("Reset and reload fresh demo data (18 requests & 12 supplies in Jaipur)?")) {
      await seedDemoData(true);
      setToastMessage("Demo data refreshed successfully.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100 overflow-hidden">
      <Navbar />

      {/* Floating Live Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-2xl border border-rose-500/50 bg-slate-900/95 p-4 text-xs shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </div>
          <span className="font-mono font-bold text-white">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* SILENCE / BLACKOUT DETECTION BANNER (Must say 'possible' and 'verify') */}
      {blackoutAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="font-semibold">
              Possible communication blackout in {blackoutAlerts[0].wardName}, last signal{" "}
              {blackoutAlerts[0].lastSignalAgoMinutes} min ago. Verify with field responders or amateur radio.
            </span>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-mono text-amber-300 border border-amber-500/30 uppercase">
              AI Telemetry
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBlackoutDemo}
              className="text-[10px] font-mono rounded bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 text-amber-200 border border-amber-500/40"
            >
              Clear Blackout
            </button>
          </div>
        </div>
      )}

      {/* Top Mission Control Bar & KPI Strip */}
      <section className="border-b border-slate-800/80 bg-[#0a101f]/90 px-4 sm:px-6 py-3 shrink-0">
        <div className="mx-auto max-w-7xl">
          {/* Header & Simulator Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white font-mono font-bold shadow-lg shadow-rose-950/60">
                <Radio className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>DISPATCH COMMAND CENTER</span>
                  <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300 border border-rose-500/30">
                    SDRF JAIPUR
                  </span>
                  <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-sky-300 border border-sky-500/30">
                    AI Layer Active
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 font-mono">
                  Live Algorithmic Priority Stream • Multi-Factor Auto-Match • Blackout Triage
                </p>
              </div>
            </div>

            {/* Quick Demo Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* SitRep Button */}
              <button
                type="button"
                onClick={handleGenerateSitRep}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-950/40 border border-purple-500/40 transition-all cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-purple-200" />
                <span>Situation Report (SitRep)</span>
                <span className="rounded bg-purple-400/20 px-1 text-[9px]">AI</span>
              </button>

              {/* Flood Advisory Toggle */}
              <button
                type="button"
                onClick={() => setShowFloodPanel((prev) => !prev)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  showFloodPanel
                    ? "bg-sky-600 text-white border-sky-500"
                    : "bg-slate-900/80 text-sky-300 border-sky-500/40 hover:bg-slate-800"
                )}
              >
                <CloudRain className="h-3.5 w-3.5 text-sky-400" />
                <span>Flood Risk Forecast</span>
                <span className="rounded bg-sky-500/20 px-1 text-[9px]">Open-Meteo</span>
              </button>

              {/* Blackout Demo Toggle */}
              <button
                type="button"
                onClick={handleToggleBlackoutDemo}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                  blackoutAlerts.length > 0
                    ? "bg-amber-600/30 text-amber-300 border-amber-500/50"
                    : "bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800"
                )}
              >
                <AlertOctagon className="h-3.5 w-3.5 text-amber-400" />
                <span>{blackoutAlerts.length > 0 ? "Clear Blackout" : "Simulate Blackout"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowChartsDrawer((prev) => !prev)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  showChartsDrawer
                    ? "bg-slate-700 text-white border-slate-600"
                    : "bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800"
                )}
              >
                <BarChart3 className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden sm:inline">Telemetry</span>
              </button>

              <button
                type="button"
                onClick={handleResetSeed}
                title="Reset seed data"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3 text-amber-400" />
              </button>

              <button
                type="button"
                disabled={simulating}
                onClick={handleSimulateIncoming}
                className="relative flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-rose-950/40 border border-rose-500/40 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Simulate SOS</span>
              </button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300">
                Open Requests
              </span>
              <p className="font-mono text-2xl font-black text-rose-400">{openCount}</p>
            </div>

            <div className="rounded-xl border border-pink-500/30 bg-pink-500/10 px-3.5 py-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-pink-300 flex items-center gap-1">
                <Flame className="h-3 w-3" /> Critical Queue
              </span>
              <p className="font-mono text-2xl font-black text-pink-400">{criticalCount}</p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                Assigned
              </span>
              <p className="font-mono text-2xl font-black text-amber-400">{assignedCount}</p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Fulfilled
              </span>
              <p className="font-mono text-2xl font-black text-emerald-400">{fulfilledCount}</p>
            </div>

            <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-300 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Avg Response
              </span>
              <p className="font-mono text-2xl font-black text-sky-400">14 min</p>
            </div>
          </div>
        </div>
      </section>

      {/* FLOOD RISK FORECAST ADVISORY PANEL */}
      {showFloodPanel && floodAdvisory && (
        <section className="border-b border-sky-500/30 bg-[#071328] px-4 sm:px-6 py-4 animate-in slide-in-from-top-3 duration-200">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CloudRain className="h-4 w-4 text-sky-400" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-sky-300">
                    HYDROLOGICAL FLOOD RISK ADVISORY — JAIPUR METRO
                  </span>
                  <span className="rounded bg-sky-500/20 px-1.5 py-0.2 text-[9px] font-mono text-sky-300 border border-sky-500/40">
                    AI-Assisted
                  </span>
                </div>
                <p className="text-sm font-semibold text-white leading-relaxed max-w-3xl">
                  {floodAdvisory.advisory}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] font-mono text-slate-400">
                  <span>Current Rain: <strong className="text-white">{floodAdvisory.weatherSummary.currentRainMm} mm/h</strong></span>
                  <span>Forecast 24h: <strong className="text-sky-300">{floodAdvisory.weatherSummary.forecast24hMm} mm</strong></span>
                  <span>River Surge: <strong className="text-rose-400">{floodAdvisory.weatherSummary.riverDischargeEstimate}</strong></span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">Source: <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">{floodAdvisory.dataSource}</a></span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFloodOverlay((prev) => !prev)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer",
                    showFloodOverlay
                      ? "bg-rose-600 text-white border-rose-500 ring-2 ring-rose-500/40"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  )}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>{showFloodOverlay ? "Hide Map Overlay" : "Show Map Overlay"}</span>
                </button>
              </div>
            </div>

            {/* Recommended Pre-positioning */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
              {floodAdvisory.prePositionAdvice.map((advice, i) => (
                <div key={i} className="rounded-xl border border-sky-500/20 bg-slate-900/70 p-3 text-xs">
                  <span className="font-mono text-[10px] text-sky-400 font-bold uppercase">
                    Tactical Pre-positioning #{i + 1}
                  </span>
                  <p className="text-slate-200 mt-1 font-medium">{advice}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Optional Telemetry Charts Expandable Drawer */}
      {showChartsDrawer && (
        <section className="border-b border-slate-800 bg-[#090e1c] px-4 sm:px-6 py-4 animate-in slide-in-from-top-3 duration-200">
          <div className="mx-auto max-w-7xl">
            <DispatchCharts requests={requests} />
          </div>
        </section>
      )}

      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden border-b border-slate-800 bg-slate-950 px-4 py-2 gap-2">
        <button
          type="button"
          onClick={() => setMobileTab("feed")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-colors",
            mobileTab === "feed"
              ? "bg-slate-800 text-white border-slate-700"
              : "bg-slate-900/60 text-slate-400 border-slate-800"
          )}
        >
          <ListFilter className="h-4 w-4" />
          <span>Live Triage Feed ({filteredRequests.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("map")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-colors",
            mobileTab === "map"
              ? "bg-slate-800 text-white border-slate-700"
              : "bg-slate-900/60 text-slate-400 border-slate-800"
          )}
        >
          <MapIcon className="h-4 w-4" />
          <span>Tactical Map</span>
        </button>
      </div>

      {/* Main Command Workspace: 40% Feed | 60% Map */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left 40% Column: Live Feed */}
        <div
          className={cn(
            "w-full md:w-[42%] lg:w-[38%] xl:w-[36%] flex flex-col border-r border-slate-800/80 bg-[#070B14] overflow-hidden shrink-0",
            mobileTab === "feed" ? "flex" : "hidden md:flex"
          )}
        >
          {/* Feed Filter Strip */}
          <div className="p-3 border-b border-slate-800/80 bg-slate-950/80 space-y-2.5 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, area, category, phone..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {(["all", "open", "assigned", "fulfilled"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider font-semibold whitespace-nowrap border transition-colors",
                    statusFilter === st
                      ? "bg-slate-800 text-white border-slate-600 shadow-sm"
                      : "bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-slate-200"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "rescue", label: "Rescue" },
                  { id: "medical", label: "Medical" },
                  { id: "water", label: "Water" },
                  { id: "shelter", label: "Shelter" },
                  { id: "food", label: "Food" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors border",
                    categoryFilter === cat.id
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-slate-900/50 text-slate-400 border-slate-800 hover:text-slate-200"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Scrollable Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
                <Radio className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                <p className="text-xs font-semibold uppercase tracking-wider">
                  No requests matching active filters
                </p>
                <button
                  onClick={() => {
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                  className="mt-3 text-xs text-rose-400 hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              filteredRequests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  supplies={supplies}
                  allRequests={requests}
                  isSelected={selectedRequestId === req.id}
                  onSelect={() => {
                    setSelectedRequestId(req.id);
                    setMobileTab("map");
                  }}
                  showPrivateDetails={true}
                />
              ))
            )}
          </div>
        </div>

        {/* Right 60% Column: Tactical Dark Map */}
        <div
          className={cn(
            "flex-1 flex flex-col relative overflow-hidden bg-[#070B14]",
            mobileTab === "map" ? "flex h-[calc(100vh-14rem)] md:h-auto" : "hidden md:flex"
          )}
        >
          {/* Map Top Bar */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-1.5 backdrop-blur-md shadow-xl text-xs font-mono">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-slate-200 font-bold">CARTO Dark Grid</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400">📦 {activeSupplies} Supplies</span>
            <span className="text-slate-500">|</span>
            <span className="text-rose-400">🚨 {openCount} SOS</span>
            {blackoutAlerts.length > 0 && (
              <>
                <span className="text-slate-500">|</span>
                <span className="text-amber-400 font-bold animate-pulse">
                  ⚠️ Blackout ({blackoutAlerts[0].wardName})
                </span>
              </>
            )}
            <button
              onClick={() => setShowFloodOverlay((p) => !p)}
              className={cn(
                "ml-2 px-2 py-0.5 rounded text-[10px] font-bold transition-colors border",
                showFloodOverlay
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
              )}
            >
              Flood Overlay: {showFloodOverlay ? "ON" : "OFF"}
            </button>
          </div>

          <div className="h-full w-full">
            <LiveMap
              requests={filteredRequests}
              supplies={supplies}
              blackoutAlerts={blackoutAlerts}
              floodZones={floodAdvisory?.wardRisks}
              showFloodOverlay={showFloodOverlay}
              selectedRequestId={selectedRequestId}
              selectedSupplyId={selectedSupplyId}
              onSelectRequest={(r) => setSelectedRequestId(r.id)}
              onSelectSupply={(s) => setSelectedSupplyId(s.id)}
            />
          </div>
        </div>
      </div>

      {/* SITUATION REPORT (SITREP) MODAL */}
      {showSitRepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-900/95 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Disaster Situation Report (SitRep)</span>
                    <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-mono text-purple-300 border border-purple-500/40 uppercase">
                      AI-Assisted
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Generated for State Disaster Response Force (SDRF) Incident Command
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSitRepModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingSitRep ? (
              <div className="py-16 text-center text-slate-400">
                <Sparkles className="mx-auto h-8 w-8 text-purple-400 animate-spin mb-3" />
                <p className="font-mono text-xs uppercase tracking-wider">
                  Synthesizing Live Disaster Telemetry...
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Analyzing 18 requests, 12 supplies, rainfall forecasts, and bottleneck matrices.
                </p>
              </div>
            ) : sitRepData ? (
              <div className="space-y-6 pt-6 text-xs">
                {/* Executive Summary */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="text-[10px] uppercase font-mono font-bold text-purple-400">
                    Executive Operational Assessment
                  </span>
                  <p className="text-slate-200 mt-1.5 leading-relaxed text-sm">
                    {sitRepData.sitrep}
                  </p>
                </div>

                {/* Top 5 Priorities */}
                <div>
                  <h4 className="font-mono text-xs uppercase font-bold text-rose-400 mb-2.5 flex items-center gap-1.5">
                    <Flame className="h-4 w-4" />
                    Top 5 Life-Critical Priorities
                  </h4>
                  <div className="space-y-2">
                    {sitRepData.topPriorities?.map((p: string, i: number) => (
                      <div
                        key={i}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-slate-200"
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Tactical Actions */}
                <div>
                  <h4 className="font-mono text-xs uppercase font-bold text-emerald-400 mb-2.5 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Recommended Immediate Deployments
                  </h4>
                  <div className="space-y-2">
                    {sitRepData.recommendedActions?.map((a: string, i: number) => (
                      <div
                        key={i}
                        className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-emerald-200 flex items-start gap-2"
                      >
                        <span className="text-emerald-400 font-bold shrink-0">✓</span>
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resource Bottlenecks */}
                {sitRepData.resourceBottlenecks && sitRepData.resourceBottlenecks.length > 0 && (
                  <div>
                    <h4 className="font-mono text-xs uppercase font-bold text-amber-400 mb-2.5 flex items-center gap-1.5">
                      <AlertOctagon className="h-4 w-4" />
                      Critical Resource Bottlenecks
                    </h4>
                    <div className="space-y-1.5">
                      {sitRepData.resourceBottlenecks.map((b: string, i: number) => (
                        <div
                          key={i}
                          className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-amber-300 font-mono text-[11px]"
                        >
                          ⚠️ {b}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer disclaimer and copy */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
                  <span className="italic flex items-center gap-1 text-slate-400">
                    <Shield className="h-3.5 w-3.5 text-sky-400" />
                    AI-assisted situational intelligence. Human dispatcher retains operational command.
                  </span>

                  <button
                    onClick={handleCopySitRep}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white border border-slate-700 transition-colors cursor-pointer"
                  >
                    {sitRepCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-300" />
                        <span>Copy SitRep for Briefing</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
