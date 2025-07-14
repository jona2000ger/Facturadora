# Sistema de Facturación

Un sistema completo de facturación desarrollado con Express.js (backend), React (frontend) y PostgreSQL (base de datos), desplegado con Docker.

## 🚀 Características

- **Backend API RESTful** con Express.js
- **Frontend React** con arquitectura MVC
- **Base de datos PostgreSQL** con Docker
- **Autenticación con OTP** (One-Time Password)
- **Sistema de roles y permisos** completo
- **Gestión de clientes, productos y facturas**
- **Sistema de pagos**
- **Envío de facturas por correo electrónico**
- **Interfaz moderna y responsive**
- **Docker Compose** para desarrollo y producción

## 🏗️ Arquitectura

### Backend (Express.js)
- **Arquitectura escalable** con separación de responsabilidades
- **Middleware de autenticación** y autorización
- **Validación de datos** con express-validator
- **Manejo de errores** centralizado
- **Rate limiting** y seguridad con helmet
- **Pool de conexiones** PostgreSQL optimizado
- **Servicio de email** con nodemailer
- **Sistema OTP** con speakeasy

### Frontend (React)
- **Patrón MVC** implementado con hooks personalizados
- **React Query** para gestión de estado del servidor
- **React Hook Form** para formularios
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Componentes reutilizables**

### Base de Datos (PostgreSQL)
- **Esquema normalizado** para facturación
- **Sistema de roles y permisos** completo
- **Triggers** para auditoría automática
- **Índices** optimizados para consultas
- **Datos de ejemplo** incluidos

## 📋 Prerrequisitos

- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- npm o yarn

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd facturadora
```

### 2. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar las variables según tu entorno
nano .env
```

### 3. Instalar dependencias (opcional para desarrollo local)
```bash
npm run install:all
```

### 4. Ejecutar con Docker
```bash
# Opción 1: Ejecutar directamente
docker-compose up -d

# Opción 2: Reiniciar completamente la base de datos (recomendado para problemas)
./reset_database.ps1

# Ver logs
docker-compose logs -f
```

## 🚀 Desarrollo Local

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Base de datos
```bash
# Usar Docker para PostgreSQL
docker run -d \
  --name facturadora_db \
  -e POSTGRES_DB=facturadora \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15-alpine
```

## 📊 Estructura del Proyecto

```
facturadora/
├── backend/                 # API Express.js
│   ├── src/
│   │   ├── config/         # Configuración de BD
│   │   ├── middleware/     # Middlewares personalizados
│   │   ├── routes/         # Rutas de la API
│   │   ├── services/       # Servicios (email, OTP)
│   │   └── app.js         # Aplicación principal
│   ├── package.json
│   └── Dockerfile
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── models/        # Servicios (Model)
│   │   ├── controllers/   # Hooks personalizados (Controller)
│   │   ├── views/         # Componentes (View)
│   │   └── App.js
│   ├── package.json
│   └── Dockerfile
├── database/
│   ├── complete_schema.sql # Script completo de BD
│   └── reset_database.sql  # Script para reiniciar BD
├── reset_database.ps1      # Script PowerShell para reinicio
├── docker-compose.yml
├── package.json
└── README.md
```

## 🔧 Configuración

### Variables de Entorno

```env
# Configuración del entorno
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=facturadora
DB_USER=postgres
DB_PASSWORD=password

# Puertos
BACKEND_PORT=3001
FRONTEND_PORT=3000

# Email (para OTP y envío de facturas)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-password-de-aplicacion
EMAIL_FROM=tu-email@gmail.com

# OTP
OTP_ISSUER=Facturadora

# API
REACT_APP_API_URL=http://localhost:3001
```

## 📱 Uso

### Acceso a la aplicación
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Base de datos**: localhost:5432

### Usuarios por defecto
- **Admin**: admin@facturadora.com / password
- **Manager**: manager@facturadora.com / password
- **Usuario**: user@facturadora.com / password

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión (envía OTP)
- `POST /api/auth/verify-otp` - Verificar OTP y completar login
- `POST /api/auth/resend-otp` - Reenviar código OTP
- `GET /api/auth/profile` - Obtener perfil del usuario

### Clientes
- `GET /api/clients` - Listar clientes
- `GET /api/clients/:id` - Obtener cliente
- `POST /api/clients` - Crear cliente
- `PUT /api/clients/:id` - Actualizar cliente
- `DELETE /api/clients/:id` - Eliminar cliente

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

### Facturas
- `GET /api/invoices` - Listar facturas
- `GET /api/invoices/:id` - Obtener factura
- `POST /api/invoices` - Crear factura
- `PUT /api/invoices/:id/status` - Actualizar estado
- `POST /api/invoices/:id/send-email` - Enviar factura por email
- `DELETE /api/invoices/:id` - Eliminar factura

### Pagos
- `GET /api/payments` - Listar pagos
- `POST /api/payments` - Registrar pago
- `GET /api/payments/:id` - Obtener pago

### Administración
- `GET /api/admin/invoices` - Listar facturas para administración
- `PUT /api/admin/invoices/:id/status` - Cambiar estado administrativo
- `GET /api/admin/dashboard` - Dashboard administrativo

### Roles y Permisos
- `GET /api/roles` - Listar roles
- `POST /api/roles` - Crear rol
- `PUT /api/roles/:id` - Actualizar rol
- `DELETE /api/roles/:id` - Eliminar rol

## 🔄 Reinicio de Base de Datos

Si tienes problemas con la base de datos o quieres empezar desde cero:

```powershell
# En Windows PowerShell
./reset_database.ps1

# O manualmente
docker-compose down
docker volume rm facturadora_postgres_data
docker-compose up -d
```

## 🐛 Solución de Problemas

### Error de módulos faltantes
```bash
# Reconstruir backend sin cache
docker-compose build --no-cache backend
docker-compose up -d
```

### Error de base de datos
```bash
# Reiniciar completamente
./reset_database.ps1
```

### Error de permisos en Windows
```powershell
# Ejecutar PowerShell como administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📝 Notas

- El sistema usa autenticación OTP en lugar de JWT para mayor seguridad
- Las facturas se pueden enviar por correo electrónico con botón de pago
- El sistema incluye gestión completa de roles y permisos
- Los datos de ejemplo se crean automáticamente al inicializar la base de datos 