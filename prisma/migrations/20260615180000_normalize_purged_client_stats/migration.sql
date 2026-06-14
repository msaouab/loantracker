CREATE TABLE "purged_client_stats" (
    "userId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "loanCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "purged_client_stats_pkey" PRIMARY KEY ("userId", "clientName")
);

CREATE INDEX "purged_client_stats_userId_idx" ON "purged_client_stats"("userId");

ALTER TABLE "purged_client_stats"
  ADD CONSTRAINT "purged_client_stats_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "purged_client_stats" ("userId", "clientName", "totalAmount", "loanCount")
SELECT
  us."userId",
  kv.key,
  (kv.value)::int,
  1
FROM "user_stats" us
CROSS JOIN LATERAL jsonb_each_text(us."purgedClientTotals") AS kv(key, value)
ON CONFLICT ("userId", "clientName") DO UPDATE
SET
  "totalAmount" = EXCLUDED."totalAmount",
  "loanCount" = EXCLUDED."loanCount";

ALTER TABLE "user_stats" DROP COLUMN "purgedClientNames";
ALTER TABLE "user_stats" DROP COLUMN "purgedClientTotals";
