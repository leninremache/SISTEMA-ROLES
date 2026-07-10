const express = require('express');
const router  = express.Router();
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /autores — cualquier usuario autenticado puede ver
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM autores ORDER BY nombre ASC');
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /autores — Catalogador, Bibliotecario, Profesor, Administrador
router.post('/', authenticate, authorize('Catalogador','Bibliotecario','Profesor','Administrador'), async (req, res) => {
  const { nombre, fecha_nacimiento, nacionalidad, biografia } = req.body;
  if (!nombre) return res.status(400).json({ ok: false, message: 'El nombre es obligatorio.' });
  try {
    const result = await pool.query(
      'INSERT INTO autores (nombre, fecha_nacimiento, nacionalidad, biografia) VALUES ($1,$2,$3,$4) RETURNING *',
      [nombre, fecha_nacimiento || null, nacionalidad || null, biografia || null]
    );
    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /autores/:id
router.put('/:id', authenticate, authorize('Catalogador','Bibliotecario','Profesor','Administrador'), async (req, res) => {
  const { id } = req.params;
  const { nombre, fecha_nacimiento, nacionalidad, biografia } = req.body;
  if (!nombre) return res.status(400).json({ ok: false, message: 'El nombre es obligatorio.' });
  try {
    const result = await pool.query(
      'UPDATE autores SET nombre=$1, fecha_nacimiento=$2, nacionalidad=$3, biografia=$4 WHERE id=$5 RETURNING *',
      [nombre, fecha_nacimiento || null, nacionalidad || null, biografia || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ ok: false, message: 'Autor no encontrado.' });
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /autores/:id — solo Administrador
router.delete('/:id', authenticate, authorize('Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM autores WHERE id=$1', [id]);
    res.json({ ok: true, message: 'Autor eliminado.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
