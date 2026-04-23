import { pool } from '../db/pool.js';
import type { Candidate, RoadtripParse } from '../types/roadtrip.js';

const BUDGET_TO_SLUGS: Record<string, string[]> = {
  '€': ['inexpensive', 'P01'],
  '€€': ['moderate', 'P02'],
  '€€€': ['expensive', 'P03'],
  '€€€€': ['luxury', 'P04'],
};

function priceSymbolFromSlug(slug: string | null | undefined): Candidate['budget_symbol'] {
  if (!slug) return null;
  if (slug.includes('P01') || slug === 'inexpensive') return '€';
  if (slug.includes('P02') || slug === 'moderate') return '€€';
  if (slug.includes('P03') || slug === 'expensive') return '€€€';
  if (slug.includes('P04') || slug === 'luxury') return '€€€€';
  return null;
}

function sortClause(sort: RoadtripParse['search_query']['sort']): string {
  if (sort === 'distance') return 'distance_km ASC NULLS LAST, distinction_score DESC NULLS LAST';
  if (sort === 'distinction') return 'distinction_score DESC NULLS LAST, distance_km ASC NULLS LAST';
  return 'score DESC, distinction_score DESC NULLS LAST, distance_km ASC NULLS LAST';
}

function pointsCte(points: Array<{ lat: number; lng: number }>): string {
  if (!points.length) {
    return 'SELECT NULL::double precision AS lat, NULL::double precision AS lng WHERE false';
  }
  return `VALUES ${points
    .map((_, index) => `($${index * 2 + 1}::double precision, $${index * 2 + 2}::double precision)`)
    .join(',')}`;
}

function pointParams(points: Array<{ lat: number; lng: number }>): number[] {
  return points.flatMap((p) => [p.lat, p.lng]);
}

function extractCuisineLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const v = item as Record<string, unknown>;
        return String(v.label || v.name || v.slug || '').trim();
      }
      return '';
    })
    .filter(Boolean);
}

const CUISINE_ALIASES: Record<string, string[]> = {
  francaise: ['french'],
  francais: ['french'],
  french: ['french'],
  italienne: ['italian'],
  italien: ['italian'],
  italian: ['italian'],
  japonaise: ['japanese'],
  japonais: ['japanese'],
  japanese: ['japanese'],
  chinoise: ['chinese'],
  chinese: ['chinese'],
  mexicaine: ['mexican'],
  mexican: ['mexican'],
  indienne: ['indian'],
  indian: ['indian'],
  mediterraneenne: ['mediterranean'],
  mediterranean: ['mediterranean'],
  vegetale: ['vegetarian'],
  vegetarienne: ['vegetarian'],
  vegetarian: ['vegetarian'],
  fruits_de_mer: ['seafood'],
  seafood: ['seafood'],
};

function normalizeCuisineToken(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
}

function expandCuisineNeedles(cuisines: string[]): string[] {
  const out = new Set<string>();

  cuisines.forEach((raw) => {
    const normalized = normalizeCuisineToken(raw);
    if (!normalized) return;

    out.add(normalized);
    (CUISINE_ALIASES[normalized] || []).forEach((alias) => out.add(alias));
  });

  return Array.from(out);
}

