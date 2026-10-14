"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StatCounterProps {
  value: number;
  label: string;
  icon?: any;
  trend?: string;
  color?: "rose" | "emerald" | "sky" | "amber" | "purple";
  suffix?: string;
}

export default function StatCounter({
  value,
  label,
  icon: Icon,
  trend,
  color = "sky",
  suffix = "",
}: StatCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 800; // ms
    const steps = 24;
    const stepDuration = duration / steps;
    const diff = end - start;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      const progress = stepCount / steps;
      // ease-out quartic
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(start + diff * ease);

      setDisplayValue(current);

      if (stepCount >= steps) {
        clearInterval(timer);
        setDisplayValue(end);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  const colorStyles = {
    rose: {
      text: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      glow: "shadow-rose-950/40",
    },
    emerald: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      glow: "shadow-emerald-950/40",
    },
    sky: {
      text: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
      glow: "shadow-sky-950/40",
    },
    amber: {
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      glow: "shadow-amber-950/40",
    },
    purple: {
      text: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      glow: "shadow-purple-950/40",
    },
  }[color];

  return (
    <div
      className={cn(
        "glass-panel rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all duration-300 hover:border-slate-700/80 shadow-lg",
        colorStyles.border
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {Icon && (
          <div className={cn("p-2 rounded-xl border border-white/5", colorStyles.bg, colorStyles.text)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={cn("text-3xl sm:text-4xl font-extrabold font-mono tracking-tight", colorStyles.text)}>
          {displayValue}
          {suffix}
        </span>
        {trend && (
          <span className="text-[11px] font-mono text-slate-400">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
