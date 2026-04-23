export type InputMode = 'form' | 'free_text';
export type Category = 'restaurant' | 'hotel';

export interface RoadtripParse {
  version: '1.0';
  intent: 'roadtrip_parse';
  input_mode: InputMode;
  route: {
    origin: { label: string | null; lat: number | null; lng: number | null };
    destination: { label: string | null; lat: number | null; lng: number | null };
    waypoints_user: Array<{ label: string; lat: number | null; lng: number | null }>;
  };
  preferences: {
    categories: Category[];
    cuisines: string[];
    budget: Array<'€' | '€€' | '€€€' | '€€€€'>;
    distinction_slugs: string[];
    green_star: boolean | null;
    max_detour_minutes_per_stop: number | null;
    max_total_detour_minutes: number | null;
  };
  plan: {
    stops_target: { restaurant: number; hotel: number };
    distribution_strategy: 'near_route' | 'balanced' | 'near_cities';
    stop_area?: string;
  };
  search_query: {
    radius_km: number;
    limit_candidates_per_category: number;
    sort: 'relevance' | 'distance' | 'distinction';
  };
  missing_fields: string[];
  notes: string[];
}

export interface Candidate {
  category: Category;
  id: number;
  name: string;
  lat: number;
  lng: number;
  city: string | null;
  distinction_slug: string | null;
  budget_symbol: '€' | '€€' | '€€€' | '€€€€' | null;
  cuisines: string[];
  image: string | null;
  score?: number;
}

export interface RoadtripSelect {
  version: '1.0';
  intent: 'roadtrip_select';
  selected: {
    stops: Array<{
      category: Category;
      id: number;
      reason: string;
      priority: number;
    }>;
  };
  missing_fields: string[];
  notes: string[];
}

export interface RoadtripRouteResult {
  provider: 'google_routes';
  polyline_direct: string;
  polyline_with_stops: string;
  direct_duration_minutes: number;
  with_stops_duration_minutes: number;
  total_detour_minutes: number;
  stop_detours: Array<{
    category: Category;
    id: number;
    detour_minutes: number;
  }>;
}
