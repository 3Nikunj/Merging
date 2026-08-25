# AiValytics Session Changelog — 2026-08-24

Last updated: 2026-08-24

This document captures all changes and integrations made during the development session from **August 7, 2026 to August 24, 2026**. It lists the commits, issues resolved, and features introduced by each developer.

---

## 1. Developer: Ajitabh Kumar Jha

### 📄 Feature: Real Resume Text Extraction
* **Problem**: The student's resume upload feature on the AI Interview setup page was simulated. It populated hardcoded candidate skills and experience text regardless of the file uploaded.
* **Solution**: Developed a real backend text extraction service using standard document parsing libraries.
* **Backend changes (`backend/app/services/resume_extraction_service.py` [NEW])**:
  * Created extraction handlers supporting both **PDF** (via `pypdf.PdfReader`) and **DOCX** (via `docx.Document`) files.
  * Enforced file validation rules: rejecting files larger than **5MB** (matching frontend guidelines) or empty files.
  * Added character boundary truncation at **8,000 characters** to ensure parsed content fits cleanly within LLM prompts downstream without crashing prompt limits.
  * **Route (`backend/app/api/routes/ai_interviews.py`)**: Added `POST /api/ai-interviews/resume/extract` requiring authentication to accept uploads, run extraction, and return plain text.
* **Frontend changes (`frontend/src/pages/student/AiInterview/AiInterviewDashboard.tsx` & `frontend/src/services/api.ts`)**:
  * Added `api.extractResumeText(file)` to communicate with the new backend extraction service.
  * Added file-type validation (blocking non-PDF/DOCX) and file-size validation on selection.
  * Connected dashboard state to show load indicators ("Extracting resume content details...") and render real text or upload error logs in case of failure.

### 🎙️ Feature: AI Interview Speech Recognition & Mic Resilience
* **Problem**: 
  * The Web Speech recognition engine ended transcription on brief natural pauses, triggering premature auto-submissions.
  * The microphone defaulted to off, causing recording to silently fail to start.
  * Uncaught errors during `rec.start()` caused a permanent deadlock where the mic appeared "on" but did not record audio.
* **Solution**: Improved transcription accumulation, added silence grace periods, and hardened microphone start/recovery loops.
* **Frontend changes (`frontend/src/pages/student/AiInterview/AiInterviewRoom.tsx`)**:
  * **Silence Grace Period**: Added a `SILENCE_TIMEOUT_MS = 3000` grace timer. When a user pauses, the speech recognition engine restarts silently under the hood. It accumulates words inside `accumulatedTranscriptRef.current` and only submits the answer if the user remains quiet for a full 3 seconds.
  * **Mic Crash Protection**: Wrapped `rec.start()` in a try-catch block. If the browser throws a start error (e.g., previous session resources are not fully released), the handler cleans up locks and retries after a 500ms backoff instead of crashing.
  * **User-Facing Mic Fail Warning**: Created `noSpeechWarning` state. If the microphone registers 3 consecutive blank/no-speech cycles, a warning banner is shown: *"We can't hear you. Check that your mic isn't muted..."*

### 🔒 Feature: Coding Sandbox Security Hardening
* **Problem**: The `/api/coding/run` endpoint (used by Code Arena to compile/execute student solutions in the sandbox) was callable anonymously.
* **Solution**: Secured the route by adding the `current_user_id` authenticated user dependency.
* **Backend changes (`backend/app/api/routes/coding.py`)**:
  * Modified `execute_code()` to require `current_user_id: AuthenticatedUserId` as a route dependency, blocking unauthorized execution.

### 🤖 Feature: LLM Model Migration
* **Problem**: The Groq API model `llama-3.3-70b-versatile` was deprecated by Groq on June 17, 2026.
* **Solution**: Migrated core evaluation prompts to a modern model.
* **Backend changes (`backend/app/services/ai_interview_service.py`)**:
  * Updated standard chat streaming and JSON feedback evaluation models to use `openai/gpt-oss-120b`, ensuring response consistency.

