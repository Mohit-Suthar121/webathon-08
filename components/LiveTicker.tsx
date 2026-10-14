"use client";

import { useEffect, useState } from "react";
import { subscribeRequests } from "@/lib/store";
import { ReliefRequest } from "@/types";
import { formatTimeAgo } from "@/lib/utils";
import { AlertCircle, Flame, CheckCircle, Radio } from "lucide-react";
import Link from "next/link";

export default function LiveTicker() {
  const [requests, setRequests] = useState<ReliefRequest[]>([]);

  useEffect(() => {
    const unsub = subscribeRequests((all) => {
      setRequests(all.slice(0, 10));
    });
    return () => unsub();
  }, []);

  if (requests.length === 0) return null;

  return (
    <div className="w-full bg-[#0a101f]/90 border-y border-slate-800/80 py-2 overflow-hidden flex items-center">
      {/* Static Label Badge */}
      <div className="flex items-center gap-2 px-3 sm:px-4 z-10 bg-[#0a101f] border-r border-slate-800 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-rose-400 flex items-center gap-1">
          <Radio className="h-3 w-3" /> Live Feed
        </span>
      </div>

      {/* Marquee Scroller */}
      <div className="flex whitespace-nowrap overflow-x-auto no-scrollbar scroll-smooth items-center gap-6 px-4">
        {requests.map((r) => {
          const isCritical = r.urgency === "critical";
          const isFulfilled = r.status === "fulfilled";

          return (
            <Link
              key={r.id}
              href={`/track/${r.id}`}
              className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors shrink-0 group"
            >
              {isCritical ? (
                <Flame className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
              ) : isFulfilled ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              )}
              <span className="font-mono text-slate-400 group-hover:text-rose-400 text-[11px]">
                [{r.id}]
              </span>
              <span className="capitalize font-semibold text-slate-200">
                {r.category}:
              </span>
              <span className="max-w-[180px] sm:max-w-xs truncate text-slate-400">
                {r.description}
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded font-mono">
                {r.areaName}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {formatTimeAgo(r.createdAt)}
              </span>
              <span className="text-slate-700">|</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
