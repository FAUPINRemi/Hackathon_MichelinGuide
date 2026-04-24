import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { mail, password } = req.body as { mail?: string; password?: string };
  if (!mail || !password) {
    res.status(400).json({ error: 'Champs manquants.' });
    return;
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, name, mail FROM clients WHERE mail = $1 AND password = $2',
      [mail, password]
    );
    if (rows.length === 0) {
      res.status(401).json({ error: 'Identifiants incorrects.' });
      return;
    }
    res.json({ user: rows[0] });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
