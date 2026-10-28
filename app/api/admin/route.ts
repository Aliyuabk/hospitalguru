import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const access: Record<string,string[]> = {
  dashboard:['super_administrator','cmd_executive','head_pharmacist','drf_store_keeper','pharmacy_dispenser','pharmacy_supervisor','cashier','procurement_officer','internal_auditor','system_administrator'],
  notifications:['super_administrator','cmd_executive','head_pharmacist','drf_store_keeper','pharmacy_dispenser','pharmacy_supervisor','cashier','procurement_officer','internal_auditor','system_administrator'],
  users:['super_administrator'], roles:['super_administrator'], locations:['super_administrator','cmd_executive','system_administrator'], settings:['super_administrator','system_administrator'], numbering:['super_administrator'],
  drugs:['super_administrator','head_pharmacist','drf_store_keeper','pharmacy_dispenser','cmd_executive','procurement_officer','internal_auditor'],
  suppliers:['super_administrator','drf_store_keeper','procurement_officer','internal_auditor'], audit:['super_administrator','cmd_executive','pharmacy_supervisor','internal_auditor','system_administrator'], health:['super_administrator','system_administrator'],
  inventory:['super_administrator','cmd_executive','head_pharmacist','drf_store_keeper','pharmacy_dispenser','pharmacy_supervisor','internal_auditor'], sales:['cmd_executive','pharmacy_supervisor','pharmacy_dispenser','cashier','internal_auditor'],
  losses:['cmd_executive','head_pharmacist','drf_store_keeper','pharmacy_dispenser','pharmacy_supervisor','internal_auditor'], grns:['cmd_executive','head_pharmacist','drf_store_keeper','internal_auditor'], adjustments:['cmd_executive','head_pharmacist','internal_auditor'], writeoffs:['cmd_executive','head_pharmacist','drf_store_keeper','internal_auditor'],
  transfers:['cmd_executive','drf_store_keeper','head_pharmacist','pharmacy_supervisor','internal_auditor'], transfer_detail:['cmd_executive','drf_store_keeper','head_pharmacist','pharmacy_supervisor','internal_auditor'], audit_detail:['super_administrator','cmd_executive','pharmacy_supervisor','internal_auditor','system_administrator'], requests:['drf_store_keeper','pharmacy_dispenser','pharmacy_supervisor'], returns:['cmd_executive','drf_store_keeper','head_pharmacist','pharmacy_dispenser','pharmacy_supervisor','internal_auditor'],
  payments:['cashier','pharmacy_supervisor','cmd_executive','internal_auditor'], refunds:['cashier','pharmacy_supervisor','cmd_executive','internal_auditor'], stock_counts:['drf_store_keeper','internal_auditor'], reconciliation:['cashier','pharmacy_supervisor','internal_auditor'], procurement:['procurement_officer','head_pharmacist','internal_auditor'], purchase_requests:['procurement_officer','internal_auditor'], ledger:['internal_auditor','head_pharmacist','drf_store_keeper','cmd_executive'],
};

const permissionModules={
  dashboard:['dashboard'], notifications:['notifications'], users:['users'], roles:['roles'], locations:['locations'], settings:['settings','numbering'], drug_catalogue:['drugs'], suppliers:['suppliers'], inventory:['inventory','losses','adjustments','writeoffs','ledger'], grns:['grns'], transfers:['transfers','transfer_detail'], returns:['returns'], stock_requests:['requests'], sales:['sales'], payments:['payments','refunds','reconciliation'], procurement:['procurement','purchase_requests'], stock_counts:['stock_counts'], audit_logs:['audit','audit_detail'], system_health:['health','backup_runs'],
} as const;
const permissionModuleLabels:Record<string,string>={dashboard:'Dashboard',notifications:'Notifications',users:'Users',roles:'Roles & Permissions',locations:'Locations',settings:'Settings',drug_catalogue:'Drug Catalogue',suppliers:'Suppliers',inventory:'Inventory',grns:'GRNs',transfers:'Transfers',returns:'Returns',stock_requests:'Stock Requests',sales:'Sales',payments:'Payments',procurement:'Procurement',stock_counts:'Stock Counts',audit_logs:'Audit Logs',system_health:'System Health'};
const permissionActions=['view','create','edit','approve','delete'] as const;
const resourcePermissionModule:Record<string,string>=Object.fromEntries(Object.entries(permissionModules).flatMap(([module,resources])=>resources.map(resource=>[resource,module])));
const dashboardFieldModules:Record<string,string>={
  total_locations:'locations',active_users:'users',system_alerts:'system_health',backup_status:'system_health',database_connectivity:'system_health',
  stock_value_ngn:'inventory',low_stock_products:'inventory',expiring_products:'inventory',pending_adjustments:'inventory',pending_writeoffs:'inventory',inventory_movements_today:'inventory',usable_stock_units:'inventory',stock_discrepancies:'inventory',writeoff_activity:'inventory',
  today_sales_ngn:'sales',today_transactions:'sales',outstanding_invoices:'sales',pending_payments:'payments',payment_discrepancies:'payments',payments_today:'payments',failed_payments:'payments',refund_requests:'payments',unreconciled_transactions:'payments',day_close_status:'payments',
  pending_grns:'grns',pending_returns:'returns',pending_requests:'stock_requests',transfers_in_transit:'transfers',pending_purchase_requests:'procurement',open_purchase_orders:'procurement',recent_deliveries:'procurement',audit_events_today:'audit_logs',audit_exceptions:'audit_logs',
};

let rolePermissionDefaultsReady=false;let rolePermissionDefaultsPromise:Promise<void>|null=null;
async function ensureRolePermissionDefaults(){
  if(rolePermissionDefaultsReady)return;
  if(rolePermissionDefaultsPromise)return rolePermissionDefaultsPromise;
  rolePermissionDefaultsPromise=(async()=>{
  for(const module of Object.keys(permissionModules))for(const action of permissionActions){const key=`${module}.${action}`;await db.execute('INSERT IGNORE INTO permissions(permission_key,module,action,description) VALUES(?,?,?,?)',[key,module,action,`${permissionModuleLabels[module]} ${action}`]);}
  const [roleRows]=await db.execute('SELECT id,role_key FROM roles');const roleIds=new Map((roleRows as any[]).map(role=>[role.role_key,Number(role.id)]));
  for(const [module,resources] of Object.entries(permissionModules)){
    const roles=[...new Set(resources.flatMap(resource=>access[resource]||[]))];
    if(module==='roles')roles.push('super_administrator');
    for(const roleKey of new Set(roles)){const roleId=roleIds.get(roleKey);if(!roleId)continue;const [permissionRows]=await db.execute('SELECT id FROM permissions WHERE permission_key=?',[`${module}.view`]);const permissionId=Number((permissionRows as any[])[0]?.id);if(permissionId)await db.execute('INSERT IGNORE INTO role_permissions(role_id,permission_id,granted) VALUES(?,?,1)',[roleId,permissionId]);}
  }
  const writable:{role:string;modules:string[]}[]=[{role:'super_administrator',modules:['users','locations','settings','drug_catalogue','suppliers']}];
  for(const {role,modules} of writable){const roleId=roleIds.get(role);if(!roleId)continue;for(const module of modules)for(const action of ['create','edit']){const [permissionRows]=await db.execute('SELECT id FROM permissions WHERE permission_key=?',[`${module}.${action}`]);const permissionId=Number((permissionRows as any[])[0]?.id);if(permissionId)await db.execute('INSERT IGNORE INTO role_permissions(role_id,permission_id,granted) VALUES(?,?,1)',[roleId,permissionId]);}}
  const operationalGrants:[string,string,string[]][]=[['pharmacy_dispenser','sales',['create']],['pharmacy_dispenser','payments',['create']],['pharmacy_dispenser','stock_requests',['create']],['pharmacy_dispenser','returns',['create']],['pharmacy_supervisor','transfers',['edit']],['drf_store_keeper','returns',['edit']],['drf_store_keeper','inventory',['edit']],['head_pharmacist','returns',['approve']],['head_pharmacist','procurement',['approve']],['procurement_officer','procurement',['create','edit']]];
  for(const [role,module,actions] of operationalGrants){const roleId=roleIds.get(role);if(!roleId)continue;for(const action of actions){const [permissionRows]=await db.execute('SELECT id FROM permissions WHERE permission_key=?',[`${module}.${action}`]);const permissionId=Number((permissionRows as any[])[0]?.id);if(permissionId)await db.execute('INSERT IGNORE INTO role_permissions(role_id,permission_id,granted) VALUES(?,?,1)',[roleId,permissionId]);}}
  rolePermissionDefaultsReady=true;
  })();
  try{await rolePermissionDefaultsPromise}catch(error){rolePermissionDefaultsPromise=null;throw error}
}

