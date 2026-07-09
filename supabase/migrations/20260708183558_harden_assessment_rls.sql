-- Assessment data is served through the authenticated FastAPI backend. These
-- policies and grants provide defense in depth for direct Data API access.

alter table public.question_options enable row level security;
alter table public.coding_test_cases enable row level security;
alter table public.test_attempts enable row level security;
alter table public.test_attempt_answers enable row level security;

-- Keep the existing helper compatible with current policies while preventing
-- search-path object substitution in this SECURITY DEFINER function.
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
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Remove policy variants found in both the unified schema and deployed schema.
drop policy if exists question_options_read on public.question_options;
drop policy if exists question_options_admin on public.question_options;
drop policy if exists public_read_question_options on public.question_options;
drop policy if exists admin_manage_question_options on public.question_options;

drop policy if exists coding_test_cases_read on public.coding_test_cases;
drop policy if exists coding_test_cases_admin on public.coding_test_cases;
drop policy if exists public_read_coding_test_cases on public.coding_test_cases;
drop policy if exists admin_manage_coding_test_cases on public.coding_test_cases;

drop policy if exists test_attempts_read on public.test_attempts;
drop policy if exists test_attempts_write on public.test_attempts;
drop policy if exists test_attempts_own_or_admin on public.test_attempts;

drop policy if exists test_attempt_answers_read on public.test_attempt_answers;
drop policy if exists test_attempt_answers_write on public.test_attempt_answers;
drop policy if exists test_attempt_answers_own_or_admin on public.test_attempt_answers;

-- Students may read only options belonging to active/published questions.
-- Column grants below prevent is_correct from being selected.
create policy question_options_read_safe
on public.question_options
for select
to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.questions
    where questions.id = question_options.question_id
      and questions.status in ('active', 'published')
  )
);

create policy question_options_admin
on public.question_options
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Judge inputs and expected outputs are never directly available to students.
create policy coding_test_cases_admin
on public.coding_test_cases
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy test_attempts_select_own
on public.test_attempts
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or (select public.is_admin())
);

create policy test_attempts_admin
on public.test_attempts
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy test_attempt_answers_select_own
on public.test_attempt_answers
for select
to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.test_attempts
    where test_attempts.id = test_attempt_answers.attempt_id
      and test_attempts.user_id = (select auth.uid())
  )
);

create policy test_attempt_answers_admin
on public.test_attempt_answers
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Remove broad Supabase default grants, then restore only required safe reads.
revoke all privileges on table public.question_options from anon, authenticated;
revoke all privileges on table public.coding_test_cases from anon, authenticated;
revoke all privileges on table public.test_attempts from anon, authenticated;
revoke all privileges on table public.test_attempt_answers from anon, authenticated;

grant select (
  id,
  question_id,
  option_key,
  option_text,
  sort_order
) on public.question_options to authenticated;

grant select on public.test_attempts to authenticated;

grant select (
  id,
  attempt_id,
  question_id,
  selected_option_id,
  answer_json
) on public.test_attempt_answers to authenticated;

-- Views are security-definer by default. Make the reporting view obey the
-- caller's RLS policies and expose it only to authenticated users.
alter view public.reporting_user_test_latest set (security_invoker = true);
revoke all privileges on table public.reporting_user_test_latest
from anon, authenticated;
grant select on table public.reporting_user_test_latest to authenticated;
