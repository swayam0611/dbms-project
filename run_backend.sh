#!/bin/bash
cd "$(dirname "$0")/backend"
source .venv/bin/activate
export PYTHONPATH=.
echo "Starting FastAPI Server on http://localhost:8000 (Swagger docs at http://localhost:8000/docs)..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
