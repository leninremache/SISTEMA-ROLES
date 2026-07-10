const express = require('express');
const router  = express.Router();
const prisma  = require('../config/prismaClient');

// GET /roles — lee desde PostgreSQL via Prisma
router.get('/', async (req, res) => {
  try {
    const roles = await prisma.rol.findMany({ orderBy: { id: 'asc' } });
    res.json({ ok: true, data: roles });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /roles/:id — actualiza permisos de un rol (solo Administrador)
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    descripcion,
    ver_libros, crear_libros, editar_libros, eliminar_libros,
    ver_usuarios, crear_usuarios, editar_usuarios, eliminar_usuarios,
    ver_prestamos, crear_prestamos, editar_prestamos, eliminar_prestamos,
    ver_autores, crear_autores, editar_autores, eliminar_autores,
    descuento_multa, limite_prestamos,
  } = req.body;

  try {
    const rol = await prisma.rol.update({
      where: { id },
      data: {
        descripcion,
        ver_libros, crear_libros, editar_libros, eliminar_libros,
        ver_usuarios, crear_usuarios, editar_usuarios, eliminar_usuarios,
        ver_prestamos, crear_prestamos, editar_prestamos, eliminar_prestamos,
        ver_autores, crear_autores, editar_autores, eliminar_autores,
        descuento_multa: parseFloat(descuento_multa) || 0,
        limite_prestamos: limite_prestamos ? parseInt(limite_prestamos) : null,
      },
    });
    res.json({ ok: true, data: rol });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
