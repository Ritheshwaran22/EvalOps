"""Opt-in OpenAI-compatible chat-completions adapter.

This adapter sends test inputs to the configured external endpoint only when a project
explicitly selects it, credentials are present, and the data-disclosure acknowledgement
is enabled in the environment.
"""
import json, os, time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

class ProviderConfigurationError(RuntimeError): pass
class ProviderExecutionError(RuntimeError): pass

def generate_output(prompt: str, target: dict) -> tuple[str, float]:
    provider = target.get("provider")
    if provider != "openai_compatible":
        raise ProviderConfigurationError("target.provider must be 'openai_compatible'")
    key = os.getenv("MODEL_API_KEY", "").strip()
    base = os.getenv("MODEL_API_BASE", "").strip().rstrip("/")
    model = str(target.get("model", "")).strip()
    if not key or not base or not model:
        raise ProviderConfigurationError("Set MODEL_API_KEY, MODEL_API_BASE, and target.model before using the external provider")
    if os.getenv("MODEL_DATA_DISCLOSURE_ACKNOWLEDGED", "false").lower() not in {"1", "true", "yes"}:
        raise ProviderConfigurationError("External provider use is disabled until MODEL_DATA_DISCLOSURE_ACKNOWLEDGED=true after reviewing data disclosure")
    timeout = float(os.getenv("MODEL_TIMEOUT_SECONDS", "20"))
    payload = {"model": model, "messages": [{"role":"system", "content": str(target.get("system_prompt", "Follow the user's request accurately."))}, {"role":"user", "content": prompt}], "temperature": float(target.get("temperature", 0))}
    request = Request(base + "/chat/completions", data=json.dumps(payload).encode(), headers={"Authorization": f"Bearer {key}", "Content-Type":"application/json"}, method="POST")
    started = time.perf_counter()
    try:
        with urlopen(request, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
        output = data["choices"][0]["message"]["content"]
        if not isinstance(output, str): raise ValueError("provider content was not text")
        return output, (time.perf_counter() - started) * 1000
    except HTTPError as exc:
        # Do not include request bodies, prompts, or authorization data in errors.
        raise ProviderExecutionError(f"External provider returned HTTP {exc.code}") from None
    except (URLError, TimeoutError, KeyError, IndexError, ValueError, json.JSONDecodeError) as exc:
        raise ProviderExecutionError(f"External provider request failed ({type(exc).__name__}); check endpoint, timeout, and response format") from None
