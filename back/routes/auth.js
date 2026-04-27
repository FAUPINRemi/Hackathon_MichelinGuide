import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  const { mail, password } = req.body
  if (!mail || !password) return res.status(400).json({ error: 'Champs manquants.' })

  try {
    const { rows } = await pool.query(
      'SELECT id, name, mail FROM clients WHERE mail = $1 AND password = $2',
      [mail, password]
    )
    if (rows.length === 0) return res.status(401).json({ error: 'Identifiants incorrects.' })
    res.json({ user: rows[0] })
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' })
  }
})

export default router
