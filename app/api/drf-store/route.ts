import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

async function can(role:string,module:string,action:string){
  const [rows]=await db.execute('SELECT rp.granted FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE r.role_key=? AND r.is_active=1 AND p.permission_key=? LIMIT 1',[role,`${module}.${action}`]);
  return Number((rows as any[])[0]?.granted)===1;
}
function assignedLocations(user:any){return [...new Set([...(user.location_ids||'').split(',').map(Number),Number(user.location_id)].filter(id=>Number.isSafeInteger(id)&&id>0))]}
function validQty(value:any){const n=Number(value);return Number.isFinite(n)&&n>0&&n<=1000000?n:null}
async function nextReference(conn:any,key:string,prefix:string){
  await conn.execute('INSERT IGNORE INTO numbering_sequences(sequence_key,prefix,next_number,padding) VALUES(?,?,1,6)',[key,prefix]);
  const [rows]=await conn.execute('SELECT prefix,next_number,padding FROM numbering_sequences WHERE sequence_key=? FOR UPDATE',[key]);
  const row=(rows as any[])[0];const next=Number(row.next_number);
  await conn.execute('UPDATE numbering_sequences SET next_number=next_number+1 WHERE sequence_key=?',[key]);
  return `${row.prefix}${String(next).padStart(Number(row.padding)||6,'0')}`;
}

export async function GET(request:Request){
  try{
    const user=await getSessionUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
    if(user.role_key!=='drf_store_keeper')return NextResponse.json({error:'This endpoint is for DRF Store Keeper workflows.'},{status:403});
    const locations=assignedLocations(user);if(!locations.length)return NextResponse.json({error:'Assign this account to DRF STORE before continuing.'},{status:403});
    const params=new URL(request.url).searchParams;const resource=params.get('resource')||'options';
    if(resource==='options'){
      const marks=locations.map(()=>'?').join(',');
      const [stores]=await db.query(`SELECT id,code,name,type FROM locations WHERE is_active=1 AND type='central_store' AND id IN (${marks})`,locations);
      if(!(stores as any[]).length)return NextResponse.json({error:'The assigned location is not an active central store.'},{status:403});
      const suppliersAllowed=await can(user.role_key,'suppliers','view');
      const drugsAllowed=await can(user.role_key,'drug_catalogue','view');
      const transfersAllowed=await can(user.role_key,'transfers','view');
      const inventoryAllowed=await can(user.role_key,'inventory','view');
      const [suppliers]=suppliersAllowed?await db.execute('SELECT id,code,name FROM suppliers WHERE is_active=1 ORDER BY name'):[[]];
      const [drugs]=drugsAllowed?await db.execute('SELECT id,sku,generic_name,brand_name,strength,dosage_form,base_unit FROM drugs WHERE is_active=1 ORDER BY generic_name LIMIT 1000'):[[]];
      const [destinations]=transfersAllowed?await db.execute("SELECT id,code,name FROM locations WHERE is_active=1 AND type='pharmacy' ORDER BY name"):[[]];
      const [purchaseOrders]=await db.query(`SELECT po.id,po.po_no,po.supplier_id,po.destination_location_id,po.expected_date,s.name supplier FROM purchase_orders po JOIN suppliers s ON s.id=po.supplier_id WHERE po.destination_location_id IN (${marks}) AND po.status IN ('sent','partially_received') ORDER BY po.order_date DESC`,locations);
      const [purchaseOrderLines]=await db.query(`SELECT i.id,i.purchase_order_id,i.drug_id,i.quantity_ordered,i.quantity_received,d.sku,d.generic_name,d.strength FROM purchase_order_items i JOIN purchase_orders po ON po.id=i.purchase_order_id JOIN drugs d ON d.id=i.drug_id WHERE po.destination_location_id IN (${marks}) AND po.status IN ('sent','partially_received') AND i.quantity_received<i.quantity_ordered ORDER BY i.id`,locations);
      const [batches]=inventoryAllowed?await db.query(`SELECT b.id batch_id,b.drug_id,b.location_id,b.batch_no,b.expiry_date,b.quantity_on_hand,b.quantity_reserved,b.quantity_quarantined,b.cost_price_ngn,d.sku,d.generic_name,d.strength,d.dosage_form FROM stock_batches b JOIN drugs d ON d.id=b.drug_id WHERE b.location_id IN (${marks}) AND b.status='usable' AND b.expiry_date>=CURDATE() AND b.quantity_on_hand>b.quantity_reserved+b.quantity_quarantined ORDER BY d.generic_name,b.expiry_date`,locations):[[]];
      return NextResponse.json({data:{stores,suppliers,drugs,destinations,batches,purchaseOrders,purchaseOrderLines}});
    }
    if(resource==='request'){
      if(!await can(user.role_key,'stock_requests','view'))return NextResponse.json({error:'You cannot view stock requests.'},{status:403});
      const id=Number(params.get('id'));if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:'A valid request is required.'},{status:400});
      const marks=locations.map(()=>'?').join(',');
      const [heads]=await db.query(`SELECT r.id,r.request_no,r.source_location_id,r.requesting_location_id,r.priority,r.status,r.reason,r.created_at,l.name requesting_location,u.name requested_by FROM stock_requests r JOIN locations l ON l.id=r.requesting_location_id JOIN users u ON u.id=r.requested_by WHERE r.id=? AND r.source_location_id IN (${marks}) LIMIT 1`,[id,...locations]);
      if(!(heads as any[]).length)return NextResponse.json({error:'Request not found for this store.'},{status:404});
      const [items]=await db.execute('SELECT i.id,i.drug_id,i.quantity_requested,i.quantity_approved,i.notes,d.sku,d.generic_name,d.strength,d.dosage_form FROM stock_request_items i JOIN drugs d ON d.id=i.drug_id WHERE i.stock_request_id=? ORDER BY d.generic_name',[id]);
      return NextResponse.json({data:{...(heads as any[])[0],items}});
    }
    return NextResponse.json({error:'Unknown DRF Store resource.'},{status:404});
  }catch(error){console.error('DRF Store lookup error:',error);return NextResponse.json({error:'Could not load DRF Store records.'},{status:503})}
}

