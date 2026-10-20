'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Eye, FileUp, Pencil, Pill, Plus, Search, X } from 'lucide-react';
import { PageHeading } from '@/components/shell';
import { ErrorState, LoadingState } from '@/components/data-state';
import { apiFetch, rows } from '@/lib/api';
import * as XLSX from 'xlsx';

type SaleUnit={id?:number;unit_name:string;units_per_unit:number;selling_price_naira:number};
type Drug = {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  category: string | null;
  unit: string;
  sale_units?: SaleUnit[];
  is_active: boolean | number;
  stocks?: { id: number; batch_no: string; quantity: number; selling_price_naira: number; expiry_date: string; department_name?: string }[];
};

type DrugDraft = Pick<Drug, 'name' | 'sku' | 'barcode' | 'category' | 'unit' | 'sale_units'>;

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
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const upload = useRef<HTMLInputElement>(null);

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

  async function importCsv(file?: File) {
    if (!file) return;
    setImportMessage(''); setError(''); setImporting(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error('The selected file has no worksheet.');
      const records = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: '', raw: false }).map((row) => row.map((cell) => String(cell).trim())).filter((row) => row.some(Boolean));
      if (records.length < 2) throw new Error('CSV needs a header row and at least one drug.');
      const headers = records[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const column = (names: string[]) => headers.findIndex((h) => names.includes(h));
      const name = column(['name','drug','drugname','medicine']); const sku = column(['sku','itemcode','code']);
      if (name < 0 || sku < 0) throw new Error('CSV must include Name and SKU columns. Optional columns: Barcode, Category, Unit.');
      const at = (r: string[], keys: string[], fallback = '') => { const i = column(keys); return i < 0 ? fallback : r[i] || fallback; };
      const drugs = records.slice(1).map((r) => ({ name: r[name], sku: r[sku], barcode: at(r,['barcode']), category: at(r,['category']), unit: at(r,['unit'],'Unit') })).filter((d) => d.name && d.sku);
      if (!drugs.length) throw new Error('No valid drug rows found.');
      const result = await apiFetch<{imported:number;updated:number;errors:string[]}>('/drugs/bulk', { method: 'POST', body: JSON.stringify({ drugs }) });
      setImportMessage(`Imported ${result.imported}; updated ${result.updated}.${result.errors.length ? ` ${result.errors.length} rows skipped.` : ''}`);
      await load();
    } catch (e: any) { setError(e.message || 'Could not import drug CSV.'); }
    finally { setImporting(false); if (upload.current) upload.current.value = ''; }
  }

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
      sale_units: String(form.get('sale_unit_name') || '').trim() ? [{unit_name:String(form.get('sale_unit_name')).trim(),units_per_unit:Number(form.get('sale_units_per_unit')),selling_price_naira:Number(form.get('sale_unit_price'))}] : [],
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
    <PageHeading eyebrow="Catalog management" title="Drug master" description="Live medicine catalogue, barcodes, categories and unit details." action={canManage && <div className="flex gap-2"><input ref={upload} type="file" accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => void importCsv(e.target.files?.[0])}/><button disabled={importing} onClick={() => upload.current?.click()} className="flex items-center gap-2 rounded-xl border border-[#e5ece8] bg-white px-4 py-2.5 text-xs font-bold"><FileUp size={15}/>{importing ? 'Importing…' : 'Import CSV / Excel'}</button><button onClick={() => { setSelected(null); setFormError(''); setMode('add'); }} className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white"><Plus size={15}/>Add drug</button></div>} />
    {importMessage && <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">{importMessage}</div>}
    <div className="relative mb-5"><Search size={16} className="absolute left-3 top-3 text-[#99a8a1]"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search drug, SKU or barcode…" className="h-11 w-full rounded-xl border border-[#e8eeeb] bg-white pl-10 text-xs outline-none focus:border-brand-500"/></div>
    {error && <div className="mb-4"><ErrorState message={error} onRetry={load}/></div>}
    {loading ? <LoadingState label="Loading drug catalogue…"/> : <div className="overflow-hidden rounded-2xl border border-[#e9efeb] bg-white shadow-soft"><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead className="bg-[#f8faf9] text-[10px] font-bold uppercase tracking-wide text-[#95a39d]"><tr>{['Drug','SKU','Barcode','Category','Unit','Stock batches','Available units','Actions'].map((heading) => <th key={heading} className="px-5 py-4">{heading}</th>)}</tr></thead><tbody>{filtered.map((drug) => <tr key={drug.id} className="border-t border-[#f0f3f1] text-xs"><td className="px-5 py-4 font-bold"><Pill className="mr-2 inline text-brand-600" size={15}/>{drug.name}</td><td className="px-5 py-4">{drug.sku}</td><td className="px-5 py-4 text-[#7d8d86]">{drug.barcode || '—'}</td><td className="px-5 py-4 text-[#7d8d86]">{drug.category || '—'}</td><td className="px-5 py-4">{drug.unit}</td><td className="px-5 py-4">{drug.stocks?.length || 0}</td><td className="px-5 py-4 font-semibold">{drug.stocks?.reduce((total, stock) => total + Number(stock.quantity), 0) || 0}</td><td className="px-5 py-4"><div className="flex items-center gap-3"><button onClick={() => void openDrug(drug, 'view')} className="inline-flex items-center gap-1 font-semibold text-[#536a60] hover:text-brand-700"><Eye size={14}/>View</button>{canManage && <button onClick={() => void openDrug(drug, 'edit')} className="inline-flex items-center gap-1 font-semibold text-brand-700"><Pencil size={14}/>Edit</button>}</div></td></tr>)}{!filtered.length && <tr><td colSpan={8} className="px-5 py-10 text-center text-xs text-[#97a69f]">No drugs found.</td></tr>}</tbody></table></div></div>}

    {mode && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4"><div className="my-6 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-lg font-bold">{mode === 'add' ? 'Add drug' : mode === 'edit' ? 'Edit drug' : 'Drug details'}</h2><p className="mt-1 text-xs text-[#82928b]">{mode === 'view' ? 'Catalogue and current stock information.' : 'Keep the medicine catalogue details accurate.'}</p></div><button type="button" onClick={() => { setMode(null); setSelected(null); }} aria-label="Close drug details" className="rounded-lg p-2 text-[#82928b] hover:bg-gray-100"><X size={18}/></button></div>
      {formError && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">{formError}</div>}
      {mode === 'view' && selected ? <><dl className="grid gap-4 sm:grid-cols-2">{[['Drug name', selected.name], ['SKU', selected.sku], ['Barcode', selected.barcode || '—'], ['Category', selected.category || '—'], ['Base stock unit', selected.unit], ['Status', selected.is_active ? 'Active' : 'Inactive']].map(([label, value]) => <div key={label}><dt className="text-xs text-[#8b9a94]">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>)}</dl><div className="mt-6"><h3 className="mb-2 text-sm font-bold">Available stock</h3>{selected.stocks?.length ? <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-xs"><thead className="bg-[#f8faf9] text-[#84948d]"><tr>{['Batch','Department','Quantity','Expiry'].map((x) => <th key={x} className="px-3 py-2">{x}</th>)}</tr></thead><tbody>{selected.stocks.map((stock) => <tr key={stock.id} className="border-t"><td className="px-3 py-2">{stock.batch_no}</td><td className="px-3 py-2">{stock.department_name || '—'}</td><td className="px-3 py-2">{stock.quantity}</td><td className="px-3 py-2">{String(stock.expiry_date).slice(0, 10)}</td></tr>)}</tbody></table></div> : <p className="text-xs text-[#82928b]">No available stock batches.</p>}</div>{canManage && <button onClick={() => setMode('edit')} className="mt-5 h-11 w-full rounded-xl bg-brand-600 text-sm font-bold text-white">Edit drug</button>}</> : mode !== 'view' && <form onSubmit={save} className="space-y-3">{[['name','Drug name',selected?.name||''],['sku','SKU / item code',selected?.sku||''],['barcode','Barcode (optional)',selected?.barcode||''],['category','Category',selected?.category||''],['unit','Base unit (tablet, capsule…)',selected?.unit||'']].map(([name,label,value]) => <input key={name} name={name} required={name==='name'||name==='sku'||name==='unit'} defaultValue={value} placeholder={label} className="h-11 w-full rounded-xl border px-3 text-sm"/>)}<div className="rounded-xl border border-dashed p-3"><div className="mb-2 text-xs font-bold">Optional package sale unit</div><div className="grid gap-2 sm:grid-cols-3"><input name="sale_unit_name" defaultValue={selected?.sale_units?.[0]?.unit_name||''} placeholder="e.g. sachet" className="h-10 rounded-lg border px-3 text-xs"/><input name="sale_units_per_unit" type="number" min="2" defaultValue={selected?.sale_units?.[0]?.units_per_unit||''} placeholder="Units per package" className="h-10 rounded-lg border px-3 text-xs"/><input name="sale_unit_price" type="number" min="1" defaultValue={selected?.sale_units?.[0]?.selling_price_naira||''} placeholder="Package price ₦" className="h-10 rounded-lg border px-3 text-xs"/></div><p className="mt-2 text-[10px] text-[#82928b]">For example, base unit Tablet at ₦5 and Sachet containing 12 tablets at ₦100. Stock stays counted as individual tablets.</p></div><button disabled={saving} className="h-11 w-full rounded-xl bg-brand-600 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save drug'}</button></form>}
    </div></div>}
  </>;
}