---

## 2. Developer: Nikunj Sondawale

### 📊 Feature: Practice Test Results Breakdown & Review Modal
* **Problem**: The practice test results breakdown displayed simple correct/incorrect counts. Students could not see the actual questions, their answers, correct options, or explanations.
* **Solution**: Expanded the test attempt flow to record and display granular review details.
* **Backend changes (`backend/app/services/attempt_service.py` & `backend/app/schemas/analytics.py`)**:
  * **Results Schema**: Expanded schemas to include `options` arrays, `selected_option_id`, `correct_option_id`, and `explanation` metadata for each question in the test review payload.
  * **Metadata Parser**: Modified `AttemptService` to fetch question descriptions, list options, determine correct ids, and parse question-level explanations (falling back to a structured default explanation template if missing).
  * **Subtopic Performance Breakdown**: Refactored the results breakdown array. Instead of displaying generic "Correct/Incorrect" metrics, it now groups questions by their subtopic category and dynamically calculates percentage mastery scores.
* **Frontend changes (`frontend/src/pages/student/Results/ResultsPage.tsx`, `frontend/src/types/testFlow.ts` & `frontend/src/services/api.ts`)**:
  * **Interactive Explanation Modal**: Added an overlay modal triggered by clicking "View Explanation". It displays the full question prompt, all options styled contextually (e.g. green borders for correct choices, red for selected wrong options), and the explanation text.
  * **Downloadable PDF Report**: Hooked up the "Download Result" button to trigger `window.print()` to allow student to save or print their scorecard.
  * **Dynamic Radial Score**: Bounded the conic-gradient circle backdrop of the score container to read the dynamic `result.overallScore` rather than static percentages.

### 🌐 Feature: Production Orchestration & Deployment Guides
* **Problem**: The monorepo had no production container configuration or deployment blueprint.
* **Solution**: Wrote production Caddy/Docker scripts and created guides for a $0.00/month deployment model.
* **Orchestration changes**:
  * Created [Caddyfile](file:///d:/AiValytics%20Docs/Merging/Caddyfile) to manage HTTPS routing, static client directories, API proxying, and CORS headers.
  * Created [docker-compose.prod.yml](file:///d:/AiValytics%20Docs/Merging/docker-compose.prod.yml) defining optimized multi-stage images, memory limits, and read-only filesystems for production containers.
  * Created [render.yaml](file:///d:/AiValytics%20Docs/Merging/render.yaml) mapping backend Docker web instances and static frontend sites automatically on Render Cloud.
* **Documentation additions**:
  * Created [docs/deployment_strategy.md](file:///d:/AiValytics%20Docs/Merging/docs/deployment_strategy.md) describing blueprint setup and Oracle Cloud free VM configurations.
  * Created [docs/student_features_and_seeding.md](file:///d:/AiValytics%20Docs/Merging/docs/student_features_and_seeding.md) explaining student modules and DB seed routines.
  * Updated [docs/project_context_summary.md](file:///d:/AiValytics%20Docs/Merging/docs/project_context_summary.md).

---

## 3. Developer: yashaivalytics-droid

### 🎨 Feature: Interactive Client Topbar & Sign Out Flow
* **Problem**: The student workspace had static placeholder user headers without real settings, profile loading, or logout buttons.
* **Solution**: Implemented interactive topbar elements for testing auth routing locally.
* **Frontend changes (`frontend/src/data/testFlow.ts`)**:
  * Added topbar states loading mock user profile data and initials.
  * Created a settings gear menu toggle revealing a "Logout" action.
  * Attached click events triggering Supabase signOut methods and redirecting users back to the login screen.

### 🐛 Bug Fix: Vite Dev Server Crash
* **Problem**: A missing comma and closing brace in `testFlow.ts` caused local Vite builds to crash on reload.
* **Solution**: Patched the syntax layout in `testFlow.ts`, restoring normal dev server compilation.
