import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });
config();

if (!process.argv.includes('--apply')) throw new Error('Migration writes data. Run with --apply after backing up both databases.');
const sourceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const sourceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!sourceUrl || !sourceKey || !targetUrl) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, and DIRECT_URL in .env.local.');

const sourceHeaders = { apikey: sourceKey, Authorization: `Bearer ${sourceKey}`, Accept: 'application/json' };
const sql = neon(targetUrl);
let offset = 0;
let migrated = 0;
const batchSize = 500;

while (true) {
  const response = await fetch(`${sourceUrl}/rest/v1/petzo_app_records?select=*&order=row_id.asc`, {
    headers: { ...sourceHeaders, Range: `${offset}-${offset + batchSize - 1}` },
  });
  if (!response.ok) throw new Error(`Could not read Supabase records (${response.status}).`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Supabase returned an invalid record batch.');
  for (const row of rows) {
    await sql.query(
      `INSERT INTO petzo_app_records (row_id, collection, record_key, data, owner_token_hash, listing_id, workspace_id, created_at, updated_at)
       OVERRIDING SYSTEM VALUE VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9)
       ON CONFLICT (row_id) DO UPDATE SET collection=EXCLUDED.collection, record_key=EXCLUDED.record_key,
       data=EXCLUDED.data, owner_token_hash=EXCLUDED.owner_token_hash, listing_id=EXCLUDED.listing_id,
       workspace_id=EXCLUDED.workspace_id, created_at=EXCLUDED.created_at, updated_at=EXCLUDED.updated_at`,
      [String(row.row_id), row.collection, row.record_key, JSON.stringify(row.data), row.owner_token_hash,
        row.listing_id === null ? null : String(row.listing_id), row.workspace_id, row.created_at, row.updated_at],
    );
  }
  migrated += rows.length;
  offset += rows.length;
  console.log(`Copied ${migrated} records…`);
  if (rows.length < batchSize) break;
}

await sql.query(`SELECT setval(pg_get_serial_sequence('petzo_app_records','row_id'), GREATEST(COALESCE(MAX(row_id),0)+1,1), false) FROM petzo_app_records`);
const [target] = await sql`SELECT count(*)::int AS total FROM petzo_app_records`;
if (Number(target.total) < migrated) throw new Error(`Neon has ${target.total} rows; expected at least ${migrated}.`);
console.log(`Migration complete: ${migrated} Supabase records copied; Neon now has ${target.total}.`);
