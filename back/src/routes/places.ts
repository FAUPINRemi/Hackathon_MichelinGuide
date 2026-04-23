import { Router } from 'express';
import { placesSearchRequestSchema } from '../schemas/roadtripSchemas.js';
import { searchCandidates } from '../services/placesService.js';

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

router.post('/search', async (req, res, next) => {
  try {
    const body = placesSearchRequestSchema.parse(req.body);
    const points = body.route_points || routePointsFromParse(body.parse);
    const candidates = await searchCandidates(body.parse, points);
    res.json({ candidates });
  } catch (err) {
    next(err);
  }
});

export default router;
