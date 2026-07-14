# AiValytics Admin and AI Interview Handoff

Last updated: 2026-07-14

This document captures the current implementation state of the project, including the completed AI Interview Simulator feature and the Admin workspace modules.

## Current Local Runtime

- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8000`
- Backend health endpoint verified: `/api/health`
- Admin test account created earlier:
  - Email: `test.admin@aivalytics.com`
  - Password: `AiValyticsAdmin@123`
- Student test account created earlier:
  - Email: `test.student@aivalytics.com`
  - Password: `AiValyticsStudent@123`

## Admin Work Completed

### Admin Shell

The admin side was visually refined around the existing AiValytics theme and color scheme. The sidebar, topbar, page headers, panels, and responsive behavior were improved in the existing admin styling system.

Main files touched:

- `frontend/src/components/admin/AdminLayout.tsx`
- `frontend/src/styles/admin-styles.css`
- `frontend/src/pages/admin/OverviewPage.tsx`

### Batches Section

The Admin Batches page was rebuilt into a production-style workspace.

Implemented features:

- Create batches under colleges.
- Create/open college workspaces.
- Add students individually.
- Bulk upload students via `.xlsx`, `.xls`, or `.csv`.
- Download spreadsheet template.
- Validate required import fields.
- Supported student fields include:
  - Email
  - Full name
  - Roll number
  - College
  - Department
  - Year of graduation
  - Phone
  - 10th percentage
  - 12th percentage
  - Graduation CGPA
  - Backlogs
  - Gap years
  - Gap during graduation
  - Status
  - Temporary password

Main files touched:

- `frontend/src/pages/admin/BatchesPage.tsx`
- `frontend/src/styles/admin-styles.css`
- `frontend/package.json`
- `frontend/package-lock.json`

Note: `xlsx` was added for spreadsheet parsing and template generation. Vite now warns about a large JS chunk because of this dependency.

### Question Bank Section

The Question Bank was rebuilt as a taxonomy-first content management system.

Implemented frontend features:

- Taxonomy tree for `Subject -> Topic -> Subtopic`.
- Search, question type filter, and status filter.
- Guided MCQ and Coding question editor.
- Publish-readiness validation.
- Bulk `.xlsx`, `.xls`, and `.csv` import preview.
- Downloadable import template.
- Audit Center for content and test mismatches.
- Existing data currently surfaced:
  - `17` questions
  - `0` content issues
  - `9` test mismatches

Implemented backend guardrails:

- Canonical question statuses:
  - `draft`
  - `review`
  - `published`
  - `archived`
- `active` is normalized to `published` for backward compatibility.
- Published questions require a complete taxonomy path.
- Topic must belong to subject.
- Subtopic must belong to topic.
- If a subtopic is selected, backend canonicalizes/validates parent topic and subject.
- Active tests cannot attach non-published questions.
- Test/question taxonomy mismatches are blocked for new attachments.
- Added audit endpoint:
  - `GET /admin/questions/audit`

Main files touched:

- `backend/app/api/routes/admin.py`
- `frontend/src/pages/admin/QuestionBankPage.tsx`
- `frontend/src/types/admin.ts`
- `frontend/src/styles/admin-styles.css`
- `frontend/package.json`
- `frontend/package-lock.json`

Verification completed:

- `npm run build` passes.
- Python compile check passes for admin backend routes.
- Backend OpenAPI includes `/admin/questions/audit`.
- Browser check showed the rebuilt Question Bank page with no runtime errors.

Known note:

- Existing database already has `9` test/question mismatches. The Audit Center surfaces them. Next admin repair step would be fixing those records or adding migration/repair tooling.

### AI Interview Simulator (Completed Implementation)

The student-side AI Interview Simulator has been fully implemented. It acts as a realistic verbal interview training simulator with scoring, feedback correction, session logging, dashboard history, and strong prompt injection guardrails.

## Feature Architecture

### 1. Interview Modes & Session Setup

- **Custom Profile**: Students configure their target company, target position, seniority level (Internship, Entry Level, Mid-Level, Senior Level), interview type (Technical, Behavioral, HR Screening, Managerial, Mixed), and difficulty (Beginner, Intermediate, Advanced).
- **Job Description (JD) Based**: Students paste target job descriptions to dynamically generate and customize questions targeting the key skills, roles, and responsibilities.
- **Voice & Accent Selection**: Dynamically maps configuration options (British/US, Male/Female) to the user's local browser OS English voices.
- **Optional Resume Integration**: Supports pasting resume highlights or uploading a resume (simulated text extractor details: extraction maps candidate profile, skills, and years of experience).

### 2. Interactive Live Interview Room

- **AI Voice Agent Visuals**: A Jarvis-inspired, custom futuristic visual interface built in React/CSS:
  - Futuristic central glowing AI orb with breathing animation (`orb-breathe`).
  - Active voice-reactive rings rotating clockwise/counterclockwise (`ring-spin-cw`, `ring-spin-ccw`) when listening or speaking.
  - Active audio waves/ripples (`ripple`) reflecting the state.
- **Interviewer States**: Listening, Thinking, Speaking, and Idle.
- **Webcam Integration**: Real-time browser webcam feed rendered on the right side using browser `getUserMedia` (privacy-first: strictly displays local preview, no video is sent to or saved on the backend).
- **Interactive Control Actions**:
  - *End/Hang up* session.
  - *Repeat question* (triggers immediate backend TTS playback).
  - *Skip question* (logs 0 score for active question turn, provides transition response, moves forward).
  - *Text mode fallback* (allows manually typing answers instead of vocal speech).
- **Voice Loop Implementation**:
  - **Speech-to-Text (STT)**: Native browser `SpeechRecognition` (Web Speech API) captures student answers in real-time with visual mic volume meters. Autocommits answer on pause.
  - **Text-to-Speech (TTS)**: Native browser `SpeechSynthesis` API utilizing candidate's OS voice engines (Microsoft, Google, Apple) with 0ms server latency and gapless paragraph playback.

### 3. Dynamic Evaluation & Scoring Rubric

- Powered by Groq API's `llama-3.3-70b-versatile` with low latency (<500ms response time).
- Implements a strict, backend-controlled evaluation loop.
- **Marking Rubric**: Questions are evaluated out of 100 on a multi-dimensional scale:
  - Relevance to question (20%)
  - Technical/domain accuracy (20%)
  - Communication clarity (15%)
  - Structure of answer (STAR/Concept framework) (15%)
  - Resume/JD alignment (10%)
  - Confidence and professionalism (10%)
  - Depth, metrics, and evidence (10%)
- **Actionable Correction**:
  - For each turn, the AI evaluates strengths, mistakes (e.g. logical leaps), missing keywords, and compiles a **corrected framework answer** (STAR format or Concept-Example-Tradeoff) custom-tailored to the student's background.
  - Decision loop dynamically determines if a follow-up query is needed or moves to the next new topic.
- **Anti-Misuse Protection**:
  - State is strictly maintained in the database.
  - The model system prompts enforce evaluation roles and refuse prompt injections, meta-commentary, or unrelated coding/text tasks.

### 4. Database Schema (Supabase Migrations)

Implemented tables in [supabase/migrations/add_ai_interview.sql](file:///d:/AiValytics%20Docs/Merging/supabase/migrations/add_ai_interview.sql):
- **`ai_interview_sessions`**: Stores student session configurations (company, position, accent, mode, JD, status, overall score).
- **`ai_interview_turns`**: Stores each question-response turn, transcript, scores, mistakes, missing keywords, feedback, corrected answers, and follow-up flags.
- **`ai_interview_reports`**: Stores summary reports, lists of strengths/weaknesses, practice recommendations, and dashboard metrics.
- **Security & RLS**: All tables have Row Level Security enabled. Policies limit access to student owners (`auth.uid() = student_id`) and admin roles (`is_admin()`). Direct anon/authenticated browser privileges are revoked, funneling all modifications through the backend router.

### 5. Backend Endpoints Summary

Registered in [backend/app/api/router.py](file:///d:/AiValytics%20Docs/Merging/backend/app/api/router.py):
- `POST /api/ai-interviews`: Creates a new interview session.
- `POST /api/ai-interviews/{session_id}/start`: Activates session and retrieves the first question.
- `POST /api/ai-interviews/{session_id}/answer`: Submits verbal response, processes LLM evaluation, and returns next question/action.
- `POST /api/ai-interviews/{session_id}/skip`: Skips current question, logging zero score, and moves to next turn.
- `POST /api/ai-interviews/{session_id}/complete`: Finishes session, aggregates overall scores, and generates the final evaluation report.
- `GET /api/ai-interviews/history`: Returns student's historical session list.
- `GET /api/ai-interviews/summary`: Retrieves aggregated student statistics (average scores, strongest/weakest areas, and recent score trends).
- `GET /api/ai-interviews/{session_id}/report`: Retrieves complete session report cards, turns, feedback, and corrected answers.

---

## Verification & Testing Summary

### Automated Tests
- End-to-end endpoint tests implemented in [test_ai_interview.py](file:///d:/AiValytics%20Docs/Merging/backend/tests/test_ai_interview.py).
- Verified mock settings fallback, creation, setup, and submission flows.
- Running command `python -m unittest tests/test_ai_interview.py` succeeds:
  ```text
  Ran 4 tests in 0.046s
  OK
  ```

### Manual & Build Verification
- Vite production build compile check passed:
  ```text
  npm run build
  vite v8.0.14 building client environment for production...
  built in 3.57s
  ```
- RLS Policies and compiler compatibility checks verified.
- Direct router bindings and FastAPI middleware compilation checked.
