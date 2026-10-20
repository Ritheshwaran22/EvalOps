"""Vercel Serverless Function entry point for EvalOps FastAPI backend."""
import sys
from pathlib import Path

# Ensure backend directory is in Python module search path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from evalops.api import app as fastapi_app


class VercelPathFixMiddleware:
    """Preserve and restore original request path when Vercel rewrites to /api/index."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            headers = dict(scope.get("headers", []))
            # Vercel edge sends original request path in x-matched-path, x-invoke-path, or x-forwarded-uri
            orig_path = (
                headers.get(b"x-matched-path")
                or headers.get(b"x-invoke-path")
                or headers.get(b"x-forwarded-uri")
            )
            if orig_path:
                decoded = orig_path.decode("utf-8").split("?")[0]
                if decoded and decoded not in ("/api/index", "/api/index.py", "/api"):
                    scope["path"] = decoded
                    scope["raw_path"] = decoded.encode("utf-8")
        await self.app(scope, receive, send)


app = VercelPathFixMiddleware(fastapi_app)
