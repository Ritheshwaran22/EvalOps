import pytest
from evalops.provider import generate_output, ProviderConfigurationError

def test_provider_disabled_without_disclosure_ack(monkeypatch):
    monkeypatch.setenv("MODEL_API_KEY", "secret")
    monkeypatch.setenv("MODEL_API_BASE", "https://example.invalid/v1")
    monkeypatch.setenv("MODEL_DATA_DISCLOSURE_ACKNOWLEDGED", "false")
    with pytest.raises(ProviderConfigurationError, match="disclosure"):
        generate_output("private prompt", {"provider":"openai_compatible", "model":"example"})

def test_provider_requires_explicit_provider_config():
    with pytest.raises(ProviderConfigurationError):
        generate_output("hello", {"provider":"unknown"})
