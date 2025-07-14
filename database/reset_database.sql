-- =====================================================
-- SCRIPT PARA LIMPIAR Y REINICIAR LA BASE DE DATOS
-- =====================================================

-- Eliminar todas las tablas existentes (en orden correcto por dependencias)
DROP TABLE IF EXISTS user_otps CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_otps() CASCADE;

-- Eliminar extensiones (opcional, ya que se recrean)
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- Ahora ejecutar el script completo
\i complete_schema.sql 