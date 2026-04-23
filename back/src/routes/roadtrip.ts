import { Router } from 'express';
import {
  parseRequestSchema,
  roadtripBuildRequestSchema,
  roadtripRouteRequestSchema,
  roadtripSelectRequestSchema,
} from '../schemas/roadtripSchemas.js';
import { parseRoadtrip, selectRoadtripStops, validateSelectionAgainstCandidates } from '../services/roadtripAIService.js';
import { searchCandidates } from '../services/placesService.js';
import { roadtripRouteService } from '../services/roadtripRouteService.js';
import { buildLimiter, parseLimiter } from '../middleware/rateLimit.js';
import type { Candidate, RoadtripParse } from '../types/roadtrip.js';

const router = Router();

function routePointsFromParse(parse: {
  route: {
    origin: { lat: number | null; lng: number | null };
    destination: { lat: number | null; lng: number | null };
    waypoints_user: Array<{ lat: number | null; lng: number | null }>;
  };
}): Array<{ lat: number; lng: number }> {
  return [parse.route.origin, ...parse.route.waypoints_user, parse.route.destination]
    .filter((p) => p.lat !== null && p.lng !== null)
    .map((p) => ({ lat: p.lat as number, lng: p.lng as number }));
}

function relaxedParseForSearch(parse: RoadtripParse): RoadtripParse {
  const categories = (parse.preferences.categories.length
    ? parse.preferences.categories
    : ['restaurant', 'hotel']) as RoadtripParse['preferences']['categories'];

  return {
    ...parse,
    preferences: {
      ...parse.preferences,
      categories,
      cuisines: [],
      budget: [],
      distinction_slugs: [],
      green_star: null,
      max_detour_minutes_per_stop: null,
      max_total_detour_minutes: null,
    },
    search_query: {
      ...parse.search_query,
      radius_km: Math.max(parse.search_query.radius_km, 120),
      limit_candidates_per_category: Math.max(parse.search_query.limit_candidates_per_category, 30),
      sort: 'relevance',
    },
  };
}

router.post('/parse', parseLimiter, async (req, res, next) => {
  try {
    const input = parseRequestSchema.parse(req.body);
    const parsed = await parseRoadtrip(input);
    res.json(parsed);
  } catch (err) {
    next(err);
  }
});

router.post('/select', async (req, res, next) => {
  try {
    const body = roadtripSelectRequestSchema.parse(req.body);
    const selected = await selectRoadtripStops(body.parse, body.candidates);
    validateSelectionAgainstCandidates(body.parse, body.candidates, selected);
    res.json(selected);
  } catch (err) {
    next(err);
  }
});

router.post('/route', async (req, res, next) => {
  try {
    const body = roadtripRouteRequestSchema.parse(req.body);
    validateSelectionAgainstCandidates(body.parse, body.candidates, body.selected);

    const selectedCandidates: Candidate[] = body.selected.selected.stops
      .map((stop) => body.candidates.find((candidate) => candidate.category === stop.category && candidate.id === stop.id))
      .filter((value): value is Candidate => Boolean(value));

    const route = await roadtripRouteService.buildRoute(body.parse, selectedCandidates);
    res.json(route);
  } catch (err) {
    next(err);
  }
});

router.post('/build', buildLimiter, async (req, res, next) => {
  try {
    const input = roadtripBuildRequestSchema.parse(req.body);
    const parse = await parseRoadtrip(input);
    const points = routePointsFromParse(parse);
    let candidates = await searchCandidates(parse, points);
    if (!candidates.length) {
      candidates = await searchCandidates(relaxedParseForSearch(parse), points);
    }

    if (!candidates.length) {
      throw new Error('No candidates found in database after relaxed search');
    }

    const selected = await selectRoadtripStops(parse, candidates);
    validateSelectionAgainstCandidates(parse, candidates, selected);

    const selectedCandidates: Candidate[] = selected.selected.stops
      .map((stop) => candidates.find((candidate) => candidate.category === stop.category && candidate.id === stop.id))
      .filter((value): value is Candidate => Boolean(value));

    const route = await roadtripRouteService.buildRoute(parse, selectedCandidates);

    res.json({
      parse,
      candidates,
      selected,
      route,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
