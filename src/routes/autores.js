const express = require('express');
const router  = express.Router();
const { pool } = require('../config/database');

// GET /autores
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM autores ORDER BY id ASC');
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /autores
router.post('/', async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ ok: false, message: 'El nombre es obligatorio.' });
  try {
    const result = await pool.query('INSERT INTO autores (nombre) VALUES ($1) RETURNING *', [nombre]);
    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
