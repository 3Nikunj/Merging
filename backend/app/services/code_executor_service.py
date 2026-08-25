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
        {"call": "Solution().twoSum([2,7,11,15], 9)", "expected": "[0, 1]", "input_desc": "nums = [2,7,11,15], target = 9"},
        {"call": "Solution().twoSum([3,2,4], 6)", "expected": "[1, 2]", "input_desc": "nums = [3,2,4], target = 6"},
        {"call": "Solution().twoSum([3,3], 6)", "expected": "[0, 1]", "input_desc": "nums = [3,3], target = 6"},
    ],
    "002": [
        {"call": "Solution().addTwoNumbers(to_list([2,4,3]), to_list([5,6,4]))", "expected": "[7, 0, 8]", "input_desc": "l1 = [2,4,3], l2 = [5,6,4]"},
    ],
    "003": [
        {"call": "Solution().lengthOfLongestSubstring('abcabcbb')", "expected": "3", "input_desc": "s = 'abcabcbb'"},
    ],
    "004": [
        {"call": "Solution().findMedianSortedArrays([1,3], [2])", "expected": "2.0", "input_desc": "nums1 = [1,3], nums2 = [2]"},
    ],
    "005": [
        {"call": "Solution().longestPalindrome('babad')", "expected": "bab", "input_desc": "s = 'babad'"},
    ],
    "006": [
        {"call": "Solution().convert('PAYPALISHIRING', 3)", "expected": "PAHNAPLSIIGYIR", "input_desc": "s = 'PAYPALISHIRING', numRows = 3"},
    ],
    "007": [
        {"call": "Solution().reverse(123)", "expected": "321", "input_desc": "x = 123"},
    ],
    "008": [
        {"call": "Solution().myAtoi('42')", "expected": "42", "input_desc": "s = '42'"},
    ],
    "009": [
        {"call": "Solution().isPalindrome(121)", "expected": "True", "input_desc": "x = 121"},
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


def _build_structured_payload(
    problem_id: str,
    user_code: str,
    language: str,
    marker: str,
) -> dict:
    from app.services.language_drivers.registry import get_driver
    tests = PROBLEM_TESTS.get(problem_id, [])
    driver = get_driver(language)
    return driver.build_payload(problem_id, user_code, marker, tests)


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


def run_code(problem_id: str, user_code: str, language: str = "python3") -> ExecutionResult:
    """Execute code only through the isolated sandbox service."""
    tests = PROBLEM_TESTS.get(problem_id, [])
    total_tests = len(tests)

    marker = f"__AIVALYTICS_RESULT_{secrets.token_hex(16)}__"
    payload = _build_structured_payload(problem_id, user_code, language, marker)
    script = json.dumps(payload)

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
    visible_stdout = "\n".join(
        line for line in stdout_lines if not line.startswith(marker)
    ).strip()

    if not tests:
        # If there are no test cases, we verify compilation and syntax
        if sandbox.exit_code != 0:
            status: ExecutionStatus = "RUNTIME_ERROR"
            if (
                "SyntaxError" in sandbox.stderr
                or "Compilation Error" in sandbox.stderr
                or "error:" in sandbox.stderr.lower()
                or "java:" in sandbox.stderr.lower()
            ):
                status = "COMPILE_ERROR"
            return {
                "status": status,
                "stdout": visible_stdout,
                "stderr": sandbox.stderr,
                "testsPassed": 0,
                "totalTests": 0,
            }
        else:
            return {
                "status": "ACCEPTED",
                "stdout": visible_stdout or "Compilation and syntax verification succeeded.",
                "stderr": sandbox.stderr,
                "testsPassed": 0,
                "totalTests": 0,
            }

    result_line = next(
        (line for line in reversed(stdout_lines) if line.startswith(marker)),
        None,
    )

    if sandbox.exit_code != 0 or not result_line:
        status: ExecutionStatus = "RUNTIME_ERROR"
        if (
            "SyntaxError" in sandbox.stderr
            or "Compilation Error" in sandbox.stderr
            or "error:" in sandbox.stderr.lower()
            or "java:" in sandbox.stderr.lower()
        ):
            status = "COMPILE_ERROR"
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


def submit_code(problem_id: str, user_code: str, user_id: str, language: str = "python3") -> dict:
    """Execute a submission securely, then persist its bounded result."""
    result = run_code(problem_id=problem_id, user_code=user_code, language=language)
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
                "language": language,
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
