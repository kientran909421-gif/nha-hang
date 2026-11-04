create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  actor_role text not null,
  action text not null,
  area text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

alter table public.admin_audit_log
  add column if not exists actor_role text,
  add column if not exists area text,
  add column if not exists target_type text,
  add column if not exists target_id text,
  add column if not exists details jsonb,
  add column if not exists created_at timestamptz default now();

alter table public.staff_members
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_login_at timestamptz;

create table if not exists public.system_settings (
  id integer primary key default 1,
  maintenance_enabled boolean not null default false,
  maintenance_message text not null default 'Website đang được bảo trì. Vui lòng quay lại sau.',
  app_version text not null default '0.1.0',
  updated_at timestamptz not null default now(),
  constraint system_settings_singleton check (id = 1)
);

alter table public.system_settings enable row level security;

insert into public.system_settings (id)
values (1)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_audit_log'
      and policyname = 'service_role_admin_audit_log'
  ) then
    create policy service_role_admin_audit_log
      on public.admin_audit_log
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'system_settings'
      and policyname = 'service_role_system_settings'
  ) then
    create policy service_role_system_settings
      on public.system_settings
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;
