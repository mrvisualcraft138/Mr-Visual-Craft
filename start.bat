@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install Node.js first.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing dependencies...
  npm install
)
start "MR VISUALCRAFT" http://localhost:3000
npm start
