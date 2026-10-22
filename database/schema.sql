-- BKD General Hospital Pharmacy Management System
-- Fresh-install schema for MySQL 8.0+. Select the target database before importing.
-- Workflow permissions must still be enforced by the application/API.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_key VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles(role_key,name,description) VALUES
 ('super_administrator','Super Administrator','System and organization administration; no implicit dispensing or stock approval.'),
 ('cmd_executive','CMD / Authorized Executive','Read-only executive visibility and explicitly authorized oversight.'),
 ('head_pharmacist','Head Pharmacist','Pharmacy control, approvals and inventory governance.'),
 ('drf_store_keeper','DRF Store Keeper','Central store receiving, inventory and stock movements.'),
 ('pharmacy_dispenser','Pharmacy Dispenser','Sales, dispensing and assigned-pharmacy stock workflows.'),
 ('pharmacy_supervisor','Pharmacy Supervisor','Daily pharmacy oversight, reconciliation and day closing.'),
 ('cashier','Cashier','Payment verification and payment reconciliation.'),
 ('procurement_officer','Procurement Officer','Supplier, replenishment and purchase order workflows.'),
 ('internal_auditor','Internal Auditor','Read-only independent audit and transaction traceability.'),
 ('system_administrator','System Administrator','Technical operations, system health and approved configuration.');

