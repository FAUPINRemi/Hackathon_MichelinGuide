import { z } from 'zod';

const geoPointSchema = z.object({
  label: z.string().nullable(),
  lat: z.number().finite().nullable(),
  lng: z.number().finite().nullable(),
}).strict();

export const roadtripParseSchema = z.object({
  version: z.literal('1.0'),
  intent: z.literal('roadtrip_parse'),
  input_mode: z.enum(['form', 'free_text']),
  route: z.object({
    origin: geoPointSchema,
    destination: geoPointSchema,
    waypoints_user: z.array(z.object({
      label: z.string(),
      lat: z.number().finite().nullable(),
      lng: z.number().finite().nullable(),
    }).strict()),
  }).strict(),
  preferences: z.object({
    categories: z.array(z.enum(['restaurant', 'hotel'])).min(1).max(2),
    cuisines: z.array(z.string()),
    budget: z.array(z.enum(['€', '€€', '€€€', '€€€€'])),
    distinction_slugs: z.array(z.string()),
    green_star: z.boolean().nullable(),
    max_detour_minutes_per_stop: z.number().int().positive().nullable(),
    max_total_detour_minutes: z.number().int().positive().nullable(),
  }).strict(),
  plan: z.object({
    stops_target: z.object({
      restaurant: z.number().int().min(0),
      hotel: z.number().int().min(0),
    }).strict(),
    distribution_strategy: z.enum(['near_route', 'balanced', 'near_cities']),
    stop_area: z.string().optional(),
  }).strict(),
  search_query: z.object({
    radius_km: z.number().positive(),
    limit_candidates_per_category: z.number().int().positive(),
    sort: z.enum(['relevance', 'distance', 'distinction']),
  }).strict(),
  missing_fields: z.array(z.string()),
  notes: z.array(z.string()),
}).strict();

export const parseRequestSchema = z.object({
  input_mode: z.enum(['form', 'free_text']),
  freeText: z.string().max(4000).optional(),
  form: z.object({
    origin: geoPointSchema.optional(),
    destination: geoPointSchema.optional(),
    waypoints_user: z.array(geoPointSchema).optional(),
    categories: z.array(z.enum(['restaurant', 'hotel'])).optional(),
    cuisines: z.array(z.string()).optional(),
    budget: z.array(z.string()).optional(),
    distinction_slugs: z.array(z.string()).optional(),
    green_star: z.boolean().nullable().optional(),
    max_detour_minutes_per_stop: z.number().int().positive().nullable().optional(),
    max_total_detour_minutes: z.number().int().positive().nullable().optional(),
    stops_target: z.object({
      restaurant: z.number().int().min(0).optional(),
      hotel: z.number().int().min(0).optional(),
    }).optional(),
    distribution_strategy: z.enum(['near_route', 'balanced', 'near_cities']).optional(),
    radius_km: z.number().positive().optional(),
    limit_candidates_per_category: z.number().int().positive().optional(),
    sort: z.enum(['relevance', 'distance', 'distinction']).optional(),
  }).optional(),
}).superRefine((value, ctx) => {
  if (value.input_mode === 'free_text' && !value.freeText?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'freeText is required when input_mode is free_text',
      path: ['freeText'],
    });
  }

  if (value.input_mode === 'form' && !value.form) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'form is required when input_mode is form',
      path: ['form'],
    });
  }
});

export const candidateSchema = z.object({
  category: z.enum(['restaurant', 'hotel']),
  id: z.number().int(),
  name: z.string(),
  lat: z.number().finite(),
  lng: z.number().finite(),
  city: z.string().nullable(),
  distinction_slug: z.string().nullable(),
  budget_symbol: z.enum(['€', '€€', '€€€', '€€€€']).nullable(),
  cuisines: z.array(z.string()),
  image: z.string().nullable(),
  score: z.number().optional(),
}).strict();

export const roadtripSelectSchema = z.object({
  version: z.literal('1.0'),
  intent: z.literal('roadtrip_select'),
  selected: z.object({
    stops: z.array(z.object({
      category: z.enum(['restaurant', 'hotel']),
      id: z.number().int(),
      reason: z.string(),
      priority: z.number().int().min(1).max(3),
    }).strict()),
  }).strict(),
  missing_fields: z.array(z.string()),
  notes: z.array(z.string()),
}).strict();

export const placesSearchRequestSchema = z.object({
  parse: roadtripParseSchema,
  route_points: z.array(z.object({ lat: z.number().finite(), lng: z.number().finite() }).strict()).optional(),
}).strict();

export const roadtripSelectRequestSchema = z.object({
  parse: roadtripParseSchema,
  candidates: z.array(candidateSchema),
}).strict();

export const roadtripRouteRequestSchema = z.object({
  parse: roadtripParseSchema,
  selected: roadtripSelectSchema,
  candidates: z.array(candidateSchema),
}).strict();

export const roadtripBuildRequestSchema = parseRequestSchema;
