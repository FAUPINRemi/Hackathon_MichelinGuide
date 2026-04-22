import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const FILTER_SQL = {
  '3-stars':  "distinction_score = 5",
  '2-stars':  "distinction_score = 4",
  '1-star':   "distinction_score = 3",
  'bib':      "(distinction->>'slug' = 'bib-gourmand')",
  'green':    "green_star = true",
};

// Haversine distance expression (km) — params $1=lat, $2=lng
const DIST = `(6371 * acos(LEAST(1.0,
  cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2))
  + sin(radians($1)) * sin(radians(lat))
)))`;

function format(r) {
  const score = r.distinction_score ?? 0;
  const stars = score >= 3 ? score - 2 : 0;
  const bib   = r.distinction?.slug === 'bib-gourmand';

  const cuisineObj = Array.isArray(r.cuisines) ? r.cuisines[0] : null;
  const cuisine = cuisineObj?.label ?? cuisineObj ?? '';

  const priceSymbols = ['', '€', '€€', '€€€', '€€€€'];
  function priceFromCategory(cat) {
    if (!cat) return '€€';
    const slug = (cat.slug || cat.code || cat).toString();
    if (slug.includes('P04') || slug === 'luxury')      return '€€€€';
    if (slug.includes('P03') || slug === 'expensive')   return '€€€';
    if (slug.includes('P02') || slug === 'moderate')    return '€€';
    if (slug.includes('P01') || slug === 'inexpensive') return '€';
    return '€€';
  }

  return {
    id:               r.identifier ?? String(r.id),
    name:             r.name ?? '',
    cuisine:          String(cuisine),
    address:          r.street ?? '',
    location:         r.city?.name ?? '',
    price:            priceFromCategory(r.price_category),
    stars:            Math.min(stars, 3),
    bib,
    green_star:       r.green_star ?? false,
    distinction_slug: r.distinction?.slug ?? null,
    likes:            0,
    phone:            r.phone ?? '',
    website:          r.website ?? '',
    description:      (r.main_desc ?? '').replace(/<[^>]+>/g, ''),
    img:              r.image ?? r.main_image ?? '',
    lat:              r.lat,
    lng:              r.lng,
    distinction_score: score,
  };
}

router.get('/', async (req, res) => {
  try {
    const {
      search = '', filter = '', page = '1', limit = '24',
      lat, lng, radius = '50',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(300, Math.max(1, parseInt(limit, 10)));
    const offset   = (pageNum - 1) * limitNum;

    const useGeo = lat != null && lat !== '' && lng != null && lng !== '';

    let countSql, dataSql, params;

    if (useGeo) {
      const latN    = parseFloat(lat);
      const lngN    = parseFloat(lng);
      const radiusN = Math.min(200, parseFloat(radius) || 50);

      // $1=lat, $2=lng, $3=radius — extra conditions start at $4
      params = [latN, lngN, radiusN];

      const innerConds = ['lat IS NOT NULL', 'lng IS NOT NULL'];

      if (search) {
        params.push(`%${search}%`);
        const p = params.length;
        innerConds.push(
          `(name ILIKE $${p} OR cuisines::text ILIKE $${p} OR city->>'name' ILIKE $${p})`
        );
      }
      if (FILTER_SQL[filter]) innerConds.push(FILTER_SQL[filter]);

      const innerWhere = `WHERE ${innerConds.join(' AND ')}`;
      const sub  = `SELECT *, ${DIST} AS distance_km FROM restaurants ${innerWhere}`;
      const outer = `SELECT * FROM (${sub}) t WHERE distance_km < $3`;

      countSql = `SELECT COUNT(*) FROM (${outer}) c`;
      dataSql  = `${outer} ORDER BY distance_km ASC
                  LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    } else {
      params = [];
      const conditions = [];

      if (search) {
        params.push(`%${search}%`);
        const p = params.length;
        conditions.push(
          `(name ILIKE $${p} OR cuisines::text ILIKE $${p} OR city->>'name' ILIKE $${p})`
        );
      }
      if (FILTER_SQL[filter]) conditions.push(FILTER_SQL[filter]);

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      countSql = `SELECT COUNT(*) FROM restaurants ${where}`;
      dataSql  = `SELECT * FROM restaurants ${where}
                  ORDER BY distinction_score DESC NULLS LAST, name ASC
                  LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    }

    const [countRes, dataRes] = await Promise.all([
      pool.query(countSql, params),
      pool.query(dataSql, [...params, limitNum, offset]),
    ]);

    res.json({
      data:  dataRes.rows.map(format),
      total: parseInt(countRes.rows[0].count, 10),
      page:  pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM restaurants WHERE identifier = $1 LIMIT 1',
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(format(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
