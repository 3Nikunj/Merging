-- Insert missing default companies
insert into public.companies (id, slug, name, active)
values
    (gen_random_uuid(), 'capgemini', 'Capgemini', true),
    (gen_random_uuid(), 'infosys', 'Infosys', true),
    (gen_random_uuid(), 'tcs', 'TCS', true),
    (gen_random_uuid(), 'accenture', 'Accenture', true),
    (gen_random_uuid(), 'cognizant', 'Cognizant', true),
    (gen_random_uuid(), 'wipro', 'Wipro', true)
on conflict (slug) do update set
    name = excluded.name,
    active = excluded.active;

-- Drop previous question_companies if it exists
drop table if exists public.question_companies cascade;

-- Create question_companies referencing companies(slug)
create table public.question_companies (
    question_id uuid not null references public.questions(id) on delete cascade,
    company_id text not null references public.companies(slug) on delete cascade on update cascade,
    primary key (question_id, company_id)
);

-- Enable RLS
alter table public.question_companies enable row level security;

-- Policies for question_companies
create policy question_companies_read on public.question_companies
    for select using (true);

create policy question_companies_write on public.question_companies
    for all using (public.is_admin());
