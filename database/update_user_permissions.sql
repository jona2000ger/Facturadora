-- Script para actualizar permisos del rol user para incluir productos

-- Primero, eliminar permisos existentes del rol user
DELETE FROM role_permissions 
WHERE role_id = (SELECT id FROM roles WHERE name = 'user');

-- Luego, insertar los nuevos permisos incluyendo productos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.name = 'user' 
AND p.name IN ('dashboard', 'invoices', 'clients', 'products');

-- Verificar que se insertaron correctamente
SELECT 
    r.name as role_name,
    p.name as permission_name
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'user'
ORDER BY p.name; 