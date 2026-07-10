const express = require('express');
const router  = express.Router();
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /ejemplares — todos los autenticados
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.id, e.codigo, e.estado, e.id_libro, l.titulo AS libro_titulo
      FROM ejemplares e
      LEFT JOIN libros l ON e.id_libro = l.id
      ORDER BY e.id ASC
    `);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /ejemplares — Bibliotecario, Catalogador y Administrador
router.post('/', authenticate, authorize('Bibliotecario', 'Catalogador', 'Administrador'), async (req, res) => {
  const { id_libro, estado, codigo } = req.body;
  if (!id_libro) return res.status(400).json({ ok: false, message: 'El libro es obligatorio.' });
  try {
    const result = await pool.query(
      'INSERT INTO ejemplares (id_libro, estado, codigo) VALUES ($1,$2,$3) RETURNING *',
      [id_libro, estado || 'Disponible', codigo || null]
    );
    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /ejemplares/:id
router.put('/:id', authenticate, authorize('Bibliotecario', 'Catalogador', 'Administrador'), async (req, res) => {
  const { id } = req.params;
  const { estado, codigo } = req.body;
  try {
    const result = await pool.query(
      'UPDATE ejemplares SET estado=$1, codigo=$2 WHERE id=$3 RETURNING *',
      [estado, codigo || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ ok: false, message: 'Ejemplar no encontrado.' });
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /ejemplares/:id — Catalogador y Administrador
router.delete('/:id', authenticate, authorize('Catalogador', 'Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM ejemplares WHERE id=$1', [id]);
    res.json({ ok: true, message: 'Ejemplar eliminado.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
