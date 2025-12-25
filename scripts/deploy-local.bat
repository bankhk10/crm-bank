@echo off
REM Local Docker Testing Script for CRM Bank Application (Windows)
REM This script builds and runs the application locally with Docker

echo ==========================================
echo CRM Bank - Local Docker Testing
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

REM Check if .env.local exists
if not exist .env.local (
    echo Error: .env.local file not found!
    echo Please create .env.local with your configuration.
    exit /b 1
)

echo [OK] Environment file found
echo.

REM Stop and remove existing containers
echo Cleaning up existing containers...
docker-compose down -v

echo.
echo Building Docker images...
docker-compose build --no-cache

echo.
echo Starting containers...
docker-compose up -d

echo.
echo Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

REM Check container status
echo.
echo Container Status:
docker-compose ps

echo.
echo ==========================================
echo [OK] Local testing environment is ready!
echo ==========================================
echo.
echo Application: http://localhost:3000
echo Database: localhost:5432
echo.
echo Useful commands:
echo   - View logs:        docker-compose logs -f
echo   - View app logs:    docker-compose logs -f app
echo   - Stop containers:  docker-compose down
echo   - Restart:          docker-compose restart
echo.
echo To view real-time logs, run:
echo    docker-compose logs -f app
echo.
