-- Pin the trigger-function lookup path without changing their bodies or triggers.
alter function public.set_updated_at()
  set search_path = public;

alter function public.set_updated_at_monthly_targets()
  set search_path = public;
