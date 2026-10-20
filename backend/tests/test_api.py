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
