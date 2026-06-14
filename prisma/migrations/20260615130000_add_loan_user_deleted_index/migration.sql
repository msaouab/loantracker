-- CreateIndex
CREATE INDEX "loans_userId_deletedAt_idx" ON "loans"("userId", "deletedAt");
