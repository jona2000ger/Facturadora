# Script para reiniciar la base de datos completa

Write-Host "Reiniciando base de datos..." -ForegroundColor Yellow

# Detener y eliminar contenedores
Write-Host "Deteniendo contenedores..." -ForegroundColor Blue
docker-compose down

# Eliminar volumen de datos de PostgreSQL
Write-Host "Eliminando datos existentes..." -ForegroundColor Red
docker volume rm facturadora_postgres_data

# Levantar servicios nuevamente
Write-Host "Levantando servicios con nuevo esquema..." -ForegroundColor Green
docker-compose up -d

# Esperar a que la base de datos esté lista
Write-Host "Esperando a que la base de datos este lista..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar que todo esté funcionando
Write-Host "Verificando servicios..." -ForegroundColor Green
docker-compose ps

Write-Host "Base de datos reiniciada exitosamente!" -ForegroundColor Green
Write-Host "Puedes acceder a:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   - Backend: http://localhost:3001" -ForegroundColor White
Write-Host "   - Base de datos: localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "Credenciales de prueba:" -ForegroundColor Cyan
Write-Host "   - Admin: admin@facturadora.com / password" -ForegroundColor White
Write-Host "   - Manager: manager@facturadora.com / password" -ForegroundColor White
Write-Host "   - User: user@facturadora.com / password" -ForegroundColor White 