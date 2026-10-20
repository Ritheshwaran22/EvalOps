"""Vercel Serverless Function entry point for EvalOps FastAPI backend."""
import sys
from pathlib import Path

from urllib.parse import parse_qsl, urlencode

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
            target_path = None

            # 1. Check for __vpath query parameter injected by vercel.json rewrite
            raw_qs = scope.get("query_string", b"").decode("latin1")
            if "__vpath" in raw_qs:
                pairs = parse_qsl(raw_qs, keep_blank_values=True)
                remaining_pairs = []
                for k, v in pairs:
                    if k == "__vpath" and target_path is None:
                        target_path = v
                    else:
                        remaining_pairs.append((k, v))
                new_qs = urlencode(remaining_pairs)
                scope["query_string"] = new_qs.encode("latin1")

            # 2. Check headers if __vpath was not present
            if not target_path:
                headers = dict(scope.get("headers", []))
                header_path = (
                    headers.get(b"x-forwarded-path")
                    or headers.get(b"x-matched-path")
                    or headers.get(b"x-invoke-path")
                    or headers.get(b"x-forwarded-uri")
                    or headers.get(b"x-original-uri")
                )
                if header_path:
                    decoded = header_path.decode("utf-8").split("?")[0]
                    if decoded and decoded not in ("/api/index", "/api/index.py", "/api"):
                        target_path = decoded

            # 3. Apply target_path or fallback
            current_path = scope.get("path", "")
            if target_path:
                if not target_path.startswith("/"):
                    target_path = "/" + target_path
                while target_path.startswith("//"):
                    target_path = target_path[1:]
                scope["path"] = target_path
                scope["raw_path"] = target_path.encode("latin1")
            elif current_path in ("/api/index", "/api/index.py", "/api"):
                scope["path"] = "/"
                scope["raw_path"] = b"/"

        await self.app(scope, receive, send)


app = VercelPathFixMiddleware(fastapi_app)
