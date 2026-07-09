const express = require('express');
const router  = express.Router();
const { pool } = require('../config/database');

// GET /libros — incluye conteo de ejemplares disponibles
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*,
        COUNT(e.id) FILTER (WHERE e.estado = 'Disponible') AS disponibles,
        COUNT(e.id) AS total_ejemplares
      FROM libros l
      LEFT JOIN ejemplares e ON e.id_libro = l.id
      GROUP BY l.id
      ORDER BY l.id ASC
    `);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /libros
router.post('/', async (req, res) => {
  const { titulo, autor, isbn, genero, anio_publicacion, editorial, cantidad_total } = req.body;
  if (!titulo || !autor) return res.status(400).json({ ok: false, message: 'Título y autor son obligatorios.' });
  try {
    const result = await pool.query(
      'INSERT INTO libros (titulo, autor, isbn, genero, anio_publicacion, editorial, cantidad_total) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [titulo, autor, isbn || null, genero || null, anio_publicacion || null, editorial || null, cantidad_total || 1]
    );
    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /libros/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { titulo, autor, isbn, genero, anio_publicacion, editorial, cantidad_total } = req.body;
  try {
    const result = await pool.query(
      'UPDATE libros SET titulo=$1, autor=$2, isbn=$3, genero=$4, anio_publicacion=$5, editorial=$6, cantidad_total=$7 WHERE id=$8 RETURNING *',
      [titulo, autor, isbn || null, genero || null, anio_publicacion || null, editorial || null, cantidad_total || 1, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ ok: false, message: 'Libro no encontrado.' });
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /libros/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM libros WHERE id=$1', [id]);
    res.json({ ok: true, message: 'Libro eliminado.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
