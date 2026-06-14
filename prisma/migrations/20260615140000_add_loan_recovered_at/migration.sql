-- AlterTable
ALTER TABLE "loans" ADD COLUMN "recoveredAt" TIMESTAMP(3);

-- Backfill fully paid active loans so they enter the 30-day purge window
UPDATE "loans"
SET "recoveredAt" = "updatedAt"
WHERE "amountPaid" >= "totalAmount" AND "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "loans_recoveredAt_idx" ON "loans"("recoveredAt");
