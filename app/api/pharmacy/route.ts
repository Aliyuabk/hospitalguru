import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

async function can(module:string,action:string){
  const user=await getSessionUser();
  if(!user)return false;
  const [rows]=await db.execute('SELECT rp.granted FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE r.role_key=? AND r.is_active=1 AND p.permission_key=? LIMIT 1',[user.role_key,`${module}.${action}`]);
  return Number((rows as any[])[0]?.granted)===1;
}
function locations(user:any){return [...new Set([...(user.location_ids||'').split(',').map(Number),Number(user.location_id)].filter(id=>Number.isSafeInteger(id)&&id>0))]}
function quantity(value:any){const n=Number(value);return Number.isFinite(n)&&n>0&&n<=100000?n:null}
async function nextReference(conn:any,key:string,prefix:string){
  await conn.execute('INSERT IGNORE INTO numbering_sequences(sequence_key,prefix,next_number,padding) VALUES(?,?,1,6)',[key,prefix]);
  const [rows]=await conn.execute('SELECT prefix,next_number,padding FROM numbering_sequences WHERE sequence_key=? FOR UPDATE',[key]);
  const row=(rows as any[])[0];const number=Number(row.next_number);
  await conn.execute('UPDATE numbering_sequences SET next_number=next_number+1 WHERE sequence_key=?',[key]);
  return `${row.prefix}${String(number).padStart(Number(row.padding)||6,'0')}`;
}
async function pharmacyLocation(user:any){
  const ids=locations(user);if(!ids.length)return null;
  const marks=ids.map(()=>'?').join(',');
  const [rows]=await db.query(`SELECT id,name FROM locations WHERE id IN (${marks}) AND type='pharmacy' AND is_active=1 ORDER BY (id=?) DESC,id LIMIT 1`,[...ids,Number(user.location_id)||0]);
  return (rows as any[])[0]||null;
}
async function lockOpenBusinessDay(conn:any,locationId:number){
  const [rows]=await conn.execute("SELECT id,status FROM business_days WHERE location_id=? AND business_date=CURRENT_DATE FOR UPDATE",[locationId]);
  if(!(rows as any[]).length||((rows as any[])[0].status!=='open'&&(rows as any[])[0].status!=='reopened'))throw new Error('The pharmacy business day is not open. Ask the supervisor to open today’s shift.');
}

