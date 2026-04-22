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

function format(r) {
  const score = r.distinction_score ?? 0;
  // score: 5=3★  4=2★  3=1★  2=Bib  1=Sélection
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
    id:          r.identifier ?? String(r.id),
    name:        r.name ?? '',
    cuisine:     String(cuisine),
    address:     r.street ?? '',
    location:    r.city?.name ?? '',
    price:       priceFromCategory(r.price_category),
    stars:       Math.min(stars, 3),
    bib,
    green_star:  r.green_star ?? false,
    likes:       0,
    phone:       r.phone ?? '',
    website:     r.website ?? '',
    description: (r.main_desc ?? '').replace(/<[^>]+>/g, ''),
    img:         r.image ?? r.main_image ?? '',
    lat:         r.lat,
    lng:         r.lng,
    distinction_score: score,
  };
}

router.get('/', async (req, res) => {
  try {
    const { search = '', filter = '', page = '1', limit = '24' } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset   = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR cuisines::text ILIKE $${params.length})`);
    }
    if (FILTER_SQL[filter]) conditions.push(FILTER_SQL[filter]);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM restaurants ${where}`, params),
      pool.query(
        `SELECT * FROM restaurants ${where}
         ORDER BY distinction_score DESC NULLS LAST, name ASC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limitNum, offset]
      ),
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
