'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Camera, KeyRound, Save, UserRound } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { PageHeading } from '@/components/shell';

type AccountUser = { id: number; name: string; email: string; phone?: string | null; designation?: string | null; employee_id?: string | null; address?: string | null; emergency_contact_name?: string | null; emergency_contact_phone?: string | null; professional_license_no?: string | null; profile_photo_url?: string | null };
type ProfileFields = Pick<AccountUser, 'phone' | 'designation' | 'employee_id' | 'address' | 'emergency_contact_name' | 'emergency_contact_phone' | 'professional_license_no'>;
const emptyProfile: ProfileFields = { phone: '', designation: '', employee_id: '', address: '', emergency_contact_name: '', emergency_contact_phone: '', professional_license_no: '' };
const inputClass = 'mt-1 h-11 w-full rounded-xl border border-[#e5ece8] px-3 text-sm text-[#233b33]';

export default function AccountPage() {
  const [user, setUser] = useState<AccountUser>(() => {
    if (typeof window === 'undefined') return { id: 0, name: '', email: '' };
    try { return JSON.parse(localStorage.getItem('bkd_user') || '{"id":0,"name":"","email":""}'); }
    catch { return { id: 0, name: '', email: '' }; }
  });
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [profile, setProfile] = useState<ProfileFields>({ ...emptyProfile, ...user });
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(user.profile_photo_url || null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void apiFetch<AccountUser>('/me').then(actual => {
      setUser(actual); setName(actual.name); setEmail(actual.email); setProfile({ ...emptyProfile, ...actual }); setPreview(actual.profile_photo_url || null);
      const cached = JSON.parse(localStorage.getItem('bkd_user') || '{}');
      localStorage.setItem('bkd_user', JSON.stringify({ ...cached, ...actual }));
    }).catch(() => {});
  }, []);

  function choosePhoto(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Choose a JPG, PNG, or WebP image.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Profile photos must be 2 MB or smaller.'); return; }
    setError(''); setPhoto(file); setPreview(URL.createObjectURL(file));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(''); setError('');
    const form = new FormData();
    form.set('name', name.trim()); form.set('email', email.trim());
    for (const [key, value] of Object.entries(profile)) form.set(key, value || '');
    if (photo) form.set('profile_photo', photo);
    if (password) { form.set('current_password', currentPassword); form.set('password', password); form.set('password_confirmation', passwordConfirmation); }
    else if (email.trim() !== user.email) form.set('current_password', currentPassword);
    try {
      const updated = await apiFetch<AccountUser>('/account/profile', { method: 'PATCH', body: form });
      const stored = { ...JSON.parse(localStorage.getItem('bkd_user') || '{}'), ...updated };
      localStorage.setItem('bkd_user', JSON.stringify(stored)); window.dispatchEvent(new CustomEvent('bkd:profile', { detail: stored }));
      setUser(updated); setName(updated.name); setEmail(updated.email); setProfile({ ...emptyProfile, ...updated }); setPreview(updated.profile_photo_url || null); setPhoto(null);
      setCurrentPassword(''); setPassword(''); setPasswordConfirmation('');
      setMessage('Your account information has been updated.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update your account.'); }
    finally { setSaving(false); }
  }

  function field(key: keyof ProfileFields, label: string, options: { type?: string; wide?: boolean; autoComplete?: string } = {}) {
    return <label key={key} className={`text-xs font-semibold text-[#63786e] ${options.wide ? 'sm:col-span-2' : ''}`}>{label}<input type={options.type || 'text'} autoComplete={options.autoComplete} maxLength={key === 'address' ? 500 : undefined} value={profile[key] || ''} onChange={event => setProfile(current => ({ ...current, [key]: event.target.value }))} className={inputClass} /></label>;
  }

  const initials = (name || user.name).split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

  return <>
    <PageHeading eyebrow="Personal settings" title="Profile & account" description="Manage your contact details, work information, profile photo, and password." />
    <form onSubmit={save} className="max-w-3xl rounded-2xl border border-[#e9efeb] bg-white p-5 shadow-soft sm:p-7">
      <div className="mb-7 flex items-center gap-4">
        {preview ? <img src={preview} alt="Profile" className="h-20 w-20 rounded-full object-cover ring-4 ring-[#edf7f1]" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e3f1eb] text-lg font-bold text-brand-700 ring-4 ring-[#edf7f1]">{initials || <UserRound />}</div>}
        <div><button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e5ece8] px-3 text-xs font-bold text-[#425c51] hover:bg-[#f7f9f8]"><Camera size={15} />Choose profile photo</button><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => choosePhoto(event.target.files?.[0])} className="hidden"/><p className="mt-2 text-[11px] text-[#82928b]">JPG, PNG, or WebP. Maximum 2 MB.</p></div>
      </div>
      <h2 className="mb-3 text-sm font-bold text-[#233b33]">Basic information</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-[#63786e]">Full name<input required maxLength={255} autoComplete="name" value={name} onChange={event => setName(event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-semibold text-[#63786e]">Email address<input required type="email" maxLength={255} autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className={inputClass} /></label>
        {field('phone', 'Phone number', { type: 'tel', autoComplete: 'tel' })}
        {field('designation', 'Designation / job title', { autoComplete: 'organization-title' })}
        {field('employee_id', 'Staff / employee ID')}
        {field('professional_license_no', 'Professional registration / license no.')}
        {field('address', 'Contact address', { wide: true, autoComplete: 'street-address' })}
      </div>
      <div className="my-7 border-t border-[#edf1ef]" />
      <h2 className="mb-3 text-sm font-bold text-[#233b33]">Emergency contact</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('emergency_contact_name', 'Contact name', { autoComplete: 'off' })}
        {field('emergency_contact_phone', 'Contact phone', { type: 'tel', autoComplete: 'off' })}
      </div>
      <div className="my-7 border-t border-[#edf1ef]" />
      <h2 className="flex items-center gap-2 text-sm font-bold text-[#233b33]"><KeyRound size={16} className="text-brand-600" />Change password</h2>
      <p className="mt-1 text-xs text-[#82928b]">Leave password fields blank to keep your current password. Your current password is required to change your email or password.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="text-xs font-semibold text-[#63786e]">Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-semibold text-[#63786e]">New password<input type="password" autoComplete="new-password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-semibold text-[#63786e]">Confirm new password<input type="password" autoComplete="new-password" minLength={8} value={passwordConfirmation} onChange={event => setPasswordConfirmation(event.target.value)} className={inputClass} /></label>
      </div>
      {error && <div role="alert" className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{error}</div>}
      {message && <div role="status" className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{message}</div>}
      <div className="mt-6 flex justify-end"><button disabled={saving} className="h-11 rounded-xl bg-brand-600 px-5 text-xs font-bold text-white disabled:opacity-60"><Save size={14} className="mr-2 inline" />{saving ? 'Saving…' : 'Save account changes'}</button></div>
    </form>
  </>;
}
