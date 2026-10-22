import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

async function can(key: string) {
  const [rows] = await db.execute('SELECT rp.granted FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE r.role_key=? AND p.permission_key=? AND r.is_active=1 LIMIT 1', [(await getSessionUser())?.role_key, key]);
  return Number((rows as any[])[0]?.granted) === 1;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (user.role_key !== 'procurement_officer' || !await can('procurement.create')) return NextResponse.json({ error: 'Procurement access is required.' }, { status: 403 });
  const [[suppliers], [drugs], [locations]]: any = await Promise.all([
    db.execute('SELECT id,code,name FROM suppliers WHERE is_active=1 ORDER BY name'),
    db.execute('SELECT id,sku,generic_name,strength,base_unit FROM drugs WHERE is_active=1 ORDER BY generic_name'),
    db.execute("SELECT id,name FROM locations WHERE is_active=1 AND type='central_store' ORDER BY name"),
  ]);
  return NextResponse.json({ suppliers, drugs, locations });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (user.role_key !== 'procurement_officer' || !await can('procurement.create')) return NextResponse.json({ error: 'Procurement create permission is required.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const supplierId = Number(body?.supplier_id), locationId = Number(body?.destination_location_id);
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!Number.isSafeInteger(supplierId) || !Number.isSafeInteger(locationId) || !items.length) return NextResponse.json({ error: 'Choose a supplier, destination and at least one medicine line.' }, { status: 422 });
  const lines = items.map((x: any) => ({ drug: Number(x.drug_id), qty: Number(x.quantity_ordered), cost: Number(x.unit_cost_ngn), notes: String(x.notes || '').trim() })).filter((x: any) => Number.isSafeInteger(x.drug) && x.drug > 0 && Number.isFinite(x.qty) && x.qty > 0 && Number.isFinite(x.cost) && x.cost >= 0);
  if (lines.length !== items.length) return NextResponse.json({ error: 'Each line needs a valid medicine, positive quantity and non-negative cost.' }, { status: 422 });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [valid] = await conn.execute("SELECT (SELECT COUNT(*) FROM suppliers WHERE id=? AND is_active=1) supplier_ok,(SELECT COUNT(*) FROM locations WHERE id=? AND is_active=1 AND type='central_store') location_ok", [supplierId, locationId]);
    const check = (valid as any[])[0];
    if (!Number(check.supplier_ok) || !Number(check.location_ok)) throw new Error('Supplier or DRF STORE destination is unavailable.');
    for (const line of lines) {
      const [drug] = await conn.execute('SELECT id FROM drugs WHERE id=? AND is_active=1', [line.drug]);
      if (!(drug as any[]).length) throw new Error('One or more selected medicines are no longer active.');
    }
    const total = lines.reduce((sum: number, x: any) => sum + x.qty * x.cost, 0);
    const poNo = `PO-${Date.now()}-${user.id}`;
    const [result] = await conn.execute("INSERT INTO purchase_orders(po_no,supplier_id,destination_location_id,status,order_date,expected_date,total_ngn,notes,created_by) VALUES(?,?,?,'pending_approval',CURDATE(),?,?,?,?)", [poNo, supplierId, locationId, body.expected_date || null, total, String(body.notes || '').trim() || null, user.id]);
    const id = Number((result as any).insertId);
    for (const line of lines) await conn.execute('INSERT INTO purchase_order_items(purchase_order_id,drug_id,quantity_ordered,unit_cost_ngn,line_total_ngn,notes) VALUES(?,?,?,?,?,?)', [id, line.drug, line.qty, line.cost, line.qty * line.cost, line.notes || null]);
    await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,reference_no,outcome) VALUES(?,?,?,?,?,?,?,?)', [user.id, user.role_key, 'created_purchase_order', 'procurement', 'purchase_order', String(id), poNo, 'success']);
    await conn.commit();
    return NextResponse.json({ ok: true, id, po_no: poNo }, { status: 201 });
  } catch (error: any) {
    await conn.rollback();
    return NextResponse.json({ error: error.message || 'Unable to save purchase order.' }, { status: 422 });
  } finally { conn.release(); }
}
