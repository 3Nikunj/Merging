-- The browser uses Supabase Auth directly but reads only profiles(id, role).
-- All business data access is mediated by the FastAPI service-role client.

revoke all privileges on schema public from public, anon, authenticated;
grant usage on schema public to authenticated, service_role;

-- Remove broad privileges from every existing table and every explicit column
-- grant. Column revocation is necessary because table-level REVOKE does not
-- remove grants previously made directly on individual columns.
do $$
declare
  relation record;
  column_name record;
begin
  for relation in
    select n.nspname as schema_name, c.relname as relation_name
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
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
end;
$$;

-- Sequences are server-managed and never accessed directly by browser roles.
do $$
declare
  sequence_name record;
begin
  for sequence_name in
    select n.nspname as schema_name, c.relname
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'S'
  loop
    execute format(
      'revoke all privileges on sequence %I.%I from anon, authenticated',
      sequence_name.schema_name,
      sequence_name.relname
    );
  end loop;
end;
$$;

-- SECURITY DEFINER functions must never resolve objects through a writable
-- schema. Treat every public function as a private API unless explicitly
-- granted below.
do $$
declare
  function_record record;
begin
  for function_record in
    select p.oid
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
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
end;
$$;

-- Restore only functions that are required by RLS or trusted triggers.
do $$
begin
  if to_regprocedure('public.is_admin()') is not null then
    grant execute on function public.is_admin() to authenticated;
  end if;

  if to_regprocedure('public.handle_new_user()') is not null then
    grant execute on function public.handle_new_user() to supabase_auth_admin;
  end if;

  if to_regprocedure('public.set_updated_at()') is not null then
    grant execute on function public.set_updated_at() to service_role;
  end if;
end;
$$;

-- Views must execute with the caller's RLS context and are backend-only.
do $$
declare
  view_record record;
begin
  for view_record in
    select n.nspname as schema_name, c.relname as view_name
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
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
end;
$$;

-- The only browser-direct database read used by the application.
grant select (id, role) on table public.profiles to authenticated;

-- Prevent future objects created by Supabase's common owner roles from
-- inheriting the permissive Data API grants being removed above.
do $$
declare
  owner_name text;
begin
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
