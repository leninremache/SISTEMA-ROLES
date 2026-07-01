const { Pool } = require('pg');

// Railway provee DATABASE_URL automáticamente al conectar un PostgreSQL.
// Si no existe, usa las variables individuales del .env (desarrollo local).
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host:     process.env.DB_HOST,
      port:     process.env.DB_PORT,
      database: process.env.DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

/**
 * Prueba la conexión a la base de datos.
 * Lanza un error si no puede conectarse.
 */
const connectDB = async () => {
  const client = await pool.connect();
  client.release();
};

module.exports = { pool, connectDB };
