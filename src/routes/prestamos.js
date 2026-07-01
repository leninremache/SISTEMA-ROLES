const express = require('express');
const router  = express.Router();
const { pool } = require('../config/database');

// GET /prestamos — lista todos los préstamos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prestamos ORDER BY id ASC');
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
