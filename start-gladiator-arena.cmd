@echo off
setlocal
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Install Node.js first.
  pause
  exit /b 1
)
npm run gladiator:dev
pause
