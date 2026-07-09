const express = require('express');
const router  = express.Router();
const { pool } = require('../config/database');

// GET /prestamos — con JOIN para traer nombre de usuario y título del libro
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.id_usuario, p.id_ejemplar, p.fecha_salida, p.fecha_devolucion, p.estado,
             u.nombre AS nombre_usuario, u.email AS email_usuario,
             e.codigo AS codigo_ejemplar, l.titulo AS libro_titulo
      FROM prestamos p
      LEFT JOIN usuarios u ON p.id_usuario = u.id
      LEFT JOIN ejemplares e ON p.id_ejemplar = e.id
      LEFT JOIN libros l ON e.id_libro = l.id
      ORDER BY p.id ASC
    `);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /prestamos
router.post('/', async (req, res) => {
  const { usuario_id, ejemplar_id, fecha_devolucion_esperada } = req.body;
  if (!usuario_id || !ejemplar_id) return res.status(400).json({ ok: false, message: 'Usuario y ejemplar son obligatorios.' });
  try {
    const result = await pool.query(
      'INSERT INTO prestamos (id_usuario, id_ejemplar, fecha_salida, estado) VALUES ($1,$2,CURRENT_DATE,$3) RETURNING *',
      [usuario_id, ejemplar_id, 'Activo']
    );
    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /prestamos/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { estado, fecha_devolucion } = req.body;
  // Normalizar estado con mayúscula inicial
  const estadoNorm = estado ? estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase() : 'Activo';
  try {
    const result = await pool.query(
      'UPDATE prestamos SET estado=$1, fecha_devolucion=$2 WHERE id=$3 RETURNING *',
      [estadoNorm, fecha_devolucion || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ ok: false, message: 'Préstamo no encontrado.' });
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /prestamos/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM prestamos WHERE id=$1', [id]);
    res.json({ ok: true, message: 'Préstamo eliminado.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
