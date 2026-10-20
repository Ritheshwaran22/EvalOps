"""Deterministic evaluation primitives; no provider calls occur in this module."""
import json, re, time
from enum import Enum
from jsonschema import validate as validate_schema, ValidationError as SchemaError


class TestStatus(str, Enum):
    PASSED = "passed"
    FAILED = "failed"
    INCONCLUSIVE = "inconclusive"
    ERROR = "error"


class RunStatus(str, Enum):
    COMPLETED = "completed"
    INCONCLUSIVE = "inconclusive"
    FAILED = "failed"


class RegressionStatus(str, Enum):
    NO_BASELINE = "no_baseline"
    UNCHANGED = "unchanged"
    REGRESSION = "regression"
    IMPROVEMENT = "improvement"
    INCONCLUSIVE = "inconclusive"


def estimate_tokens(text: str) -> int:
    """Rough word/punctuation estimate, explicitly not provider-reported usage."""
    return max(1, len(re.findall(r"\w+|[^\w\s]", text))) if text else 0


def run_checks(actual: str | None, expected: str | None, criteria: list[dict], latency_ms: float | None = None) -> dict:
    checks, errors = [], []
    if actual is None:
        return {
            "status": TestStatus.INCONCLUSIVE.value,
            "passed": False,
            "checks": [],
            "errors": ["No actual output was supplied. Configure a target or provide explicit outputs; EvalOps will not assume success."],
            "token_count": None,
            "token_count_kind": None,
        }

    def record(name, ok, detail=""):
        checks.append({"name": name, "passed": bool(ok), "detail": detail})
        if not ok:
            errors.append(f"{name}: {detail or 'check failed'}")

    for criterion in criteria or []:
        kind = criterion.get("type", "")
        if kind == "exact_match":
            target = criterion.get("value", expected)
            record("exact_match", target is not None and actual.strip() == str(target).strip(), f"expected {target!r}, got {actual!r}")
        elif kind == "contains":
            needle = str(criterion.get("value", ""))
            record("contains", needle.casefold() in actual.casefold(), f"required content {needle!r}")
        elif kind == "not_contains":
            needle = str(criterion.get("value", ""))
            record("not_contains", needle.casefold() not in actual.casefold(), f"forbidden content {needle!r}")
        elif kind == "required_fields":
            try:
                data = json.loads(actual)
                fields = criterion.get("fields", [])
                missing = [f for f in fields if f not in data] if isinstance(data, dict) else fields
                record("required_fields", isinstance(data, dict) and not missing, f"missing fields: {missing}" if missing else "")
            except (json.JSONDecodeError, TypeError):
                record("required_fields", False, "output is not a JSON object")
        elif kind == "json_schema":
            try:
                data = json.loads(actual)
                validate_schema(instance=data, schema=criterion.get("schema", {}))
                record("json_schema", True)
            except (json.JSONDecodeError, SchemaError, TypeError) as exc:
                record("json_schema", False, str(exc)[:500])
        elif kind == "max_tokens":
            limit = int(criterion.get("value", 0))
            count = estimate_tokens(actual)
            record("max_tokens", limit > 0 and count <= limit, f"estimated {count} tokens; limit {limit}")
        elif kind == "max_latency_ms":
            limit = float(criterion.get("value", 0))
            record(
                "max_latency_ms",
                latency_ms is not None and limit > 0 and latency_ms <= limit,
                "target latency unavailable; provide latency_ms" if latency_ms is None else f"measured {latency_ms:.1f} ms; limit {limit:.1f} ms",
            )
        else:
            record(f"unsupported:{kind or 'missing_type'}", False, "unknown criterion type")

    passed = bool(checks) and all(c["passed"] for c in checks)
    status = TestStatus.PASSED.value if passed else TestStatus.FAILED.value
    return {
        "status": status,
        "passed": passed,
        "checks": checks,
        "errors": errors,
        "token_count": estimate_tokens(actual),
        "token_count_kind": "estimated",
    }


