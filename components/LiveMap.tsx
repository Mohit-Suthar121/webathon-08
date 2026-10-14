"use client";

import dynamic from "next/dynamic";
import { BlackoutAlert, FloodRiskZone, ReliefRequest, ReliefSupply } from "@/types";
import { Loader2 } from "lucide-react";

interface LiveMapProps {
  requests: ReliefRequest[];
  supplies: ReliefSupply[];
  blackoutAlerts?: BlackoutAlert[];
  floodZones?: FloodRiskZone[];
  showFloodOverlay?: boolean;
  selectedRequestId?: string | null;
  selectedSupplyId?: string | null;
  onSelectRequest?: (req: ReliefRequest) => void;
  onSelectSupply?: (sup: ReliefSupply) => void;
}

const DynamicMap = dynamic(() => import("./LiveMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#070B14] p-8 text-center">
      <div className="relative mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-slate-700">
        <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
      </div>
      <p className="font-mono text-xs uppercase tracking-wider text-slate-400">
        Loading Satellite Tactical Map...
      </p>
      <p className="text-[11px] text-slate-500 mt-1">Connecting to CARTO Dark basemap</p>
    </div>
  ),
});

export default function LiveMap(props: LiveMapProps) {
  return <DynamicMap {...props} />;
}
