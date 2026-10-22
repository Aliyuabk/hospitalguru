import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
const methods = ['cash', 'bank_transfer', 'pos_terminal'] as const;
type Method = typeof methods[number];

function locationsFor(user: any): number[] {
  return [...new Set([...(user.location_ids || '').split(',').map(Number), Number(user.location_id)]
    .filter((value: number) => Number.isSafeInteger(value) && value > 0))];
}

async function canEdit(user: any) {
  const [rows] = await db.execute(
    `SELECT rp.granted FROM role_permissions rp JOIN roles r ON r.id=rp.role_id
     JOIN permissions p ON p.id=rp.permission_id WHERE r.role_key=? AND p.permission_key='payments.edit' LIMIT 1`,
    [user.role_key],
  );
  return Number((rows as any[])[0]?.granted) === 1;
}

async function canView(user: any) {
  const [rows] = await db.execute(
    `SELECT rp.granted FROM role_permissions rp JOIN roles r ON r.id=rp.role_id
     JOIN permissions p ON p.id=rp.permission_id WHERE r.role_key=? AND p.permission_key='payments.view' LIMIT 1`,
    [user.role_key],
  );
  return Number((rows as any[])[0]?.granted) === 1;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!['cashier', 'pharmacy_supervisor'].includes(user.role_key) || !await canView(user)) return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
  const locationIds = locationsFor(user);
  if (!locationIds.length) return NextResponse.json({ error: 'Assign this account to a pharmacy location.' }, { status: 403 });
  try {
    const marks = locationIds.map(() => '?').join(',');
    const [days] = await db.query(
      `SELECT id,business_date,status,opened_at,closed_at,opening_snapshot,closing_snapshot,notes FROM business_days
       WHERE location_id IN (${marks}) AND business_date=CURRENT_DATE ORDER BY id DESC LIMIT 1`, locationIds,
    );
    const day = (days as any[])[0] || null;
    const [paymentRows] = await db.query(
      `SELECT p.method,COALESCE(SUM(CASE WHEN p.status='verified' THEN p.amount_ngn ELSE 0 END),0) expected_ngn,
       COALESCE(SUM(CASE WHEN p.status IN ('pending','submitted') THEN 1 ELSE 0 END),0) pending_count
       FROM payments p JOIN sales s ON s.id=p.sale_id WHERE s.location_id IN (${marks}) AND DATE(p.created_at)=CURRENT_DATE
       GROUP BY p.method`, locationIds,
    );
    const [recs] = day ? await db.execute(
      'SELECT payment_method,expected_ngn,confirmed_ngn,difference_ngn,explanation,status FROM reconciliations WHERE business_day_id=?', [day.id],
    ) : [[], []] as any;
    const payments = paymentRows as any[];
    const reconciliations = recs as any[];
    const rows = methods.map(method => {
      const payment = payments.find(row => row.method === method);
      const saved = reconciliations.find(row => row.payment_method === method);
      const expected = Number(payment?.expected_ngn || 0);
      return { method, expected_ngn: expected, confirmed_ngn: saved?.confirmed_ngn == null ? '' : Number(saved.confirmed_ngn),
        difference_ngn: saved ? Number(saved.difference_ngn) : null, explanation: saved?.explanation || '', status: saved?.status || 'not_submitted', pending_count: Number(payment?.pending_count || 0) };
    });
    const [summaryRows] = await db.query(
      `SELECT COALESCE(SUM(CASE WHEN s.status='completed' THEN s.total_ngn ELSE 0 END),0) completed_sales_ngn,
       COALESCE(SUM(CASE WHEN s.status='invoiced' THEN s.total_ngn ELSE 0 END),0) outstanding_ngn,
       COALESCE(SUM(CASE WHEN s.status='cancelled' THEN s.total_ngn ELSE 0 END),0) cancelled_ngn,
       COUNT(CASE WHEN s.status='completed' THEN 1 END) completed_count
       FROM sales s WHERE s.location_id IN (${marks}) AND DATE(COALESCE(s.sold_at,s.created_at))=CURRENT_DATE`, locationIds,
    );
    const [refundRows] = await db.query(
      `SELECT COALESCE(SUM(approved_amount_ngn),0) refunds_ngn FROM refund_requests r JOIN sales s ON s.id=r.sale_id
       WHERE s.location_id IN (${marks}) AND r.status='processed' AND DATE(r.processed_at)=CURRENT_DATE`, locationIds,
    );
    const [movementRows] = await db.query(
      `SELECT transaction_type,COALESCE(SUM(quantity_delta),0) quantity FROM inventory_ledger
       WHERE location_id IN (${marks}) AND DATE(created_at)=CURRENT_DATE GROUP BY transaction_type`, locationIds,
    );
    return NextResponse.json({ day, location_id: user.location_id, methods: rows, summary: (summaryRows as any[])[0],
      refunds_ngn: Number((refundRows as any[])[0]?.refunds_ngn || 0), movements: movementRows });
  } catch (error) {
    console.error('Business day data failed:', error);
    return NextResponse.json({ error: 'Unable to load the business day.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!['cashier', 'pharmacy_supervisor'].includes(user.role_key) || !await canEdit(user)) return NextResponse.json({ error: 'You are not authorized to reconcile or close this business day.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const action = String(body?.action || '');
  const locationIds = locationsFor(user);
  if (!locationIds.length) return NextResponse.json({ error: 'Assign this account to a pharmacy location.' }, { status: 403 });
  const locationId = Number(user.location_id || locationIds[0]);
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    if (action === 'open') {
      if (user.role_key !== 'pharmacy_supervisor') throw new Error('Only a pharmacy supervisor may open the business day.');
      const [openingRows] = await conn.execute(`SELECT COUNT(*) batch_count,
        COALESCE(SUM(quantity_on_hand-quantity_reserved-quantity_quarantined),0) usable_units,
        COALESCE(SUM((quantity_on_hand-quantity_reserved-quantity_quarantined)*cost_price_ngn),0) usable_value_ngn
        FROM stock_batches WHERE location_id=? AND status='usable' AND expiry_date>=CURRENT_DATE`, [locationId]);
      const openingSnapshot = JSON.stringify({ ...(openingRows as any[])[0], captured_at: new Date().toISOString() });
      await conn.execute(`INSERT INTO business_days(location_id,business_date,status,opened_by,opened_at,opening_snapshot)
        VALUES(?,CURRENT_DATE,'open',?,UTC_TIMESTAMP(),?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id),opening_snapshot=COALESCE(opening_snapshot,VALUES(opening_snapshot))`, [locationId, user.id, openingSnapshot]);
      const [rows] = await conn.execute('SELECT id,status FROM business_days WHERE location_id=? AND business_date=CURRENT_DATE FOR UPDATE', [locationId]);
      if ((rows as any[])[0]?.status === 'closed') throw new Error('This business day is already closed.');
      await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,outcome) VALUES(?,?,?,?,?,?,?)', [user.id,user.role_key,'opened_business_day','payments','business_day',String((rows as any[])[0]?.id),'success']);
      await conn.commit();
      return NextResponse.json({ ok: true, status: 'open' });
    }

    const [dayRows] = await conn.execute("SELECT id,status FROM business_days WHERE location_id=? AND business_date=CURRENT_DATE FOR UPDATE", [locationId]);
    const day = (dayRows as any[])[0];
    if (!day) throw new Error('Open the business day before submitting its reconciliation.');
    if (day.status !== 'open') throw new Error('This business day is not open.');

    if (action === 'save_reconciliation') {
      const rows = Array.isArray(body?.methods) ? body.methods : [];
      if (rows.length !== methods.length || new Set(rows.map((row: any) => String(row.method))).size !== methods.length || methods.some(method => !rows.some((row: any) => row.method === method))) throw new Error('Submit cash, bank transfer, and POS reconciliation together.');
      const [expectedRows] = await conn.execute(`SELECT p.method,COALESCE(SUM(CASE WHEN p.status='verified' THEN p.amount_ngn ELSE 0 END),0) expected_ngn
        FROM payments p JOIN sales s ON s.id=p.sale_id WHERE s.location_id=? AND DATE(p.created_at)=CURRENT_DATE GROUP BY p.method`, [locationId]);
      const expectedByMethod = new Map((expectedRows as any[]).map(row => [String(row.method), Number(row.expected_ngn)]));
      for (const row of rows) {
        const method = String(row.method) as Method;
        const confirmed = Number(row.confirmed_ngn);
        const expected = expectedByMethod.get(method) || 0;
        const explanation = String(row.explanation || '').trim();
        if (!methods.includes(method) || !Number.isFinite(confirmed) || confirmed < 0 || !Number.isFinite(expected) || expected < 0) throw new Error('Enter valid amounts for every payment method.');
        const difference = Number((confirmed - expected).toFixed(2));
        if (difference !== 0 && !explanation) throw new Error(`Explain the ${method.replace('_',' ')} discrepancy.`);
        const ref = `REC-${day.id}-${method.toUpperCase()}`;
        await conn.execute(`INSERT INTO reconciliations(reconciliation_no,business_day_id,payment_method,expected_ngn,confirmed_ngn,difference_ngn,explanation,status,prepared_by)
          VALUES(?,?,?,?,?,?,?, ?,?) ON DUPLICATE KEY UPDATE expected_ngn=VALUES(expected_ngn),confirmed_ngn=VALUES(confirmed_ngn),difference_ngn=VALUES(difference_ngn),explanation=VALUES(explanation),status=VALUES(status),prepared_by=VALUES(prepared_by),reviewed_by=NULL,reviewed_at=NULL`,
          [ref,day.id,method,expected,confirmed,difference,explanation||null,difference===0?'submitted':'exception',user.id]);
      }
      await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,outcome) VALUES(?,?,?,?,?,?,?)', [user.id,user.role_key,'submitted_reconciliation','payments','business_day',String(day.id),'success']);
      await conn.commit();
      return NextResponse.json({ ok: true });
    }

    if (action === 'close') {
      if (user.role_key !== 'pharmacy_supervisor') throw new Error('Only a pharmacy supervisor may close the business day.');
      const [pending] = await conn.execute(`SELECT COUNT(*) count FROM payments p JOIN sales s ON s.id=p.sale_id
        WHERE s.location_id=? AND DATE(p.created_at)=CURRENT_DATE AND p.status IN ('pending','submitted')`, [locationId]);
      if (Number((pending as any[])[0]?.count) > 0) throw new Error('Resolve all pending payment checks before closing the day.');
      const [recs] = await conn.execute('SELECT payment_method,expected_ngn,confirmed_ngn,difference_ngn,explanation,status FROM reconciliations WHERE business_day_id=? FOR UPDATE', [day.id]);
      const reconciliationRows = recs as any[];
      if (methods.some(method => !reconciliationRows.some(row => row.payment_method === method && ['submitted','exception'].includes(row.status)))) throw new Error('Submit reconciliation for cash, bank transfer, and POS before closing.');
      const [summary] = await conn.execute(`SELECT COALESCE(SUM(CASE WHEN status='completed' THEN total_ngn ELSE 0 END),0) sales_ngn,
        COALESCE(SUM(CASE WHEN status='invoiced' THEN total_ngn ELSE 0 END),0) outstanding_ngn,
        COALESCE(SUM(CASE WHEN status='cancelled' THEN total_ngn ELSE 0 END),0) cancelled_ngn
        FROM sales WHERE location_id=? AND DATE(COALESCE(sold_at,created_at))=CURRENT_DATE`, [locationId]);
      const [refunds] = await conn.execute(`SELECT COALESCE(SUM(r.approved_amount_ngn),0) refunds_ngn FROM refund_requests r JOIN sales s ON s.id=r.sale_id
        WHERE s.location_id=? AND r.status='processed' AND DATE(r.processed_at)=CURRENT_DATE`, [locationId]);
      const [movements] = await conn.execute(`SELECT transaction_type,COALESCE(SUM(quantity_delta),0) quantity FROM inventory_ledger
        WHERE location_id=? AND DATE(created_at)=CURRENT_DATE GROUP BY transaction_type`, [locationId]);
      const [closingInventory] = await conn.execute(`SELECT COUNT(*) batch_count,
        COALESCE(SUM(quantity_on_hand-quantity_reserved-quantity_quarantined),0) usable_units,
        COALESCE(SUM((quantity_on_hand-quantity_reserved-quantity_quarantined)*cost_price_ngn),0) usable_value_ngn
        FROM stock_batches WHERE location_id=? AND status='usable' AND expiry_date>=CURRENT_DATE`, [locationId]);
      const snapshot = { business_date: new Date().toISOString().slice(0,10), opening_inventory: day.opening_snapshot ? JSON.parse(String(day.opening_snapshot)) : null, closing_inventory: (closingInventory as any[])[0], sales: (summary as any[])[0], refunds: (refunds as any[])[0], reconciliations: reconciliationRows, inventory_movements: movements, closed_by: user.id };
      await conn.execute("UPDATE business_days SET status='closed',closed_by=?,closed_at=UTC_TIMESTAMP(),closing_snapshot=?,notes=CONCAT(COALESCE(notes,''),?) WHERE id=? AND status='open'", [user.id,JSON.stringify(snapshot),body?.notes?`\n${String(body.notes).slice(0,1000)}`:'',day.id]);
      await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,outcome,after_data) VALUES(?,?,?,?,?,?,?,?)', [user.id,user.role_key,'closed_business_day','payments','business_day',String(day.id),'success',JSON.stringify(snapshot)]);
      await conn.commit();
      return NextResponse.json({ ok: true, status: 'closed' });
    }
    throw new Error('Unsupported business day action.');
  } catch (error) {
    await conn.rollback();
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update business day.' }, { status: 422 });
  } finally {
    conn.release();
  }
}
