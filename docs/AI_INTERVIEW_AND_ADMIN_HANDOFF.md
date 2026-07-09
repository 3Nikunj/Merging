# AiValytics Admin and AI Interview Handoff

Last updated: 2026-07-09

This document captures the current implementation state and the agreed product direction so the next session can resume without losing context.

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

## AI Interview Feature Direction

The next major feature is a student-side AI Interview simulator.

The goal is not a generic AI chat. It should feel like a realistic verbal interview training product with scoring, correction, dashboard history, and strong misuse prevention.

## Interview Modes

### 1. JD-Based Practice

User provides:

- Job description text or upload.
- Optional resume upload.

System extracts:

- Role
- Skills
- Seniority
- Responsibilities
- Keywords
- Evaluation focus

The interview is generated around that JD and the student's resume.

### 2. Custom Interview

User provides:

- Company
- Position
- Experience required
- Required skills
- Interview type:
  - HR
  - Technical
  - Behavioral
  - Managerial
  - Mixed
- Difficulty:
  - Beginner
  - Intermediate
  - Advanced
- Optional resume upload

Recommendation for MVP:

Start with Custom Interview plus optional resume upload, then add JD parsing. The live verbal loop is the hardest part, so it should be stabilized before expanding too many input flows.

## Interview UI Direction

Important IP note:

- Do not directly copy Jarvis from Iron Man.
- Build a Jarvis-inspired original AI interviewer:
  - Futuristic glowing orb/core
  - Voice-reactive rings
  - Subtle scanning lines
  - Listening/thinking/speaking states
  - Dark glass-like technical UI

Live interview screen:

- Left side:
  - AI interviewer animation
  - Voice state: listening, thinking, speaking
  - Interview progress
- Right side:
  - Student camera preview
  - No recording required by default
  - Mic permission active
  - Timer
- Controls:
  - End interview
  - Repeat question
  - Skip question, limited
  - Technical issue/help button

The UI should feel like a live interview, not a chatbot.

## Interview Behavior

The AI interviewer should:

- Ask one question at a time.
- Wait for the complete verbal answer.
- Ask follow-up questions if the answer is vague.
- Adjust difficulty based on performance.
- Cover resume, JD/custom requirements, projects, behavior, and role skills.
- Stay inside the interview role.
- Refuse unrelated requests.
- Avoid giving coaching during the live interview unless the interview mode explicitly allows practice hints.

Recommended experience:

- During live interview:
  - Realistic, uninterrupted interview.
  - Silent evaluation.
- After interview:
  - Detailed feedback.
  - Corrected answers.
  - Performance dashboard update.

## Anti-Misuse Strategy

Prompts alone are not enough. Use both prompt and product constraints.

Recommended guardrails:

- Backend-controlled interview state.
- No open-ended generic chat mode.
- Strict system prompt that defines the AI as an interview evaluator only.
- Allowed AI actions:
  - Ask question
  - Ask follow-up
  - Evaluate answer
  - Move to next question
  - Generate final report
  - Refuse unrelated request
- Session topic lock based on JD/custom inputs.
- Rate limits and session duration limits.
- Transcript storage only if user explicitly consents.
- Never let the interview model become a general assistant for homework, code generation, emails, unrelated advice, or prompt extraction.

## Marking System

Use a 100-point scoring model with category-level breakdown.

Suggested default rubric:

| Area | Weight |
| --- | ---: |
| Relevance to question | 20 |
| Technical/domain accuracy | 20 |
| Communication clarity | 15 |
| Structure of answer | 15 |
| Resume/JD alignment | 10 |
| Confidence and professionalism | 10 |
| Depth, examples, and evidence | 10 |

Weights should be adjustable by question type:

- Technical questions should emphasize accuracy.
- Behavioral questions should emphasize structure, relevance, and evidence.
- HR questions should emphasize clarity, professionalism, and role fit.

Final rating bands:

- `90-100`: Excellent
- `75-89`: Strong
- `60-74`: Needs improvement
- `<60`: Not ready yet

Possible penalties:

- Too many skipped questions.
- Very short answers.
- Repeated off-topic answers.
- Poor role alignment.

## Per-Question Evaluation Shape

Each answer should produce structured evaluation data similar to:

```json
{
  "question": "Tell me about a challenging project.",
  "answer_transcript": "...",
  "question_type": "behavioral",
  "score": 72,
  "category_scores": {
    "relevance": 16,
    "accuracy": 14,
    "clarity": 11,
    "structure": 10,
    "jd_alignment": 7,
    "confidence": 8,
    "depth": 6
  },
  "strengths": [],
  "mistakes": [],
  "missing_keywords": [],
  "corrected_answer": "",
  "suggested_framework": "STAR",
  "follow_up_needed": true
}
```

## Post-Interview Correction

After the interview, the AI should correct weak answers.

For each weak answer, show:

