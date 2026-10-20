import os
os.environ["DATABASE_URL"] = "sqlite:///./test_evalops.db"
from fastapi.testclient import TestClient
from evalops.api import app

client = TestClient(app)

def _create_user(email: str, pwd: str = "Password123!") -> str:
    res = client.post("/api/v1/auth/register", json={"email": email, "password": pwd, "full_name": "Test User"})
    if res.status_code == 201:
        return res.json()["token"]
    login = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    return login.json()["token"]

def test_workspace_isolation_and_idor_prevention():
    token_alice = _create_user("alice@example.com")
    token_bob = _create_user("bob@example.com")

    headers_alice = {"Authorization": f"Bearer {token_alice}"}
    headers_bob = {"Authorization": f"Bearer {token_bob}"}

    # 1. Alice creates a project
    p_alice = client.post(
        "/api/v1/projects",
        json={"name": "Alice Private Project", "description": "Confidential", "config": {}},
        headers=headers_alice,
    )
    assert p_alice.status_code == 201
    alice_proj_id = p_alice.json()["id"]

    # Alice adds a test case
    case_alice = client.post(
        f"/api/v1/projects/{alice_proj_id}/test-cases",
        json={"name": "Alice Test Case", "input_text": "secret prompt", "expected_output": "secret output", "criteria": [{"type": "exact_match"}]},
        headers=headers_alice,
    )
    assert case_alice.status_code == 201
    alice_case_id = case_alice.json()["id"]

    # Alice creates a run
    run_alice = client.post(
        f"/api/v1/projects/{alice_proj_id}/runs",
        json={"trigger": "manual", "outputs": {str(alice_case_id): "secret output"}},
        headers=headers_alice,
    )
    assert run_alice.status_code == 201
    alice_run_id = run_alice.json()["id"]

    # 2. Bob lists projects: Bob must NOT see Alice's project
    bobs_projects = client.get("/api/v1/projects", headers=headers_bob).json()
    assert all(p["id"] != alice_proj_id for p in bobs_projects)

    # 3. IDOR: Bob attempts direct GET on Alice's project -> 403 Forbidden
    res_get = client.get(f"/api/v1/projects/{alice_proj_id}", headers=headers_bob)
    assert res_get.status_code == 403

    # 4. IDOR: Bob attempts PATCH on Alice's project -> 403
    res_patch = client.patch(f"/api/v1/projects/{alice_proj_id}", json={"name": "Hacked by Bob"}, headers=headers_bob)
    assert res_patch.status_code == 403

    # 5. IDOR: Bob attempts DELETE on Alice's project -> 403
    res_del = client.delete(f"/api/v1/projects/{alice_proj_id}", headers=headers_bob)
    assert res_del.status_code == 403

    # 6. IDOR: Bob attempts to list or create test cases in Alice's project -> 403
    res_case_list = client.get(f"/api/v1/projects/{alice_proj_id}/test-cases", headers=headers_bob)
    assert res_case_list.status_code == 403

    res_case_post = client.post(
        f"/api/v1/projects/{alice_proj_id}/test-cases",
        json={"name": "Bob Injected Case", "input_text": "attack", "expected_output": "none"},
        headers=headers_bob,
    )
    assert res_case_post.status_code == 403

    # 7. IDOR: Bob attempts to update or delete Alice's test case -> 403
    res_case_patch = client.patch(f"/api/v1/test-cases/{alice_case_id}", json={"name": "Bob Defaced"}, headers=headers_bob)
    assert res_case_patch.status_code == 403

    res_case_delete = client.delete(f"/api/v1/test-cases/{alice_case_id}", headers=headers_bob)
    assert res_case_delete.status_code == 403

    # 8. IDOR: Bob attempts to view or execute runs on Alice's project -> 403
    res_run_post = client.post(f"/api/v1/projects/{alice_proj_id}/runs", json={"trigger": "manual"}, headers=headers_bob)
    assert res_run_post.status_code == 403

    res_run_get = client.get(f"/api/v1/runs/{alice_run_id}", headers=headers_bob)
    assert res_run_get.status_code == 403

    res_run_results = client.get(f"/api/v1/runs/{alice_run_id}/results", headers=headers_bob)
    assert res_run_results.status_code == 403

    res_run_delete = client.delete(f"/api/v1/runs/{alice_run_id}", headers=headers_bob)
    assert res_run_delete.status_code == 403

    # 9. IDOR: Bob attempts to delete Alice's project data -> 403
    res_data_del = client.delete(f"/api/v1/projects/{alice_proj_id}/data", headers=headers_bob)
    assert res_data_del.status_code == 403

    # 10. Verify Alice's project and data remain intact
    alice_check = client.get(f"/api/v1/projects/{alice_proj_id}", headers=headers_alice)
    assert alice_check.status_code == 200
    assert alice_check.json()["name"] == "Alice Private Project"
