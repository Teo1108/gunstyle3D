@echo off
title Apagar GunStyle
echo ==============================================
echo Deteniendo los servidores de GunStyle...
echo ==============================================

echo Cerrando Backend...
taskkill /FI "WINDOWTITLE eq GunStyle Backend*" /T /F >nul 2>&1

echo Cerrando Frontend...
taskkill /FI "WINDOWTITLE eq GunStyle Frontend*" /T /F >nul 2>&1

echo.
echo Todos los procesos asociados han sido cerrados exitosamente.
pause
