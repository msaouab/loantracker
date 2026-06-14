CREATE TABLE "user_stats" (
    "userId" TEXT NOT NULL,
    "purgedLoanCount" INTEGER NOT NULL DEFAULT 0,
    "purgedTotalAmount" INTEGER NOT NULL DEFAULT 0,
    "purgedAmountRecovered" INTEGER NOT NULL DEFAULT 0,
    "purgedRecoveredCount" INTEGER NOT NULL DEFAULT 0,
    "purgedTrustedCount" INTEGER NOT NULL DEFAULT 0,
    "purgedNotTrustedCount" INTEGER NOT NULL DEFAULT 0,
    "purgedClientNames" JSONB NOT NULL DEFAULT '[]',
    "purgedClientTotals" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
