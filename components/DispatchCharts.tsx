"use client";

import { useState, useEffect } from "react";
import { ReliefRequest } from "@/types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { CATEGORY_LABELS } from "@/lib/scoring";

interface DispatchChartsProps {
  requests: ReliefRequest[];
}

const CATEGORY_COLORS: Record<string, string> = {
  rescue: "#FB7185",
  medical: "#F43F5E",
  water: "#38BDF8",
  shelter: "#A78BFA",
  food: "#F59E0B",
};

export default function DispatchCharts({ requests }: DispatchChartsProps) {
  // Aggregate by category
  const categoryCountMap: Record<string, number> = {
    rescue: 0,
    medical: 0,
    water: 0,
    shelter: 0,
    food: 0,
  };

  requests.forEach((r) => {
    if (categoryCountMap[r.category] !== undefined) {
      categoryCountMap[r.category]++;
    }
  });

  const categoryData = Object.entries(categoryCountMap).map(([cat, count]) => ({
    name: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
    key: cat,
    value: count,
  }));

  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  // Timeline buckets (past 3 hours in 30-min buckets)
  const now = currentTime || 1700000000000;
  const bucketDuration = 30 * 60 * 1000;
  const buckets: { timeLabel: string; requests: number; critical: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const bucketStart = now - (i + 1) * bucketDuration;
    const bucketEnd = now - i * bucketDuration;
    const label = `${(i * 30)}m ago`;

    const inBucket = requests.filter(
      (r) => r.createdAt >= bucketStart && r.createdAt < bucketEnd
    );
    const criticalInBucket = inBucket.filter((r) => r.urgency === "critical");

    buckets.push({
      timeLabel: i === 0 ? "Now" : label,
      requests: inBucket.length,
      critical: criticalInBucket.length,
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Donut Chart: Requests by Category */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Requests by Category
          </h4>
          <span className="text-[10px] font-mono text-slate-400">
            {requests.length} Total
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={58}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.map((entry) => (
                  <Cell
                    key={`cell-${entry.key}`}
                    fill={CATEGORY_COLORS[entry.key] || "#94a3b8"}
                  />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#F8FAFC",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-800/80 text-[10px]">
          {categoryData.map((cat) => (
            <div key={cat.key} className="flex items-center gap-1 font-mono">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[cat.key] }}
              />
              <span className="text-slate-300 capitalize">{cat.key}:</span>
              <span className="font-bold text-white">{cat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Area Chart: Incoming Crisis Volume Timeline */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Crisis Surge Volume (Last 3 Hours)
          </h4>
          <span className="text-[10px] font-mono text-rose-400">
            ● Red = Critical Queue
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={buckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#F8FAFC",
                }}
              />
              <Area
                type="monotone"
                dataKey="requests"
                name="All Requests"
                stroke="#38BDF8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRequests)"
              />
              <Area
                type="monotone"
                dataKey="critical"
                name="Critical"
                stroke="#F43F5E"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCritical)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
          <span>Telemetry Bucket: 30-min window</span>
          <span className="font-mono text-emerald-400">Real-Time Ingestion</span>
        </div>
      </div>
    </div>
  );
}
