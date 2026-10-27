-- IPC submission storage. Run once in the dedicated IPC Supabase project's SQL editor.
-- Safe to run again. No browser receives service credentials or direct table access.
begin;

create table if not exists public.ipc_submissions (
  id uuid primary key,
  receipt_hash text not null unique check (receipt_hash ~ '^[a-fA-F0-9]{64}$'),
  email text not null,
  created_at timestamptz not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  constraint ipc_submission_data_id check (data->>'id' = id::text),
  constraint ipc_submission_data_receipt check (data->>'receiptHash' = receipt_hash),
  constraint ipc_submission_data_email check (data->>'email' = email)
);
create index if not exists ipc_submissions_created_idx on public.ipc_submissions (created_at desc, id desc);
alter table public.ipc_submissions enable row level security;
revoke all on public.ipc_submissions from public, anon, authenticated;
grant select, insert, update, delete on public.ipc_submissions to service_role;

create table if not exists public.ipc_rate_limits (
  rate_key text not null,
  window_seconds integer not null check (window_seconds > 0),
  window_start bigint not null,
  expires_at bigint not null,
  attempts bigint not null check (attempts > 0),
  primary key (rate_key, window_seconds, window_start)
);
create index if not exists ipc_rate_limits_expiry_idx on public.ipc_rate_limits(expires_at);
alter table public.ipc_rate_limits enable row level security;
revoke all on public.ipc_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.ipc_rate_limits to service_role;

create or replace function public.ipc_update_submission(p_id uuid, p_patch jsonb)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare updated jsonb;
begin
  if jsonb_typeof(p_patch) <> 'object' or p_patch ?| array['id', 'receiptHash', 'email', 'createdAt', 'storagePath', 'filename', 'contentType'] then
    raise exception 'Invalid submission update';
  end if;
  update public.ipc_submissions set data = data || p_patch where id = p_id returning data into updated;
  return updated;
end;
$$;
revoke all on function public.ipc_update_submission(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.ipc_update_submission(uuid, jsonb) to service_role;

create or replace function public.ipc_claim_scan(p_id uuid)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare updated jsonb;
begin
  update public.ipc_submissions
  set data = jsonb_set(data, '{scan}', coalesce(data->'scan', '{}'::jsonb) || jsonb_build_object('status', 'processing', 'startedAt', to_char(clock_timestamp() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))
  where id = p_id and coalesce(data#>>'{scan,status}', '') <> 'completed' and (
    coalesce(data#>>'{scan,status}', '') <> 'processing'
    or case when (data#>>'{scan,startedAt}') ~ '^\d{4}-\d{2}-\d{2}T' then (data#>>'{scan,startedAt}')::timestamptz < clock_timestamp() - interval '120 seconds' else false end
  )
  returning data into updated;
  return updated;
end;
$$;
revoke all on function public.ipc_claim_scan(uuid) from public, anon, authenticated;
grant execute on function public.ipc_claim_scan(uuid) to service_role;

create or replace function public.ipc_consume_rate(p_key text, p_window_seconds integer, p_limit integer)
returns boolean language plpgsql security invoker set search_path = pg_catalog as $$
declare
  current_epoch bigint := floor(extract(epoch from clock_timestamp()));
  period_start bigint;
  consumed bigint;
begin
  if p_key is null or char_length(p_key) not between 1 and 256 or p_window_seconds is null or p_window_seconds not between 1 and 31536000 or p_limit is null or p_limit not between 0 and 1000000 then
    raise exception 'Invalid rate limit parameters';
  end if;
  if p_limit = 0 then return false; end if;
  period_start := (current_epoch / p_window_seconds) * p_window_seconds;
  delete from public.ipc_rate_limits where expires_at <= current_epoch;
  insert into public.ipc_rate_limits(rate_key, window_seconds, window_start, expires_at, attempts)
  values (p_key, p_window_seconds, period_start, period_start + p_window_seconds, 1)
  on conflict (rate_key, window_seconds, window_start)
  do update set attempts = ipc_rate_limits.attempts + 1
  returning attempts into consumed;
  return consumed <= p_limit;
end;
$$;
revoke all on function public.ipc_consume_rate(text, integer, integer) from public, anon, authenticated;
grant execute on function public.ipc_consume_rate(text, integer, integer) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ipc-briefs', 'ipc-briefs', false, 4194304, array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- The private bucket intentionally has no anon/authenticated storage policies.
-- Server requests use a secret key mapped to service_role; it bypasses Storage RLS.
notify pgrst, 'reload schema';
commit;
