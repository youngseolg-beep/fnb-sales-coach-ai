-- Normalize browser access to persisted Coach reports.
alter table public.coach_reports enable row level security;

revoke all privileges on table public.coach_reports from public;
revoke all privileges on table public.coach_reports from anon;
revoke all privileges on table public.coach_reports from authenticated;

grant select, insert, update on table public.coach_reports to authenticated;

drop policy if exists "store users read coach reports" on public.coach_reports;
drop policy if exists "store users insert coach reports" on public.coach_reports;
drop policy if exists "store users update coach reports" on public.coach_reports;

create policy "store users select own coach reports"
  on public.coach_reports for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = coach_reports.store_id
    )
  );

create policy "store users insert own coach reports"
  on public.coach_reports for insert to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = coach_reports.store_id
    )
  );

create policy "store users update own coach reports"
  on public.coach_reports for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = coach_reports.store_id
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = coach_reports.store_id
    )
  );

-- Remove unused SECURITY DEFINER helpers from the public RPC surface.
drop function if exists public.current_user_store_id();
drop function if exists public.has_master_access();
