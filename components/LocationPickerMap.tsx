"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

const DynamicPicker = dynamic(() => import("./LocationPickerInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 sm:h-72 w-full flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-rose-500 mb-2" />
      <span className="font-mono text-xs text-slate-400">Loading Pin Map...</span>
    </div>
  ),
});

export default function LocationPickerMap(props: LocationPickerProps) {
  return <DynamicPicker {...props} />;
}
