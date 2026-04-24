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

async function buildRoutePoints(parse: RoadtripParse): Promise<{
  points: Array<{ lat: number; lng: number }>;
  geocodedOrigin: { lat: number; lng: number } | null;
  geocodedDestination: { lat: number; lng: number } | null;
}> {
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

  const geocodedOrigin      = geocoded[0] ?? null;
  const geocodedDestination = geocoded[geocoded.length - 1] ?? null;

  const validPoints = geocoded.filter((p): p is { lat: number; lng: number } => p != null);

  // Add interpolated intermediate points between each pair so the whole corridor is covered
  const expanded: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i < validPoints.length; i++) {
    expanded.push(validPoints[i]);
    if (i < validPoints.length - 1) {
      expanded.push(...interpolatePoints(validPoints[i], validPoints[i + 1], NUM_INTERMEDIATE_POINTS));
    }
  }

  return { points: expanded, geocodedOrigin, geocodedDestination };
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
    const { points: routePoints, geocodedOrigin, geocodedDestination } = await buildRoutePoints(parse);

    // Enrich parse with geocoded coordinates so the frontend can render A/B markers
    if (geocodedOrigin)      { parse.route.origin.lat = geocodedOrigin.lat;           parse.route.origin.lng = geocodedOrigin.lng; }
    if (geocodedDestination) { parse.route.destination.lat = geocodedDestination.lat; parse.route.destination.lng = geocodedDestination.lng; }

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

// ── PLANNER ENDPOINTS ──────────────────────────────────────────────────────────

/**
 * GET /api/roadtrip/geocode?q=...
 * Proxy Nominatim — returns [{ label, displayName, lat, lng }]
 */
router.get('/geocode', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) { res.json([]); return; }
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&addressdetails=0&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'michelin-roadtrip/1.0' } });
    if (!response.ok) { res.json([]); return; }
    const data = (await response.json()) as Array<{ display_name: string; lat: string; lon: string }>;
    const results = data
      .filter((item) => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon)))
      .map((item) => ({
        label: item.display_name.split(',')[0].trim(),
        displayName: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
      }));
    res.json(results);
  } catch (err) {
    next(err);
  }
});

