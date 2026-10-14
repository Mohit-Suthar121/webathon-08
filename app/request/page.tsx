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
import { COMMON_AREAS, DEFAULT_MAP_CENTER, reverseGeocode } from "@/lib/geo";
import { cn } from "@/lib/utils";
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
  Mic,
  MicOff,
  Sparkles,
  Languages,
  Loader2,
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

  // Smart Intake (Multilingual Voice / Text)
  const [nlInput, setNlInput] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isAiParsing, setIsAiParsing] = useState<boolean>(false);
  const [aiParsedNotice, setAiParsedNotice] = useState<string | null>(null);

  // Web Speech API Voice Dictation
  const handleToggleVoice = () => {
    if (typeof window === "undefined") return;

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert("Voice recognition is not supported in this browser. Please type in Hindi, English, or Hinglish.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = "hi-IN"; // Supports Hindi & Hinglish
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNlInput(transcript);
        handleAiParse(transcript);
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  // AI Intake Parser
  const handleAiParse = async (textToParse = nlInput) => {
    if (!textToParse.trim()) return;
    setIsAiParsing(true);
    setAiParsedNotice(null);

    try {
      const res = await fetch("/api/ai/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToParse }),
      });

      if (!res.ok) throw new Error("AI parsing request failed");
      const { data, isAiAssisted, engine } = await res.json();

      if (data) {
        if (data.category) setCategory(data.category);
        if (data.urgency) setUrgency(data.urgency);
        if (data.peopleAffected) setPeopleAffected(data.peopleAffected);
        if (data.vulnerable !== undefined) setVulnerable(data.vulnerable);
        if (data.summary) setDescription(data.summary);

        if (data.areaName && data.areaName !== "Jaipur Relief Zone") {
          const matchArea = COMMON_AREAS.find((a) =>
            a.name.toLowerCase().includes(data.areaName.toLowerCase())
          );
          if (matchArea) {
            setAreaName(matchArea.name);
            setLat(matchArea.lat);
            setLng(matchArea.lng);
          } else {
            setAreaName(data.areaName);
          }
        }

        setAiParsedNotice(
          `AI-assisted pre-fill active (${engine}): Please verify the details below before broadcasting.`
        );
      }
    } catch (err) {
      console.error("AI Intake error:", err);
      setDescription(textToParse);
    } finally {
      setIsAiParsing(false);
    }
  };

  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Browser Geolocation with Real Reverse Geocoding & Coordinates
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setLat(userLat);
        setLng(userLng);
        try {
          const resolvedAddress = await reverseGeocode(userLat, userLng);
          setAreaName(resolvedAddress);
        } catch {
          setAreaName(`GPS Location (${userLat.toFixed(4)}°N, ${userLng.toFixed(4)}°E)`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        alert("Could not access GPS location. Please pick an area below or pin on map.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectCommonArea = (area: (typeof COMMON_AREAS)[0]) => {
    setAreaName(`${area.name} (${area.lat.toFixed(4)}°N, ${area.lng.toFixed(4)}°E)`);
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

            {/* SMART INTAKE: Multilingual Voice & Natural Language Box */}
            <div className="mb-8 rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/40 via-slate-900/60 to-purple-950/30 p-4 sm:p-5 relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <span>Smart Multilingual Intake</span>
                      <span className="rounded bg-sky-500/20 px-1.5 py-0.2 text-[9px] font-mono text-sky-300 border border-sky-500/40">
                        AI-Assisted
                      </span>
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Speak or describe your emergency in Hindi, English, or Hinglish.
                    </p>
                  </div>
                </div>

                {/* Voice Dictation Button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border cursor-pointer ${
                    isListening
                      ? "bg-rose-600 text-white border-rose-500 animate-pulse ring-2 ring-rose-500/50"
                      : "bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-3.5 w-3.5" />
                      <span>Listening...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5 text-rose-400" />
                      <span>Voice SOS</span>
                    </>
                  )}
                </button>
              </div>

              {/* Natural Language Input Field */}
              <div className="relative mb-3">
                <textarea
                  rows={2}
                  value={nlInput}
                  onChange={(e) => setNlInput(e.target.value)}
                  placeholder="E.g., Ghar me 4 log fase hain, paani 4 feet chadh gaya hai aur dadaji diabetic hain, Sanganer me..."
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Sample Prompt Chips & Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Languages className="h-3 w-3 text-slate-400" /> Try:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const t = "Ghar me 4 log fase hain paani 4 feet chadh gaya hai dadaji diabetic hain Sanganer me";
                      setNlInput(t);
                      handleAiParse(t);
                    }}
                    className="text-[10px] font-mono rounded bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 text-slate-300 border border-slate-700/60"
                  >
                    Hindi/Hinglish Flood Trapped
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = "Roof blown away in Amer Valley, 6 family members with 2 small children need emergency shelter tarpaulins";
                      setNlInput(t);
                      handleAiParse(t);
                    }}
                    className="text-[10px] font-mono rounded bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 text-slate-300 border border-slate-700/60"
                  >
                    Shelter Needed in Amer
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isAiParsing || !nlInput.trim()}
                  onClick={() => handleAiParse(nlInput)}
                  className="shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-sky-950/40 border border-sky-500/40 cursor-pointer disabled:opacity-50"
                >
                  {isAiParsing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Parsing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>Auto-Analyze & Fill</span>
                    </>
                  )}
                </button>
              </div>

              {/* Pre-fill confirmation notice */}
              {aiParsedNotice && (
                <div className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{aiParsedNotice}</span>
                </div>
              )}
            </div>

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
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPeopleAffected((prev) => Math.max(1, prev - 1))}
                        className="h-9 w-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700 text-base cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={peopleAffected}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setPeopleAffected(isNaN(val) ? 1 : Math.max(1, Math.min(100, val)));
                        }}
                        className="w-16 h-9 rounded-lg bg-slate-900 border border-slate-700 text-center font-mono text-lg font-bold text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => setPeopleAffected((prev) => Math.min(100, prev + 1))}
                        className="h-9 w-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700 text-base cursor-pointer"
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
                    disabled={isLocating}
                    onClick={handleUseMyLocation}
                    className="flex items-center gap-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 px-3 py-1 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LocateFixed className={cn("h-3.5 w-3.5 text-sky-400", isLocating && "animate-spin")} />
                    <span>{isLocating ? "Acquiring GPS & Address..." : "Use My GPS Location"}</span>
                  </button>
                </div>

                {/* Quick Area Chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {COMMON_AREAS.slice(0, 6).map((area) => (
                    <button
                      key={area.name}
                      type="button"
                      onClick={() => handleSelectCommonArea(area)}
                      className={`text-[10px] rounded-md px-2 py-1 font-mono transition-colors border cursor-pointer ${
                        areaName.includes(area.name)
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
                    placeholder="Enter landmark, ward, street or coordinates"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <LocationPickerMap
                  lat={lat}
                  lng={lng}
                  onChange={async (newLat, newLng) => {
                    setLat(newLat);
                    setLng(newLng);
                    try {
                      const resolved = await reverseGeocode(newLat, newLng);
                      setAreaName(resolved);
                    } catch {
                      setAreaName(`Pinned Point (${newLat.toFixed(4)}°N, ${newLng.toFixed(4)}°E)`);
                    }
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
