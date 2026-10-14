import { MatchSuggestion, ReliefRequest, ReliefSupply } from "@/types";
import { calculateDistanceKm } from "./geo";

/**
 * Enhanced Auto-Match Engine:
 * - Weighs Haversine distance in km
 * - Weighs supply quantity vs request peopleAffected
 * - Measures competing demand (how many open requests in same category exist)
 * - Explains each suggestion in a single readable line
 * - Keeps dispatcher as final decision maker with AI-assisted label
 */
export function findSuggestedMatches(
  request: ReliefRequest,
  supplies: ReliefSupply[],
  limit = 3,
  allRequests: ReliefRequest[] = []
): MatchSuggestion[] {
  if (request.status !== "open") return [];

  // Filter supplies matching category with available stock
  const candidates = supplies.filter(
    (s) => s.available && s.quantity > 0 && s.category === request.category
  );

  // Measure competing demand: other open requests needing this same category
  const competingRequests = allRequests.filter(
    (r) => r.id !== request.id && r.status === "open" && r.category === request.category
  );
  const totalCompeting = competingRequests.length;

  const scored: MatchSuggestion[] = candidates.map((supply) => {
    const dist = calculateDistanceKm(request.lat, request.lng, supply.lat, supply.lng);

    // Competing demand specific to this supply's sector (within 4km)
    const localCompeting = competingRequests.filter(
      (r) => calculateDistanceKm(r.lat, r.lng, supply.lat, supply.lng) <= 4.0
    ).length;

    // Composite scoring (0 - 100)
    // 1. Distance score (50 max): 0km = 50pts, 5km = 15pts, >7km = 0pts
    const distanceScore = Math.max(0, 50 - dist * 7);

    // 2. Quantity sufficiency (30 max)
    const ratio = supply.quantity / Math.max(1, request.peopleAffected);
    const quantityScore = Math.min(30, Math.round(ratio * 10));

    // 3. Competing demand penalty (up to -20pts)
    const competitionPenalty = Math.min(20, localCompeting * 4);

    const totalMatchScore = Math.max(10, Math.round(distanceScore + quantityScore - competitionPenalty));

    // Construct 1-line plain language explanation
    let explanation = `AI-Assisted: ${dist} km away with ${supply.quantity} units available`;
    if (dist <= 1.5) {
      explanation += ` (optimal transit <10 min)`;
    } else if (dist <= 3.5) {
      explanation += ` (moderate transit ~15-20 min)`;
    }

    if (localCompeting === 0) {
      explanation += `; zero competing requests in sector.`;
    } else if (localCompeting <= 2) {
      explanation += `; low competing queue (${localCompeting} nearby pending).`;
    } else {
      explanation += `; high competing demand (${localCompeting} pending in sector).`;
    }

    return {
      supply,
      distanceKm: dist,
      score: totalMatchScore,
      competingDemand: localCompeting,
      explanation,
      isAiAssisted: true,
    };
  });

  // Sort by composite match score descending, then by distance ascending
  scored.sort((a, b) => {
    if ((b.score || 0) !== (a.score || 0)) {
      return (b.score || 0) - (a.score || 0);
    }
    return a.distanceKm - b.distanceKm;
  });

  return scored.slice(0, limit);
}
