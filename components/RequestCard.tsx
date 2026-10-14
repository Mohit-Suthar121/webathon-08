"use client";

import { useState } from "react";
import { ReliefRequest, ReliefSupply, RequestCategory } from "@/types";
import { formatTimeAgo, maskPhone, cn } from "@/lib/utils";
import { findSuggestedMatches } from "@/lib/matching";
import { assignSupply, updateRequestStatus, toggleVerifyRequest } from "@/lib/store";
import UrgencyRing from "./UrgencyRing";
import {
  LifeBuoy,
  Stethoscope,
  Droplets,
  Home,
  Utensils,
  MapPin,
  Users,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Flame,
  Sparkles,
  Info,
  Shield,
  Layers,
} from "lucide-react";

interface RequestCardProps {
  request: ReliefRequest;
  supplies: ReliefSupply[];
  allRequests?: ReliefRequest[];
  isSelected?: boolean;
  onSelect?: () => void;
  showPrivateDetails?: boolean; // Dispatcher view gets true, public gets false
}

const CATEGORY_ICON_MAP: Record<RequestCategory, any> = {
  rescue: LifeBuoy,
  medical: Stethoscope,
  water: Droplets,
  shelter: Home,
  food: Utensils,
};

const CATEGORY_STYLE: Record<
  RequestCategory,
  { label: string; bg: string; text: string; border: string }
