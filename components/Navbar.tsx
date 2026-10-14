"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isDemoMode } from "@/lib/store";
import { Radio, ShieldAlert, HeartHandshake, LayoutDashboard, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const [demo, setDemo] = useState(true);

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

        {/* Status Mode Badge */}
        <div className="flex items-center gap-3">
          <div
            title={
              demo
                ? "Demo Mode: Local in-memory store synced across browser tabs via BroadcastChannel. Preloaded with realistic Jaipur flood scenario."
                : "Live Mode: Realtime cloud sync with Firebase Firestore active."
            }
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-mono font-medium border shadow-inner transition-colors",
              demo
                ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
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
          </div>

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
  );
}
