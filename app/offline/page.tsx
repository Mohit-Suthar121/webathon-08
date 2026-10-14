import Link from "next/link";
import { WifiOff, Radio, ShieldAlert, ArrowLeft } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070B14] p-4 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-6 shadow-2xl shadow-amber-500/10">
        <WifiOff className="h-10 w-10" />
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-mono text-amber-300 uppercase tracking-widest mb-3">
        <Radio className="h-3 w-3 animate-pulse" />
        Offline Emergency Shell Active
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-white max-w-md">
        Cellular Connection Lost
      </h1>

      <p className="text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
        ReliefHub is operating from local offline cache. Emergency requests and cached sector maps remain accessible on your device and will synchronize as soon as communication towers reconnect.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/request"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-rose-950/50 hover:from-rose-500 hover:to-rose-600 border border-rose-500/40"
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Open Emergency Form</span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-200 border border-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