async function hasPermission(roleKey:string,module:string,action:string){
  const [rows]=await db.execute('SELECT rp.granted FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE r.role_key=? AND r.is_active=1 AND p.permission_key=? LIMIT 1',[roleKey,`${module}.${action}`]);
  return Number((rows as any[])[0]?.granted)===1;
}

const sql: Record<string,string> = {
  dashboard:`SELECT
    (SELECT COUNT(*) FROM locations WHERE is_active=1) total_locations,
    (SELECT COUNT(*) FROM users WHERE status='active') active_users,
    (SELECT COUNT(*) FROM goods_receipts WHERE status='pending_approval')+(SELECT COUNT(*) FROM stock_transfers WHERE status='pending_approval')+(SELECT COUNT(*) FROM stock_adjustments WHERE status='pending')+(SELECT COUNT(*) FROM stock_writeoffs WHERE status='pending') pending_approvals,
    (SELECT COUNT(*) FROM system_health_events WHERE status='open') system_alerts,
    (SELECT COUNT(*) FROM goods_receipts WHERE status='pending_approval')+(SELECT COUNT(*) FROM stock_transfers WHERE status='pending_approval')+(SELECT COUNT(*) FROM stock_adjustments WHERE status='pending')+(SELECT COUNT(*) FROM stock_writeoffs WHERE status='pending') pending_approvals,
    (SELECT COALESCE(SUM(quantity_on_hand*cost_price_ngn),0) FROM stock_batches WHERE status='usable' AND expiry_date>=CURDATE()) stock_value_ngn,
    (SELECT COALESCE(SUM(total_ngn),0) FROM sales WHERE sold_at>=CURRENT_DATE AND status='completed') today_sales_ngn,
    (SELECT COUNT(*) FROM sales WHERE sold_at>=CURRENT_DATE AND status='completed') today_transactions,
    (SELECT COUNT(*) FROM payments WHERE status IN ('pending','submitted')) pending_payments,
    (SELECT COUNT(*) FROM (SELECT b.drug_id,b.location_id,SUM(b.quantity_on_hand-b.quantity_reserved-b.quantity_quarantined) usable FROM stock_batches b WHERE b.status='usable' AND b.expiry_date>=CURDATE() GROUP BY b.drug_id,b.location_id) q LEFT JOIN reorder_rules rr ON rr.drug_id=q.drug_id AND rr.location_id=q.location_id WHERE q.usable<COALESCE(rr.minimum_quantity,(SELECT CAST(setting_value AS UNSIGNED) FROM application_settings WHERE setting_key='low_stock_threshold'),20)) low_stock_products,
    (SELECT COUNT(*) FROM stock_batches WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL COALESCE((SELECT CAST(setting_value AS UNSIGNED) FROM application_settings WHERE setting_key='expiry_warning_days'),30) DAY) AND status='usable') expiring_products,
    (SELECT COUNT(*) FROM goods_receipts WHERE status='pending_approval') pending_grns,
    (SELECT COUNT(*) FROM stock_returns WHERE status IN ('pending_approval','received','inspected')) pending_returns,
    (SELECT COUNT(*) FROM stock_requests WHERE status='pending') pending_requests,
    (SELECT COUNT(*) FROM stock_transfers WHERE status IN ('in_transit','partially_received')) transfers_in_transit,
    (SELECT COUNT(*) FROM stock_adjustments WHERE status='pending') pending_adjustments,
    (SELECT COUNT(*) FROM stock_writeoffs WHERE status='pending') pending_writeoffs,
    (SELECT COUNT(*) FROM reconciliations WHERE status='exception') payment_discrepancies,
    (SELECT COUNT(*) FROM inventory_ledger WHERE DATE(created_at)=CURRENT_DATE) inventory_movements_today,
    (SELECT COALESCE(SUM(quantity_on_hand-quantity_reserved-quantity_quarantined),0) FROM stock_batches WHERE status='usable' AND expiry_date>=CURDATE()) usable_stock_units,
    (SELECT COUNT(*) FROM sales WHERE status='invoiced') outstanding_invoices,
    (SELECT COALESCE((SELECT status FROM business_days WHERE business_date=CURRENT_DATE ORDER BY id DESC LIMIT 1),'Not opened')) day_close_status,
    (SELECT COUNT(*) FROM payments WHERE created_at>=CURRENT_DATE AND status='verified') payments_today,
    (SELECT COUNT(*) FROM payments WHERE status='failed') failed_payments,
    (SELECT COUNT(*) FROM refund_requests WHERE status='pending') refund_requests,
    (SELECT COUNT(*) FROM reconciliations WHERE status IN ('draft','exception')) unreconciled_transactions,
    (SELECT COUNT(*) FROM purchase_requests WHERE status='pending') pending_purchase_requests,
    (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('pending_approval','approved','sent','partially_received')) open_purchase_orders,
    (SELECT COUNT(*) FROM goods_receipts WHERE received_at>=DATE_SUB(CURRENT_DATE,INTERVAL 7 DAY)) recent_deliveries,
    (SELECT COUNT(*) FROM audit_logs WHERE occurred_at>=CURRENT_DATE) audit_events_today,
    (SELECT COUNT(*) FROM audit_logs WHERE outcome='review_required') audit_exceptions,
    (SELECT COUNT(*) FROM stock_adjustments WHERE status IN ('pending','rejected')) stock_discrepancies,
    (SELECT COUNT(*) FROM stock_writeoffs WHERE created_at>=CURRENT_DATE) writeoff_activity,
    'Connected' database_connectivity,
    (SELECT COALESCE((SELECT status FROM backup_runs ORDER BY started_at DESC LIMIT 1),'Not configured')) backup_status`,
  notifications:`SELECT id,category,severity,title,message,target_path,reference_type,reference_id,read_at,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 200`,
  users:`SELECT u.id,u.name,u.username,u.email,u.staff_id,u.status,u.last_login_at,r.role_key,r.name role_name,l.name location_name,u.primary_location_id,COALESCE((SELECT GROUP_CONCAT(ul.location_id ORDER BY loc.name SEPARATOR ',') FROM user_locations ul JOIN locations loc ON loc.id=ul.location_id WHERE ul.user_id=u.id),CAST(u.primary_location_id AS CHAR)) assigned_location_ids,COALESCE((SELECT GROUP_CONCAT(loc.name ORDER BY loc.name SEPARATOR ', ') FROM user_locations ul JOIN locations loc ON loc.id=ul.location_id WHERE ul.user_id=u.id),l.name) assigned_locations,u.created_at FROM users u JOIN roles r ON r.id=u.role_id LEFT JOIN locations l ON l.id=u.primary_location_id ORDER BY u.name LIMIT 500`,
  roles:`SELECT r.id,r.role_key,r.name,r.description,r.is_system,r.is_active,COUNT(DISTINCT u.id) user_count FROM roles r LEFT JOIN users u ON u.role_id=r.id GROUP BY r.id ORDER BY r.id`,
  role_permissions:`SELECT p.id,p.permission_key,p.module,p.action,COALESCE(rp.granted,0) granted FROM permissions p LEFT JOIN role_permissions rp ON rp.permission_id=p.id AND rp.role_id=? WHERE p.module IN (${Object.keys(permissionModules).map(()=>'?').join(',')}) AND p.action IN ('view','create','edit','approve','delete') ORDER BY p.module,FIELD(p.action,'view','create','edit','approve','delete')`,
  my_permissions:`SELECT p.permission_key FROM role_permissions rp JOIN permissions p ON p.id=rp.permission_id JOIN users u ON u.role_id=rp.role_id WHERE u.id=? AND rp.granted=1 ORDER BY p.permission_key`,
  locations:`SELECT l.id,l.code,l.name,l.type,l.address,l.phone,l.is_active,l.supervisor_user_id,u.name supervisor_name,(SELECT COUNT(*) FROM user_locations ul WHERE ul.location_id=l.id) user_count,(SELECT MAX(created_at) FROM inventory_ledger il WHERE il.location_id=l.id) last_activity FROM locations l LEFT JOIN users u ON u.id=l.supervisor_user_id ORDER BY l.id`,
  drugs:`SELECT id,sku,barcode,generic_name,brand_name,category,strength,dosage_form,base_unit,is_active,controlled_drug FROM drugs ORDER BY generic_name LIMIT 500`,
  suppliers:`SELECT s.*, (SELECT COUNT(*) FROM goods_receipts gr WHERE gr.supplier_id=s.id) grn_count FROM suppliers s ORDER BY s.name LIMIT 500`,
  audit:`SELECT a.*,u.name actor_name FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.occurred_at DESC LIMIT 500`,
  health:`SELECT * FROM system_health_events ORDER BY last_seen_at DESC LIMIT 200`,
  backup_runs:`SELECT b.id,b.started_at,b.completed_at,b.status,b.destination_label,b.bytes_written,b.checksum,b.error_summary,u.name initiated_by FROM backup_runs b LEFT JOIN users u ON u.id=b.initiated_by ORDER BY b.started_at DESC LIMIT 500`,
  settings:`SELECT setting_key,setting_value,updated_at FROM application_settings ORDER BY setting_key`,
  numbering:`SELECT sequence_key,prefix,next_number,padding,updated_at FROM numbering_sequences ORDER BY sequence_key`,
  inventory:`SELECT b.id batch_id,b.drug_id,b.location_id,l.name location_name,d.sku,d.generic_name,d.strength,b.batch_no,b.expiry_date,b.quantity_on_hand,b.quantity_reserved,b.quantity_quarantined,b.cost_price_ngn,b.status,COALESCE(rr.minimum_quantity,(SELECT CAST(setting_value AS UNSIGNED) FROM application_settings WHERE setting_key='low_stock_threshold'),20) minimum_quantity FROM stock_batches b JOIN drugs d ON d.id=b.drug_id JOIN locations l ON l.id=b.location_id LEFT JOIN reorder_rules rr ON rr.drug_id=b.drug_id AND rr.location_id=b.location_id ORDER BY b.expiry_date LIMIT 500`,
  sales:`SELECT s.invoice_no,s.sale_type,s.subtotal_ngn,s.total_ngn,s.payment_status,s.status,s.sold_at,l.name location_name,u.name dispenser FROM sales s JOIN locations l ON l.id=s.location_id JOIN users u ON u.id=s.dispenser_user_id ORDER BY s.created_at DESC LIMIT 500`,
  losses:`SELECT d.generic_name,d.sku,l.name location_name,b.batch_no,b.expiry_date,b.quantity_on_hand,b.quantity_quarantined,b.cost_price_ngn,b.status FROM stock_batches b JOIN drugs d ON d.id=b.drug_id JOIN locations l ON l.id=b.location_id WHERE (b.status IN ('expired','quarantined','recalled') OR b.expiry_date<CURDATE()) ORDER BY b.expiry_date LIMIT 500`,
  grns:`SELECT gr.id,gr.created_by gr_created_by,gr.approved_by,gr.grn_no,s.name supplier,l.name location_name,gr.received_at,gr.status,gr.total_cost_ngn,u.name created_by FROM goods_receipts gr JOIN suppliers s ON s.id=gr.supplier_id JOIN locations l ON l.id=gr.destination_location_id JOIN users u ON u.id=gr.created_by ORDER BY gr.created_at DESC LIMIT 500`,
  adjustments:`SELECT a.id,a.adjustment_no,a.requested_by adjustment_requester,l.name location_name,d.generic_name,b.batch_no,a.quantity_delta,a.reason,a.status,u.name requester FROM stock_adjustments a JOIN locations l ON l.id=a.location_id JOIN stock_batches b ON b.id=a.stock_batch_id JOIN drugs d ON d.id=b.drug_id JOIN users u ON u.id=a.requested_by ORDER BY a.created_at DESC LIMIT 500`,
  writeoffs:`SELECT w.id,w.writeoff_no,w.requested_by writeoff_requester,l.name location_name,d.generic_name,b.batch_no,w.quantity,w.reason,w.estimated_cost_ngn,w.status,u.name requester FROM stock_writeoffs w JOIN locations l ON l.id=w.location_id JOIN stock_batches b ON b.id=w.stock_batch_id JOIN drugs d ON d.id=b.drug_id JOIN users u ON u.id=w.requested_by ORDER BY w.created_at DESC LIMIT 500`,
  transfers:`SELECT t.id,t.created_by transfer_creator,t.source_location_id,t.destination_location_id,t.transfer_no,s.name source_location,d.name destination_location,dr.generic_name,t.batch_no,t.quantity_dispatched,t.quantity_received,t.status,t.created_at FROM stock_transfers t JOIN locations s ON s.id=t.source_location_id JOIN locations d ON d.id=t.destination_location_id JOIN drugs dr ON dr.id=t.drug_id ORDER BY t.created_at DESC LIMIT 500`,
  transfer_detail:`SELECT t.id,t.transfer_no,s.name source_location,d.name destination_location,dr.generic_name,t.batch_no,t.quantity_dispatched,t.quantity_received,t.status,t.created_at FROM stock_transfers t JOIN locations s ON s.id=t.source_location_id JOIN locations d ON d.id=t.destination_location_id JOIN drugs dr ON dr.id=t.drug_id WHERE t.id=? LIMIT 1`,
  audit_detail:`SELECT a.*,u.name actor_name FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id WHERE a.id=? LIMIT 1`,
  requests:`SELECT r.id,r.request_no,s.name source_location,d.name requesting_location,r.priority,r.status,r.created_at,u.name requested_by FROM stock_requests r JOIN locations s ON s.id=r.source_location_id JOIN locations d ON d.id=r.requesting_location_id JOIN users u ON u.id=r.requested_by ORDER BY r.created_at DESC LIMIT 500`,
  returns:`SELECT r.id,r.requested_by return_requester,r.return_no,s.name source_location,d.name destination_location,r.status,r.disposition,r.reason,r.created_at,u.name requested_by FROM stock_returns r JOIN locations s ON s.id=r.source_location_id JOIN locations d ON d.id=r.destination_location_id JOIN users u ON u.id=r.requested_by ORDER BY r.created_at DESC LIMIT 500`,
  payments:`SELECT p.id,p.received_by payment_submitter,s.id sale_id,p.payment_no,s.invoice_no,p.method,p.amount_ngn,p.reference,p.status,p.created_at,u.name verified_by FROM payments p JOIN sales s ON s.id=p.sale_id LEFT JOIN users u ON u.id=p.verified_by ORDER BY p.created_at DESC LIMIT 500`,
  refunds:`SELECT r.id,s.invoice_no,s.total_ngn,r.requested_amount_ngn,r.approved_amount_ngn,r.status,r.reason,r.requested_at,u.name requested_by FROM refund_requests r JOIN sales s ON s.id=r.sale_id JOIN users u ON u.id=r.requested_by ORDER BY r.requested_at DESC LIMIT 500`,
  stock_counts:`SELECT c.id,c.reference,l.name location_name,c.status,c.started_at,c.completed_at,u.name started_by,(SELECT COUNT(*) FROM stock_count_items i WHERE i.stock_count_id=c.id) item_count FROM stock_counts c JOIN locations l ON l.id=c.location_id JOIN users u ON u.id=c.started_by ORDER BY c.started_at DESC LIMIT 500`,
  reconciliation:`SELECT r.reconciliation_no,b.business_date,l.name location_name,r.payment_method,r.expected_ngn,r.confirmed_ngn,r.difference_ngn,r.status,u.name prepared_by FROM reconciliations r JOIN business_days b ON b.id=r.business_day_id JOIN locations l ON l.id=b.location_id JOIN users u ON u.id=r.prepared_by ORDER BY b.business_date DESC LIMIT 500`,
  procurement:`SELECT po.id,po.created_by po_creator,po.po_no,s.name supplier,l.name destination_location,po.status,po.order_date,po.expected_date,po.total_ngn,u.name created_by FROM purchase_orders po JOIN suppliers s ON s.id=po.supplier_id JOIN locations l ON l.id=po.destination_location_id JOIN users u ON u.id=po.created_by ORDER BY po.order_date DESC LIMIT 500`,
  purchase_requests:`SELECT pr.request_no,l.name requesting_location,pr.priority,pr.status,pr.reason,pr.created_at,u.name requested_by FROM purchase_requests pr JOIN locations l ON l.id=pr.requesting_location_id JOIN users u ON u.id=pr.requested_by ORDER BY pr.created_at DESC LIMIT 500`,
  ledger:`SELECT i.transaction_no,i.transaction_type,i.created_at,d.sku,d.generic_name,i.batch_no,l.name location_name,i.quantity_delta,i.balance_after,i.reference_type,i.reference_id,i.reason,u.name created_by FROM inventory_ledger i JOIN drugs d ON d.id=i.drug_id JOIN locations l ON l.id=i.location_id LEFT JOIN users u ON u.id=i.created_by ORDER BY i.created_at DESC LIMIT 1000`,
};

