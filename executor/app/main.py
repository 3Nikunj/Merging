"""Internal broker for disposable, resource-limited code containers."""

from __future__ import annotations

import secrets
import subprocess
import threading
import uuid
from dataclasses import dataclass
from typing import BinaryIO

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    executor_token: SecretStr = Field(alias="SANDBOX_EXECUTOR_TOKEN")
    sandbox_image: str = Field(
        default="aivalytics-python-sandbox:local",
        alias="SANDBOX_IMAGE",
    )
    sandbox_runtime: str = Field(default="runsc", alias="SANDBOX_RUNTIME")
    allow_native_runtime: bool = Field(
        default=False,
        alias="SANDBOX_ALLOW_NATIVE_RUNTIME",
    )
    max_concurrent: int = Field(
        default=4,
        ge=1,
        le=32,
        alias="SANDBOX_MAX_CONCURRENT",
    )
    max_output_bytes: int = Field(default=65_536, ge=1024, le=1_048_576)

    model_config = SettingsConfigDict(extra="ignore")


class ExecutionRequest(BaseModel):
    script: str = Field(min_length=1, max_length=131_072)
    timeout_seconds: float = Field(
        default=2.0,
        ge=0.5,
        le=10.0,
        alias="timeoutSeconds",
    )


class ExecutionResponse(BaseModel):
    exit_code: int | None = Field(serialization_alias="exitCode")
    stdout: str
    stderr: str
    timed_out: bool = Field(serialization_alias="timedOut")


@dataclass(frozen=True)
class ProcessOutput:
    exit_code: int | None
    stdout: str
    stderr: str
    timed_out: bool


class DockerSandbox:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._slots = threading.BoundedSemaphore(settings.max_concurrent)

    def build_command(self, container_name: str) -> list[str]:
        runtime = self.settings.sandbox_runtime.strip()
        if runtime in {"", "runc"} and not self.settings.allow_native_runtime:
            raise RuntimeError("A strong sandbox runtime is required")

        command = [
            "docker",
            "run",
            "--rm",
            "--pull=never",
            f"--name={container_name}",
            "--network=none",
            "--read-only",
            "--cap-drop=ALL",
            "--security-opt=no-new-privileges:true",
            "--pids-limit=1",
            "--memory=64m",
            "--memory-swap=64m",
            "--cpus=0.50",
            "--ulimit=nofile=32:32",
            "--ulimit=nproc=1:1",
            "--stop-timeout=1",
            "--log-driver=none",
            "--user=65532:65532",
            "--workdir=/sandbox",
            "--tmpfs=/tmp:rw,noexec,nosuid,nodev,size=16m,mode=700",
        ]
        if runtime:
            command.append(f"--runtime={runtime}")
        command.append(self.settings.sandbox_image)
        return command

    def execute(self, request: ExecutionRequest) -> ProcessOutput:
        if not self._slots.acquire(blocking=False):
            raise HTTPException(status_code=429, detail="Executor is at capacity")

        container_name = f"aivalytics-job-{uuid.uuid4().hex}"
        try:
            return self._run_container(
                self.build_command(container_name),
                container_name,
                request,
            )
        finally:
            self._slots.release()

    def _run_container(
        self,
        command: list[str],
        container_name: str,
        request: ExecutionRequest,
    ) -> ProcessOutput:
        try:
            process = subprocess.Popen(
                command,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
        except OSError as exc:
            raise HTTPException(
                status_code=503,
                detail="Container runtime is unavailable",
            ) from exc

        stdout = bytearray()
        stderr = bytearray()
        readers = [
            threading.Thread(
                target=self._drain,
                args=(process.stdout, stdout),
                daemon=True,
            ),
            threading.Thread(
                target=self._drain,
                args=(process.stderr, stderr),
                daemon=True,
            ),
        ]
        for reader in readers:
            reader.start()

        assert process.stdin is not None
        try:
            process.stdin.write(request.script.encode("utf-8"))
            process.stdin.close()
        except (BrokenPipeError, OSError):
            pass

        timed_out = False
        try:
            process.wait(timeout=request.timeout_seconds)
        except subprocess.TimeoutExpired:
            timed_out = True
            self._remove_container(container_name)
            process.kill()
            process.wait(timeout=2)

        for reader in readers:
            reader.join(timeout=2)

        return ProcessOutput(
            exit_code=None if timed_out else process.returncode,
            stdout=stdout.decode("utf-8", errors="replace"),
            stderr=stderr.decode("utf-8", errors="replace"),
            timed_out=timed_out,
        )

    def _drain(
        self,
        stream: BinaryIO | None,
        destination: bytearray,
    ) -> None:
        if stream is None:
            return
        while chunk := stream.read(4096):
            remaining = self.settings.max_output_bytes - len(destination)
            if remaining > 0:
                destination.extend(chunk[:remaining])

    @staticmethod
    def _remove_container(container_name: str) -> None:
        try:
            subprocess.run(
                ["docker", "rm", "--force", container_name],
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=5,
                check=False,
            )
        except (OSError, subprocess.TimeoutExpired):
            pass


settings = Settings()
sandbox = DockerSandbox(settings)
app = FastAPI(title="AiValytics Internal Sandbox Executor", docs_url=None)


def _authenticate(token: str | None) -> None:
    expected = settings.executor_token.get_secret_value()
    if not token or not secrets.compare_digest(token, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/execute", response_model=ExecutionResponse)
def execute(
    request: ExecutionRequest,
    x_sandbox_token: str | None = Header(default=None),
) -> ExecutionResponse:
    _authenticate(x_sandbox_token)
    output = sandbox.execute(request)
    return ExecutionResponse(
        exit_code=output.exit_code,
        stdout=output.stdout,
        stderr=output.stderr,
        timed_out=output.timed_out,
    )
