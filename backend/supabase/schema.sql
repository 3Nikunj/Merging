create extension if not exists "pgcrypto";

create table if not exists practice_tests (
    id text primary key,
    title text not null,
    category text not null,
    status text not null check (status in ('Not Started', 'In Progress', 'Completed')),
    questions integer not null default 0,
    duration integer not null default 0,
    difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
    is_premium boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists subjects (
    id text primary key,
    title text not null,
    progress integer not null default 0,
    average text not null default 'N/A',
    questions integer not null default 0,
    badge text,
    sort_order integer not null default 0
);

create table if not exists topics (
    id text primary key,
    subject_id text references subjects(id) on delete cascade,
    title text not null,
    progress integer not null default 0,
    average text not null default 'N/A',
    questions integer not null default 0,
    badge text,
    sort_order integer not null default 0
);

create table if not exists subtopics (
    id text primary key,
    topic_id text references topics(id) on delete cascade,
    title text not null,
    progress integer not null default 0,
    average text not null default 'N/A',
    questions integer not null default 0,
    badge text,
    sort_order integer not null default 0
);

create table if not exists test_summaries (
    id uuid primary key default gen_random_uuid(),
    subject text not null,
    topic text not null,
    subtopic text not null,
    title text not null,
    questions integer not null,
    duration integer not null,
    total_marks integer not null,
    difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
    passing_score text not null,
    attempts_allowed integer not null,
    best_score text not null,
    created_at timestamptz not null default now()
);

create table if not exists test_questions (
    id bigint generated always as identity primary key,
    test_id text references practice_tests(id) on delete cascade,
    question_number integer not null,
    text text not null,
    points integer not null default 1,
    answer_id text,
    options jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists test_attempts (
    id uuid primary key default gen_random_uuid(),
    user_id text not null,
    test_id text not null,
    status text not null default 'IN_PROGRESS' check (status in ('IN_PROGRESS', 'SUBMITTED')),
    current_question integer not null default 1,
    answered_count integer not null default 0,
    started_at timestamptz not null default now(),
    submitted_at timestamptz
);

create table if not exists attempt_answers (
    id uuid primary key default gen_random_uuid(),
    attempt_id uuid references test_attempts(id) on delete cascade,
    question_id bigint references test_questions(id) on delete cascade,
    option_id text,
    status text not null default 'answered' check (status in ('answered', 'marked', 'not_answered')),
    updated_at timestamptz not null default now(),
    unique (attempt_id, question_id)
);

create table if not exists user_recommendations (
    id uuid primary key default gen_random_uuid(),
    user_id text not null,
    label text not null,
    title text not null,
    description text not null,
    created_at timestamptz not null default now()
);

create table if not exists weak_areas (
    id uuid primary key default gen_random_uuid(),
    user_id text not null,
    topic text not null,
    accuracy integer not null,
    created_at timestamptz not null default now()
);
