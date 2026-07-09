create extension if not exists "pgcrypto";

-- User Profiles (linked to Supabase auth.users)
create table if not exists public.profiles (
    id uuid primary key,
    email text not null unique,
    full_name text,
    role text not null default 'student' check (role in ('student', 'admin')),
    phone text,
    college text,
    department text,
    year_of_graduation integer,
    created_at timestamptz not null default now()
);

-- Profiles Academic Details
create table if not exists public.profile_academics (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    tenth_percentage numeric(5,2),
    twelfth_percentage numeric(5,2),
    graduation_cgpa numeric(4,2),
    backlogs integer default 0,
    gap_years integer default 0,
    gap_during_grad boolean default false
);

-- Admin Security Helper function
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Colleges
create table if not exists public.colleges (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    info text,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Batches for colleges
create table if not exists public.batches (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    active boolean not null default true,
    college_id uuid references public.colleges(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists idx_batches_college_name_unique
  on public.batches (college_id, lower(name));

-- Student Batch Memberships
create table if not exists public.batch_users (
    batch_id uuid not null references public.batches(id) on delete cascade,
    profile_id uuid not null references public.profiles(id) on delete cascade,
    roll_number text,
    status text not null default 'active' check (status in ('active', 'inactive')),
    joined_at timestamptz not null default now(),
    primary key (batch_id, profile_id)
);

create index if not exists idx_batch_users_profile_id
  on public.batch_users(profile_id);

-- Subject Taxonomy
create table if not exists public.subjects (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    progress integer not null default 0,
    average text not null default 'N/A',
    questions integer not null default 0,
    badge text,
    sort_order integer not null default 0,
    active boolean not null default true
);

-- Topic Taxonomy
create table if not exists public.topics (
    id uuid primary key default gen_random_uuid(),
    subject_id uuid references public.subjects(id) on delete cascade,
    name text not null,
    slug text not null unique,
    progress integer not null default 0,
    average text not null default 'N/A',
    questions integer not null default 0,
    badge text,
    sort_order integer not null default 0,
    active boolean not null default true
);

-- Subtopic Taxonomy
create table if not exists public.subtopics (
    id uuid primary key default gen_random_uuid(),
    topic_id uuid references public.topics(id) on delete cascade,
    name text not null,
    slug text not null unique,
    progress integer not null default 0,
    average text not null default 'N/A',
    questions integer not null default 0,
    badge text,
    sort_order integer not null default 0,
    active boolean not null default true
);

-- Tests (consolidated table name tests)
create table if not exists public.tests (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    scope text not null default 'general',
    company_id text,
    subject_id uuid references public.subjects(id) on delete set null,
    topic_id uuid references public.topics(id) on delete set null,
    duration_minutes integer not null default 0,
    is_active boolean not null default true,
    settings jsonb not null default '{}'::jsonb,
    created_by text,
    created_at timestamptz not null default now()
);

-- General Questions Pool
create table if not exists public.questions (
    id uuid primary key default gen_random_uuid(),
    title text,
    prompt text not null,
    question_type text not null check (question_type in ('mcq', 'coding')),
    subject_id uuid references public.subjects(id) on delete set null,
    topic_id uuid references public.topics(id) on delete set null,
    subtopic_id uuid references public.subtopics(id) on delete set null,
    difficulty text check (difficulty in ('easy', 'medium', 'hard')),
    marks numeric(4,2) default 1,
    status text not null default 'draft' check (status in ('draft', 'published', 'active')),
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_questions_subject_id on public.questions(subject_id);
create index if not exists idx_questions_topic_id on public.questions(topic_id);
create index if not exists idx_questions_subtopic_id on public.questions(subtopic_id);

-- MCQ Options
create table if not exists public.question_options (
    id uuid primary key default gen_random_uuid(),
    question_id uuid references public.questions(id) on delete cascade,
    option_key text not null,
    option_text text not null,
    is_correct boolean not null default false,
    sort_order integer not null default 0
);

-- Coding Test Cases
create table if not exists public.coding_test_cases (
    id uuid primary key default gen_random_uuid(),
    question_id uuid references public.questions(id) on delete cascade,
    input_text text not null,
    expected_output text not null,
    is_hidden boolean not null default false,
    sort_order integer not null default 0
);

-- Programming Problems (Coding Arena specific)
create table if not exists public.programming_problems (
    id uuid primary key default gen_random_uuid(),
    question_id uuid not null unique references public.questions(id) on delete cascade,
    slug text not null unique,
    active boolean not null default true,
    starter_templates jsonb not null default '{}'::jsonb,
    constraints_text text,
    examples_json jsonb not null default '[]'::jsonb,
    tags text[] not null default '{}',
    expected_time text,
    expected_space text,
    acceptance_rate numeric(5,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_programming_problems_active on public.programming_problems(active);

-- Test Questions Link (Join Table)
create table if not exists public.test_questions (
    test_id uuid references public.tests(id) on delete cascade,
    question_id uuid references public.questions(id) on delete cascade,
    sort_order integer not null default 0,
    section_label text,
    marks numeric(4,2) default 1,
    primary key (test_id, question_id)
);

-- Test Attempts
create table if not exists public.test_attempts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade,
    test_id uuid references public.tests(id) on delete cascade,
    status text not null default 'in_progress' check (status in ('in_progress', 'submitted')),
    current_question integer not null default 1,
    answered_count integer not null default 0,
    started_at timestamptz not null default now(),
    submitted_at timestamptz,
    correct_count integer not null default 0,
    incorrect_count integer not null default 0,
    skipped_count integer not null default 0,
    duration_seconds integer,
    result_summary jsonb not null default '{}'::jsonb,
    score numeric(5,2) default 0,
    percentage numeric(5,2) default 0
);

-- Attempt Answers
create table if not exists public.test_attempt_answers (
    id uuid primary key default gen_random_uuid(),
    attempt_id uuid references public.test_attempts(id) on delete cascade,
    question_id uuid references public.questions(id) on delete cascade,
    selected_option_id uuid references public.question_options(id) on delete set null,
    answer_json jsonb,
    is_correct boolean,
    score numeric(4,2) default 0,
    updated_at timestamptz not null default now(),
    unique (attempt_id, question_id)
);

-- User recommendations
create table if not exists public.user_recommendations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade,
    label text not null,
    title text not null,
    description text not null,
    created_at timestamptz not null default now()
);

-- Student Weak Areas
create table if not exists public.weak_areas (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade,
    topic text not null,
    accuracy integer not null,
    created_at timestamptz not null default now()
);

-- Coding Arena Submissions
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

-- Reporting View
create or replace view public.reporting_user_test_latest
with (security_invoker = true) as
select distinct on (ta.user_id, ta.test_id)
  ta.user_id,
  ta.test_id,
  t.title,
  t.scope,
  ta.id as latest_attempt_id,
  ta.score,
  ta.percentage,
  ta.correct_count,
  ta.incorrect_count,
  ta.skipped_count,
  ta.duration_seconds,
  ta.submitted_at
from public.test_attempts ta
join public.tests t on t.id = ta.test_id
where ta.submitted_at is not null
order by ta.user_id, ta.test_id, ta.submitted_at desc nulls last;

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.profile_academics enable row level security;
alter table public.colleges enable row level security;
alter table public.batches enable row level security;
alter table public.batch_users enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.subtopics enable row level security;
alter table public.tests enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.coding_test_cases enable row level security;
alter table public.programming_problems enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_attempts enable row level security;
alter table public.test_attempt_answers enable row level security;
alter table public.user_recommendations enable row level security;
alter table public.weak_areas enable row level security;

-- Setup RLS Policies (Allow read for authenticated users, full access for admins)
create policy profiles_read on public.profiles for select using (auth.uid() is not null);
create policy profiles_admin on public.profiles for all using (is_admin()) with check (is_admin());

create policy academics_read on public.profile_academics for select using (auth.uid() = profile_id or is_admin());
create policy academics_admin on public.profile_academics for all using (is_admin()) with check (is_admin());

create policy colleges_read on public.colleges for select using (auth.uid() is not null);
create policy colleges_admin on public.colleges for all using (is_admin()) with check (is_admin());

create policy batches_read on public.batches for select using (auth.uid() is not null);
create policy batches_admin on public.batches for all using (is_admin()) with check (is_admin());

create policy batch_users_read on public.batch_users for select using (auth.uid() is not null);
create policy batch_users_admin on public.batch_users for all using (is_admin()) with check (is_admin());

create policy subjects_read on public.subjects for select using (active or is_admin());
create policy subjects_admin on public.subjects for all using (is_admin()) with check (is_admin());

create policy topics_read on public.topics for select using (active or is_admin());
create policy topics_admin on public.topics for all using (is_admin()) with check (is_admin());

create policy subtopics_read on public.subtopics for select using (active or is_admin());
create policy subtopics_admin on public.subtopics for all using (is_admin()) with check (is_admin());

create policy tests_read on public.tests for select using (is_active or is_admin());
create policy tests_admin on public.tests for all using (is_admin()) with check (is_admin());

create policy questions_read on public.questions for select using (status = 'published' or status = 'active' or is_admin());
create policy questions_admin on public.questions for all using (is_admin()) with check (is_admin());

create policy question_options_read_safe on public.question_options for select to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.questions
    where questions.id = question_options.question_id
      and questions.status in ('active', 'published')
  )
);
create policy question_options_admin on public.question_options for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy coding_test_cases_admin on public.coding_test_cases for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy programming_problems_read on public.programming_problems for select using (active or is_admin());
create policy programming_problems_admin on public.programming_problems for all using (is_admin()) with check (is_admin());

create policy test_questions_read on public.test_questions for select using (auth.uid() is not null);
create policy test_questions_admin on public.test_questions for all using (is_admin()) with check (is_admin());

create policy test_attempts_select_own on public.test_attempts for select to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()));
create policy test_attempts_admin on public.test_attempts for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy test_attempt_answers_select_own on public.test_attempt_answers for select to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.test_attempts
    where test_attempts.id = test_attempt_answers.attempt_id
      and test_attempts.user_id = (select auth.uid())
  )
);
create policy test_attempt_answers_admin on public.test_attempt_answers for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy recommendations_read on public.user_recommendations for select using (auth.uid() = user_id or is_admin());
create policy recommendations_admin on public.user_recommendations for all using (is_admin()) with check (is_admin());

