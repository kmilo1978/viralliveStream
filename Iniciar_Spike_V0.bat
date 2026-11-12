@echo off
cd /d "%~dp0"
echo Iniciando MiPlataformaStream Spike V0 en http://localhost:3000 ...
start "" "http://localhost:3000"
npm run dev
