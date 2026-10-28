-- BKD Pharmacy Management System: synthetic all-role workflow test data.
-- Run after database/schema.sql in the hospitalguru database.
-- Synthetic test login password for all seeded accounts: BkdTest2026!
-- LOCAL/QA/STAGING ONLY. All people, suppliers, patients, quantities, prices, and transactions below are invented.
-- Re-runnable test fixture. It resets records identified by QA keys; never run against a production database.

USE hospitalguru;
SET NAMES utf8mb4;
SET time_zone = '+00:00';
START TRANSACTION;

-- Ensure the initial hospital locations exist; preserve existing addresses/settings.
INSERT INTO locations(code,name,type,is_active) VALUES
 ('DRF-STORE','DRF STORE','central_store',1),
 ('CENTRAL-PHARMACY','Central Pharmacy','pharmacy',1),
 ('JICHMA-PHARMACY','JICHMA Pharmacy','pharmacy',1),
 ('OTHER-PHARMACY','Other Pharmacy','pharmacy',1)
ON DUPLICATE KEY UPDATE name=VALUES(name),type=VALUES(type),is_active=1;

SET @store := (SELECT id FROM locations WHERE code='DRF-STORE');
SET @central := (SELECT id FROM locations WHERE code='CENTRAL-PHARMACY');
SET @jichma := (SELECT id FROM locations WHERE code='JICHMA-PHARMACY');
SET @other := (SELECT id FROM locations WHERE code='OTHER-PHARMACY');

-- Synthetic role accounts. All accounts use the same local-only synthetic password.
INSERT INTO users(name,username,email,staff_id,password_hash,role_id,primary_location_id,status)
SELECT x.name,x.username,x.email,x.staff_id,
 'scrypt$bkdSyntheticTestSeed2026$03e043cfd583e7f31acbc440d80324878b86499b2547c3d0ed79750520bcb0d797d5e3524c64c5c9615417a3ac9f3a74c38a28d59e80a427e04a433588779c82',
 r.id,l.id,'active'
FROM (
 SELECT 'Aliyu Abubakar' name,'admin.qa' username,'admin.qa@example.test' email,'QA-STA-001' staff_id,'super_administrator' role_key,NULL location_code UNION ALL
 SELECT 'Musa Isa','cmd.qa','cmd.qa@example.test','QA-CMD-001','cmd_executive','CENTRAL-PHARMACY' UNION ALL
 SELECT 'Zainab Ibrahim','headpharm.qa','headpharm.qa@example.test','QA-HP-001','head_pharmacist','CENTRAL-PHARMACY' UNION ALL
 SELECT 'Yusuf Abdullahi','drf.qa','drf.qa@example.test','QA-DRF-001','drf_store_keeper','DRF-STORE' UNION ALL
 SELECT 'Grace Okafor','dispenser.qa','dispenser.qa@example.test','QA-DISP-001','pharmacy_dispenser','CENTRAL-PHARMACY' UNION ALL
 SELECT 'Amina Bello','supervisor.qa','supervisor.qa@example.test','QA-SUP-001','pharmacy_supervisor','CENTRAL-PHARMACY' UNION ALL
 SELECT 'Chika Nwosu','cashier.qa','cashier.qa@example.test','QA-CASH-001','cashier','CENTRAL-PHARMACY' UNION ALL
 SELECT 'Ibrahim Musa','procurement.qa','procurement.qa@example.test','QA-PROC-001','procurement_officer','DRF-STORE' UNION ALL
 SELECT 'Fatima Danjuma','auditor.qa','auditor.qa@example.test','QA-AUD-001','internal_auditor','CENTRAL-PHARMACY' UNION ALL
 SELECT 'Daniel Eze','sysadmin.qa','sysadmin.qa@example.test','QA-SYS-001','system_administrator',NULL
) x JOIN roles r ON r.role_key=x.role_key LEFT JOIN locations l ON l.code=x.location_code
WHERE 1=1
ON DUPLICATE KEY UPDATE name=VALUES(name),email=VALUES(email),staff_id=VALUES(staff_id),password_hash=VALUES(password_hash),role_id=VALUES(role_id),primary_location_id=VALUES(primary_location_id),status='active';

SET @u_super := (SELECT id FROM users WHERE username='admin.qa');
SET @u_cmd := (SELECT id FROM users WHERE username='cmd.qa');
SET @u_head := (SELECT id FROM users WHERE username='headpharm.qa');
SET @u_drf := (SELECT id FROM users WHERE username='drf.qa');
SET @u_disp := (SELECT id FROM users WHERE username='dispenser.qa');
SET @u_supervisor := (SELECT id FROM users WHERE username='supervisor.qa');
SET @u_cashier := (SELECT id FROM users WHERE username='cashier.qa');
SET @u_proc := (SELECT id FROM users WHERE username='procurement.qa');
SET @u_auditor := (SELECT id FROM users WHERE username='auditor.qa');
SET @u_sys := (SELECT id FROM users WHERE username='sysadmin.qa');

INSERT INTO user_locations(user_id,location_id,is_default) VALUES
 (@u_cmd,@store,0),(@u_cmd,@central,1),(@u_cmd,@jichma,0),(@u_cmd,@other,0),
 (@u_head,@store,0),(@u_head,@central,1),(@u_head,@jichma,0),(@u_head,@other,0),
 (@u_drf,@store,1),(@u_disp,@central,1),(@u_supervisor,@central,1),(@u_cashier,@central,1),
 (@u_proc,@store,1),(@u_auditor,@store,0),(@u_auditor,@central,1),(@u_auditor,@jichma,0),(@u_auditor,@other,0)
ON DUPLICATE KEY UPDATE is_default=VALUES(is_default);
UPDATE locations SET supervisor_user_id=@u_supervisor WHERE id=@central;

-- Permission catalogue is compatible with the application's role/permission matrix.
INSERT INTO permissions(permission_key,module,action,description)
SELECT CONCAT(m.module,'.',a.action),m.module,a.action,CONCAT(m.label,' ',a.action)
FROM (
 SELECT 'dashboard' module,'Dashboard' label UNION ALL SELECT 'notifications','Notifications' UNION ALL
 SELECT 'users','Users' UNION ALL SELECT 'roles','Roles & Permissions' UNION ALL SELECT 'locations','Locations' UNION ALL
 SELECT 'settings','Settings' UNION ALL SELECT 'drug_catalogue','Drug Catalogue' UNION ALL SELECT 'suppliers','Suppliers' UNION ALL
 SELECT 'inventory','Inventory' UNION ALL SELECT 'grns','GRNs' UNION ALL SELECT 'transfers','Transfers' UNION ALL
 SELECT 'returns','Returns' UNION ALL SELECT 'stock_requests','Stock Requests' UNION ALL SELECT 'sales','Sales' UNION ALL
 SELECT 'payments','Payments' UNION ALL SELECT 'procurement','Procurement' UNION ALL SELECT 'stock_counts','Stock Counts' UNION ALL
 SELECT 'audit_logs','Audit Logs' UNION ALL SELECT 'system_health','System Health'
) m CROSS JOIN (
 SELECT 'view' action UNION ALL SELECT 'create' UNION ALL SELECT 'edit' UNION ALL SELECT 'approve' UNION ALL SELECT 'delete'
) a
WHERE 1=1
ON DUPLICATE KEY UPDATE description=VALUES(description);

