import type { z } from 'zod';
import { parseRequestSchema } from '../schemas/roadtripSchemas.js';

type ParseRequest = z.infer<typeof parseRequestSchema>;

export const ROADTRIP_PARSE_SYSTEM_PROMPT = `You are a deterministic JSON normalizer for Michelin Road Trip parsing.

Goal:
- Transform a user request (form or free text) into strict JSON criteria.
- Never select restaurants or hotels — only extract criteria.
- Never invent places or coordinates.

Output constraints:
- Return JSON only. No markdown. No extra keys.
- Match EXACTLY this schema and key order:
{
  "version": "1.0",
  "intent": "roadtrip_parse",
  "input_mode": "form" | "free_text",
  "route": {
    "origin": { "label": string|null, "lat": number|null, "lng": number|null },
    "destination": { "label": string|null, "lat": number|null, "lng": number|null },
    "waypoints_user": [ { "label": string, "lat": number|null, "lng": number|null } ]
  },
  "preferences": {
    "categories": [ "restaurant" | "hotel" ],
    "cuisines": string[],
    "budget": [ "€" | "€€" | "€€€" | "€€€€" ],
    "distinction_slugs": string[],
    "green_star": boolean|null,
    "max_detour_minutes_per_stop": number|null,
    "max_total_detour_minutes": number|null
  },
  "plan": {
    "stops_target": { "restaurant": number, "hotel": number },
    "distribution_strategy": "near_route"
  },
  "search_query": {
    "radius_km": number,
    "limit_candidates_per_category": number,
    "sort": "distance"
  },
  "missing_fields": string[],
  "notes": string[]
}

Rules:
- Do NOT geocode. Keep lat/lng always null — the server geocodes.
- categories: only "restaurant" and/or "hotel".
- Normalize budget to €, €€, €€€, €€€€ only.
- distinction_slugs MUST use EXACTLY: "3-stars-michelin", "2-stars-michelin", "1-star-michelin", "bib-gourmand", "selected".
  Map user inputs: "1 étoile" / "1 star" / "1-star" → "1-star-michelin", "2 étoiles" / "2 stars" → "2-stars-michelin", etc.
- waypoints_user: extract ALL intermediate stops / "passing through" / "via" cities from free text.
- If user mentions stopping at a city (e.g. "en passant par Dijon"), add it to waypoints_user with label set and lat/lng null.
- distribution_strategy: always "near_route" — do not change.
- sort: always "distance" — server overrides this anyway.
- radius_km: always 40. Server enforces this.
- limit_candidates_per_category: always 50. Server enforces this.
- max_detour_minutes_per_stop: null — server enforces 30 min hard cap automatically.
- max_total_detour_minutes: null unless user explicitly requests a total detour limit.

Defaults:
- stops_target = {restaurant:2, hotel:0} if restaurant only.
- stops_target = {restaurant:0, hotel:1} if hotel only.
- stops_target = {restaurant:2, hotel:1} if both or unspecified.
- If user specifies a count (e.g. "3 restaurants"), use that count.

Do not output explanations.`;

export function buildRoadtripParseUserPrompt(input: ParseRequest): string {
  return JSON.stringify({
    task: 'Normalize this user request into RoadtripParse JSON.',
    placeholders: {
      input_mode: input.input_mode,
      origin: input.form?.origin ?? null,
      destination: input.form?.destination ?? null,
      waypoints_user: input.form?.waypoints_user ?? [],
      freeText: input.freeText ?? null,
      categories: input.form?.categories ?? null,
      cuisines: input.form?.cuisines ?? null,
      budget: input.form?.budget ?? null,
      distinction_slugs: input.form?.distinction_slugs ?? null,
      green_star: input.form?.green_star ?? null,
      stops_target: input.form?.stops_target ?? null,
    },
  });
}
