-- AlterTable
ALTER TABLE "loans" ALTER COLUMN "totalAmount" SET DATA TYPE INTEGER USING (ROUND("totalAmount"::numeric)::integer),
ALTER COLUMN "amountPaid" SET DEFAULT 0,
ALTER COLUMN "amountPaid" SET DATA TYPE INTEGER USING (ROUND("amountPaid"::numeric)::integer);
