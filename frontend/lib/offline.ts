import { resolveApiUrl } from './api';
import PouchDB from 'pouchdb-browser';

let instance: InstanceType<typeof PouchDB> | undefined;
function database(){return instance??(instance=new PouchDB('bkd-pharmacy-sales'));}
type PaymentMode='Cash'|'Transfer'|'NHIS'|'Staff Credit';
export type OfflineSale={_id?:string;_rev?:string;local_id:string;invoice_no:string;patient_id:number|null;prescription_id?:number|null;patient_name:string;client_name?:string;patient_type?:'Inpatient'|'Outpatient';folder_no:string|null;staff_id:number;department_id:number;subtotal_naira:number;discount_naira:number;total_naira:number;payment_mode:PaymentMode;items:{drug_id:number;name:string;quantity:number;unit_price_naira:number;stock_quantity?:number;sale_unit_name?:string;line_total_naira?:number}[];created_at:string;is_synced:boolean;sync_conflict?:boolean;sync_error?:string};

async function allSales():Promise<OfflineSale[]>{const result=await database().allDocs({include_docs:true});return result.rows.map((row:any)=>row.doc as OfflineSale);}
export async function queueSale(sale:OfflineSale){await database().put({...sale,_id:sale.local_id});await refreshPending();if(navigator.onLine)void syncSales();}
export async function pendingSales(){return (await allSales()).filter(s=>!s.is_synced)}
async function refreshPending(){const n=(await pendingSales()).length;localStorage.setItem('bkd_pending_count',String(n));window.dispatchEvent(new Event('bkd:pending'));}
export async function syncSales(){if(!navigator.onLine)return;const queued=await pendingSales();if(!queued.length){await refreshPending();return;}const api=await resolveApiUrl();const token=localStorage.getItem('bkd_token');for(const sale of queued){try{const response=await fetch(`${api}/sync/sales`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(sale)});if(response.status===409){const error=await response.json().catch(()=>({message:'Sale needs HOD review.'}));await database().put({...sale,_id:sale.local_id,sync_conflict:true,sync_error:error.message||'Sale needs HOD review.'});continue;}if(!response.ok)continue;await database().put({...sale,_id:sale.local_id,is_synced:true,sync_conflict:false,sync_error:undefined});}catch{/* retry on the next online event */}}await refreshPending();}
export async function getSaleHistory(){return allSales()}