DROP TEMPORARY TABLE IF EXISTS synthetic_role_grants;
CREATE TEMPORARY TABLE synthetic_role_grants(
 role_key VARCHAR(60) NOT NULL,
 permission_key VARCHAR(120) NOT NULL,
 PRIMARY KEY(role_key,permission_key)
);
INSERT INTO synthetic_role_grants(role_key,permission_key) VALUES
-- Super Administrator: organization/system administration, not implicit pharmacy transactions.
('super_administrator','dashboard.view'),('super_administrator','notifications.view'),
('super_administrator','users.view'),('super_administrator','users.create'),('super_administrator','users.edit'),
('super_administrator','roles.view'),('super_administrator','roles.edit'),
('super_administrator','locations.view'),('super_administrator','locations.create'),('super_administrator','locations.edit'),
('super_administrator','settings.view'),('super_administrator','settings.edit'),
('super_administrator','drug_catalogue.view'),('super_administrator','drug_catalogue.create'),('super_administrator','drug_catalogue.edit'),
('super_administrator','suppliers.view'),('super_administrator','suppliers.create'),('super_administrator','suppliers.edit'),
('super_administrator','inventory.view'),('super_administrator','audit_logs.view'),('super_administrator','system_health.view'),
-- CMD: executive read-only oversight.
('cmd_executive','dashboard.view'),('cmd_executive','notifications.view'),('cmd_executive','locations.view'),
('cmd_executive','inventory.view'),('cmd_executive','sales.view'),
('cmd_executive','grns.view'),('cmd_executive','transfers.view'),('cmd_executive','returns.view'),
('cmd_executive','payments.view'),('cmd_executive','audit_logs.view'),
-- Head Pharmacist: review and approve pharmaceutical control workflows.
('head_pharmacist','dashboard.view'),('head_pharmacist','notifications.view'),('head_pharmacist','drug_catalogue.view'),
('head_pharmacist','inventory.view'),('head_pharmacist','inventory.create'),('head_pharmacist','inventory.edit'),('head_pharmacist','inventory.approve'),
('head_pharmacist','grns.view'),('head_pharmacist','grns.create'),('head_pharmacist','grns.edit'),('head_pharmacist','grns.approve'),
('head_pharmacist','transfers.view'),('head_pharmacist','transfers.edit'),('head_pharmacist','transfers.approve'),
('head_pharmacist','returns.view'),('head_pharmacist','returns.approve'),('head_pharmacist','procurement.view'),('head_pharmacist','procurement.approve'),('head_pharmacist','audit_logs.view'),
-- DRF Store Keeper.
('drf_store_keeper','dashboard.view'),('drf_store_keeper','notifications.view'),('drf_store_keeper','inventory.view'),('drf_store_keeper','inventory.edit'),
('drf_store_keeper','drug_catalogue.view'),('drf_store_keeper','suppliers.view'),('drf_store_keeper','grns.view'),('drf_store_keeper','grns.create'),('drf_store_keeper','grns.edit'),
('drf_store_keeper','stock_requests.view'),('drf_store_keeper','transfers.view'),('drf_store_keeper','transfers.create'),('drf_store_keeper','transfers.edit'),
('drf_store_keeper','returns.view'),('drf_store_keeper','returns.edit'),('drf_store_keeper','stock_counts.view'),('drf_store_keeper','stock_counts.create'),
-- Pharmacy Dispenser.
('pharmacy_dispenser','dashboard.view'),('pharmacy_dispenser','notifications.view'),('pharmacy_dispenser','drug_catalogue.view'),
('pharmacy_dispenser','inventory.view'),('pharmacy_dispenser','sales.view'),('pharmacy_dispenser','sales.create'),
('pharmacy_dispenser','payments.create'),('pharmacy_dispenser','stock_requests.view'),('pharmacy_dispenser','stock_requests.create'),
('pharmacy_dispenser','returns.view'),('pharmacy_dispenser','returns.create'),
-- Pharmacy Supervisor.
('pharmacy_supervisor','dashboard.view'),('pharmacy_supervisor','notifications.view'),('pharmacy_supervisor','inventory.view'),
('pharmacy_supervisor','sales.view'),('pharmacy_supervisor','payments.view'),('pharmacy_supervisor','payments.edit'),
('pharmacy_supervisor','stock_requests.view'),('pharmacy_supervisor','returns.view'),('pharmacy_supervisor','transfers.view'),('pharmacy_supervisor','transfers.edit'),('pharmacy_supervisor','audit_logs.view'),
-- Cashier.
('cashier','dashboard.view'),('cashier','notifications.view'),('cashier','sales.view'),('cashier','payments.view'),
('cashier','payments.create'),('cashier','payments.edit'),('cashier','payments.approve'),('cashier','audit_logs.view'),
-- Procurement Officer.
('procurement_officer','dashboard.view'),('procurement_officer','notifications.view'),('procurement_officer','suppliers.view'),
('procurement_officer','suppliers.create'),('procurement_officer','suppliers.edit'),('procurement_officer','inventory.view'),
('procurement_officer','procurement.view'),('procurement_officer','procurement.create'),('procurement_officer','procurement.edit'),
-- Internal Auditor: read-only transaction visibility.
('internal_auditor','dashboard.view'),('internal_auditor','notifications.view'),('internal_auditor','inventory.view'),
('internal_auditor','grns.view'),('internal_auditor','transfers.view'),('internal_auditor','returns.view'),
('internal_auditor','sales.view'),('internal_auditor','payments.view'),('internal_auditor','procurement.view'),
('internal_auditor','stock_counts.view'),('internal_auditor','audit_logs.view'),
-- System Administrator: technical system access without operational stock control.
('system_administrator','dashboard.view'),('system_administrator','notifications.view'),('system_administrator','system_health.view'),
('system_administrator','settings.view'),('system_administrator','settings.edit'),('system_administrator','locations.view'),
('system_administrator','audit_logs.view');
INSERT INTO role_permissions(role_id,permission_id,granted)
SELECT r.id,p.id,1 FROM synthetic_role_grants g JOIN roles r ON r.role_key=g.role_key JOIN permissions p ON p.permission_key=g.permission_key
WHERE 1=1
ON DUPLICATE KEY UPDATE granted=VALUES(granted);
DROP TEMPORARY TABLE synthetic_role_grants;

-- Suppliers and drug catalogue.
INSERT INTO suppliers(code,name,contact_person,phone,email,address,registration_no,notes,is_active) VALUES
 ('QA-SUP-001','BKD Medical Distribution Ltd','Amina Yusuf','08030000001','orders@synthetic-supplier.example.test','Ikeja, Lagos','QA-RC-001','Synthetic QA supplier record',1),
 ('QA-SUP-002','PrimeCare Pharmaceutical Distributors','Musa Isa','08030000002','sales@carepoint.example.test','Yaba, Lagos','QA-RC-002','Synthetic QA supplier record',1)
ON DUPLICATE KEY UPDATE name=VALUES(name),contact_person=VALUES(contact_person),phone=VALUES(phone),email=VALUES(email),address=VALUES(address),is_active=1;
SET @sup1 := (SELECT id FROM suppliers WHERE code='QA-SUP-001');
SET @sup2 := (SELECT id FROM suppliers WHERE code='QA-SUP-002');

