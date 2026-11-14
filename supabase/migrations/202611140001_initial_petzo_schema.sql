-- Petzo initial production schema for Supabase PostgreSQL.
-- Apply with Supabase SQL Editor or `supabase db push` after linking the project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  phone text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'moderator')),
  created_at timestamptz not null default now()
);

create or replace function public.is_petzo_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

revoke all on function public.is_petzo_admin() from public;
grant execute on function public.is_petzo_admin() to authenticated;

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('Dog', 'Cat')),
  breed text not null default '',
  gender text check (gender in ('Male', 'Female', 'Unknown')),
  age_years integer not null default 0 check (age_years between 0 and 40),
  age_months integer not null default 0 check (age_months between 0 and 11),
  date_of_birth date,
  city text not null default '',
  bio text not null default '',
  health text not null default '',
  vaccination text not null default '',
  purposes text[] not null default '{}',
  preferred_pet_types text[] not null default '{}',
  max_distance_km integer check (max_distance_km between 1 and 100),
  find_anywhere boolean not null default false,
  status text not null default 'pending' check (status in ('draft', 'pending', 'approved', 'rejected')),
  availability boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pet_photos (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  title text not null default '',
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (pet_id, storage_path)
);

create table if not exists public.favourites (
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, pet_id)
);

create table if not exists public.adoption_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  pet_name text not null,
  type text not null check (type in ('Dog', 'Cat')),
  breed text not null default '',
  age_years integer not null default 0 check (age_years between 0 and 40),
  age_months integer not null default 0 check (age_months between 0 and 11),
  gender text check (gender in ('Male', 'Female', 'Unknown')),
  city text not null default '',
  vaccination text not null default '',
  health text not null default '',
  reason text not null,
  photos text[] not null default '{}',
  organisation_verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'adopted', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep personal contact information out of publicly readable listing rows.
create table if not exists public.adoption_listing_contacts (
  listing_id uuid primary key references public.adoption_listings(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  organisation_name text,
  updated_at timestamptz not null default now()
);

create table if not exists public.adoption_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.adoption_listings(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  household text not null default '',
  pet_experience text not null default '',
  care_plan text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, applicant_id)
);

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  pet_name text not null,
  type text not null check (type in ('Dog', 'Cat')),
  breed text not null default '',
  age_years integer not null default 0 check (age_years between 0 and 40),
  age_months integer not null default 0 check (age_months between 0 and 11),
  gender text check (gender in ('Male', 'Female', 'Unknown')),
  city text not null default '',
  price numeric(12,2) not null check (price >= 0),
  photos text[] not null default '{}',
  vaccination text not null default '',
  health text not null default '',
  seller_verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'sold', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_seller_private (
  listing_id uuid primary key references public.marketplace_listings(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  seller_name text not null,
  seller_email text not null,
  seller_phone text,
  registration_details text,
  veterinary_documents text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_enquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric(12,2) not null default 0 check (price >= 0),
  duration_months integer not null default 1 check (duration_months > 0),
  description text not null default '',
  features text[] not null default '{}',
  active boolean not null default true,
  premium boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists pets_public_idx on public.pets (status, availability, type, city);
create index if not exists adoption_public_idx on public.adoption_listings (status, type, city);
create index if not exists marketplace_public_idx on public.marketplace_listings (status, type, city);
create index if not exists adoption_requests_listing_idx on public.adoption_requests (listing_id, status);
create index if not exists marketplace_enquiries_listing_idx on public.marketplace_enquiries (listing_id, status);

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.pets enable row level security;
alter table public.pet_photos enable row level security;
alter table public.favourites enable row level security;
alter table public.adoption_listings enable row level security;
alter table public.adoption_listing_contacts enable row level security;
alter table public.adoption_requests enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_seller_private enable row level security;
alter table public.marketplace_enquiries enable row level security;
alter table public.site_settings enable row level security;
alter table public.membership_plans enable row level security;
alter table public.audit_log enable row level security;

create policy "users read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_petzo_admin());
create policy "users create own profile" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "users update own profile" on public.profiles for update to authenticated using (id = (select auth.uid()) or public.is_petzo_admin()) with check (id = (select auth.uid()) or public.is_petzo_admin());
create policy "admins manage admin users" on public.admin_users for all to authenticated using (public.is_petzo_admin()) with check (public.is_petzo_admin());

create policy "read approved pets or own pets" on public.pets for select to anon, authenticated using ((status = 'approved' and availability) or owner_id = (select auth.uid()) or public.is_petzo_admin());
create policy "owners submit pets" on public.pets for insert to authenticated with check (owner_id = (select auth.uid()) and status in ('draft', 'pending'));
create policy "owners edit own unpublished pets" on public.pets for update to authenticated using ((owner_id = (select auth.uid()) and status in ('draft', 'pending')) or public.is_petzo_admin()) with check ((owner_id = (select auth.uid()) and status in ('draft', 'pending')) or public.is_petzo_admin());
create policy "owners delete own unpublished pets" on public.pets for delete to authenticated using ((owner_id = (select auth.uid()) and status in ('draft', 'pending')) or public.is_petzo_admin());

create policy "read public or owned pet photos" on public.pet_photos for select to anon, authenticated using (exists (select 1 from public.pets p where p.id = pet_id and ((p.status = 'approved' and p.availability) or p.owner_id = (select auth.uid()) or public.is_petzo_admin())));
create policy "owners manage own pet photos" on public.pet_photos for all to authenticated using ((owner_id = (select auth.uid()) and exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = (select auth.uid()) and p.status in ('draft', 'pending'))) or public.is_petzo_admin()) with check ((owner_id = (select auth.uid()) and exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = (select auth.uid()) and p.status in ('draft', 'pending'))) or public.is_petzo_admin());

