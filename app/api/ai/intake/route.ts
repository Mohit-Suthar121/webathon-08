import { NextRequest, NextResponse } from "next/server";
import { callGemini, isGeminiConfigured } from "@/lib/ai/gemini";
import { RequestCategory, UrgencyLevel } from "@/types";
import { COMMON_AREAS } from "@/lib/geo";

interface IntakeResult {
  category: RequestCategory;
  urgency: UrgencyLevel;
  peopleAffected: number;
  vulnerable: boolean;
  areaName: string;
  summary: string;
}

function ruleBasedFallbackIntake(text: string): IntakeResult {
  const lower = text.toLowerCase();

  // 1. Category Detection
  let category: RequestCategory = "rescue";
  if (
    lower.includes("insulin") ||
    lower.includes("oxygen") ||
    lower.includes("medical") ||
    lower.includes("dawai") ||
    lower.includes("doctor") ||
    lower.includes("bimar") ||
    lower.includes("beemar") ||
    lower.includes("asthma") ||
    lower.includes("pregnant") ||
    lower.includes("garbhvati") ||
    lower.includes("injury") ||
    lower.includes("chot") ||
    lower.includes("hospital")
  ) {
    category = "medical";
  } else if (
    lower.includes("peene") ||
    lower.includes("drinking water") ||
    lower.includes("potable") ||
    lower.includes("pyas") ||
    lower.includes("mineral water") ||
    lower.includes("tanker")
  ) {
    category = "water";
  } else if (
    lower.includes("khana") ||
    lower.includes("food") ||
    lower.includes("ration") ||
    lower.includes("bhookhe") ||
    lower.includes("biscuit") ||
    lower.includes("meal") ||
    lower.includes("roti")
  ) {
    category = "food";
  } else if (
    lower.includes("roof") ||
    lower.includes("chhat") ||
    lower.includes("tarpaulin") ||
    lower.includes("tripal") ||
    lower.includes("tent") ||
    lower.includes("shelter") ||
    lower.includes("stay")
  ) {
    category = "shelter";
  } else if (
    lower.includes("fase") ||
    lower.includes("trapped") ||
    lower.includes("rescue") ||
    lower.includes("doob") ||
    lower.includes("current") ||
    lower.includes("boat") ||
    lower.includes("evacuat")
  ) {
    category = "rescue";
  }

  // 2. People Affected
  let peopleAffected = 2;
  const numMatch = lower.match(/(\d+)\s*(log|people|persons|members|bacche|aadmi|residents)?/);
  if (numMatch && numMatch[1]) {
    const parsed = parseInt(numMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
      peopleAffected = parsed;
    }
  }

  // 3. Vulnerable Population
  const vulnerable = Boolean(
    lower.includes("child") ||
      lower.includes("kid") ||
      lower.includes("bacche") ||
      lower.includes("bache") ||
      lower.includes("elderly") ||
      lower.includes("bujurg") ||
      lower.includes("dadaji") ||
      lower.includes("dadi") ||
      lower.includes("nanaji") ||
      lower.includes("nani") ||
      lower.includes("senior") ||
      lower.includes("pregnant") ||
      lower.includes("disabled") ||
      lower.includes("divyang") ||
      lower.includes("infant") ||
      lower.includes("baby")
  );

  // 4. Urgency
  let urgency: UrgencyLevel = "high";
  if (
    category === "rescue" ||
    category === "medical" ||
    lower.includes("critical") ||
    lower.includes("urgent") ||
    lower.includes("turant") ||
    lower.includes("emergency") ||
    lower.includes("paani chadh") ||
    lower.includes("rising") ||
    lower.includes("danger")
  ) {
    urgency = "critical";
  } else if (category === "food" || category === "water") {
    urgency = vulnerable ? "high" : "medium";
  }

  // 5. Area Detection
  let detectedArea = "Jaipur Relief Sector";
  for (const common of COMMON_AREAS) {
    const areaLower = common.name.toLowerCase();
    const parts = areaLower.split(" ");
    if (lower.includes(parts[0]) || (parts[1] && lower.includes(parts[1]))) {
      detectedArea = common.name;
      break;
    }
  }

  return {
    category,
    urgency,
    peopleAffected,
    vulnerable,
    areaName: detectedArea,
    summary: text.trim(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text prompt is required" }, { status: 400 });
    }

    // Check if Gemini is available
    if (isGeminiConfigured()) {
      try {
        const systemPrompt = `You are an emergency crisis coordination triage AI for ReliefHub in India.
Citizens describe emergencies in Hindi, English, or Hinglish (e.g., "Ghar me paani bhar gaya hai 4 log fase hain dadaji diabetic hain").
Extract accurate relief parameters and output STRICT JSON ONLY with these exact fields:
- category: one of ["rescue", "medical", "water", "shelter", "food"]
- urgency: one of ["critical", "high", "medium"]
- peopleAffected: positive integer (default 2 if unspecified)
- vulnerable: boolean (true if infants, children, pregnant women, elderly, disabled, or sick persons mentioned)
- areaName: name of locality/landmark mentioned or "Jaipur Relief Zone"
- summary: clean, concise summary in English (1-2 sentences)

Return ONLY valid JSON. No markdown backticks.`;

        const geminiResponse = await callGemini({
          prompt: `Citizen emergency message:\n"${text}"\n\nExtract structured JSON:`,
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.1,
        });

        const cleaned = geminiResponse.trim().replace(/^```json/i, "").replace(/```$/i, "").trim();
        const parsed = JSON.parse(cleaned);

        return NextResponse.json({
          data: {
            category: parsed.category || "rescue",
            urgency: parsed.urgency || "high",
            peopleAffected: Number(parsed.peopleAffected) || 2,
            vulnerable: Boolean(parsed.vulnerable),
            areaName: parsed.areaName || "Jaipur Relief Zone",
            summary: parsed.summary || text,
          },
          isAiAssisted: true,
          engine: "Gemini AI",
        });
      } catch (geminiError) {
        console.warn("Gemini smart intake failed, executing rule-based NLP fallback:", geminiError);
      }
    }

    // Rule-based fallback
    const fallbackData = ruleBasedFallbackIntake(text);
    return NextResponse.json({
      data: fallbackData,
      isAiAssisted: false,
      engine: "Rule-Based Multilingual NLP Fallback",
    });
  } catch (err: any) {
    console.error("Intake route error:", err);
    const fallbackData = ruleBasedFallbackIntake("emergency rescue needed");
    return NextResponse.json({
      data: fallbackData,
      isAiAssisted: false,
      engine: "Rule-Based Multilingual NLP Fallback",
    });
  }
}
