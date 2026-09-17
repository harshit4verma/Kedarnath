@echo off
title Kedarnath 360 AR/VR Experience
cd /d "%~dp0"

echo ========================================================
echo   Kedarnath Dham 360 AR/VR Pilgrimage Experience
echo ========================================================
echo.
echo Starting local web server on port 8080...
echo Project Folder: %~dp0
echo.

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Python detected! Opening browser and starting server...
    start "" "http://localhost:8080/index.html"
    if exist "%~dp0server.py" (
        python "%~dp0server.py" 8080
    ) else (
        python -m http.server 8080 --directory "%~dp0"
    )
    goto end
)

where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Python detected via py launcher! Opening browser and starting server...
    start "" "http://localhost:8080/index.html"
    if exist "%~dp0server.py" (
        py "%~dp0server.py" 8080
    ) else (
        py -m http.server 8080 --directory "%~dp0"
    )
    goto end
)

echo Python not found on PATH. Launching PowerShell server...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"

:end
pause

