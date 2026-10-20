'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, RotateCcw, Search, X } from 'lucide-react';
import { PageHeading } from '@/components/shell';
import { apiFetch, rows } from '@/lib/api';
import { formatNaira } from '@/lib/data';

type Sale = { id:number; invoice_no:string; total_naira:number; subtotal_naira:number; payment_mode:string; sold_at:string; patient?:{full_name:string;folder_no:string|null;phone:string|null}; items:{drug_id:number;quantity:number;unit_price_naira:number;line_total_naira:number;sale_quantity:number;sale_unit_name:string;drug?:{name:string}}[] };
type Refund = { id:number;sale_id:number;invoice_no:string;patient?:{full_name:string;folder_no?:string|null};reason:string;items:{drug_id:number;quantity:number}[];requested_amount_naira:number;approved_amount_naira:number|null;status:string;requester?:{name:string} };
const inputClass = 'h-10 w-full rounded-lg border border-[#e5ece8] bg-white px-3 text-xs outline-none focus:border-brand-500';

export default function Refunds() {
  const [sales,setSales]=useState<Sale[]>([]); const [requests,setRequests]=useState<Refund[]>([]); const [role,setRole]=useState('');
  const [saleId,setSaleId]=useState(''); const [reason,setReason]=useState(''); const [quantities,setQuantities]=useState<Record<number,number>>({});
  const [approved,setApproved]=useState<Record<number,string>>({}); const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
  const [receiptSearch,setReceiptSearch]=useState(''); const [payment,setPayment]=useState('all'); const [from,setFrom]=useState(''); const [to,setTo]=useState(''); const [searching,setSearching]=useState(false);
  const [claimSearch,setClaimSearch]=useState(''); const [claimStatus,setClaimStatus]=useState('all');

  const load=useCallback(async()=>{try{const[s,r]=await Promise.all([apiFetch('/sales'),apiFetch('/refund-requests')]);setSales(rows<Sale>(s));setRequests(Array.isArray(r)?r:rows<Refund>(r));setMessage('')}catch(e){setMessage(e instanceof Error?e.message:'Unable to load refunds.')}},[]);
  useEffect(()=>{try{setRole(JSON.parse(localStorage.getItem('bkd_user')||'{}').role||'')}catch{}void load()},[load]);

  useEffect(()=>{
    if(!receiptSearch.trim()&&payment==='all'&&!from&&!to)return;
    let active=true; const timer=window.setTimeout(()=>{
      const params=new URLSearchParams(); if(receiptSearch.trim())params.set('q',receiptSearch.trim()); if(payment!=='all')params.set('payment_mode',payment); if(from)params.set('from',from); if(to)params.set('to',to);
      setSearching(true); void apiFetch(`/sales?${params.toString()}`).then(data=>{if(active)setSales(rows<Sale>(data))}).catch(e=>{if(active)setMessage(e instanceof Error?e.message:'Unable to search receipts.')}).finally(()=>{if(active)setSearching(false)});
    },250);
    return()=>{active=false;window.clearTimeout(timer)};
  },[receiptSearch,payment,from,to]);

  const selected=sales.find(s=>String(s.id)===saleId);
  const filteredRequests=useMemo(()=>requests.filter(r=>{
    const query=claimSearch.trim().toLowerCase();
    const matchesText=!query||[r.invoice_no,r.patient?.full_name,r.patient?.folder_no,r.requester?.name,r.reason].some(value=>String(value||'').toLowerCase().includes(query));
    return matchesText&&(claimStatus==='all'||r.status===claimStatus);
  }),[requests,claimSearch,claimStatus]);

  async function clearReceiptFilters(){setReceiptSearch('');setPayment('all');setFrom('');setTo('');setSearching(true);try{const data=await apiFetch('/sales');setSales(rows<Sale>(data))}catch(e){setMessage(e instanceof Error?e.message:'Unable to load receipts.')}finally{setSearching(false)}}
  async function submit(){if(!selected)return;const items=selected.items.filter(i=>(quantities[i.drug_id]||0)>0).map(i=>({drug_id:i.drug_id,quantity:quantities[i.drug_id]}));if(!items.length||!reason.trim()){setMessage('Select returned quantities and enter a reason.');return}setBusy(true);try{await apiFetch('/refund-requests',{method:'POST',body:JSON.stringify({sale_id:selected.id,reason,items})});setMessage('Return recorded. The claim is waiting for HOD approval.');setSaleId('');setReason('');setQuantities({});setReceiptSearch('');setPayment('all');setFrom('');setTo('');await load()}catch(e){setMessage(e instanceof Error?e.message:'Refund request failed.')}finally{setBusy(false)}}
  async function decide(item:Refund,decision:'approved'|'rejected'){const amount=Number(approved[item.id]??item.requested_amount_naira);const note=window.prompt('Decision note (optional):')||'';setBusy(true);try{await apiFetch(`/refund-requests/${item.id}/decision`,{method:'PATCH',body:JSON.stringify({decision,approved_amount_naira:amount,decision_note:note})});setMessage(`Refund ${decision}.`);await load()}catch(e){setMessage(e instanceof Error?e.message:'Could not update refund.')}finally{setBusy(false)}}

  return <>
    <PageHeading eyebrow="Sales control" title="Refunds & returns" description="Find a receipt quickly, record returned medicines, and route the claim to the HOD for approval." />
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-2xl border border-[#e9efeb] bg-white p-5 shadow-soft">
        <h2 className="text-sm font-bold">Request a return</h2><p className="mt-1 text-xs text-[#82928b]">Search by receipt number, patient, folder number, phone, or medicine. Use date and payment filters to narrow the list.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <label className="relative sm:col-span-2"><Search size={15} className="absolute left-3 top-3 text-[#91a099]"/><input value={receiptSearch} onChange={e=>setReceiptSearch(e.target.value)} placeholder="Receipt no., patient, folder, phone, medicine…" aria-label="Search receipts" className={`${inputClass} pl-9`}/></label>
          <select aria-label="Filter by payment" value={payment} onChange={e=>setPayment(e.target.value)} className={inputClass}><option value="all">All payment methods</option><option>Cash</option><option>Transfer</option><option>NHIS</option><option>Staff Credit</option></select>
          <button type="button" onClick={()=>void clearReceiptFilters()} className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-[#e5ece8] px-3 text-xs font-semibold text-[#60756b] hover:bg-[#f7f9f8]"><X size={13}/>Clear filters</button>
          <label className="text-[10px] font-semibold text-[#71837a]">From date<input type="date" value={from} onChange={e=>setFrom(e.target.value)} className={`${inputClass} mt-1`}/></label>
          <label className="text-[10px] font-semibold text-[#71837a]">To date<input type="date" value={to} onChange={e=>setTo(e.target.value)} className={`${inputClass} mt-1`}/></label>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-[#82928b]"><span>{searching?'Searching receipts…':`${sales.length} receipt${sales.length===1?'':'s'} shown`}</span>{receiptSearch&&<span>Search includes medicine names</span>}</div>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-[#e9efeb]">
          {sales.map(s=><button key={s.id} type="button" onClick={()=>{setSaleId(String(s.id));setQuantities({});setMessage('')}} className={`block w-full border-b border-[#edf1ef] px-3 py-3 text-left last:border-b-0 hover:bg-[#f7faf8] ${saleId===String(s.id)?'bg-[#edf7f1]':''}`}>
            <span className="flex items-start justify-between gap-3"><span className="min-w-0"><b className="block truncate text-xs text-[#2b443a]">{s.invoice_no} · {s.patient?.full_name||'Walk-in'}</b><span className="mt-1 block truncate text-[10px] text-[#82928b]">{s.patient?.folder_no||'No folder number'} · {s.patient?.phone||'No phone'} · {new Date(s.sold_at).toLocaleDateString()}</span></span><b className="shrink-0 text-xs">{formatNaira(s.total_naira)}</b></span>
            <span className="mt-1 block text-[10px] text-[#82928b]">{s.payment_mode}</span>
          </button>)}
          {!sales.length&&<div className="px-4 py-8 text-center text-xs text-[#82928b]">{searching?'Searching…':'No receipts match those filters.'}</div>}
        </div>
        {selected&&<div className="mt-3 rounded-xl border border-dashed p-3"><div className="mb-2 text-xs font-bold">Receipt {selected.invoice_no} · {selected.patient?.full_name||'Walk-in'} · Total {formatNaira(selected.total_naira)}</div>{selected.items.map(i=><label key={i.drug_id} className="flex items-center justify-between gap-3 border-t py-2 text-xs"><span>{i.drug?.name||'Medicine'} · sold {i.quantity} · {formatNaira(i.unit_price_naira)} each</span><input aria-label={`Returned quantity ${i.drug?.name}`} type="number" min="0" max={i.quantity} value={quantities[i.drug_id]||''} onChange={e=>setQuantities(x=>({...x,[i.drug_id]:Math.min(i.quantity,Number(e.target.value))}))} className="h-9 w-20 rounded-lg border px-2"/></label>)}<div className="mt-2 border-t pt-2 text-xs font-bold">Claim requested: {formatNaira(Math.round(selected.items.reduce((n,i)=>n+(quantities[i.drug_id]||0)*(Number(i.line_total_naira)/Number(i.quantity)),0)*(selected.subtotal_naira>0?selected.total_naira/selected.subtotal_naira:0)))}</div></div>}
        <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for return" className="mt-3 min-h-20 w-full rounded-xl border p-3 text-xs"/>
        <button disabled={!selected||busy} onClick={()=>void submit()} className="mt-3 h-11 w-full rounded-xl bg-brand-600 text-xs font-bold text-white disabled:opacity-50">Submit for HOD approval</button>
      </section>
      <section className="rounded-2xl border border-[#e9efeb] bg-white p-5 shadow-soft">
        <h2 className="text-sm font-bold">Refund claims</h2><p className="mt-1 text-xs text-[#82928b]">Search claims and filter by review status.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_150px]"><input value={claimSearch} onChange={e=>setClaimSearch(e.target.value)} placeholder="Receipt, patient, staff, or reason…" aria-label="Search refund claims" className={inputClass}/><select aria-label="Filter claims by status" value={claimStatus} onChange={e=>setClaimStatus(e.target.value)} className={inputClass}><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
        <div className="mt-4 max-h-[620px] space-y-3 overflow-y-auto">{filteredRequests.map(r=><article key={r.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-2"><div><div className="text-xs font-bold">{r.invoice_no} · {r.patient?.full_name||'Walk-in'}</div><div className="mt-1 text-[10px] text-[#82928b]">{r.patient?.folder_no||'No folder number'} · {r.requester?.name||'Staff'} · {r.reason}</div></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${r.status==='pending'?'bg-amber-50 text-amber-800':r.status==='approved'?'bg-emerald-50 text-emerald-800':'bg-rose-50 text-rose-800'}`}>{r.status}</span></div><div className="mt-2 text-xs">{r.items.map(i=>`${sales.find(s=>s.id===r.sale_id)?.items.find(x=>x.drug_id===i.drug_id)?.drug?.name||'Drug'} × ${i.quantity}`).join(', ')}</div><div className="mt-2 text-xs">Requested: <b>{formatNaira(r.requested_amount_naira)}</b>{r.status==='approved'&&<> · Approved: <b>{formatNaira(Number(r.approved_amount_naira))}</b></>}</div>{role==='hod'&&r.status==='pending'&&<div className="mt-3 flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 text-[10px]">Approve amount ₦<input type="number" min="0" max={r.requested_amount_naira} value={approved[r.id]??r.requested_amount_naira} onChange={e=>setApproved(x=>({...x,[r.id]:e.target.value}))} className="h-9 w-28 rounded-lg border px-2"/></label><button disabled={busy} onClick={()=>void decide(r,'approved')} className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-[10px] font-bold text-white"><Check size={13}/>Approve</button><button disabled={busy} onClick={()=>void decide(r,'rejected')} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-[10px] font-bold"><RotateCcw size={13}/>Reject</button></div>}</article>)}{!filteredRequests.length&&<div className="py-8 text-center text-xs text-[#82928b]">No claims match these filters.</div>}</div>
      </section>
    </div>
    {message&&<p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900">{message}</p>}
  </>;
}