> = {
  rescue: {
    label: "Rescue",
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/30",
  },
  medical: {
    label: "Medical",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
  },
  water: {
    label: "Water",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/30",
  },
  shelter: {
    label: "Shelter",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  food: {
    label: "Food",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
};

export default function RequestCard({
  request,
  supplies,
  allRequests = [],
  isSelected = false,
  onSelect,
  showPrivateDetails = true,
}: RequestCardProps) {
  const [expandedMatches, setExpandedMatches] = useState(false);
  const [showCredibilityTooltip, setShowCredibilityTooltip] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const Icon = CATEGORY_ICON_MAP[request.category] || AlertTriangle;
  const categoryStyle = CATEGORY_STYLE[request.category];

  // Enhanced auto-matches calculation with distance, stock, and competing demand
  const suggestedMatches = findSuggestedMatches(request, supplies, 3, allRequests);
  const assignedSupply = request.assignedSupplyId
    ? supplies.find((s) => s.id === request.assignedSupplyId)
    : null;

  // Compute Credibility Score & Reasons (Rule-based heuristic with AI assistance)
  const computeCredibility = () => {
    let score = 70;
    const reasons: string[] = [];

    const cleanPhone = request.contactPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length >= 10) {
      score += 10;
      reasons.push("Valid emergency telephone number format (+10)");
    } else {
      score -= 10;
      reasons.push("Short or unverified telephone contact (-10)");
    }

    if (request.description.length > 40) {
      score += 10;
      reasons.push("Detailed situational narrative (+10)");
    }

    // Corroboration in same ward
    const clusterMatches = allRequests.filter(
      (r) => r.id !== request.id && r.areaName === request.areaName
    );
    if (clusterMatches.length >= 2) {
      score += 10;
      reasons.push(`Corroborated by ${clusterMatches.length} concurrent calls in sector (+10)`);
    }

    if (request.peopleAffected >= 1 && request.peopleAffected <= 20) {
      score += 5;
      reasons.push("Plausible headcount profile (+5)");
    }

    const finalScore = Math.min(98, Math.max(30, score));
    return { score: finalScore, reasons };
  };

  const credibility = computeCredibility();

  const handleAssign = async (supplyId: string) => {
    setIsAssigning(true);
    try {
      await assignSupply(request.id, supplyId);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusChange = async (newStatus: ReliefRequest["status"]) => {
    await updateRequestStatus(request.id, newStatus);
  };

  const handleToggleVerify = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleVerifyRequest(request.id);
  };

  const isCritical = request.urgency === "critical";

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer border glass-panel",
        isSelected
          ? "border-rose-500 ring-2 ring-rose-500/30 bg-slate-900/90 shadow-xl"
          : "hover:border-slate-700/80 hover:bg-slate-900/70",
        isCritical && "border-rose-900/60"
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          {/* Category Icon */}
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border",
              categoryStyle.bg,
              categoryStyle.border,
              categoryStyle.text
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-300">
                {request.id}
              </span>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                  categoryStyle.bg,
                  categoryStyle.border,
                  categoryStyle.text
                )}
              >
                {categoryStyle.label}
              </span>

              {/* Urgency Badge */}
              <span
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                  isCritical
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                    : request.urgency === "high"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-sky-500/20 text-sky-300 border-sky-500/40"
                )}
              >
                {isCritical && <Flame className="h-3 w-3 text-rose-400" />}
                {request.urgency}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
              <Clock className="h-3 w-3 text-slate-500" />
              <span>{formatTimeAgo(request.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Urgency Ring with Score Breakdown */}
        <div className="shrink-0 flex items-center gap-2">
          <UrgencyRing
            score={request.urgencyScore}
            category={request.category}
            peopleAffected={request.peopleAffected}
            vulnerable={request.vulnerable}
            createdAt={request.createdAt}
            size="md"
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-200 leading-relaxed mb-3 font-normal">
        {request.description}
      </p>

      {/* Badges strip: People, Vulnerable, Location, Duplicate Warning, Verified, Credibility */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] mb-3">
        {/* People Count */}
        <span className="flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-1 text-slate-300 border border-slate-700/60 font-mono">
          <Users className="h-3.5 w-3.5 text-sky-400" />
          <span>
            {request.peopleAffected} {request.peopleAffected === 1 ? "person" : "people"}
          </span>
        </span>

        {/* Vulnerable Population Tag */}
        {request.vulnerable && (
          <span className="flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-1 text-rose-300 border border-rose-500/30 font-medium">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span>Vulnerable</span>
          </span>
        )}

        {/* Area Name */}
        <span className="flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-1 text-slate-300 border border-slate-700/60">
          <MapPin className="h-3.5 w-3.5 text-amber-400" />
          <span>{request.areaName}</span>
        </span>

        {/* Duplicate / Cluster Warning */}
        {request.duplicateWarning && (
          <span
            title="Cluster Alert: Corroborating incident with identical category within 300m in the last hour"
            className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-1 text-amber-300 border border-amber-500/40 text-[10px] font-bold"
          >
            <Layers className="h-3 w-3" />
            <span>Clustered SOS (300m)</span>
          </span>
        )}

        {/* AI Credibility Score with Tooltip */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowCredibilityTooltip((prev) => !prev);
            }}
            className="flex items-center gap-1 rounded-md bg-sky-950/60 hover:bg-sky-900/60 px-2 py-1 text-sky-300 border border-sky-500/30 text-[10px] font-mono cursor-pointer transition-colors"
          >
            <Shield className="h-3 w-3 text-sky-400" />
            <span>Credibility: {credibility.score}/100</span>
            <span className="rounded bg-sky-500/20 px-1 text-[8px] text-sky-300 uppercase">
              AI
            </span>
          </button>

          {showCredibilityTooltip && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 bottom-full mb-2 z-50 w-64 rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
                <span className="font-semibold text-white flex items-center gap-1 text-[11px]">
                  <Sparkles className="h-3 w-3 text-sky-400" />
                  AI-Assisted Credibility
                </span>
                <span className="font-mono font-bold text-sky-400 text-xs">
                  {credibility.score}/100
                </span>
              </div>
              <ul className="space-y-1 text-[10px] text-slate-300 mb-2">
                {credibility.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-emerald-400">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-slate-800 pt-1.5 text-[9px] text-amber-300/90 italic">
                *Advisory scoring only. Never auto-rejects; dispatcher makes final triage call.
              </p>
            </div>
          )}
        </div>

        {/* Verified Badge / Toggle Button */}
        {showPrivateDetails && (
          <button
            type="button"
            onClick={handleToggleVerify}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors border",
              request.verified
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200"
            )}
          >
            <ShieldCheck
              className={cn(
                "h-3.5 w-3.5",
                request.verified ? "text-emerald-400" : "text-slate-500"
              )}
            />
            <span>{request.verified ? "Verified Dispatch" : "Mark Verified"}</span>
          </button>
        )}
      </div>

      {/* Dispatcher Details: Phone & GPS */}
      {showPrivateDetails && (
        <div className="flex items-center justify-between border-t border-slate-800/70 pt-2.5 mb-2.5 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Phone className="h-3 w-3 text-emerald-400" />
            <span>{request.contactPhone}</span>
          </div>
          <div className="text-[10px] text-slate-500">
            {request.lat.toFixed(4)}, {request.lng.toFixed(4)}
          </div>
        </div>
      )}

      {/* Assigned Supply Info if already assigned */}
      {assignedSupply && (
        <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold">{assignedSupply.providerName}</p>
              <p className="text-[10px] text-emerald-400 font-mono">
                {assignedSupply.item} • {assignedSupply.areaName}
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
            Assigned
          </span>
        </div>
      )}

      {/* Auto-Match Suggested Supplies Collapsible */}
      {request.status === "open" && (
        <div className="mt-2 border-t border-slate-800/80 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedMatches((prev) => !prev);
            }}
            className="flex w-full items-center justify-between text-xs font-medium text-slate-300 hover:text-white py-1"
          >
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <LinkIcon className="h-3.5 w-3.5 text-rose-400" />
              <span>Suggested Matches</span>
              <span className="rounded bg-sky-500/20 px-1 py-0.2 text-[9px] font-bold text-sky-300 border border-sky-500/30">
                AI-Assisted
              </span>
              <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
                {suggestedMatches.length}
              </span>
            </span>
            {expandedMatches ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {expandedMatches && (
            <div className="mt-2 space-y-2">
              {suggestedMatches.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic p-2 bg-slate-900/40 rounded-lg">
                  No matching supplies currently available in this category ({request.category}).
                </p>
              ) : (
                suggestedMatches.map(({ supply, distanceKm, explanation }) => (
                  <div
                    key={supply.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-xs transition-colors hover:border-slate-700"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">
                          {supply.providerName}
                        </span>
                        <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                          {distanceKm} km away
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {supply.item} • {supply.quantity} units avail ({supply.areaName})
                      </p>
                      {/* 1-Line Plain Text Match Explanation */}
                      {explanation && (
                        <p className="text-[10px] text-emerald-400/90 mt-1 font-mono leading-tight">
                          💡 {explanation}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isAssigning}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssign(supply.id);
                      }}
                      className="shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-all shadow-md shadow-emerald-950/40 border border-emerald-500/40 cursor-pointer disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Status Transition Action Bar */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
        <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">
          Status:{" "}
          <strong
            className={cn(
              "font-bold",
              request.status === "open"
                ? "text-rose-400"
                : request.status === "assigned"
                ? "text-amber-400"
                : "text-emerald-400"
            )}
          >
            {request.status}
          </strong>
        </span>

        <div className="flex items-center gap-1.5">
          {request.status !== "open" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange("open");
              }}
              className="text-[10px] font-medium rounded px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
            >
              Reopen
            </button>
          )}

          {request.status === "open" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange("assigned");
              }}
              className="text-[10px] font-medium rounded px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
            >
              Mark Assigned
            </button>
          )}

          {request.status !== "fulfilled" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange("fulfilled");
              }}
              className="text-[10px] font-medium rounded px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
            >
              Mark Fulfilled
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
