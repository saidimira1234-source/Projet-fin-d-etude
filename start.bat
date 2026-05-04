@echo off
title NeuroPedago - Activities Server
echo.
echo  ========================================
echo   NeuroPedago - Activites Educatives
echo  ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERREUR] Node.js n'est pas installe!
    echo  Telechargez-le depuis: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo  Demarrage du serveur...
echo.

:: Start server and open browser
start "" "http://localhost:8085"
node server.js

pause
