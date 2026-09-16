-- Remove legacy permissive and duplicate policies, then define the complete
-- browser access model for tenant tables. service_role bypasses RLS.

alter table public.sales_daily enable row level security;
alter table public.menu_master enable row level security;
alter table public.menu_price_history enable row level security;
alter table public.monthly_targets enable row level security;
alter table public.stores enable row level security;
alter table public.users enable row level security;
alter table public.signup_requests enable row level security;

-- Remove only the inspected legacy policies and the canonical policies below.
drop policy if exists "allow_read" on public.sales_daily;
drop policy if exists "allow_write_insert" on public.sales_daily;
drop policy if exists "allow_write_update" on public.sales_daily;
drop policy if exists "allow delete" on public.sales_daily;
drop policy if exists "sales_daily_delete_by_user_store" on public.sales_daily;
drop policy if exists "sales_daily_delete_same_store" on public.sales_daily;
drop policy if exists "sales_daily_insert_by_user_store" on public.sales_daily;
drop policy if exists "sales_daily_insert_same_store" on public.sales_daily;
drop policy if exists "sales_daily_select_by_user_store" on public.sales_daily;
drop policy if exists "sales_daily_select_same_store" on public.sales_daily;
drop policy if exists "sales_daily_update_by_user_store" on public.sales_daily;
drop policy if exists "sales_daily_update_same_store" on public.sales_daily;
drop policy if exists "store users select own sales" on public.sales_daily;
drop policy if exists "store users insert own sales" on public.sales_daily;
drop policy if exists "store users update own sales" on public.sales_daily;
drop policy if exists "store users delete own sales" on public.sales_daily;
drop policy if exists "masters select all sales" on public.sales_daily;

drop policy if exists "Allow authenticated users" on public.menu_master;
drop policy if exists "menu_master_delete_same_store" on public.menu_master;
drop policy if exists "menu_master_insert_same_store" on public.menu_master;
drop policy if exists "menu_master_select_same_store" on public.menu_master;
drop policy if exists "menu_master_update_same_store" on public.menu_master;
drop policy if exists "store users select own menus" on public.menu_master;
drop policy if exists "store users insert own menus" on public.menu_master;
drop policy if exists "store users update own menus" on public.menu_master;
drop policy if exists "store users delete own menus" on public.menu_master;

drop policy if exists "Allow authenticated users" on public.menu_price_history;
drop policy if exists "menu_price_history_delete_by_user_store" on public.menu_price_history;
drop policy if exists "menu_price_history_delete_same_store" on public.menu_price_history;
drop policy if exists "menu_price_history_insert_by_user_store" on public.menu_price_history;
drop policy if exists "menu_price_history_insert_same_store" on public.menu_price_history;
drop policy if exists "menu_price_history_select_by_user_store" on public.menu_price_history;
drop policy if exists "menu_price_history_select_same_store" on public.menu_price_history;
drop policy if exists "menu_price_history_update_by_user_store" on public.menu_price_history;
drop policy if exists "menu_price_history_update_same_store" on public.menu_price_history;
drop policy if exists "store users select own menu prices" on public.menu_price_history;
drop policy if exists "store users insert own menu prices" on public.menu_price_history;
drop policy if exists "store users update own menu prices" on public.menu_price_history;
drop policy if exists "store users delete own menu prices" on public.menu_price_history;

drop policy if exists "Allow authenticated users" on public.monthly_targets;
drop policy if exists "monthly_targets_delete_by_user_store" on public.monthly_targets;
drop policy if exists "monthly_targets_delete_same_store" on public.monthly_targets;
drop policy if exists "monthly_targets_insert_by_user_store" on public.monthly_targets;
drop policy if exists "monthly_targets_insert_same_store" on public.monthly_targets;
drop policy if exists "monthly_targets_select_by_user_store" on public.monthly_targets;
drop policy if exists "monthly_targets_select_same_store" on public.monthly_targets;
drop policy if exists "monthly_targets_update_by_user_store" on public.monthly_targets;
drop policy if exists "monthly_targets_update_same_store" on public.monthly_targets;
drop policy if exists "store users select own monthly targets" on public.monthly_targets;
drop policy if exists "store users insert own monthly targets" on public.monthly_targets;
drop policy if exists "store users update own monthly targets" on public.monthly_targets;
drop policy if exists "store users delete own monthly targets" on public.monthly_targets;

drop policy if exists "Allow authenticated users" on public.stores;
drop policy if exists "store users select own store" on public.stores;
drop policy if exists "masters select all stores" on public.stores;

drop policy if exists "users_can_insert_own" on public.users;
drop policy if exists "users_can_update_own" on public.users;
drop policy if exists "users_can_view_own" on public.users;
drop policy if exists "users_select_own_row" on public.users;
drop policy if exists "authenticated users select own profile" on public.users;

