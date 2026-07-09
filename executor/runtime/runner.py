"""Bootstrap an untrusted judge script with no inherited secrets."""

import os
import sys
import json  # Preloaded before filesystem access is denied.
import re  # Preloaded before filesystem access is denied.
import typing  # Preloaded before filesystem access is denied.

MAX_SCRIPT_BYTES = 131_072
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
    script = sys.stdin.buffer.read(MAX_SCRIPT_BYTES + 1)
    if len(script) > MAX_SCRIPT_BYTES:
        raise ValueError("Judge script exceeds sandbox limit")

    os.environ.clear()
    sys.addaudithook(deny_sensitive_operations)
    compiled = compile(script, "<judge>", "exec")
    exec(compiled, {"__name__": "__main__", "__builtins__": __builtins__})


if __name__ == "__main__":
    main()
