require('dotenv').config();

const express = require('express');
const { connectDB } = require('./config/database');
const initDB       = require('./config/initDB');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares básicos ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Rutas ────────────────────────────────────────────────────────────────────
const librosRouter     = require('./routes/libros');
const autoresRouter    = require('./routes/autores');
const prestamosRouter  = require('./routes/prestamos');
const usuariosRouter   = require('./routes/usuarios');
const ejemplaresRouter = require('./routes/ejemplares');
const rolesRouter      = require('./routes/roles');

app.use('/libros',     librosRouter);
app.use('/autores',    autoresRouter);
app.use('/prestamos',  prestamosRouter);
app.use('/usuarios',   usuariosRouter);
app.use('/ejemplares', ejemplaresRouter);
app.use('/roles',      rolesRouter);

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

    // 2. Inicializar tablas automáticamente
    await initDB();

    // 2. Levantar el servidor HTTP
    app.listen(PORT, () => {
      const ts = () => new Date().toLocaleString('es-EC', { hour12: false });
      console.log('');
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║           SISTEMA DE GESTIÓN DE BIBLIOTECA                  ║');
      console.log('╠══════════════════════════════════════════════════════════════╣');
      console.log(`║  ✅ [SUCCESS] Servidor corriendo en el puerto ${PORT}            ║`);
      console.log('║  ✅ [SUCCESS] Conectado a la Base de Datos (PostgreSQL)      ║');
      console.log('║  ✅ [SUCCESS] Prisma Client inicializado                     ║');
      console.log('╠══════════════════════════════════════════════════════════════╣');
      console.log('║  📋 RUTAS REGISTRADAS (RBAC):                                ║');
      console.log('╠══════════════════════════════════════════════════════════════╣');

      const routes = [
        ['GET',    '/'],
        ['GET',    '/roles'],
        ['PUT',    '/roles/:id'],
        ['GET',    '/libros'],
        ['POST',   '/libros           → Bibliotecario, Administrador'],
        ['PUT',    '/libros/:id       → Bibliotecario, Catalogador, Admin'],
        ['DELETE', '/libros/:id       → Administrador'],
        ['GET',    '/autores'],
        ['POST',   '/autores          → Bibliotecario, Catalogador, Admin'],
        ['GET',    '/ejemplares'],
        ['POST',   '/ejemplares       → Bibliotecario, Catalogador, Admin'],
        ['GET',    '/usuarios         → Administrador, Bibliotecario'],
        ['POST',   '/usuarios/login'],
        ['POST',   '/usuarios         → Administrador, Bibliotecario'],
        ['GET',    '/prestamos        → Admin, Bibliotecario, Catalogador'],
        ['POST',   '/prestamos        → Bibliotecario, Administrador'],
        ['PUT',    '/prestamos/:id    → Bibliotecario, Administrador'],
        ['DELETE', '/prestamos/:id    → Bibliotecario, Administrador'],
      ];

      routes.forEach(([method, path]) => {
        const color = method === 'GET' ? '\x1b[32m' : method === 'POST' ? '\x1b[33m' : method === 'PUT' ? '\x1b[34m' : '\x1b[31m';
        console.log(`  ${color}[${method}]\x1b[0m ${path}`);
      });

      console.log('');
      console.log('╠══════════════════════════════════════════════════════════════╣');
      console.log('║  👤 Roles: Administrador | Bibliotecario | Catalogador       ║');
      console.log('║            Profesor      | Lector                            ║');
      console.log('╚══════════════════════════════════════════════════════════════╝');
      console.log(`\n  🌐 Backend: http://localhost:${PORT}`);
      console.log(`  📅 ${ts()}\n`);
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
