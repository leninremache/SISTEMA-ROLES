require('dotenv').config();

const express = require('express');
const { connectDB } = require('./config/database');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares básicos ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas ────────────────────────────────────────────────────────────────────
const librosRouter    = require('./routes/libros');
const autoresRouter   = require('./routes/autores');
const prestamosRouter = require('./routes/prestamos');
const usuariosRouter  = require('./routes/usuarios');

app.use('/libros',    librosRouter);
app.use('/autores',   autoresRouter);
app.use('/prestamos', prestamosRouter);
app.use('/usuarios',  usuariosRouter);

// ── Ruta de salud (health-check) ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API Sistema Biblioteca - Servidor en línea',
    rutas: ['/libros', '/autores', '/prestamos', '/usuarios'],
    timestamp: new Date().toISOString(),
  });
});

// ── Arranque del servidor ─────────────────────────────────────────────────────
const startServer = async () => {
  try {
    // 1. Verificar conexión a la base de datos
    await connectDB();
    console.log('✅ [SUCCESS] Conexión a la Base de Datos establecida correctamente.');

    // 2. Levantar el servidor HTTP
    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════════════╗');
      console.log('║        SISTEMA DE GESTIÓN DE BIBLIOTECA              ║');
      console.log('╠══════════════════════════════════════════════════════╣');
      console.log(`║  ✅ [SUCCESS] Servidor corriendo en el puerto ${PORT}    ║`);
      console.log('║  ✅ [SUCCESS] Conectado a la Base de Datos           ║');
      console.log('║                                                      ║');
      console.log('║  Roles disponibles:                                  ║');
      console.log('║    👤 Administrador   👤 Catalogador                 ║');
      console.log('║    👤 Bibliotecario   👤 Lector/Estudiante           ║');
      console.log('╚══════════════════════════════════════════════════════╝');
      console.log('');
    });

  } catch (error) {
    console.error('');
    console.error('❌ [ERROR] No se pudo iniciar el servidor.');
    console.error('   Detalle:', error.message);
    console.error('   → Verifica las credenciales en el archivo .env');
    console.error('');
    process.exit(1);
  }
};

startServer();
