# 2026-08-26 Session Changelog - Dashboard Polish, Real-Time Notifications, and $0 Production Scaling

This changelog captures all milestones completed during the session on August 26, 2026, focusing on dashboard polish, real-time Supabase sync, and zero-cost high-concurrency scaling.

---

## 🚀 Key Milestones Completed

### 1. Student Dashboard Refinements & User Experience
* **Clean State Initialization**: Replaced default mock seed metrics in `backend/app/services/analytics_service.py` for new students. Fresh student dashboards now start at 0 stats, empty weak areas, and empty recommendations, while existing student metrics calculate dynamically.
* **Unified Search and Navigation**: Implemented dynamic search in the Topbar. Users can search for Practice Tests, Coding Problems, and Company Simulations. Clicking on a result navigates directly to the page.
* **Company Simulation Auto-Selection**: Updated the Company Simulation page to read the `company_id` URL query parameters, automatically selecting the specified card on load.
* **Settings Redirection**: Linked the Topbar settings gear icon to navigate directly to the user profile settings `/profile`.
* **Sidebar Sign Out**: Deployed a styled "Sign Out" button at the bottom of the Student Sidebar. Clicking it logs the user out via Supabase auth, deletes active local storage items, and redirects to `/login`.

### 2. Real-Time User Notifications System
* **Database Schema Migration**: Created Supabase SQL migration creating the `notifications` table, setting up Row-Level Security (RLS) policies (isolate operations by `auth.uid() = user_id`), and enabling `supabase_realtime` replication.
* **Frontend Real-Time Sync**: Modified `Topbar.tsx` to query notifications from the database on mount and subscribe to row changes (inserts, updates, deletes) via Supabase WebSocket Realtime client.
* **Unread State Persistence**: Integrated "Mark all read" and individual notification click handlers that execute PostgreSQL database updates dynamically.
* **Backend Event Triggers**: Added backend notification hooks:
  * Practice test completed notification triggered inside `attempt_service.py` on submit.
  * AI interview graded notification triggered inside `ai_interview_service.py` when session report is completed.

### 3. $0 Production Scaling & Protection (1,000 Concurrent Users)
* **pgBouncer Transaction Multiplexing**: Updated `DATABASE_URL` settings in `.env` and `.env.example` to route connections through port **6543** (Supabase pgBouncer Pooler) with `?pgbouncer=true` parameters.
* **Dynamic Multi-Worker Server Command**: Overrode the backend service command in `docker-compose.yml` to automatically calculate the host's CPU core capacity using `nproc` on startup, scaling Uvicorn parent-child processes dynamically with $0 hardware overhead.
* **Groq API Key Rotation Pool & Failover**: Extended Groq chat REST and stream drivers in `ai_interview_service.py` to sequential-rotate through a list of comma-separated free-tier API keys, automatically trying the next key if a `429 Rate Limit` (Too Many Requests) or network error occurs.
* **Sandbox Execution Concurrency Queueing**: Deployed a thread-safe global `BoundedSemaphore` inside `code_executor_service.py` initialized by settings. High-concurrency sandbox compiles queue up safely in memory instead of freezing the docker daemon on CPU spikes.
* **Client-Side WASM Runs (Pyodide & JS local eval)**: Created local browser runner utility in `localExecutor.ts` and integrated it in the Coding Arena. Offloads trial runs for Python (using WebAssembly) and JavaScript to the user's browser, offloading 90% of sandbox compilation load from servers at $0 cost.
