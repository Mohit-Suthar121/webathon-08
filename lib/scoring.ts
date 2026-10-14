import { ReliefRequest, RequestCategory, UrgencyBreakdown } from "@/types";

export const CATEGORY_WEIGHTS: Record<RequestCategory, number> = {
  rescue: 40,
  medical: 32,
  water: 24,
  shelter: 20,
  food: 16,
};

export const CATEGORY_LABELS: Record<RequestCategory, string> = {
  rescue: "Rescue / Evacuation",
  medical: "Medical Emergency",
  water: "Clean Water",
  shelter: "Emergency Shelter",
  food: "Food & Rations",
};

export const CATEGORY_COLORS: Record<RequestCategory, { hex: string; bg: string; text: string; border: string }> = {
  water: { hex: "#38BDF8", bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/30" },
  medical: { hex: "#F43F5E", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
  food: { hex: "#F59E0B", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  shelter: { hex: "#A78BFA", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  rescue: { hex: "#FB7185", bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/30" },
};

/**
 * Computes urgency score (0 - 100) and returns detailed breakdown for tooltips and explainers
 */
export function calculateUrgencyScore(
  category: RequestCategory,
  peopleAffected: number,
  vulnerable: boolean,
  createdAt: number,
  now: number = Date.now()
): { score: number; breakdown: UrgencyBreakdown } {
  const categoryPts = CATEGORY_WEIGHTS[category] || 16;
  const peoplePts = Math.min(Math.max(peopleAffected, 1), 20);
  const vulnerablePts = vulnerable ? 12 : 0;

  const elapsedMs = Math.max(0, now - createdAt);
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
  const waitingPts = Math.min(20, Math.floor(elapsedMinutes / 5));

  const rawTotal = categoryPts + peoplePts + vulnerablePts + waitingPts;
  const total = Math.min(100, Math.max(0, rawTotal));

  const parts: string[] = [];
  parts.push(`${CATEGORY_LABELS[category].split(" ")[0]} (+${categoryPts})`);
  parts.push(`${peopleAffected} people (+${peoplePts})`);
  if (vulnerable) {
    parts.push("Vulnerable (+12)");
  }
  if (waitingPts > 0) {
    parts.push(`Waiting ${elapsedMinutes}m (+${waitingPts})`);
  } else {
    parts.push(`Waiting <5m (+0)`);
  }

  const explanation = `${parts.join(" + ")} = ${total}/100`;

  return {
    score: total,
    breakdown: {
      categoryPts,
      peoplePts,
      vulnerablePts,
      waitingPts,
      total,
      explanation,
    },
  };
}

/**
 * Recomputes urgency scores for an array of requests based on current time
 */
export function recalculateAllScores(requests: ReliefRequest[], now: number = Date.now()): ReliefRequest[] {
  return requests.map((req) => {
    const { score } = calculateUrgencyScore(
      req.category,
      req.peopleAffected,
      req.vulnerable,
      req.createdAt,
      now
    );
    return {
      ...req,
      urgencyScore: score,
    };
  });
}