const scopedDashboard=`WITH scope AS (SELECT id AS location_id FROM locations WHERE id IN (?))
 SELECT
   (SELECT COUNT(*) FROM locations l JOIN scope c ON c.location_id=l.id AND l.is_active=1) total_locations,
   (SELECT COALESCE(SUM(b.quantity_on_hand*b.cost_price_ngn),0) FROM stock_batches b JOIN scope c ON c.location_id=b.location_id WHERE b.status='usable' AND b.expiry_date>=CURDATE()) stock_value_ngn,
   (SELECT COALESCE(SUM(s.total_ngn),0) FROM sales s JOIN scope c ON c.location_id=s.location_id WHERE s.sold_at>=CURRENT_DATE AND s.status='completed') today_sales_ngn,
   (SELECT COUNT(*) FROM sales s JOIN scope c ON c.location_id=s.location_id WHERE s.sold_at>=CURRENT_DATE AND s.status='completed') today_transactions,
   (SELECT COUNT(*) FROM payments p JOIN sales s ON s.id=p.sale_id JOIN scope c ON c.location_id=s.location_id WHERE p.status IN ('pending','submitted')) pending_payments,
   (SELECT COUNT(*) FROM (SELECT b.drug_id,b.location_id,SUM(b.quantity_on_hand-b.quantity_reserved-b.quantity_quarantined) usable FROM stock_batches b JOIN scope c ON c.location_id=b.location_id WHERE b.status='usable' AND b.expiry_date>=CURDATE() GROUP BY b.drug_id,b.location_id) q LEFT JOIN reorder_rules rr ON rr.drug_id=q.drug_id AND rr.location_id=q.location_id WHERE q.usable<COALESCE(rr.minimum_quantity,(SELECT CAST(setting_value AS UNSIGNED) FROM application_settings WHERE setting_key='low_stock_threshold'),20)) low_stock_products,
   (SELECT COUNT(*) FROM stock_batches b JOIN scope c ON c.location_id=b.location_id WHERE b.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL COALESCE((SELECT CAST(setting_value AS UNSIGNED) FROM application_settings WHERE setting_key='expiry_warning_days'),30) DAY) AND b.status='usable') expiring_products,
   (SELECT COUNT(*) FROM goods_receipts g JOIN scope c ON c.location_id=g.destination_location_id WHERE g.status='pending_approval') pending_grns,
   (SELECT COUNT(*) FROM stock_returns r JOIN scope c ON c.location_id=r.source_location_id WHERE r.status IN ('pending_approval','received','inspected')) pending_returns,
   (SELECT COUNT(*) FROM stock_requests r JOIN scope c ON c.location_id=r.requesting_location_id WHERE r.status='pending') pending_requests,
   (SELECT COUNT(*) FROM stock_transfers t JOIN scope c ON c.location_id=t.source_location_id WHERE t.status IN ('in_transit','partially_received')) transfers_in_transit,
   (SELECT COUNT(*) FROM stock_adjustments a JOIN scope c ON c.location_id=a.location_id WHERE a.status='pending') pending_adjustments,
   (SELECT COUNT(*) FROM stock_writeoffs w JOIN scope c ON c.location_id=w.location_id WHERE w.status='pending') pending_writeoffs,
   (SELECT (SELECT COUNT(*) FROM goods_receipts g JOIN scope c ON c.location_id=g.destination_location_id WHERE g.status='pending_approval')+(SELECT COUNT(*) FROM stock_transfers t JOIN scope c ON c.location_id=t.source_location_id WHERE t.status='pending_approval')+(SELECT COUNT(*) FROM stock_adjustments a JOIN scope c ON c.location_id=a.location_id WHERE a.status='pending')+(SELECT COUNT(*) FROM stock_writeoffs w JOIN scope c ON c.location_id=w.location_id WHERE w.status='pending')) pending_approvals,
   (SELECT COUNT(*) FROM system_health_events WHERE status='open') system_alerts,
   (SELECT COUNT(*) FROM reconciliations r JOIN business_days b ON b.id=r.business_day_id JOIN scope c ON c.location_id=b.location_id WHERE r.status='exception') payment_discrepancies,
   (SELECT COUNT(*) FROM inventory_ledger i JOIN scope c ON c.location_id=i.location_id WHERE DATE(i.created_at)=CURRENT_DATE) inventory_movements_today,
   (SELECT COALESCE(SUM(b.quantity_on_hand-b.quantity_reserved-b.quantity_quarantined),0) FROM stock_batches b JOIN scope c ON c.location_id=b.location_id WHERE b.status='usable' AND b.expiry_date>=CURDATE()) usable_stock_units,
   (SELECT COUNT(*) FROM sales s JOIN scope c ON c.location_id=s.location_id WHERE s.status='invoiced') outstanding_invoices,
   (SELECT COUNT(*) FROM payments p JOIN sales s ON s.id=p.sale_id JOIN scope c ON c.location_id=s.location_id WHERE p.created_at>=CURRENT_DATE AND p.status='verified') payments_today,
   (SELECT COUNT(*) FROM payments p JOIN sales s ON s.id=p.sale_id JOIN scope c ON c.location_id=s.location_id WHERE p.status='failed') failed_payments,
   (SELECT COUNT(*) FROM refund_requests r JOIN sales s ON s.id=r.sale_id JOIN scope c ON c.location_id=s.location_id WHERE r.status='pending') refund_requests,
   (SELECT COUNT(*) FROM reconciliations r JOIN business_days b ON b.id=r.business_day_id JOIN scope c ON c.location_id=b.location_id WHERE r.status IN ('draft','exception')) unreconciled_transactions,
   (SELECT COUNT(*) FROM purchase_requests WHERE status='pending') pending_purchase_requests,
   (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('pending_approval','approved','sent','partially_received')) open_purchase_orders,
   (SELECT COUNT(*) FROM goods_receipts g JOIN scope c ON c.location_id=g.destination_location_id WHERE g.received_at>=DATE_SUB(CURRENT_DATE,INTERVAL 7 DAY)) recent_deliveries,
   (SELECT COALESCE((SELECT status FROM backup_runs ORDER BY started_at DESC LIMIT 1),'Not configured')) backup_status,
   'Connected' database_connectivity`;