INSERT INTO drugs(sku,barcode,generic_name,brand_name,category,strength,dosage_form,base_unit,purchase_unit,units_per_purchase,prescription_required,is_active) VALUES
 ('QA-BKD-001','2900000000011','Paracetamol','BKD Paracetamol','Analgesics','500 mg','Tablet','tablet','pack',100,0,1),
 ('QA-BKD-002','2900000000028','Amoxicillin','BKD Amoxicillin','Antibiotics','500 mg','Capsule','capsule','box',100,1,1),
 ('QA-BKD-003','2900000000035','Metformin','BKD Metformin','Antidiabetics','500 mg','Tablet','tablet','pack',100,1,1),
 ('QA-BKD-004','2900000000042','Oral Rehydration Salts','ORS Lemon','Rehydration','20.5 g','Sachet','sachet','box',100,0,1),
 ('QA-BKD-005','2900000000059','Cough Syrup','BKD Cough Relief','Respiratory','100 ml','Syrup','bottle','carton',24,0,1),
 ('QA-BKD-006','2900000000066','Amlodipine','BKD Amlodipine','Antihypertensives','5 mg','Tablet','tablet','pack',100,1,1),
 ('QA-BKD-007','2900000000073','Cetirizine','BKD Cetirizine','Antihistamines','10 mg','Tablet','tablet','pack',100,0,1),
 ('QA-BKD-008','2900000000080','Cefixime','Cefixime QA Check','Antibiotics','200 mg','Capsule','capsule','box',10,1,1)
ON DUPLICATE KEY UPDATE generic_name=VALUES(generic_name),brand_name=VALUES(brand_name),category=VALUES(category),strength=VALUES(strength),dosage_form=VALUES(dosage_form),base_unit=VALUES(base_unit),purchase_unit=VALUES(purchase_unit),units_per_purchase=VALUES(units_per_purchase),is_active=1;
SET @d_para := (SELECT id FROM drugs WHERE sku='QA-BKD-001');
SET @d_amox := (SELECT id FROM drugs WHERE sku='QA-BKD-002');
SET @d_met := (SELECT id FROM drugs WHERE sku='QA-BKD-003');
SET @d_ors := (SELECT id FROM drugs WHERE sku='QA-BKD-004');
SET @d_cough := (SELECT id FROM drugs WHERE sku='QA-BKD-005');
SET @d_amlo := (SELECT id FROM drugs WHERE sku='QA-BKD-006');
SET @d_cet := (SELECT id FROM drugs WHERE sku='QA-BKD-007');
SET @d_expiry := (SELECT id FROM drugs WHERE sku='QA-BKD-008');

-- Synthetic catalogue price changes for price-history screens.
DELETE FROM price_history WHERE reason='Synthetic QA price history fixture';
INSERT INTO price_history(drug_id,location_id,old_price_ngn,new_price_ngn,effective_from,changed_by,approved_by,reason) VALUES
 (@d_para,@central,45,50,DATE_SUB(NOW(),INTERVAL 30 DAY),@u_supervisor,@u_head,'Synthetic QA price history fixture'),
 (@d_amox,@central,110,120,DATE_SUB(NOW(),INTERVAL 14 DAY),@u_supervisor,@u_head,'Synthetic QA price history fixture'),
 (@d_ors,@jichma,140,155,DATE_SUB(NOW(),INTERVAL 7 DAY),@u_supervisor,@u_head,'Synthetic QA price history fixture');

INSERT INTO drug_units(drug_id,unit_name,units_per_unit,selling_price_ngn,is_default) VALUES
 (@d_para,'tablet',1,50,1),(@d_amox,'capsule',1,120,1),(@d_met,'tablet',1,90,1),(@d_ors,'sachet',1,150,1),
 (@d_cough,'bottle',1,350,1),(@d_amlo,'tablet',1,80,1),(@d_cet,'tablet',1,60,1),(@d_expiry,'capsule',1,125,1)
ON DUPLICATE KEY UPDATE selling_price_ngn=VALUES(selling_price_ngn),is_default=1;

-- Stock fixtures across DRF STORE and every dispensing pharmacy.
INSERT INTO stock_batches(drug_id,location_id,supplier_id,batch_no,expiry_date,quantity_on_hand,quantity_reserved,quantity_quarantined,cost_price_ngn,selling_price_ngn,status) VALUES
 (@d_para,@store,@sup1,'QA-PARA-STORE',DATE_ADD(CURDATE(),INTERVAL 500 DAY),280,0,0,22,50,'usable'),
 (@d_amox,@store,@sup1,'QA-AMOX-STORE',DATE_ADD(CURDATE(),INTERVAL 430 DAY),100,0,0,55,120,'usable'),
 (@d_met,@store,@sup2,'QA-MET-STORE',DATE_ADD(CURDATE(),INTERVAL 620 DAY),120,0,0,40,90,'usable'),
 (@d_ors,@store,@sup1,'QA-ORS-STORE',DATE_ADD(CURDATE(),INTERVAL 400 DAY),180,0,0,70,150,'usable'),
 (@d_cough,@store,@sup2,'QA-COUGH-STORE',DATE_ADD(CURDATE(),INTERVAL 300 DAY),60,0,0,180,350,'usable'),
 (@d_amlo,@store,@sup1,'QA-AMLO-STORE',DATE_ADD(CURDATE(),INTERVAL 700 DAY),150,0,0,35,80,'usable'),
 (@d_cet,@store,@sup2,'QA-CET-STORE',DATE_ADD(CURDATE(),INTERVAL 350 DAY),80,0,0,25,60,'usable'),
 (@d_expiry,@store,@sup1,'QA-EXP-STORE',DATE_SUB(CURDATE(),INTERVAL 3 DAY),12,0,0,10,25,'expired'),
 (@d_para,@central,@sup1,'QA-PARA-CENTRAL',DATE_ADD(CURDATE(),INTERVAL 500 DAY),95,0,0,22,50,'usable'),
 (@d_amox,@central,@sup1,'QA-AMOX-CENTRAL',DATE_ADD(CURDATE(),INTERVAL 430 DAY),40,3,0,55,120,'usable'),
 (@d_met,@central,@sup2,'QA-MET-CENTRAL',DATE_ADD(CURDATE(),INTERVAL 620 DAY),36,0,0,40,90,'usable'),
 (@d_ors,@central,@sup1,'QA-ORS-CENTRAL',DATE_ADD(CURDATE(),INTERVAL 400 DAY),75,0,0,70,150,'usable'),
 (@d_cough,@central,@sup2,'QA-COUGH-CENTRAL',DATE_ADD(CURDATE(),INTERVAL 300 DAY),26,0,0,180,350,'usable'),
 (@d_amlo,@central,@sup1,'QA-AMLO-CENTRAL',DATE_ADD(CURDATE(),INTERVAL 700 DAY),62,0,0,35,80,'usable'),
 (@d_cet,@central,@sup2,'QA-CET-CENTRAL',DATE_ADD(CURDATE(),INTERVAL 350 DAY),48,0,0,25,60,'usable'),
 (@d_para,@jichma,@sup1,'QA-PARA-JICHMA',DATE_ADD(CURDATE(),INTERVAL 500 DAY),45,0,0,22,55,'usable'),
 (@d_amox,@jichma,@sup1,'QA-AMOX-JICHMA',DATE_ADD(CURDATE(),INTERVAL 430 DAY),22,0,0,55,125,'usable'),
 (@d_met,@jichma,@sup2,'QA-MET-JICHMA',DATE_ADD(CURDATE(),INTERVAL 620 DAY),18,0,0,40,95,'usable'),
 (@d_ors,@jichma,@sup1,'QA-ORS-JICHMA',DATE_ADD(CURDATE(),INTERVAL 400 DAY),38,0,0,70,155,'usable'),
 (@d_cough,@jichma,@sup2,'QA-COUGH-JICHMA',DATE_ADD(CURDATE(),INTERVAL 300 DAY),12,0,0,180,360,'usable'),
 (@d_para,@other,@sup1,'QA-PARA-OTHER',DATE_ADD(CURDATE(),INTERVAL 500 DAY),55,0,0,22,52,'usable'),
 (@d_amox,@other,@sup1,'QA-AMOX-OTHER',DATE_ADD(CURDATE(),INTERVAL 430 DAY),25,0,0,55,122,'usable'),
 (@d_met,@other,@sup2,'QA-MET-OTHER',DATE_ADD(CURDATE(),INTERVAL 620 DAY),20,0,0,40,92,'usable'),
 (@d_ors,@other,@sup1,'QA-ORS-OTHER',DATE_ADD(CURDATE(),INTERVAL 400 DAY),42,0,0,70,152,'usable'),
 (@d_cough,@other,@sup2,'QA-COUGH-OTHER',DATE_ADD(CURDATE(),INTERVAL 300 DAY),15,0,0,180,355,'usable')
