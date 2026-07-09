# Isolated Code Executor

This internal service is the only component permitted to create code-sandbox
containers. It must never be published to the internet or share a network with
the frontend.

## Required production controls

1. Install and configure the gVisor `runsc` OCI runtime on a dedicated Linux
   worker node. Keep `SANDBOX_RUNTIME=runsc` and
   `SANDBOX_ALLOW_NATIVE_RUNTIME=false`.
2. Generate `SANDBOX_EXECUTOR_TOKEN` with at least 32 random bytes and inject it
   into the backend and executor through the deployment secret store.
3. Build the pinned runtime image before accepting jobs. Keep image pulling
   disabled during execution.
4. Restrict Docker-socket access to the executor service. Do not mount the
   socket into the public API or sandbox containers.
5. Monitor executor saturation, timeouts, forced container removals, Docker
   daemon errors, memory pressure, and unexpected container lifetimes.
6. Regularly rebuild and scan both images while reviewing base-image digest
   updates.

Native `runc` can be enabled only for explicit local testing. It is not the
recommended boundary for hostile multi-tenant code. For stronger tenant
isolation, deploy the same broker contract on Firecracker microVM workers and
remove Docker-socket access entirely.