export async function GET(request: Request) {
  try {
    const user=await getSessionUser(); if(!user) return NextResponse.json({error:'Sign in required.'},{status:401});
    await ensureRolePermissionDefaults();
    const params=new URL(request.url).searchParams;
    const resource=params.get('resource')||'dashboard';
    if(resource==='dashboard_overview'){
      if(user.role_key!=='super_administrator')return NextResponse.json({error:'Access denied.'},{status:403});
        const [auditView,healthView,notificationView,inventoryView]=await Promise.all([
        hasPermission(user.role_key,'audit_logs','view'),
        hasPermission(user.role_key,'system_health','view'),
        hasPermission(user.role_key,'notifications','view'),
          hasPermission(user.role_key,'inventory','view'),
      ]);
      if(!auditView||!healthView||!notificationView)return NextResponse.json({error:'Access denied.'},{status:403});
        const range=params.get('range');const days=range==='Today'?0:range==='Last 7 days'?6:29;
        const [[activity],[health],[backups],[tasks],[inventory],[auditByDay],[salesByDay]]=await Promise.all([
        db.query('SELECT a.id,a.occurred_at,u.name actor_name,a.action,a.module,a.reference_no,a.entity_id,a.outcome FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.occurred_at DESC LIMIT 6'),
        db.query("SELECT id,component,severity,status,message,first_seen_at,last_seen_at FROM system_health_events WHERE status IN ('open','acknowledged') ORDER BY FIELD(status,'open','acknowledged'),last_seen_at DESC LIMIT 6"),
        db.query("SELECT id,started_at,completed_at,status,destination_label,error_summary FROM backup_runs WHERE status IN ('failed','running') ORDER BY started_at DESC LIMIT 6"),
        db.query("SELECT id,category,severity,title,message,target_path,created_at FROM notifications WHERE user_id=? AND read_at IS NULL ORDER BY FIELD(severity,'critical','warning','info','success'),created_at DESC LIMIT 6",[user.id]),
          inventoryView?db.query("SELECT l.id location_id,l.code,l.name,COALESCE(SUM(CASE WHEN b.status='usable' AND b.expiry_date>=CURDATE() THEN b.quantity_on_hand*b.cost_price_ngn ELSE 0 END),0) stock_value_ngn FROM locations l LEFT JOIN stock_batches b ON b.location_id=l.id WHERE l.is_active=1 GROUP BY l.id,l.code,l.name ORDER BY l.name"):Promise.resolve([[]]),
          db.query(`SELECT DATE(occurred_at) day,COUNT(*) user_activity,SUM(CASE WHEN outcome IN ('failed','rejected','denied') THEN 1 ELSE 0 END) failed_operations FROM audit_logs WHERE occurred_at>=DATE_SUB(CURDATE(),INTERVAL ${days} DAY) GROUP BY DATE(occurred_at)`),
          db.query(`SELECT DATE(sold_at) day,COUNT(*) transactions_created FROM sales WHERE sold_at>=DATE_SUB(CURDATE(),INTERVAL ${days} DAY) GROUP BY DATE(sold_at)`),
      ]);
        const byDay=new Map<string,any>();for(const row of [...auditByDay as any[],...salesByDay as any[]]){const key=new Date(row.day).toISOString().slice(0,10);const point=byDay.get(key)||{day:key,user_activity:0,transactions_created:0,failed_operations:0};point.user_activity=Number(point.user_activity)+Number(row.user_activity||0);point.transactions_created=Number(point.transactions_created)+Number(row.transactions_created||0);point.failed_operations=Number(point.failed_operations)+Number(row.failed_operations||0);byDay.set(key,point)}
        return NextResponse.json({data:{activity,health,backups,tasks,inventory,dailyActivity:[...byDay.values()].sort((a,b)=>a.day.localeCompare(b.day))}});
    }
    if(!sql[resource]) return NextResponse.json({error:'Unknown resource.'},{status:404});
    if(resource==='my_permissions'){}
    else if(resource==='roles'||resource==='role_permissions'){if(user.role_key!=='super_administrator')return NextResponse.json({error:'Access denied.'},{status:403});}
    else {const module=resourcePermissionModule[resource];if(!module||!await hasPermission(user.role_key,module,'view'))return NextResponse.json({error:'Access denied.'},{status:403});}
    const locationScoped=['pharmacy_dispenser','pharmacy_supervisor','cashier','drf_store_keeper'].includes(user.role_key);
    const locationIds=[...new Set([...(user.location_ids||'').split(',').map(Number),Number(user.location_id)].filter(id=>Number.isSafeInteger(id)&&id>0))];
    if(locationScoped&&resource!=='my_permissions'&&!locationIds.length) return NextResponse.json({error:'Your account needs an assigned location before pharmacy data can be viewed.'},{status:403});
    const locationMarks=locationIds.map(()=>'?').join(',');
    if(resource==='settings'){
      const defaults:[string,string][]=[['hospital_name','BKD General Hospital'],['contact_email',''],['phone',''],['address',''],['timezone','Africa/Lagos'],['default_language','English'],['low_stock_threshold','20'],['expiry_warning_days','30'],['negative_stock_policy','prevent'],['valuation_method','FEFO'],['reserved_stock_policy','exclude_from_available'],['in_transit_stock_policy','exclude_until_receipt'],['currency','NGN'],['payment_methods','Cash, Bank Transfer, POS Terminal'],['receipt_format','80mm'],['discount_approval','supervisor'],['tax_config','disabled'],['session_timeout','12'],['password_policy','Minimum 10 characters'],['mfa_policy','not_configured'],['login_rate_limits','5 attempts per 15 minutes']];
      for(const [key,value] of defaults)await db.execute('INSERT IGNORE INTO application_settings(setting_key,setting_value) VALUES(?,?)',[key,value]);
    }
    let query=sql[resource];let values:any[]=[];
    if(resource==='notifications')values=[user.id];
    if(resource==='my_permissions')values=[user.id];
    if(resource==='role_permissions'){const roleId=Number(params.get('role_id'));if(!Number.isSafeInteger(roleId)||roleId<1)return NextResponse.json({error:'Select a valid role.'},{status:400});values=[roleId,...Object.keys(permissionModules)];}
    if(resource==='transfer_detail'||resource==='audit_detail'){
      const id=Number(params.get('id'));if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:'A valid record ID is required.'},{status:400});
      values=[id];
      if(resource==='transfer_detail'&&locationScoped){query=query.replace('WHERE t.id=? LIMIT 1',`WHERE t.id=? AND (t.source_location_id IN (${locationMarks}) OR t.destination_location_id IN (${locationMarks})) LIMIT 1`);values=[id,...locationIds,...locationIds];}
      if(resource==='audit_detail'&&user.role_key==='pharmacy_supervisor'){query=query.replace('WHERE a.id=? LIMIT 1',`WHERE a.id=? AND u.primary_location_id IN (${locationMarks}) LIMIT 1`);values=[id,...locationIds];}
    }
    if(locationScoped&&resource==='dashboard'){query=scopedDashboard.replace('IN (?)',`IN (${locationMarks})`);if(user.role_key==='drf_store_keeper')query=query.replace('r.source_location_id','r.destination_location_id').replace('r.requesting_location_id','r.source_location_id');values=locationIds;}
    else if(locationScoped&&resource==='inventory'){query=query.replace('ORDER BY b.expiry_date',`WHERE b.location_id IN (${locationMarks}) ORDER BY b.expiry_date`);values=locationIds;}
    else if(locationScoped&&resource==='sales'){query=query.replace('ORDER BY s.created_at',`WHERE s.location_id IN (${locationMarks}) ORDER BY s.created_at`);values=locationIds;}
    else if(locationScoped&&resource==='grns'){query=query.replace('ORDER BY gr.created_at',`WHERE gr.destination_location_id IN (${locationMarks}) ORDER BY gr.created_at`);values=locationIds;}
    else if(locationScoped&&resource==='losses'){query=query.replace("WHERE (b.status IN ('expired','quarantined','recalled') OR b.expiry_date<CURDATE()) ORDER BY",`WHERE (b.status IN ('expired','quarantined','recalled') OR b.expiry_date<CURDATE()) AND b.location_id IN (${locationMarks}) ORDER BY`);values=locationIds;}
    else if(locationScoped&&resource==='adjustments'){query=query.replace('ORDER BY a.created_at',`WHERE a.location_id IN (${locationMarks}) ORDER BY a.created_at`);values=locationIds;}
    else if(locationScoped&&resource==='writeoffs'){query=query.replace('ORDER BY w.created_at',`WHERE w.location_id IN (${locationMarks}) ORDER BY w.created_at`);values=locationIds;}
    else if(locationScoped&&resource==='transfers'){query=query.replace('ORDER BY t.created_at',`WHERE (t.source_location_id IN (${locationMarks}) OR t.destination_location_id IN (${locationMarks})) ORDER BY t.created_at`);values=[...locationIds,...locationIds];}
    else if(locationScoped&&resource==='requests'){const column=user.role_key==='drf_store_keeper'?'source_location_id':'requesting_location_id';query=query.replace('ORDER BY r.created_at',`WHERE r.${column} IN (${locationMarks}) ORDER BY r.created_at`);values=locationIds;}
    else if(locationScoped&&resource==='returns'){const column=user.role_key==='drf_store_keeper'?'destination_location_id':'source_location_id';query=query.replace('ORDER BY r.created_at',`WHERE r.${column} IN (${locationMarks}) ORDER BY r.created_at`);values=locationIds;}
    else if(locationScoped&&resource==='payments'){query=query.replace('FROM payments p JOIN sales s ON s.id=p.sale_id LEFT JOIN users u ON u.id=p.verified_by ORDER BY',`FROM payments p JOIN sales s ON s.id=p.sale_id LEFT JOIN users u ON u.id=p.verified_by WHERE s.location_id IN (${locationMarks}) ORDER BY`);values=locationIds;}
    else if(locationScoped&&resource==='refunds'){query=query.replace('ORDER BY r.requested_at',`WHERE s.location_id IN (${locationMarks}) ORDER BY r.requested_at`);values=locationIds;}
    else if(locationScoped&&resource==='stock_counts'){query=query.replace('ORDER BY c.started_at',`WHERE c.location_id IN (${locationMarks}) ORDER BY c.started_at`);values=locationIds;}
    else if(user.role_key==='pharmacy_supervisor'&&resource==='audit'){query=query.replace('ORDER BY a.occurred_at',`WHERE u.primary_location_id IN (${locationMarks}) ORDER BY a.occurred_at`);values=locationIds;}
    else if(locationScoped&&resource==='reconciliation'){query=query.replace('ORDER BY b.business_date',`WHERE b.location_id IN (${locationMarks}) ORDER BY b.business_date`);values=locationIds;}
    const [rows]=await db.query(query,values);
    if(resource==='dashboard'&&Array.isArray(rows)&&rows.length){
      const metrics=rows[0] as Record<string,unknown>;
      const modules=[...new Set([...Object.values(dashboardFieldModules),'grns','transfers'])];
      const grants=Object.fromEntries(await Promise.all(modules.map(async module=>[module,await hasPermission(user.role_key,module,'view')])));
      for(const [field,module] of Object.entries(dashboardFieldModules))if(!grants[module])delete metrics[field];
      // This combined count spans four approval queues, so show it only when all are visible.
      if(!grants.grns||!grants.transfers||!grants.inventory)delete metrics.pending_approvals;
    }
    return NextResponse.json({data:rows,user:{id:user.id,name:user.name,role:user.role_key}});
  } catch(error) { console.error('Admin data error:',error); return NextResponse.json({error:'Unable to load data from hospitalguru.'},{status:503}); }
}

