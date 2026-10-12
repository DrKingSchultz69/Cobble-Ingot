@echo off
rem Double-click to start Netheron. Keep this window open while you use it; close it (or Ctrl+C) to stop.
title Netheron
cd /d "%~dp0"
rem Open the workspace in the browser once the server is up.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep 3; Start-Process (node packages\daemon\src\cli.ts token)"
node packages\daemon\src\cli.ts serve
echo.
echo Netheron stopped. Press any key to close.
pause >nul
