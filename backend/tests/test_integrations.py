import os
os.environ["DATABASE_URL"] = "sqlite:///./test_evalops.db"
from fastapi.testclient import TestClient
from evalops.api import app

client = TestClient(app)

def _auth_user(email: str) -> dict:
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": "Password123!", "full_name": "Integration User"})
    token = reg.json()["token"] if reg.status_code == 201 else client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"}).json()["token"]
    return {"Authorization": f"Bearer {token}"}

def test_integration_secrets_protection():
    headers = _auth_user("integrations_tester@example.com")
    raw_api_key = "sk-proj-supersecretkey1234567890abcdef"

    # 1. Create integration
    res = client.post(
        "/api/v1/integrations",
        json={
            "provider": "openai_compatible",
            "api_base": "https://api.openai.com/v1",
            "api_key": raw_api_key,
            "model_name": "gpt-4o-mini",
            "is_enabled": True,
            "data_disclosure_acknowledged": True,
            "timeout_seconds": 15.0,
        },
        headers=headers,
    )
    assert res.status_code == 201, res.text
    data = res.json()
    integ_id = data["id"]

    # 2. Verify raw API key is NEVER returned in response
    assert raw_api_key not in str(data)
    assert "api_key" not in data
    assert "encrypted_api_key" not in data
    assert data["masked_key"] == "sk-••••••••cdef"

    # 3. List integrations: also returns masked key only
    list_res = client.get("/api/v1/integrations", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) >= 1
    assert raw_api_key not in str(items)

    # 4. Another user cannot access or test this integration
    other_headers = _auth_user("other_user@example.com")
    other_res = client.get(f"/api/v1/integrations", headers=other_headers)
    assert all(i["id"] != integ_id for i in other_res.json())

    # 5. Revoke / delete integration
    del_res = client.delete(f"/api/v1/integrations/{integ_id}", headers=headers)
    assert del_res.status_code == 204