ON DUPLICATE KEY UPDATE supplier_id=VALUES(supplier_id),expiry_date=VALUES(expiry_date),quantity_on_hand=VALUES(quantity_on_hand),quantity_reserved=VALUES(quantity_reserved),quantity_quarantined=VALUES(quantity_quarantined),cost_price_ngn=VALUES(cost_price_ngn),selling_price_ngn=VALUES(selling_price_ngn),status=VALUES(status);

SET @b_para_store := (SELECT id FROM stock_batches WHERE drug_id=@d_para AND location_id=@store AND batch_no='QA-PARA-STORE');
SET @b_amox_store := (SELECT id FROM stock_batches WHERE drug_id=@d_amox AND location_id=@store AND batch_no='QA-AMOX-STORE');
SET @b_met_store := (SELECT id FROM stock_batches WHERE drug_id=@d_met AND location_id=@store AND batch_no='QA-MET-STORE');
SET @b_para_central := (SELECT id FROM stock_batches WHERE drug_id=@d_para AND location_id=@central AND batch_no='QA-PARA-CENTRAL');
SET @b_amox_central := (SELECT id FROM stock_batches WHERE drug_id=@d_amox AND location_id=@central AND batch_no='QA-AMOX-CENTRAL');
SET @b_met_central := (SELECT id FROM stock_batches WHERE drug_id=@d_met AND location_id=@central AND batch_no='QA-MET-CENTRAL');
SET @b_ors_central := (SELECT id FROM stock_batches WHERE drug_id=@d_ors AND location_id=@central AND batch_no='QA-ORS-CENTRAL');
SET @b_exp_store := (SELECT id FROM stock_batches WHERE drug_id=@d_expiry AND location_id=@store AND batch_no='QA-EXP-STORE');

INSERT INTO reorder_rules(drug_id,location_id,minimum_quantity,reorder_quantity,lead_time_days,updated_by) VALUES
 (@d_para,@store,60,200,10,@u_drf),(@d_amox,@store,120,250,14,@u_drf),(@d_met,@store,40,100,14,@u_drf),
 (@d_amox,@central,25,80,7,@u_supervisor),(@d_met,@central,40,100,7,@u_supervisor),(@d_cough,@central,30,50,10,@u_supervisor),
 (@d_met,@jichma,25,80,10,@u_drf),(@d_cough,@jichma,20,40,10,@u_drf)
ON DUPLICATE KEY UPDATE minimum_quantity=VALUES(minimum_quantity),reorder_quantity=VALUES(reorder_quantity),lead_time_days=VALUES(lead_time_days),updated_by=VALUES(updated_by);

-- Patient and prescription fixtures for inpatient dispensing/search.
INSERT INTO patients(folder_no,full_name,phone,nhis_number,date_of_birth,sex,address,is_active) VALUES
 ('QA-PAT-0001','Aliyu Abubakar','08055550101','QA-NHIS-001','1988-03-14','male','Ikeja, Lagos',1),
 ('QA-PAT-0002','Musa Isa','08055550102','QA-NHIS-002','1976-11-02','male','Yaba, Lagos',1)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name),phone=VALUES(phone),is_active=1;
SET @patient1 := (SELECT id FROM patients WHERE folder_no='QA-PAT-0001');
SET @patient2 := (SELECT id FROM patients WHERE folder_no='QA-PAT-0002');

