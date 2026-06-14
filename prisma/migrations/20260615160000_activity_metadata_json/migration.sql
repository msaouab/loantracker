-- Store activity metadata as native JSON for type safety and queryability.
ALTER TABLE "activity_logs"
  ALTER COLUMN "metadata" TYPE JSONB
  USING CASE
    WHEN "metadata" IS NULL THEN NULL
    ELSE "metadata"::jsonb
  END;
