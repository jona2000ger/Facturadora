-- =====================================================
-- SCRIPT COMPLETO DE BASE DE DATOS - SISTEMA DE FACTURACIÓN
-- =====================================================

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT 'blue',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de permisos
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación roles-permisos
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tax_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos/servicios
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    sku VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de facturas
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id),
    user_id UUID REFERENCES users(id),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    admin_status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    admin_reviewed_by UUID REFERENCES users(id),
    admin_reviewed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de items de factura
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para almacenar códigos OTP de usuarios
CREATE TABLE IF NOT EXISTS user_otps (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Tabla para registrar eventos de cambio de contraseña
CREATE TABLE IF NOT EXISTS password_change_events (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'request_otp', 'verify_otp', 'password_changed', 'failed_attempt'
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB, -- Para almacenar información adicional como navegador, ubicación, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para registrar intentos de login
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT false,
    failure_reason VARCHAR(100), -- 'invalid_credentials', 'account_locked', 'otp_expired', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para documentos electrónicos del SRI
CREATE TABLE IF NOT EXISTS electronic_documents (
    id SERIAL PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    access_key VARCHAR(49) NOT NULL UNIQUE,
    xml_content TEXT NOT NULL,
    sri_response JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    authorization_number VARCHAR(50),
    authorization_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA MEJORAR EL RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_user_otps_user_id ON user_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_otps_expires_at ON user_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_change_events_user_id ON password_change_events(user_id);
CREATE INDEX IF NOT EXISTS idx_password_change_events_created_at ON password_change_events(created_at);
CREATE INDEX IF NOT EXISTS idx_password_change_events_event_type ON password_change_events(event_type);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);

-- Índices para documentos electrónicos
CREATE INDEX IF NOT EXISTS idx_electronic_documents_invoice_id ON electronic_documents(invoice_id);
CREATE INDEX IF NOT EXISTS idx_electronic_documents_access_key ON electronic_documents(access_key);
CREATE INDEX IF NOT EXISTS idx_electronic_documents_status ON electronic_documents(status);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para limpiar OTPs expirados
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM user_otps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para documentos electrónicos
DROP TRIGGER IF EXISTS update_electronic_documents_updated_at ON electronic_documents;
CREATE TRIGGER update_electronic_documents_updated_at BEFORE UPDATE ON electronic_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar roles por defecto
INSERT INTO roles (name, display_name, description, color) VALUES
('admin', 'Administrador', 'Acceso completo al sistema', 'red'),
('manager', 'Gerente', 'Gestión de facturas y clientes', 'purple'),
('user', 'Usuario', 'Acceso básico al sistema', 'blue')
ON CONFLICT (name) DO NOTHING;

-- Insertar permisos por defecto
INSERT INTO permissions (name, display_name, description) VALUES
('dashboard', 'Dashboard', 'Acceso al panel principal'),
('invoices', 'Facturas', 'Gestión de facturas'),
('clients', 'Clientes', 'Gestión de clientes'),
('products', 'Productos', 'Gestión de productos'),
('reports', 'Reportes', 'Acceso a reportes'),
('admin', 'Administración', 'Acceso a funciones administrativas'),
('users', 'Usuarios', 'Gestión de usuarios'),
('settings', 'Configuración', 'Configuración del sistema')
ON CONFLICT (name) DO NOTHING;

-- Asignar permisos a roles
-- Admin: todos los permisos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Manager: permisos específicos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'manager' AND p.name IN ('dashboard', 'invoices', 'clients', 'products', 'reports')
ON CONFLICT DO NOTHING;

-- User: permisos básicos (incluyendo productos)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'user' AND p.name IN ('dashboard', 'invoices', 'clients', 'products')
ON CONFLICT DO NOTHING;

-- Crear usuarios de prueba
INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_active) VALUES
('admin@facturadora.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Usuario', (SELECT id FROM roles WHERE name = 'admin'), true),
('manager@facturadora.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Manager', 'Usuario', (SELECT id FROM roles WHERE name = 'manager'), true),
('user@facturadora.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Usuario', 'Normal', (SELECT id FROM roles WHERE name = 'user'), true)
ON CONFLICT (email) DO NOTHING;

-- Insertar clientes de ejemplo
INSERT INTO clients (name, email, phone, address, tax_id) VALUES
('Cliente Ejemplo 1', 'cliente1@email.com', '+1234567890', 'Calle Principal 123', 'TAX001'),
('Cliente Ejemplo 2', 'cliente2@email.com', '+0987654321', 'Avenida Central 456', 'TAX002')
ON CONFLICT DO NOTHING;

-- Insertar productos de ejemplo
INSERT INTO products (name, description, price, cost, sku, stock_quantity) VALUES
('Servicio de Consultoría', 'Servicio de consultoría técnica', 100.00, 50.00, 'SERV001', 100),
('Producto Software', 'Licencia de software empresarial', 500.00, 200.00, 'PROD001', 50),
('Mantenimiento Mensual', 'Servicio de mantenimiento mensual', 150.00, 75.00, 'MANT001', 200)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar resumen de la base de datos
SELECT 'Roles creados:' as info, COUNT(*) as cantidad FROM roles
UNION ALL
SELECT 'Permisos creados:', COUNT(*) FROM permissions
UNION ALL
SELECT 'Usuarios creados:', COUNT(*) FROM users
UNION ALL
SELECT 'Clientes creados:', COUNT(*) FROM clients
UNION ALL
SELECT 'Productos creados:', COUNT(*) FROM products;

-- Mostrar usuarios con sus roles
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  r.name as role,
  u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id
ORDER BY r.name, u.email; 