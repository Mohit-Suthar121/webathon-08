"use client";

import { useState, useEffect } from "react";
import { calculateUrgencyScore } from "@/lib/scoring";
import { RequestCategory } from "@/types";
import { cn } from "@/lib/utils";
import { HelpCircle, Info } from "lucide-react";

interface UrgencyRingProps {
  score: number;
  category: RequestCategory;
  peopleAffected: number;
  vulnerable: boolean;
  createdAt: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function UrgencyRing({
  score,
  category,
  peopleAffected,
  vulnerable,
  createdAt,
  size = "md",
  showLabel = true,
}: UrgencyRingProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const [currentTime, setCurrentTime] = useState<number>(createdAt);

  useEffect(() => {
    setCurrentTime(Date.now());
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Recalculate breakdown dynamically
  const { breakdown } = calculateUrgencyScore(
    category,
    peopleAffected,
    vulnerable,
    createdAt,
    currentTime
  );

  const radius = size === "sm" ? 14 : size === "lg" ? 22 : 18;
  const stroke = size === "sm" ? 3 : size === "lg" ? 4 : 3.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const dimension = (radius + stroke) * 2;

  // Determine color scheme
  let color = "#38BDF8"; // Cyan
  let textColor = "text-sky-400";
  let bgBadge = "bg-sky-500/10 border-sky-500/20";
  let statusText = "Standard";

  if (score >= 70) {
    color = "#F43F5E"; // Rose / Red
    textColor = "text-rose-400";
    bgBadge = "bg-rose-500/15 border-rose-500/30";
    statusText = "Critical";
  } else if (score >= 45) {
    color = "#F59E0B"; // Amber
    textColor = "text-amber-400";
    bgBadge = "bg-amber-500/15 border-amber-500/30";
    statusText = "Elevated";
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <div
        className="relative cursor-pointer group"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip((prev) => !prev)}
        title={breakdown.explanation}
      >
        <svg
          width={dimension}
          height={dimension}
          className="-rotate-90 transform"
        >
          {/* Background circle */}
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            className="text-slate-800"
          />
          {/* Progress circle */}
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-mono font-bold leading-none select-none",
              textColor,
              size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs"
            )}
          >
            {Math.round(score)}
          </span>
        </div>
      </div>

      {showLabel && (
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border",
            bgBadge,
            textColor
          )}
        >
          {statusText}
        </span>
      )}

      {/* Explanatory Tooltip Popover */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs shadow-2xl backdrop-blur-md transition-all">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
            <span className="font-semibold text-white flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-rose-400" />
              Urgency Algorithm (0-100)
            </span>
            <span className={cn("font-mono font-bold text-xs", textColor)}>
              {Math.round(score)} pts
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Category Weight:</span>
              <span className="font-mono text-slate-200">+{breakdown.categoryPts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">People Impact (capped 20):</span>
              <span className="font-mono text-slate-200">+{breakdown.peoplePts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Vulnerable Multiplier:</span>
              <span className="font-mono text-slate-200">+{breakdown.vulnerablePts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Waiting Time Bonus (1pt/5m):</span>
              <span className="font-mono text-slate-200">+{breakdown.waitingPts}</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 leading-tight">
            Formula: <span className="font-mono text-slate-300">{breakdown.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
}