export async function POST(request:Request){
  try{
    const user=await getSessionUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
    if(user.role_key!=='drf_store_keeper')return NextResponse.json({error:'This endpoint is for DRF Store Keeper workflows.'},{status:403});
    const body=await request.json();const action=String(body.action||'');const locations=assignedLocations(user);
    if(!locations.length)return NextResponse.json({error:'Assign this account to DRF STORE before continuing.'},{status:403});

    if(action==='create_grn'){
      if(!await can(user.role_key,'grns','create'))return NextResponse.json({error:'Your role needs GRNs → Create permission.'},{status:403});
      const supplierId=Number(body.supplier_id),purchaseOrderId=body.purchase_order_id?Number(body.purchase_order_id):null,receivedAt=String(body.received_at||'').trim(),items=Array.isArray(body.items)?body.items:[];
      if(!Number.isSafeInteger(supplierId)||supplierId<1||!receivedAt||!items.length||items.length>100)return NextResponse.json({error:'Select a supplier, receipt date, and 1–100 product batches.'},{status:422});
      for(let i=0;i<items.length;i++){const row=items[i];const received=validQty(row.quantity_received),accepted=Number(row.quantity_accepted),rejected=Number(row.quantity_rejected),cost=Number(row.unit_cost_ngn);if(!Number.isSafeInteger(Number(row.drug_id))||Number(row.drug_id)<1||!String(row.batch_no||'').trim()||!/^\d{4}-\d{2}-\d{2}$/.test(String(row.expiry_date||''))||!received||!Number.isFinite(accepted)||accepted<0||!Number.isFinite(rejected)||rejected<0||accepted+rejected>received||!Number.isFinite(cost)||cost<0)return NextResponse.json({error:`Check the medicine, batch, expiry, quantities, and cost on line ${i+1}.`},{status:422})}
      const [supplierRows]=await db.execute('SELECT id FROM suppliers WHERE id=? AND is_active=1',[supplierId]);
      if(!(supplierRows as any[]).length)return NextResponse.json({error:'Select an active supplier.'},{status:422});
      const drugIds=[...new Set(items.map((item:any)=>Number(item.drug_id)))];
      const [drugRows]=await db.query(`SELECT id FROM drugs WHERE is_active=1 AND id IN (${drugIds.map(()=>'?').join(',')})`,drugIds);
      if((drugRows as any[]).length!==drugIds.length)return NextResponse.json({error:'One or more medicines are inactive or unavailable.'},{status:422});
      const marks=locations.map(()=>'?').join(',');const [stores]=await db.query(`SELECT id FROM locations WHERE type='central_store' AND is_active=1 AND id IN (${marks}) ORDER BY id LIMIT 1`,locations);if(!(stores as any[]).length)return NextResponse.json({error:'The assigned location is not an active central store.'},{status:403});const storeId=Number((stores as any[])[0].id);
      if(purchaseOrderId){const [orders]=await db.query(`SELECT id FROM purchase_orders WHERE id=? AND supplier_id=? AND destination_location_id=? AND status IN ('sent','partially_received')`,[purchaseOrderId,supplierId,storeId]);if(!(orders as any[]).length)return NextResponse.json({error:'Choose an open purchase order for the selected supplier and DRF STORE.'},{status:422});for(const item of items){const poItemId=Number(item.purchase_order_item_id);const qty=Number(item.quantity_accepted);const [poLines]=await db.execute('SELECT quantity_ordered,quantity_received,drug_id FROM purchase_order_items WHERE id=? AND purchase_order_id=?',[poItemId,purchaseOrderId]);const line=(poLines as any[])[0];if(!line||Number(line.drug_id)!==Number(item.drug_id)||qty>Number(line.quantity_ordered)-Number(line.quantity_received))return NextResponse.json({error:'A received line does not match its purchase order or exceeds its outstanding quantity.'},{status:422});}}
      const conn=await db.getConnection();let grnNo='';let grnId=0;
      try{await conn.beginTransaction();grnNo=await nextReference(conn,'goods_receipt','GRN-');let total=0;for(const item of items)total+=Number(item.quantity_accepted)*Number(item.unit_cost_ngn);const [created]=await conn.execute("INSERT INTO goods_receipts(grn_no,purchase_order_id,supplier_id,destination_location_id,supplier_invoice_no,delivery_reference,received_at,status,total_cost_ngn,remarks,created_by) VALUES(?,?,?,?,?,?,?,'draft',?,?,?)",[grnNo,purchaseOrderId,supplierId,storeId,String(body.supplier_invoice_no||'').trim()||null,String(body.delivery_reference||'').trim()||null,receivedAt,total,String(body.remarks||'').trim()||null,user.id]);grnId=Number((created as any).insertId);for(const item of items)await conn.execute('INSERT INTO goods_receipt_items(goods_receipt_id,purchase_order_item_id,drug_id,batch_no,expiry_date,quantity_received,quantity_accepted,quantity_rejected,unit_cost_ngn,rejection_reason) VALUES(?,?,?,?,?,?,?,?,?,?)',[grnId,purchaseOrderId?Number(item.purchase_order_item_id):null,Number(item.drug_id),String(item.batch_no).trim(),String(item.expiry_date),Number(item.quantity_received),Number(item.quantity_accepted),Number(item.quantity_rejected),Number(item.unit_cost_ngn),String(item.rejection_reason||'').trim()||null]);await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,reference_no,outcome,after_data) VALUES(?,?,?,?,?,?,?,?,?)',[user.id,user.role_key,'created_grn_draft','grns','goods_receipt',String(grnId),grnNo,'success',JSON.stringify({item_count:items.length,purchase_order_id:purchaseOrderId})]);await conn.commit()}catch(error){await conn.rollback();throw error}finally{conn.release()}
      return NextResponse.json({ok:true,id:grnId,reference:grnNo},{status:201});
    }

    if(action==='submit_grn'){
      if(!await can(user.role_key,'grns','edit'))return NextResponse.json({error:'Your role needs GRNs → Edit permission to submit drafts.'},{status:403});
      const id=Number(body.id);if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:'A valid GRN draft is required.'},{status:400});
      const marks=locations.map(()=>'?').join(',');const conn=await db.getConnection();
      try{await conn.beginTransaction();const [result]=await conn.query(`UPDATE goods_receipts SET status='pending_approval' WHERE id=? AND created_by=? AND status='draft' AND destination_location_id IN (${marks})`,[id,user.id,...locations]);if(!(result as any).affectedRows)throw new Error('This GRN is not an editable draft owned by your account.');await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,outcome) VALUES(?,?,?,?,?,?,?)',[user.id,user.role_key,'submitted_grn_for_approval','grns','goods_receipt',String(id),'success']);await conn.commit()}catch(error){await conn.rollback();throw error}finally{conn.release()}return NextResponse.json({ok:true});
    }

    if(action==='create_transfer'){
      if(!await can(user.role_key,'transfers','create'))return NextResponse.json({error:'Your role needs Transfers → Create permission.'},{status:403});
      const destinationId=Number(body.destination_location_id),requestId=body.stock_request_id?Number(body.stock_request_id):null,items=Array.isArray(body.items)?body.items:[];
      if(!Number.isSafeInteger(destinationId)||destinationId<1||!items.length||items.length>100)return NextResponse.json({error:'Choose a destination pharmacy and add 1–100 batch lines.'},{status:422});
      const [destinations]=await db.execute("SELECT id FROM locations WHERE id=? AND type='pharmacy' AND is_active=1",[destinationId]);if(!(destinations as any[]).length)return NextResponse.json({error:'Choose an active pharmacy destination.'},{status:422});
      if(requestId){const marks=locations.map(()=>'?').join(',');const [requests]=await db.query(`SELECT id FROM stock_requests WHERE id=? AND source_location_id IN (${marks}) AND requesting_location_id=? AND status IN ('pending','partially_fulfilled','approved')`,[requestId,...locations,destinationId]);if(!(requests as any[]).length)return NextResponse.json({error:'The linked stock request is unavailable or not open.'},{status:422})}
      for(let i=0;i<items.length;i++){const quantity=validQty(items[i].quantity);if(!Number.isSafeInteger(Number(items[i].batch_id))||Number(items[i].batch_id)<1||!quantity)return NextResponse.json({error:`Choose an eligible batch and positive issue quantity on line ${i+1}.`},{status:422})}
      const marks=locations.map(()=>'?').join(',');const conn=await db.getConnection();const createdIds:number[]=[];const refs:string[]=[];
      try{await conn.beginTransaction();const [stores]=await conn.query(`SELECT id FROM locations WHERE type='central_store' AND is_active=1 AND id IN (${marks}) ORDER BY id LIMIT 1 FOR UPDATE`,locations);if(!(stores as any[]).length)throw new Error('No assigned central store is available.');const sourceId=Number((stores as any[])[0].id);
        const requestCaps=new Map<number,number>();if(requestId){const [reqItems]=await conn.execute('SELECT drug_id,SUM(COALESCE(quantity_approved,quantity_requested)) approved FROM stock_request_items WHERE stock_request_id=? GROUP BY drug_id',[requestId]);for(const row of reqItems as any[])requestCaps.set(Number(row.drug_id),Number(row.approved));const [alreadyIssued]=await conn.execute("SELECT drug_id,SUM(quantity_dispatched) quantity FROM stock_transfers WHERE stock_request_id=? AND status IN ('pending_approval','approved','in_transit','partially_received','completed') GROUP BY drug_id",[requestId]);for(const row of alreadyIssued as any[])requestCaps.set(Number(row.drug_id),Math.max(0,Number(requestCaps.get(Number(row.drug_id))||0)-Number(row.quantity)));}
        const usedByBatch=new Map<number,number>(),usedByDrug=new Map<number,number>();
        for(const item of items){const [batchRows]=await conn.execute("SELECT b.id,b.drug_id,b.batch_no,b.expiry_date,b.quantity_on_hand,b.quantity_reserved,b.quantity_quarantined,b.cost_price_ngn FROM stock_batches b WHERE b.id=? AND b.location_id=? AND b.status='usable' AND b.expiry_date>=CURDATE() FOR UPDATE",[Number(item.batch_id),sourceId]);const batch=(batchRows as any[])[0];if(!batch)throw new Error('A selected batch is not eligible in the central store.');const quantity=Number(item.quantity);const available=Number(batch.quantity_on_hand)-Number(batch.quantity_reserved)-Number(batch.quantity_quarantined);const used=Number(usedByBatch.get(Number(batch.id))||0);if(used+quantity>available)throw new Error(`Requested issue exceeds available quantity for batch ${batch.batch_no}.`);usedByBatch.set(Number(batch.id),used+quantity);if(requestId){if(!requestCaps.has(Number(batch.drug_id)))throw new Error('A selected batch is not included in the linked pharmacy request.');const drugUsed=Number(usedByDrug.get(Number(batch.drug_id))||0);if(drugUsed+quantity>Number(requestCaps.get(Number(batch.drug_id))))throw new Error('The transfer quantity exceeds the approved quantity on the linked pharmacy request.');usedByDrug.set(Number(batch.drug_id),drugUsed+quantity);}const ref=await nextReference(conn,'stock_transfer','TRF-');const [created]=await conn.execute('INSERT INTO stock_transfers(transfer_no,stock_request_id,source_location_id,destination_location_id,drug_id,source_batch_id,batch_no,quantity_dispatched,status,created_by) VALUES(?,?,?,?,?,?,?,?,\'draft\',?)',[ref,requestId,sourceId,destinationId,Number(batch.drug_id),Number(batch.id),String(batch.batch_no),quantity,user.id]);createdIds.push(Number((created as any).insertId));refs.push(ref);}
        await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,outcome,after_data) VALUES(?,?,?,?,?,?,?,?)',[user.id,user.role_key,'created_transfer_draft','transfers','stock_transfer',createdIds.join(','),'success',JSON.stringify({references:refs,destination_id:destinationId,stock_request_id:requestId})]);await conn.commit();
      }catch(error){await conn.rollback();throw error}finally{conn.release()}
      return NextResponse.json({ok:true,ids:createdIds,references:refs},{status:201});
    }

    if(action==='submit_transfer'){
      if(!await can(user.role_key,'transfers','edit'))return NextResponse.json({error:'Your role needs Transfers → Edit permission to submit drafts.'},{status:403});
      const ids=[...new Set((Array.isArray(body.ids)?body.ids:[]).map(Number).filter((id:number)=>Number.isSafeInteger(id)&&id>0))];if(!ids.length||ids.length>100)return NextResponse.json({error:'Select 1–100 transfer draft lines.'},{status:422});const marks=locations.map(()=>'?').join(',');const conn=await db.getConnection();
      try{await conn.beginTransaction();const [rows]=await conn.query(`SELECT id FROM stock_transfers WHERE id IN (${ids.map(()=>'?').join(',')}) AND created_by=? AND status='draft' AND source_location_id IN (${marks}) FOR UPDATE`,[...ids,user.id,...locations]);if((rows as any[]).length!==ids.length)throw new Error('One or more transfer lines are not drafts owned by your account.');await conn.execute(`UPDATE stock_transfers SET status='pending_approval' WHERE id IN (${ids.map(()=>'?').join(',')})`,ids);await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,outcome) VALUES(?,?,?,?,?,?,?)',[user.id,user.role_key,'submitted_transfer_for_approval','transfers','stock_transfer',ids.join(','),'success']);await conn.commit()}catch(error){await conn.rollback();throw error}finally{conn.release()}
      return NextResponse.json({ok:true,submitted:ids.length});
    }
    return NextResponse.json({error:'Unsupported DRF Store action.'},{status:404});
  }catch(error:any){console.error('DRF Store action error:',error);if(error?.code==='ER_DUP_ENTRY')return NextResponse.json({error:'A duplicate batch or reference was detected; nothing was saved.'},{status:409});return NextResponse.json({error:error instanceof Error?error.message:'Unable to save DRF Store transaction.'},{status:422})}
}
