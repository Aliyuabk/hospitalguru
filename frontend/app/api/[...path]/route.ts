import { NextRequest, NextResponse } from 'next/server';
import { db, one, rows, run } from '@/lib/mysql';
import { allowed, currentUser, login, logout, type User } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
const fail = (message: string, status = 400) => ok({ message }, status);
const body = async (req: NextRequest) => {
  if (req.headers.get('content-type')?.includes('application/json')) return req.json().catch(() => ({}));
  if (req.headers.get('content-type')?.includes('multipart/form-data')) {
    const form = await req.formData().catch(() => null); const value: Record<string, unknown> = {};
    form?.forEach((entry, key) => { if (typeof entry === 'string') value[key] = entry; });
    return value;
  }
  return {};
};
const num = (v: unknown, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const clean = (u: User) => ({ id: u.id, name: u.name, email: u.email, role: u.role, department_id: u.department_id, is_active: Boolean(u.is_active) });
const page = (data: any[], total: number, perPage: number, current = 1) => ({ data, current_page: current, per_page: perPage, total, last_page: Math.max(1, Math.ceil(total / perPage)) });
const staffRoles = ['hod', 'store_keeper', 'pharmacy_staff'];

async function getRows(sql: string, values: any[] = []) { return rows(sql, values); }
async function requireUser(req: NextRequest, roles?: string[]) {
  const user = await currentUser(req);
  if (!user) return { error: fail('Unauthenticated.', 401) } as const;
  if (roles && !allowed(user, roles)) return { error: fail('This action is unauthorized.', 403) } as const;
  return { user } as const;
}

async function read(path: string[], req: NextRequest, user: User) {
  const q = req.nextUrl.searchParams;
  const root = path[0];
  if (root === 'me') return ok(clean(user));
  if (root === 'desktop-discovery') return ok({ api_url: '/api' });
  if (root === 'departments') return ok(await getRows(`SELECT id,name,code,type FROM departments WHERE is_active=1 ${user.role === 'pharmacy_staff' ? 'AND id=?' : ''} ORDER BY id`, user.role === 'pharmacy_staff' ? [user.department_id || 0] : []));
  if (root === 'drugs') {
    const dep = user.role === 'pharmacy_staff' ? user.department_id : num(q.get('department_id')) || null;
    if (path[1]) {
      const drug = await one('SELECT * FROM drugs WHERE id=? AND is_active=1', [num(path[1])]);
      if (!drug) return fail('Drug not found.', 404);
      (drug as any).stocks = await getRows(`SELECT s.*,dpt.name AS department_name FROM stocks s LEFT JOIN departments dpt ON dpt.id=s.department_id WHERE s.drug_id=? AND s.quantity>0 AND s.expiry_date>=CURDATE() ${dep ? 'AND s.department_id=?' : ''} ORDER BY s.expiry_date`, dep ? [num(path[1]), dep] : [num(path[1])]);
      return ok(drug);
    }
    const params: any[] = [];
    const where = ['d.is_active=1'];
    if (q.get('q')) { where.push('(d.name LIKE ? OR d.sku LIKE ? OR d.barcode LIKE ?)'); params.push(...Array(3).fill(`%${q.get('q')}%`)); }
    const drugs = await getRows(`SELECT d.* FROM drugs d WHERE ${where.join(' AND ')} ORDER BY d.name LIMIT 100`, params);
    for (const drug of drugs as any[]) drug.stocks = await getRows(`SELECT s.*,dpt.name AS department_name FROM stocks s LEFT JOIN departments dpt ON dpt.id=s.department_id WHERE s.drug_id=? AND s.quantity>0 AND s.expiry_date>=CURDATE() ${dep ? 'AND s.department_id=?' : ''} ORDER BY s.expiry_date`, dep ? [drug.id, dep] : [drug.id]);
    return ok(page(drugs as any[], (drugs as any[]).length, 100));
  }
  if (root === 'patients') {
    const search = q.get('q'); const values: any[] = [];
    const where = search ? 'WHERE folder_no LIKE ? OR full_name LIKE ? OR phone LIKE ? OR nhis_number LIKE ?' : '';
    if (search) values.push(...Array(4).fill(`%${search}%`));
    if (path[1]) return ok(await one('SELECT * FROM patients WHERE id=?', [num(path[1])]));
    return ok(page(await getRows(`SELECT * FROM patients ${where} ORDER BY full_name LIMIT 100`, values), 100, 25));
  }
  if (root === 'inventory') {
    if (path[1] === 'summary') {
      const [settingRows, aggregate, departments] = await Promise.all([
        getRows('SELECT `key`,`value` FROM pharmacy_settings WHERE `key` IN (?,?)', ['low_stock_threshold','expiry_warning_days']),
        one('SELECT COALESCE(SUM(quantity*cost_price_naira),0) stock_value_naira, SUM(quantity < 20) low_stock_count, SUM(expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 30 DAY)) expiring_count FROM stocks' + (user.role === 'pharmacy_staff' ? ' WHERE department_id=?' : ''), user.role === 'pharmacy_staff' ? [user.department_id || 0] : []),
        one('SELECT COUNT(*) count FROM departments WHERE is_active=1'),
      ]);
      const settings = Object.fromEntries((settingRows as any[]).map(x => [x.key, Number(x.value)]));
      return ok({ ...aggregate, low_stock_threshold: settings.low_stock_threshold || 20, expiry_warning_days: settings.expiry_warning_days || 30, departments: (departments as any)?.count || 0 });
    }
    if (path[1] === 'transfers') return ok(page(await getRows(`SELECT t.*,JSON_OBJECT('id',d.id,'name',d.name) drug,JSON_OBJECT('id',fd.id,'name',fd.name) from_department,JSON_OBJECT('id',td.id,'name',td.name) to_department,JSON_OBJECT('id',u.id,'name',u.name) creator FROM stock_transfers t JOIN drugs d ON d.id=t.drug_id JOIN departments fd ON fd.id=t.from_department_id JOIN departments td ON td.id=t.to_department_id JOIN users u ON u.id=t.created_by ORDER BY t.transferred_at DESC LIMIT 50`), 50, 50));
    const dep = user.role === 'pharmacy_staff' ? user.department_id : num(q.get('department_id')) || null;
    const inventory = await getRows(`SELECT s.*,JSON_OBJECT('id',d.id,'name',d.name,'sku',d.sku,'unit',d.unit) drug,JSON_OBJECT('id',p.id,'name',p.name) department,JSON_OBJECT('id',sp.id,'name',sp.name) supplier FROM stocks s JOIN drugs d ON d.id=s.drug_id JOIN departments p ON p.id=s.department_id LEFT JOIN suppliers sp ON sp.id=s.supplier_id WHERE s.quantity>0 ${dep ? 'AND s.department_id=?' : ''} ORDER BY s.expiry_date LIMIT 200`, dep ? [dep] : []);
    return ok(page(inventory as any[], (inventory as any[]).length, 50));
  }
  if (root === 'suppliers') {
    const s = q.get('q'); return ok(page(await getRows(`SELECT * FROM suppliers ${s ? 'WHERE name LIKE ?' : ''} ORDER BY name LIMIT 50`, s ? [`%${s}%`] : []), 50, 50));
  }
  if (root === 'sales') {
    const sales = await getRows(`SELECT s.*,JSON_OBJECT('full_name',p.full_name,'folder_no',p.folder_no) patient FROM sales s LEFT JOIN patients p ON p.id=s.patient_id WHERE 1=1 ${user.role === 'pharmacy_staff' ? 'AND s.staff_id=?' : ''} ORDER BY s.sold_at DESC LIMIT 30`, user.role === 'pharmacy_staff' ? [user.id] : []);
    for (const sale of sales as any[]) sale.items = await getRows('SELECT si.*,JSON_OBJECT("id",d.id,"name",d.name) drug FROM sale_items si JOIN drugs d ON d.id=si.drug_id WHERE si.sale_id=?', [sale.id]);
    return ok(page(sales as any[], (sales as any[]).length, 30));
  }
  if (root === 'prescriptions') {
    if (path[1]) {
      const rx = await one(`SELECT p.*,JSON_OBJECT("id",pt.id,"full_name",pt.full_name,"folder_no",pt.folder_no,"phone",pt.phone) patient,JSON_OBJECT("id",u.id,"name",u.name) doctor FROM prescriptions p JOIN patients pt ON pt.id=p.patient_id JOIN users u ON u.id=p.doctor_id WHERE p.id=? ${user.role === 'doctor' ? 'AND p.doctor_id=?' : ''}`, user.role === 'doctor' ? [num(path[1]), user.id] : [num(path[1])]);
      if (!rx) return fail('Prescription not found.', 404);
      (rx as any).items = await getRows('SELECT i.*,JSON_OBJECT("id",d.id,"name",d.name,"sku",d.sku,"unit",d.unit) drug FROM prescription_items i JOIN drugs d ON d.id=i.drug_id WHERE prescription_id=?', [num(path[1])]);
      return ok(rx);
    }
    let where = ''; const params: any[] = [];
    if (user.role === 'doctor') { where = 'WHERE p.doctor_id=?'; params.push(user.id); }
    if (user.role === 'pharmacy_staff') where = "WHERE p.status IN ('pending','partially_dispensed')";
    const list = await getRows(`SELECT p.*,JSON_OBJECT('id',pt.id,'full_name',pt.full_name,'folder_no',pt.folder_no,'phone',pt.phone) patient,JSON_OBJECT('id',u.id,'name',u.name) doctor FROM prescriptions p JOIN patients pt ON pt.id=p.patient_id JOIN users u ON u.id=p.doctor_id ${where} ORDER BY p.prescribed_at DESC LIMIT 50`, params);
    for (const rx of list as any[]) rx.items = await getRows('SELECT i.*,JSON_OBJECT("id",d.id,"name",d.name,"sku",d.sku) drug FROM prescription_items i JOIN drugs d ON d.id=i.drug_id WHERE prescription_id=?', [rx.id]);
    return ok(page(list as any[], (list as any[]).length, 30));
  }
  if (root === 'stock-counts') {
    if (path[1] === 'active') return ok(await one("SELECT c.*,JSON_OBJECT('id',d.id,'name',d.name) department FROM stock_counts c JOIN departments d ON d.id=c.department_id WHERE c.status='counting' AND (? IS NULL OR c.department_id=?) LIMIT 1", [num(q.get('department_id')) || null, num(q.get('department_id')) || null]));
    const id = path[1] ? num(path[1]) : null;
    if (id) { const count = await one("SELECT c.*,JSON_OBJECT('id',d.id,'name',d.name) department FROM stock_counts c JOIN departments d ON d.id=c.department_id WHERE c.id=?", [id]); if (!count) return fail('Stock count not found.',404); (count as any).items = await getRows("SELECT i.*,JSON_OBJECT('name',d.name,'sku',d.sku,'unit',d.unit) drug,s.quantity current_quantity FROM stock_count_items i JOIN drugs d ON d.id=i.drug_id LEFT JOIN stocks s ON s.id=i.stock_id WHERE i.stock_count_id=?", [id]); return ok(count); }
    return ok(page(await getRows("SELECT c.*,JSON_OBJECT('id',d.id,'name',d.name) department,(SELECT COUNT(*) FROM stock_count_items i WHERE i.stock_count_id=c.id) items_count FROM stock_counts c JOIN departments d ON d.id=c.department_id ORDER BY c.started_at DESC LIMIT 50"),50,50));
  }
  if (root === 'dashboard') {
    const p = q.get('period') || 'daily'; const since = p === 'monthly' ? new Date(new Date().getFullYear(),new Date().getMonth(),1) : p === 'weekly' ? new Date(Date.now()-7*86400000) : new Date(new Date().setHours(0,0,0,0));
    const scope = ['hod','md'].includes(user.role) ? '' : ' AND department_id=?'; const args = scope ? [user.department_id] : [];
    const [sales, month, stock, deptCount, chart, recent, departmentPerformance, staffPerformance] = await Promise.all([
      one(`SELECT COALESCE(SUM(total_naira),0) total FROM sales WHERE sold_at>=?${scope}`, [since,...args]),
      one(`SELECT COALESCE(SUM(total_naira),0) total FROM sales WHERE YEAR(sold_at)=YEAR(CURDATE()) AND MONTH(sold_at)=MONTH(CURDATE())${scope}`, args),
      one('SELECT COALESCE(SUM(quantity*cost_price_naira),0) value FROM stocks'),
      one('SELECT COUNT(*) count FROM departments WHERE is_active=1'),
      getRows(`SELECT DATE(sold_at) date,SUM(total_naira) total_naira FROM sales WHERE sold_at>=DATE_FORMAT(CURDATE(),'%Y-%m-01')${scope} GROUP BY DATE(sold_at) ORDER BY date`, args),
      getRows("SELECT s.*,JSON_OBJECT('full_name',p.full_name,'folder_no',p.folder_no) patient,JSON_OBJECT('name',d.name) department,JSON_OBJECT('name',u.name) staff FROM sales s LEFT JOIN patients p ON p.id=s.patient_id JOIN departments d ON d.id=s.department_id JOIN users u ON u.id=s.staff_id ORDER BY s.sold_at DESC LIMIT 8"),
      getRows(`SELECT d.id department_id,d.name department,SUM(s.total_naira) total_naira FROM sales s JOIN departments d ON d.id=s.department_id WHERE s.sold_at>=DATE_FORMAT(CURDATE(),'%Y-%m-01')${scope} GROUP BY d.id,d.name ORDER BY total_naira DESC`, args),
      getRows(`SELECT u.id staff_id,u.name staff,SUM(s.total_naira) total_naira,COUNT(*) transactions FROM sales s JOIN users u ON u.id=s.staff_id WHERE s.sold_at>=DATE_FORMAT(CURDATE(),'%Y-%m-01')${scope} GROUP BY u.id,u.name ORDER BY total_naira DESC LIMIT 10`, args),
    ]);
    const counts = await one('SELECT SUM(quantity<20) low_stock_count,SUM(expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 30 DAY)) expiring_count FROM stocks');
    return ok({ period:p,today_sales_naira:(sales as any)?.total||0,month_sales_naira:(month as any)?.total||0,stock_value_naira:(stock as any)?.value||0,departments:(deptCount as any)?.count||0,sales_chart:chart,recent_sales:recent,...counts,low_stock_threshold:20,expiry_warning_days:30,department_performance:(departmentPerformance as any[]).map(x=>({...x,department:{name:x.department}})),staff_performance:(staffPerformance as any[]).map(x=>({...x,staff:{name:x.staff}})) });
  }
  if (root === 'reports') {
    const from = q.get('from') || (q.get('period') === 'monthly' ? new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().slice(0,10) : new Date().toISOString().slice(0,10));
    const to = q.get('to') || new Date().toISOString().slice(0,10);
    const [agg,daily,payments,departments,staff] = await Promise.all([
      one('SELECT COALESCE(SUM(total_naira),0) total_naira,COALESCE(SUM(discount_naira),0) discount_naira,COUNT(*) transaction_count FROM sales WHERE sold_at BETWEEN ? AND ?', [`${from} 00:00:00`,`${to} 23:59:59`]),
      getRows('SELECT DATE(sold_at) date,SUM(total_naira) total_naira,COUNT(*) transactions FROM sales WHERE sold_at BETWEEN ? AND ? GROUP BY DATE(sold_at) ORDER BY date', [`${from} 00:00:00`,`${to} 23:59:59`]),
      getRows('SELECT payment_mode,SUM(total_naira) total_naira,COUNT(*) count FROM sales WHERE sold_at BETWEEN ? AND ? GROUP BY payment_mode', [`${from} 00:00:00`,`${to} 23:59:59`]),
      getRows('SELECT d.name department,SUM(s.total_naira) total_naira FROM sales s JOIN departments d ON d.id=s.department_id WHERE s.sold_at BETWEEN ? AND ? GROUP BY d.id,d.name ORDER BY total_naira DESC', [`${from} 00:00:00`,`${to} 23:59:59`]),
      getRows('SELECT u.name staff,SUM(s.total_naira) total_naira,COUNT(*) transactions FROM sales s JOIN users u ON u.id=s.staff_id WHERE s.sold_at BETWEEN ? AND ? GROUP BY u.id,u.name ORDER BY total_naira DESC', [`${from} 00:00:00`,`${to} 23:59:59`]),
    ]); return ok({from,to,...agg,daily,payment_modes:payments,departments:(departments as any[]).map(x=>({...x,department:{name:x.department}})),staff:(staff as any[]).map(x=>({...x,staff:{name:x.staff}}))});
  }
  if (root === 'settings' && path[1] === 'alerts') {
    const settings = await getRows('SELECT `key`,`value` FROM pharmacy_settings WHERE `key` IN (?,?)',['low_stock_threshold','expiry_warning_days']);
    const dict = Object.fromEntries((settings as any[]).map(x=>[x.key,x.value])); return ok({low_stock_threshold:Number(dict.low_stock_threshold||20),expiry_warning_days:Number(dict.expiry_warning_days||30)});
  }
  if (root === 'sync' && path[1] === 'conflicts') return ok(page(await getRows('SELECT c.*,u.name staff_name,d.name department_name FROM sync_conflicts c JOIN users u ON u.id=c.staff_id JOIN departments d ON d.id=c.department_id WHERE c.status="pending" ORDER BY c.created_at DESC'),100,50));
  if (root === 'users') {
    if(path[1]) {
      const userDetails = await one('SELECT u.id,u.name,u.email,u.role,u.department_id,u.is_active,u.created_at,JSON_OBJECT("id",d.id,"name",d.name) department FROM users u LEFT JOIN departments d ON d.id=u.department_id WHERE u.id=?',[num(path[1])]);
      return userDetails ? ok(userDetails) : fail('User not found.',404);
    }
    const current = Math.max(1, num(q.get('page'), 1));
    const perPage = 100;
    const total = Number((await one('SELECT COUNT(*) total FROM users'))?.total || 0);
    const users = await getRows('SELECT u.id,u.name,u.email,u.role,u.department_id,u.is_active,u.created_at,JSON_OBJECT("id",d.id,"name",d.name) department FROM users u LEFT JOIN departments d ON d.id=u.department_id ORDER BY u.name LIMIT ? OFFSET ?', [perPage, (current - 1) * perPage]);
    return ok(page(users as any[], total, perPage, current));
  }
  if (root === 'chat' && path[1] === 'contacts') return ok(await getRows("SELECT u.id,u.name,u.role,u.department_id,d.name department,(SELECT body FROM staff_messages m WHERE (m.sender_id=u.id AND m.recipient_id=?) OR (m.sender_id=? AND m.recipient_id=u.id) ORDER BY m.id DESC LIMIT 1) last_message,(SELECT created_at FROM staff_messages m WHERE (m.sender_id=u.id AND m.recipient_id=?) OR (m.sender_id=? AND m.recipient_id=u.id) ORDER BY m.id DESC LIMIT 1) last_message_at,(SELECT COUNT(*) FROM staff_messages m WHERE m.sender_id=u.id AND m.recipient_id=? AND m.read_at IS NULL) unread_count FROM users u LEFT JOIN departments d ON d.id=u.department_id WHERE u.is_active=1 AND u.id<>? ORDER BY last_message_at DESC,u.name",[user.id,user.id,user.id,user.id,user.id,user.id]));
  if (root === 'chat' && path[1] && path[2] === 'messages') {const contact=num(path[1]);const messages=await getRows('SELECT * FROM staff_messages WHERE (sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?) ORDER BY id ASC LIMIT 100',[user.id,contact,contact,user.id]);await run('UPDATE staff_messages SET read_at=NOW() WHERE sender_id=? AND recipient_id=? AND read_at IS NULL',[contact,user.id]);return ok(messages)}
  return fail('Endpoint not found.',404);
}

async function write(path: string[], req: NextRequest, user: User) {
  const root = path[0]; const b: any = await body(req); const method = req.method;
  if (root === 'account' && path[1] === 'profile' && method === 'PATCH') {
    const fields: string[]=[]; const vals: any[]=[];
    for (const key of ['name','email']) if (b[key] !== undefined) { fields.push(`${key}=?`); vals.push(String(b[key]).trim()); }
    if (b.password || b.current_password || String(b.email||'') !== user.email) {
      const bcrypt = await import('bcryptjs'); const existing = await one<any>('SELECT password FROM users WHERE id=?',[user.id]);
      if (!b.current_password || !existing || !(await bcrypt.default.compare(String(b.current_password),existing.password))) return fail('Your current password is incorrect.',422);
      if (b.password) { if(String(b.password).length<8) return fail('New password must be at least 8 characters.',422); if(b.password_confirmation && b.password_confirmation!==b.password)return fail('Password confirmation does not match.',422); fields.push('password=?'); vals.push(await bcrypt.default.hash(String(b.password),12)); }
    }
    if (fields.length) await run(`UPDATE users SET ${fields.join(',')},updated_at=NOW() WHERE id=?`,[...vals,user.id]);
    return ok(await one('SELECT id,name,email,role,department_id,is_active FROM users WHERE id=?',[user.id]));
  }
  if (root === 'drugs') {
    if (method === 'POST' && user.role === 'hod') {
      const name=String(b.name||'').trim(), sku=String(b.sku||'').trim(), unit=String(b.unit||'').trim();
      if(!name||!sku||!unit) return fail('Drug name, SKU and unit are required.',422);
      const r=await run('INSERT INTO drugs(name,barcode,sku,category,unit,is_active,created_at,updated_at) VALUES(?,?,?,?,?,1,NOW(),NOW())',[name,String(b.barcode||'').trim()||null,sku,String(b.category||'').trim()||null,unit]);
      return ok(await one('SELECT * FROM drugs WHERE id=?',[r.insertId]),201);
    }
    if (path[1] && ['PATCH','PUT'].includes(method)) {
      if (user.role!=='hod') return fail('This action is unauthorized.',403);
      const allowedFields=['name','barcode','sku','category','unit','is_active']; const f=allowedFields.filter(k=>b[k]!==undefined);
      if(!await one('SELECT id FROM drugs WHERE id=?',[num(path[1])])) return fail('Drug not found.',404);
      if(f.some(k=>['name','sku','unit'].includes(k)&&!String(b[k]||'').trim())) return fail('Drug name, SKU and unit cannot be empty.',422);
      if(f.length) await run(`UPDATE drugs SET ${f.map(k=>`${k}=?`).join(',')},updated_at=NOW() WHERE id=?`,[...f.map(k=>b[k]===''?null:b[k]),num(path[1])]);
      return ok(await one('SELECT * FROM drugs WHERE id=?',[num(path[1])]));
    }
    if (path[1] && method==='DELETE' && user.role==='hod') { await run('UPDATE drugs SET is_active=0 WHERE id=?',[num(path[1])]); return new NextResponse(null,{status:204}); }
  }
  if (root === 'patients') {
    if (method==='POST') { if(!allowed(user,['hod','pharmacy_staff']))return fail('This action is unauthorized.',403);const fullName=String(b.full_name||'').trim();const folderNo=String(b.folder_no||'').trim();if(!fullName||!folderNo)return fail('Patient name and hospital folder number are required.',422);const r=await run('INSERT INTO patients(folder_no,full_name,phone,nhis_number,created_at,updated_at) VALUES(?,?,?,?,NOW(),NOW())',[folderNo,fullName,String(b.phone||'').trim()||null,String(b.nhis_number||'').trim()||null]); return ok(await one('SELECT * FROM patients WHERE id=?',[r.insertId]),201); }
    if (path[1] && ['PATCH','PUT'].includes(method)) { const f=['folder_no','full_name','phone','nhis_number'].filter(k=>b[k]!==undefined); if(f.length) await run(`UPDATE patients SET ${f.map(k=>`${k}=?`).join(',')},updated_at=NOW() WHERE id=?`,[...f.map(k=>b[k]||null),num(path[1])]); return ok(await one('SELECT * FROM patients WHERE id=?',[num(path[1])])); }
    if (path[1] && method==='DELETE' && user.role==='hod') { await run('DELETE FROM patients WHERE id=?',[num(path[1])]); return new NextResponse(null,{status:204}); }
  }
  if (root === 'inventory' && path[1] === 'stock' && method==='POST') {
    if(!allowed(user,['hod','store_keeper'])) return fail('This action is unauthorized.',403);
    if(await one("SELECT id FROM stock_counts WHERE department_id=? AND status='counting' LIMIT 1",[num(b.department_id)])) return fail('Stock receiving is paused while this pharmacy unit is being physically counted.',423);
    const r=await run('INSERT INTO stocks(drug_id,department_id,batch_no,quantity,cost_price_naira,selling_price_naira,expiry_date,supplier_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,NOW(),NOW())',[b.drug_id,b.department_id,b.batch_no,b.quantity,b.cost_price_naira,b.selling_price_naira,b.expiry_date,b.supplier_id||null]); return ok(await one('SELECT * FROM stocks WHERE id=?',[r.insertId]),201);
  }
  if (root==='inventory' && path[1]==='transfers' && method==='POST') {
    if(!allowed(user,['hod','store_keeper'])) return fail('This action is unauthorized.',403);
    if(await one("SELECT id FROM stock_counts WHERE department_id IN (?,?) AND status='counting' LIMIT 1",[num(b.from_department_id),num(b.to_department_id)])) return fail('Stock transfers are paused while a pharmacy unit is being physically counted.',423);
    const conn=await db.getConnection(); try { await conn.beginTransaction(); const [srows]:any=await conn.execute('SELECT * FROM stocks WHERE id=? FOR UPDATE',[b.stock_id]); const s=srows[0]; if(!s||s.quantity<num(b.quantity)) throw new Error('Source batch does not have enough stock.'); await conn.execute('UPDATE stocks SET quantity=quantity-? WHERE id=?',[b.quantity,s.id]); const [existing]:any=await conn.execute('SELECT id FROM stocks WHERE drug_id=? AND department_id=? AND batch_no=? FOR UPDATE',[s.drug_id,b.to_department_id,s.batch_no]); let target=existing[0]; if(target) await conn.execute('UPDATE stocks SET quantity=quantity+? WHERE id=?',[b.quantity,target.id]); else { const [ins]:any=await conn.execute('INSERT INTO stocks(drug_id,department_id,batch_no,quantity,cost_price_naira,selling_price_naira,expiry_date,supplier_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,NOW(),NOW())',[s.drug_id,b.to_department_id,s.batch_no,b.quantity,s.cost_price_naira,s.selling_price_naira,s.expiry_date,s.supplier_id]); target={id:ins.insertId}; } const no=`TRF-${Date.now()}`; const [tr]:any=await conn.execute('INSERT INTO stock_transfers(transfer_no,from_department_id,to_department_id,drug_id,from_stock_id,batch_no,quantity,created_by,status,transferred_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,NOW(),NOW())',[no,s.department_id,b.to_department_id,s.drug_id,s.id,s.batch_no,b.quantity,user.id,'completed',new Date()]); await conn.commit(); return ok(await one('SELECT * FROM stock_transfers WHERE id=?',[tr.insertId]),201); } catch(e:any){await conn.rollback();return fail(e.message||'Transfer failed.',422)} finally{conn.release()}
  }
  if (root==='prescriptions' && method==='POST' && allowed(user,['hod','doctor'])) {
    if(!Array.isArray(b.items)||!b.items.length) return fail('Add at least one prescription item.',422);
    if(!Number.isInteger(Number(b.patient_id))||!await one('SELECT id FROM patients WHERE id=?',[num(b.patient_id)])) return fail('Select a valid patient.',422);
    if(b.items.some((item:any)=>!Number.isInteger(Number(item.drug_id))||!Number.isInteger(Number(item.quantity))||Number(item.quantity)<1)) return fail('Each medicine needs a valid drug and a quantity of at least one.',422);
    const conn=await db.getConnection(); try { await conn.beginTransaction(); const no=`RX-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,10).toUpperCase()}`; const [ins]:any=await conn.execute('INSERT INTO prescriptions(prescription_no,patient_id,doctor_id,status,notes,prescribed_at,created_at,updated_at) VALUES(?,?,?,"pending",?,NOW(),NOW(),NOW())',[no,b.patient_id,user.id,String(b.notes||'').trim()||null]); for(const item of b.items) { const [drug]:any=await conn.execute('SELECT id FROM drugs WHERE id=? AND is_active=1',[num(item.drug_id)]); if(!drug.length) throw new Error('A selected drug is no longer active.'); await conn.execute('INSERT INTO prescription_items(prescription_id,drug_id,quantity,dispensed_quantity,dosage,duration,instructions,created_at,updated_at) VALUES(?,?,?,0,?,?,?,NOW(),NOW())',[ins.insertId,num(item.drug_id),num(item.quantity),String(item.dosage||'').trim()||null,String(item.duration||'').trim()||null,String(item.instructions||'').trim()||null]); } await conn.commit(); return ok(await one('SELECT * FROM prescriptions WHERE id=?',[ins.insertId]),201); } catch(e:any){await conn.rollback();return fail(e.message,422)} finally{conn.release()}
  }
  if(root==='prescriptions'&&path[1]&&method==='PATCH'&&allowed(user,['hod','doctor'])) {
    if(!Array.isArray(b.items)||!b.items.length) return fail('Add at least one prescription item.',422);
    if(b.items.some((item:any)=>!Number.isInteger(Number(item.drug_id))||!Number.isInteger(Number(item.quantity))||Number(item.quantity)<1)) return fail('Each medicine needs a valid drug and a quantity of at least one.',422);
    const conn=await db.getConnection();
    try {
      await conn.beginTransaction();
      const [found]:any=await conn.execute('SELECT * FROM prescriptions WHERE id=? FOR UPDATE',[num(path[1])]);
      const rx=found[0];
      if(!rx) throw new Error('Prescription not found.');
      if(user.role==='doctor'&&Number(rx.doctor_id)!==Number(user.id)) throw new Error('You can only edit prescriptions you created.');
      if(rx.status!=='pending') throw new Error('Only pending prescriptions can be edited.');
      if(!Number.isInteger(Number(b.patient_id))||!await one('SELECT id FROM patients WHERE id=?',[num(b.patient_id)])) throw new Error('Select a valid patient.');
      for(const item of b.items){const [drug]:any=await conn.execute('SELECT id FROM drugs WHERE id=? AND is_active=1',[num(item.drug_id)]);if(!drug.length)throw new Error('A selected drug is no longer active.');}
      await conn.execute('DELETE FROM prescription_items WHERE prescription_id=?',[rx.id]);
      for(const item of b.items) await conn.execute('INSERT INTO prescription_items(prescription_id,drug_id,quantity,dispensed_quantity,dosage,duration,instructions,created_at,updated_at) VALUES(?,?,?,0,?,?,?,NOW(),NOW())',[rx.id,num(item.drug_id),num(item.quantity),String(item.dosage||'').trim()||null,String(item.duration||'').trim()||null,String(item.instructions||'').trim()||null]);
      await conn.execute('UPDATE prescriptions SET patient_id=?,notes=?,updated_at=NOW() WHERE id=?',[num(b.patient_id),String(b.notes||'').trim()||null,rx.id]);
      await conn.commit();
      return ok(await one('SELECT * FROM prescriptions WHERE id=?',[rx.id]));
    } catch(e:any) {await conn.rollback();return fail(e.message,422)} finally {conn.release()}
  }
  if(root==='prescriptions'&&path[1]&&method==='DELETE'&&allowed(user,['hod','doctor'])) {
    const rx=await one<any>('SELECT id,doctor_id,status FROM prescriptions WHERE id=?',[num(path[1])]);
    if(!rx)return fail('Prescription not found.',404);
    if(user.role==='doctor'&&Number(rx.doctor_id)!==Number(user.id))return fail('You can only cancel prescriptions you created.',403);
    if(rx.status!=='pending')return fail('Only pending prescriptions can be cancelled.',409);
    await run('UPDATE prescriptions SET status="cancelled",updated_at=NOW() WHERE id=?',[rx.id]);
    return new NextResponse(null,{status:204});
  }
  if (root==='sync' && path[1]==='sales' && method==='POST') return syncSale(b,user);
  if (root==='settings' && path[1]==='alerts' && method==='PUT' && user.role==='hod') { for(const [key,value] of [['low_stock_threshold',b.low_stock_threshold],['expiry_warning_days',b.expiry_warning_days]] as const) await run('INSERT INTO pharmacy_settings(`key`,`value`,updated_by,created_at,updated_at) VALUES(?,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`),updated_by=VALUES(updated_by),updated_at=NOW()',[key,String(value),user.id]); return ok({low_stock_threshold:num(b.low_stock_threshold),expiry_warning_days:num(b.expiry_warning_days)}); }
  if (root==='sync'&&path[1]==='conflicts'&&path[2]&&path[3]==='review'&&method==='PATCH'&&user.role==='hod') { await run('UPDATE sync_conflicts SET status="reviewed",review_note=?,reviewed_by=?,reviewed_at=NOW(),updated_at=NOW() WHERE id=?',[b.review_note,user.id,num(path[2])]); return ok(await one('SELECT * FROM sync_conflicts WHERE id=?',[num(path[2])])); }
  if(root==='chat'&&path[1]&&path[2]==='messages'&&method==='POST'){const r=await run('INSERT INTO staff_messages(sender_id,recipient_id,body,created_at,updated_at) VALUES(?,?,?,NOW(),NOW())',[user.id,num(path[1]),String(b.body||'').slice(0,4000)]);return ok(await one('SELECT * FROM staff_messages WHERE id=?',[r.insertId]),201)}
  if(root==='suppliers'&&method==='POST'&&allowed(user,['hod','store_keeper'])){const r=await run('INSERT INTO suppliers(name,phone,email,address,created_at,updated_at) VALUES(?,?,?,?,NOW(),NOW())',[b.name,b.phone||null,b.email||null,b.address||null]);return ok(await one('SELECT * FROM suppliers WHERE id=?',[r.insertId]),201)}
  if(root==='suppliers'&&path[1]&&['PATCH','PUT'].includes(method)&&allowed(user,['hod','store_keeper'])){const f=['name','phone','email','address'].filter(k=>b[k]!==undefined);if(f.length)await run(`UPDATE suppliers SET ${f.map(k=>`${k}=?`).join(',')},updated_at=NOW() WHERE id=?`,[...f.map(k=>b[k]||null),num(path[1])]);return ok(await one('SELECT * FROM suppliers WHERE id=?',[num(path[1])]))}
  if(root==='suppliers'&&path[1]&&method==='DELETE'&&allowed(user,['hod','store_keeper'])){const linked=await one('SELECT id FROM stocks WHERE supplier_id=? LIMIT 1',[num(path[1])]);if(linked)return fail('Supplier is linked to stock records.',409);await run('DELETE FROM suppliers WHERE id=?',[num(path[1])]);return new NextResponse(null,{status:204})}
  if(root==='auth'&&path[1]==='logout'){await logout(req);return ok({message:'Logged out'})}
  if(root==='stock-counts'&&method==='POST'&&allowed(user,['hod','store_keeper'])){const dep=num(b.department_id);const conn=await db.getConnection();try{await conn.beginTransaction();const [active]:any=await conn.execute('SELECT id FROM stock_counts WHERE department_id=? AND status="counting" FOR UPDATE',[dep]);if(active.length)throw new Error('An active count already exists.');const ref=`CNT-${Date.now()}`;const [ins]:any=await conn.execute('INSERT INTO stock_counts(reference,department_id,status,started_by,started_at,created_at,updated_at) VALUES(?,?,"counting",?,NOW(),NOW(),NOW())',[ref,dep,user.id]);const [stocks]:any=await conn.execute('SELECT * FROM stocks WHERE department_id=?',[dep]);for(const s of stocks)await conn.execute('INSERT INTO stock_count_items(stock_count_id,stock_id,drug_id,batch_no,expected_quantity,created_at,updated_at) VALUES(?,?,?,?,?,NOW(),NOW())',[ins.insertId,s.id,s.drug_id,s.batch_no,s.quantity]);await conn.commit();return ok(await one('SELECT * FROM stock_counts WHERE id=?',[ins.insertId]),201)}catch(e:any){await conn.rollback();return fail(e.message,422)}finally{conn.release()}}
  if(root==='stock-counts'&&path[1]&&path[2]==='items'&&path[3]&&method==='PUT'){await run('UPDATE stock_count_items SET counted_quantity=?,counted_by=?,counted_at=NOW(),updated_at=NOW() WHERE stock_count_id=? AND id=?',[b.counted_quantity,user.id,num(path[1]),num(path[3])]);return ok({message:'Count recorded'})}
  if(root==='stock-counts'&&path[1]&&path[2]==='complete'&&method==='POST'&&user.role==='hod'){const conn=await db.getConnection();try{await conn.beginTransaction();const [its]:any=await conn.execute('SELECT * FROM stock_count_items WHERE stock_count_id=? FOR UPDATE',[num(path[1])]);for(const i of its){if(i.counted_quantity===null)throw new Error('Count every stock line before completing.');if(i.stock_id)await conn.execute('UPDATE stocks SET quantity=? WHERE id=?',[i.counted_quantity,i.stock_id])}await conn.execute('UPDATE stock_counts SET status="completed",completed_by=?,completed_at=NOW(),updated_at=NOW() WHERE id=?',[user.id,num(path[1])]);await conn.commit();return ok({message:'Stock count completed'})}catch(e:any){await conn.rollback();return fail(e.message,422)}finally{conn.release()}}
  if(root==='users'&&method==='POST'&&user.role==='hod'){const bcrypt=await import('bcryptjs');const hash=await bcrypt.default.hash(String(b.password),12);const r=await run('INSERT INTO users(name,email,password,role,department_id,is_active,created_at,updated_at) VALUES(?,?,?,?,?,1,NOW(),NOW())',[b.name,b.email,hash,b.role,b.department_id||null]);return ok(await one('SELECT id,name,email,role,department_id,is_active FROM users WHERE id=?',[r.insertId]),201)}
  if(root==='users'&&path[1]&&user.role==='hod'&&['PATCH','PUT'].includes(method)){const id=num(path[1]);if(id===user.id&&(b.role!==undefined&&b.role!=='hod'||b.is_active!==undefined&&!Boolean(b.is_active)))return fail('You cannot change your own role or disable your account.',422);if(b.role!==undefined&&!['hod','store_keeper','pharmacy_staff','md','doctor'].includes(String(b.role)))return fail('Select a valid staff role.',422);const f=['name','email','role','department_id','is_active'].filter(k=>b[k]!==undefined);const vals=f.map(k=>b[k]);if(b.password){if(String(b.password).length<8)return fail('Password must be at least 8 characters.',422);const bcrypt=await import('bcryptjs');f.push('password');vals.push(await bcrypt.default.hash(String(b.password),12))}if(f.length)await run(`UPDATE users SET ${f.map(k=>`${k}=?`).join(',')},updated_at=NOW() WHERE id=?`,[...vals,id]);return ok(await one('SELECT id,name,email,role,department_id,is_active FROM users WHERE id=?',[id]))}
  if(root==='users'&&path[1]&&method==='DELETE'&&user.role==='hod'){if(num(path[1])===user.id)return fail('You cannot remove your own account.',422);await run('UPDATE users SET is_active=0 WHERE id=?',[num(path[1])]);return new NextResponse(null,{status:204})}
  return fail('Endpoint not found.',404);
}

async function syncSale(data: any, user: User) {
  if (!data.local_id || !data.invoice_no || !Array.isArray(data.items) || !data.items.length) return fail('Sale details are incomplete.',422);
  const subtotal=Number(data.subtotal_naira), discount=Number(data.discount_naira), total=Number(data.total_naira);
  const itemsTotal=data.items.reduce((sum:number,item:any)=>sum+Number(item.quantity)*Number(item.unit_price_naira),0);
  if(![subtotal,discount,total,itemsTotal].every(Number.isFinite)||subtotal<0||discount<0||discount>subtotal||total!==subtotal-discount||itemsTotal!==subtotal||data.items.some((item:any)=>!Number.isInteger(Number(item.drug_id))||!Number.isInteger(Number(item.quantity))||Number(item.quantity)<1||Number(item.unit_price_naira)<0)) return fail('Sale totals or item quantities are invalid.',422);
  const conn=await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing]:any=await conn.execute('SELECT * FROM sales WHERE client_sale_id=?',[data.local_id]);
    if(existing.length){await conn.commit();return ok({sale:existing[0],is_synced:true,local_id:data.local_id})}
    const department=user.department_id||2;
    await conn.execute('SELECT id FROM departments WHERE id=? FOR UPDATE',[department]);
    const [counts]:any=await conn.execute('SELECT id FROM stock_counts WHERE department_id=? AND status="counting"',[department]);
    if(counts.length)throw new Error('Sales are paused for this pharmacy unit while a physical stock count is in progress.');
    let patientId=data.patient_id||null;
    if(!patientId&&data.folder_no){const [p]:any=await conn.execute('SELECT id FROM patients WHERE folder_no=?',[data.folder_no]);patientId=p[0]?.id||null}
    let prescription=null; let prescriptionLines:Map<number,any>|null=null;
    if(data.prescription_id){const [rx]:any=await conn.execute('SELECT * FROM prescriptions WHERE id=? FOR UPDATE',[data.prescription_id]);prescription=rx[0];if(!prescription||Number(prescription.patient_id)!==Number(patientId)||!['pending','partially_dispensed'].includes(prescription.status))throw new Error('Prescription does not match this patient or is no longer available.');const [rxItems]:any=await conn.execute('SELECT * FROM prescription_items WHERE prescription_id=? FOR UPDATE',[prescription.id]);prescriptionLines=new Map(rxItems.map((line:any)=>[Number(line.drug_id),line]));const dispensed=new Map<number,number>();for(const item of data.items)dispensed.set(Number(item.drug_id),(dispensed.get(Number(item.drug_id))||0)+Number(item.quantity));for(const [drugId,quantity] of dispensed){const line=prescriptionLines.get(drugId);if(!line||quantity>Number(line.quantity)-Number(line.dispensed_quantity))throw new Error('Sale items exceed the remaining prescribed quantities.');}}
    const [sale]:any=await conn.execute('INSERT INTO sales(invoice_no,client_sale_id,prescription_id,patient_id,staff_id,department_id,subtotal_naira,discount_naira,total_naira,payment_mode,is_synced,sold_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,1,?,?,NOW())',[data.invoice_no,data.local_id,data.prescription_id||null,patientId,user.id,department,data.subtotal_naira,data.discount_naira,data.total_naira,data.payment_mode,data.created_at||new Date(),new Date()]);
    for(const item of data.items){const [stocks]:any=await conn.execute('SELECT * FROM stocks WHERE drug_id=? AND department_id=? AND quantity>0 AND expiry_date>=CURDATE() ORDER BY expiry_date FOR UPDATE',[item.drug_id,department]);const stock=stocks.find((s:any)=>s.quantity>=Number(item.quantity));if(!stock)throw new Error(`Insufficient stock for ${item.name||'medicine'}. Sale is held for HOD review.`);await conn.execute('UPDATE stocks SET quantity=quantity-? WHERE id=?',[item.quantity,stock.id]);await conn.execute('INSERT INTO sale_items(sale_id,drug_id,quantity,unit_price_naira,cost_price_naira,line_total_naira,created_at,updated_at) VALUES(?,?,?,?,?,?,NOW(),NOW())',[sale.insertId,item.drug_id,item.quantity,item.unit_price_naira,stock.cost_price_naira,Number(item.quantity)*Number(item.unit_price_naira)]);if(prescription)await conn.execute('UPDATE prescription_items SET dispensed_quantity=dispensed_quantity+? WHERE prescription_id=? AND drug_id=?',[item.quantity,prescription.id,item.drug_id]);}
    if(prescription){const [remaining]:any=await conn.execute('SELECT COUNT(*) count FROM prescription_items WHERE prescription_id=? AND dispensed_quantity<quantity',[prescription.id]);await conn.execute('UPDATE prescriptions SET status=?,updated_at=NOW() WHERE id=?',[remaining[0].count?'partially_dispensed':'dispensed',prescription.id])}
    await conn.execute('UPDATE sync_conflicts SET status="resolved",updated_at=NOW() WHERE client_sale_id=?',[data.local_id]);await conn.commit();return ok({sale:{id:sale.insertId,...data},is_synced:true,local_id:data.local_id},201);
  }catch(e:any){await conn.rollback();try{await run('INSERT INTO sync_conflicts(client_sale_id,invoice_no,staff_id,department_id,payload,reason,status,created_at,updated_at) VALUES(?,?,?,?,?,? ,"pending",NOW(),NOW()) ON DUPLICATE KEY UPDATE payload=VALUES(payload),reason=VALUES(reason),status="pending",updated_at=NOW()',[data.local_id,data.invoice_no,user.id,user.department_id||2,JSON.stringify(data),e.message])}catch{}return fail(e.message||'Sale sync failed.',409)}finally{conn.release()}
}

