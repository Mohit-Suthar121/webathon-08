import { ReliefSupply } from "@/types";
import { formatTimeAgo, cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/scoring";
import { Building2, Heart, Users, MapPin, Phone, Package, CheckCircle, XCircle } from "lucide-react";

interface SupplyCardProps {
  supply: ReliefSupply;
  onSelect?: () => void;
  isSelected?: boolean;
}

const PROVIDER_TYPE_MAP = {
  ngo: { label: "Registered NGO", icon: Building2, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  hub: { label: "Disaster Hub", icon: Users, color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  volunteer: { label: "Volunteer Group", icon: Heart, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
};

export default function SupplyCard({ supply, onSelect, isSelected }: SupplyCardProps) {
  const providerConfig = PROVIDER_TYPE_MAP[supply.type] || PROVIDER_TYPE_MAP.volunteer;
  const ProviderIcon = providerConfig.icon;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-2xl p-4 transition-all duration-200 cursor-pointer border glass-panel",
        isSelected
          ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-slate-900/90 shadow-xl"
          : "hover:border-slate-700/80 hover:bg-slate-900/70",
        !supply.available && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-slate-300">
              {supply.id}
            </span>
            <span
              className={cn(
                "flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                providerConfig.color
              )}
            >
              <ProviderIcon className="h-3 w-3" />
              {providerConfig.label}
            </span>
          </div>

          <h3 className="text-sm font-bold text-white tracking-tight">
            {supply.providerName}
          </h3>
        </div>

        <div className="text-right">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border font-mono",
              supply.available
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700"
            )}
          >
            {supply.available ? (
              <>
                <CheckCircle className="h-3 w-3" /> Ready
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" /> Depleted
              </>
            )}
          </span>
          <p className="text-[10px] text-slate-400 font-mono mt-1">
            {formatTimeAgo(supply.createdAt)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Package className="h-3.5 w-3.5 text-amber-400" />
            <span>{CATEGORY_LABELS[supply.category] || supply.category}</span>
          </span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {supply.quantity} units
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-200 font-semibold">{supply.item}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1 border-t border-slate-800/80">
        <span className="flex items-center gap-1 text-[11px] text-slate-300">
          <MapPin className="h-3.5 w-3.5 text-amber-400" />
          {supply.areaName}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <Phone className="h-3 w-3 text-emerald-400" />
          {supply.contactPhone}
        </span>
      </div>
    </div>
  );
}
