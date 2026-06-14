-- Drop unused password-reset and activation token columns from users.
ALTER TABLE "users" DROP COLUMN IF EXISTS "activationToken";
ALTER TABLE "users" DROP COLUMN IF EXISTS "activationTokenExpiry";
ALTER TABLE "users" DROP COLUMN IF EXISTS "resetToken";
ALTER TABLE "users" DROP COLUMN IF EXISTS "resetTokenExpiry";
