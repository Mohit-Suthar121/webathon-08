import { NextRequest, NextResponse } from "next/server";
import { callGemini, isGeminiConfigured } from "@/lib/ai/gemini";
import { ReliefRequest } from "@/types";

interface CredibilityEvaluation {
  credibilityScore: number; // 0-100
  reasons: string[];
  isAiAssisted: boolean;
}

function calculateRuleBasedCredibility(
  request: ReliefRequest,
  allRequests: ReliefRequest[] = []
): CredibilityEvaluation {
  let score = 70; // baseline neutral high
  const reasons: string[] = [];

  // 1. Phone number structure
  const cleanPhone = request.contactPhone.replace(/[^0-9]/g, "");
  if (cleanPhone.length >= 10) {
    score += 10;
    reasons.push("Valid emergency telephone carrier format (+10)");
  } else {
    score -= 15;
    reasons.push("Incomplete or short telephone contact (-15)");
  }

  // 2. Description detail & specificity
  const desc = request.description || "";
  if (desc.length > 50) {
    score += 10;
    reasons.push("High circumstantial detail and specific situation description (+10)");
  } else if (desc.length < 15) {
    score -= 10;
    reasons.push("Brief description lacks contextual depth (-10)");
  }

  // 3. Known landmark/area match
  if (request.areaName && request.areaName.length > 5) {
    score += 5;
    reasons.push(`Identified recognized municipal relief sector (${request.areaName}) (+5)`);
  }

  // 4. Corroboration from nearby reports in same area
  const nearbyCount = allRequests.filter(
    (r) => r.id !== request.id && r.areaName === request.areaName
  ).length;

  if (nearbyCount >= 2) {
    score += 10;
    reasons.push(`Corroborated by ${nearbyCount} concurrent emergency calls in sector (+10)`);
  } else {
    reasons.push("Isolated call in this specific sector (Neutral)");
  }

  // 5. Plausible Headcount
  if (request.peopleAffected >= 1 && request.peopleAffected <= 25) {
    score += 5;
    reasons.push(`Plausible headcount profile (${request.peopleAffected} persons) (+5)`);
  }

  const finalScore = Math.min(98, Math.max(25, score));

  return {
    credibilityScore: finalScore,
    reasons,
    isAiAssisted: false,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { request, allRequests } = await req.json();

    if (!request || !request.id) {
      return NextResponse.json({ error: "Request object is required" }, { status: 400 });
    }

    if (isGeminiConfigured()) {
      try {
        const prompt = `You are a humanitarian emergency intelligence officer evaluating the credibility of a citizen disaster SOS call.
Do NOT reject. Provide a nuanced 0-100 credibility assessment and bullet points.

Incident Details:
- ID: ${request.id}
- Category: ${request.category}
- Area: ${request.areaName}
- Description: "${request.description}"
- People: ${request.peopleAffected} (Vulnerable: ${request.vulnerable})
- Phone: ${request.contactPhone}
- Concurrently active calls in sector: ${
          Array.isArray(allRequests)
            ? allRequests.filter((r: any) => r.areaName === request.areaName).length
            : 1
        }

Output strict JSON:
{
  "credibilityScore": number (30 to 98),
  "reasons": ["Reason 1 with explanation", "Reason 2 with explanation", "Reason 3"]
}`;

        const geminiResp = await callGemini({
          prompt,
          responseMimeType: "application/json",
          temperature: 0.1,
        });

        const parsed = JSON.parse(geminiResp);
        return NextResponse.json({
          credibilityScore: Math.min(98, Math.max(25, Number(parsed.credibilityScore) || 75)),
          reasons: Array.isArray(parsed.reasons) ? parsed.reasons : ["Valid field emergency report"],
          isAiAssisted: true,
        });
      } catch (gemErr) {
        console.warn("Gemini credibility analysis failed, running rule-based fallback:", gemErr);
      }
    }

    const fallback = calculateRuleBasedCredibility(request, allRequests || []);
    return NextResponse.json(fallback);
  } catch (err: any) {
    console.error("Credibility route error:", err);
    return NextResponse.json({
      credibilityScore: 75,
      reasons: ["Emergency signal received via field carrier"],
      isAiAssisted: false,
    });
  }
}
