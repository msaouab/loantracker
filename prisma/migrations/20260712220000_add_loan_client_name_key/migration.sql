-- Add normalized client name key for per-manager uniqueness (case-insensitive).
ALTER TABLE "loans" ADD COLUMN "clientNameKey" TEXT;

UPDATE "loans"
SET "clientNameKey" = lower(regexp_replace(trim("clientName"), '\s+', ' ', 'g'))
WHERE "clientNameKey" IS NULL;

ALTER TABLE "loans" ALTER COLUMN "clientNameKey" SET NOT NULL;

CREATE INDEX "loans_userId_clientNameKey_idx" ON "loans"("userId", "clientNameKey");

-- One active/recovered client name per manager; soft-deleted rows are excluded.
CREATE UNIQUE INDEX "loans_userId_clientNameKey_active_key"
ON "loans"("userId", "clientNameKey")
WHERE "deletedAt" IS NULL;
