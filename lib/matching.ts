import { MatchSuggestion, ReliefRequest, ReliefSupply } from "@/types";
import { calculateDistanceKm } from "./geo";

/**
 * Finds best matching available supplies for a given request:
 * - Same category
 * - Available is true
 * - Quantity > 0
 * - Sorted by Haversine distance ascending
 * - Returns top 3 matches
 */
export function findSuggestedMatches(
  request: ReliefRequest,
  supplies: ReliefSupply[],
  limit = 3
): MatchSuggestion[] {
  if (request.status !== "open") return [];

  const candidates = supplies.filter(
    (s) => s.available && s.quantity > 0 && s.category === request.category
  );

  const scored: MatchSuggestion[] = candidates.map((supply) => {
    const dist = calculateDistanceKm(request.lat, request.lng, supply.lat, supply.lng);
    return {
      supply,
      distanceKm: dist,
    };
  });

  scored.sort((a, b) => a.distanceKm - b.distanceKm);

  return scored.slice(0, limit);
}