async function dispatch(req: NextRequest, params: { path: string[] }) {
  const path=params.path; const method=req.method;
  try {
    if(path[0]==='auth'&&path[1]==='login'&&method==='POST'){const b:any=await body(req);const result=await login(String(b.email||''),String(b.password||''));return result?ok(result):fail('Invalid credentials',422)}
    if(path[0]==='desktop-discovery'&&method==='GET')return ok({api_url:'/api'});
    const auth=await requireUser(req);if('error' in auth)return auth.error;
    const roleRules: Array<[string, string[], string?]> = [
      ['dashboard',['hod','md']],['reports',['hod','md']],['sales',['hod','md','pharmacy_staff']],
      ['drugs',['hod','store_keeper','pharmacy_staff','md','doctor']],['patients',['hod','pharmacy_staff','doctor']],
      ['prescriptions',['hod','doctor','pharmacy_staff']],['inventory',['hod','store_keeper','pharmacy_staff','md']],
      ['stock-counts',['hod','store_keeper','pharmacy_staff']],['suppliers',['hod','store_keeper']],['departments',['hod','store_keeper','pharmacy_staff','md']],
      ['users',['hod']],['settings',['hod']],
    ];
    const rule=roleRules.find(([root])=>root===path[0]);
    if(rule&&!allowed(auth.user,rule[1]))return fail('This action is unauthorized.',403);
    if(path[0]==='sync'&&path[1]==='sales'&&!allowed(auth.user,['hod','pharmacy_staff']))return fail('This action is unauthorized.',403);
    if(path[0]==='sync'&&path[1]==='conflicts'&&!allowed(auth.user,['hod']))return fail('This action is unauthorized.',403);
    if(path[0]==='inventory'&&path[1]==='transfers'&&!allowed(auth.user,['hod','store_keeper']))return fail('This action is unauthorized.',403);
    if(path[0]==='prescriptions'&&method!=='GET'&&!allowed(auth.user,['hod','doctor']))return fail('This action is unauthorized.',403);
    if(method==='GET')return await read(path,req,auth.user);
    return await write(path,req,auth.user);
  } catch(error:any) {
    console.error('Next API error:',error?.message||error);
    if(error?.code==='ER_DUP_ENTRY')return fail('A record with the same unique value already exists.',409);
    if(error?.code==='ER_NO_SUCH_TABLE')return fail('MySQL schema is not ready. Apply the database schema before using the app.',503);
    return fail(process.env.NODE_ENV==='development'?(error?.message||'Request failed.'):'Request failed.',500);
  }
}
export const GET=(req:NextRequest,{params}:{params:{path:string[]}})=>dispatch(req,params);
export const POST=(req:NextRequest,{params}:{params:{path:string[]}})=>dispatch(req,params);
export const PUT=(req:NextRequest,{params}:{params:{path:string[]}})=>dispatch(req,params);
export const PATCH=(req:NextRequest,{params}:{params:{path:string[]}})=>dispatch(req,params);
export const DELETE=(req:NextRequest,{params}:{params:{path:string[]}})=>dispatch(req,params);
