@echo off
rem ============================================
rem  Personal Blog - Local Preview
rem  Open http://localhost:8323 to preview
rem ============================================
cd /d %~dp0
echo Starting local blog preview...
echo Open: http://localhost:8323
echo.
start "" http://localhost:8323
C:/Users/030607/.workbuddy/binaries/node/versions/22.22.2/node.exe preview-server.js
pause