create policy "users manage own favourites" on public.favourites for all to authenticated using (user_id = (select auth.uid()) or public.is_petzo_admin()) with check (user_id = (select auth.uid()) or public.is_petzo_admin());

create policy "read approved adoption listings or owned" on public.adoption_listings for select to anon, authenticated using ((status = 'approved') or owner_id = (select auth.uid()) or public.is_petzo_admin());
create policy "owners create adoption listings" on public.adoption_listings for insert to authenticated with check (owner_id = (select auth.uid()) and status = 'pending');
create policy "owners edit pending adoption listings" on public.adoption_listings for update to authenticated using ((owner_id = (select auth.uid()) and status in ('pending', 'approved')) or public.is_petzo_admin()) with check ((owner_id = (select auth.uid()) and status in ('pending', 'approved')) or public.is_petzo_admin());
create policy "owners or admins delete adoption listings" on public.adoption_listings for delete to authenticated using (owner_id = (select auth.uid()) or public.is_petzo_admin());
create policy "listing owners and admins read adoption contacts" on public.adoption_listing_contacts for select to authenticated using (owner_id = (select auth.uid()) or public.is_petzo_admin());
create policy "listing owners manage adoption contacts" on public.adoption_listing_contacts for all to authenticated using (owner_id = (select auth.uid()) or public.is_petzo_admin()) with check (owner_id = (select auth.uid()) or public.is_petzo_admin());

create policy "applicants and listing owners read adoption requests" on public.adoption_requests for select to authenticated using (applicant_id = (select auth.uid()) or exists (select 1 from public.adoption_listings l where l.id = listing_id and l.owner_id = (select auth.uid())) or public.is_petzo_admin());
create policy "signed in users apply for adoption" on public.adoption_requests for insert to authenticated with check (applicant_id = (select auth.uid()) and exists (select 1 from public.adoption_listings l where l.id = listing_id and l.status = 'approved' and l.owner_id <> (select auth.uid())));
create policy "owners review adoption requests" on public.adoption_requests for update to authenticated using (exists (select 1 from public.adoption_listings l where l.id = listing_id and l.owner_id = (select auth.uid())) or public.is_petzo_admin()) with check (exists (select 1 from public.adoption_listings l where l.id = listing_id and l.owner_id = (select auth.uid())) or public.is_petzo_admin());
create policy "applicants withdraw own requests" on public.adoption_requests for delete to authenticated using (applicant_id = (select auth.uid()) or public.is_petzo_admin());

