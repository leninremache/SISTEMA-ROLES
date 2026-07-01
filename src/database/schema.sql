-- =============================================
-- SISTEMA DE GESTIÓN DE BIBLIOTECA
-- Script de creación de tablas
-- =============================================

-- Tabla: autores
CREATE TABLE IF NOT EXISTS autores (
  id        SERIAL PRIMARY KEY,
  nombre    VARCHAR(150) NOT NULL,
  biografia TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: categorias
CREATE TABLE IF NOT EXISTS categorias (
  id     SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla: editoriales
CREATE TABLE IF NOT EXISTS editoriales (
  id     SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  pais   VARCHAR(100)
);

-- Tabla: libros
CREATE TABLE IF NOT EXISTS libros (
  id           SERIAL PRIMARY KEY,
  titulo       VARCHAR(255) NOT NULL,
  isbn         VARCHAR(20) UNIQUE,
  edicion      VARCHAR(50),
  anio         INT,
  id_autor     INT REFERENCES autores(id),
  id_categoria INT REFERENCES categorias(id),
  id_editorial INT REFERENCES editoriales(id),
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Tabla: ejemplares
CREATE TABLE IF NOT EXISTS ejemplares (
  id       SERIAL PRIMARY KEY,
  id_libro INT REFERENCES libros(id),
  estado   VARCHAR(50) DEFAULT 'Disponible' CHECK (estado IN ('Disponible','Prestado','En mantenimiento','Perdido','Dañado')),
  codigo   VARCHAR(100) UNIQUE
);

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(150) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  rol        VARCHAR(50) DEFAULT 'Lector' CHECK (rol IN ('Administrador','Catalogador','Bibliotecario','Lector')),
  telefono   VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: prestamos
CREATE TABLE IF NOT EXISTS prestamos (
  id             SERIAL PRIMARY KEY,
  id_ejemplar    INT REFERENCES ejemplares(id),
  id_usuario     INT REFERENCES usuarios(id),
  fecha_salida   DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_devolucion DATE,
  estado         VARCHAR(50) DEFAULT 'Activo' CHECK (estado IN ('Activo','Devuelto','Renovado','Vencido')),
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Tabla: multas
CREATE TABLE IF NOT EXISTS multas (
  id          SERIAL PRIMARY KEY,
  id_prestamo INT REFERENCES prestamos(id),
  monto       NUMERIC(10,2) NOT NULL,
  estado      VARCHAR(50) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Pagada')),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Tabla: reservas
CREATE TABLE IF NOT EXISTS reservas (
  id         SERIAL PRIMARY KEY,
  id_libro   INT REFERENCES libros(id),
  id_usuario INT REFERENCES usuarios(id),
  fecha      DATE DEFAULT CURRENT_DATE,
  estado     VARCHAR(50) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Procesada','Cancelada'))
);

-- Tabla: configuracion
CREATE TABLE IF NOT EXISTS configuracion (
  id               SERIAL PRIMARY KEY,
  dias_prestamo    INT DEFAULT 15,
  multa_diaria     NUMERIC(10,2) DEFAULT 0.50,
  max_renovaciones INT DEFAULT 2
);

-- Insertar configuración por defecto
INSERT INTO configuracion (dias_prestamo, multa_diaria, max_renovaciones)
SELECT 15, 0.50, 2
WHERE NOT EXISTS (SELECT 1 FROM configuracion);

-- Datos de prueba básicos
INSERT INTO autores (nombre) VALUES ('Gabriel García Márquez'), ('Mario Vargas Llosa')
ON CONFLICT DO NOTHING;

INSERT INTO categorias (nombre) VALUES ('Literatura'), ('Ciencia'), ('Historia'), ('Tecnología')
ON CONFLICT DO NOTHING;

INSERT INTO editoriales (nombre, pais) VALUES ('Editorial Planeta', 'España'), ('Alfaguara', 'España')
ON CONFLICT DO NOTHING;
