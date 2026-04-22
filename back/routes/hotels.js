import { Router } from 'express';
import pool from '../db.js';

const router = Router();

function format(h) {
  const score = h.distinction_score ?? 0;
  return {
    id:               h.hotel_id ? String(h.hotel_id) : String(h.id),
    name:             h.name ?? '',
    address:          h.address ?? '',
    location:         h.city?.name ?? '',
    description:      h.content ?? '',
    img:              h.main_image ?? '',
    lat:              h.lat,
    lng:              h.lng,
    phone:            h.phone ?? '',
    website:          h.url ?? '',
    michelin_guide_url: h.michelin_guide_url ?? '',
    checkIn:          h.check_in_time,
    checkOut:         h.check_out_time,
    numRooms:         h.num_rooms,
    numReviews:       h.num_reviews,
    lovedCount:       h.loved_count ?? 0,
    isPlus:           h.is_plus ?? false,
    newToSelection:   h.new_to_selection ?? false,
    sustainableHotel: h.sustainable_hotel ?? false,
    bookable:         h.bookable ?? false,
    distinction:      h.distinction,
    distinction_score: score,
    criteria:         h.criteria ?? [],
    hotelAmenities:   h.hotel_amenities ?? [],
  };
}

router.get('/', async (req, res) => {
  try {
    const { search = '', page = '1', limit = '24' } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset   = (pageNum - 1) * limitNum;

    const params = [];
    let where = '';

    if (search) {
      params.push(`%${search}%`);
      where = `WHERE name ILIKE $1 OR (city->>'name') ILIKE $1`;
    }

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM hotels ${where}`, params),
      pool.query(
        `SELECT * FROM hotels ${where}
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
      'SELECT * FROM hotels WHERE hotel_id = $1 OR id = $1 LIMIT 1',
      [parseInt(id, 10) || 0]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(format(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
