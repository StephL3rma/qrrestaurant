-- Configuración inicial de PostgreSQL para QR Restaurant
-- Este archivo se ejecuta automáticamente al crear la base de datos

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone
SET timezone = 'UTC';

-- Crear índices para mejor performance (se ejecutarán después de las migraciones de Prisma)
-- Prisma creará las tablas, nosotros solo optimizamos