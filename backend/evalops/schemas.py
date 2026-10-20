from pydantic import BaseModel, Field, ConfigDict
from typing import Any
from datetime import datetime


# User & Auth Schemas
class UserRegister(BaseModel):
    email: str = Field(min_length=3, max_length=255, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(default="", max_length=120)


class UserLogin(BaseModel):
    email: str = Field(min_length=3, max_length=255, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: Any
    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    user: UserOut
    token: str
    expires_at: Any


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=120)
    current_password: str | None = Field(default=None, max_length=128)
    new_password: str | None = Field(default=None, min_length=8, max_length=128)


# Integration Schemas
class IntegrationCreate(BaseModel):
    provider: str = Field(default="openai_compatible", pattern="^(openai_compatible)$")
    api_base: str = Field(min_length=1, max_length=255)
    api_key: str = Field(min_length=1, max_length=500)
    model_name: str = Field(default="", max_length=100)
    is_enabled: bool = False
    data_disclosure_acknowledged: bool = False
    timeout_seconds: float = Field(default=20.0, ge=1.0, le=300.0)


class IntegrationUpdate(BaseModel):
    api_base: str | None = Field(default=None, min_length=1, max_length=255)
    api_key: str | None = Field(default=None, min_length=1, max_length=500)
    model_name: str | None = Field(default=None, max_length=100)
    is_enabled: bool | None = None
    data_disclosure_acknowledged: bool | None = None
    timeout_seconds: float | None = Field(default=None, ge=1.0, le=300.0)


class IntegrationOut(BaseModel):
    id: int
    provider: str
    api_base: str
    masked_key: str
    model_name: str
    is_enabled: bool
    data_disclosure_acknowledged: bool
    timeout_seconds: float
    created_at: Any
    updated_at: Any
    model_config = ConfigDict(from_attributes=True)


class IntegrationTestResponse(BaseModel):
    success: bool
    message: str
    latency_ms: float | None = None


# Project Schemas
class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=4000)
    config: dict[str, Any] = Field(default_factory=dict)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=4000)
    config: dict[str, Any] | None = None


class ProjectOut(BaseModel):
    id: int
    user_id: int | None = None
    name: str
    description: str
    config: dict
    created_at: Any
    model_config = ConfigDict(from_attributes=True)


# Test Case Schemas
class TestCaseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=4000)
    input_text: str = Field(min_length=1, max_length=30000)
    expected_output: str | None = Field(default=None, max_length=30000)
    criteria: list[dict[str, Any]] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)


class TestCaseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    input_text: str | None = Field(default=None, min_length=1, max_length=30000)
    expected_output: str | None = None
    criteria: list[dict[str, Any]] | None = None
    tags: list[str] | None = None


class TestCaseOut(BaseModel):
    id: int
    project_id: int
    name: str
    description: str
    input_text: str
    expected_output: str | None
    criteria: list
    tags: list
    created_at: Any
    model_config = ConfigDict(from_attributes=True)


# Evaluation Run & Result Schemas
class RunCreate(BaseModel):
    trigger: str = Field(default="manual", pattern="^(manual|github_actions|cli)$")
    revision: str | None = Field(default=None, max_length=80)
    baseline_run_id: int | None = None
    outputs: dict[str, str] | None = None
    latencies_ms: dict[str, float] | None = None


class RunOut(BaseModel):
    id: int
    project_id: int
    status: str
    trigger: str
    revision: str | None
    baseline_run_id: int | None
    total: int
    passed: int
    failed: int
    duration_ms: float
    gate_passed: bool | None
    gate_reasons: list
    created_at: Any
    model_config = ConfigDict(from_attributes=True)


class ResultOut(BaseModel):
    id: int
    run_id: int
    test_case_id: int | None
    test_name: str
    status: str
    passed: bool
    input_text: str
    expected_output: str | None
    actual_output: str | None
    checks: list
    errors: list
    latency_ms: float | None
    token_count: int | None
    token_count_kind: str | None
    regression: str
    baseline_passed: bool | None
    model_config = ConfigDict(from_attributes=True)
