-- CreateTable
CREATE TABLE "loan_payments" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loan_payments_loanId_idx" ON "loan_payments"("loanId");

-- CreateIndex
CREATE INDEX "loan_payments_paidAt_idx" ON "loan_payments"("paidAt");

-- AddForeignKey
ALTER TABLE "loan_payments" ADD CONSTRAINT "loan_payments_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing paid amounts as a single payment record per loan
INSERT INTO "loan_payments" ("id", "loanId", "amount", "paidAt", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "amountPaid",
    "loanDate",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "loans"
WHERE "amountPaid" > 0;
