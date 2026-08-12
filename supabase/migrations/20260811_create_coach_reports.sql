create table if not exists public.coach_reports (
  id uuid primary key default gen_random_uuid(),
  store_id bigint not null references public.stores(id) on delete cascade,
  report_type text not null check (report_type in ('operating_coaching', 'menu_engineering', 'boost_plan')),
  period_start date not null,
  period_end date not null,
  period_preset text,
  status text not null default 'completed' check (status in ('generating', 'completed', 'failed')),
  result jsonb,
  input_snapshot jsonb not null default '{}'::jsonb,
  model text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, report_type, period_start, period_end)
);

create index if not exists coach_reports_store_type_period_idx
  on public.coach_reports (store_id, report_type, period_start desc, period_end desc);

alter table public.coach_reports enable row level security;

create policy "store users read coach reports" on public.coach_reports for select
  using (exists (select 1 from public.users where users.id = auth.uid() and users.store_id = coach_reports.store_id));
create policy "store users insert coach reports" on public.coach_reports for insert
  with check (exists (select 1 from public.users where users.id = auth.uid() and users.store_id = coach_reports.store_id));
create policy "store users update coach reports" on public.coach_reports for update
  using (exists (select 1 from public.users where users.id = auth.uid() and users.store_id = coach_reports.store_id))
  with check (exists (select 1 from public.users where users.id = auth.uid() and users.store_id = coach_reports.store_id));
