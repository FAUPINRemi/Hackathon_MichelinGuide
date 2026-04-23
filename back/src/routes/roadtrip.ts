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

// Hard cap: never allow a detour > 30 min per stop regardless of user input
const MAX_DETOUR_MINUTES_PER_STOP = 30;
// Radius around each route point to search candidates
const ROUTE_SEARCH_RADIUS_KM = 40;
// Number of interpolated points between origin and destination
const NUM_INTERMEDIATE_POINTS = 4;
// Candidates per category
const CANDIDATES_PER_CATEGORY = 50;

interface NominatimResult {
  lat?: string;
  lon?: string;
}

async function geocodeLabel(label: string): Promise<{ lat: number; lng: number } | null> {
  const query = label.trim();
  if (!query) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'michelin-roadtrip/1.0' } });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResult[];
    const first = data[0];
    const lat = first?.lat ? Number(first.lat) : NaN;
    const lng = first?.lon ? Number(first.lon) : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

function interpolatePoints(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  n: number,
): Array<{ lat: number; lng: number }> {
  const pts: Array<{ lat: number; lng: number }> = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    pts.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
  }
  return pts;
}

async function buildRoutePoints(parse: RoadtripParse): Promise<Array<{ lat: number; lng: number }>> {
  const allLabels = [
    parse.route.origin,
    ...parse.route.waypoints_user,
    parse.route.destination,
  ];

  const geocoded: Array<{ lat: number; lng: number } | null> = [];
  for (const point of allLabels) {
    if (point.lat != null && point.lng != null) {
      geocoded.push({ lat: point.lat, lng: point.lng });
    } else if (point.label) {
      geocoded.push(await geocodeLabel(point.label));
    } else {
      geocoded.push(null);
    }
  }

  const validPoints = geocoded.filter((p): p is { lat: number; lng: number } => p != null);

  // Add interpolated intermediate points between each pair so the whole corridor is covered
  const expanded: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i < validPoints.length; i++) {
    expanded.push(validPoints[i]);
    if (i < validPoints.length - 1) {
      expanded.push(...interpolatePoints(validPoints[i], validPoints[i + 1], NUM_INTERMEDIATE_POINTS));
    }
  }

  return expanded;
}

function applyServerDefaults(parse: RoadtripParse): RoadtripParse {
  return {
    ...parse,
    preferences: {
      ...parse.preferences,
      // Hard cap: no user-specified detour can exceed server max
      max_detour_minutes_per_stop: MAX_DETOUR_MINUTES_PER_STOP,
      max_total_detour_minutes: parse.preferences.max_total_detour_minutes ?? null,
    },
    search_query: {
      ...parse.search_query,
      // Server controls radius and limit, not AI
      radius_km: ROUTE_SEARCH_RADIUS_KM,
      limit_candidates_per_category: CANDIDATES_PER_CATEGORY,
      sort: 'distance',
    },
  };
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
      // Relax soft filters but keep geographic hard constraint
      cuisines: [],
      budget: [],
      distinction_slugs: [],
      green_star: null,
      max_detour_minutes_per_stop: MAX_DETOUR_MINUTES_PER_STOP,
      max_total_detour_minutes: null,
    },
    search_query: {
      ...parse.search_query,
      // Keep same geographic radius — do NOT blow it up to 120km
      radius_km: ROUTE_SEARCH_RADIUS_KM,
      limit_candidates_per_category: CANDIDATES_PER_CATEGORY,
      sort: 'distance',
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
      .map((stop) => body.candidates.find((c) => c.category === stop.category && c.id === stop.id))
      .filter((v): v is Candidate => Boolean(v));

    const route = await roadtripRouteService.buildRoute(body.parse, selectedCandidates);
    res.json(route);
  } catch (err) {
    next(err);
  }
});

router.post('/build', buildLimiter, async (req, res, next) => {
  try {
    const input = roadtripBuildRequestSchema.parse(req.body);

    // Step 1 — parse user intent
    const parsedRaw = await parseRoadtrip(input);

    // Step 2 — apply server-side defaults (override AI choices for radius/limit/detour)
    const parse = applyServerDefaults(parsedRaw);

    // Step 3 — geocode origin/waypoints/destination + interpolate corridor points
    const routePoints = await buildRoutePoints(parse);

    // Step 4 — search candidates near actual route
    let candidates = await searchCandidates(parse, routePoints);

    // Step 5 — if no match with hard filters, relax soft preferences (keep geography)
    if (!candidates.length) {
      candidates = await searchCandidates(relaxedParseForSearch(parse), routePoints);
    }

    if (!candidates.length) {
      throw new Error('Aucun établissement trouvé sur ce trajet. Vérifiez les villes de départ et d\'arrivée.');
    }

    // Step 6 — AI selects best stops from shortlist
    const selected = await selectRoadtripStops(parse, candidates);
    validateSelectionAgainstCandidates(parse, candidates, selected);

    let selectedCandidates: Candidate[] = selected.selected.stops
      .map((stop) => candidates.find((c) => c.category === stop.category && c.id === stop.id))
      .filter((v): v is Candidate => Boolean(v));

    // Step 7 — build actual route with Google Routes
    const route = await roadtripRouteService.buildRoute(parse, selectedCandidates);

    // Step 8 — enforce hard detour cap: remove stops exceeding MAX_DETOUR_MINUTES_PER_STOP
    const overDetour = route.stop_detours
      .filter((d) => d.detour_minutes > MAX_DETOUR_MINUTES_PER_STOP)
      .map((d) => `${d.category}:${d.id}`);

    if (overDetour.length > 0) {
      selectedCandidates = selectedCandidates.filter(
        (c) => !overDetour.includes(`${c.category}:${c.id}`),
      );
      // Rebuild route without the problematic stops
      const filteredRoute = await roadtripRouteService.buildRoute(parse, selectedCandidates);
      return res.json({
        parse,
        candidates,
        selected,
        route: filteredRoute,
        filtered_stops: overDetour,
      });
    }

    res.json({ parse, candidates, selected, route });
  } catch (err) {
    next(err);
  }
});

export default router;
