-- Create tables for AI Interview feature

-- 1. ai_interview_sessions
create table if not exists public.ai_interview_sessions (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.profiles(id) on delete cascade,
    mode text not null check (mode in ('jd_based', 'custom')),
    company text,
    position text,
    experience_level text,
    interview_type text,
    difficulty text,
    jd_text text,
    resume_url text,
    resume_text text,
    voice_accent text default 'af_heart',
    status text not null default 'setup' check (status in ('setup', 'active', 'completed', 'cancelled')),
    overall_score numeric(5,2),
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz not null default now()
);

-- Index for scanning student sessions quickly
create index if not exists idx_ai_interview_sessions_student_id
  on public.ai_interview_sessions(student_id);

-- 2. ai_interview_turns
create table if not exists public.ai_interview_turns (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.ai_interview_sessions(id) on delete cascade,
    sort_order integer not null,
    question text not null,
    question_type text,
    answer_transcript text,
    score numeric(5,2),
    rubric_json jsonb not null default '{}'::jsonb,
    mistakes_json jsonb not null default '[]'::jsonb,
    missing_keywords_json jsonb not null default '[]'::jsonb,
    corrected_answer text,
    feedback text,
    follow_up_needed boolean default false,
    created_at timestamptz not null default now()
);

-- Index on session_id and order
create index if not exists idx_ai_interview_turns_session_id_order
  on public.ai_interview_turns(session_id, sort_order);

-- 3. ai_interview_reports
create table if not exists public.ai_interview_reports (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.ai_interview_sessions(id) on delete cascade,
    summary text,
    strengths_json jsonb not null default '[]'::jsonb,
    weaknesses_json jsonb not null default '[]'::jsonb,
    recommended_practice_json jsonb not null default '[]'::jsonb,
    dashboard_metrics_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    unique (session_id)
);

-- Enable RLS on all tables
alter table public.ai_interview_sessions enable row level security;
alter table public.ai_interview_turns enable row level security;
alter table public.ai_interview_reports enable row level security;

-- Revoke all direct browser access permissions
revoke all privileges on table public.ai_interview_sessions from anon, authenticated;
revoke all privileges on table public.ai_interview_turns from anon, authenticated;
revoke all privileges on table public.ai_interview_reports from anon, authenticated;

-- Setup RLS Policies (Allow access to student owners and admin roles)
create policy ai_interview_sessions_policy on public.ai_interview_sessions
    for all to authenticated
    using (
        (auth.uid() = student_id)
        or (select public.is_admin())
    )
    with check (
        (auth.uid() = student_id)
        or (select public.is_admin())
    );

create policy ai_interview_turns_policy on public.ai_interview_turns
    for all to authenticated
    using (
        (select public.is_admin())
        or exists (
            select 1 from public.ai_interview_sessions
            where ai_interview_sessions.id = ai_interview_turns.session_id
              and ai_interview_sessions.student_id = auth.uid()
        )
    )
    with check (
        (select public.is_admin())
        or exists (
            select 1 from public.ai_interview_sessions
            where ai_interview_sessions.id = ai_interview_turns.session_id
              and ai_interview_sessions.student_id = auth.uid()
        )
    );

create policy ai_interview_reports_policy on public.ai_interview_reports
    for all to authenticated
    using (
        (select public.is_admin())
        or exists (
            select 1 from public.ai_interview_sessions
            where ai_interview_sessions.id = ai_interview_reports.session_id
              and ai_interview_sessions.student_id = auth.uid()
        )
    )
    with check (
        (select public.is_admin())
        or exists (
            select 1 from public.ai_interview_sessions
            where ai_interview_sessions.id = ai_interview_reports.session_id
              and ai_interview_sessions.student_id = auth.uid()
        )
    );
