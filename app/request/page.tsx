"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryPicker from "@/components/CategoryPicker";
import LocationPickerMap from "@/components/LocationPickerMap";
import { RequestCategory, UrgencyLevel } from "@/types";
import { createRequest } from "@/lib/store";
import { checkPhoneRateLimit, recordPhoneSubmission } from "@/lib/rateLimit";
import { COMMON_AREAS, DEFAULT_MAP_CENTER } from "@/lib/geo";
import confetti from "canvas-confetti";
import {
  AlertTriangle,
  LocateFixed,
  Users,
  ShieldAlert,
  ArrowRight,
  CheckCircle,
  Phone,
  Clock,
  MapPin,
  Flame,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function RequestHelpPage() {
  const [category, setCategory] = useState<RequestCategory>("medical");
  const [urgency, setUrgency] = useState<UrgencyLevel>("critical");
  const [peopleAffected, setPeopleAffected] = useState<number>(3);
  const [vulnerable, setVulnerable] = useState<boolean>(true);
  const [description, setDescription] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [areaName, setAreaName] = useState<string>("Sanganer Lowland Basin");
  const [lat, setLat] = useState<number>(DEFAULT_MAP_CENTER.lat);
  const [lng, setLng] = useState<number>(DEFAULT_MAP_CENTER.lng);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<any | null>(null);

  // Browser Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setAreaName("Current GPS Location (Citizen Pinned)");
      },
      (err) => {
        alert("Could not access GPS location. Please pick an area below or pin on map.");
      }
    );
  };

  const handleSelectCommonArea = (area: (typeof COMMON_AREAS)[0]) => {
    setAreaName(area.name);
    setLat(area.lat);
    setLng(area.lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRateLimitError(null);

    // 1. Phone validation
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setRateLimitError("Please provide a valid emergency phone number.");
      return;
    }

    // 2. Client Rate Limit Check
    const rateCheck = checkPhoneRateLimit(cleanPhone);
    if (!rateCheck.allowed) {
      setRateLimitError(rateCheck.message || "Emergency rate limit exceeded for this phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newReq = await createRequest({
        category,
        urgency,
        peopleAffected: Math.max(1, peopleAffected),
        vulnerable,
        description: description.trim() || `Emergency relief request for ${category} assistance.`,
        areaName,
        lat,
        lng,
        contactPhone: cleanPhone,
        status: "open",
      });

      recordPhoneSubmission(cleanPhone);
      setSubmittedRequest(newReq);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // safe ignore
      }
    } catch (err) {
      console.error("Failed to submit request:", err);
      setRateLimitError("An error occurred while creating your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] bg-crisis-grid">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {submittedRequest ? (
          /* Animated Success State with Tracking ID and Status Timeline */
          <div className="glass-panel-elevated rounded-3xl p-6 sm:p-10 border border-emerald-500/40 shadow-2xl text-center max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="h-9 w-9" />
            </div>

            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 font-mono text-xs font-bold text-emerald-300 uppercase tracking-widest">
              Emergency Broadcast Dispatched
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 mb-2">
              Help Request Dispatched to Command
            </h1>

            <p className="text-sm text-slate-300 mb-6">
              Your request has entered the live triage queue with an urgency score of{" "}
              <strong className="text-rose-400 font-mono font-bold">
                {Math.round(submittedRequest.urgencyScore)}/100
              </strong>
              . Responders in your sector have been alerted.
            </p>

            {/* Tracking ID Ticket Box */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4 mb-8 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400">
                    Emergency Tracking ID
                  </span>
                  <p className="text-xl font-mono font-black text-white tracking-wider">
                    {submittedRequest.id}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Category</span>
                  <p className="text-xs font-bold text-rose-400 uppercase">
                    {submittedRequest.category}
                  </p>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="pt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">1. Request Received & Scored</p>
                    <p className="text-[11px] text-slate-400">
                      Triage engine calculated severity based on people count & vulnerability.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 opacity-90">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono animate-pulse">
                    ●
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-300">2. Hub Matching in Progress</p>
                    <p className="text-[11px] text-slate-400">
                      Looking up closest available {submittedRequest.category} supply depot.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 opacity-50">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-500 text-xs">
                    ○
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">3. Rescue Team Deployed</p>
                    <p className="text-[11px] text-slate-500">
                      Frontline volunteers arrive with provisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/track/${submittedRequest.id}`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all border border-emerald-500/40"
              >
                <span>Track Live Status</span>
                <ExternalLink className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSubmittedRequest(null);
                  setDescription("");
                }}
                className="w-full sm:w-auto rounded-xl bg-slate-800 hover:bg-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 border border-slate-700 transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          /* Mobile-First Citizen Request Form */
          <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-mono font-semibold text-rose-300 mb-3">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                <span>Urgent Citizen Assistance Form</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Request Urgent Relief
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Your request is prioritized immediately by the algorithmic triage dispatch engine.
              </p>
            </div>

            {/* Error Message */}
            {rateLimitError && (
              <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Submission Blocked</p>
                  <p className="mt-0.5 text-rose-200">{rateLimitError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Category Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
                  1. Select Emergency Category <span className="text-rose-400">*</span>
                </label>
                <CategoryPicker selected={category} onSelect={setCategory} />
              </div>

              {/* 2. Urgency Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  2. Urgency Level <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { id: "critical", label: "Critical", desc: "Life Threatening", color: "border-rose-500/60 bg-rose-500/15 text-rose-300" },
                      { id: "high", label: "High", desc: "Within Hours", color: "border-amber-500/60 bg-amber-500/15 text-amber-300" },
                      { id: "medium", label: "Medium", desc: "Within Today", color: "border-sky-500/60 bg-sky-500/15 text-sky-300" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setUrgency(item.id)}
                      className={`flex flex-col items-center justify-center rounded-xl p-3 text-center border transition-all cursor-pointer ${
                        urgency === item.id
                          ? `${item.color} ring-2 ring-offset-2 ring-offset-[#070B14] ring-rose-500`
                          : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. People Affected & Vulnerable Switch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stepper */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    People Affected
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-sky-400" />
                      <span>Headcount</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPeopleAffected((prev) => Math.max(1, prev - 1))}
                        className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700 text-sm"
                      >
                        -
                      </button>
                      <span className="font-mono text-xl font-bold text-white w-6 text-center">
                        {peopleAffected}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPeopleAffected((prev) => Math.min(50, prev + 1))}
                        className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vulnerable Toggle */}
                <div
                  onClick={() => setVulnerable((prev) => !prev)}
                  className={`rounded-xl border p-4 cursor-pointer transition-colors flex items-center justify-between ${
                    vulnerable
                      ? "border-rose-500/50 bg-rose-500/10 text-white"
                      : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="pr-3">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-300">
                      <ShieldAlert className="h-4 w-4 text-rose-400" />
                      <span>Vulnerable Citizens</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Includes children, elderly, pregnant women, or disabled. (+12 pts)
                    </p>
                  </div>
                  <div
                    className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                      vulnerable ? "bg-rose-600 justify-end" : "bg-slate-800 justify-start"
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform" />
                  </div>
                </div>
              </div>

              {/* 4. Location Pinning + GPS */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Location & Pin <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="flex items-center gap-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 px-3 py-1 text-xs font-medium transition-colors"
                  >
                    <LocateFixed className="h-3.5 w-3.5 text-sky-400" />
                    <span>Use My GPS Location</span>
                  </button>
                </div>

                {/* Quick Area Chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {COMMON_AREAS.slice(0, 6).map((area) => (
                    <button
                      key={area.name}
                      type="button"
                      onClick={() => handleSelectCommonArea(area)}
                      className={`text-[10px] rounded-md px-2 py-1 font-mono transition-colors border ${
                        areaName === area.name
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                          : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {area.name}
                    </button>
                  ))}
                </div>

                <div className="mb-2">
                  <input
                    type="text"
                    required
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    placeholder="Enter landmark, ward, or street name"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <LocationPickerMap
                  lat={lat}
                  lng={lng}
                  onChange={(newLat, newLng) => {
                    setLat(newLat);
                    setLng(newLng);
                  }}
                />
                <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
                  Pinned: {lat.toFixed(4)}°N, {lng.toFixed(4)}°E (You can drag the pin on map)
                </p>
              </div>

              {/* 5. Contact Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Emergency Contact Phone <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98290 12345"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Private to verified dispatchers. Protected by client rate limit (max 3/hr).
                </p>
              </div>

              {/* 6. Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Situation Details / Specific Needs
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., Water level rising to 3 feet, senior citizen needs insulin, 2 small children trapped on second floor terrace."
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 p-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 py-4 text-base font-bold text-white shadow-xl shadow-rose-950/60 hover:from-rose-500 hover:to-rose-600 transition-all border border-rose-500/40 cursor-pointer disabled:opacity-50"
              >
                <Flame className="h-5 w-5 text-rose-200" />
                <span>{isSubmitting ? "Broadcasting Emergency..." : "Broadcast Emergency SOS"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
