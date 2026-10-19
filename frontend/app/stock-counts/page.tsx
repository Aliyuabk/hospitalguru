'use client';

import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, RefreshCw, SearchCheck } from 'lucide-react';
import { PageHeading } from '@/components/shell';
import { ErrorState, LoadingState } from '@/components/data-state';
import { apiFetch, rows } from '@/lib/api';

type Department = { id: number; name: string };
type CountLine = { id: number; stock_id: number | null; batch_no: string; expected_quantity: number; counted_quantity: number | null; counted_at: string | null; drug?: { name: string; sku: string; unit: string } };
type Count = { id: number; reference: string; status: 'counting' | 'completed'; started_at: string; completed_at: string | null; department?: Department; items_count?: number; items?: CountLine[] };

export default function StockCountsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [counts, setCounts] = useState<Count[]>([]);
  const [selected, setSelected] = useState<Count | null>(null);
  const [departmentId, setDepartmentId] = useState('');
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [canStart, setCanStart] = useState(false);
  const [canComplete, setCanComplete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [departmentData, countData] = await Promise.all([apiFetch('/departments'), apiFetch('/stock-counts')]);
      setDepartments(rows<Department>(departmentData));
      const nextCounts = rows<Count>(countData);
      setCounts(nextCounts);
      const current = selected ? nextCounts.find((item) => item.id === selected.id) : nextCounts.find((item) => item.status === 'counting');
      if (current) await openCount(current.id);
      else setSelected(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load stock counts.'); }
    finally { setLoading(false); }
  }, [selected?.id]);

  async function openCount(id: number) {
    const detail = await apiFetch<Count>(`/stock-counts/${id}`);
    setSelected(detail);
    setQuantities(Object.fromEntries((detail.items || []).map((line) => [line.id, line.counted_quantity == null ? '' : String(line.counted_quantity)])));
  }

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('bkd_user') || '{}');
      setCanStart(user.role === 'hod' || user.role === 'store_keeper');
      setCanComplete(user.role === 'hod');
    } catch { setCanStart(false); setCanComplete(false); }
  }, []);

  async function startCount() {
    if (!departmentId) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const count = await apiFetch<Count>('/stock-counts', { method: 'POST', body: JSON.stringify({ department_id: Number(departmentId) }) });
      setSelected(count); setCounts((current) => [{ ...count, items_count: count.items?.length || 0 }, ...current]); setNotice('Count opened. Sales, receiving and transfers for this unit are paused until the count is completed.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not start stock count.'); }
    finally { setBusy(false); }
  }

  async function saveLine(line: CountLine) {
    const value = quantities[line.id];
    if (value === '' || !Number.isInteger(Number(value)) || Number(value) < 0) { setError('Enter a whole number of zero or more.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      await apiFetch(`/stock-counts/${selected?.id}/items/${line.id}`, { method: 'PUT', body: JSON.stringify({ counted_quantity: Number(value) }) });
      await openCount(selected!.id); setNotice(`Saved ${line.drug?.name || 'batch'} count.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save this count.'); }
    finally { setBusy(false); }
  }

  async function completeCount() {
    if (!selected || !window.confirm('Complete this count and adjust stock balances to the physical quantities entered? This action closes the count.')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await apiFetch<Count>(`/stock-counts/${selected.id}/complete`, { method: 'POST' });
      setSelected(result); setNotice('Stock count completed and stock balances reconciled.'); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not complete the stock count.'); }
    finally { setBusy(false); }
  }

  const lines = (selected?.items || []).filter((line) => `${line.drug?.name || ''} ${line.drug?.sku || ''} ${line.batch_no}`.toLowerCase().includes(query.toLowerCase()));
  const remaining = (selected?.items || []).filter((line) => line.counted_quantity == null).length;
  const differences = (selected?.items || []).filter((line) => line.counted_quantity != null && line.counted_quantity !== line.expected_quantity).length;

  if (loading && !counts.length) return <LoadingState label="Loading physical stock counts…"/>;
  return <>
    <PageHeading eyebrow="Inventory control" title="Physical stock counts" description="Count medicine batches on the shelves, review differences, and reconcile balances with an audit record." action={<button onClick={() => void load()} className="flex items-center gap-2 rounded-xl border border-[#e5ece8] bg-white px-4 py-2.5 text-xs font-semibold"><RefreshCw size={14}/>Refresh</button>}/>
    {error && <div className="mb-4"><ErrorState message={error} onRetry={() => void load()}/></div>}
    {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">{notice}</div>}
    {selected?.status === 'counting' && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950"><ClipboardCheck size={18} className="mt-0.5 shrink-0"/><div><div className="text-sm font-bold">Stock count in progress · {selected.department?.name}</div><p className="mt-1 text-xs leading-5">Sales, stock receiving, and transfers for this unit are paused. Enter the physical quantity for every batch, including zero.</p></div></div>}
    {canStart && (!selected || selected.status === 'completed') ? <div className="mb-5 rounded-2xl border border-[#e9efeb] bg-white p-5 shadow-soft"><div className="mb-3 text-sm font-bold">Start a count</div><div className="flex flex-col gap-3 sm:flex-row"><select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-[#e3eae6] px-3 text-sm"><option value="">Select a pharmacy unit</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select><button disabled={!departmentId || busy} onClick={() => void startCount()} className="h-11 rounded-xl bg-brand-600 px-4 text-xs font-bold text-white disabled:opacity-50">Open count and pause unit operations</button></div><p className="mt-2 text-[11px] text-[#82928b]">Only one active count can run per unit. Completing it applies the entered quantities to stock.</p></div> : null}
    {!canStart && !selected && <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs font-medium text-blue-900">Your assigned pharmacy unit has no active stock count. Ask the HOD or store keeper to open one when it is time to count.</div>}
    {selected && <section className="mb-6 overflow-hidden rounded-2xl border border-[#e9efeb] bg-white shadow-soft"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1ef] px-5 py-4"><div><div className="text-sm font-extrabold">{selected.reference} · {selected.department?.name}</div><div className="mt-1 text-[11px] text-[#82928b]">Started {new Date(selected.started_at).toLocaleString()} · {selected.status === 'counting' ? `${remaining} batch${remaining === 1 ? '' : 'es'} left · ${differences} difference${differences === 1 ? '' : 's'} entered` : `Completed ${selected.completed_at ? new Date(selected.completed_at).toLocaleString() : ''} · ${differences} differences`}</div></div>{selected.status === 'counting' && canComplete && <button disabled={busy || remaining > 0} onClick={() => void completeCount()} className="rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">Complete & reconcile</button>}</div><div className="border-b border-[#edf1ef] px-5 py-3"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find medicine or batch" className="h-10 w-full rounded-xl border border-[#e3eae6] px-3 text-xs sm:max-w-sm"/></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#f7f9f8] text-[10px] uppercase tracking-wide text-[#83928b]"><tr><th className="px-5 py-3">Medicine / SKU</th><th className="px-4 py-3">Batch</th><th className="px-4 py-3">System qty</th><th className="px-4 py-3">Physical qty</th><th className="px-4 py-3">Difference</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-[#edf1ef]">{lines.map((line) => {const variance = line.counted_quantity == null ? null : line.counted_quantity - line.expected_quantity; return <tr key={line.id}><td className="px-5 py-3"><div className="font-bold text-[#31483e]">{line.drug?.name}</div><div className="mt-1 text-[10px] text-[#899991]">{line.drug?.sku}</div></td><td className="px-4 py-3">{line.batch_no}</td><td className="px-4 py-3">{line.expected_quantity}</td><td className="px-4 py-3">{selected.status === 'counting' ? <input aria-label={`Physical count for ${line.drug?.name} batch ${line.batch_no}`} type="number" min="0" step="1" value={quantities[line.id] ?? ''} onChange={(e) => setQuantities((current) => ({ ...current, [line.id]: e.target.value }))} className="h-9 w-28 rounded-lg border border-[#dfe8e2] px-2"/> : line.counted_quantity}</td><td className={`px-4 py-3 font-bold ${variance === null ? 'text-[#9aa9a3]' : variance === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{variance === null ? 'Not counted' : variance > 0 ? `+${variance}` : variance}</td><td className="px-4 py-3">{selected.status === 'counting' && <button disabled={busy || quantities[line.id] === '' || String(line.counted_quantity ?? '') === quantities[line.id]} onClick={() => void saveLine(line)} className="rounded-lg border border-[#e3eae6] px-3 py-2 text-[10px] font-bold disabled:opacity-40">Save count</button>}</td></tr>;})}{!lines.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-[#84938c]">No batches match this search.</td></tr>}</tbody></table></div><div className="flex items-center gap-2 border-t border-[#edf1ef] px-5 py-3 text-[10px] text-[#71847b]"><SearchCheck size={14}/>Count each medicine batch separately so expiry and batch balances stay accurate.</div></section>}
    <section className="overflow-hidden rounded-2xl border border-[#e9efeb] bg-white shadow-soft"><div className="border-b border-[#edf1ef] px-5 py-4 text-sm font-bold">Count history</div><div className="divide-y divide-[#edf1ef]">{counts.map((count) => <button key={count.id} onClick={() => void openCount(count.id)} className={`flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[#f8faf9] ${selected?.id === count.id ? 'bg-[#f2f8f4]' : ''}`}><span><span className="block text-xs font-bold">{count.reference} · {count.department?.name}</span><span className="mt-1 block text-[10px] text-[#82928b]">{new Date(count.started_at).toLocaleString()} · {count.items_count ?? 0} batches</span></span><span className={`rounded-full px-3 py-1 text-[10px] font-bold ${count.status === 'counting' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{count.status === 'counting' ? 'In progress · sales paused' : 'Completed'}</span></button>)}{!counts.length && <div className="px-5 py-8 text-center text-xs text-[#82928b]">No physical stock counts yet.</div>}</div></section>
  </>;
}