def compare_regression(current_passed: bool, baseline_passed: bool | None, current_latency_ms: float | None,
                       baseline_latency_ms: float | None, latency_regression_pct: float = 50.0) -> str:
    """Compare a test's current result against its baseline result.
    
    Returns 'regression', 'improvement', 'unchanged', or 'inconclusive' if baseline was None.
    """
    if baseline_passed is None:
        return RegressionStatus.INCONCLUSIVE.value
    if baseline_passed and not current_passed:
        return RegressionStatus.REGRESSION.value
    if not baseline_passed and current_passed:
        return RegressionStatus.IMPROVEMENT.value
    if (
        current_latency_ms is not None
        and baseline_latency_ms
        and baseline_latency_ms > 0
        and current_latency_ms > baseline_latency_ms * (1 + latency_regression_pct / 100)
    ):
        return RegressionStatus.REGRESSION.value
    return RegressionStatus.UNCHANGED.value


def evaluate_cases(cases: list[dict], outputs: dict[str, str] | None = None, baseline: dict[str, dict] | None = None,
                   gate_config: dict | None = None) -> dict:
    started = time.perf_counter()
    results = []
    outputs = outputs or {}
    baseline = baseline or {}
    gate_config = gate_config or {}

    for case in cases:
        name = case["name"]
        actual = outputs.get(str(case.get("id", name)), case.get("actual_output"))
        latency = case.get("latency_ms")
        check = run_checks(actual, case.get("expected_output"), case.get("criteria", []), latency)
        base = baseline.get(str(case.get("id", name))) or baseline.get(name) or {}
        regression = compare_regression(
            check["passed"],
            base.get("passed"),
            latency,
            base.get("latency_ms"),
            float(gate_config.get("latency_regression_pct", 50)),
        )
        results.append({
            "test_case_id": case.get("id"),
            "test_name": name,
            "status": check.get("status", TestStatus.PASSED.value if check["passed"] else TestStatus.FAILED.value),
            "passed": check["passed"],
            "input_text": case.get("input_text", ""),
            "expected_output": case.get("expected_output"),
            "actual_output": actual,
            "checks": check["checks"],
            "errors": check["errors"],
            "latency_ms": latency,
            "token_count": check["token_count"],
            "token_count_kind": check["token_count_kind"],
            "regression": regression,
            "baseline_passed": base.get("passed"),
        })

    duration = (time.perf_counter() - started) * 1000
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed
    has_missing_actual = any(r["actual_output"] is None for r in results)

    reasons = []
    if total == 0:
        reasons.append("No test cases were configured.")
    if has_missing_actual:
        reasons.append("At least one test case has no actual output supplied.")
    if gate_config.get("no_critical_failures", True) and failed:
        reasons.append(f"{failed} test case(s) failed.")
    min_pass_rate = float(gate_config.get("min_pass_rate", 1.0))
    if total and passed / total < min_pass_rate:
        reasons.append(f"Pass rate {passed/total:.1%} is below required {min_pass_rate:.1%}.")
    max_latency = gate_config.get("max_latency_ms")
    if max_latency is not None and any(r["latency_ms"] is not None and r["latency_ms"] > float(max_latency) for r in results):
        reasons.append(f"At least one case exceeded the {max_latency} ms latency limit.")
    if max_latency is not None and any(r["actual_output"] is not None and r["latency_ms"] is None for r in results):
        reasons.append("Latency gate is configured but target latency was not supplied for every case.")
    max_tokens = gate_config.get("max_tokens")
    if max_tokens is not None and any(r["token_count"] is not None and r["token_count"] > int(max_tokens) for r in results):
        reasons.append(f"At least one case exceeded the {max_tokens} token budget (estimates unless provider usage is configured).")

    run_status = RunStatus.INCONCLUSIVE.value if (has_missing_actual or total == 0) else RunStatus.COMPLETED.value
    gate_passed = bool(total and not reasons and not has_missing_actual)

    return {
        "status": run_status,
        "total": total,
        "passed": passed,
        "failed": failed,
        "duration_ms": duration,
        "gate_passed": gate_passed,
        "gate_reasons": reasons,
        "results": results,
    }