export async function POST(request: Request) {
  try {
    const user=await getSessionUser(); if(!user) return NextResponse.json({error:'Sign in required.'},{status:401});
    await ensureRolePermissionDefaults();
    const body=await request.json(); const resource=String(body.resource||''); let result:any;
    const module=resourcePermissionModule[resource];if(!module||!await hasPermission(user.role_key,module,'create'))return NextResponse.json({error:'You do not have permission to create records in this module.'},{status:403});
    if(resource==='users'){
      const name=String(body.name||'').trim(), username=String(body.username||'').trim(), password=String(body.password||''), roleKey=String(body.role_key||''), email=String(body.email||'').trim()||null;
      if(!name||!username||password.length<10||!roleKey) return NextResponse.json({error:'Name, username, role, and a password of at least 10 characters are required.'},{status:422});
      const status=String(body.status||'active');if(!['active','suspended','pending'].includes(status))return NextResponse.json({error:'Choose a valid account status.'},{status:422});
      const [roles]=await db.execute('SELECT id FROM roles WHERE role_key=? AND is_active=1',[roleKey]); if(!(roles as any[]).length) return NextResponse.json({error:'Select an active role.'},{status:422});
      const ids=[...new Set((Array.isArray(body.location_ids)?body.location_ids:body.location_id?[body.location_id]:[]).map(Number).filter((id:number)=>Number.isSafeInteger(id)&&id>0))];
      if(ids.length){const [valid]=await db.query(`SELECT COUNT(*) count FROM locations WHERE is_active=1 AND id IN (${ids.map(()=>'?').join(',')})`,ids);if(Number((valid as any[])[0]?.count)!==ids.length)return NextResponse.json({error:'One or more assigned locations are inactive or unavailable.'},{status:422})}
      const conn=await db.getConnection();let userId:number;
      try{await conn.beginTransaction();const [created]=await conn.execute('INSERT INTO users(name,username,email,staff_id,password_hash,role_id,primary_location_id,status) VALUES(?,?,?,?,?,?,?,?)',[name,username,email,String(body.staff_id||'').trim()||null,hashPassword(password),(roles as any[])[0].id,ids[0]||null,status]);userId=(created as any).insertId;for(let i=0;i<ids.length;i++)await conn.execute('INSERT INTO user_locations(user_id,location_id,is_default) VALUES(?,?,?)',[userId,ids[i],i===0?1:0]);await conn.commit()}catch(e){await conn.rollback();throw e}finally{conn.release()}
      result={id:userId};
    } else if(resource==='locations'){
      const name=String(body.name||'').trim(), code=String(body.code||'').trim(), type=String(body.type||'');
      if(!name||!code||!['central_store','pharmacy','other'].includes(type)) return NextResponse.json({error:'Location name, code and valid type are required.'},{status:422});
      const [created]=await db.execute('INSERT INTO locations(code,name,type,address,phone,is_active) VALUES(?,?,?,?,?,1)',[code,name,type,String(body.address||'').trim()||null,String(body.phone||'').trim()||null]); result={id:(created as any).insertId};
    } else if(resource==='drugs'){
      if(Array.isArray(body.import_rows)){
        const rows=body.import_rows as any[];if(!rows.length||rows.length>500)return NextResponse.json({error:'Import between 1 and 500 medicine rows at a time.'},{status:422});
        for(let i=0;i<rows.length;i++)if(!String(rows[i]?.sku||'').trim()||!String(rows[i]?.generic_name||'').trim())return NextResponse.json({error:`Medicine row ${i+2} needs a drug code (SKU) and generic name.`},{status:422});
        const conn=await db.getConnection();try{await conn.beginTransaction();for(const row of rows)await conn.execute('INSERT INTO drugs(sku,barcode,generic_name,brand_name,category,strength,dosage_form,base_unit,is_active) VALUES(?,?,?,?,?,?,?,?,1)',[String(row.sku).trim(),String(row.barcode||'').trim()||null,String(row.generic_name).trim(),String(row.brand_name||'').trim()||null,String(row.category||'').trim()||null,String(row.strength||'').trim()||null,String(row.dosage_form||'').trim()||null,String(row.base_unit||'unit').trim()||'unit']);await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,outcome,after_data) VALUES(?,?,?,?,?,?,?)',[user.id,user.role_key,'imported_drugs','drugs','drug_catalogue','success',JSON.stringify({count:rows.length})]);await conn.commit()}catch(error){await conn.rollback();throw error}finally{conn.release()}
        return NextResponse.json({ok:true,imported:rows.length},{status:201});
      }
      const sku=String(body.sku||'').trim(), name=String(body.generic_name||'').trim(), unit=String(body.base_unit||'unit').trim();
      if(!sku||!name) return NextResponse.json({error:'Drug code and generic name are required.'},{status:422});
      const [created]=await db.execute('INSERT INTO drugs(sku,barcode,generic_name,brand_name,category,strength,dosage_form,base_unit,is_active) VALUES(?,?,?,?,?,?,?,?,1)',[sku,String(body.barcode||'').trim()||null,name,String(body.brand_name||'').trim()||null,String(body.category||'').trim()||null,String(body.strength||'').trim()||null,String(body.dosage_form||'').trim()||null,unit]); result={id:(created as any).insertId};
    } else if(resource==='suppliers'){
      if(Array.isArray(body.import_rows)){
        const rows=body.import_rows as any[];if(!rows.length||rows.length>500)return NextResponse.json({error:'Import between 1 and 500 supplier rows at a time.'},{status:422});
        for(let i=0;i<rows.length;i++)if(!String(rows[i]?.name||'').trim())return NextResponse.json({error:`Supplier row ${i+2} needs a supplier name.`},{status:422});
        const conn=await db.getConnection();try{await conn.beginTransaction();for(const row of rows)await conn.execute('INSERT INTO suppliers(code,name,contact_person,phone,email,address,registration_no,is_active) VALUES(?,?,?,?,?,?,?,1)',[String(row.code||'').trim()||null,String(row.name).trim(),String(row.contact_person||'').trim()||null,String(row.phone||'').trim()||null,String(row.email||'').trim()||null,String(row.address||'').trim()||null,String(row.registration_no||'').trim()||null]);await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,outcome,after_data) VALUES(?,?,?,?,?,?,?)',[user.id,user.role_key,'imported_suppliers','suppliers','supplier_list','success',JSON.stringify({count:rows.length})]);await conn.commit()}catch(error){await conn.rollback();throw error}finally{conn.release()}
        return NextResponse.json({ok:true,imported:rows.length},{status:201});
      }
      const name=String(body.name||'').trim(); if(!name) return NextResponse.json({error:'Supplier name is required.'},{status:422});
      const [created]=await db.execute('INSERT INTO suppliers(code,name,contact_person,phone,email,address,registration_no,is_active) VALUES(?,?,?,?,?,?,?,1)',[String(body.code||'').trim()||null,name,String(body.contact_person||'').trim()||null,String(body.phone||'').trim()||null,String(body.email||'').trim()||null,String(body.address||'').trim()||null,String(body.registration_no||'').trim()||null]); result={id:(created as any).insertId};
    } else return NextResponse.json({error:'This administration action is not supported.'},{status:404});
    await db.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,outcome) VALUES(?,?,?,?,?,?,?)',[user.id,user.role_key,`created_${resource}`,resource,resource,String(result.id),'success']);
    return NextResponse.json({ok:true,...result},{status:201});
  } catch(error:any) {
    if(error?.code==='ER_DUP_ENTRY') return NextResponse.json({error:'That username, code, SKU, barcode, or email is already in use.'},{status:409});
    console.error('Admin mutation error:',error); return NextResponse.json({error:'Unable to save this record to hospitalguru.'},{status:503});
  }
}

