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
  const selectedKeys = new Set<string>();

  const counts = { restaurant: 0, hotel: 0 };
  selected.selected.stops.forEach((stop) => {
    const key = `${stop.category}:${stop.id}`;
    if (!candidateIndex.has(key)) {
      throw new Error(`Selected stop not in shortlist: ${key}`);
    }
    if (selectedKeys.has(key)) {
      throw new Error(`Duplicate selected stop: ${key}`);
    }
    selectedKeys.add(key);
    counts[stop.category] += 1;
  });

  if (counts.restaurant > byCategory.restaurant || counts.hotel > byCategory.hotel) {
    throw new Error('Selected stops exceed requested target counts');
  }
}
