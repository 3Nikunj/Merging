-- Migration: Add question_companies mapping table
-- Connects questions to one or more companies (e.g. 'tcs', 'capgemini', 'accenture', 'infosys', 'cognizant', 'wipro')

create table if not exists public.question_companies (
    question_id uuid not null references public.questions(id) on delete cascade,
    company_id text not null,
    primary key (question_id, company_id)
);

-- Enable RLS
alter table public.question_companies enable row level security;

-- Setup RLS Policies (Allow select for authenticated users, full access for admins)
create policy question_companies_read_safe on public.question_companies
    for select to authenticated
    using (true);

create policy question_companies_admin on public.question_companies
    for all to authenticated
    using (
        (select public.is_admin())
    )
    with check (
        (select public.is_admin())
    );

-- Grant permissions to authenticated role and service role
grant select on public.question_companies to authenticated;
grant all privileges on public.question_companies to service_role;
