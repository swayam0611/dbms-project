#!/bin/bash
# ==============================================================================
# Hospital Management System - Run Script (Backend + Frontend)
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Auto-kill any orphaned processes holding ports 8000 and 5173
echo "Freeing ports 8000 and 5173..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true

cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "=========================================================="
echo " Starting Hospital Management System (DBMS 3NF Project)"
echo "=========================================================="

# 1. Start FastAPI Backend (with --reload so code edits take effect immediately)
cd "$PROJECT_ROOT/backend"
source .venv/bin/activate
export PYTHONPATH=.
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "✓ FastAPI Backend started on http://localhost:8000"
echo "✓ Interactive Swagger UI: http://localhost:8000/docs"

# 2. Start Vite Frontend
cd "$PROJECT_ROOT/frontend"
npm run dev -- --host &
FRONTEND_PID=$!
echo "✓ React Vite Frontend started on http://localhost:5173"
echo "=========================================================="
echo "Press Ctrl+C to stop all services."

wait
