CREATE TABLE IF NOT EXISTS "petzo_app_records" (
  "row_id" BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  "collection" TEXT NOT NULL,
  "record_key" TEXT,
  "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "owner_token_hash" TEXT,
  "listing_id" BIGINT,
  "workspace_id" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "petzo_app_records_pkey" PRIMARY KEY ("row_id"),
  CONSTRAINT "petzo_app_records_collection_record_key_key" UNIQUE ("collection", "record_key")
);

CREATE INDEX IF NOT EXISTS "petzo_app_records_collection_idx"
  ON "petzo_app_records" ("collection", "row_id" DESC);
CREATE INDEX IF NOT EXISTS "petzo_app_records_owner_token_idx"
  ON "petzo_app_records" ("collection", "owner_token_hash")
  WHERE "owner_token_hash" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "petzo_app_records_listing_idx"
  ON "petzo_app_records" ("collection", "listing_id", "row_id" DESC)
  WHERE "listing_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "petzo_app_records_workspace_idx"
  ON "petzo_app_records" ("collection", "workspace_id", "row_id" DESC)
  WHERE "workspace_id" IS NOT NULL;
