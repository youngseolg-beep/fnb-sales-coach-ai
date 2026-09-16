alter table public.signup_requests
  drop column if exists password,
  drop column if exists requested_password;
