@echo off
echo ========================================
echo Resetting Database and Seeding Data
echo ========================================
echo.

echo Step 1: Pushing schema to database...
pnpm prisma db push --force-reset --accept-data-loss

echo.
echo Step 2: Seeding database...
npm run seed

echo.
echo ========================================
echo Database reset and seeding completed!
echo ========================================
pause
