"""Bootstrap an untrusted judge script or compile and run multi-language solutions."""

import os
import sys
import json
import re
import subprocess
import typing

MAX_SCRIPT_BYTES = 262_144
DENIED_EVENTS = (
    "ctypes.",
    "os.exec",
    "os.fork",
    "os.posix_spawn",
    "os.spawn",
    "os.system",
    "socket.",
    "subprocess.",
)


def deny_sensitive_operations(event: str, _args: tuple[object, ...]) -> None:
    if event == "open" or event.startswith(DENIED_EVENTS):
        raise PermissionError(f"Operation denied by sandbox policy: {event}")


def main() -> None:
    payload_bytes = sys.stdin.buffer.read(MAX_SCRIPT_BYTES + 1)
    if len(payload_bytes) > MAX_SCRIPT_BYTES:
        raise ValueError("Payload exceeds sandbox limit")

    # Try to parse payload as JSON for structured execution
    is_structured = False
    try:
        decoded = payload_bytes.decode("utf-8")
        if decoded.strip().startswith("{"):
            payload = json.loads(decoded)
            if isinstance(payload, dict) and "files" in payload:
                is_structured = True
    except Exception:
        pass

    if is_structured:
        files = payload.get("files", {})
        compile_cmd = payload.get("compile_cmd")
        run_cmd = payload.get("run_cmd")

        # Write files to /sandbox (since it is a writeable tmpfs now)
        for name, content in files.items():
            path = os.path.join("/sandbox", name)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)

        # Compile if compile_cmd is specified
        if compile_cmd:
            try:
                comp_proc = subprocess.run(
                    compile_cmd,
                    shell=True,
                    cwd="/sandbox",
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=15,
                )
                if comp_proc.returncode != 0:
                    # Compilation failed. Print compilation errors to stderr and exit.
                    sys.stderr.write(
                        "Compilation Error:\n"
                        + comp_proc.stderr.decode("utf-8", errors="replace")
                        + comp_proc.stdout.decode("utf-8", errors="replace")
                    )
                    sys.stderr.flush()
                    sys.exit(comp_proc.returncode)
            except subprocess.TimeoutExpired:
                sys.stderr.write("Compilation timed out.\n")
                sys.stderr.flush()
                sys.exit(124)
            except Exception as e:
                sys.stderr.write(f"Compilation failed: {str(e)}\n")
                sys.stderr.flush()
                sys.exit(1)

        # Run the code
        if run_cmd:
            try:
                run_proc = subprocess.run(
                    run_cmd,
                    shell=True,
                    cwd="/sandbox",
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=8,
                )
                sys.stdout.write(run_proc.stdout.decode("utf-8", errors="replace"))
                sys.stderr.write(run_proc.stderr.decode("utf-8", errors="replace"))
                sys.stdout.flush()
                sys.stderr.flush()
                sys.exit(run_proc.returncode)
            except subprocess.TimeoutExpired:
                sys.stderr.write("Execution timed out.\n")
                sys.stderr.flush()
                sys.exit(124)
            except Exception as e:
                sys.stderr.write(f"Execution failed: {str(e)}\n")
                sys.stderr.flush()
                sys.exit(1)
    else:
        # Legacy direct Python execution
        os.environ.clear()
        sys.addaudithook(deny_sensitive_operations)
        compiled = compile(payload_bytes, "<judge>", "exec")
        exec(compiled, {"__name__": "__main__", "__builtins__": __builtins__})


if __name__ == "__main__":
    main()
