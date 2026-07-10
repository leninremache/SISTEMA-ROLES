const express = require('express');
const router  = express.Router();
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /libros — todos los roles autenticados pueden ver
router.get('/', authenticate, async (req, res) => {
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

// POST /libros — Bibliotecario, Profesor y Administrador
router.post('/', authenticate, authorize('Bibliotecario', 'Profesor', 'Administrador'), async (req, res) => {
  const {
    titulo, autor_id, autor, isbn, genero, anio_publicacion, editorial,
    edicion, numero_paginas, idioma, clasificacion_dewey, descripcion, cantidad_total
  } = req.body;
  if (!titulo) return res.status(400).json({ ok: false, message: 'El título es obligatorio.' });
  try {
    const result = await pool.query(
      `INSERT INTO libros
        (titulo, autor_id, autor, isbn, genero, anio_publicacion, editorial,
         edicion, numero_paginas, idioma, clasificacion_dewey, descripcion, cantidad_total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        titulo, autor_id || null, autor || null, isbn || null, genero || null,
        anio_publicacion || null, editorial || null, edicion || null,
        numero_paginas || null, idioma || null, clasificacion_dewey || null,
        descripcion || null, cantidad_total || 1
      ]
    );
    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /libros/:id — Bibliotecario, Catalogador, Profesor y Administrador
router.put('/:id', authenticate, authorize('Bibliotecario', 'Catalogador', 'Profesor', 'Administrador'), async (req, res) => {
  const { id } = req.params;
  const {
    titulo, autor_id, autor, isbn, genero, anio_publicacion, editorial,
    edicion, numero_paginas, idioma, clasificacion_dewey, descripcion, cantidad_total
  } = req.body;
  if (!titulo) return res.status(400).json({ ok: false, message: 'El título es obligatorio.' });
  try {
    const result = await pool.query(
      `UPDATE libros SET
        titulo=$1, autor_id=$2, autor=$3, isbn=$4, genero=$5, anio_publicacion=$6, editorial=$7,
        edicion=$8, numero_paginas=$9, idioma=$10, clasificacion_dewey=$11, descripcion=$12, cantidad_total=$13
       WHERE id=$14 RETURNING *`,
      [
        titulo, autor_id || null, autor || null, isbn || null, genero || null,
        anio_publicacion || null, editorial || null, edicion || null,
        numero_paginas || null, idioma || null, clasificacion_dewey || null,
        descripcion || null, cantidad_total || 1, id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ ok: false, message: 'Libro no encontrado.' });
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /libros/:id — solo Administrador
router.delete('/:id', authenticate, authorize('Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM libros WHERE id=$1', [id]);
    res.json({ ok: true, message: 'Libro eliminado.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
