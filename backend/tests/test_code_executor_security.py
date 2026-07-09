import re
import unittest
from unittest.mock import patch

from app.services.code_executor_service import SandboxResponse, run_code


class CodeExecutorSecurityTests(unittest.TestCase):
    @patch("app.services.code_executor_service._execute_in_sandbox")
    def test_maps_isolated_executor_result_without_exposing_marker(
        self,
        execute_mock,
    ) -> None:
        def isolated_result(script: str) -> SandboxResponse:
            marker_match = re.search(
                r"__AIVALYTICS_RESULT_[0-9a-f]{32}__",
                script,
            )
            self.assertIsNotNone(marker_match)
            marker = marker_match.group(0)
            return SandboxResponse(
                exit_code=0,
                stdout=f"user output\n{marker}{{\"testsPassed\":3,\"totalTests\":3}}",
                stderr="",
                timed_out=False,
            )

        execute_mock.side_effect = isolated_result

        result = run_code("001", "class Solution: pass")

        self.assertEqual(result["status"], "ACCEPTED")
        self.assertEqual(result["testsPassed"], 3)
        self.assertEqual(result["stdout"], "user output")
        self.assertNotIn("AIVALYTICS_RESULT", result["stdout"])

    @patch("app.services.code_executor_service._execute_in_sandbox")
    def test_executor_failure_fails_closed(self, execute_mock) -> None:
        execute_mock.side_effect = RuntimeError("runtime unavailable")

        result = run_code("001", "print('must not run locally')")

        self.assertEqual(result["status"], "RUNTIME_ERROR")
        self.assertEqual(
            result["stderr"],
            "Secure execution service is unavailable.",
        )

    @patch("app.services.code_executor_service._execute_in_sandbox")
    def test_timeout_contract_is_preserved(self, execute_mock) -> None:
        execute_mock.return_value = SandboxResponse(
            exit_code=None,
            stdout="",
            stderr="",
            timed_out=True,
        )

        result = run_code("001", "while True: pass")

        self.assertEqual(result["status"], "TIMEOUT")
        self.assertEqual(result["testsPassed"], 0)
        self.assertEqual(result["totalTests"], 3)


if __name__ == "__main__":
    unittest.main()
