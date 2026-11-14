# Supabase setup

The SQL migration in `migrations/` creates the initial Petzo PostgreSQL schema and row-level security policies for pet profiles, photos, favourites, free adoption, marketplace listings/enquiries, memberships and admin moderation.

## Create the project and get the public config

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open the project and use **Connect** to copy its Project URL and publishable key. The alternate path is **Project Settings → API Keys**. New projects use `sb_publishable_...`; older projects may show an `anon` key.
3. Put those values in your local `.env.local` (never in Git):

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   The publishable/anon key is designed for client configuration and is safe only with correct RLS policies. Never put a secret/service-role key in a `NEXT_PUBLIC_` variable or send one in chat.

## Apply the schema

In the dashboard, open **SQL Editor → New query**, paste `migrations/202611140001_initial_petzo_schema.sql`, and run it. Then open **Table Editor** and confirm the tables exist. Create user accounts through Supabase Auth before assigning moderators/admins. Add an admin by inserting that Auth user's UUID into `public.admin_users`; do not reuse the local preview admin password.

For uploaded profile/listing images and private seller documents, configure separate Supabase Storage buckets and their policies before accepting real uploads. Keep seller identity documents private.

## Current integration boundary

This migration is the production database foundation, not a claim that the website's existing API routes already use Supabase. The current site server still reads/writes its local SQLite database and its local admin login is explicitly development-only. Supabase Auth, Storage, and replacing the SQLite API stores must be completed and tested before production deployment. Membership payment remains disconnected until Razorpay order verification and webhooks are implemented.