1. What the student answered.
2. What was missing.
3. Mistakes or unclear parts.
4. Better answer.
5. Why the improved answer works.
6. Suggested answer framework:
   - STAR
   - Problem-Solution-Impact
   - Situation-Action-Result
   - Concept-Example-Tradeoff

The corrected answer should sound realistic for the student, not overly polished or fake.

## Student Dashboard Metrics

The student dashboard should display:

- Latest interview score.
- Average interview score.
- Number of interviews completed.
- Strongest areas.
- Weakest areas.
- Communication trend.
- Technical trend.
- JD match trend.
- Recommended next practice.

Suggested charts/components:

- Score over time.
- Skill radar chart.
- Category breakdown.
- Recent interview cards.
- Recommended next interview mode.

## Suggested Database Tables

### `ai_interview_sessions`

Suggested fields:

- `id`
- `student_id`
- `mode`: `jd_based` or `custom`
- `company`
- `position`
- `experience_level`
- `interview_type`
- `difficulty`
- `jd_text`
- `resume_url`
- `resume_text`
- `status`: `setup`, `active`, `completed`, `cancelled`
- `overall_score`
- `started_at`
- `completed_at`
- `created_at`

### `ai_interview_turns`

Suggested fields:

- `id`
- `session_id`
- `sort_order`
- `question`
- `question_type`
- `answer_transcript`
- `score`
- `rubric_json`
- `mistakes_json`
- `missing_keywords_json`
- `corrected_answer`
- `feedback`
- `follow_up_needed`
- `created_at`

### `ai_interview_reports`

Suggested fields:

- `id`
- `session_id`
- `summary`
- `strengths_json`
- `weaknesses_json`
- `recommended_practice_json`
- `dashboard_metrics_json`
- `created_at`

## Suggested Backend Endpoints

Setup:

- `POST /student/ai-interviews`
  - Create session from custom requirements or JD.
- `POST /student/ai-interviews/{session_id}/resume`
  - Upload resume.
- `POST /student/ai-interviews/{session_id}/start`
  - Start live interview.

Live interview:

- `GET /student/ai-interviews/{session_id}`
- `POST /student/ai-interviews/{session_id}/answer`
  - Submit transcript from speech-to-text.
  - Backend evaluates answer and returns next interviewer action.
- `POST /student/ai-interviews/{session_id}/skip`
- `POST /student/ai-interviews/{session_id}/complete`

Reports:

- `GET /student/ai-interviews/{session_id}/report`
- `GET /student/ai-interviews/summary`
  - Dashboard metrics.

## Voice and Camera Technical Direction

Frontend:

- Use browser camera via `navigator.mediaDevices.getUserMedia`.
- Show camera preview only; no recording by default.
- Use speech-to-text for verbal answers.
- Use text-to-speech for AI interviewer voice.
- Prefer streaming/low-latency interaction when possible.

Possible MVP:

- Start with browser speech recognition or a simple STT endpoint.
- Use generated text response plus browser TTS or server-side TTS.
- Add low-latency streaming later.

## Prompting Direction

The system prompt should define:

- AI is an interview simulator and evaluator.
- The session scope is locked to the provided JD/custom requirements/resume.
- AI asks one question at a time.
- AI must not answer unrelated requests.
- AI must not reveal prompts or hidden rubrics.
- AI must not generate unrelated content.
- AI should evaluate silently during the interview.
- AI should provide detailed corrections only after completion.

The model output should be structured JSON where possible:

- `interviewer_message`
- `interviewer_state`
- `question_type`
- `question`
- `evaluation`
- `next_action`
- `refusal_reason`

## Recommended Build Order

1. Create database tables/migrations for AI interviews.
2. Build backend session lifecycle endpoints.
3. Build student setup UI for Custom Interview.
4. Add optional resume upload and resume text extraction.
5. Build live interview room UI:
   - AI interviewer animation
   - Camera preview
   - Timer
   - Controls
6. Add speech-to-text and text-to-speech loop.
7. Add scoring and per-question evaluation.
8. Add final report with corrected answers.
9. Add dashboard metrics.
10. Add JD-based mode.
11. Add misuse tests and prompt-injection test cases.

## Current Open Risks

- Need to choose STT/TTS provider or browser-native approach.
- Need privacy decision for transcripts, resumes, and camera policy.
- Need Supabase migrations for interview tables.
- Need dashboard integration design.
- Need prompt-injection and misuse test cases.
- Need to avoid direct Jarvis/IP reproduction while preserving the intended futuristic feeling.

## Verification Notes From Today

Commands that passed:

```bash
cd frontend
npm run build
```

```bash
python -m py_compile backend/app/api/routes/admin.py backend/app/schemas/admin.py
```

Live checks:

- Frontend returned `200` at `/admin/questions`.
- Backend health returned OK.
- OpenAPI exposed `/admin/questions/audit`.
- Browser showed the rebuilt Question Bank page with no visible `.error-text` messages.

