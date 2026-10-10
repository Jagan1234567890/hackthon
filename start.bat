@echo off
REM TrustMark — Quick start script for Windows
echo ============================================================
echo  TrustMark - Provenance + Detection System
echo ============================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

REM Install dependencies if needed
echo [1/3] Checking dependencies...
if exist "backend\.venv\Scripts\python.exe" (
    echo Using virtual environment at backend\.venv ...
    set "PY_CMD=%~dp0backend\.venv\Scripts\python.exe"
) else (
    pip install -q fastapi uvicorn pynacl python-multipart aiofiles pillow transformers torch torchvision
    set "PY_CMD=python"
)

REM Start the backend
echo [2/3] Starting backend server on http://localhost:8000 ...
start "TrustMark Backend" cmd /k "cd backend && \"%PY_CMD%\" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Open the frontend in default browser
echo [3/3] Opening frontend...
start "" "http://localhost:8000/app/index.html"

echo.
echo ============================================================
echo  TrustMark is running!
echo  Backend API:  http://localhost:8000/api
echo  Frontend UI:  http://localhost:8000/app/index.html
echo  API Docs:     http://localhost:8000/docs
echo ============================================================
echo  Close the "TrustMark Backend" window to stop the server.
echo ============================================================
