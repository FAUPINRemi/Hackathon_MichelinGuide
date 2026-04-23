import { roadtripParseSchema, roadtripSelectSchema } from '../schemas/roadtripSchemas.js';
import { geminiService } from './geminiService.js';
import {
  ROADTRIP_PARSE_SYSTEM_PROMPT,
  buildRoadtripParseUserPrompt,
} from '../prompts/roadtripParsePrompts.js';
import {
  ROADTRIP_SELECT_SYSTEM_PROMPT,
  buildRoadtripSelectUserPrompt,
} from '../prompts/roadtripSelectPrompts.js';
import type { Candidate, RoadtripParse, RoadtripSelect } from '../types/roadtrip.js';
import type { z } from 'zod';
import { parseRequestSchema } from '../schemas/roadtripSchemas.js';

type ParseRequest = z.infer<typeof parseRequestSchema>;

export async function parseRoadtrip(input: ParseRequest): Promise<RoadtripParse> {
  const raw = await geminiService.generateStrictJson(
    ROADTRIP_PARSE_SYSTEM_PROMPT,
    buildRoadtripParseUserPrompt(input),
  );
  return roadtripParseSchema.parse(raw);
}

export async function selectRoadtripStops(parse: RoadtripParse, candidates: Candidate[]): Promise<RoadtripSelect> {
  const raw = await geminiService.generateStrictJson(
    ROADTRIP_SELECT_SYSTEM_PROMPT,
    buildRoadtripSelectUserPrompt(parse, candidates),
  );
  return roadtripSelectSchema.parse(raw);
}

export function validateSelectionAgainstCandidates(parse: RoadtripParse, candidates: Candidate[], selected: RoadtripSelect): void {
  const byCategory = {
    restaurant: parse.plan.stops_target.restaurant,
    hotel: parse.plan.stops_target.hotel,
  };

  const candidateIndex = new Set(candidates.map((c) => `${c.category}:${c.id}`));
  const seenKeys = new Set<string>();

  // Remove stops not in shortlist or duplicates
  selected.selected.stops = selected.selected.stops.filter((stop) => {
    const key = `${stop.category}:${stop.id}`;
    if (!candidateIndex.has(key) || seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  // Sort by priority (1 = must stop) then trim to target per category
  selected.selected.stops.sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3));

  const counts = { restaurant: 0, hotel: 0 };
  selected.selected.stops = selected.selected.stops.filter((stop) => {
    if (counts[stop.category] >= byCategory[stop.category]) return false;
    counts[stop.category] += 1;
    return true;
  });
}
