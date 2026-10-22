-- Run once on an existing hospitalguru database before using the updated
-- business-day open/close workflow. New installations get this column from schema.sql.
USE hospitalguru;
SET @has_opening_snapshot := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='business_days' AND COLUMN_NAME='opening_snapshot'
);
SET @add_opening_snapshot := IF(
  @has_opening_snapshot=0,
  'ALTER TABLE business_days ADD COLUMN opening_snapshot JSON NULL AFTER reopened_at',
  'SELECT 1'
);
PREPARE bkd_snapshot_stmt FROM @add_opening_snapshot;
EXECUTE bkd_snapshot_stmt;
DEALLOCATE PREPARE bkd_snapshot_stmt;
