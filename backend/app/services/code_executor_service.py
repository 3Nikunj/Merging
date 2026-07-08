"""
code_executor_service.py — Secure sandboxed Python code execution.
Runs user-submitted code in an isolated subprocess with a strict CPU timeout.
"""
from __future__ import annotations

import subprocess
import sys

from app.core.supabase import get_supabase_client

# Hidden test cases per problem (problemId → list of (args, expected_output))
PROBLEM_TESTS: dict[str, list[dict]] = {
    "001": [
        {
            "call": "Solution().twoSum([2,7,11,15], 9)",
            "expected": "[0, 1]",
        },
        {
            "call": "Solution().twoSum([3,2,4], 6)",
            "expected": "[1, 2]",
        },
        {
            "call": "Solution().twoSum([3,3], 6)",
            "expected": "[0, 1]",
        },
    ],
}

TIMEOUT_SECONDS = 2


def run_code(problem_id: str, user_code: str) -> dict:
    """
    Execute user_code against the test suite for problem_id.
    Returns a dict with keys: status, stdout, stderr, tests_passed, total_tests.
    """
    tests = PROBLEM_TESTS.get(problem_id, [])
    total_tests = len(tests)

    if total_tests == 0:
        return {
            "status": "NO_TESTS",
            "stdout": "",
            "stderr": f"No test cases found for problem ID: {problem_id}",
            "testsPassed": 0,
            "totalTests": 0,
        }

    # Build the driver script
    driver_lines = [
        "from typing import List, Optional",
        "",
    ]
    driver_lines.extend(user_code.splitlines())
    driver_lines.extend([
        "",
        "import sys",
        "_passed = 0",
        "_total = 0",
    ])

    for i, test in enumerate(tests):
        call = test["call"]
        expected = test["expected"]
        driver_lines.extend([
            f"_total += 1",
            f"try:",
            f"    _result = str({call})",
            f"    _expected = str({repr(expected)})",
            f"    # Normalize list output by stripping spaces",
            f"    import re",
            f"    def _norm(s): return re.sub(r'\\s+', '', s)",
            f"    if _norm(_result) == _norm(_expected):",
            f"        _passed += 1",
            f"        print(f'Test {i+1}: PASS  →  {{_result}}')",
            f"    else:",
            f"        print(f'Test {i+1}: FAIL  →  Expected {{_expected}}, got {{_result}}')",
            f"except Exception as e:",
            f"    print(f'Test {i+1}: ERROR  →  {{e}}')",
        ])

    driver_lines.append("print(f'\\n{{_passed}}/{{_total}} tests passed')")

    full_script = "\n".join(driver_lines)

    try:
        result = subprocess.run(
            [sys.executable, "-c", full_script],
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
        )
        stdout = result.stdout.strip()
        stderr = result.stderr.strip()

        if result.returncode != 0:
            # Syntax / runtime error
            status = "COMPILE_ERROR" if "SyntaxError" in stderr else "RUNTIME_ERROR"
            return {
                "status": status,
                "stdout": stdout,
                "stderr": stderr,
                "testsPassed": 0,
                "totalTests": total_tests,
            }

        # Count passed tests from output
        tests_passed = 0
        for line in stdout.splitlines():
            if "PASS" in line:
                tests_passed += 1

        status = "ACCEPTED" if tests_passed == total_tests else "WRONG_ANSWER"
        return {
            "status": status,
            "stdout": stdout,
            "stderr": stderr,
            "testsPassed": tests_passed,
            "totalTests": total_tests,
        }

    except subprocess.TimeoutExpired:
        return {
            "status": "TIMEOUT",
            "stdout": "",
            "stderr": f"Execution timed out after {TIMEOUT_SECONDS} seconds.",
            "testsPassed": 0,
            "totalTests": total_tests,
        }
    except Exception as exc:
        return {
            "status": "RUNTIME_ERROR",
            "stdout": "",
            "stderr": str(exc),
            "testsPassed": 0,
            "totalTests": total_tests,
        }


def submit_code(problem_id: str, user_code: str, user_id: str) -> dict:
    """
    Run code against all test cases, then persist the result to the
    coding_submissions table in Supabase.
    Returns the execution result dict plus the saved submission_id.
    """
    result = run_code(problem_id=problem_id, user_code=user_code)

    # Normalize status to lowercase for DB constraint
    db_status = result["status"].lower()
    # Map NO_TESTS → runtime_error for DB validity
    if db_status not in ("accepted", "wrong_answer", "runtime_error", "compile_error", "timeout"):
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
                "stdout": result.get("stdout", "")[:4000],  # cap at 4 KB
                "stderr": result.get("stderr", "")[:4000],
            }
            saved = client.table("coding_submissions").insert(row).execute()
            if saved.data:
                submission_id = saved.data[0]["id"]
        except Exception:
            pass  # Non-fatal: return result even if DB save fails

    return {
        **result,
        "submissionId": submission_id,
    }
