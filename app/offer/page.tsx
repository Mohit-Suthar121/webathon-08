"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryPicker from "@/components/CategoryPicker";
import LocationPickerMap from "@/components/LocationPickerMap";
import { ProviderType, RequestCategory } from "@/types";
import { createSupply } from "@/lib/store";
import { pingHubHeartbeat } from "@/lib/blackout";
import { COMMON_AREAS, DEFAULT_MAP_CENTER } from "@/lib/geo";
import confetti from "canvas-confetti";
import {
  HeartHandshake,
  Building2,
  Users,
  Heart,
  Package,
  Phone,
  CheckCircle,
  ArrowRight,
  LocateFixed,
  Radio,
} from "lucide-react";

export default function OfferSuppliesPage() {
  const [providerName, setProviderName] = useState("");
  const [type, setType] = useState<ProviderType>("volunteer");
  const [category, setCategory] = useState<RequestCategory>("water");
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState<number>(50);
  const [areaName, setAreaName] = useState("Vaishali Nagar West");
  const [lat, setLat] = useState(DEFAULT_MAP_CENTER.lat);
  const [lng, setLng] = useState(DEFAULT_MAP_CENTER.lng);
  const [phone, setPhone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSupply, setSubmittedSupply] = useState<any | null>(null);

  // 60-second volunteer/hub heartbeat
  useEffect(() => {
    const hubId = "SESSION-HUB-ACTIVE";
    pingHubHeartbeat(hubId, providerName || "Active Volunteer Station", areaName, lat, lng);

    const interval = setInterval(() => {
      pingHubHeartbeat(hubId, providerName || "Active Volunteer Station", areaName, lat, lng);
    }, 60000);

    return () => clearInterval(interval);
  }, [providerName, areaName, lat, lng]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      setAreaName("Volunteer Staging GPS Point");
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerName.trim() || !item.trim() || !phone.trim()) {
      alert("Please fill in provider name, item, and phone.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newSupply = await createSupply({
        providerName: providerName.trim(),
        type,
        category,
        item: item.trim(),
        quantity: Math.max(1, quantity),
        areaName,
        lat,
        lng,
        contactPhone: phone.trim(),
        available: true,
      });

      setSubmittedSupply(newSupply);
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // safe ignore
      }
    } catch (err) {
      console.error("Failed to register supply:", err);
      alert("Failed to submit supply. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] bg-crisis-grid">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {submittedSupply ? (
          <div className="glass-panel-elevated rounded-3xl p-6 sm:p-10 border border-emerald-500/40 shadow-2xl text-center max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="h-9 w-9" />
            </div>

            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 font-mono text-xs font-bold text-emerald-300 uppercase tracking-widest">
              Relief Inventory Registered
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 mb-2">
              Supplies Live in Command Network
            </h1>

            <p className="text-sm text-slate-300 mb-6">
              Thank you for mobilizing relief! Dispatchers can now auto-match your{" "}
              <strong className="text-emerald-400">{submittedSupply.quantity} units of {submittedSupply.item}</strong>{" "}
              to citizens trapped in flood zones.
            </p>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4 mb-8 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Inventory ID:</span>
                <span className="font-bold text-white">{submittedSupply.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Provider:</span>
                <span className="text-slate-200">{submittedSupply.providerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Sector Base:</span>
                <span className="text-slate-200">{submittedSupply.areaName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">● Available for Dispatch</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dispatch"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all border border-emerald-500/40"
              >
                <span>View on Command Center</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSubmittedSupply(null);
                  setItem("");
                  setQuantity(50);
                }}
                className="w-full sm:w-auto rounded-xl bg-slate-800 hover:bg-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 border border-slate-700 transition-colors"
              >
                Register More Supplies
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-semibold text-emerald-300 mb-3">
                <HeartHandshake className="h-3.5 w-3.5 text-emerald-400" />
                <span>Volunteer & NGO Intake Depot</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Mobilize Relief Supplies
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Register clean water, hot food, boats, medical supplies, or dry shelter to connect directly with trapped citizens.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Provider Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  1. Organization / Provider Type <span className="text-emerald-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { id: "volunteer", label: "Volunteer Group", icon: Heart },
                      { id: "hub", label: "Disaster Hub", icon: Users },
                      { id: "ngo", label: "Registered NGO", icon: Building2 },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setType(item.id)}
                        className={`flex flex-col items-center justify-center rounded-xl p-3 text-center border transition-all cursor-pointer ${
                          type === item.id
                            ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300 ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#070B14]"
                            : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1 text-emerald-400" />
                        <span className="text-xs font-bold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Provider Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Provider / Team Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="E.g., Jaipur Youth Taskforce, Red Cross Post 4, Community Kitchen"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Category Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  2. Supply Category <span className="text-emerald-400">*</span>
                </label>
                <CategoryPicker selected={category} onSelect={setCategory} />
              </div>

              {/* Item Name & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Item Description <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    placeholder="E.g., 20L Water Cans, Insulin Kits, Dry Khichdi Packets"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Available Units <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Staging Location */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Staging Depot Location & Pin <span className="text-emerald-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-3 py-1 text-xs font-medium transition-colors"
                  >
                    <LocateFixed className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Use My GPS</span>
                  </button>
                </div>

                {/* Quick Area Chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {COMMON_AREAS.slice(0, 6).map((area) => (
                    <button
                      key={area.name}
                      type="button"
                      onClick={() => {
                        setAreaName(area.name);
                        setLat(area.lat);
                        setLng(area.lng);
                      }}
                      className={`text-[10px] rounded-md px-2 py-1 font-mono transition-colors border ${
                        areaName === area.name
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
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
                    placeholder="Enter staging depot name or locality"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Coordinator Phone Number <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98288 33445"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 text-base font-bold text-white shadow-xl shadow-emerald-950/60 hover:from-emerald-500 hover:to-teal-500 transition-all border border-emerald-500/40 cursor-pointer disabled:opacity-50"
              >
                <Package className="h-5 w-5 text-emerald-200" />
                <span>{isSubmitting ? "Registering Supplies..." : "Deploy Supplies to Network"}</span>
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
