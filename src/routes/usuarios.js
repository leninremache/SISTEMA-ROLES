const express = require('express');
const router  = express.Router();
const { pool } = require('../config/database');

// GET /usuarios — lista todos los usuarios
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, email, rol FROM usuarios ORDER BY id ASC');
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
