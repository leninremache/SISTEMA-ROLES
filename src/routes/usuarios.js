const express = require('express');
const router  = express.Router();
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /usuarios
router.get('/', authenticate, authorize('Administrador','Bibliotecario'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, email, rol, telefono, created_at FROM usuarios ORDER BY id ASC');
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /usuarios
router.post('/', authenticate, authorize('Administrador','Bibliotecario'), async (req, res) => {
  const { nombre, email, password, rol, telefono } = req.body;
  if (!nombre || !email || !password) return res.status(400).json({ ok: false, message: 'Nombre, email y contraseña son obligatorios.' });
  // Bibliotecario solo puede crear Lectores
  if (req.user.rol === 'Bibliotecario' && rol !== 'Lector') {
    return res.status(403).json({ ok: false, message: 'El Bibliotecario solo puede crear usuarios con rol Lector.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol, telefono) VALUES ($1,$2,$3,$4,$5) RETURNING id, nombre, email, rol, telefono',
      [nombre, email, password, rol || 'Lector', telefono || null]
    );
    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ ok: false, message: 'El email ya está registrado.' });
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /usuarios/:id
router.put('/:id', authenticate, authorize('Administrador','Bibliotecario'), async (req, res) => {
  const { id } = req.params;
  const { nombre, email, password, rol, telefono } = req.body;
  try {
    let query, params;
    if (password) {
      query = 'UPDATE usuarios SET nombre=$1, email=$2, password=$3, rol=$4, telefono=$5 WHERE id=$6 RETURNING id, nombre, email, rol, telefono';
      params = [nombre, email, password, rol || 'Lector', telefono || null, id];
    } else {
      query = 'UPDATE usuarios SET nombre=$1, email=$2, rol=$3, telefono=$4 WHERE id=$5 RETURNING id, nombre, email, rol, telefono';
      params = [nombre, email, rol || 'Lector', telefono || null, id];
    }
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /usuarios/:id — solo Administrador
router.delete('/:id', authenticate, authorize('Administrador'), async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ ok: false, message: 'No puedes eliminar tu propio usuario.' });
  }
  try {
    await pool.query('DELETE FROM usuarios WHERE id=$1', [id]);
    res.json({ ok: true, message: 'Usuario eliminado.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /usuarios/login — público
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ ok: false, message: 'Email y contraseña requeridos.' });
  try {
    const result = await pool.query('SELECT id, nombre, email, rol, telefono FROM usuarios WHERE email=$1 AND password=$2', [email, password]);
    if (result.rows.length === 0) return res.status(401).json({ ok: false, message: 'Credenciales incorrectas.' });
    const user = result.rows[0];
    res.json({ ok: true, token: `token-${user.id}-${Date.now()}`, usuario: user });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
