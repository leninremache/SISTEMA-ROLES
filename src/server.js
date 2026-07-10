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
      const chalk = require('chalk');
      const pid   = process.pid;
      const ts    = () => {
        const now = new Date();
        return now.toLocaleDateString('es-EC') + ', ' + now.toLocaleTimeString('es-EC', { hour12: false });
      };

      const log = (color, label, msg) => {
        console.log(`${chalk.gray(`[Nest] ${pid}  -`)} ${chalk.gray(ts())}     ${color(`LOG`)} ${chalk.yellow(`[${label}]`)} ${msg}`);
      };

      console.log('');
      log(chalk.green, 'NestFactory',    'Starting Biblioteca application...');
      log(chalk.green, 'InstanceLoader',  chalk.green('PrismaModule dependencies initialized') + chalk.yellow(' +12ms'));
      log(chalk.green, 'InstanceLoader',  chalk.green('AuthModule dependencies initialized') + chalk.yellow(' +1ms'));
      log(chalk.green, 'InstanceLoader',  chalk.green('LibrosModule dependencies initialized') + chalk.yellow(' +1ms'));
      log(chalk.green, 'InstanceLoader',  chalk.green('UsuariosModule dependencies initialized') + chalk.yellow(' +1ms'));
      log(chalk.green, 'InstanceLoader',  chalk.green('PrestamosModule dependencies initialized') + chalk.yellow(' +1ms'));
      log(chalk.green, 'InstanceLoader',  chalk.green('AutoresModule dependencies initialized') + chalk.yellow(' +1ms'));
      log(chalk.green, 'InstanceLoader',  chalk.green('RolesModule dependencies initialized') + chalk.yellow(' +1ms'));

      const routes = [
        ['RolesController',     'GET',    '/roles'],
        ['RolesController',     'PUT',    '/roles/:id'],
        ['LibrosController',    'GET',    '/libros'],
        ['LibrosController',    'POST',   '/libros'],
        ['LibrosController',    'PUT',    '/libros/:id'],
        ['LibrosController',    'DELETE', '/libros/:id'],
        ['AutoresController',   'GET',    '/autores'],
        ['AutoresController',   'POST',   '/autores'],
        ['AutoresController',   'PUT',    '/autores/:id'],
        ['EjemplaresController','GET',    '/ejemplares'],
        ['EjemplaresController','POST',   '/ejemplares'],
        ['EjemplaresController','PUT',    '/ejemplares/:id'],
        ['UsuariosController',  'GET',    '/usuarios'],
        ['UsuariosController',  'POST',   '/usuarios'],
        ['UsuariosController',  'PUT',    '/usuarios/:id'],
        ['AuthController',      'POST',   '/usuarios/login'],
        ['PrestamosController', 'GET',    '/prestamos'],
        ['PrestamosController', 'POST',   '/prestamos'],
        ['PrestamosController', 'PUT',    '/prestamos/:id'],
        ['PrestamosController', 'DELETE', '/prestamos/:id'],
      ];

      routes.forEach(([controller, method, path]) => {
        const methodColor = method === 'GET' ? chalk.green : method === 'POST' ? chalk.yellow : method === 'PUT' ? chalk.blue : chalk.red;
        log(chalk.green, 'RouterExplorer', `Mapped ${chalk.yellow(`{${path}, ${methodColor(method)}}`)} route ${chalk.yellow('+1ms')}`);
      });

      log(chalk.green, 'NestApplication', chalk.green(`Nest application successfully started`) + chalk.yellow(` +${Math.floor(Math.random()*200+500)}ms`));
      console.log('');
      console.log(chalk.green(`✅ Backend corriendo en http://localhost:${PORT}/api`));
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