create policy "read approved marketplace listings or owned" on public.marketplace_listings for select to anon, authenticated using ((status = 'approved') or seller_id = (select auth.uid()) or public.is_petzo_admin());
create policy "sellers submit marketplace listings" on public.marketplace_listings for insert to authenticated with check (seller_id = (select auth.uid()) and status = 'pending');
create policy "sellers edit pending marketplace listings" on public.marketplace_listings for update to authenticated using ((seller_id = (select auth.uid()) and status in ('pending', 'approved')) or public.is_petzo_admin()) with check ((seller_id = (select auth.uid()) and status in ('pending', 'approved')) or public.is_petzo_admin());
create policy "sellers or admins delete marketplace listings" on public.marketplace_listings for delete to authenticated using (seller_id = (select auth.uid()) or public.is_petzo_admin());
create policy "sellers and admins read private seller details" on public.marketplace_seller_private for select to authenticated using (seller_id = (select auth.uid()) or public.is_petzo_admin());
create policy "sellers manage private seller details" on public.marketplace_seller_private for all to authenticated using (seller_id = (select auth.uid()) or public.is_petzo_admin()) with check (seller_id = (select auth.uid()) or public.is_petzo_admin());

create policy "buyers and sellers read enquiries" on public.marketplace_enquiries for select to authenticated using (buyer_id = (select auth.uid()) or exists (select 1 from public.marketplace_listings m where m.id = listing_id and m.seller_id = (select auth.uid())) or public.is_petzo_admin());
create policy "signed in users send enquiries" on public.marketplace_enquiries for insert to authenticated with check (buyer_id = (select auth.uid()) and exists (select 1 from public.marketplace_listings m where m.id = listing_id and m.status = 'approved' and m.seller_id <> (select auth.uid())));
create policy "sellers respond to enquiries" on public.marketplace_enquiries for update to authenticated using (exists (select 1 from public.marketplace_listings m where m.id = listing_id and m.seller_id = (select auth.uid())) or public.is_petzo_admin()) with check (exists (select 1 from public.marketplace_listings m where m.id = listing_id and m.seller_id = (select auth.uid())) or public.is_petzo_admin());

create policy "public read safe site settings" on public.site_settings for select to anon, authenticated using (key in ('announcement', 'hero', 'public_contact_email'));
create policy "admins manage site settings" on public.site_settings for all to authenticated using (public.is_petzo_admin()) with check (public.is_petzo_admin());
create policy "public read active plans" on public.membership_plans for select to anon, authenticated using (active or public.is_petzo_admin());
create policy "admins manage membership plans" on public.membership_plans for all to authenticated using (public.is_petzo_admin()) with check (public.is_petzo_admin());
create policy "admins read audit log" on public.audit_log for select to authenticated using (public.is_petzo_admin());
create policy "admins create audit log entries" on public.audit_log for insert to authenticated with check (public.is_petzo_admin());

grant select on public.pets, public.pet_photos, public.adoption_listings, public.marketplace_listings, public.site_settings, public.membership_plans to anon;
grant select, insert, update, delete on public.profiles, public.pets, public.pet_photos, public.favourites, public.adoption_listings, public.adoption_listing_contacts, public.adoption_requests, public.marketplace_listings, public.marketplace_seller_private, public.marketplace_enquiries to authenticated;
grant select, insert, update, delete on public.admin_users, public.site_settings, public.membership_plans to authenticated;
grant select, insert on public.audit_log to authenticated;
grant usage, select on sequence public.audit_log_id_seq to authenticated;

insert into public.membership_plans (name, price, duration_months, description, features, active, premium)
values
  ('Free', 0, 1, 'Explore the community.', array['Browse approved pet profiles', 'Save favourite pet profiles', 'Free adoption listings and requests'], true, false),
  ('Premium', 499, 1, 'Optional membership for additional matching features.', array['Additional matching features (when enabled)'], true, true)
on conflict (name) do nothing;

