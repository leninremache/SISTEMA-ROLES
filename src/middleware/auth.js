/**
 * Middleware RBAC — Role-Based Access Control
 * Verifica que el token sea válido y que el usuario tenga el rol requerido.
 */

const { pool } = require('../config/database');

// Extraer usuario del token y adjuntarlo a req.user
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Token requerido.' });
  }
  const token = authHeader.split(' ')[1];
  // Token formato: "token-{id}-{timestamp}"
  const parts = token.split('-');
  const userId = parts[1];
  if (!userId || isNaN(userId)) {
    return res.status(401).json({ ok: false, message: 'Token inválido.' });
  }
  try {
    const result = await pool.query('SELECT id, nombre, email, rol FROM usuarios WHERE id=$1', [userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    req.user = result.rows[0];
    next();
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Verificar que el usuario tenga uno de los roles permitidos
const authorize = (...rolesPermitidos) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, message: 'No autenticado.' });
  }
  if (!rolesPermitidos.includes(req.user.rol)) {
    return res.status(403).json({
      ok: false,
      message: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}. Tu rol es: ${req.user.rol}`
    });
  }
  next();
};

module.exports = { authenticate, authorize };
