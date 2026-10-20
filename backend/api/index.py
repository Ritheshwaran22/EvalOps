"""Vercel Serverless Function entry point for EvalOps FastAPI backend."""
import sys
from pathlib import Path

# Ensure backend directory is in Python module search path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from evalops.api import app

# Vercel ASGI application handler
# Vercel looks for 'app' in api/index.py
