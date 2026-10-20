import os
os.environ["DATABASE_URL"] = "sqlite:///./test_evalops.db"
from fastapi.testclient import TestClient
from evalops.api import app

client = TestClient(app)

def _auth(email: str) -> dict:
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": "Password123!", "full_name": "Eval Tester"})
    token = reg.json()["token"] if reg.status_code == 201 else client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"}).json()["token"]
    return {"Authorization": f"Bearer {token}"}

def test_exact_match_and_baseline_regression_flow():
    headers = _auth("eval_status_user@example.com")

    # 1. Create project with strict 100% pass rate gate
    proj_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Delivery Time Assistant",
            "description": "Deterministic check suite for customer delivery times",
            "config": {"gate": {"no_critical_failures": True, "min_pass_rate": 1.0}},
        },
        headers=headers,
    )
    assert proj_res.status_code == 201
    proj_id = proj_res.json()["id"]

    # 2. Add test case
    case_res = client.post(
        f"/api/v1/projects/{proj_id}/test-cases",
        json={
            "name": "Delivery Time Check",
            "input_text": "How long does delivery take?",
            "expected_output": "Delivery takes 3–5 business days.",
            "criteria": [{"type": "exact_match"}],
        },
        headers=headers,
    )
    assert case_res.status_code == 201
    case_id = case_res.json()["id"]

    # 3. Successful Run (Baseline candidate)
    # Expected: "Delivery takes 3–5 business days."
    # Actual: "Delivery takes 3–5 business days."
    run1_res = client.post(
        f"/api/v1/projects/{proj_id}/runs",
        json={
            "trigger": "manual",
            "outputs": {str(case_id): "Delivery takes 3–5 business days."},
        },
        headers=headers,
    )
    assert run1_res.status_code == 201
    run1 = run1_res.json()
    assert run1["status"] == "completed"
    assert run1["gate_passed"] is True
    assert run1["passed"] == 1
    assert run1["failed"] == 0

    results1 = client.get(f"/api/v1/runs/{run1['id']}/results", headers=headers).json()
    assert len(results1) == 1
    # Test result status is 'passed', NOT inconclusive!
    assert results1[0]["status"] == "passed"
    assert results1[0]["passed"] is True
    assert results1[0]["regression"] == "inconclusive"  # baseline was not provided for this run

    # 4. Failed Run with Run 1 as Baseline (Regression detection)
    # Actual: "Delivery takes 30–50 business days." (incorrect)
    run2_res = client.post(
        f"/api/v1/projects/{proj_id}/runs",
        json={
            "trigger": "manual",
            "baseline_run_id": run1["id"],
            "outputs": {str(case_id): "Delivery takes 30–50 business days."},
        },
        headers=headers,
    )
    assert run2_res.status_code == 201
    run2 = run2_res.json()
    assert run2["status"] == "completed"
    assert run2["gate_passed"] is False  # Gate must fail!
    assert run2["passed"] == 0
    assert run2["failed"] == 1

    results2 = client.get(f"/api/v1/runs/{run2['id']}/results", headers=headers).json()
    assert len(results2) == 1
    assert results2[0]["status"] == "failed"
    assert results2[0]["passed"] is False
    assert results2[0]["baseline_passed"] is True
    # Successfully classified as a REGRESSION from baseline!
    assert results2[0]["regression"] == "regression"

    # 5. Verify regressions endpoint reports this regression
    regs = client.get(f"/api/v1/projects/{proj_id}/regressions", headers=headers).json()
    assert len(regs) >= 1
    assert regs[0]["test_name"] == "Delivery Time Check"
    assert regs[0]["baseline_passed"] is True
    assert regs[0]["current_passed"] is False

    # 6. Missing actual output must be inconclusive
    run3_res = client.post(
        f"/api/v1/projects/{proj_id}/runs",
        json={"trigger": "manual"},  # No output supplied
        headers=headers,
    )
    assert run3_res.status_code == 201
    run3 = run3_res.json()
    assert run3["status"] == "inconclusive"
    assert run3["gate_passed"] is False

    results3 = client.get(f"/api/v1/runs/{run3['id']}/results", headers=headers).json()
    assert results3[0]["status"] == "inconclusive"
    assert results3[0]["passed"] is False

    # 7. Delete individual run
    del_run = client.delete(f"/api/v1/runs/{run3['id']}", headers=headers)
    assert del_run.status_code == 204

    # 8. Data deletion endpoint retains project configuration
    del_data = client.delete(f"/api/v1/projects/{proj_id}/data", headers=headers)
    assert del_data.status_code == 200
    assert del_data.json()["deleted"] is True

    # Project still exists
    p_check = client.get(f"/api/v1/projects/{proj_id}", headers=headers)
    assert p_check.status_code == 200
    assert p_check.json()["name"] == "Delivery Time Assistant"
