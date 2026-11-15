-- Server-only app records used by the existing Petzo API flows.
-- Public and authenticated browser roles cannot read or write this table.
create table if not exists public.petzo_app_records (
  row_id bigint generated always as identity primary key,
  collection text not null,
  record_key text,
  data jsonb not null default '{}'::jsonb,
  owner_token_hash text,
  listing_id bigint,
  workspace_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection, record_key)
);

create index if not exists petzo_app_records_collection_idx
  on public.petzo_app_records (collection, row_id desc);
create index if not exists petzo_app_records_owner_token_idx
  on public.petzo_app_records (collection, owner_token_hash)
  where owner_token_hash is not null;
create index if not exists petzo_app_records_listing_idx
  on public.petzo_app_records (collection, listing_id, row_id desc)
  where listing_id is not null;
create index if not exists petzo_app_records_workspace_idx
  on public.petzo_app_records (collection, workspace_id, row_id desc)
  where workspace_id is not null;

alter table public.petzo_app_records enable row level security;
revoke all on table public.petzo_app_records from anon, authenticated;
grant all on table public.petzo_app_records to service_role;
grant usage, select on sequence public.petzo_app_records_row_id_seq to service_role;