function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  let index = 0, lat = 0, lng = 0;
  const points: Array<{ lat: number; lng: number }> = [];
  while (index < encoded.length) {
    let shift = 0, result = 0, byte = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

function samplePolyline(points: Array<{ lat: number; lng: number }>, n: number): Array<{ lat: number; lng: number }> {
  if (points.length <= n) return points;
  const step = (points.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => points[Math.round(i * step)]);
}

function buildPlannerParse(prefs: {
  categories: Array<'restaurant' | 'hotel'>;
  cuisines: string[];
  budget: Array<'€' | '€€' | '€€€' | '€€€€'>;
  distinctionSlugs: string[];
  greenStar: boolean | null;
  radiusKm: number;
  limit: number;
}): RoadtripParse {
  return {
    version: '1.0',
    intent: 'roadtrip_parse',
    input_mode: 'form',
    route: {
      origin: { label: null, lat: null, lng: null },
      destination: { label: null, lat: null, lng: null },
      waypoints_user: [],
    },
    preferences: {
      categories: prefs.categories,
      cuisines: prefs.cuisines,
      budget: prefs.budget,
      distinction_slugs: prefs.distinctionSlugs,
      green_star: prefs.greenStar,
      max_detour_minutes_per_stop: MAX_DETOUR_MINUTES_PER_STOP,
      max_total_detour_minutes: null,
    },
    plan: {
      stops_target: { restaurant: 0, hotel: 0 },
      distribution_strategy: 'near_route',
    },
    search_query: {
      radius_km: prefs.radiusKm,
      limit_candidates_per_category: prefs.limit,
      sort: 'distance',
    },
    missing_fields: [],
    notes: [],
  };
}

/**
 * POST /api/roadtrip/plan
 * Geocode origin + destination, compute direct route, decode polyline,
 * return sampled corridor points for nearby POI search.
 */
router.post('/plan', async (req, res, next) => {
  try {
    const { origin, destination, waypoints = [] } = req.body as {
      origin: string;
      destination: string;
      waypoints?: Array<{ label: string; lat: number; lng: number }>;
    };
    if (!origin || !destination) {
      res.status(400).json({ error: 'origin and destination are required' });
      return;
    }
    const data = await roadtripRouteService.planRoute(String(origin), String(destination), waypoints);
    const polylinePoints = decodePolyline(data.polyline);
    const samplePoints = samplePolyline(polylinePoints, 15);
    res.json({ ...data, samplePoints });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/roadtrip/nearby
 * Find restaurants/hotels within `radiusKm` of the given route points,
 * excluding already-selected stops.
 */
router.post('/nearby', async (req, res, next) => {
  try {
    const {
      routePoints = [],
      excludeIds = [],
      preferences = {},
    } = req.body as {
      routePoints: Array<{ lat: number; lng: number }>;
      excludeIds: Array<{ category: string; id: number }>;
      preferences: {
        categories?: string[];
        cuisines?: string[];
        budget?: string[];
        distinctionSlugs?: string[];
        greenStar?: boolean | null;
        radiusKm?: number;
        limit?: number;
      };
    };

    const categories = (preferences.categories ?? ['restaurant', 'hotel']).filter(
      (c): c is 'restaurant' | 'hotel' => c === 'restaurant' || c === 'hotel',
    );
    const parse = buildPlannerParse({
      categories,
      cuisines: preferences.cuisines ?? [],
      budget: (preferences.budget ?? []) as Array<'€' | '€€' | '€€€' | '€€€€'>,
      distinctionSlugs: preferences.distinctionSlugs ?? [],
      greenStar: preferences.greenStar ?? null,
      radiusKm: preferences.radiusKm ?? 10,
      limit: preferences.limit ?? 30,
    });

    const excludeSet = new Set(excludeIds.map((e) => `${e.category}:${e.id}`));
    const candidates = await searchCandidates(parse, routePoints);
    const filtered = candidates.filter((c) => !excludeSet.has(`${c.category}:${c.id}`));
    res.json({ candidates: filtered });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/roadtrip/compute
 * Recompute route + per-stop detours with the user's chosen stops (coords known).
 */
router.post('/compute', async (req, res, next) => {
  try {
    const { origin, destination, stops = [], waypoints = [] } = req.body as {
      origin: { lat: number; lng: number };
      destination: { lat: number; lng: number };
      stops: Array<{ lat: number; lng: number; category: 'restaurant' | 'hotel'; id: number }>;
      waypoints: Array<{ lat: number; lng: number }>;
    };

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      res.status(400).json({ error: 'origin and destination with lat/lng are required' });
      return;
    }

    // Filter stops by proximity to the route corridor (not just endpoints).
    // Interpolate N points along the A→B segment and keep any stop within
    // ROUGH_MAX_KM of at least one of them. This correctly handles stops
    // that are near the middle of a long route but far from both endpoints.
    const ROUGH_MAX_KM = 45;
    const CORRIDOR_SAMPLES = 10;

    function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
      const R = 6371;
      const dLat = (b.lat - a.lat) * Math.PI / 180;
      const dLng = (b.lng - a.lng) * Math.PI / 180;
      const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    }

    // Build corridor sample points: origin, destination + evenly-spaced intermediates
    const corridorPoints: Array<{ lat: number; lng: number }> = [];
    for (let i = 0; i <= CORRIDOR_SAMPLES; i++) {
      const t = i / CORRIDOR_SAMPLES;
      corridorPoints.push({
        lat: origin.lat + (destination.lat - origin.lat) * t,
        lng: origin.lng + (destination.lng - origin.lng) * t,
      });
    }
    // Include explicit waypoints in the corridor check too
    for (const wp of waypoints) corridorPoints.push(wp);

    const validStops = stops.filter((s) =>
      corridorPoints.some((pt) => haversineKm(pt, s) <= ROUGH_MAX_KM),
    );

    const result = await roadtripRouteService.computeWithStops(origin, destination, validStops, waypoints);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
