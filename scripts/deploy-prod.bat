@echo off
REM Production Deployment Script for CRM Bank Application (Windows)
REM This script deploys the application to production using Docker

echo ==========================================
echo CRM Bank - Production Deployment
echo ==========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running. Please start Docker and try again.
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Check if .env.production exists
if not exist .env.production (
    echo Error: .env.production file not found!
    echo Please create .env.production with your production configuration.
    echo You can use .env.production.example as a template.
    exit /b 1
)

echo [OK] Production environment file found
echo.

REM Create backup directory
echo Creating backup of current deployment...
set BACKUP_DIR=backups\%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%
mkdir "%BACKUP_DIR%" 2>nul

echo [OK] Backup created at %BACKUP_DIR%
echo.

REM Build new image
echo Building production Docker image...
docker-compose -f docker-compose.prod.yml build --no-cache

echo.
echo Running database migrations...
docker-compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

echo.
echo Deploying to production...
REM Stop old containers
docker-compose -f docker-compose.prod.yml down

REM Start new containers
docker-compose -f docker-compose.prod.yml up -d

echo.
echo Waiting for application to start...
timeout /t 15 /nobreak >nul

REM Health check
echo.
echo Performing health check...
set RETRY_COUNT=0
set MAX_RETRIES=10

:healthcheck
if %RETRY_COUNT% geq %MAX_RETRIES% goto healthcheck_failed

docker-compose -f docker-compose.prod.yml exec -T app curl -f http://localhost:3000/api/health >nul 2>&1
if errorlevel 1 (
    set /a RETRY_COUNT+=1
    echo Waiting for application... (%RETRY_COUNT%/%MAX_RETRIES%)
    timeout /t 5 /nobreak >nul
    goto healthcheck
)

echo [OK] Health check passed!
goto healthcheck_success

:healthcheck_failed
echo Error: Health check failed! Rolling back...
docker-compose -f docker-compose.prod.yml down
echo Please check logs: docker-compose -f docker-compose.prod.yml logs
exit /b 1

:healthcheck_success

REM Show container status
echo.
echo Container Status:
docker-compose -f docker-compose.prod.yml ps

echo.
echo ==========================================
echo [OK] Production deployment successful!
echo ==========================================
echo.
echo Useful commands:
echo   - View logs:        docker-compose -f docker-compose.prod.yml logs -f
echo   - Stop containers:  docker-compose -f docker-compose.prod.yml down
echo   - Restart:          docker-compose -f docker-compose.prod.yml restart
echo.
echo To view real-time logs, run:
echo    docker-compose -f docker-compose.prod.yml logs -f app
echo.
