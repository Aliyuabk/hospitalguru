'use client';

import { Building2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { apiFetch, rows } from '@/lib/api';
import { PageHeading } from '@/components/shell';

type Department = { id: number; name: string; code: string; type: string };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setDepartments(rows<Department>(await apiFetch('/departments'))); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load departments.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function addDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setError(''); setNotice('');
    try {
      await apiFetch('/departments', { method: 'POST', body: JSON.stringify({ name }) });
      setName(''); setNotice('Department added.'); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not add department.'); }
    finally { setSaving(false); }
  }

  async function deleteDepartment(department: Department) {
    if (!window.confirm(`Remove ${department.name} from active departments? Historical records will be preserved.`)) return;
    setDeleting(department.id); setError(''); setNotice('');
    try {
      await apiFetch(`/departments/${department.id}`, { method: 'DELETE' });
      setNotice(`${department.name} removed.`); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not remove department.'); }
    finally { setDeleting(null); }
  }

  return <>
    <PageHeading eyebrow="Super admin" title="Manage departments" description="Add departments or remove them from active lists. Existing records are preserved." />
    <section className="mb-6 rounded-2xl border border-[#e9efeb] bg-white p-5 shadow-soft sm:p-6">
      <h2 className="mb-4 text-sm font-bold text-[#233b33]">Add a department</h2>
      <form onSubmit={addDepartment} className="flex flex-col gap-3 sm:flex-row">
        <input value={name} onChange={e => setName(e.target.value)} maxLength={255} required placeholder="Department name" aria-label="Department name" className="h-11 min-w-0 flex-1 rounded-xl border border-[#e3eae6] px-3 text-sm outline-none focus:border-brand-500" />
        <button disabled={saving || !name.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-xs font-bold text-white disabled:opacity-50"><Plus size={16}/>{saving ? 'Adding…' : 'Add department'}</button>
      </form>
      {error && <p role="alert" className="mt-3 text-xs font-medium text-rose-700">{error}</p>}
      {notice && <p role="status" className="mt-3 text-xs font-medium text-emerald-700">{notice}</p>}
    </section>
    <section className="overflow-hidden rounded-2xl border border-[#e9efeb] bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-[#edf1ef] px-5 py-4"><div><h2 className="text-sm font-bold">Active departments</h2><p className="mt-1 text-[11px] text-[#82928b]">{departments.length} department{departments.length === 1 ? '' : 's'}</p></div><button type="button" onClick={() => void load()} aria-label="Refresh departments" className="rounded-lg border border-[#e3eae6] p-2 text-[#71847b] hover:bg-[#f7f9f8]"><RefreshCw size={15}/></button></div>
      {loading ? <div className="px-5 py-12 text-center text-xs text-[#82928b]">Loading departments…</div> : departments.length ? <div className="divide-y divide-[#edf1ef]">{departments.map(department => <div key={department.id} className="flex items-center gap-3 px-5 py-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf7f1] text-brand-700"><Building2 size={18}/></span><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-[#2b443a]">{department.name}</div><div className="mt-1 truncate text-[10px] text-[#82928b]">{department.code}</div></div><button type="button" disabled={deleting === department.id} onClick={() => void deleteDepartment(department)} aria-label={`Remove ${department.name}`} className="inline-flex items-center gap-2 rounded-lg border border-rose-100 px-3 py-2 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={14}/>{deleting === department.id ? 'Removing…' : 'Remove'}</button></div>)}</div> : <div className="px-5 py-12 text-center text-xs text-[#82928b]">No active departments found.</div>}
    </section>
  </>;
}
