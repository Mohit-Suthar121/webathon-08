"use client";

import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import LiveMap from "@/components/LiveMap";
import RequestCard from "@/components/RequestCard";
import DispatchCharts from "@/components/DispatchCharts";
import StatCounter from "@/components/StatCounter";
import {
  subscribeRequests,
  subscribeSupplies,
  simulateIncomingRequest,
  seedDemoData,
} from "@/lib/store";
import { ReliefRequest, ReliefSupply, RequestCategory, RequestStatus } from "@/types";
import {
  Radio,
  Search,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  PlusCircle,
  BarChart3,
  Layers,
  Map as MapIcon,
  ListFilter,
  X,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DispatchCommandCenter() {
  const [requests, setRequests] = useState<ReliefRequest[]>([]);
  const [supplies, setSupplies] = useState<ReliefSupply[]>([]);

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

  // Live simulation notice toast
  const [simulating, setSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubReq = subscribeRequests((newReqs) => {
      setRequests(newReqs);
    });
    const unsubSup = subscribeSupplies((newSups) => {
      setSupplies(newSups);
    });

    return () => {
      unsubReq();
      unsubSup();
    };
  }, []);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Category filter
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      // Status filter
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      // Search query
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

  // Simulate an incoming crisis request
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

      {/* Floating Live Ingestion Toast */}
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
                </h1>
                <p className="text-[11px] text-slate-400 font-mono">
                  Live Algorithmic Priority Stream • Haversine Matching Engine
                </p>
              </div>
            </div>

            {/* Quick Demo Controls */}
            <div className="flex items-center gap-2">
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
                <span>{showChartsDrawer ? "Hide Telemetry" : "Telemetry Charts"}</span>
              </button>

              <button
                type="button"
                onClick={handleResetSeed}
                title="Reset and reload default 18 requests & 12 supplies"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Reset Seed</span>
              </button>

              <button
                type="button"
                disabled={simulating}
                onClick={handleSimulateIncoming}
                className="relative flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-rose-950/40 border border-rose-500/40 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Simulate Incoming SOS</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
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
                  isSelected={selectedRequestId === req.id}
                  onSelect={() => {
                    setSelectedRequestId(req.id);
                    setMobileTab("map"); // on mobile jump to map when tapped
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
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-1.5 backdrop-blur-md shadow-xl text-xs font-mono">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-slate-200 font-bold">CARTO Dark Grid</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400">📦 {activeSupplies} Supplies</span>
            <span className="text-slate-500">|</span>
            <span className="text-rose-400">🚨 {openCount} SOS</span>
          </div>

          <div className="h-full w-full">
            <LiveMap
              requests={filteredRequests}
              supplies={supplies}
              selectedRequestId={selectedRequestId}
              selectedSupplyId={selectedSupplyId}
              onSelectRequest={(r) => {
                setSelectedRequestId(r.id);
                // Also switch mobile tab if needed
              }}
              onSelectSupply={(s) => setSelectedSupplyId(s.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
