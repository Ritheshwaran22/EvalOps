import argparse, json, sys
from pathlib import Path
import yaml
from .engine import evaluate_cases
from .provider import generate_output, ProviderConfigurationError, ProviderExecutionError


def load_config(path: str) -> dict:
    with open(path, encoding="utf-8") as f: data = yaml.safe_load(f)
    if not isinstance(data, dict): raise ValueError("Project config must be a YAML object")
    if not isinstance(data.get("test_cases"), list) or not data["test_cases"]: raise ValueError("Config must include a non-empty test_cases list")
    for i, case in enumerate(data["test_cases"]):
        if not isinstance(case, dict) or not case.get("name") or not case.get("input_text"): raise ValueError(f"test_cases[{i}] requires name and input_text")
        if "criteria" in case and not isinstance(case["criteria"], list): raise ValueError(f"test_cases[{i}].criteria must be a list")
    return data


def main():
    parser = argparse.ArgumentParser(prog="evalops", description="Run deterministic EvalOps evaluations")
    sub = parser.add_subparsers(dest="command", required=True)
    ev = sub.add_parser("evaluate", help="run an evaluation config")
    ev.add_argument("--project-config", required=True)
    ev.add_argument("--output-json", default="evalops-report.json")
    ev.add_argument("--github-summary", action="store_true")
    sub.add_parser("validate-config", help="validate a project YAML file").add_argument("--project-config", required=True)
    args = parser.parse_args()
    try: config = load_config(args.project_config)
    except Exception as exc: print(f"Configuration error: {exc}", file=sys.stderr); return 2
    if args.command == "validate-config": print(f"Valid config: {len(config['test_cases'])} test case(s)"); return 0
    cases = [dict(c) for c in config["test_cases"]]
    target = config.get("target")
    if target:
        # Explicit project configuration opts into provider traffic. Provider adapter also
        # requires environment credentials and a disclosure acknowledgement.
        try:
            for case in cases:
                output, latency = generate_output(case["input_text"], target)
                case["actual_output"] = output
                case["latency_ms"] = latency
        except (ProviderConfigurationError, ProviderExecutionError) as exc:
            print(f"Target execution error: {exc}", file=sys.stderr)
            return 2
    result = evaluate_cases(cases, gate_config=config.get("gate", {}), baseline=config.get("baseline", {}))
    report = {"project": config.get("project", {}).get("name", "Unnamed project"), **result}
    Path(args.output_json).write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"EvalOps: {report['project']} | status={result['status']} | passed={result['passed']}/{result['total']} | gate={'PASS' if result['gate_passed'] else 'FAIL'}")
    for item in result["results"]:
        state = "PASS" if item["passed"] else "FAIL"
        print(f"- [{state}] {item['test_name']}")
        for error in item["errors"]: print(f"    {error}")
    if args.github_summary and __import__('os').getenv("GITHUB_STEP_SUMMARY"):
        summary = [f"## EvalOps report: {report['project']}", "", f"**Gate:** {'PASS' if result['gate_passed'] else 'FAIL'}", f"**Status:** {result['status']}", f"**Cases:** {result['passed']}/{result['total']} passed", "", "| Test case | Result | Regression | Details |", "|---|---|---|---|"]
        for r in result["results"]: summary.append(f"| {r['test_name']} | {'PASS' if r['passed'] else 'FAIL'} | {r['regression']} | {'; '.join(r['errors']) or 'No failed checks'} |")
        with open(__import__('os').environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as f: f.write("\n".join(summary) + "\n")
    return 0 if result["gate_passed"] else 1

if __name__ == "__main__": raise SystemExit(main())