export async function GET(request:Request){
  try{
    const user=await getSessionUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
    if(user.role_key!=='pharmacy_dispenser')return NextResponse.json({error:'This endpoint is for Pharmacy Dispenser workflows.'},{status:403});
    const location=await pharmacyLocation(user);if(!location)return NextResponse.json({error:'Assign this account to an active pharmacy location.'},{status:403});
    const params=new URL(request.url).searchParams;const resource=params.get('resource')||'options';
    if(resource==='options'){
      const canInventory=await can('inventory','view');const canCatalogue=await can('drug_catalogue','view');
      const [batches]=canInventory&&canCatalogue?await db.execute(`SELECT b.id batch_id,b.drug_id,b.batch_no,b.expiry_date,b.quantity_on_hand,b.quantity_reserved,b.quantity_quarantined,b.cost_price_ngn,b.selling_price_ngn,d.sku,d.barcode,d.generic_name,d.brand_name,d.category,d.strength,d.dosage_form,d.base_unit,d.prescription_required FROM stock_batches b JOIN drugs d ON d.id=b.drug_id WHERE b.location_id=? AND b.status='usable' AND b.expiry_date>=CURDATE() AND b.quantity_on_hand>b.quantity_reserved+b.quantity_quarantined AND d.is_active=1 ORDER BY d.generic_name,b.expiry_date`,[location.id]):[[]];
      const [returnBatches]=canInventory&&canCatalogue?await db.execute(`SELECT b.id batch_id,b.drug_id,b.batch_no,b.expiry_date,b.quantity_on_hand,b.quantity_reserved,b.quantity_quarantined,b.cost_price_ngn,b.selling_price_ngn,d.sku,d.generic_name,d.strength,d.dosage_form FROM stock_batches b JOIN drugs d ON d.id=b.drug_id WHERE b.location_id=? AND b.status IN ('usable','expired') AND b.quantity_on_hand>b.quantity_reserved+b.quantity_quarantined AND d.is_active=1 ORDER BY b.expiry_date,d.generic_name`,[location.id]):[[]];
      const [drugs]=canCatalogue?await db.execute('SELECT id,sku,barcode,generic_name,brand_name,category,strength,dosage_form,base_unit FROM drugs WHERE is_active=1 ORDER BY generic_name LIMIT 2000'):[[]];
      return NextResponse.json({data:{location,batches,returnBatches,drugs}});
    }
    if(resource==='patients'){
      if(!await can('sales','create'))return NextResponse.json({error:'You cannot search patient records.'},{status:403});
      const term=String(params.get('q')||'').trim();if(term.length<2)return NextResponse.json({data:[]});
      const like=`%${term}%`;const [rows]=await db.execute('SELECT id,folder_no,full_name,phone,nhis_number FROM patients WHERE is_active=1 AND (folder_no LIKE ? OR full_name LIKE ? OR phone LIKE ?) ORDER BY full_name LIMIT 20',[like,like,like]);
      return NextResponse.json({data:rows});
    }
    if(resource==='prescriptions'){
      if(!await can('sales','create'))return NextResponse.json({error:'You cannot view prescriptions for dispensing.'},{status:403});
      const patientId=Number(params.get('patient_id'));if(!Number.isSafeInteger(patientId)||patientId<1)return NextResponse.json({error:'Select a valid patient.'},{status:400});
      const [rows]=await db.execute(`SELECT p.id,p.prescription_no,p.patient_id,p.status,p.notes,p.prescribed_at,p.expires_at,u.name prescribed_by,pi.id item_id,pi.drug_id,pi.quantity,pi.dispensed_quantity,pi.dosage,pi.duration,pi.instructions,d.generic_name,d.strength,d.dosage_form FROM prescriptions p JOIN patients pt ON pt.id=p.patient_id JOIN users u ON u.id=p.prescribed_by JOIN prescription_items pi ON pi.prescription_id=p.id JOIN drugs d ON d.id=pi.drug_id WHERE p.patient_id=? AND pt.is_active=1 AND p.status IN ('pending','partially_dispensed') AND (p.expires_at IS NULL OR p.expires_at>=CURRENT_TIMESTAMP) AND pi.quantity>pi.dispensed_quantity ORDER BY p.prescribed_at DESC,p.id,pi.id`,[patientId]);
      const grouped=new Map<number,any>();for(const row of rows as any[]){if(!grouped.has(Number(row.id)))grouped.set(Number(row.id),{id:Number(row.id),prescription_no:row.prescription_no,patient_id:Number(row.patient_id),status:row.status,notes:row.notes,prescribed_at:row.prescribed_at,expires_at:row.expires_at,prescribed_by:row.prescribed_by,items:[]});grouped.get(Number(row.id)).items.push({id:Number(row.item_id),drug_id:Number(row.drug_id),quantity:Number(row.quantity),dispensed_quantity:Number(row.dispensed_quantity),remaining_quantity:Number(row.quantity)-Number(row.dispensed_quantity),dosage:row.dosage,duration:row.duration,instructions:row.instructions,generic_name:row.generic_name,strength:row.strength,dosage_form:row.dosage_form})}
      return NextResponse.json({data:[...grouped.values()]});
    }
    if(resource==='sale'){
      if(!await can('sales','view'))return NextResponse.json({error:'You cannot view sales.'},{status:403});
      const id=Number(params.get('id'));if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:'A valid invoice is required.'},{status:400});
      const [sales]=await db.execute('SELECT s.id,s.invoice_no,s.sale_type,s.client_name,s.subtotal_ngn,s.discount_ngn,s.tax_ngn,s.total_ngn,s.payment_status,s.status,s.sold_at,s.created_at,l.name location_name,p.folder_no patient_folder,p.full_name patient_name FROM sales s JOIN locations l ON l.id=s.location_id LEFT JOIN patients p ON p.id=s.patient_id WHERE s.id=? AND s.location_id=? LIMIT 1',[id,location.id]);
      if(!(sales as any[]).length)return NextResponse.json({error:'Invoice not found for this pharmacy.'},{status:404});
      const [items]=await db.execute('SELECT i.drug_id,i.batch_no,i.sale_quantity,i.sale_unit,i.unit_price_ngn,i.line_total_ngn,d.generic_name,d.strength FROM sale_items i JOIN drugs d ON d.id=i.drug_id WHERE i.sale_id=? ORDER BY i.id',[id]);
      const [payments]=await db.execute('SELECT payment_no,method,amount_ngn,reference,status,created_at FROM payments WHERE sale_id=? ORDER BY id',[id]);
      return NextResponse.json({data:{...(sales as any[])[0],items,payments}});
    }
    return NextResponse.json({error:'Unknown Pharmacy Dispenser resource.'},{status:404});
  }catch(error){console.error('Pharmacy lookup error:',error);return NextResponse.json({error:'Could not load pharmacy records.'},{status:503})}
}

