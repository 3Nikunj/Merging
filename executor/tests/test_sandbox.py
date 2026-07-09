import io
import os
import unittest

os.environ.setdefault("SANDBOX_EXECUTOR_TOKEN", "unit-test-token")

from executor.app.main import DockerSandbox, Settings  # noqa: E402
from executor.runtime.runner import deny_sensitive_operations  # noqa: E402


class SandboxCommandTests(unittest.TestCase):
    def test_command_enforces_isolation_controls(self) -> None:
        sandbox = DockerSandbox(
            Settings(
                SANDBOX_EXECUTOR_TOKEN="unit-test-token",
                SANDBOX_RUNTIME="runsc",
            )
        )

        command = sandbox.build_command("fixed-generated-name")

        required = {
            "--network=none",
            "--read-only",
            "--cap-drop=ALL",
            "--security-opt=no-new-privileges:true",
            "--pids-limit=1",
            "--memory=64m",
            "--memory-swap=64m",
            "--cpus=0.50",
            "--log-driver=none",
            "--runtime=runsc",
        }
        self.assertTrue(required.issubset(set(command)))
        self.assertFalse(any("submission" in argument for argument in command))

    def test_native_runtime_is_rejected_by_default(self) -> None:
        sandbox = DockerSandbox(
            Settings(
                SANDBOX_EXECUTOR_TOKEN="unit-test-token",
                SANDBOX_RUNTIME="runc",
                SANDBOX_ALLOW_NATIVE_RUNTIME=False,
            )
        )

        with self.assertRaises(RuntimeError):
            sandbox.build_command("fixed-generated-name")

    def test_output_is_capped_while_stream_is_drained(self) -> None:
        sandbox = DockerSandbox(
            Settings(
                SANDBOX_EXECUTOR_TOKEN="unit-test-token",
                SANDBOX_RUNTIME="runsc",
                max_output_bytes=1024,
            )
        )
        destination = bytearray()

        sandbox._drain(io.BytesIO(b"x" * 8192), destination)

        self.assertEqual(len(destination), 1024)

    def test_runtime_audit_policy_denies_sensitive_operations(self) -> None:
        for event in (
            "open",
            "socket.connect",
            "subprocess.Popen",
            "os.fork",
            "ctypes.dlopen",
        ):
            with self.subTest(event=event):
                with self.assertRaises(PermissionError):
                    deny_sensitive_operations(event, ())


if __name__ == "__main__":
    unittest.main()
