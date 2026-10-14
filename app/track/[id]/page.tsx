"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UrgencyRing from "@/components/UrgencyRing";
import { subscribeRequests, subscribeSupplies } from "@/lib/store";
import { ReliefRequest, ReliefSupply } from "@/types";
import { maskPhone, maskCoords, formatTimeAgo, cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/scoring";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Users,
  Phone,
  ArrowLeft,
  Share2,
  Lock,
  ExternalLink,
  Loader2,
} from "lucide-react";

export default function TrackRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-[#070B14] items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-3" />
          <span className="font-mono text-xs">Loading incident status...</span>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}

function TrackContent() {
  const routeParams = useParams();
  const targetId = ((routeParams?.id as string) || "").trim();

  const [requests, setRequests] = useState<ReliefRequest[]>([]);
  const [supplies, setSupplies] = useState<ReliefSupply[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubReq = subscribeRequests((reqs) => setRequests(reqs));
    const unsubSup = subscribeSupplies((sups) => setSupplies(sups));
    return () => {
      unsubReq();
      unsubSup();
    };
  }, []);

  const request = requests.find(
    (r) => r.id.toLowerCase() === targetId.toLowerCase()
  );
  const assignedSupply = request?.assignedSupplyId
    ? supplies.find((s) => s.id === request.assignedSupplyId)
    : null;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getStatusStep = (status: ReliefRequest["status"]) => {
    if (status === "fulfilled") return 3;
    if (status === "assigned") return 2;
    return 1;
  };

  const currentStep = request ? getStatusStep(request.status) : 1;

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] bg-crisis-grid">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to ReliefHub</span>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 text-rose-400" />
            <span>{copied ? "Link Copied!" : "Share Tracking Link"}</span>
          </button>
        </div>

        {!request ? (
          <div className="glass-panel-elevated rounded-3xl p-8 sm:p-12 text-center border border-slate-800">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
            <h1 className="text-xl font-bold text-white mb-2">
              Request [{targetId}] Not Found
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              This request ID may have expired or belongs to a different regional dispatch cluster. Check the tracking ID and try again.
            </p>
            <Link
              href="/request"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg"
            >
              Submit New SOS Request
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Status Ticket Header */}
            <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-rose-400 uppercase tracking-widest">
                      PUBLIC INCIDENT STATUS
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Logged {formatTimeAgo(request.createdAt)}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-mono font-black text-white">
                    {request.id}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <UrgencyRing
                    score={request.urgencyScore}
                    category={request.category}
                    peopleAffected={request.peopleAffected}
                    vulnerable={request.vulnerable}
                    createdAt={request.createdAt}
                    size="lg"
                  />
                </div>
              </div>

              {/* Status Timeline */}
              <div className="py-8">
                <div className="relative flex flex-col md:flex-row justify-between gap-6">
                  {/* Step 1 */}
                  <div className="flex items-start md:flex-col md:items-center gap-3 md:text-center flex-1">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-lg",
                        currentStep >= 1
                          ? "bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20"
                          : "bg-slate-800 text-slate-500"
                      )}
                    >
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">1. SOS Received</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Queued in live dispatcher command stream
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start md:flex-col md:items-center gap-3 md:text-center flex-1">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-lg",
                        currentStep >= 2
                          ? "bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20"
                          : currentStep === 1
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                          : "bg-slate-800 text-slate-500"
                      )}
                    >
                      {currentStep >= 2 ? "✓" : "2"}
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-xs font-bold",
                          currentStep >= 2 ? "text-white" : "text-amber-300"
                        )}
                      >
                        2. Supply Hub Paired
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {assignedSupply
                          ? `Matched to ${assignedSupply.providerName}`
                          : "Algorithmic search for nearest inventory depot"}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start md:flex-col md:items-center gap-3 md:text-center flex-1">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-lg",
                        currentStep === 3
                          ? "bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20"
                          : "bg-slate-800 text-slate-500"
                      )}
                    >
                      {currentStep === 3 ? "✓" : "3"}
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-xs font-bold",
                          currentStep === 3 ? "text-emerald-400" : "text-slate-400"
                        )}
                      >
                        3. Relief Delivered
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Assistance delivered & verified by responders
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Public Redacted Incident Details */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 font-mono text-[11px] uppercase">
                    Description of Emergency
                  </span>
                  <p className="text-slate-200 mt-1 leading-relaxed">{request.description}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Category</span>
                    <p className="font-bold text-white capitalize mt-0.5">
                      {CATEGORY_LABELS[request.category] || request.category}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Affected</span>
                    <p className="font-bold text-white mt-0.5">
                      {request.peopleAffected} People {request.vulnerable && "(Vulnerable)"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Sector</span>
                    <p className="font-bold text-white mt-0.5">{request.areaName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400">
                      Current Status
                    </span>
                    <p
                      className={cn(
                        "font-bold uppercase mt-0.5",
                        request.status === "open"
                          ? "text-rose-400"
                          : request.status === "assigned"
                          ? "text-amber-400"
                          : "text-emerald-400"
                      )}
                    >
                      {request.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust & Privacy Notice */}
              <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-slate-400 text-xs">
                <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-300">Privacy Protection:</span> Exact phone
                  numbers and GPS pinpoint telemetry are hidden on public links to prevent abuse.
                  Only authorized dispatchers can view direct contact coordinates.
                </div>
              </div>
            </div>

            {/* Emergency Support Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white">Need immediate life-critical rescue?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  If water level is rapidly rising or situation turns critical, call national emergency services directly.
                </p>
              </div>

              <a
                href="tel:112"
                className="shrink-0 flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>Call 112 Hotline</span>
              </a>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
