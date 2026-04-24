import type { Candidate, RoadtripParse, RoadtripRouteResult } from '../types/roadtrip.js';
import { GoogleAuth } from 'google-auth-library';

interface GoogleRouteResponse {
  routes?: Array<{
    duration?: string;
    polyline?: {
      encodedPolyline?: string;
    };
  }>;
}

interface NominatimResult {
  lat?: string;
  lon?: string;
}

function parseDurationToMinutes(duration: string | undefined): number {
  if (!duration) return 0;
  const seconds = Number(duration.replace('s', ''));
  return Math.max(0, Math.round(seconds / 60));
}

function ensurePoint(label: string, lat: number | null, lng: number | null): { latitude: number; longitude: number } {
  if (lat === null || lng === null) {
    throw new Error(`${label} coordinates are required to compute a route`);
  }
  return { latitude: lat, longitude: lng };
}

export class RoadtripRouteService {
  private readonly apiKey: string;
  private readonly vertexServiceAccountJson: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    this.vertexServiceAccountJson = process.env.VERTEX_SERVICE_ACCOUNT_JSON || '';
  }

  private async geocodeLabel(label: string): Promise<{ latitude: number; longitude: number } | null> {
    const query = label.trim();
    if (!query) return null;

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        // Nominatim requires a valid user-agent for server-side usage.
        'User-Agent': 'michelin-roadtrip/1.0',
      },
    });

    if (!response.ok) return null;
    const data = (await response.json()) as NominatimResult[];
    const first = data[0];
    const lat = first?.lat ? Number(first.lat) : NaN;
    const lng = first?.lon ? Number(first.lon) : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { latitude: lat, longitude: lng };
  }

  private async resolvePoint(
    pointName: 'origin' | 'destination',
    point: { label: string | null; lat: number | null; lng: number | null },
  ): Promise<{ latitude: number; longitude: number }> {
    if (point.lat !== null && point.lng !== null) {
      return ensurePoint(pointName, point.lat, point.lng);
    }

    if (point.label) {
      const geocoded = await this.geocodeLabel(point.label);
      if (geocoded) return geocoded;
      throw new Error(`Unable to geocode ${pointName} label: ${point.label}`);
    }

    throw new Error(`${pointName} label or coordinates are required to compute a route`);
  }

  private buildGoogleAuth(): GoogleAuth {
    if (this.vertexServiceAccountJson) {
      const credentials = JSON.parse(this.vertexServiceAccountJson);
      return new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    }

    return new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }

  private async authHeaders(): Promise<Record<string, string>> {
    if (this.apiKey) {
      return { 'X-Goog-Api-Key': this.apiKey };
    }

    const auth = this.buildGoogleAuth();
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    const accessToken = typeof token === 'string' ? token : token?.token;

    if (!accessToken) {
      throw new Error('Google Routes auth missing: configure GOOGLE_MAPS_API_KEY or service-account credentials');
    }

    return { Authorization: `Bearer ${accessToken}` };
  }

  private async computeRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    stops: Array<{ latitude: number; longitude: number }>,
  ): Promise<{ durationMinutes: number; polyline: string }> {
    const authHeaders = await this.authHeaders();

    const payload = {
      origin: { location: { latLng: origin } },
      destination: { location: { latLng: destination } },
      intermediates: stops.map((stop) => ({ location: { latLng: stop } })),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      languageCode: 'fr-FR',
      units: 'METRIC',
    };

    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'routes.duration,routes.polyline.encodedPolyline',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Routes API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as GoogleRouteResponse;
    const route = data.routes?.[0];
    if (!route) throw new Error('Google Routes API returned no route');

    return {
      durationMinutes: parseDurationToMinutes(route.duration),
      polyline: route.polyline?.encodedPolyline || '',
    };
  }

  private async resolveWaypoints(
    waypoints: RoadtripParse['route']['waypoints_user'],
  ): Promise<Array<{ latitude: number; longitude: number }>> {
    const resolved: Array<{ latitude: number; longitude: number }> = [];
    for (const wp of waypoints) {
      if (wp.lat !== null && wp.lng !== null) {
        resolved.push({ latitude: wp.lat, longitude: wp.lng });
      } else if (wp.label) {
        const geocoded = await this.geocodeLabel(wp.label);
        if (geocoded) resolved.push(geocoded);
      }
    }
    return resolved;
  }

  async planRoute(
    originLabel: string,
    destinationLabel: string,
    waypoints: Array<{ label: string; lat: number; lng: number }> = [],
  ): Promise<{
    origin: { label: string; lat: number; lng: number };
    destination: { label: string; lat: number; lng: number };
    waypoints: Array<{ label: string; lat: number; lng: number }>;
    polyline: string;
    durationMinutes: number;
  }> {
    const origin = await this.resolvePoint('origin', { label: originLabel, lat: null, lng: null });
    const destination = await this.resolvePoint('destination', { label: destinationLabel, lat: null, lng: null });
    const waypointPts = waypoints.map((w) => ({ latitude: w.lat, longitude: w.lng }));
    const route = await this.computeRoute(origin, destination, waypointPts);
    return {
      origin: { label: originLabel, lat: origin.latitude, lng: origin.longitude },
      destination: { label: destinationLabel, lat: destination.latitude, lng: destination.longitude },
      waypoints,
      polyline: route.polyline,
      durationMinutes: route.durationMinutes,
    };
  }

  async computeWithStops(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    stops: Array<{ lat: number; lng: number; category: 'restaurant' | 'hotel'; id: number }>,
    waypoints: Array<{ lat: number; lng: number }> = [],
  ): Promise<RoadtripRouteResult> {
    const originPt     = { latitude: origin.lat,      longitude: origin.lng };
    const destPt       = { latitude: destination.lat,  longitude: destination.lng };
    const waypointPts  = waypoints.map((w) => ({ latitude: w.lat, longitude: w.lng }));
    const stopPts      = stops.map((s) => ({ latitude: s.lat, longitude: s.lng }));

    const direct    = await this.computeRoute(originPt, destPt, waypointPts);
    const withStops = stops.length
      ? await this.computeRoute(originPt, destPt, [...waypointPts, ...stopPts])
      : direct;

    const stopDetours: RoadtripRouteResult['stop_detours'] = [];
    for (const stop of stops) {
      const solo = await this.computeRoute(originPt, destPt, [...waypointPts, { latitude: stop.lat, longitude: stop.lng }]);
      stopDetours.push({
        category: stop.category,
        id: stop.id,
        detour_minutes: Math.max(0, solo.durationMinutes - direct.durationMinutes),
      });
    }

    const totalDetour = stopDetours.reduce((sum, d) => sum + d.detour_minutes, 0);

    return {
      provider: 'google_routes',
      polyline_direct: direct.polyline,
      polyline_with_stops: withStops.polyline,
      direct_duration_minutes: direct.durationMinutes,
      with_stops_duration_minutes: direct.durationMinutes + totalDetour,
      total_detour_minutes: totalDetour,
      stop_detours: stopDetours,
    };
  }

  async buildRoute(parse: RoadtripParse, selectedCandidates: Candidate[]): Promise<RoadtripRouteResult> {
    const origin = await this.resolvePoint('origin', parse.route.origin);
    const destination = await this.resolvePoint('destination', parse.route.destination);
    const userWaypoints = await this.resolveWaypoints(parse.route.waypoints_user);

    const orderedStops = [...selectedCandidates];
    const stops = orderedStops.map((stop) => ({ latitude: stop.lat, longitude: stop.lng }));

    // User waypoints define the base route (e.g. Lyon) — included in both direct and with-stops
    const direct = await this.computeRoute(origin, destination, userWaypoints);
    const withStops = await this.computeRoute(origin, destination, [...userWaypoints, ...stops]);

    const stopDetours: RoadtripRouteResult['stop_detours'] = [];
    for (const stop of orderedStops) {
      const solo = await this.computeRoute(origin, destination, [...userWaypoints, { latitude: stop.lat, longitude: stop.lng }]);
      stopDetours.push({
        category: stop.category,
        id: stop.id,
        detour_minutes: Math.max(0, solo.durationMinutes - direct.durationMinutes),
      });
    }

    return {
      provider: 'google_routes',
      polyline_direct: direct.polyline,
      polyline_with_stops: withStops.polyline,
      direct_duration_minutes: direct.durationMinutes,
      with_stops_duration_minutes: withStops.durationMinutes,
      total_detour_minutes: Math.max(0, withStops.durationMinutes - direct.durationMinutes),
      stop_detours: stopDetours,
    };
  }
}

export const roadtripRouteService = new RoadtripRouteService();
