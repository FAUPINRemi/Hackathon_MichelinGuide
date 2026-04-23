import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

const FILTER_SQL: Record<string, string> = {
  '3-stars': "distinction_score = 5",
  '2-stars': "distinction_score = 4",
  '1-star': "distinction_score = 3",
  bib: "(distinction->>'slug' = 'bib-gourmand')",
  green: 'green_star = true',
};

function format(r: Record<string, unknown>) {
  const score = Number(r.distinction_score ?? 0);
  const stars = score >= 3 ? score - 2 : 0;
  const distinction = (r.distinction || {}) as Record<string, unknown>;
  const cuisineArray = Array.isArray(r.cuisines) ? r.cuisines : [];
  const firstCuisine = cuisineArray[0];
  const cuisine = typeof firstCuisine === 'object' && firstCuisine !== null
    ? String((firstCuisine as Record<string, unknown>).label || '')
    : String(firstCuisine || '');
  const priceCategory = (r.price_category || {}) as Record<string, unknown>;
  const slug = String(priceCategory.slug || priceCategory.code || '');
  const price = slug.includes('P04') || slug === 'luxury' ? '€€€€'
    : slug.includes('P03') || slug === 'expensive' ? '€€€'
    : slug.includes('P02') || slug === 'moderate' ? '€€'
    : '€';

  return {
    id: String(r.identifier ?? r.id ?? ''),
    name: String(r.name ?? ''),
    cuisine,
    address: String(r.street ?? ''),
    location: String(((r.city as Record<string, unknown>)?.name ?? '')),
    price,
    stars: Math.min(stars, 3),
    bib: distinction.slug === 'bib-gourmand',
    green_star: Boolean(r.green_star),
    likes: 0,
    phone: String(r.phone ?? ''),
    website: String(r.website ?? ''),
    description: String(r.main_desc ?? '').replace(/<[^>]+>/g, ''),
    img: String(r.image ?? r.main_image ?? ''),
    lat: Number(r.lat ?? 0),
    lng: Number(r.lng ?? 0),
    distinction_score: score,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const { search = '', filter = '', page = '1', limit = '24' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const params: unknown[] = [];
    const where: string[] = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(`(name ILIKE $${params.length} OR cuisines::text ILIKE $${params.length})`);
    }
    if (FILTER_SQL[filter]) where.push(FILTER_SQL[filter]);

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM restaurants ${whereSql}`, params),
      pool.query(
        `SELECT * FROM restaurants ${whereSql}
         ORDER BY distinction_score DESC NULLS LAST, name ASC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limitNum, offset],
      ),
    ]);

    res.json({
      data: dataRes.rows.map(format),
      total: parseInt(countRes.rows[0].count, 10),
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM restaurants WHERE identifier = $1 LIMIT 1', [req.params.id]);
    if (!result.rows.length) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(format(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

export default router;
