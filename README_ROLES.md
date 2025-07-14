# Sistema de Roles y Permisos - Facturadora

## Descripción

Este sistema implementa un control de acceso basado en roles (RBAC) con tres niveles de usuario:

### 👑 Administrador (admin)
- **Acceso completo** al sistema
- **Permisos**: dashboard, invoices, clients, products, admin, users, settings
- **Funciones**:
  - Dashboard principal y administrativo
  - Gestión completa de facturas (crear, editar, ver, enviar, pagar)
  - Gestión de clientes y productos
  - Revisión y aprobación de facturas
  - Gestión de usuarios y roles
  - Configuración del sistema

### 👨‍💼 Gerente (manager)
- **Acceso intermedio** al sistema
- **Permisos**: dashboard, invoices, clients, products, reports
- **Funciones**:
  - Dashboard principal
  - Gestión de facturas (crear, editar, ver, enviar, pagar)
  - Gestión de clientes y productos
  - Reportes

### 👤 Usuario (user)
- **Acceso básico** al sistema
- **Permisos**: dashboard, invoices, clients, products
- **Funciones**:
  - Dashboard principal
  - Gestión de facturas (crear, editar, ver, enviar, pagar)
  - Gestión de clientes
  - Gestión de productos

## Cómo Probar el Sistema

### 1. Iniciar el Sistema
```bash
# Iniciar todos los servicios
docker-compose up -d

# Verificar que estén corriendo
docker-compose ps
```

### 2. Acceder al Frontend
- Abrir http://localhost:3000
- Usar las credenciales de prueba:
  - **Admin**: admin@facturadora.com / password
  - **Manager**: manager@facturadora.com / password  
  - **User**: user@facturadora.com / password

### 3. Probar Diferentes Roles

#### Opción A: Usando Diferentes Usuarios
1. Cerrar sesión
2. Iniciar sesión con diferentes credenciales según el rol que quieras probar
3. El sistema automáticamente asignará los permisos según el rol del usuario

#### Opción B: Usando el Probador de Roles (Solo Admin)
1. Iniciar sesión como administrador
2. En el dashboard, encontrar la sección "Probador de Roles"
3. Hacer clic en el rol deseado para cambiar
4. La página se recargará automáticamente con el nuevo rol

### 4. Verificar Permisos

#### Navegación
- **Admin**: Ve todas las opciones en el sidebar
- **Manager**: Ve dashboard, clientes, productos, facturas
- **User**: Ve dashboard, clientes, productos, facturas

#### Funcionalidades
- **Productos**: Admin, manager y user pueden acceder
- **Administración**: Solo admin puede acceder
- **Configuración**: Solo admin puede acceder

### 5. Probar Restricciones

#### Intentar Acceder a Rutas Restringidas
- Como manager, intentar acceder a `/admin/dashboard` → será redirigido al dashboard
- Como cualquier rol, intentar acceder a `/settings` sin ser admin → será redirigido

#### Verificar API
- Las llamadas a la API incluyen el rol en las cabeceras (`x-user-role`)
- El backend valida permisos antes de procesar las peticiones

## Estructura Técnica

### Backend
- **Middleware de autenticación**: `backend/src/middleware/auth.js`
- **Middleware de permisos**: `hasPermission()` para verificar permisos específicos
- **Rutas protegidas**: Cada ruta tiene su middleware de permisos correspondiente

### Frontend
- **Componentes de ruta**: `ProtectedRoute`, `RoleRoute`, `PermissionRoute`
- **Navegación dinámica**: El sidebar se adapta según el rol del usuario
- **Simulación de autenticación**: `frontend/src/models/authService.js`

### Base de Datos
- **Tabla roles**: Define los roles disponibles
- **Tabla permissions**: Define los permisos disponibles
- **Tabla role_permissions**: Relación muchos a muchos entre roles y permisos
- **Tabla users**: Incluye `role_id` para asignar roles a usuarios

## Archivos Principales

### Backend
- `backend/src/middleware/auth.js` - Middleware de autenticación y autorización
- `backend/src/routes/*.js` - Rutas con middleware de permisos
- `database/migrations/004_create_roles_and_permissions.sql` - Estructura de roles

### Frontend
- `frontend/src/App.js` - Rutas protegidas
- `frontend/src/views/components/Layout.js` - Navegación dinámica
- `frontend/src/views/components/RoleTester.js` - Componente de prueba
- `frontend/src/models/authService.js` - Simulación de autenticación

## Comandos Útiles

```bash
# Ver logs del backend
docker-compose logs -f backend

# Ver logs del frontend
docker-compose logs -f frontend

# Reiniciar servicios
docker-compose restart backend frontend

# Reconstruir servicios
docker-compose up -d --build
```

## Notas Importantes

1. **Autenticación Real**: El sistema ahora usa autenticación real basada en credenciales de la base de datos.

2. **Persistencia**: Los roles se guardan en localStorage del navegador después del login exitoso.

3. **Seguridad**: El backend valida permisos en cada petición, no solo en el frontend.

4. **Escalabilidad**: El sistema está diseñado para agregar fácilmente nuevos roles y permisos.

5. **Usuarios de Prueba**: Se incluyen usuarios de prueba para facilitar las pruebas del sistema.

## Próximos Pasos

1. Implementar JWT real para autenticación
2. Agregar más roles y permisos específicos
3. Implementar auditoría de acciones
4. Agregar gestión de sesiones
5. Implementar recuperación de contraseñas 