export async function POST(request:Request){
  try{
    const user=await getSessionUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
    if(user.role_key!=='pharmacy_dispenser')return NextResponse.json({error:'This endpoint is for Pharmacy Dispenser workflows.'},{status:403});
    const body=await request.json();const action=String(body.action||'');const location=await pharmacyLocation(user);
    if(!location)return NextResponse.json({error:'Assign this account to an active pharmacy location.'},{status:403});

    if(action==='create_sale'){
      if(!await can('sales','create'))return NextResponse.json({error:'Your role needs Sales → Create permission.'},{status:403});
      const saleType=String(body.sale_type||'outpatient');const clientName=String(body.client_name||'').trim()||null;const patientId=body.patient_id?Number(body.patient_id):null;const prescriptionId=body.prescription_id?Number(body.prescription_id):null;const lines=Array.isArray(body.items)?body.items:[];
      if(!['outpatient','inpatient'].includes(saleType)||!lines.length||lines.length>50)return NextResponse.json({error:'Choose a sale type and add 1–50 product lines.'},{status:422});
      if(saleType==='inpatient'&&(!patientId||!Number.isSafeInteger(patientId)))return NextResponse.json({error:'Select a verified patient record for inpatient sales.'},{status:422});
      if(saleType==='outpatient'&&patientId)return NextResponse.json({error:'Outpatient sales do not require a patient record.'},{status:422});
      if(prescriptionId&&(!Number.isSafeInteger(prescriptionId)||saleType!=='inpatient'||!patientId))return NextResponse.json({error:'A valid prescription requires its verified inpatient patient.'},{status:422});
      const conn=await db.getConnection();let id=0;let invoice='';
      try{
        await conn.beginTransaction();
        await lockOpenBusinessDay(conn,location.id);
        if(patientId){const [patients]=await conn.execute('SELECT id FROM patients WHERE id=? AND is_active=1 FOR UPDATE',[patientId]);if(!(patients as any[]).length)throw new Error('The selected patient record is unavailable.');}
        let prescriptionRemaining=new Map<number,number>();
        if(prescriptionId){const [prescriptions]=await conn.execute("SELECT id,patient_id,status,expires_at FROM prescriptions WHERE id=? FOR UPDATE",[prescriptionId]);const prescription=(prescriptions as any[])[0];if(!prescription||Number(prescription.patient_id)!==patientId||!['pending','partially_dispensed'].includes(prescription.status)||(prescription.expires_at&&new Date(prescription.expires_at)<new Date()))throw new Error('This prescription is unavailable, expired, or belongs to another patient.');const [prescriptionItems]=await conn.execute('SELECT id,drug_id,quantity,dispensed_quantity FROM prescription_items WHERE prescription_id=? ORDER BY id FOR UPDATE',[prescriptionId]);const [reservedRows]=await conn.execute("SELECT si.drug_id,SUM(si.quantity_base) reserved_quantity FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE s.prescription_id=? AND s.status IN ('draft','invoiced') GROUP BY si.drug_id",[prescriptionId]);const reservedByDrug=new Map<number,number>((reservedRows as any[]).map(row=>[Number(row.drug_id),Number(row.reserved_quantity)]));for(const item of prescriptionItems as any[]){const drugId=Number(item.drug_id);prescriptionRemaining.set(drugId,(prescriptionRemaining.get(drugId)||0)+Math.max(0,Number(item.quantity)-Number(item.dispensed_quantity)))}for(const [drugId,reserved] of reservedByDrug)prescriptionRemaining.set(drugId,Math.max(0,(prescriptionRemaining.get(drugId)||0)-reserved));}
        const prepared:any[]=[];const used=new Map<number,number>();const prescribedInCart=new Map<number,number>();let subtotal=0;
        for(let index=0;index<lines.length;index++){
          const batchId=Number(lines[index].batch_id);const qty=quantity(lines[index].quantity);if(!Number.isSafeInteger(batchId)||!qty)throw new Error(`Select an eligible batch and valid quantity on line ${index+1}.`);
          const [batchRows]=await conn.execute(`SELECT b.id,b.drug_id,b.batch_no,b.expiry_date,b.quantity_on_hand,b.quantity_reserved,b.quantity_quarantined,b.cost_price_ngn,b.selling_price_ngn,d.base_unit,d.generic_name,d.prescription_required FROM stock_batches b JOIN drugs d ON d.id=b.drug_id WHERE b.id=? AND b.location_id=? AND b.status='usable' AND b.expiry_date>=CURDATE() AND d.is_active=1 FOR UPDATE`,[batchId,location.id]);
          const batch=(batchRows as any[])[0];if(!batch)throw new Error(`Batch on line ${index+1} is not eligible at this pharmacy.`);
          if(batch.prescription_required&&!prescriptionId)throw new Error(`${batch.generic_name} requires a valid prescription before it can be dispensed.`);
          if(prescriptionId){const drugId=Number(batch.drug_id);if(!prescriptionRemaining.has(drugId))throw new Error(`${batch.generic_name} is not on the selected prescription.`);const next=(prescribedInCart.get(drugId)||0)+qty;if(next>Number(prescriptionRemaining.get(drugId)))throw new Error(`Dispensed quantity for ${batch.generic_name} exceeds the prescription balance.`);prescribedInCart.set(drugId,next)}
          const inCart=Number(used.get(batchId)||0);const available=Number(batch.quantity_on_hand)-Number(batch.quantity_reserved)-Number(batch.quantity_quarantined);if(inCart+qty>available)throw new Error(`Quantity exceeds available stock for batch ${batch.batch_no}.`);used.set(batchId,inCart+qty);
          const unitPrice=Number(batch.selling_price_ngn);if(!Number.isFinite(unitPrice)||unitPrice<0)throw new Error('A valid selling price is not configured for one of the selected batches.');
          const lineTotal=Math.round((qty*unitPrice+Number.EPSILON)*100)/100;subtotal+=lineTotal;prepared.push({batch,qty,unitPrice,lineTotal});
        }
        invoice=await nextReference(conn,'invoice','INV-');const clientSaleId=String(body.client_sale_id||'').trim()||null;
        const [created]=await conn.execute("INSERT INTO sales(invoice_no,client_sale_id,prescription_id,patient_id,location_id,dispenser_user_id,sale_type,client_name,subtotal_ngn,total_ngn,status) VALUES(?,?,?,?,?,?,?,?,?,?,'draft')",[invoice,clientSaleId,prescriptionId,patientId,location.id,user.id,saleType,clientName,subtotal,subtotal]);id=Number((created as any).insertId);
        for(const line of prepared)await conn.execute('INSERT INTO sale_items(sale_id,drug_id,stock_batch_id,batch_no,quantity_base,sale_quantity,sale_unit,unit_price_ngn,unit_cost_ngn,line_total_ngn) VALUES(?,?,?,?,?,?,?,?,?,?)',[id,Number(line.batch.drug_id),Number(line.batch.id),String(line.batch.batch_no),line.qty,line.qty,String(line.batch.base_unit||'unit'),line.unitPrice,Number(line.batch.cost_price_ngn),line.lineTotal]);
        await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,reference_no,outcome,after_data) VALUES(?,?,?,?,?,?,?,?,?)',[user.id,user.role_key,'created_sale_draft','sales','sale',String(id),invoice,'success',JSON.stringify({sale_type:saleType,item_count:prepared.length,total_ngn:subtotal})]);
        await conn.commit();
      }catch(error){await conn.rollback();throw error}finally{conn.release()}
      return NextResponse.json({ok:true,id,invoice_no:invoice},{status:201});
    }

    if(action==='generate_invoice'){
      if(!await can('sales','create'))return NextResponse.json({error:'Your role needs Sales → Create permission to generate invoices.'},{status:403});
      const id=Number(body.id);if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:'Select a valid sale draft.'},{status:400});
      const conn=await db.getConnection();try{await conn.beginTransaction();await lockOpenBusinessDay(conn,location.id);const [rows]=await conn.execute("SELECT id,invoice_no,status FROM sales WHERE id=? AND location_id=? AND dispenser_user_id=? AND status IN ('draft','invoiced') FOR UPDATE",[id,location.id,user.id]);const sale=(rows as any[])[0];if(!sale)throw new Error('This sale is not an editable draft owned by your account.');if(sale.status==='draft'){const [items]=await conn.execute('SELECT stock_batch_id,SUM(quantity_base) quantity FROM sale_items WHERE sale_id=? GROUP BY stock_batch_id ORDER BY stock_batch_id',[id]);for(const item of items as any[]){if(!item.stock_batch_id)throw new Error('An invoice line is missing its stock batch.');const [result]=await conn.execute("UPDATE stock_batches SET quantity_reserved=quantity_reserved+? WHERE id=? AND location_id=? AND status='usable' AND expiry_date>=CURDATE() AND quantity_on_hand-quantity_reserved-quantity_quarantined>=?",[Number(item.quantity),Number(item.stock_batch_id),location.id,Number(item.quantity)]);if(!(result as any).affectedRows)throw new Error('Available batch stock changed. Refresh the sale and try again.');}await conn.execute("UPDATE sales SET status='invoiced' WHERE id=? AND status='draft'",[id]);await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,reference_no,outcome,after_data) VALUES(?,?,?,?,?,?,?,?,?)',[user.id,user.role_key,'generated_invoice','sales','sale',String(id),sale.invoice_no,'success',JSON.stringify({inventory:'reserved',stock_deducted:false})]);}await conn.commit();return NextResponse.json({ok:true,invoice_no:sale.invoice_no})}catch(error){await conn.rollback();throw error}finally{conn.release()}
    }

    if(action==='cancel_invoice'){
      if(!await can('sales','create'))return NextResponse.json({error:'Your role needs Sales → Create permission to cancel an invoice.'},{status:403});
      const id=Number(body.id);if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:'Select a valid invoice.'},{status:400});const conn=await db.getConnection();
      try{await conn.beginTransaction();await lockOpenBusinessDay(conn,location.id);const [rows]=await conn.execute("SELECT id,invoice_no,status FROM sales WHERE id=? AND location_id=? AND dispenser_user_id=? FOR UPDATE",[id,location.id,user.id]);const sale=(rows as any[])[0];if(!sale||!['draft','invoiced'].includes(sale.status))throw new Error('Only your draft or unpaid invoice can be cancelled.');const [payments]=await conn.execute("SELECT id FROM payments WHERE sale_id=? AND status IN ('pending','submitted','verified') LIMIT 1 FOR UPDATE",[id]);if((payments as any[]).length)throw new Error('This invoice has a payment attempt. Ask the cashier to resolve it before cancellation.');if(sale.status==='invoiced'){const [items]=await conn.execute('SELECT stock_batch_id,SUM(quantity_base) quantity FROM sale_items WHERE sale_id=? GROUP BY stock_batch_id',[id]);for(const item of items as any[])if(item.stock_batch_id)await conn.execute('UPDATE stock_batches SET quantity_reserved=GREATEST(0,quantity_reserved-?) WHERE id=? AND location_id=?',[Number(item.quantity),Number(item.stock_batch_id),location.id]);}await conn.execute("UPDATE sales SET status='cancelled' WHERE id=?",[id]);await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,reference_no,outcome) VALUES(?,?,?,?,?,?,?,?)',[user.id,user.role_key,'cancelled_invoice','sales','sale',String(id),sale.invoice_no,'success']);await conn.commit();return NextResponse.json({ok:true})}catch(error){await conn.rollback();throw error}finally{conn.release()}
    }

    if(action==='submit_payment'){
      if(!await can('payments','create'))return NextResponse.json({error:'Your role needs Payments → Create permission to submit payments.'},{status:403});
      const saleId=Number(body.sale_id);const method=String(body.method||'');const reference=String(body.reference||'').trim()||null;const amount=Number(body.amount_ngn);const tendered=body.amount_tendered_ngn===undefined||body.amount_tendered_ngn===''?null:Number(body.amount_tendered_ngn);
      if(!Number.isSafeInteger(saleId)||saleId<1||!['cash','bank_transfer','pos_terminal'].includes(method)||!Number.isFinite(amount)||amount<=0)return NextResponse.json({error:'Provide an invoice, supported payment method, and positive amount.'},{status:422});
      if(method!=='cash'&&!reference)return NextResponse.json({error:'Enter the transfer or POS transaction reference.'},{status:422});
      const conn=await db.getConnection();let paymentNo='';
      try{await conn.beginTransaction();await lockOpenBusinessDay(conn,location.id);const [sales]=await conn.execute("SELECT id,invoice_no,total_ngn,status FROM sales WHERE id=? AND location_id=? FOR UPDATE",[saleId,location.id]);const sale=(sales as any[])[0];if(!sale||sale.status!=='invoiced')throw new Error('Only an issued invoice can receive payment.');if(Math.abs(Number(sale.total_ngn)-amount)>0.01)throw new Error('Payment amount must match the invoice total.');const [existing]=await conn.execute("SELECT payment_no,status FROM payments WHERE sale_id=? AND status IN ('pending','submitted','verified') ORDER BY id DESC LIMIT 1 FOR UPDATE",[saleId]);if((existing as any[]).length){await conn.commit();return NextResponse.json({ok:true,payment_no:(existing as any[])[0].payment_no,status:(existing as any[])[0].status,reused:true});}if(method==='cash'&&(!Number.isFinite(Number(tendered))||Number(tendered)<amount))throw new Error('Cash tendered must cover the amount due.');paymentNo=await nextReference(conn,'payment','PAY-');await conn.execute("INSERT INTO payments(payment_no,sale_id,method,amount_ngn,amount_tendered_ngn,reference,status,received_by) VALUES(?,?,?,?,?,?,?,?)",[paymentNo,saleId,method,amount,tendered,reference,method==='cash'?'pending':'submitted',user.id]);await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,reference_no,outcome,after_data) VALUES(?,?,?,?,?,?,?,?,?)',[user.id,user.role_key,'submitted_payment','payments','sale',String(saleId),paymentNo,'success',JSON.stringify({method,amount_ngn:amount})]);await conn.commit();}catch(error){await conn.rollback();throw error}finally{conn.release()}
      return NextResponse.json({ok:true,payment_no:paymentNo,status:method==='cash'?'pending':'submitted'},{status:201});
    }

    if(action==='create_stock_request'){
      if(!await can('stock_requests','create'))return NextResponse.json({error:'Your role needs Stock Requests → Create permission.'},{status:403});
      const lines=Array.isArray(body.items)?body.items:[];const priority=String(body.priority||'routine');const reason=String(body.reason||'').trim();if(!lines.length||lines.length>100||!['routine','urgent','critical'].includes(priority))return NextResponse.json({error:'Choose a priority and add 1–100 requested products.'},{status:422});
      const [stores]=await db.execute("SELECT id FROM locations WHERE code='DRF-STORE' AND type='central_store' AND is_active=1 LIMIT 1");if(!(stores as any[]).length)return NextResponse.json({error:'The DRF STORE location is not configured.'},{status:503});const sourceId=Number((stores as any[])[0].id);
      const conn=await db.getConnection();let id=0;let reference='';try{await conn.beginTransaction();reference=await nextReference(conn,'stock_request','REQ-');const [created]=await conn.execute("INSERT INTO stock_requests(request_no,source_location_id,requesting_location_id,priority,status,reason,requested_by) VALUES(?,?,?,?,'pending',?,?)",[reference,sourceId,location.id,priority,reason||null,user.id]);id=Number((created as any).insertId);for(let i=0;i<lines.length;i++){const drugId=Number(lines[i].drug_id),qty=quantity(lines[i].quantity_requested);if(!Number.isSafeInteger(drugId)||drugId<1||!qty)throw new Error(`Choose a medicine and valid request quantity on line ${i+1}.`);const [drugs]=await conn.execute('SELECT id FROM drugs WHERE id=? AND is_active=1',[drugId]);if(!(drugs as any[]).length)throw new Error(`Medicine on line ${i+1} is unavailable.`);await conn.execute('INSERT INTO stock_request_items(stock_request_id,drug_id,quantity_requested,notes) VALUES(?,?,?,?)',[id,drugId,qty,String(lines[i].notes||'').trim()||null]);}await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,reference_no,outcome) VALUES(?,?,?,?,?,?,?,?)',[user.id,user.role_key,'created_stock_request','stock_requests','stock_request',String(id),reference,'success']);await conn.commit()}catch(error){await conn.rollback();throw error}finally{conn.release()}
      return NextResponse.json({ok:true,id,request_no:reference},{status:201});
    }

    if(action==='create_return'){
      if(!await can('returns','create'))return NextResponse.json({error:'Your role needs Returns → Create permission.'},{status:403});
      const lines=Array.isArray(body.items)?body.items:[];const reason=String(body.reason||'').trim();if(!reason||!lines.length||lines.length>100)return NextResponse.json({error:'Add a return reason and at least one stock batch.'},{status:422});
      const [stores]=await db.execute("SELECT id FROM locations WHERE code='DRF-STORE' AND type='central_store' AND is_active=1 LIMIT 1");if(!(stores as any[]).length)return NextResponse.json({error:'The DRF STORE location is not configured.'},{status:503});const destinationId=Number((stores as any[])[0].id);
      const conn=await db.getConnection();let id=0;let reference='';try{await conn.beginTransaction();reference=await nextReference(conn,'stock_return','RET-');const [created]=await conn.execute("INSERT INTO stock_returns(return_no,source_location_id,destination_location_id,status,reason,disposition,requested_by,submitted_at) VALUES(?,?,?,'pending_approval',?,'pending',?,UTC_TIMESTAMP())",[reference,location.id,destinationId,reason,user.id]);id=Number((created as any).insertId);const used=new Map<number,number>();for(let i=0;i<lines.length;i++){const batchId=Number(lines[i].batch_id),qty=quantity(lines[i].quantity);if(!Number.isSafeInteger(batchId)||batchId<1||!qty)throw new Error(`Choose an eligible batch and valid return quantity on line ${i+1}.`);const [batchRows]=await conn.execute("SELECT b.id,b.drug_id,b.batch_no,b.expiry_date,b.quantity_on_hand,b.quantity_reserved,b.quantity_quarantined FROM stock_batches b WHERE b.id=? AND b.location_id=? AND b.status IN ('usable','expired') FOR UPDATE",[batchId,location.id]);const batch=(batchRows as any[])[0];const previouslyUsed=Number(used.get(batchId)||0);if(!batch||previouslyUsed+qty>Number(batch.quantity_on_hand)-Number(batch.quantity_reserved)-Number(batch.quantity_quarantined))throw new Error(`Return quantity on line ${i+1} exceeds eligible pharmacy stock.`);used.set(batchId,previouslyUsed+qty);await conn.execute('INSERT INTO stock_return_items(stock_return_id,drug_id,stock_batch_id,batch_no,expiry_date,quantity,condition_on_return,inspection_note) VALUES(?,?,?,?,?,?,?,?)',[id,Number(batch.drug_id),batchId,String(batch.batch_no),batch.expiry_date,qty,String(lines[i].condition||'unknown'),String(lines[i].notes||'').trim()||null]);await conn.execute('UPDATE stock_batches SET quantity_reserved=quantity_reserved+? WHERE id=?',[qty,batchId]);}await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,reference_no,outcome) VALUES(?,?,?,?,?,?,?,?)',[user.id,user.role_key,'created_return_request','returns','stock_return',String(id),reference,'success']);await conn.commit()}catch(error){await conn.rollback();throw error}finally{conn.release()}
      return NextResponse.json({ok:true,id,return_no:reference},{status:201});
    }
    return NextResponse.json({error:'Unsupported Pharmacy Dispenser action.'},{status:404});
  }catch(error:any){console.error('Pharmacy action error:',error);if(error?.code==='ER_DUP_ENTRY')return NextResponse.json({error:'A duplicate transaction reference was detected; nothing was saved.'},{status:409});return NextResponse.json({error:error instanceof Error?error.message:'Unable to save pharmacy transaction.'},{status:422})}
}
