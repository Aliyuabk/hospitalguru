-- Run this once after the pharmacy migrations have created the users table.
USE bkd_pharmacy;

INSERT INTO users
    (name, email, email_verified_at, password, role, department_id, is_active, remember_token, created_at, updated_at)
VALUES
    ('HOD Super Admin', 'superadmin@bkd.local', NOW(), '$2y$10$.HGXTOnxDv20LHROq16EGuksDf2atnRlZZqjztpMEfMVGvn6sZDyy', 'hod', NULL, 1, NULL, NOW(), NOW());