export async function PATCH(request: Request) {
  try {
    const user=await getSessionUser(); if(!user) return NextResponse.json({error:'Sign in required.'},{status:401});
    const body=await request.json();
    if(body.resource==='notifications'){
      const id=Number(body.id);if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:'A valid notification is required.'},{status:400});
      const [result]=await db.execute('UPDATE notifications SET read_at=COALESCE(read_at,UTC_TIMESTAMP()) WHERE id=? AND user_id=?',[id,user.id]);if((result as any).affectedRows===0)return NextResponse.json({error:'Notification was not found.'},{status:404});return NextResponse.json({ok:true});
    }
    await ensureRolePermissionDefaults();
    if(body.resource==='role_permissions'){
      if(user.role_key!=='super_administrator')return NextResponse.json({error:'Only a Super Administrator can change role permissions.'},{status:403});
      const roleId=Number(body.role_id);const grants=Array.isArray(body.permissions)?body.permissions:[];
      if(!Number.isSafeInteger(roleId)||roleId<1||!grants.length||grants.length>200)return NextResponse.json({error:'Choose a role and provide its permission matrix.'},{status:422});
      const [roleRows]=await db.execute('SELECT role_key FROM roles WHERE id=? AND is_active=1',[roleId]);if(!(roleRows as any[]).length)return NextResponse.json({error:'The selected role is inactive or unavailable.'},{status:404});
      const allowedPermissionKeys=new Set(Object.keys(permissionModules).flatMap(module=>permissionActions.map(action=>`${module}.${action}`)));const unique=new Map<string,boolean>();for(const grant of grants){const key=String(grant.permission_key||'');if(!allowedPermissionKeys.has(key))return NextResponse.json({error:`Unsupported permission key: ${key||'(empty)'}. Reload the permission matrix and try again.`},{status:422});unique.set(key,grant.granted===true||grant.granted===1||grant.granted==='1');}
      const conn=await db.getConnection();try{await conn.beginTransaction();for(const [key,granted] of unique)await conn.execute('INSERT INTO role_permissions(role_id,permission_id,granted) SELECT ?,id,? FROM permissions WHERE permission_key=? ON DUPLICATE KEY UPDATE granted=VALUES(granted)',[roleId,granted?1:0,key]);await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,outcome,after_data) VALUES(?,?,?,?,?,?,?,?)',[user.id,user.role_key,'updated_role_permissions','roles','role',String(roleId),'success',JSON.stringify(Object.fromEntries(unique))]);await conn.commit()}catch(e){await conn.rollback();throw e}finally{conn.release()}
      return NextResponse.json({ok:true,updated:unique.size});
    }
    const module=resourcePermissionModule[String(body.resource||'')];if(!module||!await hasPermission(user.role_key,module,'edit'))return NextResponse.json({error:'You do not have permission to edit records in this module.'},{status:403});
    if(body.resource==='users'&&Number(body.id)>0){
      const id=Number(body.id);const fields:string[]=[];const values:any[]=[];let revoke=false;
      for(const key of ['name','username','email','staff_id'] as const)if(body[key]!==undefined){const val=String(body[key]||'').trim();if(key==='name'&&!val)return NextResponse.json({error:'Name cannot be empty.'},{status:422});fields.push(`${key}=?`);values.push(val||null)}
      if(body.status!==undefined){if(!['active','suspended','pending'].includes(String(body.status)))return NextResponse.json({error:'Choose a valid account status.'},{status:422});fields.push('status=?');values.push(body.status);revoke=body.status==='suspended'}
      if(body.role_key){const [r]=await db.execute('SELECT id FROM roles WHERE role_key=? AND is_active=1',[body.role_key]);if(!(r as any[]).length)return NextResponse.json({error:'Role is not active.'},{status:422});fields.push('role_id=?');values.push((r as any[])[0].id);revoke=true}
      if(body.password!==undefined){const password=String(body.password);if(password.length<10)return NextResponse.json({error:'Temporary password must be at least 10 characters.'},{status:422});fields.push('password_hash=?','password_changed_at=UTC_TIMESTAMP()');values.push(hashPassword(password));revoke=true}
      const hasLocations=Array.isArray(body.location_ids)||body.location_id!==undefined;const ids=[...new Set((Array.isArray(body.location_ids)?body.location_ids:body.location_id?[body.location_id]:[]).map(Number).filter((locationId:number)=>Number.isSafeInteger(locationId)&&locationId>0))];
      if(hasLocations&&ids.length){const [valid]=await db.query(`SELECT COUNT(*) count FROM locations WHERE is_active=1 AND id IN (${ids.map(()=>'?').join(',')})`,ids);if(Number((valid as any[])[0]?.count)!==ids.length)return NextResponse.json({error:'One or more assigned locations are inactive or unavailable.'},{status:422})}
      if(hasLocations){fields.push('primary_location_id=?');values.push(ids[0]||null)}
      if(!fields.length&&!hasLocations)return NextResponse.json({error:'No supported changes supplied.'},{status:422});
      const conn=await db.getConnection();try{await conn.beginTransaction();if(fields.length){values.push(id);const [updated]=await conn.execute(`UPDATE users SET ${fields.join(',')},updated_at=UTC_TIMESTAMP() WHERE id=?`,values);if((updated as any).affectedRows===0){await conn.rollback();return NextResponse.json({error:'User record was not found.'},{status:404})}}if(hasLocations){await conn.execute('DELETE FROM user_locations WHERE user_id=?',[id]);for(let i=0;i<ids.length;i++)await conn.execute('INSERT INTO user_locations(user_id,location_id,is_default) VALUES(?,?,?)',[id,ids[i],i===0?1:0])}if(revoke)await conn.execute('DELETE FROM access_tokens WHERE user_id=?',[id]);await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,outcome,after_data) VALUES(?,?,?,?,?,?,?,?)',[user.id,user.role_key,'updated_user_access','users','user',String(id),'success',JSON.stringify({status:body.status,role_key:body.role_key,location_ids:hasLocations?ids:undefined})]);await conn.commit()}catch(e){await conn.rollback();throw e}finally{conn.release()}
      return NextResponse.json({ok:true});
    }
    if(body.resource==='locations'&&Number(body.id)>0){const id=Number(body.id);const allowed:Record<string,string>={name:'name',code:'code',type:'type',address:'address',phone:'phone'};const fields:string[]=[];const values:any[]=[];for(const [key,col] of Object.entries(allowed))if(body[key]!==undefined){const value=String(body[key]||'').trim();if(key==='type'&&!['central_store','pharmacy','other'].includes(value))return NextResponse.json({error:'Choose a valid location type.'},{status:422});if(['name','code'].includes(key)&&!value)return NextResponse.json({error:`${key} cannot be empty.`},{status:422});fields.push(`${col}=?`);values.push(value||null)}if(body.is_active!==undefined){fields.push('is_active=?');values.push(body.is_active?1:0)}if(!fields.length)return NextResponse.json({error:'No location changes supplied.'},{status:422});values.push(id);await db.execute(`UPDATE locations SET ${fields.join(',')},updated_at=UTC_TIMESTAMP() WHERE id=?`,values);await db.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,outcome,after_data) VALUES(?,?,?,?,?,?,?,?)',[user.id,user.role_key,'updated_location','locations','location',String(id),'success',JSON.stringify(body)]);return NextResponse.json({ok:true})}
    if((body.resource==='drugs'||body.resource==='suppliers')&&Number(body.id)>0){const id=Number(body.id);const map:Record<string,Record<string,string>>={drugs:{sku:'sku',generic_name:'generic_name',brand_name:'brand_name',barcode:'barcode',category:'category',strength:'strength',dosage_form:'dosage_form',base_unit:'base_unit'},suppliers:{name:'name',code:'code',contact_person:'contact_person',phone:'phone',email:'email',address:'address',registration_no:'registration_no'}};const fields:string[]=[];const values:any[]=[];for(const [key,col] of Object.entries(map[body.resource]))if(body[key]!==undefined){const value=String(body[key]||'').trim();if(['sku','generic_name','name'].includes(key)&&!value)return NextResponse.json({error:`${key} cannot be empty.`},{status:422});fields.push(`${col}=?`);values.push(value||null)}if(body.is_active!==undefined){fields.push('is_active=?');values.push(body.is_active?1:0)}if(!fields.length)return NextResponse.json({error:'No changes supplied.'},{status:422});values.push(id);await db.execute(`UPDATE ${body.resource} SET ${fields.join(',')},updated_at=UTC_TIMESTAMP() WHERE id=?`,values);await db.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,outcome,after_data) VALUES(?,?,?,?,?,?,?,?)',[user.id,user.role_key,`updated_${body.resource}`,body.resource,body.resource,String(id),'success',JSON.stringify(body)]);return NextResponse.json({ok:true})}
    if(body.resource==='settings'){
      const settings=body.settings as Record<string,unknown>;if(!settings||typeof settings!=='object')return NextResponse.json({error:'No settings supplied.'},{status:422});
      const allowed=new Set(['hospital_name','contact_email','phone','address','timezone','default_language','low_stock_threshold','expiry_warning_days','negative_stock_policy','valuation_method','reserved_stock_policy','in_transit_stock_policy','currency','payment_methods','receipt_format','discount_approval','tax_config','session_timeout','password_policy','mfa_policy','login_rate_limits']);
      const entries=Object.entries(settings).filter(([key,value])=>allowed.has(key)&&value!==undefined&&value!==null).slice(0,40);if(!entries.length)return NextResponse.json({error:'No permitted settings supplied.'},{status:422});
      for(const [key,raw] of entries){const value=String(raw).trim();if(key==='hospital_name'&&!value)return NextResponse.json({error:'Hospital name is required.'},{status:422});if(['low_stock_threshold','expiry_warning_days','session_timeout'].includes(key)&&(!/^\d+$/.test(value)||Number(value)<1||Number(value)>3650))return NextResponse.json({error:`${key.replaceAll('_',' ')} must be a valid positive number.`},{status:422});if(key==='currency'&&!/^[A-Z]{3}$/.test(value))return NextResponse.json({error:'Currency must use a three-letter uppercase code.'},{status:422});if(key==='negative_stock_policy'&&!['prevent','allow_with_approval'].includes(value))return NextResponse.json({error:'Invalid negative-stock policy.'},{status:422});if(key==='valuation_method'&&!['FEFO','FIFO','weighted_average'].includes(value))return NextResponse.json({error:'Invalid inventory valuation method.'},{status:422});if(key==='reserved_stock_policy'&&value!=='exclude_from_available')return NextResponse.json({error:'Unsupported reserved-stock policy.'},{status:422});if(key==='in_transit_stock_policy'&&value!=='exclude_until_receipt')return NextResponse.json({error:'Unsupported in-transit stock policy.'},{status:422});}
      for(const [key,value] of entries)await db.execute('INSERT INTO application_settings(setting_key,setting_value,updated_by) VALUES(?,?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value),updated_by=VALUES(updated_by),updated_at=UTC_TIMESTAMP()',[key,String(value).slice(0,1000),user.id]);
      await db.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,outcome,after_data) VALUES(?,?,?,?,?,?)',[user.id,user.role_key,'updated_hospital_settings','settings','success',JSON.stringify(Object.fromEntries(entries))]);return NextResponse.json({ok:true,updated:entries.length});
    }
    if(body.resource==='numbering'){
      const rows=Array.isArray(body.sequences)?body.sequences:[];if(!rows.length)return NextResponse.json({error:'No numbering sequences supplied.'},{status:422});
      const allowed=new Set(['goods_receipt','stock_transfer','stock_return','invoice','receipt','purchase_order']);
      for(const row of rows){if(!allowed.has(String(row.sequence_key))||!/^[-A-Za-z0-9]{1,20}$/.test(String(row.prefix))||Number(row.next_number)<1||Number(row.padding)<1||Number(row.padding)>12)return NextResponse.json({error:'One or more numbering formats are invalid.'},{status:422});await db.execute('INSERT INTO numbering_sequences(sequence_key,prefix,next_number,padding) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE prefix=VALUES(prefix),next_number=VALUES(next_number),padding=VALUES(padding)',[row.sequence_key,row.prefix,Number(row.next_number),Number(row.padding)]);}
      await db.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,outcome,after_data) VALUES(?,?,?,?,?,?)',[user.id,user.role_key,'updated_transaction_numbering','settings','success',JSON.stringify(rows)]);return NextResponse.json({ok:true,updated:rows.length});
    }
    return NextResponse.json({error:'This update is not supported.'},{status:404});
  } catch(error){console.error('Admin update error:',error);return NextResponse.json({error:'Unable to update record.'},{status:503})}
}
