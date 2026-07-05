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

* **Backend API**: FastAPI (Python 3.10+), Pydantic Settings, Uvicorn, Supabase Python Client.
* **Frontend Client**: React 19, TypeScript, Vite 8, Tailwind CSS, PostCSS (scoped nesting).
* **Database**: Supabase (PostgreSQL) with Row-Level Security (RLS) policies.
* **Orchestration**: Docker & Docker Compose.

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
