export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Michelin Roadtrip API',
    version: '1.0.0',
    description: 'API for parsing, searching, selecting and routing Michelin road trips.',
  },
  servers: [
    { url: '/' },
  ],
  tags: [
    { name: 'health' },
    { name: 'restaurants' },
    { name: 'hotels' },
    { name: 'roadtrip' },
    { name: 'places' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['health'],
        summary: 'Healthcheck',
        responses: {
          '200': {
            description: 'Server health',
          },
        },
      },
    },
    '/api/roadtrip/parse': {
      post: {
        tags: ['roadtrip'],
        summary: 'Parse roadtrip request with Gemini',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RoadtripParseRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'RoadtripParse JSON',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RoadtripParse' },
              },
            },
          },
        },
      },
    },
    '/api/places/search': {
      post: {
        tags: ['places'],
        summary: 'Search candidate places from Postgres',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PlacesSearchRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Candidate list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    candidates: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Candidate' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/roadtrip/select': {
      post: {
        tags: ['roadtrip'],
        summary: 'Select stops from shortlist with Gemini',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RoadtripSelectRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Selected stops',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RoadtripSelect' },
              },
            },
          },
        },
      },
    },
    '/api/roadtrip/route': {
      post: {
        tags: ['roadtrip'],
        summary: 'Compute route with direct and stop detours',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RoadtripRouteRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Route result',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RoadtripRouteResult' },
              },
            },
          },
        },
      },
    },
    '/api/roadtrip/build': {
      post: {
        tags: ['roadtrip'],
        summary: 'Orchestrate parse -> search -> select -> route',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RoadtripParseRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Complete roadtrip payload',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    parse: { $ref: '#/components/schemas/RoadtripParse' },
                    candidates: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Candidate' },
                    },
                    selected: { $ref: '#/components/schemas/RoadtripSelect' },
                    route: { $ref: '#/components/schemas/RoadtripRouteResult' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      GeoPoint: {
        type: 'object',
        required: ['label', 'lat', 'lng'],
        properties: {
          label: { type: 'string', nullable: true },
          lat: { type: 'number', nullable: true },
          lng: { type: 'number', nullable: true },
        },
      },
      Candidate: {
        type: 'object',
        required: ['category', 'id', 'name', 'lat', 'lng', 'city', 'distinction_slug', 'budget_symbol', 'cuisines'],
        properties: {
          category: { type: 'string', enum: ['restaurant', 'hotel'] },
          id: { type: 'integer' },
          name: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' },
          city: { type: 'string', nullable: true },
          distinction_slug: { type: 'string', nullable: true },
          budget_symbol: { type: 'string', nullable: true, enum: ['€', '€€', '€€€', '€€€€'] },
          cuisines: { type: 'array', items: { type: 'string' } },
          score: { type: 'number' },
        },
      },
      RoadtripParseRequest: {
        type: 'object',
        required: ['input_mode'],
        properties: {
          input_mode: { type: 'string', enum: ['form', 'free_text'] },
          freeText: { type: 'string' },
          form: {
            type: 'object',
            properties: {
              origin: { $ref: '#/components/schemas/GeoPoint' },
              destination: { $ref: '#/components/schemas/GeoPoint' },
              waypoints_user: {
                type: 'array',
                items: { $ref: '#/components/schemas/GeoPoint' },
              },
            },
          },
        },
      },
      RoadtripParse: {
        type: 'object',
        required: ['version', 'intent', 'input_mode', 'route', 'preferences', 'plan', 'search_query', 'missing_fields', 'notes'],
        properties: {
          version: { type: 'string', enum: ['1.0'] },
          intent: { type: 'string', enum: ['roadtrip_parse'] },
          input_mode: { type: 'string', enum: ['form', 'free_text'] },
          route: {
            type: 'object',
            properties: {
              origin: { $ref: '#/components/schemas/GeoPoint' },
              destination: { $ref: '#/components/schemas/GeoPoint' },
              waypoints_user: {
                type: 'array',
                items: { $ref: '#/components/schemas/GeoPoint' },
              },
            },
          },
          preferences: {
            type: 'object',
            properties: {
              categories: { type: 'array', items: { type: 'string', enum: ['restaurant', 'hotel'] } },
              cuisines: { type: 'array', items: { type: 'string' } },
              budget: { type: 'array', items: { type: 'string', enum: ['€', '€€', '€€€', '€€€€'] } },
              distinction_slugs: { type: 'array', items: { type: 'string' } },
              green_star: { type: 'boolean', nullable: true },
              max_detour_minutes_per_stop: { type: 'number', nullable: true },
              max_total_detour_minutes: { type: 'number', nullable: true },
            },
          },
          plan: {
            type: 'object',
            properties: {
              stops_target: {
                type: 'object',
                properties: {
                  restaurant: { type: 'integer' },
                  hotel: { type: 'integer' },
                },
              },
              distribution_strategy: { type: 'string', enum: ['near_route', 'balanced', 'near_cities'] },
            },
          },
          search_query: {
            type: 'object',
            properties: {
              radius_km: { type: 'number' },
              limit_candidates_per_category: { type: 'integer' },
              sort: { type: 'string', enum: ['relevance', 'distance', 'distinction'] },
            },
          },
          missing_fields: { type: 'array', items: { type: 'string' } },
          notes: { type: 'array', items: { type: 'string' } },
        },
      },
      PlacesSearchRequest: {
        type: 'object',
        required: ['parse'],
        properties: {
          parse: { $ref: '#/components/schemas/RoadtripParse' },
          route_points: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' },
              },
            },
          },
        },
      },
      RoadtripSelect: {
        type: 'object',
        required: ['version', 'intent', 'selected', 'missing_fields', 'notes'],
        properties: {
          version: { type: 'string', enum: ['1.0'] },
          intent: { type: 'string', enum: ['roadtrip_select'] },
          selected: {
            type: 'object',
            properties: {
              stops: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string', enum: ['restaurant', 'hotel'] },
                    id: { type: 'integer' },
                    reason: { type: 'string' },
                    priority: { type: 'integer', minimum: 1, maximum: 3 },
                  },
                },
              },
            },
          },
          missing_fields: { type: 'array', items: { type: 'string' } },
          notes: { type: 'array', items: { type: 'string' } },
        },
      },
      RoadtripSelectRequest: {
        type: 'object',
        required: ['parse', 'candidates'],
        properties: {
          parse: { $ref: '#/components/schemas/RoadtripParse' },
          candidates: { type: 'array', items: { $ref: '#/components/schemas/Candidate' } },
        },
      },
      RoadtripRouteRequest: {
        type: 'object',
        required: ['parse', 'selected', 'candidates'],
        properties: {
          parse: { $ref: '#/components/schemas/RoadtripParse' },
          selected: { $ref: '#/components/schemas/RoadtripSelect' },
          candidates: { type: 'array', items: { $ref: '#/components/schemas/Candidate' } },
        },
      },
      RoadtripRouteResult: {
        type: 'object',
        properties: {
          provider: { type: 'string', enum: ['google_routes'] },
          polyline_direct: { type: 'string' },
          polyline_with_stops: { type: 'string' },
          direct_duration_minutes: { type: 'number' },
          with_stops_duration_minutes: { type: 'number' },
          total_detour_minutes: { type: 'number' },
          stop_detours: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string', enum: ['restaurant', 'hotel'] },
                id: { type: 'integer' },
                detour_minutes: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
} as const;
