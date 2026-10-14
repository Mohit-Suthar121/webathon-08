import { NextRequest, NextResponse } from "next/server";
import { callGemini, isGeminiConfigured } from "@/lib/ai/gemini";
import { ReliefRequest, ReliefSupply } from "@/types";

interface SitRepResponse {
  sitrep: string;
  topPriorities: string[];
  recommendedActions: string[];
  resourceBottlenecks: string[];
  isAiAssisted: boolean;
  generatedAt: number;
}

function generateRuleBasedSitRep(
  requests: ReliefRequest[],
  supplies: ReliefSupply[]
): SitRepResponse {
  const openReqs = requests.filter((r) => r.status === "open");
  const critical = openReqs.filter((r) => r.urgency === "critical");
  const totalPeople = openReqs.reduce((sum, r) => sum + r.peopleAffected, 0);

  // Group by category
  const openByCat: Record<string, number> = {};
  openReqs.forEach((r) => {
    openByCat[r.category] = (openByCat[r.category] || 0) + 1;
  });

  // Top 5 priorities sorted by urgency score
  const topPriorities = [...openReqs]
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .slice(0, 5)
    .map(
      (r, idx) =>
        `#${idx + 1} [${r.id}] ${r.category.toUpperCase()} at ${r.areaName} (${r.peopleAffected} people, Score: ${Math.round(r.urgencyScore)}/100) — ${r.description}`
    );

  // Supply shortages
  const supplyByCat: Record<string, number> = {};
  supplies
    .filter((s) => s.available)
    .forEach((s) => {
      supplyByCat[s.category] = (supplyByCat[s.category] || 0) + s.quantity;
    });

  const bottlenecks: string[] = [];
  if ((openByCat["rescue"] || 0) > 0 && (supplyByCat["rescue"] || 0) < 10) {
    bottlenecks.push(`Severe boat/rescue deficit: ${openByCat["rescue"]} rescue operations pending vs only ${supplyByCat["rescue"] || 0} rescue crafts available.`);
  }
  if ((openByCat["medical"] || 0) > 0 && (supplyByCat["medical"] || 0) < 30) {
    bottlenecks.push(`Critical medical shortfall: ${openByCat["medical"]} medical emergency calls logged across flooded wards.`);
  }
  if ((openByCat["water"] || 0) > 2) {
    bottlenecks.push(`Drinking water distribution bottleneck in lowlands (${openByCat["water"]} wards without potable water).`);
  }

  const actions: string[] = [
    "Deploy SDRF rescue boat unit SUP-103 immediately to Sanganer Lowland Basin for REQ-8491 (4 trapped elderly).",
    "Dispatch cold-chain mobile insulin & asthma unit to Amer Valley Ward 9.",
    "Reroute 5000L clean water tanker from Vidhyadhar Nagar to Jagatpura Railway Colony.",
    "Issue precautionary evacuation notice for ground-floor tenements in Dravyavati riverbank perimeter.",
    "Establish staging point at Civil Lines High Ground for non-perishable food redistribution.",
  ];

  const summary = `OPERATIONAL SITUATION REPORT — RELIEF COMMAND JAIPUR
Active Crisis Zone: Metropolitan Flood Sector. 
There are currently ${openReqs.length} open relief requests impacting an estimated ${totalPeople} citizens, with ${critical.length} life-critical operations requiring immediate deployment. Primary pressure points are concentrated in Sanganer Lowland Basin and Amer Valley.`;

  return {
    sitrep: summary,
    topPriorities,
    recommendedActions: actions,
    resourceBottlenecks: bottlenecks,
    isAiAssisted: false,
    generatedAt: Date.now(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { requests, supplies } = await req.json();

    const safeReqs: ReliefRequest[] = Array.isArray(requests) ? requests : [];
    const safeSups: ReliefSupply[] = Array.isArray(supplies) ? supplies : [];

    if (isGeminiConfigured()) {
      try {
        const openReqs = safeReqs.filter((r) => r.status === "open");
        const critical = openReqs.filter((r) => r.urgency === "critical");

        const prompt = `You are the Disaster Response Chief creating an official Executive Situation Report (SitRep) for the State Disaster Management Authority.
Current Live Crisis Telemetry:
- Total Open Requests: ${openReqs.length} (${critical.length} Critical)
- Top 6 Urgent Incidents:
${openReqs
  .slice(0, 6)
  .map(
    (r) =>
      `* [${r.id}] ${r.category} in ${r.areaName} (${r.peopleAffected} people, UrgencyScore: ${Math.round(r.urgencyScore)}): ${r.description}`
  )
  .join("\n")}
- Available Supply Hubs:
${safeSups
  .filter((s) => s.available)
  .map((s) => `* [${s.id}] ${s.providerName} in ${s.areaName}: ${s.quantity} units of ${s.item}`)
  .join("\n")}

Format output as strict JSON:
{
  "sitrep": "Professional 3-sentence executive summary of current disaster posture and threat vector.",
  "topPriorities": [
    "Priority 1 statement with request ID and why",
    "Priority 2 statement",
    "Priority 3 statement",
    "Priority 4 statement",
    "Priority 5 statement"
  ],
  "recommendedActions": [
    "Immediate Tactical Action 1 (which supply to assign to which request)",
    "Immediate Tactical Action 2",
    "Immediate Tactical Action 3",
    "Immediate Tactical Action 4"
  ],
  "resourceBottlenecks": [
    "Bottleneck 1 (e.g. boat shortages in sector X)",
    "Bottleneck 2"
  ]
}`;

        const geminiResp = await callGemini({
          prompt,
          responseMimeType: "application/json",
          temperature: 0.2,
        });

        const parsed = JSON.parse(geminiResp);

        return NextResponse.json({
          sitrep: parsed.sitrep || "Executive SitRep generated from current telemetry.",
          topPriorities: Array.isArray(parsed.topPriorities) ? parsed.topPriorities : [],
          recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
          resourceBottlenecks: Array.isArray(parsed.resourceBottlenecks) ? parsed.resourceBottlenecks : [],
          isAiAssisted: true,
          generatedAt: Date.now(),
        });
      } catch (gemErr) {
        console.warn("Gemini SitRep generation failed, executing rule-based fallback:", gemErr);
      }
    }

    const fallback = generateRuleBasedSitRep(safeReqs, safeSups);
    return NextResponse.json(fallback);
  } catch (err: any) {
    console.error("SitRep route error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate SitRep" }, { status: 500 });
  }
}
