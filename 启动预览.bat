@echo off
rem Local preview for biaori-quest. Double-click to start, close the minimized
rem server window (or this window) to stop. Pushing to GitHub is a separate step.
cd /d "%~dp0"
start "biaori-quest preview server" /min cmd /c "python -m http.server 8642 2>nul || py -m http.server 8642"
timeout /t 1 /nobreak >nul
start "" http://127.0.0.1:8642/
echo.
echo  Local preview: http://127.0.0.1:8642/
echo  Server runs in the minimized window. Close it to stop.
echo.
