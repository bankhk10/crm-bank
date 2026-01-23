@echo off
REM ===========================================
REM CRM-Bank Local Docker Testing Script
REM สำหรับ Windows
REM ===========================================

setlocal enabledelayedexpansion

REM ย้ายไปที่ root directory ของโปรเจค
cd /d "%~dp0\.."

REM ตรวจสอบว่า Docker กำลังทำงานอยู่หรือไม่
docker info > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo.
echo ===========================================
echo   CRM-Bank Local Docker Testing
echo ===========================================
echo.

:menu
echo Please select an option:
echo.
echo   1. Start all services (Build and Run)
echo   2. Start services only (without rebuild)
echo   3. Run database migration
echo   4. Run database seed
echo   5. View logs
echo   6. Stop all services
echo   7. Stop and remove all data (Clean restart)
echo   8. Check service status
echo   9. Connect to database (psql)
echo   0. Exit
echo.

set /p choice="Enter your choice (0-9): "

if "%choice%"=="1" goto start_build
if "%choice%"=="2" goto start_only
if "%choice%"=="3" goto migrate
if "%choice%"=="4" goto seed
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto stop
if "%choice%"=="7" goto clean
if "%choice%"=="8" goto status
if "%choice%"=="9" goto psql
if "%choice%"=="0" goto end

echo Invalid choice. Please try again.
goto menu

:start_build
echo.
echo [INFO] Building and starting all services...
echo.
docker compose -f docker-compose.local.yml --env-file .env.local.docker up --build -d
if errorlevel 1 (
    echo [ERROR] Failed to start services.
    pause
    goto menu
)
echo.
echo [SUCCESS] Services started successfully!
echo.
echo Application URL: http://localhost:3000
echo Database port: localhost:5433
echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak > nul
docker compose -f docker-compose.local.yml ps
echo.
pause
goto menu

:start_only
echo.
echo [INFO] Starting all services (without rebuild)...
echo.
docker compose -f docker-compose.local.yml --env-file .env.local.docker up -d
echo.
echo [SUCCESS] Services started!
echo Application URL: http://localhost:3000
echo.
pause
goto menu

:migrate
echo.
echo [INFO] Running database migration...
echo.
docker compose -f docker-compose.local.yml --env-file .env.local.docker --profile migrate up migrate
echo.
echo [SUCCESS] Migration completed!
echo.
pause
goto menu

:seed
echo.
echo [INFO] Running database seed...
echo.
docker compose -f docker-compose.local.yml --env-file .env.local.docker --profile seed up seed
echo.
echo [SUCCESS] Seed completed!
echo.
pause
goto menu

:logs
echo.
echo [INFO] Showing logs (Press Ctrl+C to exit)...
echo.
docker compose -f docker-compose.local.yml logs -f
goto menu

:stop
echo.
echo [INFO] Stopping all services...
echo.
docker compose -f docker-compose.local.yml down
echo.
echo [SUCCESS] All services stopped.
echo.
pause
goto menu

:clean
echo.
echo [WARNING] This will remove all containers and data!
set /p confirm="Are you sure? (y/N): "
if /i not "%confirm%"=="y" goto menu
echo.
echo [INFO] Removing all containers and data...
echo.
docker compose -f docker-compose.local.yml down -v --remove-orphans
docker image prune -f
echo.
echo [SUCCESS] All data removed.
echo.
pause
goto menu

:status
echo.
echo [INFO] Service Status:
echo.
docker compose -f docker-compose.local.yml ps
echo.
echo [INFO] Container Health:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=crm-"
echo.
pause
goto menu

:psql
echo.
echo [INFO] Connecting to PostgreSQL database...
echo Username: crm_admin | Database: crm_bank
echo.
docker compose -f docker-compose.local.yml exec postgres psql -U crm_admin -d crm_bank
echo.
pause
goto menu

:end
echo.
echo Goodbye!
echo.
exit /b 0
