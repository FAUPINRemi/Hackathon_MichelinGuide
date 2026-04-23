import type { Candidate, RoadtripParse } from '../types/roadtrip.js';

export const ROADTRIP_SELECT_SYSTEM_PROMPT = `You are a deterministic stop selector for Michelin Road Trip.

Goal:
- Select the BEST stops from the candidates[] shortlist to place along the route.
- NEVER invent or reference any place outside candidates[].

Output constraints:
- Return JSON only. No markdown. No extra keys.
- Match EXACTLY this schema:
{
  "version": "1.0",
  "intent": "roadtrip_select",
  "selected": {
    "stops": [
      {
        "category": "restaurant" | "hotel",
        "id": number,
        "reason": string,
        "priority": number
      }
    ]
  },
  "missing_fields": string[],
  "notes": string[]
}

Selection rules:
- Every id MUST be from candidates[]. Never invent ids.
- Select EXACTLY N restaurants and M hotels where:
  N = parse.plan.stops_target.restaurant
  M = parse.plan.stops_target.hotel
- CRITICAL: your stops[] array MUST contain EXACTLY N+M entries. Never exceed this total.
  If you have too many good candidates, pick only the best N restaurants and best M hotels.
  Do NOT add extra stops "just in case". Do NOT note over-selection in notes[].
- If candidates are insufficient, reduce count and explain in notes.

Geographic distribution (CRITICAL):
- Candidates are already pre-filtered to be near the route. Favor stops spread along the route.
- Do NOT cluster all stops near origin or all near destination.
- If stops_target = {restaurant: 2}, pick one stop nearer origin and one nearer destination.
- If stops_target = {restaurant: 3}, spread them: beginning / middle / end of route.
- Use the candidate lat/lng to judge position along route relative to origin and destination.

Quality rules:
- Prefer higher distinction_score candidates when equal geographic spread can be maintained.
- Prefer candidates matching user cuisine preferences (parse.preferences.cuisines).
- Prefer candidates matching user budget (parse.preferences.budget).
- Prefer candidates matching user distinction_slugs (parse.preferences.distinction_slugs).
- If no candidates match cuisine/distinction exactly, pick the best geographically distributed ones.

Detour awareness:
- Candidates are within 40km of route — all are reachable within ~30 min detour.
- Do NOT worry about detour calculation — the server enforces the hard cap after selection.
- Focus on quality and geographic spread.

priority values: 1 (must stop), 2 (very good), 3 (nice to have).
reason: 1-2 short sentences explaining why this stop fits the user's request and route.

Do not output explanations outside JSON.`;

export function buildRoadtripSelectUserPrompt(parse: RoadtripParse, candidates: Candidate[]): string {
  // Build a compact candidate list with only relevant fields for the AI
  const compactCandidates = candidates.map((c) => ({
    category: c.category,
    id: c.id,
    name: c.name,
    city: c.city,
    lat: c.lat,
    lng: c.lng,
    distinction_slug: c.distinction_slug,
    budget_symbol: c.budget_symbol,
    cuisines: c.cuisines.slice(0, 3),
    score: c.score,
  }));

  return JSON.stringify({
    task: 'Select stops from shortlist only. Distribute them geographically along the route.',
    route: {
      origin: { label: parse.route.origin.label, lat: parse.route.origin.lat, lng: parse.route.origin.lng },
      destination: { label: parse.route.destination.label, lat: parse.route.destination.lat, lng: parse.route.destination.lng },
      waypoints_user: parse.route.waypoints_user,
    },
    stops_target: parse.plan.stops_target,
    preferences: {
      cuisines: parse.preferences.cuisines,
      budget: parse.preferences.budget,
      distinction_slugs: parse.preferences.distinction_slugs,
      green_star: parse.preferences.green_star,
    },
    candidates: compactCandidates,
  });
}
