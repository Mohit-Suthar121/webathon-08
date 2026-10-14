"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LiveTicker from "@/components/LiveTicker";
import StatCounter from "@/components/StatCounter";
import { subscribeRequests, subscribeSupplies } from "@/lib/store";
import { ReliefRequest, ReliefSupply } from "@/types";
import {
  AlertTriangle,
  HeartHandshake,
  LayoutDashboard,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
  MapPin,
  Clock,
  CheckCircle2,
  PhoneCall,
  Search,
} from "lucide-react";

export default function LandingPage() {
  const [requests, setRequests] = useState<ReliefRequest[]>([]);
  const [supplies, setSupplies] = useState<ReliefSupply[]>([]);

  useEffect(() => {
    const unsubReq = subscribeRequests((reqs) => setRequests(reqs));
    const unsubSup = subscribeSupplies((sups) => setSupplies(sups));
    return () => {
      unsubReq();
      unsubSup();
    };
  }, []);

  const openCount = requests.filter((r) => r.status === "open").length;
  const criticalCount = requests.filter(
    (r) => r.status === "open" && r.urgency === "critical"
  ).length;
  const suppliesCount = supplies.filter((s) => s.available).length;
  const fulfilledCount = requests.filter((r) => r.status === "fulfilled").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] relative overflow-hidden bg-crisis-grid">
      <Navbar />
      <LiveTicker />

      {/* Hero Section */}
      <section className="relative px-4 pt-12 pb-16 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Glow Spheres & Radar Rings in Background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none">
          {/* Radar Ring 1 */}
          <div className="w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full border border-rose-500/10 animate-pulse-ring absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          {/* Radar Ring 2 */}
          <div className="w-[350px] h-[350px] sm:w-[480px] sm:h-[480px] rounded-full border border-sky-500/15 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          {/* Center glow mesh */}
          <div className="w-[300px] h-[300px] bg-gradient-to-tr from-rose-600/20 via-amber-500/10 to-sky-500/20 rounded-full blur-3xl opacity-70" />
        </div>

        {/* Hero Content */}
        <div className="text-center max-w-3xl mx-auto pt-6 sm:pt-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-mono font-semibold text-rose-300 mb-6 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>Real-Time Crisis Triage Active</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">Jaipur Flood Zone</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1] mb-6">
            Connect help to those who need it.{" "}
            <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-sky-400 bg-clip-text text-transparent">
              In real time.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-10">
            A high-speed humanitarian coordination hub. Citizens flag urgent relief, volunteer
            depots mobilize supplies, and dispatchers orchestrate live AI-prioritized rescues.
          </p>

          {/* Primary Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-14">
            <Link
              href="/request"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-3.5 text-base font-bold text-white shadow-xl shadow-rose-950/50 hover:from-rose-500 hover:to-rose-600 hover:scale-102 transition-all border border-rose-500/40"
            >
              <AlertTriangle className="h-5 w-5 text-rose-200" />
              <span>I Need Help (SOS)</span>
            </Link>

            <Link
              href="/offer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-900/90 px-6 py-3.5 text-base font-semibold text-emerald-300 border border-emerald-500/40 shadow-xl shadow-emerald-950/30 hover:bg-slate-800 hover:text-emerald-200 transition-all"
            >
              <HeartHandshake className="h-5 w-5 text-emerald-400" />
              <span>I Can Help / Supplies</span>
            </Link>
          </div>

          {/* Live Animated Count-Up KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <StatCounter
              value={openCount}
              label="Requests Open"
              color="rose"
              icon={AlertTriangle}
              trend={`${criticalCount} Critical SOS`}
            />
            <StatCounter
              value={suppliesCount}
              label="Supplies Ready"
              color="emerald"
              icon={HeartHandshake}
              trend="12 Depots Active"
            />
            <StatCounter
              value={fulfilledCount}
              label="Fulfilled Today"
              color="sky"
              icon={CheckCircle2}
              trend="100% Verified"
            />
            <StatCounter
              value={14}
              label="Avg Response"
              color="amber"
              suffix=" min"
              icon={Clock}
              trend="Target < 20 min"
            />
          </div>
        </div>
      </section>

      {/* Quick Mission Control Teaser Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-16">
        <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Dispatcher Mission Command Center
                <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300 border border-rose-500/30 uppercase">
                  Live View
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Full-height tactical dark CARTO map, color-coded urgency rings, automatic Haversine matching, and single-click dispatch linking.
              </p>
            </div>
          </div>

          <Link
            href="/dispatch"
            className="shrink-0 flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-100 border border-slate-600 transition-colors"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 3-Step "How It Works" Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-rose-400 font-bold mb-2">
            Crisis Coordination Protocol
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Engineered for speed when every second matters
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="glass-panel rounded-2xl p-6 border-slate-800 relative group hover:border-slate-700 transition-all">
            <div className="font-mono text-3xl font-black text-rose-500/30 mb-4">
              01
            </div>
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              Citizen Emergency SOS
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mobile-first low-bandwidth form. Pick rescue, medical, food, water, or shelter. Pin exact location on the satellite map with automatic GPS detection.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-panel rounded-2xl p-6 border-slate-800 relative group hover:border-slate-700 transition-all">
            <div className="font-mono text-3xl font-black text-amber-500/30 mb-4">
              02
            </div>
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Smart Urgency & Haversine Match
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Proprietary 0-100 scoring computes severity based on category weight, vulnerable victims, and wait time. Auto-pairs nearest matching supply depots in kilometers.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-panel rounded-2xl p-6 border-slate-800 relative group hover:border-slate-700 transition-all">
            <div className="font-mono text-3xl font-black text-emerald-500/30 mb-4">
              03
            </div>
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Instant Dispatch & Tracking
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              One-click assignment links supplies to rescue requests. Citizens receive an anonymized public tracking link to follow deployment progress in real time.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