INSERT INTO prescriptions(prescription_no,patient_id,prescribed_by,status,notes,prescribed_at,expires_at) VALUES
 ('QA-RX-0001',@patient1,@u_head,'pending','Synthetic inpatient prescription for dispensing workflow.',NOW(),DATE_ADD(NOW(),INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE patient_id=VALUES(patient_id),prescribed_by=VALUES(prescribed_by),status=VALUES(status),notes=VALUES(notes);
SET @rx1 := (SELECT id FROM prescriptions WHERE prescription_no='QA-RX-0001');
DELETE FROM prescription_items WHERE prescription_id=@rx1;
INSERT INTO prescription_items(prescription_id,drug_id,quantity,dispensed_quantity,dosage,duration,instructions) VALUES
 (@rx1,@d_amox,12,0,'One capsule three times daily','4 days','Take with food.');

-- Goods received: one posted historical receipt and one pending approval.
INSERT INTO purchase_orders(po_no,supplier_id,destination_location_id,status,order_date,expected_date,currency,total_ngn,notes,created_by) VALUES
 ('QA-PO-0001',@sup1,@store,'sent',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 4 DAY),'NGN',6600,'Synthetic open order; receiving is separate from purchasing.',@u_proc)
ON DUPLICATE KEY UPDATE supplier_id=VALUES(supplier_id),destination_location_id=VALUES(destination_location_id),status=VALUES(status),total_ngn=VALUES(total_ngn),notes=VALUES(notes);
SET @po1 := (SELECT id FROM purchase_orders WHERE po_no='QA-PO-0001');
DELETE FROM purchase_order_items WHERE purchase_order_id=@po1;
INSERT INTO purchase_order_items(purchase_order_id,drug_id,quantity_ordered,quantity_received,unit_cost_ngn,line_total_ngn,notes) VALUES
 (@po1,@d_amox,120,0,55,6600,'Synthetic order line pending delivery.');

INSERT INTO goods_receipts(grn_no,purchase_order_id,supplier_id,destination_location_id,supplier_invoice_no,delivery_reference,received_at,status,total_cost_ngn,remarks,created_by,approved_by,posted_by,approved_at,posted_at) VALUES
 ('QA-GRN-POSTED',NULL,@sup1,@store,'QA-INV-POSTED','QA-DEL-POSTED',DATE_SUB(NOW(),INTERVAL 5 DAY),'posted',2200,'Synthetic posted receipt; stock represented in current DRF batch.',@u_drf,@u_head,@u_head,DATE_SUB(NOW(),INTERVAL 5 DAY),DATE_SUB(NOW(),INTERVAL 5 DAY)),
 ('QA-GRN-PENDING',@po1,@sup2,@store,'QA-INV-PENDING','QA-DEL-PENDING',NOW(),'pending_approval',1800,'Synthetic receipt waiting for Head Pharmacist review.',@u_drf,NULL,NULL,NULL,NULL)
ON DUPLICATE KEY UPDATE supplier_id=VALUES(supplier_id),destination_location_id=VALUES(destination_location_id),status=VALUES(status),total_cost_ngn=VALUES(total_cost_ngn),remarks=VALUES(remarks),approved_by=VALUES(approved_by),posted_by=VALUES(posted_by),approved_at=VALUES(approved_at),posted_at=VALUES(posted_at);
SET @grn_posted := (SELECT id FROM goods_receipts WHERE grn_no='QA-GRN-POSTED');
SET @grn_pending := (SELECT id FROM goods_receipts WHERE grn_no='QA-GRN-PENDING');
DELETE FROM goods_receipt_items WHERE goods_receipt_id IN (@grn_posted,@grn_pending);
INSERT INTO goods_receipt_items(goods_receipt_id,purchase_order_item_id,drug_id,batch_no,expiry_date,quantity_received,quantity_accepted,quantity_rejected,unit_cost_ngn,rejection_reason) VALUES
 (@grn_posted,NULL,@d_amox,'QA-GRN-AMOX',DATE_ADD(CURDATE(),INTERVAL 430 DAY),40,40,0,55,NULL),
 (@grn_pending,NULL,@d_para,'QA-GRN-PARA',DATE_ADD(CURDATE(),INTERVAL 520 DAY),30,28,2,22,'2 units damaged on arrival.');

-- Replenishment requests across pharmacy locations.
INSERT INTO stock_requests(request_no,source_location_id,requesting_location_id,priority,status,reason,requested_by,reviewed_by,reviewed_at) VALUES
 ('QA-REQ-CENTRAL',@store,@central,'urgent','pending','Synthetic low-stock replenishment request.',@u_supervisor,NULL,NULL),
 ('QA-REQ-JICHMA',@store,@jichma,'routine','partially_fulfilled','Synthetic request with a partial supply in progress.',@u_supervisor,@u_drf,NOW())
ON DUPLICATE KEY UPDATE source_location_id=VALUES(source_location_id),requesting_location_id=VALUES(requesting_location_id),priority=VALUES(priority),status=VALUES(status),reason=VALUES(reason),requested_by=VALUES(requested_by),reviewed_by=VALUES(reviewed_by),reviewed_at=VALUES(reviewed_at);
SET @req_central := (SELECT id FROM stock_requests WHERE request_no='QA-REQ-CENTRAL');
SET @req_jichma := (SELECT id FROM stock_requests WHERE request_no='QA-REQ-JICHMA');
DELETE FROM stock_request_items WHERE stock_request_id IN (@req_central,@req_jichma);
INSERT INTO stock_request_items(stock_request_id,drug_id,quantity_requested,quantity_approved,notes) VALUES
 (@req_central,@d_amox,24,NULL,'Urgent replenishment of amoxicillin.'),
 (@req_central,@d_met,20,NULL,'Below configured pharmacy reorder level.'),
 (@req_jichma,@d_para,30,20,'Partial approval for current available supply.'),
 (@req_jichma,@d_cough,10,10,'Routine top-up.');

-- Transfers in multiple workflow states. Only the in-transit record is deducted from DRF on hand.
INSERT INTO stock_transfers(transfer_no,stock_request_id,source_location_id,destination_location_id,drug_id,source_batch_id,batch_no,quantity_dispatched,quantity_received,status,created_by,approved_by,dispatched_by,received_by,dispatched_at,received_at,discrepancy_note) VALUES
 ('QA-TRF-DRAFT',NULL,@store,@other,@d_met,@b_met_store,'QA-MET-STORE',5,0,'draft',@u_drf,NULL,NULL,NULL,NULL,NULL,NULL),
 ('QA-TRF-PENDING',@req_central,@store,@central,@d_amox,@b_amox_store,'QA-AMOX-STORE',24,0,'pending_approval',@u_drf,NULL,NULL,NULL,NULL,NULL,NULL),
 ('QA-TRF-TRANSIT',@req_jichma,@store,@jichma,@d_para,@b_para_store,'QA-PARA-STORE',20,0,'in_transit',@u_drf,@u_head,@u_drf,NULL,DATE_SUB(NOW(),INTERVAL 2 HOUR),NULL,NULL)
ON DUPLICATE KEY UPDATE stock_request_id=VALUES(stock_request_id),source_location_id=VALUES(source_location_id),destination_location_id=VALUES(destination_location_id),drug_id=VALUES(drug_id),source_batch_id=VALUES(source_batch_id),batch_no=VALUES(batch_no),quantity_dispatched=VALUES(quantity_dispatched),quantity_received=VALUES(quantity_received),status=VALUES(status),created_by=VALUES(created_by),approved_by=VALUES(approved_by),dispatched_by=VALUES(dispatched_by),dispatched_at=VALUES(dispatched_at);
SET @transfer_transit := (SELECT id FROM stock_transfers WHERE transfer_no='QA-TRF-TRANSIT');

-- Patient dispensing, invoice history, and payment verification examples.
INSERT INTO sales(invoice_no,client_sale_id,prescription_id,patient_id,location_id,cashier_user_id,dispenser_user_id,sale_type,client_name,subtotal_ngn,discount_ngn,tax_ngn,total_ngn,payment_status,status,sold_at) VALUES
 ('QA-INV-PAID','10000000-0000-4000-8000-000000000001',@rx1,@patient1,@central,@u_cashier,@u_disp,'inpatient',NULL,340,0,0,340,'paid','completed',NOW()),
 ('QA-INV-PENDING','10000000-0000-4000-8000-000000000002',NULL,NULL,@central,NULL,@u_disp,'outpatient','Walk-in Patient',360,0,0,360,'pending','invoiced',NULL),
 ('QA-INV-JICHMA','10000000-0000-4000-8000-000000000003',NULL,@patient2,@jichma,@u_cashier,@u_disp,'inpatient',NULL,265,0,0,265,'paid','completed',DATE_SUB(NOW(),INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE patient_id=VALUES(patient_id),location_id=VALUES(location_id),cashier_user_id=VALUES(cashier_user_id),dispenser_user_id=VALUES(dispenser_user_id),sale_type=VALUES(sale_type),client_name=VALUES(client_name),subtotal_ngn=VALUES(subtotal_ngn),total_ngn=VALUES(total_ngn),payment_status=VALUES(payment_status),status=VALUES(status),sold_at=VALUES(sold_at);
SET @sale_paid := (SELECT id FROM sales WHERE invoice_no='QA-INV-PAID');
SET @sale_pending := (SELECT id FROM sales WHERE invoice_no='QA-INV-PENDING');
SET @sale_jichma := (SELECT id FROM sales WHERE invoice_no='QA-INV-JICHMA');
DELETE FROM sale_items WHERE sale_id IN (@sale_paid,@sale_pending,@sale_jichma);
INSERT INTO sale_items(sale_id,drug_id,stock_batch_id,batch_no,quantity_base,sale_quantity,sale_unit,unit_price_ngn,unit_cost_ngn,line_total_ngn) VALUES
 (@sale_paid,@d_para,@b_para_central,'QA-PARA-CENTRAL',2,2,'tablet',50,22,100),
 (@sale_paid,@d_amox,@b_amox_central,'QA-AMOX-CENTRAL',2,2,'capsule',120,55,240),
 (@sale_pending,@d_amox,@b_amox_central,'QA-AMOX-CENTRAL',3,3,'capsule',120,55,360),
 (@sale_jichma,@d_para,(SELECT id FROM stock_batches WHERE drug_id=@d_para AND location_id=@jichma AND batch_no='QA-PARA-JICHMA'),'QA-PARA-JICHMA',2,2,'tablet',55,22,110),
 (@sale_jichma,@d_ors,(SELECT id FROM stock_batches WHERE drug_id=@d_ors AND location_id=@jichma AND batch_no='QA-ORS-JICHMA'),'QA-ORS-JICHMA',1,1,'sachet',155,70,155);

INSERT INTO payments(payment_no,sale_id,method,amount_ngn,amount_tendered_ngn,reference,status,received_by,verified_by,verified_at,provider_metadata) VALUES
 ('QA-PAY-PAID',@sale_paid,'cash',340,400,'QA-CASH-001','verified',@u_cashier,@u_cashier,NOW(),JSON_OBJECT('synthetic',TRUE)),
 ('QA-PAY-PENDING',@sale_pending,'bank_transfer',360,360,'QA-TRANSFER-001','submitted',@u_disp,NULL,NULL,JSON_OBJECT('synthetic',TRUE)),
 ('QA-PAY-JICHMA',@sale_jichma,'pos_terminal',265,265,'QA-POS-001','verified',@u_cashier,@u_cashier,DATE_SUB(NOW(),INTERVAL 1 DAY),JSON_OBJECT('synthetic',TRUE))
ON DUPLICATE KEY UPDATE sale_id=VALUES(sale_id),method=VALUES(method),amount_ngn=VALUES(amount_ngn),amount_tendered_ngn=VALUES(amount_tendered_ngn),reference=VALUES(reference),status=VALUES(status),received_by=VALUES(received_by),verified_by=VALUES(verified_by),verified_at=VALUES(verified_at),provider_metadata=VALUES(provider_metadata);

-- Returns, stock-count review, adjustment, write-off, and refund queues.
INSERT INTO stock_returns(return_no,source_location_id,destination_location_id,status,reason,disposition,requested_by,approved_by,received_by,inspected_by,submitted_at,received_at,notes) VALUES
 ('QA-RET-PENDING',@central,@store,'pending_approval','Synthetic pharmacy return awaiting DRF inspection.','pending',@u_disp,NULL,NULL,NULL,NOW(),NULL,'Synthetic record; not added back to usable stock.'),
 ('QA-RET-INSPECT',@jichma,@store,'received','Synthetic return received and awaiting inspection.','pending',@u_supervisor,@u_head,@u_drf,NULL,DATE_SUB(NOW(),INTERVAL 1 DAY),NOW(),'Inspect packaging and expiry before disposition.')
ON DUPLICATE KEY UPDATE source_location_id=VALUES(source_location_id),destination_location_id=VALUES(destination_location_id),status=VALUES(status),reason=VALUES(reason),disposition=VALUES(disposition),requested_by=VALUES(requested_by),approved_by=VALUES(approved_by),received_by=VALUES(received_by),inspected_by=VALUES(inspected_by),submitted_at=VALUES(submitted_at),received_at=VALUES(received_at),notes=VALUES(notes);
SET @ret_pending := (SELECT id FROM stock_returns WHERE return_no='QA-RET-PENDING');
SET @ret_inspect := (SELECT id FROM stock_returns WHERE return_no='QA-RET-INSPECT');
DELETE FROM stock_return_items WHERE stock_return_id IN (@ret_pending,@ret_inspect);
INSERT INTO stock_return_items(stock_return_id,drug_id,stock_batch_id,batch_no,expiry_date,quantity,condition_on_return,inspection_note) VALUES
 (@ret_pending,@d_amox,@b_amox_central,'QA-AMOX-CENTRAL',DATE_ADD(CURDATE(),INTERVAL 430 DAY),2,'sealed','Sealed units returned from a cancelled ward request.'),
 (@ret_inspect,@d_para,(SELECT id FROM stock_batches WHERE drug_id=@d_para AND location_id=@jichma AND batch_no='QA-PARA-JICHMA'),'QA-PARA-JICHMA',DATE_ADD(CURDATE(),INTERVAL 500 DAY),4,'unknown','Awaiting physical inspection by store staff.');

INSERT INTO stock_counts(reference,location_id,status,started_by,completed_by,reviewed_by,started_at,completed_at,notes) VALUES
 ('QA-COUNT-OPEN',@store,'counting',@u_drf,NULL,NULL,NOW(),NULL,'Synthetic count in progress for the central store.'),
 ('QA-COUNT-REVIEW',@central,'pending_review',@u_supervisor,@u_supervisor,NULL,DATE_SUB(NOW(),INTERVAL 1 DAY),NOW(),'Synthetic count awaiting independent review.')
ON DUPLICATE KEY UPDATE location_id=VALUES(location_id),status=VALUES(status),started_by=VALUES(started_by),completed_by=VALUES(completed_by),reviewed_by=VALUES(reviewed_by),started_at=VALUES(started_at),completed_at=VALUES(completed_at),notes=VALUES(notes);
SET @count_review := (SELECT id FROM stock_counts WHERE reference='QA-COUNT-REVIEW');
DELETE FROM stock_count_items WHERE stock_count_id=@count_review;
INSERT INTO stock_count_items(stock_count_id,stock_batch_id,drug_id,batch_no,expected_quantity,counted_quantity,counted_by,counted_at,variance_reason) VALUES
 (@count_review,@b_amox_central,@d_amox,'QA-AMOX-CENTRAL',40,39,@u_supervisor,NOW(),'One unit discrepancy; investigate before posting an adjustment.'),
 (@count_review,@b_met_central,@d_met,'QA-MET-CENTRAL',36,36,@u_supervisor,NOW(),NULL);

INSERT INTO stock_adjustments(adjustment_no,location_id,stock_batch_id,quantity_delta,reason,status,requested_by,decided_by,posted_by,decided_at,posted_at) VALUES
 ('QA-ADJ-PENDING',@central,@b_amox_central,-1,'Synthetic variance from physical stock count; awaiting approval.','pending',@u_supervisor,NULL,NULL,NULL,NULL)
ON DUPLICATE KEY UPDATE location_id=VALUES(location_id),stock_batch_id=VALUES(stock_batch_id),quantity_delta=VALUES(quantity_delta),reason=VALUES(reason),status=VALUES(status),requested_by=VALUES(requested_by),decided_by=VALUES(decided_by),posted_by=VALUES(posted_by),decided_at=VALUES(decided_at),posted_at=VALUES(posted_at);

INSERT INTO stock_writeoffs(writeoff_no,location_id,stock_batch_id,quantity,reason,estimated_cost_ngn,status,requested_by,approved_by,posted_by,evidence,approved_at,posted_at) VALUES
 ('QA-WO-PENDING',@store,@b_exp_store,3,'Synthetic expired stock write-off awaiting independent approval.',30,'pending',@u_drf,NULL,NULL,JSON_OBJECT('document','QA-WO-EVIDENCE'),NULL,NULL)
ON DUPLICATE KEY UPDATE location_id=VALUES(location_id),stock_batch_id=VALUES(stock_batch_id),quantity=VALUES(quantity),reason=VALUES(reason),estimated_cost_ngn=VALUES(estimated_cost_ngn),status=VALUES(status),requested_by=VALUES(requested_by),approved_by=VALUES(approved_by),posted_by=VALUES(posted_by),evidence=VALUES(evidence),approved_at=VALUES(approved_at),posted_at=VALUES(posted_at);

DELETE FROM refund_requests WHERE sale_id=@sale_paid AND reason='Synthetic refund request for one returned item.';
INSERT INTO refund_requests(sale_id,requested_by,reason,items,requested_amount_ngn,approved_amount_ngn,status,decided_by,decision_note,requested_at,decided_at,processed_at) VALUES
 (@sale_paid,@u_disp,'Synthetic refund request for one returned item.',JSON_ARRAY(JSON_OBJECT('sku','QA-BKD-001','quantity',1)),50,NULL,'pending',NULL,NULL,NOW(),NULL,NULL);

-- Purchase planning and supplier activity.
INSERT INTO purchase_requests(request_no,requesting_location_id,priority,status,reason,requested_by,reviewed_by,reviewed_at) VALUES
 ('QA-PR-PENDING',@store,'urgent','pending','Synthetic replenishment request generated from below-reorder stock.',@u_proc,NULL,NULL)
ON DUPLICATE KEY UPDATE requesting_location_id=VALUES(requesting_location_id),priority=VALUES(priority),status=VALUES(status),reason=VALUES(reason),requested_by=VALUES(requested_by),reviewed_by=VALUES(reviewed_by),reviewed_at=VALUES(reviewed_at);
SET @purchase_request := (SELECT id FROM purchase_requests WHERE request_no='QA-PR-PENDING');
DELETE FROM purchase_request_items WHERE purchase_request_id=@purchase_request;
INSERT INTO purchase_request_items(purchase_request_id,drug_id,quantity_requested,suggested_supplier_id,notes) VALUES
 (@purchase_request,@d_amox,250,@sup1,'Below central-store reorder threshold.'),
 (@purchase_request,@d_met,100,@sup2,'Replenish central stock for upcoming demand.');

-- Cashier and supervisor reconciliation screens. Use yesterday for a closed business day.
INSERT INTO business_days(location_id,business_date,status,opened_by,closed_by,opened_at,closed_at,closing_snapshot,notes) VALUES
 (@central,CURDATE(),'open',@u_supervisor,NULL,NOW(),NULL,NULL,'Synthetic open business day for payment and day-close testing.'),
 (@central,DATE_SUB(CURDATE(),INTERVAL 1 DAY),'closed',@u_supervisor,@u_supervisor,DATE_SUB(NOW(),INTERVAL 1 DAY),DATE_SUB(NOW(),INTERVAL 1 DAY),JSON_OBJECT('synthetic',TRUE,'sales_ngn',605),'Synthetic closed business day with sample reconciliations.')
ON DUPLICATE KEY UPDATE status=VALUES(status),opened_by=VALUES(opened_by),closed_by=VALUES(closed_by),opened_at=VALUES(opened_at),closed_at=VALUES(closed_at),closing_snapshot=VALUES(closing_snapshot),notes=VALUES(notes);
SET @business_day_closed := (SELECT id FROM business_days WHERE location_id=@central AND business_date=DATE_SUB(CURDATE(),INTERVAL 1 DAY));
DELETE FROM reconciliations WHERE reconciliation_no IN ('QA-RECON-CASH','QA-RECON-BANK','QA-RECON-POS');
INSERT INTO reconciliations(reconciliation_no,business_day_id,payment_method,expected_ngn,confirmed_ngn,difference_ngn,explanation,status,prepared_by,reviewed_by,reviewed_at) VALUES
 ('QA-RECON-CASH',@business_day_closed,'cash',400,400,0,'Synthetic cash total reconciled.', 'approved',@u_cashier,@u_supervisor,NOW()),
 ('QA-RECON-BANK',@business_day_closed,'bank_transfer',360,340,20,'Synthetic transfer discrepancy flagged for investigation.', 'exception',@u_cashier,@u_supervisor,NOW()),
 ('QA-RECON-POS',@business_day_closed,'pos_terminal',265,265,0,'Synthetic terminal settlement reconciled.', 'reviewed',@u_cashier,@u_supervisor,NOW());

-- Append-only audit examples and role-scoped notifications.
DELETE FROM audit_logs WHERE reference_no LIKE 'QA-%' AND module LIKE 'synthetic_%';
INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,reference_no,outcome,before_data,after_data,metadata) VALUES
 (@u_drf,'drf_store_keeper','create','synthetic_transfers','stock_transfer',CAST(@transfer_transit AS CHAR),'QA-TRF-TRANSIT','success',NULL,JSON_OBJECT('status','in_transit'),JSON_OBJECT('source','seed data')),
 (@u_head,'head_pharmacist','review','synthetic_grns','goods_receipt',CAST(@grn_pending AS CHAR),'QA-GRN-PENDING','review_required',NULL,JSON_OBJECT('status','pending_approval'),JSON_OBJECT('source','seed data')),
 (@u_cashier,'cashier','reconcile','synthetic_payments','reconciliation',NULL,'QA-RECON-BANK','review_required',NULL,JSON_OBJECT('difference_ngn',20),JSON_OBJECT('source','seed data')),
 (@u_disp,'pharmacy_dispenser','submit','synthetic_returns','stock_return',CAST(@ret_pending AS CHAR),'QA-RET-PENDING','success',NULL,JSON_OBJECT('status','pending_approval'),JSON_OBJECT('source','seed data'));
DELETE FROM notifications WHERE title LIKE '[QA]%' AND user_id IN (@u_super,@u_cmd,@u_head,@u_drf,@u_disp,@u_supervisor,@u_cashier,@u_proc,@u_auditor,@u_sys);
INSERT INTO notifications(user_id,category,severity,title,message,target_path,reference_type,reference_id) VALUES
 (@u_super,'system','warning','[QA] System health warning','A sample background-job warning is available for system-health UI testing.','/super-admin/system-health','system_health',NULL),
 (@u_cmd,'expiry','warning','[QA] Expiry exposure','Synthetic expired batch exists in DRF STORE.','/cmd/losses','stock_batch',@b_exp_store),
 (@u_head,'approval','warning','[QA] GRN awaiting review','QA-GRN-PENDING is waiting for authorized review.','/head-pharmacist/grns','goods_receipt',@grn_pending),
 (@u_drf,'transfer','info','[QA] Transfer in transit','QA-TRF-TRANSIT is awaiting destination receipt.','/drf-store/transfers','stock_transfer',@transfer_transit),
 (@u_disp,'payment','warning','[QA] Payment verification pending','A synthetic bank-transfer invoice awaits payment verification.','/pharmacy/pos','sale',@sale_pending),
 (@u_supervisor,'low_stock','warning','[QA] Low stock alert','Amoxicillin is below its synthetic reorder point at Central Pharmacy.','/pharmacy-supervisor/dashboard','drug',@d_amox),
 (@u_cashier,'payment','warning','[QA] Payment discrepancy','A sample bank reconciliation has a difference of NGN 20.','/cashier/reconciliation','reconciliation',NULL),
 (@u_proc,'low_stock','info','[QA] Purchase request pending','QA-PR-PENDING is ready for procurement review.','/procurement/purchase-requests','purchase_request',@purchase_request),
 (@u_auditor,'other','info','[QA] Audit sample available','Synthetic stock, sales, payment and approval events are available to inspect.','/auditor/audit-logs','audit_log',NULL),
 (@u_sys,'system','info','[QA] Platform sample data loaded','Synthetic system-health and backup records are available.','/system-admin/system-health','system_health',NULL);

INSERT INTO system_health_events(component,severity,status,message,details,first_seen_at,last_seen_at) VALUES
 ('QA-Background Jobs','warning','open','A synthetic background job is delayed. This is a sample record only.',JSON_OBJECT('synthetic',TRUE,'job','report-export'),DATE_SUB(NOW(),INTERVAL 20 MINUTE),NOW()),
 ('QA-Email Integration','info','resolved','Synthetic email integration health event resolved.',JSON_OBJECT('synthetic',TRUE),DATE_SUB(NOW(),INTERVAL 2 DAY),DATE_SUB(NOW(),INTERVAL 1 DAY));
DELETE FROM system_health_events WHERE component='QA-Background Jobs' AND id<>(SELECT keep_id FROM (SELECT MAX(id) keep_id FROM system_health_events WHERE component='QA-Background Jobs') x);
DELETE FROM system_health_events WHERE component='QA-Email Integration' AND id<>(SELECT keep_id FROM (SELECT MAX(id) keep_id FROM system_health_events WHERE component='QA-Email Integration') x);
INSERT INTO backup_runs(started_at,completed_at,status,destination_label,bytes_written,checksum,error_summary,initiated_by) VALUES
 (DATE_SUB(NOW(),INTERVAL 1 DAY),DATE_SUB(NOW(),INTERVAL 1 DAY),'succeeded','BKD QA ONLY',1048576,'synthetic-checksum-001',NULL,@u_sys),
 (DATE_SUB(NOW(),INTERVAL 2 HOUR),NOW(),'failed','BKD QA ONLY',NULL,NULL,'Synthetic failure record for system-health UI.',@u_sys);
DELETE FROM backup_runs WHERE destination_label='BKD QA ONLY' AND id NOT IN (SELECT keep_id FROM (SELECT MAX(id) keep_id FROM backup_runs WHERE destination_label='BKD QA ONLY' GROUP BY status) x);

-- Inventory movement examples support the auditor's traceability pages.
INSERT INTO inventory_ledger(transaction_no,transaction_type,drug_id,stock_batch_id,location_id,batch_no,quantity_delta,balance_after,unit_cost_ngn,reference_type,reference_id,reason,created_by) VALUES
 ('QA-LEDGER-OPEN-STORE','opening_balance',@d_para,@b_para_store,@store,'QA-PARA-STORE',300,300,22,'synthetic_seed',NULL,'Synthetic opening balance before dispatched transfer.',@u_drf),
 ('QA-LEDGER-TRF-OUT','transfer_out',@d_para,@b_para_store,@store,'QA-PARA-STORE',-20,280,22,'stock_transfer',@transfer_transit,'Synthetic transfer currently in transit.',@u_drf),
 ('QA-LEDGER-GRN','grn_post',@d_amox,@b_amox_store,@store,'QA-AMOX-STORE',40,100,55,'goods_receipt',@grn_posted,'Synthetic posted receipt represented in the seeded balance.',@u_head),
 ('QA-LEDGER-SALE','sale',@d_para,@b_para_central,@central,'QA-PARA-CENTRAL',-2,95,22,'sale',@sale_paid,'Synthetic completed sale represented in the seeded batch balance.',@u_disp),
 ('QA-LEDGER-EXPIRED','quarantine',@d_expiry,@b_exp_store,@store,'QA-EXP-STORE',0,12,10,'synthetic_seed',NULL,'Synthetic expired product; excluded from usable stock.',@u_drf)
ON DUPLICATE KEY UPDATE quantity_delta=VALUES(quantity_delta),balance_after=VALUES(balance_after),reason=VALUES(reason),created_by=VALUES(created_by);

-- Fill operational defaults only when absent; keep site-specific configuration intact.
INSERT IGNORE INTO application_settings(setting_key,setting_value) VALUES
 ('hospital_name','BKD General Hospital'),('currency','NGN'),('timezone','Africa/Lagos'),
 ('low_stock_threshold','20'),('expiry_warning_days','30'),('negative_stock_policy','prevent'),
 ('valuation_method','FEFO'),('reserved_stock_policy','exclude_from_available'),
 ('in_transit_stock_policy','exclude_until_receipt'),
 ('payment_methods','Cash, Bank Transfer, POS Terminal'),('receipt_format','80mm');
INSERT IGNORE INTO numbering_sequences(sequence_key,prefix,next_number,padding) VALUES
 ('goods_receipt','GRN-',1,6),('stock_transfer','TRF-',1,6),('stock_return','RET-',1,6),
 ('invoice','INV-',1,6),('receipt','RCP-',1,6),('purchase_order','PO-',1,6);

COMMIT;

-- Quick verification summary after import.
SELECT 'Synthetic users' AS fixture,COUNT(*) AS records FROM users WHERE username IN ('admin.qa','cmd.qa','headpharm.qa','drf.qa','dispenser.qa','supervisor.qa','cashier.qa','procurement.qa','auditor.qa','sysadmin.qa');
SELECT 'Synthetic drugs' AS fixture,COUNT(*) AS records FROM drugs WHERE sku LIKE 'QA-BKD-%';
SELECT 'Synthetic batches by location' AS fixture,l.name,COUNT(*) AS batches,SUM(b.quantity_on_hand) AS units FROM stock_batches b JOIN locations l ON l.id=b.location_id WHERE b.batch_no LIKE 'QA-%' GROUP BY l.id,l.name ORDER BY l.name;
SELECT 'Synthetic workflow records' AS fixture,'GRN' AS item_type,COUNT(*) AS records FROM goods_receipts WHERE grn_no LIKE 'QA-%'
UNION ALL SELECT 'Synthetic workflow records','Transfer',COUNT(*) FROM stock_transfers WHERE transfer_no LIKE 'QA-%'
UNION ALL SELECT 'Synthetic workflow records','Sale',COUNT(*) FROM sales WHERE invoice_no LIKE 'QA-%'
UNION ALL SELECT 'Synthetic workflow records','Return',COUNT(*) FROM stock_returns WHERE return_no LIKE 'QA-%'
UNION ALL SELECT 'Synthetic workflow records','Stock count',COUNT(*) FROM stock_counts WHERE reference LIKE 'QA-%';
