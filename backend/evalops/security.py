"""Security utilities: password hashing, session tokens, encryption, and rate limiting."""
import base64
import hashlib
import re
import secrets
import threading
import time
from datetime import datetime, timezone
import bcrypt
from cryptography.fernet import Fernet
from .config import settings


def hash_password(password: str) -> str:
    """Hash password using bcrypt with salt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify plaintext password against bcrypt hash safely."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def generate_session_token() -> str:
    """Generate cryptographically secure 256-bit URL-safe token."""
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    """Hash session token with SHA-256 before persisting in DB."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _get_fernet() -> Fernet:
    """Derive 32-byte URL-safe base64 key from settings.secret_key for Fernet."""
    digest = hashlib.sha256(settings.secret_key.encode("utf-8")).digest()
    key_b64 = base64.urlsafe_b64encode(digest)
    return Fernet(key_b64)


def encrypt_secret(plaintext: str) -> str:
    """Encrypt integration API key or secret token using AES-128-CBC + HMAC (Fernet)."""
    if not plaintext:
        return ""
    fernet = _get_fernet()
    return fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_secret(ciphertext: str) -> str:
    """Decrypt stored ciphertext using secret key."""
    if not ciphertext:
        return ""
    fernet = _get_fernet()
    return fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")


def mask_secret(secret: str) -> str:
    """Mask secret value for safe UI display (e.g., sk-...abcd or ****abcd). Never reveal full key."""
    if not secret:
        return ""
    s = secret.strip()
    if len(s) <= 8:
        return "••••••••"
    prefix = s[:3] if s.startswith("sk-") else ""
    suffix = s[-4:]
    return f"{prefix}••••••••{suffix}" if prefix else f"••••••••{suffix}"


_EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_and_normalize_email(email: str) -> str:
    """Validate and lowercase normalize an email address."""
    if not email or not isinstance(email, str):
        raise ValueError("Email is required")
    norm = email.strip().lower()
    if len(norm) > 255 or not _EMAIL_REGEX.match(norm):
        raise ValueError("Invalid email format")
    return norm


class SlidingWindowRateLimiter:
    """Thread-safe sliding-window rate limiter for sensitive endpoints (login, register)."""
    def __init__(self):
        self._lock = threading.Lock()
        self._requests: dict[str, list[float]] = {}

    def is_limited(self, key: str, max_attempts: int = 10, window_seconds: int = 60) -> tuple[bool, int]:
        """Check if key has exceeded max_attempts within window_seconds.
        
        Returns (is_limited, retry_after_seconds).
        """
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            # Purge entries older than window
            timestamps = [t for t in self._requests.get(key, []) if t > cutoff]
            if len(timestamps) >= max_attempts:
                oldest = timestamps[0]
                retry_after = max(1, int(oldest + window_seconds - now))
                self._requests[key] = timestamps
                return True, retry_after
            timestamps.append(now)
            self._requests[key] = timestamps
            # Periodic cleanup of empty keys
            if len(self._requests) > 1000:
                self._requests = {k: v for k, v in self._requests.items() if v and v[-1] > cutoff}
            return False, 0


rate_limiter = SlidingWindowRateLimiter()