CREATE TABLE permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  permission_key VARCHAR(120) NOT NULL UNIQUE,
  module VARCHAR(80) NOT NULL,
  action VARCHAR(60) NOT NULL,
  description VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY(role_id,permission_id),
  FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY(permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE locations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  type ENUM('central_store','pharmacy','other') NOT NULL,
  address VARCHAR(255) NULL,
  phone VARCHAR(40) NULL,
  supervisor_user_id BIGINT UNSIGNED NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_locations_active(is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(190) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  staff_id VARCHAR(80) NULL UNIQUE,
  role_id BIGINT UNSIGNED NOT NULL,
  primary_location_id BIGINT UNSIGNED NULL,
  phone VARCHAR(40) NULL,
  status ENUM('active','suspended','pending') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  password_changed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role_status(role_id,status),
  FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  FOREIGN KEY(primary_location_id) REFERENCES locations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE locations ADD CONSTRAINT fk_locations_supervisor FOREIGN KEY(supervisor_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE user_locations (
  user_id BIGINT UNSIGNED NOT NULL,
  location_id BIGINT UNSIGNED NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY(user_id,location_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE access_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL DEFAULT 'session',
  expires_at DATETIME NULL,
  last_used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tokens_user_expiry(user_id,expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE password_reset_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reset_expiry(expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE suppliers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NULL UNIQUE,
  name VARCHAR(190) NOT NULL,
  contact_person VARCHAR(160) NULL,
  phone VARCHAR(40) NULL,
  email VARCHAR(190) NULL,
  address VARCHAR(255) NULL,
  registration_no VARCHAR(100) NULL,
  notes TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_suppliers_name(name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE drugs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(80) NOT NULL UNIQUE,
  barcode VARCHAR(100) NULL UNIQUE,
  generic_name VARCHAR(220) NOT NULL,
  brand_name VARCHAR(180) NULL,
  category VARCHAR(120) NULL,
  strength VARCHAR(100) NULL,
  dosage_form VARCHAR(100) NULL,
  base_unit VARCHAR(60) NOT NULL DEFAULT 'unit',
  purchase_unit VARCHAR(60) NULL,
  units_per_purchase DECIMAL(12,4) NOT NULL DEFAULT 1,
  controlled_drug BOOLEAN NOT NULL DEFAULT FALSE,
  prescription_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_drugs_name(generic_name), INDEX idx_drugs_category(category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE drug_units (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  drug_id BIGINT UNSIGNED NOT NULL,
  unit_name VARCHAR(60) NOT NULL,
  units_per_unit DECIMAL(12,4) NOT NULL DEFAULT 1,
  selling_price_ngn DECIMAL(14,2) NOT NULL DEFAULT 0,
  effective_from DATETIME NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_drug_unit(drug_id,unit_name),
  FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE price_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  drug_id BIGINT UNSIGNED NOT NULL,
  location_id BIGINT UNSIGNED NULL,
  old_price_ngn DECIMAL(14,2) NOT NULL,
  new_price_ngn DECIMAL(14,2) NOT NULL,
  effective_from DATETIME NOT NULL,
  changed_by BIGINT UNSIGNED NOT NULL,
  approved_by BIGINT UNSIGNED NULL,
  reason VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT,
  FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(changed_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_price_history_effective(drug_id,effective_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reorder_rules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  drug_id BIGINT UNSIGNED NOT NULL,
  location_id BIGINT UNSIGNED NOT NULL,
  minimum_quantity DECIMAL(14,3) NOT NULL DEFAULT 0,
  reorder_quantity DECIMAL(14,3) NULL,
  lead_time_days SMALLINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reorder_drug_location(drug_id,location_id),
  FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT,
  FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_batches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  drug_id BIGINT UNSIGNED NOT NULL,
  location_id BIGINT UNSIGNED NOT NULL,
  supplier_id BIGINT UNSIGNED NULL,
  batch_no VARCHAR(100) NOT NULL,
  expiry_date DATE NOT NULL,
  quantity_on_hand DECIMAL(14,3) NOT NULL DEFAULT 0,
  quantity_reserved DECIMAL(14,3) NOT NULL DEFAULT 0,
  quantity_quarantined DECIMAL(14,3) NOT NULL DEFAULT 0,
  cost_price_ngn DECIMAL(14,2) NOT NULL DEFAULT 0,
  selling_price_ngn DECIMAL(14,2) NOT NULL DEFAULT 0,
  status ENUM('usable','quarantined','recalled','expired') NOT NULL DEFAULT 'usable',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_batch_location(drug_id,location_id,batch_no),
  INDEX idx_batch_expiry(location_id,expiry_date), INDEX idx_batch_drug(drug_id,location_id),
  FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT,
  FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  CHECK(quantity_on_hand>=0 AND quantity_reserved>=0 AND quantity_quarantined>=0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_no VARCHAR(60) NOT NULL UNIQUE,
  requesting_location_id BIGINT UNSIGNED NOT NULL,
  priority ENUM('routine','urgent','critical') NOT NULL DEFAULT 'routine',
  status ENUM('draft','pending','approved','rejected','converted','cancelled') NOT NULL DEFAULT 'draft',
  reason TEXT NULL,
  requested_by BIGINT UNSIGNED NOT NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(requesting_location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(requested_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_purchase_requests_status(status,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_request_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_request_id BIGINT UNSIGNED NOT NULL,
  drug_id BIGINT UNSIGNED NOT NULL,
  quantity_requested DECIMAL(14,3) NOT NULL,
  suggested_supplier_id BIGINT UNSIGNED NULL,
  notes VARCHAR(500) NULL,
  FOREIGN KEY(purchase_request_id) REFERENCES purchase_requests(id) ON DELETE RESTRICT,
  FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT,
  FOREIGN KEY(suggested_supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  po_no VARCHAR(60) NOT NULL UNIQUE,
  supplier_id BIGINT UNSIGNED NOT NULL,
  destination_location_id BIGINT UNSIGNED NOT NULL,
  status ENUM('draft','pending_approval','approved','sent','partially_received','received','rejected','cancelled') NOT NULL DEFAULT 'draft',
  order_date DATE NOT NULL,
  expected_date DATE NULL,
  currency CHAR(3) NOT NULL DEFAULT 'NGN',
  total_ngn DECIMAL(14,2) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  approved_by BIGINT UNSIGNED NULL,
  approved_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
  FOREIGN KEY(destination_location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_po_status_date(status,order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id BIGINT UNSIGNED NOT NULL,
  drug_id BIGINT UNSIGNED NOT NULL,
  quantity_ordered DECIMAL(14,3) NOT NULL,
  quantity_received DECIMAL(14,3) NOT NULL DEFAULT 0,
  unit_cost_ngn DECIMAL(14,2) NOT NULL,
  line_total_ngn DECIMAL(14,2) NOT NULL,
  notes VARCHAR(500) NULL,
  FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE goods_receipts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  grn_no VARCHAR(60) NOT NULL UNIQUE,
  purchase_order_id BIGINT UNSIGNED NULL,
  supplier_id BIGINT UNSIGNED NOT NULL,
  destination_location_id BIGINT UNSIGNED NOT NULL,
  supplier_invoice_no VARCHAR(100) NULL,
  delivery_reference VARCHAR(100) NULL,
  received_at DATETIME NOT NULL,
  status ENUM('draft','pending_approval','approved','posted','rejected','cancelled') NOT NULL DEFAULT 'draft',
  total_cost_ngn DECIMAL(14,2) NOT NULL DEFAULT 0,
  remarks TEXT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  approved_by BIGINT UNSIGNED NULL,
  posted_by BIGINT UNSIGNED NULL,
  approved_at DATETIME NULL,
  posted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  FOREIGN KEY(supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
  FOREIGN KEY(destination_location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(posted_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_grn_status_date(status,received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE goods_receipt_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  goods_receipt_id BIGINT UNSIGNED NOT NULL,
  purchase_order_item_id BIGINT UNSIGNED NULL,
  drug_id BIGINT UNSIGNED NOT NULL,
  batch_no VARCHAR(100) NOT NULL,
  expiry_date DATE NOT NULL,
  quantity_received DECIMAL(14,3) NOT NULL,
  quantity_accepted DECIMAL(14,3) NOT NULL DEFAULT 0,
  quantity_rejected DECIMAL(14,3) NOT NULL DEFAULT 0,
  unit_cost_ngn DECIMAL(14,2) NOT NULL,
  rejection_reason VARCHAR(500) NULL,
  FOREIGN KEY(goods_receipt_id) REFERENCES goods_receipts(id) ON DELETE RESTRICT,
  FOREIGN KEY(purchase_order_item_id) REFERENCES purchase_order_items(id) ON DELETE SET NULL,
  FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT,
  CHECK(quantity_received>=0 AND quantity_accepted>=0 AND quantity_rejected>=0 AND quantity_accepted+quantity_rejected<=quantity_received)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_no VARCHAR(60) NOT NULL UNIQUE,
  source_location_id BIGINT UNSIGNED NOT NULL,
  requesting_location_id BIGINT UNSIGNED NOT NULL,
  priority ENUM('routine','urgent','critical') NOT NULL DEFAULT 'routine',
  status ENUM('draft','pending','partially_fulfilled','approved','rejected','fulfilled','cancelled') NOT NULL DEFAULT 'draft',
  reason TEXT NULL,
  requested_by BIGINT UNSIGNED NOT NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(source_location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(requesting_location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(requested_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_stock_requests_status(status,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_request_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  stock_request_id BIGINT UNSIGNED NOT NULL,
  drug_id BIGINT UNSIGNED NOT NULL,
  quantity_requested DECIMAL(14,3) NOT NULL,
  quantity_approved DECIMAL(14,3) NULL,
  notes VARCHAR(500) NULL,
  FOREIGN KEY(stock_request_id) REFERENCES stock_requests(id) ON DELETE RESTRICT,
  FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_transfers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transfer_no VARCHAR(60) NOT NULL UNIQUE,
  stock_request_id BIGINT UNSIGNED NULL,
  source_location_id BIGINT UNSIGNED NOT NULL,
  destination_location_id BIGINT UNSIGNED NOT NULL,
  drug_id BIGINT UNSIGNED NOT NULL,
  source_batch_id BIGINT UNSIGNED NULL,
  destination_batch_id BIGINT UNSIGNED NULL,
  batch_no VARCHAR(100) NOT NULL,
  quantity_dispatched DECIMAL(14,3) NOT NULL,
  quantity_received DECIMAL(14,3) NOT NULL DEFAULT 0,
  status ENUM('draft','pending_approval','approved','in_transit','partially_received','completed','rejected','cancelled') NOT NULL DEFAULT 'draft',
  created_by BIGINT UNSIGNED NOT NULL,
  approved_by BIGINT UNSIGNED NULL,
  dispatched_by BIGINT UNSIGNED NULL,
  received_by BIGINT UNSIGNED NULL,
  dispatched_at DATETIME NULL,
  received_at DATETIME NULL,
  discrepancy_note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(stock_request_id) REFERENCES stock_requests(id) ON DELETE SET NULL,
  FOREIGN KEY(source_location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(destination_location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT,
  FOREIGN KEY(source_batch_id) REFERENCES stock_batches(id) ON DELETE SET NULL,
  FOREIGN KEY(destination_batch_id) REFERENCES stock_batches(id) ON DELETE SET NULL,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(dispatched_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(received_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_transfers_status(status,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE patients (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  folder_no VARCHAR(100) NOT NULL UNIQUE,
  full_name VARCHAR(190) NOT NULL,
  phone VARCHAR(40) NULL,
  nhis_number VARCHAR(100) NULL,
  date_of_birth DATE NULL,
  sex ENUM('female','male','other','unknown') NULL,
  address VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_patients_name(full_name), INDEX idx_patients_phone(phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE prescriptions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  prescription_no VARCHAR(80) NOT NULL UNIQUE,
  patient_id BIGINT UNSIGNED NOT NULL,
  prescribed_by BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','partially_dispensed','dispensed','cancelled','expired') NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  prescribed_at DATETIME NOT NULL,
  expires_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY(prescribed_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_prescriptions_patient_status(patient_id,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE prescription_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  prescription_id BIGINT UNSIGNED NOT NULL,
  drug_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(14,3) NOT NULL,
  dispensed_quantity DECIMAL(14,3) NOT NULL DEFAULT 0,
  dosage VARCHAR(160) NULL,
  duration VARCHAR(100) NULL,
  instructions TEXT NULL,
  FOREIGN KEY(prescription_id) REFERENCES prescriptions(id) ON DELETE RESTRICT,
  FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sales (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_no VARCHAR(80) NOT NULL UNIQUE,
  client_sale_id CHAR(36) NULL UNIQUE COMMENT 'Offline idempotency key',
  prescription_id BIGINT UNSIGNED NULL,
  patient_id BIGINT UNSIGNED NULL,
  location_id BIGINT UNSIGNED NOT NULL,
  cashier_user_id BIGINT UNSIGNED NULL,
  dispenser_user_id BIGINT UNSIGNED NOT NULL,
  sale_type ENUM('inpatient','outpatient','walk_in') NOT NULL DEFAULT 'outpatient',
  client_name VARCHAR(190) NULL,
  subtotal_ngn DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount_ngn DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_ngn DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_ngn DECIMAL(14,2) NOT NULL DEFAULT 0,
  payment_status ENUM('pending','part_paid','paid','failed','part_refunded','refunded') NOT NULL DEFAULT 'pending',
  status ENUM('draft','invoiced','completed','cancelled','reversed') NOT NULL DEFAULT 'draft',
  sold_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL,
  FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE SET NULL,
  FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(cashier_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(dispenser_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_sales_date_location(sold_at,location_id), INDEX idx_sales_status(status,payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sale_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL,
  drug_id BIGINT UNSIGNED NOT NULL,
  stock_batch_id BIGINT UNSIGNED NULL,
  batch_no VARCHAR(100) NULL,
  quantity_base DECIMAL(14,3) NOT NULL,
  sale_quantity DECIMAL(14,3) NOT NULL,
  sale_unit VARCHAR(60) NULL,
  unit_price_ngn DECIMAL(14,2) NOT NULL,
  unit_cost_ngn DECIMAL(14,2) NOT NULL DEFAULT 0,
  line_total_ngn DECIMAL(14,2) NOT NULL,
  FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE RESTRICT,
  FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT,
  FOREIGN KEY(stock_batch_id) REFERENCES stock_batches(id) ON DELETE SET NULL,
  INDEX idx_sale_items_drug(drug_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_no VARCHAR(80) NOT NULL UNIQUE,
  sale_id BIGINT UNSIGNED NOT NULL,
  method ENUM('cash','bank_transfer','pos_terminal','nhis','staff_credit','other') NOT NULL,
  amount_ngn DECIMAL(14,2) NOT NULL,
  amount_tendered_ngn DECIMAL(14,2) NULL,
  reference VARCHAR(160) NULL,
  status ENUM('pending','submitted','verified','failed','reversed','refunded') NOT NULL DEFAULT 'pending',
  received_by BIGINT UNSIGNED NULL,
  verified_by BIGINT UNSIGNED NULL,
  verified_at DATETIME NULL,
  provider_metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE RESTRICT,
  FOREIGN KEY(received_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_payments_status(status,created_at), INDEX idx_payments_reference(reference),
  CHECK(amount_ngn>=0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refund_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL,
  requested_by BIGINT UNSIGNED NOT NULL,
  reason TEXT NOT NULL,
  items JSON NOT NULL,
  requested_amount_ngn DECIMAL(14,2) NOT NULL,
  approved_amount_ngn DECIMAL(14,2) NULL,
  status ENUM('pending','approved','rejected','processed','cancelled') NOT NULL DEFAULT 'pending',
  decided_by BIGINT UNSIGNED NULL,
  decision_note TEXT NULL,
  requested_at DATETIME NOT NULL,
  decided_at DATETIME NULL,
  processed_at DATETIME NULL,
  FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE RESTRICT,
  FOREIGN KEY(requested_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(decided_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_refunds_status(status,requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_returns (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  return_no VARCHAR(60) NOT NULL UNIQUE,
  source_location_id BIGINT UNSIGNED NOT NULL,
  destination_location_id BIGINT UNSIGNED NOT NULL,
  status ENUM('draft','pending_approval','approved','in_transit','received','inspected','completed','rejected','cancelled') NOT NULL DEFAULT 'draft',
  reason TEXT NOT NULL,
  disposition ENUM('pending','return_to_stock','quarantine','dispose') NOT NULL DEFAULT 'pending',
  requested_by BIGINT UNSIGNED NOT NULL,
  approved_by BIGINT UNSIGNED NULL,
  received_by BIGINT UNSIGNED NULL,
  inspected_by BIGINT UNSIGNED NULL,
  submitted_at DATETIME NULL,
  received_at DATETIME NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(source_location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(destination_location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(requested_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(received_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(inspected_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_returns_status(status,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_return_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  stock_return_id BIGINT UNSIGNED NOT NULL,
  drug_id BIGINT UNSIGNED NOT NULL,
  stock_batch_id BIGINT UNSIGNED NULL,
  batch_no VARCHAR(100) NOT NULL,
  expiry_date DATE NULL,
  quantity DECIMAL(14,3) NOT NULL,
  condition_on_return ENUM('sealed','good','damaged','expired','unknown') NOT NULL DEFAULT 'unknown',
  inspection_note TEXT NULL,
  FOREIGN KEY(stock_return_id) REFERENCES stock_returns(id) ON DELETE RESTRICT,
  FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT,
  FOREIGN KEY(stock_batch_id) REFERENCES stock_batches(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_counts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(60) NOT NULL UNIQUE,
  location_id BIGINT UNSIGNED NOT NULL,
  status ENUM('counting','pending_review','completed','cancelled') NOT NULL DEFAULT 'counting',
  started_by BIGINT UNSIGNED NOT NULL,
  completed_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  started_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  notes TEXT NULL,
  FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(started_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(completed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_count_status(location_id,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_count_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  stock_count_id BIGINT UNSIGNED NOT NULL,
  stock_batch_id BIGINT UNSIGNED NULL,
  drug_id BIGINT UNSIGNED NOT NULL,
  batch_no VARCHAR(100) NULL,
  expected_quantity DECIMAL(14,3) NOT NULL,
  counted_quantity DECIMAL(14,3) NULL,
  counted_by BIGINT UNSIGNED NULL,
  counted_at DATETIME NULL,
  variance_reason VARCHAR(500) NULL,
  FOREIGN KEY(stock_count_id) REFERENCES stock_counts(id) ON DELETE RESTRICT,
  FOREIGN KEY(stock_batch_id) REFERENCES stock_batches(id) ON DELETE SET NULL,
  FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT,
  FOREIGN KEY(counted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_adjustments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  adjustment_no VARCHAR(60) NOT NULL UNIQUE,
  location_id BIGINT UNSIGNED NOT NULL,
  stock_batch_id BIGINT UNSIGNED NOT NULL,
  quantity_delta DECIMAL(14,3) NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending','approved','rejected','posted') NOT NULL DEFAULT 'pending',
  requested_by BIGINT UNSIGNED NOT NULL,
  decided_by BIGINT UNSIGNED NULL,
  posted_by BIGINT UNSIGNED NULL,
  decided_at DATETIME NULL,
  posted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(stock_batch_id) REFERENCES stock_batches(id) ON DELETE RESTRICT,
  FOREIGN KEY(requested_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(decided_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(posted_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_adjustments_status(status,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_writeoffs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  writeoff_no VARCHAR(60) NOT NULL UNIQUE,
  location_id BIGINT UNSIGNED NOT NULL,
  stock_batch_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(14,3) NOT NULL,
  reason TEXT NOT NULL,
  estimated_cost_ngn DECIMAL(14,2) NOT NULL DEFAULT 0,
  status ENUM('pending','approved','rejected','posted') NOT NULL DEFAULT 'pending',
  requested_by BIGINT UNSIGNED NOT NULL,
  approved_by BIGINT UNSIGNED NULL,
  posted_by BIGINT UNSIGNED NULL,
  evidence JSON NULL,
  approved_at DATETIME NULL,
  posted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(stock_batch_id) REFERENCES stock_batches(id) ON DELETE RESTRICT,
  FOREIGN KEY(requested_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(posted_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_writeoffs_status(status,approved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inventory_ledger (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transaction_no VARCHAR(80) NOT NULL UNIQUE,
  transaction_type ENUM('opening_balance','grn_post','transfer_out','transfer_in','sale','sale_reversal','return_in','return_out','adjustment','write_off','quarantine','release_quarantine','stock_count') NOT NULL,
  drug_id BIGINT UNSIGNED NOT NULL,
  stock_batch_id BIGINT UNSIGNED NULL,
  location_id BIGINT UNSIGNED NOT NULL,
  batch_no VARCHAR(100) NOT NULL,
  quantity_delta DECIMAL(14,3) NOT NULL,
  balance_after DECIMAL(14,3) NULL,
  unit_cost_ngn DECIMAL(14,2) NULL,
  reference_type VARCHAR(60) NULL,
  reference_id BIGINT UNSIGNED NULL,
  reason VARCHAR(500) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT,
  FOREIGN KEY(stock_batch_id) REFERENCES stock_batches(id) ON DELETE SET NULL,
  FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_ledger_location_drug(location_id,drug_id,batch_no,created_at),
  INDEX idx_ledger_reference(reference_type,reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE business_days (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  location_id BIGINT UNSIGNED NOT NULL,
  business_date DATE NOT NULL,
  status ENUM('open','pending_review','closed','reopened') NOT NULL DEFAULT 'open',
  opened_by BIGINT UNSIGNED NOT NULL,
  closed_by BIGINT UNSIGNED NULL,
  reopened_by BIGINT UNSIGNED NULL,
  opened_at DATETIME NOT NULL,
  closed_at DATETIME NULL,
  reopened_at DATETIME NULL,
  opening_snapshot JSON NULL,
  closing_snapshot JSON NULL,
  notes TEXT NULL,
  UNIQUE KEY uq_business_day_location(location_id,business_date),
  FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY(opened_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(closed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(reopened_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reconciliations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reconciliation_no VARCHAR(60) NOT NULL UNIQUE,
  business_day_id BIGINT UNSIGNED NOT NULL,
  payment_method ENUM('cash','bank_transfer','pos_terminal','nhis','staff_credit','other') NOT NULL,
  expected_ngn DECIMAL(14,2) NOT NULL DEFAULT 0,
  confirmed_ngn DECIMAL(14,2) NOT NULL DEFAULT 0,
  difference_ngn DECIMAL(14,2) NOT NULL DEFAULT 0,
  explanation TEXT NULL,
  status ENUM('draft','submitted','reviewed','approved','exception') NOT NULL DEFAULT 'draft',
  prepared_by BIGINT UNSIGNED NOT NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  FOREIGN KEY(business_day_id) REFERENCES business_days(id) ON DELETE RESTRICT,
  FOREIGN KEY(prepared_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  actor_user_id BIGINT UNSIGNED NULL,
  actor_role VARCHAR(60) NULL,
  action VARCHAR(120) NOT NULL,
  module VARCHAR(80) NOT NULL,
  entity_type VARCHAR(100) NULL,
  entity_id VARCHAR(100) NULL,
  reference_no VARCHAR(100) NULL,
  outcome ENUM('success','failure','review_required') NOT NULL DEFAULT 'success',
  ip_address VARBINARY(16) NULL,
  user_agent VARCHAR(500) NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  metadata JSON NULL,
  FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_time(occurred_at), INDEX idx_audit_actor(actor_user_id,occurred_at),
  INDEX idx_audit_module(module,action,occurred_at), INDEX idx_audit_reference(reference_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  category ENUM('approval','low_stock','expiry','expired_stock','transfer','payment','system','other') NOT NULL DEFAULT 'other',
  severity ENUM('info','success','warning','critical') NOT NULL DEFAULT 'info',
  title VARCHAR(180) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  target_path VARCHAR(500) NULL,
  reference_type VARCHAR(60) NULL,
  reference_id BIGINT UNSIGNED NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_unread(user_id,read_at,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE system_health_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  component VARCHAR(100) NOT NULL,
  severity ENUM('info','warning','error','critical') NOT NULL,
  status ENUM('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
  message VARCHAR(1000) NOT NULL,
  details JSON NULL,
  first_seen_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,
  resolved_by BIGINT UNSIGNED NULL,
  resolved_at DATETIME NULL,
  FOREIGN KEY(resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_health_status(status,severity,last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE backup_runs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  started_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  status ENUM('running','succeeded','failed') NOT NULL DEFAULT 'running',
  destination_label VARCHAR(180) NULL,
  bytes_written BIGINT UNSIGNED NULL,
  checksum VARCHAR(128) NULL,
  error_summary VARCHAR(1000) NULL,
  initiated_by BIGINT UNSIGNED NULL,
  FOREIGN KEY(initiated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_backup_status_time(status,started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE application_settings (
  setting_key VARCHAR(120) PRIMARY KEY,
  setting_value TEXT NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE numbering_sequences (
  sequence_key VARCHAR(80) PRIMARY KEY,
  prefix VARCHAR(20) NOT NULL,
  next_number BIGINT UNSIGNED NOT NULL DEFAULT 1,
  padding SMALLINT UNSIGNED NOT NULL DEFAULT 6,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO locations(code,name,type) VALUES
 ('DRF-STORE','DRF STORE','central_store'),
 ('CENTRAL-PHARMACY','Central Pharmacy','pharmacy'),
 ('JICHMA-PHARMACY','JICHMA Pharmacy','pharmacy'),
 ('OTHER-PHARMACY','Other Pharmacy','pharmacy');

INSERT INTO application_settings(setting_key,setting_value) VALUES
 ('hospital_name','BKD General Hospital'),
 ('currency','NGN'),
 ('timezone','Africa/Lagos'),
 ('low_stock_threshold','20'),
 ('expiry_warning_days','30'),
 ('contact_email',''),
 ('phone',''),
 ('address',''),
 ('default_language','English'),
 ('negative_stock_policy','prevent'),
 ('valuation_method','FEFO'),
 ('reserved_stock_policy','exclude_from_available'),
 ('in_transit_stock_policy','exclude_until_receipt'),
 ('payment_methods','Cash, Bank Transfer, POS Terminal'),
 ('receipt_format','80mm'),
 ('discount_approval','supervisor'),
 ('tax_config','disabled'),
 ('session_timeout','12'),
 ('password_policy','Minimum 10 characters'),
 ('mfa_policy','not_configured'),
 ('login_rate_limits','5 attempts per 15 minutes');

INSERT INTO numbering_sequences(sequence_key,prefix,next_number,padding) VALUES
 ('goods_receipt','GRN-',1,6),
 ('stock_transfer','TRF-',1,6),
 ('stock_return','RET-',1,6),
 ('invoice','INV-',1,6),
 ('receipt','RCP-',1,6),
 ('purchase_order','PO-',1,6);
