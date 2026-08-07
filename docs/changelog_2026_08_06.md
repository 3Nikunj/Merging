# AiValytics Session Changelog — 2026-08-06

Last updated: 2026-08-06

This document captures all changes made during the August 6, 2026 development session covering admin question bank improvements, company mapping, UI polish, and practice test bug fixes.

---

## 1. Admin Question Bank — Dynamic Company Mapping

### Problem
The admin panel had hardcoded company checkboxes (Capgemini, TCS, Accenture, Infosys, Cognizant, Wipro) for mapping questions to company simulation drives. Admins could not add new companies or see a growing list of company partners.

### Solution
Replaced the static checkbox grid with a fully dynamic company management system.

### Database Changes
- **Migration file**: `supabase/migrations/add_companies_schema.sql`
- Seeded default companies (`Capgemini`, `TCS`, `Accenture`, `Infosys`, `Cognizant`, `Wipro`) into the existing `companies` table using `ON CONFLICT` upsert.
- Created `question_companies` join table with foreign keys referencing `companies(slug)` and `questions(id)`, both with `ON DELETE CASCADE`.
- Enabled RLS with read-all and admin-write policies.

### Backend Changes (`backend/app/api/routes/admin.py`)
- **`GET /admin/companies`**: Returns all registered companies sorted alphabetically, mapping internal `slug` to `id` for frontend consistency.
- **`POST /admin/companies`**: Accepts a new company name, auto-generates a URL-safe slug (e.g. `Microsoft` → `microsoft`), checks uniqueness, inserts it into the database, and returns the new record.

### Frontend Changes
- **`frontend/src/services/api.ts`**: Added `api.getCompanies()` and `api.createCompany(name)` client methods.
- **`frontend/src/pages/admin/QuestionBankPage.tsx`**:
  - Fetches company list from database on page load.
  - Renders mapped companies as removable tags (click `×` to unmap).
  - Provides a `<select>` dropdown listing all unmapped companies for quick selection.
  - Includes an inline text input + "Add" button to create new companies on-the-fly (also triggered by pressing Enter). The new company is immediately registered in the database, added to the dropdown, and auto-mapped to the current question.
  - Company names are resolved and displayed in the Content Queue list (instead of raw slugs).

---

## 2. Admin UI Layout Fixes

### Problem
- The Edit and Delete buttons in the Content Queue question cards were vertically stretched to fill the full height of the card, creating a visually broken layout.
- The Taxonomy tree panel (Subjects → Topics → Subtopics) had no expand/collapse behavior — all nodes were always visible with no interactivity on the chevron icons.

### Solution

#### Content Queue Card Layout (`frontend/src/styles/admin-styles.css`)
- Changed `.question-row` from a two-column grid to `position: relative; display: block;`, allowing question content to span the full card width.
- Absolutely positioned `.question-row .action-row` at `top: 14px; right: 14px;`, pinning Edit/Delete buttons to the top-right corner.
- Added `padding-right: 140px;` to `.question-row-main strong` to prevent title text from overlapping the buttons.

#### Taxonomy Tree Expand/Collapse (`frontend/src/pages/admin/QuestionBankPage.tsx`)
- Added `expandedSubjects` and `expandedTopics` state maps.
- Subject nodes now toggle their child topics on click; topic nodes toggle their child subtopics.
- Chevron icons dynamically switch between `ChevronRight` (collapsed) and `ChevronDown` (expanded).
- Imported `ChevronDown` from `lucide-react`.

---

## 3. Practice Test Feature — Wrong Questions Bug Fix

### Problem
When a student selected **Coding → Data Structures → Arrays** and started a test, the system served aptitude/number-theory questions instead of coding questions. After submitting, the results page failed to load.

### Root Cause Investigation

| Layer | Issue |
|-------|-------|
| **Database constraint** | `questions_status_check` only allowed `['draft', 'active', 'archived']`. The status `'published'` (used by the adaptive engine filter) was rejected by the constraint, so no questions could be published. |
| **Question status** | All 17 questions in the database had `status = 'draft'`. The adaptive question engine in `attempt_service.py` filters by `status = 'published'`, finding zero candidates. |
| **Silent fallback** | When the DB query returned no questions, `attempt_service.py` caught the `ValueError` and silently fell back to hardcoded mock aptitude questions from `mock_data.py` — giving the user wrong-subject questions with no error. |
| **Result page crash** | Mock attempt data is stored in-memory Python dicts. After container restart or on submit, the attempt ID couldn't be found, causing 404 errors on the results endpoint. |

### Fixes Applied

#### Database
- Updated `questions_status_check` constraint to allow: `['draft', 'review', 'published', 'active', 'archived']`.
- Seeded 2 published MCQ questions under **Coding → Data Structures → Arrays** (`status = 'published'`) with 4 options each.

#### Backend (`backend/app/services/attempt_service.py`)
- **`start_attempt()`**: Now validates that:
  1. The requested test ID exists in the `tests` table (returns 404 if not).
  2. There are published questions matching the test's `subject_id` + `topic_id` (returns 400 with message *"This practice test does not have any published questions yet"* if not).
  - Errors are raised as `HTTPException` instead of being silently swallowed.
- **`get_questions()`**: Changed `raise ValueError(...)` to `raise HTTPException(status_code=400, ...)` when the question pool is exhausted, so the frontend receives a clear error.

#### Frontend (`frontend/src/pages/student/TestSelection/TestSelectionPage.tsx`)
- The "Continue to Instructions" button is now disabled when the selected subtopic has `questions === 0`.
- A warning message is displayed: *"⚠️ No questions available for this subtopic yet."*

---

## 4. Authentication & Session Fix (Earlier in Session)

### Problem
The frontend was hitting `401 Unauthorized` errors on admin API calls because the `api()` fetch wrapper was not attaching the Supabase JWT access token to outgoing requests.

### Fix (`frontend/src/services/api.ts`)
- Updated the `api<T>()` function to call `supabase.auth.getSession()` on every request and attach `Authorization: Bearer <token>` to the headers.
- Added a global 401 interceptor: on any 401 response, the app clears `localStorage`, signs out of Supabase, and redirects to `/login`.

---

## Files Modified Summary

| File | Type of Change |
|------|----------------|
| `supabase/migrations/add_companies_schema.sql` | New migration file |
| `backend/app/api/routes/admin.py` | Added `/companies` GET and POST endpoints |
| `backend/app/services/attempt_service.py` | Fixed `start_attempt`, `get_questions` error handling |
| `frontend/src/services/api.ts` | Added `getCompanies`, `createCompany`; auth token attachment |
| `frontend/src/pages/admin/QuestionBankPage.tsx` | Dynamic company UI, taxonomy expand/collapse, companies state |
| `frontend/src/pages/student/TestSelection/TestSelectionPage.tsx` | Empty subtopic warning, disabled continue button |
| `frontend/src/styles/admin-styles.css` | Question card layout, button positioning, taxonomy grid |

---

## Service URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs

## Test Accounts

- **Admin**: `test.admin@aivalytics.com` / `AiValyticsAdmin@123`
- **Student**: `test.student@aivalytics.com` / `AiValyticsStudent@123`
