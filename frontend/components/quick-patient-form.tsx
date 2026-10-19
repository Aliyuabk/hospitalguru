'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export type PatientRecord = { id: number; folder_no: string; full_name: string; phone: string | null; nhis_number: string | null };

export function QuickPatientForm({ onCreated, onClose }: { onCreated: (patient: PatientRecord) => void; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const patient = await apiFetch<PatientRecord>('/patients', {
        method: 'POST',
        body: JSON.stringify({
          full_name: String(form.get('full_name') || '').trim(),
          folder_no: String(form.get('folder_no') || '').trim(),
          phone: String(form.get('phone') || '').trim() || null,
          nhis_number: String(form.get('nhis_number') || '').trim() || null,
        }),
      });
      onCreated(patient);
    } catch (e: any) {
      setError(e.message || 'Could not add this patient.');
    } finally {
      setSaving(false);
    }
  }

  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="quick-patient-title" className="my-6 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between"><div><h2 id="quick-patient-title" className="text-lg font-bold">Add patient to this sale</h2><p className="mt-1 text-xs text-[#82928b]">The new patient will be selected automatically.</p></div><button type="button" onClick={onClose} aria-label="Close form" className="rounded-lg p-2 text-[#82928b] hover:bg-gray-100"><X size={18} /></button></div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">{error}</div>}
      <form onSubmit={save} className="space-y-3">
        <input name="full_name" required autoFocus placeholder="Patient full name" className="h-11 w-full rounded-xl border px-3 text-sm" />
        <input name="folder_no" required placeholder="Hospital folder number" className="h-11 w-full rounded-xl border px-3 text-sm" />
        <input name="phone" type="tel" placeholder="Phone number (optional)" className="h-11 w-full rounded-xl border px-3 text-sm" />
        <input name="nhis_number" placeholder="NHIS number (optional)" className="h-11 w-full rounded-xl border px-3 text-sm" />
        <div className="flex gap-2 pt-1"><button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl border text-sm font-semibold">Cancel</button><button type="submit" disabled={saving} className="h-11 flex-1 rounded-xl bg-brand-600 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Adding patient…' : 'Add & select patient'}</button></div>
      </form>
    </section>
  </div>;
}