create policy weak_areas_read on public.weak_areas for select using (auth.uid() = user_id or is_admin());
create policy weak_areas_admin on public.weak_areas for all using (is_admin()) with check (is_admin());

-- Limit direct Data API access to non-sensitive assessment data. The FastAPI
-- backend uses service_role for trusted student and admin workflows.
revoke all privileges on table public.question_options from anon, authenticated;
revoke all privileges on table public.coding_test_cases from anon, authenticated;
revoke all privileges on table public.test_attempts from anon, authenticated;
revoke all privileges on table public.test_attempt_answers from anon, authenticated;

grant select (id, question_id, option_key, option_text, sort_order)
on public.question_options to authenticated;
grant select on public.test_attempts to authenticated;
grant select (id, attempt_id, question_id, selected_option_id, answer_json)
on public.test_attempt_answers to authenticated;

revoke all privileges on table public.reporting_user_test_latest
from anon, authenticated;
grant select on table public.reporting_user_test_latest to service_role;

-- Least-privilege baseline for the exposed public schema. Browser clients use
-- Supabase Auth directly and read only profiles(id, role); all business data is
-- served through the FastAPI service-role client.
revoke all privileges on schema public from public, anon, authenticated;
grant usage on schema public to authenticated, service_role;

do $$
declare
  relation record;
  column_name record;
  sequence_name record;
  function_record record;
  view_record record;
  owner_name text;
