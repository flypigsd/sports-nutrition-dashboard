@echo off
setlocal

cd /d "%~dp0"

if "%TREND_RADAR_HOST%"=="" set "TREND_RADAR_HOST=127.0.0.1"
if "%TREND_RADAR_PORT%"=="" set "TREND_RADAR_PORT=18787"
set "TREND_RADAR_OPEN_BROWSER=1"
set "DASHBOARD_URL=http://127.0.0.1:%TREND_RADAR_PORT%/"

echo Global Sourcing Dashboard is starting...
echo.
echo Keep this window open while using the dashboard.
echo.
echo If the browser does not open, visit:
echo %DASHBOARD_URL%
echo.

if not exist "backend\server.py" (
  echo Cannot find backend\server.py.
  pause
  goto :end
)

set "PYTHON_EXE="
set "PYTHON_CMD="

if exist "%~dp0.runtime\python\python.exe" (
  set "PYTHON_EXE=%~dp0.runtime\python\python.exe"
)

if not defined PYTHON_EXE (
  py -3 -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>nul
  if not errorlevel 1 set "PYTHON_CMD=py -3"
)

if not defined PYTHON_EXE if not defined PYTHON_CMD (
  python -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>nul
  if not errorlevel 1 set "PYTHON_CMD=python"
)

if defined PYTHON_EXE (
  "%PYTHON_EXE%" backend\server.py %TREND_RADAR_PORT%
  goto :server_stopped
)

if defined PYTHON_CMD (
  %PYTHON_CMD% backend\server.py %TREND_RADAR_PORT%
  goto :server_stopped
)

echo Python was not found on this computer.
echo Please install Python 3.10 from https://www.python.org/downloads/
pause
goto :end

:server_stopped
echo.
echo The dashboard service stopped.
pause

:end
endlocal
