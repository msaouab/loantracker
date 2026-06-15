-- AlterTable
ALTER TABLE "ip_locations" ADD COLUMN "regionCode" TEXT;
ALTER TABLE "ip_locations" ADD COLUMN "zip" TEXT;
ALTER TABLE "ip_locations" ADD COLUMN "lat" DOUBLE PRECISION;
ALTER TABLE "ip_locations" ADD COLUMN "lon" DOUBLE PRECISION;
ALTER TABLE "ip_locations" ADD COLUMN "timezone" TEXT;
ALTER TABLE "ip_locations" ADD COLUMN "org" TEXT;
ALTER TABLE "ip_locations" ADD COLUMN "asn" TEXT;
