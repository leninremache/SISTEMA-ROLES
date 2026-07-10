const { pool } = require('./database');

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS autores (
      id               SERIAL PRIMARY KEY,
      nombre           VARCHAR(150) NOT NULL,
      fecha_nacimiento DATE,
      nacionalidad     VARCHAR(100),
      biografia        TEXT,
      created_at       TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id     SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS editoriales (
      id     SERIAL PRIMARY KEY,
      nombre VARCHAR(150) NOT NULL,
      pais   VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS libros (
      id                 SERIAL PRIMARY KEY,
      titulo             VARCHAR(255) NOT NULL,
      autor_id           INT REFERENCES autores(id) ON DELETE SET NULL,
      autor              VARCHAR(150),
      isbn               VARCHAR(20),
      genero             VARCHAR(100),
      anio_publicacion   INT,
      editorial          VARCHAR(150),
      edicion            VARCHAR(50),
      numero_paginas     INT,
      idioma             VARCHAR(50),
      clasificacion_dewey VARCHAR(50),
      descripcion        TEXT,
      cantidad_total     INT DEFAULT 1,
      created_at         TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ejemplares (
      id       SERIAL PRIMARY KEY,
      id_libro INT REFERENCES libros(id),
      estado   VARCHAR(50) DEFAULT 'Disponible',
      codigo   VARCHAR(100) UNIQUE
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id         SERIAL PRIMARY KEY,
      nombre     VARCHAR(150) NOT NULL,
      email      VARCHAR(150) UNIQUE NOT NULL,
      password   VARCHAR(255) NOT NULL,
      -- roles validos: Administrador, Catalogador, Bibliotecario, Profesor, Lector
      rol        VARCHAR(50) DEFAULT 'Lector',
      telefono   VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS prestamos (
      id                      SERIAL PRIMARY KEY,
      id_ejemplar             INT REFERENCES ejemplares(id),
      id_usuario              INT REFERENCES usuarios(id),
      fecha_salida            DATE NOT NULL DEFAULT CURRENT_DATE,
      fecha_devolucion        DATE,
      fecha_devolucion_esperada DATE,
      estado                  VARCHAR(50) DEFAULT 'Activo',
      tipo_documento          VARCHAR(50),
      numero_documento        VARCHAR(50),
      multa                   NUMERIC(10,2) DEFAULT 0,
      created_at              TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS multas (
      id          SERIAL PRIMARY KEY,
      id_prestamo INT REFERENCES prestamos(id),
      monto       NUMERIC(10,2) NOT NULL,
      estado      VARCHAR(50) DEFAULT 'Pendiente',
      created_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reservas (
      id         SERIAL PRIMARY KEY,
      id_libro   INT REFERENCES libros(id),
      id_usuario INT REFERENCES usuarios(id),
      fecha      DATE DEFAULT CURRENT_DATE,
      estado     VARCHAR(50) DEFAULT 'Pendiente'
    );

    CREATE TABLE IF NOT EXISTS configuracion (
      id               SERIAL PRIMARY KEY,
      dias_prestamo    INT DEFAULT 15,
      multa_diaria     NUMERIC(10,2) DEFAULT 0.50,
      max_renovaciones INT DEFAULT 2
    );
  `);

  // Agregar columnas que puedan faltar en tablas existentes (idempotente)
  const alteraciones = [
    // autores — nuevos campos
    `ALTER TABLE autores ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE`,
    `ALTER TABLE autores ADD COLUMN IF NOT EXISTS nacionalidad VARCHAR(100)`,
    `ALTER TABLE autores ADD COLUMN IF NOT EXISTS biografia TEXT`,

    // libros — campos existentes
    `ALTER TABLE libros ADD COLUMN IF NOT EXISTS isbn VARCHAR(20)`,
    `ALTER TABLE libros ADD COLUMN IF NOT EXISTS autor VARCHAR(150)`,
    `ALTER TABLE libros ADD COLUMN IF NOT EXISTS genero VARCHAR(100)`,
    `ALTER TABLE libros ADD COLUMN IF NOT EXISTS anio_publicacion INT`,
    `ALTER TABLE libros ADD COLUMN IF NOT EXISTS editorial VARCHAR(150)`,
    `ALTER TABLE libros ADD COLUMN IF NOT EXISTS cantidad_total INT DEFAULT 1`,
    // libros — nuevos campos
    `ALTER TABLE libros ADD COLUMN IF NOT EXISTS autor_id INT REFERENCES autores(id) ON DELETE SET NULL`,
    `ALTER TABLE libros ADD COLUMN IF NOT EXISTS edicion VARCHAR(50)`,
    `ALTER TABLE libros ADD COLUMN IF NOT EXISTS numero_paginas INT`,
    `ALTER TABLE libros ADD COLUMN IF NOT EXISTS idioma VARCHAR(50)`,
    `ALTER TABLE libros ADD COLUMN IF NOT EXISTS clasificacion_dewey VARCHAR(50)`,
    `ALTER TABLE libros ADD COLUMN IF NOT EXISTS descripcion TEXT`,

    // prestamos — campos existentes
    `ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS id_ejemplar INT REFERENCES ejemplares(id)`,
    `ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS fecha_devolucion DATE`,
    `ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS fecha_devolucion_esperada DATE`,
    `ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(50)`,
    `ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(50)`,
    `ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS multa NUMERIC(10,2) DEFAULT 0`,

    // ejemplares
    `ALTER TABLE ejemplares ADD COLUMN IF NOT EXISTS codigo VARCHAR(100)`,
    `ALTER TABLE ejemplares ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Disponible'`,
  ];

  for (const sql of alteraciones) {
    try { await pool.query(sql); } catch (_) { /* columna ya existe */ }
  }

  // Configuración por defecto
  await pool.query(`
    INSERT INTO configuracion (dias_prestamo, multa_diaria, max_renovaciones)
    SELECT 15, 0.50, 2 WHERE NOT EXISTS (SELECT 1 FROM configuracion)
  `);

  console.log('✅ [DB] Tablas verificadas y listas.');
};

module.exports = initDB;
