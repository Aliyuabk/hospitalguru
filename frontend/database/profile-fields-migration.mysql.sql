-- Run once against the existing HospitalGuru MySQL database.
-- Adds staff contact and professional profile fields used by Profile & account
-- and Super Admin > Staff management.
ALTER TABLE users
  ADD COLUMN phone VARCHAR(32) NULL AFTER profile_photo_path,
  ADD COLUMN designation VARCHAR(120) NULL AFTER phone,
  ADD COLUMN employee_id VARCHAR(64) NULL AFTER designation,
  ADD COLUMN address VARCHAR(500) NULL AFTER employee_id,
  ADD COLUMN emergency_contact_name VARCHAR(255) NULL AFTER address,
  ADD COLUMN emergency_contact_phone VARCHAR(32) NULL AFTER emergency_contact_name,
  ADD COLUMN professional_license_no VARCHAR(100) NULL AFTER emergency_contact_phone;
