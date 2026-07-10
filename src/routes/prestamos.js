const express = require('express');
const router  = require('express').Router();
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /prestamos
router.get('/', authenticate, authorize('Administrador','Bibliotecario','Catalogador'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.id_usuario, p.id_ejemplar, p.fecha_salida, p.fecha_devolucion,
             p.fecha_devolucion_esperada, p.estado, p.tipo_documento, p.numero_documento, p.multa,
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

// POST /prestamos — solo Bibliotecario y Administrador
router.post('/', authenticate, authorize('Bibliotecario', 'Administrador'), async (req, res) => {
  const { usuario_id, ejemplar_id, tipo_documento, numero_documento } = req.body;
  if (!usuario_id || !ejemplar_id) return res.status(400).json({ ok: false, message: 'Usuario y ejemplar son obligatorios.' });
  if (!tipo_documento || !numero_documento) return res.status(400).json({ ok: false, message: 'El tipo y número de documento son obligatorios.' });
  try {
    const prestamosActivos = await pool.query("SELECT COUNT(*) FROM prestamos WHERE id_usuario=$1 AND estado='Activo'", [usuario_id]);
    if (parseInt(prestamosActivos.rows[0].count) >= 3) {
      return res.status(400).json({ ok: false, message: 'El usuario ya tiene 3 préstamos activos. No puede tener más de 3.' });
    }
    const ejemplar = await pool.query("SELECT estado FROM ejemplares WHERE id=$1", [ejemplar_id]);
    if (ejemplar.rows.length === 0) return res.status(404).json({ ok: false, message: 'El ejemplar no existe.' });
    if (ejemplar.rows[0].estado !== 'Disponible') return res.status(400).json({ ok: false, message: `El ejemplar no está disponible. Estado: ${ejemplar.rows[0].estado}` });

    const fechaDev = new Date();
    fechaDev.setDate(fechaDev.getDate() + 10);
    const fechaStr = fechaDev.toISOString().slice(0, 10);

    const result = await pool.query(
      `INSERT INTO prestamos (id_usuario, id_ejemplar, fecha_salida, fecha_devolucion_esperada, estado, tipo_documento, numero_documento)
       VALUES ($1,$2,CURRENT_DATE,$3,'Activo',$4,$5) RETURNING *`,
      [usuario_id, ejemplar_id, fechaStr, tipo_documento, numero_documento]
    );
    await pool.query("UPDATE ejemplares SET estado='Prestado' WHERE id=$1", [ejemplar_id]);
    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /prestamos/:id
router.put('/:id', authenticate, authorize('Bibliotecario', 'Administrador'), async (req, res) => {
  const { id } = req.params;
  const { estado, fecha_devolucion } = req.body;
  const estadoNorm = estado ? estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase() : 'Activo';
  try {
    const prestamo = await pool.query('SELECT * FROM prestamos WHERE id=$1', [id]);
    if (prestamo.rows.length === 0) return res.status(404).json({ ok: false, message: 'Préstamo no encontrado.' });
    const p = prestamo.rows[0];

    let multa = p.multa || 0;
    if (estadoNorm === 'Devuelto' && fecha_devolucion && p.fecha_devolucion_esperada) {
      const fechaEsperada = new Date(p.fecha_devolucion_esperada);
      const fechaReal     = new Date(fecha_devolucion);
      const diasRetraso   = Math.max(0, Math.floor((fechaReal - fechaEsperada) / (1000 * 60 * 60 * 24)));

      if (diasRetraso > 0) {
        const usuarioRes = await pool.query('SELECT rol FROM usuarios WHERE id=$1', [p.id_usuario]);
        const rolUsuario = usuarioRes.rows[0]?.rol || '';
        const multaBase  = diasRetraso * 0.50;
        const descuento  = rolUsuario === 'Lector' ? 0.50 : 0; // 50% descuento estudiantes
        multa = multaBase * (1 - descuento);
        await pool.query("UPDATE ejemplares SET estado='Disponible' WHERE id=$1", [p.id_ejemplar]);
        await pool.query("INSERT INTO multas (id_prestamo, monto, estado) VALUES ($1,$2,'Pendiente')", [id, multa]);
      } else {
        await pool.query("UPDATE ejemplares SET estado='Disponible' WHERE id=$1", [p.id_ejemplar]);
      }
    }

    const result = await pool.query(
      'UPDATE prestamos SET estado=$1, fecha_devolucion=$2, multa=$3 WHERE id=$4 RETURNING *',
      [estadoNorm, fecha_devolucion || null, multa, id]
    );
    res.json({ ok: true, data: result.rows[0], multa_generada: multa });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /prestamos/:id
router.delete('/:id', authenticate, authorize('Bibliotecario', 'Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    const p = await pool.query('SELECT id_ejemplar, estado FROM prestamos WHERE id=$1', [id]);
    if (p.rows.length > 0 && p.rows[0].estado === 'Activo') {
      await pool.query("UPDATE ejemplares SET estado='Disponible' WHERE id=$1", [p.rows[0].id_ejemplar]);
    }
    await pool.query('DELETE FROM prestamos WHERE id=$1', [id]);
    res.json({ ok: true, message: 'Préstamo eliminado.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
