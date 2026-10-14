"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isDemoMode } from "@/lib/store";
import {
  Radio,
  ShieldAlert,
  HeartHandshake,
  LayoutDashboard,
  AlertTriangle,
  Sparkles,
  KeyRound,
  CheckCircle2,
  X,
  Server,
  Database,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const [demo, setDemo] = useState(true);
  const [showKeysModal, setShowKeysModal] = useState(false);

  useEffect(() => {
    setDemo(isDemoMode());
  }, []);

  const navLinks = [
    { href: "/", label: "Overview", icon: Radio },
    { href: "/request", label: "I Need Help", icon: AlertTriangle, highlight: true },
    { href: "/offer", label: "Offer Supplies", icon: HeartHandshake },
    { href: "/dispatch", label: "Command Center", icon: LayoutDashboard },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#070B14]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand / Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white font-mono">
                  Relief<span className="text-rose-500">Hub</span>
                </span>
                <span className="hidden sm:inline-block rounded border border-slate-700 bg-slate-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  v2.4 Live
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block tracking-wide">
                Crisis Coordination Network
              </p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-slate-800/90 text-white shadow-sm border border-slate-700/60"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200",
                    link.highlight && !isActive && "text-rose-400 hover:text-rose-300"
                  )}
                >
                  <Icon className={cn("h-4 w-4", link.highlight ? "text-rose-400" : "text-slate-400")} />
                  <span className={cn(link.highlight ? "font-semibold" : "")}>{link.label}</span>
                  {link.highlight && (
                    <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      SOS
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Status Mode Badge & API Info Trigger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowKeysModal(true)}
              title="Click to view API Keys & Cloud Backend status"
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-mono font-medium border shadow-inner transition-colors cursor-pointer",
                demo
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
              )}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    demo ? "bg-amber-400" : "bg-emerald-400"
                  )}
                ></span>
                <span
                  className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    demo ? "bg-amber-500" : "bg-emerald-500"
                  )}
                ></span>
              </span>
              <span className="tracking-wider uppercase text-[11px] font-bold">
                {demo ? "Demo Mode" : "Live Cloud"}
              </span>
              <KeyRound className="h-3 w-3 text-slate-400 ml-0.5" />
            </button>

            <Link
              href="/dispatch"
              className="hidden lg:flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-rose-950/40 hover:from-rose-500 hover:to-rose-600 transition-all border border-rose-500/40"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Mission Control</span>
            </Link>
          </div>
        </div>
      </header>

      {/* API KEYS & CLOUD STATUS MODAL */}
      {showKeysModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900/95 p-6 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">API Keys & Cloud Connectivity</h3>
                  <p className="text-xs text-slate-400">Environment and API status overview</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeysModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              {/* Firebase Cloud Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-amber-400" />
                    <span className="font-bold text-white text-sm">Firebase Cloud Firestore</span>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                      !demo
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    )}
                  >
                    {!demo ? "Connected (Live)" : "Demo Sync Active"}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {!demo
                    ? "Live multi-client Firestore onSnapshot active for webathon-391d1."
                    : "Running with BroadcastChannel cross-tab realtime sync. Keys loaded in .env.local will activate Live Cloud upon server restart."}
                </p>
                <div className="mt-2.5 rounded-lg bg-slate-900 border border-slate-800 p-2 font-mono text-[10px] text-slate-400 space-y-1">
                  <div>Project ID: <span className="text-slate-200">webathon-391d1</span></div>
                  <div>Storage Bucket: <span className="text-slate-200">webathon-391d1.firebasestorage.app</span></div>
                </div>
              </div>

              {/* Gemini AI Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-purple-400" />
                    <span className="font-bold text-white text-sm">Gemini AI Engine</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Ready in .env.local
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Gemini API is isolated on Next.js server route handlers (app/api/ai/*). Powers Multilingual Voice Intake, Situation Reports, and Flood Advisories.
                </p>
                <div className="mt-2.5 rounded-lg bg-slate-900 border border-slate-800 p-2 font-mono text-[10px] text-slate-400">
                  Model: <span className="text-purple-300">gemini-2.5-flash / gemini-1.5-flash</span>
                </div>
              </div>

              {/* Note */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[11px] text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">All API Keys Configured in .env.local</p>
                  <p className="mt-0.5 text-emerald-300/90">
                    Your Firebase and Gemini API keys are safely persisted in .env.local and .env. If you ever update keys, restart <code>npm run dev</code> once so the server picks up the new environment.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowKeysModal(false)}
                className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-white border border-slate-700 transition-colors cursor-pointer"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
