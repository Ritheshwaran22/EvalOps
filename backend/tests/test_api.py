import os
os.environ["DATABASE_URL"] = "sqlite:///./test_evalops.db"
from fastapi.testclient import TestClient
from evalops.api import app

client = TestClient(app)

def test_project_case_run_lifecycle():
    # Register and get auth token
    reg = client.post('/api/v1/auth/register', json={"email": "lifecycle@example.com", "password": "Password123!", "full_name": "Test User"})
    assert reg.status_code == 201, reg.text
    token = reg.json()['token']
    headers = {"Authorization": f"Bearer {token}"}

    p = client.post('/api/v1/projects', json={"name": "API test project", "config": {"outputs": {}, "gate": {"min_pass_rate": 1}}}, headers=headers)
    assert p.status_code == 201, p.text
    project_id = p.json()['id']

    case = client.post(f'/api/v1/projects/{project_id}/test-cases', json={"name": "exact", "input_text": "hello", "expected_output": "hello", "criteria": [{"type": "exact_match"}]}, headers=headers)
    assert case.status_code == 201, case.text

    # No configured actual output: the API must report inconclusive, never silently pass.
    run = client.post(f'/api/v1/projects/{project_id}/runs', json={"trigger": "manual"}, headers=headers)
    assert run.status_code == 201, run.text
    assert run.json()['status'] == 'inconclusive'
    assert run.json()['gate_passed'] is False

    results = client.get(f"/api/v1/runs/{run.json()['id']}/results", headers=headers)
    assert results.status_code == 200
    res = results.json()[0]
    assert res['passed'] is False
    assert res['status'] == 'inconclusive'


def test_root_and_health_endpoints():
    # 1. Root returns service information
    r_root = client.get("/")
    assert r_root.status_code == 200
    root_json = r_root.json()
    assert root_json["status"] == "ok"
    assert root_json["service"] == "evalops-api"
    assert root_json["health"] == "/api/v1/health"
    assert root_json["docs"] == "/docs"
    assert root_json["openapi"] == "/openapi.json"
    assert "database" not in root_json

    # 2. Health check runs actual health-check endpoint with database status
    r_health = client.get("/api/v1/health")
    assert r_health.status_code == 200
    health_json = r_health.json()
    assert health_json["status"] == "ok"
    assert health_json["service"] == "evalops-api"
    assert health_json["database"] == "connected"
    assert "docs" not in health_json

    # 3. OpenAPI schema endpoint
    r_openapi = client.get("/openapi.json")
    assert r_openapi.status_code == 200
    openapi_json = r_openapi.json()
    assert "openapi" in openapi_json
    assert "/api/v1/health" in openapi_json["paths"]

    # 4. Docs endpoint opens in production
    r_docs = client.get("/docs")
    assert r_docs.status_code == 200
    assert "swagger-ui" in r_docs.text.lower() or "html" in r_docs.headers.get("content-type", "")


def test_vercel_entrypoint_path_resolution():
    from api.index import app as vercel_app
    vercel_client = TestClient(vercel_app)

    # 1. Vercel rewrite with __vpath=/ (root)
    r_root = vercel_client.get("/api/index?__vpath=/")
    assert r_root.status_code == 200
    root_data = r_root.json()
    assert root_data["status"] == "ok"
    assert root_data["health"] == "/api/v1/health"
    assert "database" not in root_data

    # 2. Vercel rewrite with __vpath=/api/v1/health
    r_health = vercel_client.get("/api/index?__vpath=/api/v1/health")
    assert r_health.status_code == 200
    health_data = r_health.json()
    assert health_data["status"] == "ok"
    assert health_data["database"] == "connected"
    assert "docs" not in health_data

    # 3. Vercel rewrite with __vpath=/openapi.json
    r_openapi = vercel_client.get("/api/index?__vpath=/openapi.json")
    assert r_openapi.status_code == 200
    assert "openapi" in r_openapi.json()

    # 4. Vercel rewrite with __vpath=/docs
    r_docs = vercel_client.get("/api/index?__vpath=/docs")
    assert r_docs.status_code == 200

    # 5. Vercel rewrite with __vpath and additional query parameters
    r_runs = vercel_client.get("/api/index?__vpath=/api/v1/runs&limit=5")
    # Requires authentication, so it should return 401 Unauthorized, NOT 404 or root
    assert r_runs.status_code == 401
    assert r_runs.json()["detail"] == "Authentication required"

    # 6. Direct invocation to /api/index defaults to root
    r_direct = vercel_client.get("/api/index")
    assert r_direct.status_code == 200
    assert r_direct.json()["health"] == "/api/v1/health"

    # 7. Fallback header support (e.g. x-matched-path or x-forwarded-path)
    r_hdr = vercel_client.get("/api/index", headers={"x-forwarded-path": "/api/v1/health"})
    assert r_hdr.status_code == 200
    assert r_hdr.json()["database"] == "connected"