begin
  for relation in
    select n.nspname as schema_name, c.relname as relation_name
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    execute format(
      'revoke all privileges on table %I.%I from anon, authenticated',
      relation.schema_name,
      relation.relation_name
    );
    for column_name in
      select a.attname
      from pg_catalog.pg_attribute a
      join pg_catalog.pg_class c on c.oid = a.attrelid
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = relation.schema_name
        and c.relname = relation.relation_name
        and a.attnum > 0
        and not a.attisdropped
    loop
      execute format(
        'revoke select (%1$I), insert (%1$I), update (%1$I), references (%1$I) '
        'on table %2$I.%3$I from anon, authenticated',
        column_name.attname,
        relation.schema_name,
        relation.relation_name
      );
    end loop;
  end loop;

  for sequence_name in
    select n.nspname as schema_name, c.relname
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'S'
  loop
    execute format(
      'revoke all privileges on sequence %I.%I from anon, authenticated',
      sequence_name.schema_name,
      sequence_name.relname
    );
  end loop;

  for function_record in
    select p.oid
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
  loop
    execute format(
      'alter function %s set search_path = ''''',
      function_record.oid::regprocedure
    );
    execute format(
      'revoke all privileges on function %s '
      'from public, anon, authenticated, service_role',
      function_record.oid::regprocedure
    );
  end loop;

  for view_record in
    select n.nspname as schema_name, c.relname as view_name
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'v'
  loop
    execute format(
      'alter view %I.%I set (security_invoker = true)',
      view_record.schema_name,
      view_record.view_name
    );
    execute format(
      'revoke all privileges on table %I.%I '
      'from public, anon, authenticated, service_role',
      view_record.schema_name,
      view_record.view_name
    );
    execute format(
      'grant select on table %I.%I to service_role',
      view_record.schema_name,
      view_record.view_name
    );
  end loop;

  foreach owner_name in array array['postgres', 'supabase_admin']
  loop
    if exists (select 1 from pg_catalog.pg_roles where rolname = owner_name)
      and (
        owner_name = current_user
        or pg_catalog.pg_has_role(current_user, owner_name, 'MEMBER')
      ) then
      execute format(
        'alter default privileges for role %I in schema public '
        'revoke all privileges on tables from anon, authenticated',
        owner_name
      );
      execute format(
        'alter default privileges for role %I in schema public '
        'revoke all privileges on sequences from anon, authenticated',
        owner_name
      );
      execute format(
        'alter default privileges for role %I in schema public '
        'revoke all privileges on functions '
        'from public, anon, authenticated, service_role',
        owner_name
      );
    elsif exists (select 1 from pg_catalog.pg_roles where rolname = owner_name) then
      raise notice 'Skipping protected default-privilege owner %', owner_name;
    end if;
  end loop;
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant select (id, role) on table public.profiles to authenticated;
