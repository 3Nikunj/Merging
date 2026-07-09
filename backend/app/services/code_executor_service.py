"""Isolated execution client and coding-submission persistence."""

from __future__ import annotations

import json
import secrets
from typing import Literal, TypedDict

import httpx
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.core.config import get_settings
from app.core.supabase import get_supabase_client

PROBLEM_TESTS: dict[str, list[dict[str, str]]] = {
    "001": [
        {"call": "Solution().twoSum([2,7,11,15], 9)", "expected": "[0, 1]"},
        {"call": "Solution().twoSum([3,2,4], 6)", "expected": "[1, 2]"},
        {"call": "Solution().twoSum([3,3], 6)", "expected": "[0, 1]"},
    ],
}

ExecutionStatus = Literal[
    "ACCEPTED",
    "WRONG_ANSWER",
    "RUNTIME_ERROR",
    "COMPILE_ERROR",
    "TIMEOUT",
    "NO_TESTS",
]


class ExecutionResult(TypedDict):
    status: ExecutionStatus
    stdout: str
    stderr: str
    testsPassed: int
    totalTests: int


class SandboxResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    exit_code: int | None = Field(alias="exitCode")
    stdout: str
    stderr: str
    timed_out: bool = Field(alias="timedOut")


def _error_result(
    status: ExecutionStatus,
    message: str,
    total_tests: int,
) -> ExecutionResult:
    return {
        "status": status,
        "stdout": "",
        "stderr": message,
        "testsPassed": 0,
        "totalTests": total_tests,
    }


def _build_driver(
    user_code: str,
    tests: list[dict[str, str]],
    marker: str,
) -> str:
    """Build a judge script with user globals separated from judge globals."""
    driver = [
        "import json as _judge_json",
        "import re as _judge_re",
        "from typing import List, Optional",
        f"_user_source = {user_code!r}",
        "_user_globals = {",
        "    '__builtins__': __builtins__,",
        "    'List': List,",
        "    'Optional': Optional,",
        "}",
        "exec(compile(_user_source, '<submission>', 'exec'), _user_globals)",
        "_passed = 0",
        "_details = []",
        "def _norm(value):",
        "    return _judge_re.sub(r'\\s+', '', str(value))",
    ]

    for index, test in enumerate(tests, start=1):
        driver.extend(
            [
                "try:",
                f"    _result = eval({test['call']!r}, _user_globals)",
                f"    _expected = {test['expected']!r}",
                "    if _norm(_result) == _norm(_expected):",
                "        _passed += 1",
                f"        _details.append('Test {index}: PASS')",
                "    else:",
                f"        _details.append('Test {index}: FAIL')",
                "except Exception as _test_error:",
                f"    _details.append('Test {index}: ERROR')",
            ]
        )

    driver.extend(
        [
            "for _detail in _details:",
            "    print(_detail)",
            f"print({marker!r} + _judge_json.dumps({{",
            "    'testsPassed': _passed,",
            f"    'totalTests': {len(tests)},",
            "}, separators=(',', ':')))",
        ]
    )
    return "\n".join(driver)


def _execute_in_sandbox(script: str) -> SandboxResponse:
    settings = get_settings()
    token = settings.sandbox_executor_token
    if not settings.sandbox_executor_url or not token:
        raise RuntimeError("Sandbox executor is not configured")

    timeout = settings.sandbox_timeout_seconds
    with httpx.Client(timeout=timeout + 5.0) as client:
        response = client.post(
            f"{settings.sandbox_executor_url.rstrip('/')}/execute",
            headers={"X-Sandbox-Token": token.get_secret_value()},
            json={"script": script, "timeoutSeconds": timeout},
        )
        response.raise_for_status()
        return SandboxResponse.model_validate(response.json())


def run_code(problem_id: str, user_code: str) -> ExecutionResult:
    """Execute code only through the isolated sandbox service."""
    tests = PROBLEM_TESTS.get(problem_id, [])
    total_tests = len(tests)
    if not tests:
        return _error_result(
            "NO_TESTS",
            f"No test cases found for problem ID: {problem_id}",
            0,
        )

    marker = f"__AIVALYTICS_RESULT_{secrets.token_hex(16)}__"
    script = _build_driver(user_code, tests, marker)

    try:
        sandbox = _execute_in_sandbox(script)
    except (httpx.HTTPError, RuntimeError, ValidationError):
        return _error_result(
            "RUNTIME_ERROR",
            "Secure execution service is unavailable.",
            total_tests,
        )

    if sandbox.timed_out:
        return _error_result(
            "TIMEOUT",
            "Execution timed out.",
            total_tests,
        )

    if sandbox.exit_code == 125:
        return _error_result(
            "RUNTIME_ERROR",
            "Secure execution service is unavailable.",
            total_tests,
        )

    stdout_lines = sandbox.stdout.splitlines()
    result_line = next(
        (line for line in reversed(stdout_lines) if line.startswith(marker)),
        None,
    )
    visible_stdout = "\n".join(
        line for line in stdout_lines if not line.startswith(marker)
    ).strip()

    if sandbox.exit_code != 0 or not result_line:
        status: ExecutionStatus = (
            "COMPILE_ERROR" if "SyntaxError" in sandbox.stderr else "RUNTIME_ERROR"
        )
        return {
            "status": status,
            "stdout": visible_stdout,
            "stderr": sandbox.stderr,
            "testsPassed": 0,
            "totalTests": total_tests,
        }

    try:
        judge_result = json.loads(result_line[len(marker) :])
        tests_passed = int(judge_result["testsPassed"])
    except (KeyError, TypeError, ValueError, json.JSONDecodeError):
        return _error_result(
            "RUNTIME_ERROR",
            "Sandbox returned an invalid result.",
            total_tests,
        )

    status = "ACCEPTED" if tests_passed == total_tests else "WRONG_ANSWER"
    return {
        "status": status,
        "stdout": visible_stdout,
        "stderr": sandbox.stderr,
        "testsPassed": tests_passed,
        "totalTests": total_tests,
    }


def submit_code(problem_id: str, user_code: str, user_id: str) -> dict:
    """Execute a submission securely, then persist its bounded result."""
    result = run_code(problem_id=problem_id, user_code=user_code)
    db_status = result["status"].lower()
    if db_status not in {
        "accepted",
        "wrong_answer",
        "runtime_error",
        "compile_error",
        "timeout",
    }:
        db_status = "runtime_error"

    submission_id: str | None = None
    client = get_supabase_client()
    if client:
        try:
            row = {
                "user_id": user_id,
                "problem_id": problem_id,
                "language": "python3",
                "code": user_code,
                "status": db_status,
                "tests_passed": result["testsPassed"],
                "total_tests": result["totalTests"],
                "stdout": result["stdout"][:4000],
                "stderr": result["stderr"][:4000],
            }
            saved = client.table("coding_submissions").insert(row).execute()
            if saved.data:
                submission_id = saved.data[0]["id"]
        except Exception:
            pass

    return {**result, "submissionId": submission_id}
