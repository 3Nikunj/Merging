-- Migration: Add coding_submissions table
-- Run this in your Supabase SQL Editor to enable coding submission persistence.

create table if not exists public.coding_submissions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade,
    problem_id text not null,
    language text not null default 'python3',
    code text not null,
    status text not null check (status in ('accepted', 'wrong_answer', 'runtime_error', 'compile_error', 'timeout')),
    tests_passed integer not null default 0,
    total_tests integer not null default 0,
    stdout text,
    stderr text,
    submitted_at timestamptz not null default now()
);

create index if not exists idx_coding_submissions_user_id on public.coding_submissions(user_id);
create index if not exists idx_coding_submissions_problem_id on public.coding_submissions(problem_id);
create index if not exists idx_coding_submissions_status on public.coding_submissions(status);

-- Row Level Security: students can only see their own submissions
alter table public.coding_submissions enable row level security;

create policy "Students can read their own coding submissions"
    on public.coding_submissions for select
    using (auth.uid() = user_id);

create policy "Students can insert their own coding submissions"
    on public.coding_submissions for insert
    with check (auth.uid() = user_id);
