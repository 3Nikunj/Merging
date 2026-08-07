# AiValytics Unified Platform

An integrated, production-grade monorepo combining the **Student Portal** (timed assessments, coding arena, simulation tools) and the **Admin Portal** (CMS for question authors, taxonomy management, batch and user seeding) into a cohesive full-stack application.

---

## 🏗️ Project Architecture & Structure

This repository is organized as a monorepo containing the following directory structure:

```text
├── backend/                  # FastAPI Python backend service
│   ├── app/
│   │   ├── api/              # Student API and Admin CMS routers
│   │   ├── auth/             # Session RBAC middleware guards
│   │   ├── core/             # Configuration settings and Supabase clients
│   │   ├── schemas/          # Consolidated Pydantic models
│   │   └── services/         # Business logic layer
│   └── requirements.txt      # Combined backend package dependencies
│
├── frontend/                 # React 19 TypeScript client application
│   ├── src/
│   │   ├── components/       # Scoped layout components (student, admin, shared)
│   │   ├── pages/            # View pages divided by role domains
│   │   ├── services/         # Consolidated API clients & Supabase Auth bindings
│   │   ├── styles/           # Nested CSS assets (Tailwind + Scoped Admin CMS)
│   │   └── types/            # TypeScript type definitions
│   └── package.json          # Vite 8 package config
│
├── supabase/                 # Database initialization and mock data
│   ├── schema.sql            # Unified schema DDL (RLS policies, profiles, taxonomy)
│   └── seed.sql              # Relational seeds for mockup testing
│
├── docker-compose.yml        # Unified container orchestration configuration
└── .env.example              # Consolidated environment variable configuration
```

---

## 🛠️ Technology Stack

* **Backend API**: FastAPI (Python 3.12), Pydantic Settings, Uvicorn, Supabase Python Client (Service Role).
* **Frontend Client**: React 19, TypeScript, Vite 8, Tailwind CSS, PostCSS.
* **Database**: Supabase (PostgreSQL 15) with Row-Level Security (RLS) policies.
* **Orchestration**: Docker & Docker Compose.
* **Speech Services**: Native Web Speech API (`SpeechRecognition` for candidate inputs, `SpeechSynthesis` for zero-latency browser-native playback).
* **Execution Sandbox**: Custom Docker environment packaging Python 3, Node.js, OpenJDK 17, and GCC/G++ to compile and run student code safely.

---

## ⚡ Core Features & Recent Improvements

### 1. AI Verbal Interview Simulator
* **Web Speech API TTS Migration**: Replaced server-side ONNX/WASM Kokoro JS engines (~80MB download) with browser-native OS voice engines (`window.speechSynthesis`), reducing React bundle sizes from ~3.5MB to ~1.0MB and delivering **0ms latency** on speech playback.
* **Pipelined WebSocket Token Delivery**: Streams generated text deltas from Groq LLM (`llama-3.3-70b-versatile`) directly down the socket to render text word-by-word, while accumulating the paragraphs to play via the native speaker engine.
* **7-Point Rubrics Evaluation**: Submits verbal candidate answers for evaluation across relevance, accuracy, STAR structure, JD alignment, etc., generating a final strengths/weaknesses and study recommendation scorecard.

### 2. Student Dashboard & Analytics
* **Dynamic Calculations**: The student dashboard calculates averages and completion counts dynamically on-the-fly from the user's `test_attempts`, `coding_submissions`, and `ai_interview_sessions` tables.
* **Subject Mastery Chart**: Binds dynamic subject metrics directly to the Subject Mastery layout (aptitude, reasoning, verbal, coding) using database-level aggregations.
* **Weak Areas & Recommended Sprints**: Automatically derives study sprints based on the user's low-scoring topics (under 60%), falling back to baseline defaults if no attempts exist.
* **Mock Interview Radial Gauge**: Scaled backend calculations to match the expected `0.0 - 10.0` frontend radial chart bounds.

### 3. Coding Arena Sandbox Compiler
* **Multi-Language Testing**: Runs automated test cases inside a sandboxed environment for Python, JavaScript, Java, C++, and C.
* **Detailed Verdict Logs**: Compiles and outputs parameters, expected results, actual outputs, and PASS/FAIL verdicts. Serializes complex structures (like `ListNode` pointer objects) as JSON arrays in stdout.

### 4. Admin Content & Batch Workspace
* **Dynamic Company Mapping**: Created join schemas and endpoints (`/admin/companies`) to allow custom company simulation drive additions instead of hardcoded checkboxes.
* **Batch Student Seeding**: Supports registering college student batches in bulk using `.xlsx`/`.csv` spreadsheets.

---


## 🚀 Getting Started

### 1. Environment Configurations
Copy `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```
Fill in your active Supabase URL, Anon Key, Service Role Key, and Database Pooler Connection String inside `.env`:
```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-client-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-secret-service-role-key
DATABASE_URL=postgresql://postgres.your-project:...@pooler.supabase.com:5432/postgres
```

### 2. Seeding the Database
1. Run the unified DDL schema [supabase/schema.sql](file:///d:/AiValytics%20Docs/Merging/supabase/schema.sql) inside the Supabase SQL editor to configure database tables, indexes, views, and RLS policies.
2. Run the seed data script [supabase/seed.sql](file:///d:/AiValytics%20Docs/Merging/supabase/seed.sql) to set up subjects, topics, MCQs, and programming problems.

Alternatively, you can run the schema inspect and seed scripts locally using python:
```bash
pip install -r backend/requirements.txt
python backend/supabase/seed_existing_schema.py
```

### 3. Launching the App

#### Option A: Docker Compose (Recommended)
Build and run both client and API containers on a shared virtual network:
```bash
docker-compose up --build
```
* **Frontend Web App**: 👉 [http://localhost:5173](http://localhost:5173)
* **Backend Swagger API**: 👉 [http://localhost:8000/docs](http://localhost:8000/docs)

#### Option B: Local Development

##### Booting the Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

##### Booting the Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Authentication & Security

The platform implements role-based access control (RBAC):
* **Backend Security**: `require_role(["admin"])` and `require_role(["student", "admin"])` dependencies inspect incoming Bearer JWT tokens, validating permissions against the database profiles table.
* **Frontend Guards**: `RouteGuard` checks the Supabase session role:
  * Redirects unauthenticated traffic to `/login`.
  * Restricts access to student and admin page trees.
  * Handles unauthorized dashboard redirects safely.
