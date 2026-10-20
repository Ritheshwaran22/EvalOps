import os
os.environ["DATABASE_URL"] = "sqlite:///./test_evalops.db"
from fastapi.testclient import TestClient
from evalops.api import app

client = TestClient(app)

def test_register_and_login_flow():
    email = "auth_flow_user@example.com"
    pwd = "SecurePassword123!"

    # 1. Register
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": pwd, "full_name": "Auth Tester"})
    assert reg.status_code == 201, reg.text
    data = reg.json()
    assert data["user"]["email"] == email
    token = data["token"]
    assert len(token) > 20

    # 2. Cannot register with duplicate email
    dup = client.post("/api/v1/auth/register", json={"email": email, "password": pwd})
    assert dup.status_code == 400

    # 3. Login with wrong password yields generic 401 error
    bad_login = client.post("/api/v1/auth/login", json={"email": email, "password": "WrongPassword!"})
    assert bad_login.status_code == 401
    assert "Invalid email or password" in bad_login.json()["detail"]

    # 4. Login with non-existent email yields identical generic 401 error (no user enumeration)
    non_existent = client.post("/api/v1/auth/login", json={"email": "nobody@example.com", "password": "WrongPassword!"})
    assert non_existent.status_code == 401
    assert "Invalid email or password" in non_existent.json()["detail"]

    # 5. Login with correct credentials
    good_login = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert good_login.status_code == 200
    new_token = good_login.json()["token"]

    # 6. Access protected route with Bearer token
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert me.status_code == 200
    assert me.json()["email"] == email

    # 7. Access without auth returns 401
    fresh_client = TestClient(app)
    unauth = fresh_client.get("/api/v1/projects")
    assert unauth.status_code == 401

    # 8. Logout revokes token
    logout = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {new_token}"})
    assert logout.status_code == 200

    # 9. Revoked token can no longer access protected endpoints
    after_logout = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert after_logout.status_code == 401
