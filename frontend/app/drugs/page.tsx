'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Eye, Pencil, Pill, Plus, Search, X } from 'lucide-react';
import { PageHeading } from '@/components/shell';
import { ErrorState, LoadingState } from '@/components/data-state';
import { apiFetch, rows } from '@/lib/api';

type Drug = {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  category: string | null;
  unit: string;
  is_active: boolean | number;
  stocks?: { id: number; batch_no: string; quantity: number; selling_price_naira: number; expiry_date: string; department_name?: string }[];
};

type DrugDraft = Pick<Drug, 'name' | 'sku' | 'barcode' | 'category' | 'unit'>;

export default function DrugMaster() {
  const [items, setItems] = useState<Drug[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [canManage, setCanManage] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selected, setSelected] = useState<Drug | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(rows<Drug>(await apiFetch('/drugs')));
    } catch (e: any) {
      setError(e.message || 'Unable to load the drug catalogue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try { setCanManage(JSON.parse(localStorage.getItem('bkd_user') || '{}').role === 'hod'); } catch {}
    void load();
  }, [load]);

  const filtered = items.filter((drug) => `${drug.name} ${drug.sku} ${drug.barcode || ''} ${drug.category || ''}`.toLowerCase().includes(query.toLowerCase()));

  async function openDrug(drug: Drug, nextMode: 'view' | 'edit') {
    setMode(nextMode);
    setSelected(drug);
    setFormError('');
    try {
      setSelected(await apiFetch<Drug>(`/drugs/${drug.id}`));
    } catch (e: any) {
      setFormError(e.message || 'Could not load this drug.');
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const draft: DrugDraft = {
      name: String(form.get('name') || '').trim(),
      sku: String(form.get('sku') || '').trim(),
      barcode: String(form.get('barcode') || '').trim() || null,
      category: String(form.get('category') || '').trim() || null,
      unit: String(form.get('unit') || '').trim(),
    };
    try {
      if (mode === 'edit' && selected) await apiFetch(`/drugs/${selected.id}`, { method: 'PATCH', body: JSON.stringify(draft) });
      else await apiFetch('/drugs', { method: 'POST', body: JSON.stringify(draft) });
      setMode(null);
      setSelected(null);
      await load();
    } catch (e: any) {
      setFormError(e.message || 'Could not save this drug.');
    } finally {
      setSaving(false);
    }
  }

  return <>
    <PageHeading eyebrow="Catalog management" title="Drug master" description="Live medicine catalogue, barcodes, categories and unit details." action={canManage && <button onClick={() => { setSelected(null); setFormError(''); setMode('add'); }} className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white"><Plus size={15}/>Add drug</button>} />
    <div className="relative mb-5"><Search size={16} className="absolute left-3 top-3 text-[#99a8a1]"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search drug, SKU or barcode…" className="h-11 w-full rounded-xl border border-[#e8eeeb] bg-white pl-10 text-xs outline-none focus:border-brand-500"/></div>
    {error && <div className="mb-4"><ErrorState message={error} onRetry={load}/></div>}
    {loading ? <LoadingState label="Loading drug catalogue…"/> : <div className="overflow-hidden rounded-2xl border border-[#e9efeb] bg-white shadow-soft"><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead className="bg-[#f8faf9] text-[10px] font-bold uppercase tracking-wide text-[#95a39d]"><tr>{['Drug','SKU','Barcode','Category','Unit','Stock batches','Available units','Actions'].map((heading) => <th key={heading} className="px-5 py-4">{heading}</th>)}</tr></thead><tbody>{filtered.map((drug) => <tr key={drug.id} className="border-t border-[#f0f3f1] text-xs"><td className="px-5 py-4 font-bold"><Pill className="mr-2 inline text-brand-600" size={15}/>{drug.name}</td><td className="px-5 py-4">{drug.sku}</td><td className="px-5 py-4 text-[#7d8d86]">{drug.barcode || '—'}</td><td className="px-5 py-4 text-[#7d8d86]">{drug.category || '—'}</td><td className="px-5 py-4">{drug.unit}</td><td className="px-5 py-4">{drug.stocks?.length || 0}</td><td className="px-5 py-4 font-semibold">{drug.stocks?.reduce((total, stock) => total + Number(stock.quantity), 0) || 0}</td><td className="px-5 py-4"><div className="flex items-center gap-3"><button onClick={() => void openDrug(drug, 'view')} className="inline-flex items-center gap-1 font-semibold text-[#536a60] hover:text-brand-700"><Eye size={14}/>View</button>{canManage && <button onClick={() => void openDrug(drug, 'edit')} className="inline-flex items-center gap-1 font-semibold text-brand-700"><Pencil size={14}/>Edit</button>}</div></td></tr>)}{!filtered.length && <tr><td colSpan={8} className="px-5 py-10 text-center text-xs text-[#97a69f]">No drugs found.</td></tr>}</tbody></table></div></div>}

    {mode && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4"><div className="my-6 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-lg font-bold">{mode === 'add' ? 'Add drug' : mode === 'edit' ? 'Edit drug' : 'Drug details'}</h2><p className="mt-1 text-xs text-[#82928b]">{mode === 'view' ? 'Catalogue and current stock information.' : 'Keep the medicine catalogue details accurate.'}</p></div><button type="button" onClick={() => { setMode(null); setSelected(null); }} aria-label="Close drug details" className="rounded-lg p-2 text-[#82928b] hover:bg-gray-100"><X size={18}/></button></div>
      {formError && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">{formError}</div>}
      {mode === 'view' && selected ? <><dl className="grid gap-4 sm:grid-cols-2">{[['Drug name', selected.name], ['SKU', selected.sku], ['Barcode', selected.barcode || '—'], ['Category', selected.category || '—'], ['Unit', selected.unit], ['Status', selected.is_active ? 'Active' : 'Inactive']].map(([label, value]) => <div key={label}><dt className="text-xs text-[#8b9a94]">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>)}</dl><div className="mt-6"><h3 className="mb-2 text-sm font-bold">Available stock</h3>{selected.stocks?.length ? <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-xs"><thead className="bg-[#f8faf9] text-[#84948d]"><tr>{['Batch','Department','Quantity','Expiry'].map((x) => <th key={x} className="px-3 py-2">{x}</th>)}</tr></thead><tbody>{selected.stocks.map((stock) => <tr key={stock.id} className="border-t"><td className="px-3 py-2">{stock.batch_no}</td><td className="px-3 py-2">{stock.department_name || '—'}</td><td className="px-3 py-2">{stock.quantity}</td><td className="px-3 py-2">{String(stock.expiry_date).slice(0, 10)}</td></tr>)}</tbody></table></div> : <p className="text-xs text-[#82928b]">No available stock batches.</p>}</div>{canManage && <button onClick={() => setMode('edit')} className="mt-5 h-11 w-full rounded-xl bg-brand-600 text-sm font-bold text-white">Edit drug</button>}</> : mode !== 'view' && <form onSubmit={save} className="space-y-3">{[['name','Drug name',selected?.name||''],['sku','SKU / item code',selected?.sku||''],['barcode','Barcode (optional)',selected?.barcode||''],['category','Category',selected?.category||''],['unit','Unit (tablet, pack…)',selected?.unit||'']].map(([name,label,value]) => <input key={name} name={name} required={name==='name'||name==='sku'||name==='unit'} defaultValue={value} placeholder={label} className="h-11 w-full rounded-xl border px-3 text-sm"/>)}<button disabled={saving} className="h-11 w-full rounded-xl bg-brand-600 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save drug'}</button></form>}
    </div></div>}
  </>;
}
