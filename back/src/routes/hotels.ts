import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

function format(h: Record<string, unknown>) {
  return {
    id: String(h.hotel_id ?? h.id ?? ''),
    name: String(h.name ?? ''),
    address: String(h.address ?? ''),
    location: String(((h.city as Record<string, unknown>)?.name ?? '')),
    description: String(h.content ?? ''),
    img: String(h.main_image ?? ''),
    lat: Number(h.lat ?? 0),
    lng: Number(h.lng ?? 0),
    phone: String(h.phone ?? ''),
    website: String(h.url ?? ''),
    michelin_guide_url: String(h.michelin_guide_url ?? ''),
    distinction: h.distinction,
    distinction_score: Number(h.distinction_score ?? 0),
    sustainableHotel: Boolean(h.sustainable_hotel),
    isPlus: Boolean(h.is_plus),
    newToSelection: Boolean(h.new_to_selection),
    bookable: Boolean(h.bookable),
  };
}

router.get('/', async (req, res, next) => {
  try {
    const { search = '', page = '1', limit = '24' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const params: unknown[] = [];
    let whereSql = '';
    if (search) {
      params.push(`%${search}%`);
      whereSql = `WHERE name ILIKE $1 OR (city->>'name') ILIKE $1`;
    }

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM hotels ${whereSql}`, params),
      pool.query(
        `SELECT * FROM hotels ${whereSql}
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
    const id = parseInt(req.params.id, 10) || 0;
    const result = await pool.query('SELECT * FROM hotels WHERE hotel_id = $1 OR id = $1 LIMIT 1', [id]);
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
