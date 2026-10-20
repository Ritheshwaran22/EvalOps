from evalops.engine import run_checks, compare_regression, evaluate_cases

def test_exact_match_passes():
    result = run_checks("Paris", "Paris", [{"type": "exact_match"}])
    assert result["passed"] and result["checks"][0]["passed"]

def test_exact_match_fails():
    result = run_checks("Lyon", "Paris", [{"type": "exact_match"}])
    assert not result["passed"] and result["errors"]

def test_json_schema_and_fields():
    actual = '{"name":"Ada","age":3}'
    result = run_checks(actual, None, [{"type":"required_fields","fields":["name"]},{"type":"json_schema","schema":{"type":"object","required":["age"],"properties":{"age":{"type":"integer"}}}}])
    assert result["passed"]

def test_missing_output_never_passes():
    result = run_checks(None, "expected", [{"type":"exact_match"}])
    assert not result["passed"] and "No actual output" in result["errors"][0]

def test_baseline_classifications():
    assert compare_regression(False, True, 10, 10) == "regression"
    assert compare_regression(True, False, 10, 10) == "improvement"
    assert compare_regression(True, None, 10, None) == "inconclusive"

def test_gate_fails_for_missing_outputs():
    result = evaluate_cases([{"name":"x","input_text":"hello","expected_output":"hi","criteria":[{"type":"exact_match"}]}])
    assert result["status"] == "inconclusive" and not result["gate_passed"]

def test_gate_passes_with_explicit_output():
    result = evaluate_cases([{"id":1,"name":"x","input_text":"hello","expected_output":"hi","criteria":[{"type":"exact_match"}]}], outputs={"1":"hi"})
    assert result["status"] == "completed" and result["gate_passed"]