export async function searchCandidates(parse: RoadtripParse, routePoints: Array<{ lat: number; lng: number }>): Promise<Candidate[]> {
  const categories = new Set(parse.preferences.categories);
  const pointsSql = pointsCte(routePoints);
  const pointsParams = pointParams(routePoints);
  const radius = parse.search_query.radius_km;
  const limit = parse.search_query.limit_candidates_per_category;
  const orderBy = sortClause(parse.search_query.sort);

  const cuisineNeedles = expandCuisineNeedles(parse.preferences.cuisines);
  const distinctionSlugs = parse.preferences.distinction_slugs;
  const budgetSlugs = parse.preferences.budget.flatMap((symbol) => BUDGET_TO_SLUGS[symbol] || []);

  const candidates: Candidate[] = [];

  if (categories.has('restaurant')) {
    const runRestaurantQuery = async (applyCuisineFilter: boolean): Promise<Array<Record<string, unknown>>> => {
      const params: unknown[] = [...pointsParams];
      const where: string[] = [
        'r.lat IS NOT NULL',
        'r.lng IS NOT NULL',
        "(r.status IS NULL OR lower(r.status) <> 'closed')",
      ];

      if (applyCuisineFilter && cuisineNeedles.length) {
        params.push(cuisineNeedles);
        where.push(`EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(r.cuisines, '[]'::jsonb)) c
          WHERE (
            lower(CASE
              WHEN jsonb_typeof(c) = 'object' THEN COALESCE(c->>'label', c->>'name', c->>'slug', '')
              ELSE trim(both '"' from c::text)
            END) = ANY($${params.length}::text[])
            OR EXISTS (
              SELECT 1
              FROM unnest($${params.length}::text[]) AS needle
              WHERE lower(CASE
                WHEN jsonb_typeof(c) = 'object' THEN COALESCE(c->>'label', c->>'name', c->>'slug', '')
                ELSE trim(both '"' from c::text)
              END) LIKE '%' || needle || '%'
            )
          )
        )`);
      }

      if (distinctionSlugs.length) {
        params.push(distinctionSlugs);
        where.push(`lower(COALESCE(r.distinction->>'slug', '')) = ANY($${params.length}::text[])`);
      }

      if (budgetSlugs.length) {
        params.push(budgetSlugs.map((b) => b.toLowerCase()));
        where.push(`(
          lower(COALESCE(r.price_category->>'slug', '')) = ANY($${params.length}::text[])
          OR lower(COALESCE(r.price_category->>'code', '')) = ANY($${params.length}::text[])
        )`);
      }

      if (parse.preferences.green_star === true) {
        where.push('r.green_star = true');
      }

      params.push(radius);
      params.push(limit);

      const sql = `
        WITH route_points(lat, lng) AS (
          ${pointsSql}
        )
        SELECT
          r.id,
          r.name,
          r.lat,
          r.lng,
          COALESCE(r.city->>'name', r.area_name, r.region) AS city,
          lower(COALESCE(r.distinction->>'slug', '')) AS distinction_slug,
          COALESCE(r.price_category->>'slug', r.price_category->>'code') AS budget_slug,
          r.cuisines,
          r.distinction_score,
          COALESCE(r.image, r.main_image, '') AS image_url,
          CASE WHEN EXISTS (SELECT 1 FROM route_points)
            THEN (
              SELECT MIN(
                111.111 * DEGREES(ACOS(LEAST(1.0,
                  COS(RADIANS(r.lat)) * COS(RADIANS(p.lat)) * COS(RADIANS(r.lng - p.lng))
                  + SIN(RADIANS(r.lat)) * SIN(RADIANS(p.lat))
                )))
              )
              FROM route_points p
            )
            ELSE NULL
          END AS distance_km,
          COALESCE(r.distinction_score, 0) * 10
            + CASE WHEN lower(COALESCE(r.distinction->>'slug', '')) = '3-stars-michelin' THEN 30 ELSE 0 END
            + CASE WHEN lower(COALESCE(r.distinction->>'slug', '')) = '2-stars-michelin' THEN 20 ELSE 0 END
            + CASE WHEN lower(COALESCE(r.distinction->>'slug', '')) = '1-star-michelin' THEN 10 ELSE 0 END
            + CASE WHEN r.green_star = true THEN 5 ELSE 0 END
          AS score
        FROM restaurants r
        WHERE ${where.join(' AND ')}
        AND (
          NOT EXISTS (SELECT 1 FROM route_points)
          OR (
            SELECT MIN(
              111.111 * DEGREES(ACOS(LEAST(1.0,
                COS(RADIANS(r.lat)) * COS(RADIANS(p.lat)) * COS(RADIANS(r.lng - p.lng))
                + SIN(RADIANS(r.lat)) * SIN(RADIANS(p.lat))
              )))
            )
            FROM route_points p
          ) <= $${params.length - 1}
        )
        ORDER BY ${orderBy}
        LIMIT $${params.length};
      `;

      const result = await pool.query(sql, params);
      return result.rows as Array<Record<string, unknown>>;
    };

    let restaurantRows = await runRestaurantQuery(true);
    if (!restaurantRows.length && cuisineNeedles.length) {
      restaurantRows = await runRestaurantQuery(false);
    }

    restaurantRows.forEach((row: Record<string, unknown>) => {
      candidates.push({
        category: 'restaurant',
        id: Number(row.id),
        name: String(row.name || ''),
        lat: Number(row.lat),
        lng: Number(row.lng),
        city: row.city ? String(row.city) : null,
        distinction_slug: row.distinction_slug ? String(row.distinction_slug) : null,
        budget_symbol: priceSymbolFromSlug(row.budget_slug ? String(row.budget_slug) : null),
        cuisines: extractCuisineLabels(row.cuisines),
        image: row.image_url ? String(row.image_url) : null,
        score: Number(row.score || 0),
      });
    });
  }

  if (categories.has('hotel')) {
    const params: unknown[] = [...pointsParams];
    const where: string[] = [
      'h.lat IS NOT NULL',
      'h.lng IS NOT NULL',
      "(h.status IS NULL OR lower(h.status) <> 'closed')",
    ];

    if (distinctionSlugs.length) {
      params.push(distinctionSlugs);
      where.push(`lower(COALESCE(h.distinction->>'slug', '')) = ANY($${params.length}::text[])`);
    }

    params.push(radius);
    params.push(limit);

    const sql = `
      WITH route_points(lat, lng) AS (
        ${pointsSql}
      )
      SELECT
        h.id,
        h.name,
        h.lat,
        h.lng,
        COALESCE(h.city->>'name', h.neighborhood, h.state_province) AS city,
        lower(COALESCE(h.distinction->>'slug', '')) AS distinction_slug,
        h.distinction_score,
        COALESCE(h.main_image, '') AS image_url,
        CASE WHEN EXISTS (SELECT 1 FROM route_points)
          THEN (
            SELECT MIN(
              111.111 * DEGREES(ACOS(LEAST(1.0,
                COS(RADIANS(h.lat)) * COS(RADIANS(p.lat)) * COS(RADIANS(h.lng - p.lng))
                + SIN(RADIANS(h.lat)) * SIN(RADIANS(p.lat))
              )))
            )
            FROM route_points p
          )
          ELSE NULL
        END AS distance_km,
        COALESCE(h.distinction_score, 0) * 10
          + CASE WHEN lower(COALESCE(h.distinction->>'slug', '')) = 'selected' THEN 5 ELSE 0 END
        AS score
      FROM hotels h
      WHERE ${where.join(' AND ')}
      AND (
        NOT EXISTS (SELECT 1 FROM route_points)
        OR (
          SELECT MIN(
            111.111 * DEGREES(ACOS(LEAST(1.0,
              COS(RADIANS(h.lat)) * COS(RADIANS(p.lat)) * COS(RADIANS(h.lng - p.lng))
              + SIN(RADIANS(h.lat)) * SIN(RADIANS(p.lat))
            )))
          )
          FROM route_points p
        ) <= $${params.length - 1}
      )
      ORDER BY ${orderBy}
      LIMIT $${params.length};
    `;

    const result = await pool.query(sql, params);
    result.rows.forEach((row: Record<string, unknown>) => {
      candidates.push({
        category: 'hotel',
        id: Number(row.id),
        name: String(row.name || ''),
        lat: Number(row.lat),
        lng: Number(row.lng),
        city: row.city ? String(row.city) : null,
        distinction_slug: row.distinction_slug ? String(row.distinction_slug) : null,
        budget_symbol: null,
        cuisines: [],
        image: row.image_url ? String(row.image_url) : null,
        score: Number(row.score || 0),
      });
    });
  }

  return candidates;
}