drop policy if exists "authenticated can read signup requests" on public.signup_requests;
drop policy if exists "anyone can insert signup requests" on public.signup_requests;
drop policy if exists "anonymous users create signup requests" on public.signup_requests;
drop policy if exists "masters select signup requests" on public.signup_requests;
drop policy if exists "masters update signup requests" on public.signup_requests;
drop policy if exists "masters delete signup requests" on public.signup_requests;

revoke all privileges on table public.sales_daily from anon, authenticated;
revoke all privileges on table public.menu_master from anon, authenticated;
revoke all privileges on table public.menu_price_history from anon, authenticated;
revoke all privileges on table public.monthly_targets from anon, authenticated;
revoke all privileges on table public.stores from anon, authenticated;
revoke all privileges on table public.users from anon, authenticated;
revoke all privileges on table public.signup_requests from anon, authenticated;

grant select, insert, update, delete on table public.sales_daily to authenticated;
grant select, insert, update, delete on table public.menu_master to authenticated;
grant select, insert, update, delete on table public.menu_price_history to authenticated;
grant select, insert, update, delete on table public.monthly_targets to authenticated;
grant select on table public.stores to authenticated;
grant select on table public.users to authenticated;
grant insert on table public.signup_requests to anon;
grant select, update, delete on table public.signup_requests to authenticated;

-- users: browser clients may read only their own role and store mapping.
create policy "authenticated users select own profile"
  on public.users for select to authenticated
  using (
    id = (select auth.uid())
  );

-- sales_daily: the authenticated user's public.users.store_id is the tenant boundary.
create policy "store users select own sales"
  on public.sales_daily for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = sales_daily.store_id
    )
  );

create policy "store users insert own sales"
  on public.sales_daily for insert to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = sales_daily.store_id
    )
  );

create policy "store users update own sales"
  on public.sales_daily for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = sales_daily.store_id
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = sales_daily.store_id
    )
  );

create policy "store users delete own sales"
  on public.sales_daily for delete to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = sales_daily.store_id
    )
  );

-- The active Master Dashboard reads all stores' sales from the browser.
create policy "masters select all sales"
  on public.sales_daily for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'master'
    )
  );

-- menu_master: store users manage only their own menu rows.
create policy "store users select own menus"
  on public.menu_master for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = menu_master.store_id
    )
  );

create policy "store users insert own menus"
  on public.menu_master for insert to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = menu_master.store_id
    )
  );

create policy "store users update own menus"
  on public.menu_master for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = menu_master.store_id
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = menu_master.store_id
    )
  );

create policy "store users delete own menus"
  on public.menu_master for delete to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = menu_master.store_id
    )
  );

-- menu_price_history: store users manage only their own price rows.
create policy "store users select own menu prices"
  on public.menu_price_history for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = menu_price_history.store_id
    )
  );

create policy "store users insert own menu prices"
  on public.menu_price_history for insert to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = menu_price_history.store_id
    )
  );

create policy "store users update own menu prices"
  on public.menu_price_history for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = menu_price_history.store_id
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = menu_price_history.store_id
    )
  );

create policy "store users delete own menu prices"
  on public.menu_price_history for delete to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = menu_price_history.store_id
    )
  );

-- monthly_targets: store users manage only their own targets.
create policy "store users select own monthly targets"
  on public.monthly_targets for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = monthly_targets.store_id
    )
  );

create policy "store users insert own monthly targets"
  on public.monthly_targets for insert to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = monthly_targets.store_id
    )
  );

create policy "store users update own monthly targets"
  on public.monthly_targets for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = monthly_targets.store_id
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = monthly_targets.store_id
    )
  );

create policy "store users delete own monthly targets"
  on public.monthly_targets for delete to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
        and u.store_id = monthly_targets.store_id
    )
  );

-- stores: a store user can read its own store only. Browser-side master reads
-- remain SELECT-only; store and account provisioning uses service_role.
create policy "store users select own store"
  on public.stores for select to authenticated
  using (
    stores.id = (
      select u.store_id
      from public.users u
      where u.id = (select auth.uid())
        and u.role = 'store_user'
    )
  );

create policy "masters select all stores"
  on public.stores for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'master'
    )
  );

-- signup_requests: anonymous signup stays insert-only. Approval operations are
-- restricted to a verified master role from public.users.
create policy "anonymous users create signup requests"
  on public.signup_requests for insert to anon
  with check (true);

create policy "masters select signup requests"
  on public.signup_requests for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'master'
    )
  );

create policy "masters update signup requests"
  on public.signup_requests for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'master'
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'master'
    )
  );

create policy "masters delete signup requests"
  on public.signup_requests for delete to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'master'
    )
  );
