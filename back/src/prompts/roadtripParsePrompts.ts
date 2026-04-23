import type { z } from 'zod';
import { parseRequestSchema } from '../schemas/roadtripSchemas.js';

type ParseRequest = z.infer<typeof parseRequestSchema>;

export const ROADTRIP_PARSE_SYSTEM_PROMPT = `You are a deterministic JSON normalizer for Michelin Road Trip parsing.

Goal:
- Transform a user request (form or free text) into strict JSON criteria.
- Never select restaurants/hotels.
- Never invent places or coordinates.

Output constraints:
- Return JSON only.
- No markdown.
- No extra keys.
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
    "distribution_strategy": "near_route" | "balanced" | "near_cities"
  },
  "search_query": {
    "radius_km": number,
    "limit_candidates_per_category": number,
    "sort": "relevance" | "distance" | "distinction"
  },
  "missing_fields": string[],
  "notes": string[]
}

Rules:
- If info is missing, put null and add a field path in missing_fields.
- categories can only include restaurant/hotel.
- Normalize budget to €, €€, €€€, €€€€ only.
- distinction_slugs must use: "3-stars-michelin", "2-stars-michelin", "1-star-michelin", "bib-gourmand", "selected".
- Do not geocode. Keep lat/lng null unless provided by input.
- If user asks both categories, include both.

Defaults:
- stops_target = {restaurant:2, hotel:0} if restaurant only.
- stops_target = {restaurant:0, hotel:1} if hotel only.
- stops_target = {restaurant:2, hotel:1} if both.
- distribution_strategy = "near_route".
- radius_km = 10.
- limit_candidates_per_category = 30.
- sort = "relevance".

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
      max_detour_minutes_per_stop: input.form?.max_detour_minutes_per_stop ?? null,
      max_total_detour_minutes: input.form?.max_total_detour_minutes ?? null,
      stops_target: input.form?.stops_target ?? null,
      distribution_strategy: input.form?.distribution_strategy ?? null,
      radius_km: input.form?.radius_km ?? null,
      limit_candidates_per_category: input.form?.limit_candidates_per_category ?? null,
      sort: input.form?.sort ?? null,
    },
  });
}
