from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "sqlite:///./evalops.db"
    api_title: str = "EvalOps API"
    api_version: str = "v1"
    environment: str = "development"
    secret_key: str = "evalops-insecure-dev-secret-key-change-in-production-32b"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,https://eval-ops-two.vercel.app,https://eval-ops-git-main-rithesh8.vercel.app,https://eval-ops-rithesh8.vercel.app"
    session_cookie_name: str = "evalops_session"
    session_cookie_secure: bool = False
    session_cookie_samesite: str = "lax"
    session_expire_days: int = 7
    rate_limit_auth_per_min: int = 15
    data_retention_days: int | None = None
    default_min_pass_rate: float = 1.0
    default_no_critical_failures: bool = True
    privacy_contact: str = "Configure PRIVACY_CONTACT before production use"
    model_provider: str | None = None
    model_api_key: str | None = None
    model_api_base: str | None = None
    model_timeout_seconds: float = 20.0
    model_judge_enabled: bool = False
    model_data_disclosure_acknowledged: bool = False
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
