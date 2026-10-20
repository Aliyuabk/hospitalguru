-- Complete HospitalGuru MySQL setup: database, current schema, and demo data.
-- Run this file in phpMyAdmin or with the mysql client for a fresh/local demo install.

-- MySQL schema for the Next.js API. Safe to run on an empty database.
-- Existing Laravel installations can continue using the same tables and data.
CREATE TABLE IF NOT EXISTS departments (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, code VARCHAR(255) NOT NULL UNIQUE,
 type VARCHAR(32) NOT NULL, is_active TINYINT(1) NOT NULL DEFAULT 1, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS users (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE,
 email_verified_at TIMESTAMP NULL, password VARCHAR(255) NOT NULL, role VARCHAR(32) NOT NULL, department_id BIGINT UNSIGNED NULL,
 is_active TINYINT(1) NOT NULL DEFAULT 1, remember_token VARCHAR(100) NULL, profile_photo_path VARCHAR(255) NULL,
 phone VARCHAR(32) NULL, designation VARCHAR(120) NULL, employee_id VARCHAR(64) NULL, address VARCHAR(500) NULL,
 emergency_contact_name VARCHAR(255) NULL, emergency_contact_phone VARCHAR(32) NULL, professional_license_no VARCHAR(100) NULL,
 created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL, CONSTRAINT users_department_fk FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS patients (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, folder_no VARCHAR(64) NOT NULL UNIQUE, full_name VARCHAR(255) NOT NULL,
 phone VARCHAR(32) NULL, nhis_number VARCHAR(64) NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
 INDEX patients_name_idx(full_name), INDEX patients_phone_idx(phone), INDEX patients_nhis_idx(nhis_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS suppliers (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(32) NULL, email VARCHAR(255) NULL,
 address VARCHAR(500) NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS drugs (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, barcode VARCHAR(100) NULL UNIQUE, sku VARCHAR(80) NOT NULL UNIQUE,
 category VARCHAR(100) NULL, unit VARCHAR(50) NOT NULL DEFAULT 'Unit', is_active TINYINT(1) NOT NULL DEFAULT 1,
 created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL, INDEX drugs_name_idx(name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS drug_units (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, drug_id BIGINT UNSIGNED NOT NULL,
 unit_name VARCHAR(80) NOT NULL, units_per_unit INT UNSIGNED NOT NULL, selling_price_naira BIGINT UNSIGNED NOT NULL,
 created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL, UNIQUE KEY drug_unit_name_unique(drug_id,unit_name),
 FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS stocks (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, drug_id BIGINT UNSIGNED NOT NULL, department_id BIGINT UNSIGNED NOT NULL,
 batch_no VARCHAR(255) NOT NULL, quantity INT UNSIGNED NOT NULL DEFAULT 0, cost_price_naira BIGINT UNSIGNED NOT NULL,
 selling_price_naira BIGINT UNSIGNED NOT NULL, expiry_date DATE NOT NULL, supplier_id BIGINT UNSIGNED NULL,
 created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL, INDEX stocks_lookup_idx(drug_id,department_id,expiry_date),
 FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE CASCADE, FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE CASCADE,
 FOREIGN KEY(supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS stock_transfers (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, transfer_no VARCHAR(255) NOT NULL UNIQUE, from_department_id BIGINT UNSIGNED NOT NULL,
 to_department_id BIGINT UNSIGNED NOT NULL, drug_id BIGINT UNSIGNED NOT NULL, from_stock_id BIGINT UNSIGNED NULL, batch_no VARCHAR(255) NOT NULL,
 quantity INT UNSIGNED NOT NULL, created_by BIGINT UNSIGNED NOT NULL, status VARCHAR(255) NOT NULL DEFAULT 'completed', transferred_at TIMESTAMP NOT NULL,
 created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL, FOREIGN KEY(from_department_id) REFERENCES departments(id), FOREIGN KEY(to_department_id) REFERENCES departments(id),
 FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE CASCADE, FOREIGN KEY(from_stock_id) REFERENCES stocks(id) ON DELETE SET NULL, FOREIGN KEY(created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS prescriptions (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, prescription_no VARCHAR(255) NOT NULL UNIQUE, patient_id BIGINT UNSIGNED NOT NULL,
 doctor_id BIGINT UNSIGNED NOT NULL, status VARCHAR(255) NOT NULL DEFAULT 'pending', notes TEXT NULL, prescribed_at TIMESTAMP NOT NULL,
 created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL, INDEX prescriptions_status_idx(status,prescribed_at),
 FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE RESTRICT, FOREIGN KEY(doctor_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS prescription_items (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, prescription_id BIGINT UNSIGNED NOT NULL, drug_id BIGINT UNSIGNED NOT NULL,
 quantity INT UNSIGNED NOT NULL, dispensed_quantity INT UNSIGNED NOT NULL DEFAULT 0, dosage VARCHAR(255) NULL, duration VARCHAR(255) NULL,
 instructions TEXT NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL, FOREIGN KEY(prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
 FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS sales (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, invoice_no VARCHAR(255) NOT NULL UNIQUE, client_sale_id CHAR(36) NOT NULL UNIQUE,
 patient_id BIGINT UNSIGNED NULL, prescription_id BIGINT UNSIGNED NULL, staff_id BIGINT UNSIGNED NOT NULL, department_id BIGINT UNSIGNED NOT NULL,
 subtotal_naira BIGINT UNSIGNED NOT NULL, discount_naira BIGINT UNSIGNED NOT NULL DEFAULT 0, total_naira BIGINT UNSIGNED NOT NULL,
 client_name VARCHAR(255) NULL, patient_type VARCHAR(32) NOT NULL DEFAULT 'Outpatient',
 payment_mode VARCHAR(32) NOT NULL, is_synced TINYINT(1) NOT NULL DEFAULT 1, sold_at TIMESTAMP NOT NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
 INDEX sales_department_sold_idx(department_id,sold_at), FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE SET NULL,
 FOREIGN KEY(prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL, FOREIGN KEY(staff_id) REFERENCES users(id), FOREIGN KEY(department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS sale_items (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, sale_id BIGINT UNSIGNED NOT NULL, drug_id BIGINT UNSIGNED NOT NULL,
 quantity INT UNSIGNED NOT NULL, sale_quantity INT UNSIGNED NOT NULL DEFAULT 0, sale_unit_name VARCHAR(80) NULL, unit_price_naira BIGINT UNSIGNED NOT NULL, cost_price_naira BIGINT UNSIGNED NOT NULL, line_total_naira BIGINT UNSIGNED NOT NULL,
 created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL, FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE, FOREIGN KEY(drug_id) REFERENCES drugs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pharmacy_settings (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `key` VARCHAR(255) NOT NULL UNIQUE, `value` VARCHAR(255) NOT NULL,
 updated_by BIGINT UNSIGNED NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL, FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS sync_conflicts (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, client_sale_id CHAR(36) NOT NULL UNIQUE, invoice_no VARCHAR(255) NOT NULL,
 staff_id BIGINT UNSIGNED NOT NULL, department_id BIGINT UNSIGNED NOT NULL, payload JSON NOT NULL, reason TEXT NOT NULL,
 status VARCHAR(255) NOT NULL DEFAULT 'pending', reviewed_by BIGINT UNSIGNED NULL, review_note TEXT NULL, reviewed_at TIMESTAMP NULL,
 created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL, INDEX conflicts_status_idx(status,created_at), FOREIGN KEY(staff_id) REFERENCES users(id),
 FOREIGN KEY(department_id) REFERENCES departments(id), FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS stock_counts (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, reference VARCHAR(255) NOT NULL UNIQUE, department_id BIGINT UNSIGNED NOT NULL,
 status VARCHAR(255) NOT NULL DEFAULT 'counting', started_by BIGINT UNSIGNED NOT NULL, completed_by BIGINT UNSIGNED NULL,
 started_at TIMESTAMP NOT NULL, completed_at TIMESTAMP NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
 INDEX stock_counts_dept_status_idx(department_id,status), FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE RESTRICT,
 FOREIGN KEY(started_by) REFERENCES users(id) ON DELETE RESTRICT, FOREIGN KEY(completed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS stock_count_items (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, stock_count_id BIGINT UNSIGNED NOT NULL, stock_id BIGINT UNSIGNED NULL,
 drug_id BIGINT UNSIGNED NOT NULL, batch_no VARCHAR(255) NOT NULL, expected_quantity INT UNSIGNED NOT NULL, counted_quantity INT UNSIGNED NULL,
 counted_by BIGINT UNSIGNED NULL, counted_at TIMESTAMP NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
 UNIQUE KEY count_stock_unique(stock_count_id,stock_id), FOREIGN KEY(stock_count_id) REFERENCES stock_counts(id) ON DELETE CASCADE,
 FOREIGN KEY(stock_id) REFERENCES stocks(id) ON DELETE SET NULL, FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE RESTRICT,
 FOREIGN KEY(counted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS staff_messages (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, sender_id BIGINT UNSIGNED NOT NULL, recipient_id BIGINT UNSIGNED NOT NULL,
 body TEXT NOT NULL, read_at TIMESTAMP NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
 INDEX messages_inbox_idx(recipient_id,sender_id,read_at), INDEX messages_pair_idx(sender_id,recipient_id,id),
 FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS personal_access_tokens (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, tokenable_type VARCHAR(255) NOT NULL, tokenable_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(255) NOT NULL, token CHAR(64) NOT NULL UNIQUE, abilities TEXT NULL, last_used_at TIMESTAMP NULL, expires_at TIMESTAMP NULL,
 created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL, INDEX personal_access_tokens_owner_idx(tokenable_type,tokenable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS audit_logs (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NULL, action VARCHAR(255) NOT NULL,
 auditable_type VARCHAR(255) NULL, auditable_id BIGINT UNSIGNED NULL, metadata JSON NULL, ip_address VARCHAR(45) NULL,
 created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS refund_requests (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, sale_id BIGINT UNSIGNED NOT NULL, requested_by BIGINT UNSIGNED NOT NULL,
 approved_by BIGINT UNSIGNED NULL, reason TEXT NOT NULL, items JSON NOT NULL, requested_amount_naira BIGINT UNSIGNED NOT NULL,
 approved_amount_naira BIGINT UNSIGNED NULL, status VARCHAR(32) NOT NULL DEFAULT 'pending', decision_note TEXT NULL,
 requested_at TIMESTAMP NOT NULL, decided_at TIMESTAMP NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
 INDEX refund_requests_status_idx(status,requested_at), FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE RESTRICT,
 FOREIGN KEY(requested_by) REFERENCES users(id) ON DELETE RESTRICT, FOREIGN KEY(approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- DEMO DATA ONLY. Uses shared password Demo@12345; change/remove these accounts before production.
-- The schema above already contains the current migration fields. Seed section is safe to re-run.
START TRANSACTION;

INSERT IGNORE INTO departments(name,code,type,is_active,created_at,updated_at) VALUES
 ('Central Store','central-store','central_store',1,NOW(),NOW()),
 ('Central Pharmacy','central-pharmacy','central_pharmacy',1,NOW(),NOW()),
 ('Department 2','dept-2','dept_2',1,NOW(),NOW());
SELECT id INTO @store_id FROM departments WHERE code='central-store' LIMIT 1;
SELECT id INTO @pharmacy_id FROM departments WHERE code='central-pharmacy' LIMIT 1;

INSERT INTO suppliers(name,phone,email,address,created_at,updated_at)
SELECT 'Demo Medical Supplier','08000000000','supplier@hospital.local','Demo address',NOW(),NOW()
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name='Demo Medical Supplier');
SELECT id INTO @supplier_id FROM suppliers WHERE name='Demo Medical Supplier' ORDER BY id LIMIT 1;

-- Demo password for all these accounts: Demo@12345
-- bcryptjs hash (cost 12); INSERT IGNORE will not overwrite real/existing accounts.
INSERT IGNORE INTO users(name,email,password,role,department_id,is_active,created_at,updated_at) VALUES
 ('Demo HOD','hod.demo@hospital.local','$2b$12$HmTrg5jRuEPF/WotUGBoi.bBulQwDdB4BGc3i982HIcTk7Pmyv3Wu','hod',NULL,1,NOW(),NOW()),
 ('Demo Store Keeper','store.demo@hospital.local','$2b$12$HmTrg5jRuEPF/WotUGBoi.bBulQwDdB4BGc3i982HIcTk7Pmyv3Wu','store_keeper',@store_id,1,NOW(),NOW()),
 ('Demo Pharmacy Staff','pharmacy.demo@hospital.local','$2b$12$HmTrg5jRuEPF/WotUGBoi.bBulQwDdB4BGc3i982HIcTk7Pmyv3Wu','pharmacy_staff',@pharmacy_id,1,NOW(),NOW()),
 ('Demo Doctor','doctor.demo@hospital.local','$2b$12$HmTrg5jRuEPF/WotUGBoi.bBulQwDdB4BGc3i982HIcTk7Pmyv3Wu','doctor',NULL,1,NOW(),NOW()),
 ('Demo Medical Director','md.demo@hospital.local','$2b$12$HmTrg5jRuEPF/WotUGBoi.bBulQwDdB4BGc3i982HIcTk7Pmyv3Wu','md',NULL,1,NOW(),NOW());

INSERT IGNORE INTO patients(folder_no,full_name,phone,nhis_number,created_at,updated_at)
VALUES ('DEMO-001','Demo Patient','08000000001','DEMO-NHIS-001',NOW(),NOW());

DROP TEMPORARY TABLE IF EXISTS demo_items;
CREATE TEMPORARY TABLE demo_items (
 sku VARCHAR(80) PRIMARY KEY, name VARCHAR(255) NOT NULL, qty INT UNSIGNED NOT NULL,
 total_cost DECIMAL(12,2) NOT NULL, unit_price DECIMAL(12,2) NOT NULL, unit_name VARCHAR(50) NOT NULL DEFAULT 'Unit'
) ENGINE=MEMORY;
INSERT INTO demo_items(sku,name,qty,total_cost,unit_price,unit_name) VALUES
 ('DEMO-P1','P1 (1k for Sack)',1,65,100,'Unit'),('DEMO-P2','P2',1,65,100,'Unit'),
 ('DEMO-P3','P3',1,70,100,'Unit'),('DEMO-P4','P4',1,70,100,'Unit'),
 ('DEMO-PL1','PL1 (1k for Sack Cover)',50,4000,180,'Piece'),('DEMO-PL2','PL2',96,7500,93.75,'Piece'),
 ('DEMO-PL3','PL3',88,7500,102.27,'Piece'),('DEMO-PL4','PL4',80,7500,112.50,'Piece'),
 ('DEMO-PL5','PL5',7,500,142.86,'Piece'),('DEMO-ADULT-PAMPERS','Adult Pampers',10,3500,500,'Piece'),
 ('DEMO-PAD1','Pad1 (Short)',12,400,41.67,'Piece'),('DEMO-PAD2','Pad2 (Long)',8,400,125,'Piece'),
 ('DEMO-PAD3','Pad3 (Long by 2)',14,700,107.14,'Piece'),('DEMO-PAD3A','Pad3 (Long by 2A)',14,650,107.14,'Piece'),
 ('DEMO-PAD5','Pad5 (Long no cover)',10,250,50,'Piece'),('DEMO-PAD6','Pad6 (Short no cover)',5,200,140,'Piece'),
 ('DEMO-PAD-COVER','Pad (Cover by 3) 8k',3,160,100,'Piece'),('DEMO-PAD-LONG30','Pad (Long by 30)',30,1700,83.33,'Piece'),
 ('DEMO-PAD-LONG30-NC','Pad (Long by 30 no cover)',30,1200,83.33,'Piece'),
 ('DEMO-WIPES1','Wiper Tissue 1 (Johnson baby)',20,200,25,'Piece'),('DEMO-WIPES2','Wiper Tissue 2 (Software)',60,800,25,'Piece'),
 ('DEMO-WIPES3','Wiper Tissue 3 (Dr Browns)',120,1000,62.50,'Piece'),('DEMO-WIPES4','Wiper Tissue 4 (Softcare)',80,1000,18.75,'Piece'),
 ('DEMO-WIPES5','Wiper Tissue 5 (Softcare) 100',100,1500,20,'Piece'),('DEMO-SHAVER','Shaver',5,400,140,'Piece'),
 ('DEMO-TISSUE','Tissue',1,150,250,'Piece'),('DEMO-COTTON-BOT','Cotton Bot',26,6850,84.62,'Piece'),
 ('DEMO-BABY-POWDER','Baby powder',1,1300,2000,'Bottle'),('DEMO-BABY-SOAP','Baby soap',6,2400,500,'Piece'),
 ('DEMO-CACATIN','Cacatin (Pampers powder)',6,4800,1000,'Bottle'),
 ('DEMO-CACATIN-12','Cacatin (Pampers powder by 12)',12,2500,250,'Sachet'),
 ('DEMO-MAT-PAD','Maternity Pad',10,800,100,'Piece'),('DEMO-GENTA-CREAM','Gentamycine Cream',1,580,1000,'Tube'),
 ('DEMO-GIVING-SET','Giving Set 50s',50,6300,200,'Piece'),('DEMO-GLOBETA','Globeta 625',1,1500,2000,'Pack'),
 ('DEMO-GREENTOL','Greentol tab Orange',25,2750,240,'Tablet'),('DEMO-HYDRALAZINE','Hydralazine inj',10,1700,300,'Ampoule'),
 ('DEMO-HYDROCORTISONE','Hydrocortisone Inj x10',10,2450,400,'Ampoule'),('DEMO-HYPEREX','Hyperex-SR Tabs',1,2600,3000,'Pack'),
 ('DEMO-IBUCAP','Ibucap cold & flu Tabs',10,5200,700,'Tablet'),('DEMO-IBUKRISH','Ibukrish-200',10,2020,300,'Tablet'),
 ('DEMO-IODINE','Iodine moko',1,450,700,'Bottle'),('DEMO-JAWARON','Jawaron 100ml',1,725,1200,'Bottle'),
 ('DEMO-JAWASIL','Jawasil plus 200ml',1,1160,1700,'Bottle'),('DEMO-JOPAR','Jopar genta eye drop box',5,2000,700,'Bottle'),
 ('DEMO-KRISOMINE','Krisomine 25mg',10,950,150,'Tablet'),('DEMO-KRISACID','Krisacid tab',10,1150,500,'Tablet'),
 ('DEMO-LEVO','Levofloxacin 500mg',1,550,1000,'Tablet'),('DEMO-PARAFFIN','Liquid paraffin mopson',1,730,1500,'Bottle'),
 ('DEMO-LISIN','Lisin 10mg mecurie',1,340,500,'Tablet'),('DEMO-LORATADINE','Loratadine afrab tab',10,1200,200,'Tablet'),
 ('DEMO-LOSARTAN','Losartan 50mg',1,720,1500,'Tablet'),('DEMO-MAG-SULPHATE','Magnesium sulphate',5,3680,1200,'Ampoule'),
 ('DEMO-MALAMIS','Malamis 80/480',1,435,700,'Tablet'),('DEMO-MARYCEF','Marycef 200mg Cefixim',1,1580,2300,'Capsule'),
 ('DEMO-MELOXICAM7','Meloxicam 7.5mg',1,400,800,'Tablet'),('DEMO-MELOXICAM15','Meloxicam 15mg',1,400,800,'Tablet'),
 ('DEMO-MEROXIME','Meroxime 500mg',1,2120,3500,'Vial'),('DEMO-METRO-WHITE','Metro White Vitabiotics',1000,7100,10,'Tablet'),
 ('DEMO-MISOCLEAR','Misoclear tab',10,2480,450,'Tablet'),('DEMO-MMT','MMT Asad small',1,315,600,'Pack'),
 ('DEMO-MURNISIK','Murnisik tablets',1,2420,3000,'Pack'),('DEMO-NAVIDOXIN','Navidoxin tab',10,2200,350,'Tablet'),
 ('DEMO-NELMENTIN','Nelmentin Inj Augmentin 600mg',1,1050,1600,'Vial'),
 ('DEMO-NEURO35','Neurogesic cream 35g',1,1080,1700,'Tube'),('DEMO-NEURO85','Neurogesic Cream 85g',1,2120,3500,'Tube'),
 ('DEMO-NIFEDIPINE','Nifedipine tabs',10,475,100,'Tablet'),('DEMO-NORODEXA','Norodexa eye drop',1,1100,2000,'Bottle'),
 ('DEMO-NYLON0','Nylon 0',12,3000,500,'Piece'),('DEMO-NYLON20','Nylon 2/0',12,2100,416.67,'Piece'),
 ('DEMO-OCEFIX','Ocefix Susp 100mg Cefixim',1,2800,3500,'Bottle'),('DEMO-OFLOXACIN','Ofloxacin',1,360,700,'Tablet'),
 ('DEMO-OMEPRAZOLE-CAPS','Omeprazole caps 14 box',10,1800,400,'Capsule'),('DEMO-OMEPRAZOLE-INJ','Omeprazole Inj',1,410,700,'Vial'),
 ('DEMO-ORS','ORS fecox',3,340,200,'Sachet'),('DEMO-PALAXIN','P-Alaxin syr',1,1260,1800,'Bottle'),
 ('DEMO-PARAGOL','Paragol',10,550,100,'Tablet'),('DEMO-PARAGOL1000','Paragol tabs 1000s',1000,5570,10,'Tablet'),
 ('DEMO-PENICILLIN','Penicillin GREEN DGF',1,580,950,'Vial'),('DEMO-PLASIL','Plasil Inj',10,330,100,'Ampoule'),
 ('DEMO-PLASTER1','Plaster 1inch',10,4500,600,'Roll'),('DEMO-PLASTER2','Plaster 2 inch',10,8700,1200,'Roll'),
 ('DEMO-PRITON','Priton Inj',10,600,100,'Ampoule'),('DEMO-RELIPEN','Relipen eye drop',1,900,1500,'Bottle'),
 ('DEMO-SKYCIP','Skycip susp 125 Cefuroxim',1,1680,2500,'Bottle'),('DEMO-SODAMINT','Sodamint 1000s',1000,2160,5,'Tablet'),
 ('DEMO-SODIUM-BICARB','Sodium Bicarbonate',10,4500,700,'Tablet'),
 ('DEMO-SPORTFIX','Sportfix dry susp Cefixim 100mg',1,2530,3200,'Bottle'),('DEMO-SPIRIT','Sprit 100ml Aicon',1,250,500,'Bottle'),
 ('DEMO-GLOVE75','Surgical glove 7.5',50,11550,360,'Pair'),('DEMO-SYRINGE20','Syringe 20ml',100,12100,200,'Piece'),
 ('DEMO-SYRINGE5','Syringes 5ml',100,3320,50,'Piece'),('DEMO-SYRINGE10','Syringes 10ml',100,4850,100,'Piece'),
 ('DEMO-TANZOL','Tanzol Suspension',1,310,500,'Bottle'),('DEMO-URINE-BAG','Urine Bag',10,3700,500,'Piece'),
 ('DEMO-VASOPRIN','Vasoprin tabs',10,610,100,'Tablet'),('DEMO-VEGA','Vega krish',10,910,200,'Tablet'),
 ('DEMO-VICRYL2','Vicryl 2',12,9555,1000,'Piece'),('DEMO-VICRYL20','Vicryl 2/0',12,8300,1000,'Piece'),
 ('DEMO-VITE','Vit E 100mg everdestiny',1,900,1500,'Tablet'),('DEMO-VITK3','Vit K3 Inj',10,750,150,'Ampoule'),
 ('DEMO-WORMEX','Wormex susp',1,340,500,'Bottle'),('DEMO-XYLO-PLAIN','Xylocaine plain Inj',1,850,1500,'Vial'),
 ('DEMO-XYLO-ADRENALINE','Xylocaine with adrenaline',1,1000,1500,'Vial'),
 ('DEMO-ZINC','Zinc Tab Archy',10,800,150,'Tablet'),('DEMO-ZUCIN','Zucin eye drop',1,380,800,'Bottle'),
 ('DEMO-PCM500','Paracetamol 500mg',1000,4000,5,'Tablet');

INSERT INTO drugs(name,sku,category,unit,is_active,created_at,updated_at)
SELECT name,sku,'Demo inventory',unit_name,1,NOW(),NOW() FROM demo_items
ON DUPLICATE KEY UPDATE name=VALUES(name),unit=VALUES(unit),is_active=1,updated_at=NOW();

-- Stock lives in Central Pharmacy so the demo POS can sell it immediately.
INSERT INTO stocks(drug_id,department_id,batch_no,quantity,cost_price_naira,selling_price_naira,expiry_date,supplier_id,created_at,updated_at)
SELECT d.id,@pharmacy_id,'DEMO-OPENING',i.qty,GREATEST(0,ROUND(i.total_cost/i.qty)),GREATEST(0,ROUND(i.unit_price)), '2030-12-31',@supplier_id,NOW(),NOW()
FROM demo_items i JOIN drugs d ON d.sku=i.sku
WHERE NOT EXISTS (SELECT 1 FROM stocks s WHERE s.drug_id=d.id AND s.department_id=@pharmacy_id AND s.batch_no='DEMO-OPENING');

-- PCM counting is sold for NGN 5 per tablet or NGN 100 per 12-tablet sachet.
INSERT INTO drug_units(drug_id,unit_name,units_per_unit,selling_price_naira,created_at,updated_at)
SELECT id,'Sachet',12,100,NOW(),NOW() FROM drugs WHERE sku='DEMO-PCM500'
ON DUPLICATE KEY UPDATE units_per_unit=VALUES(units_per_unit),selling_price_naira=VALUES(selling_price_naira),updated_at=NOW();

COMMIT;

