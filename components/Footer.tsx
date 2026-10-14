import Link from "next/link";
import { Shield, PhoneCall, Lock, AlertCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-[#070B14]/90 py-10 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-rose-500" />
              <span className="font-mono font-bold text-white tracking-wide">
                ReliefHub Crisis Protocol
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              A high-velocity, real-time crisis coordination system designed to eliminate dispatch bottlenecks
              during floods, earthquakes, and emergency disasters. Built for frontline first responders and citizens.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Public views display approximate area only. Personal contacts restricted to dispatchers.</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Emergency Hotlines
            </h4>
            <ul className="text-xs space-y-1.5 text-slate-400">
              <li className="flex items-center gap-1.5 text-rose-400 font-medium">
                <PhoneCall className="h-3.5 w-3.5" />
                <span>National Emergency: 112</span>
              </li>
              <li>State Disaster (SDRF): 1070</li>
              <li>Fire & Rescue: 101</li>
              <li>Ambulance Emergency: 108</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Trust & Safety
            </h4>
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Client Rate Limiting Active</span>
              </div>
              <p className="text-[11px] text-slate-400">
                To prevent triage flooding, requests are rate-limited to 3 per hour per phone number.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/60 pt-6 text-[11px] text-slate-500">
          <p>© 2026 ReliefHub Disaster Response Network. Open Source Crisis Architecture.</p>
          <div className="flex gap-4 mt-2 sm:mt-0 font-mono text-[10px]">
            <span className="text-emerald-400">● 99.9% Uptime Triage</span>
            <span className="text-sky-400">● Dynamic Haversine Match Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
