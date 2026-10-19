'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, ShieldCheck, X } from 'lucide-react';
import { PageHeading } from '@/components/shell';
import { ErrorState, LoadingState } from '@/components/data-state';
import { apiFetch, rows } from '@/lib/api';

type User = { id: number; name: string; email: string; role: string; is_active: boolean; department_id?: number | null; department?: { name: string } | null };
type Department = { id: number; name: string };
const roleName: Record<string, string> = { hod: 'HOD Super Admin', store_keeper: 'Central Store Keeper', pharmacy_staff: 'Pharmacy Staff', md: 'MD Management', doctor: 'Doctor' };

export default function Staff() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsMode, setDetailsMode] = useState<'view' | 'edit' | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [userResult, departmentResult] = await Promise.all([apiFetch<any>('/users'), apiFetch('/departments')]);
      const allUsers = rows<User>(userResult);
      const lastPage = Number(userResult?.last_page || 1);
      for (let page = 2; page <= lastPage; page++) {
        allUsers.push(...rows<User>(await apiFetch(`/users?page=${page}`)));
      }
      setUsers(allUsers);
      setDepartments(rows<Department>(departmentResult));
    } catch (e: any) {
      setError(e.message || 'Unable to load staff accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { try { setCurrentUserId(Number(JSON.parse(localStorage.getItem('bkd_user') || '{}').id) || null); } catch {} void load(); }, [load]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const departmentId = form.get('department_id');
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: String(form.get('name') || '').trim(),
          email: String(form.get('email') || '').trim(),
          password: String(form.get('password') || ''),
          role: form.get('role'),
          department_id: departmentId ? Number(departmentId) : null,
        }),
      });
      setOpen(false);
      await load();
    } catch (e: any) {
      setFormError(e.message || 'Could not create the staff account.');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(user: User) {
    setError('');
    try {
      await apiFetch(`/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !user.is_active }) });
      await load();
    } catch (e: any) {
      setError(e.message || 'Could not update the staff account.');
    }
  }

  async function removeUser(user: User) {
    if (!window.confirm(`Remove ${user.name}'s account? They will lose sign-in access. Past sales and audit records will be kept.`)) return;
    setError('');
    try {
      await apiFetch(`/users/${user.id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      setError(e.message || 'Could not remove this staff account.');
    }
  }

  async function openUser(user: User, mode: 'view' | 'edit') {
    setDetailsMode(mode);
    setSelectedUser(user);
    setDetailsLoading(true);
    setDetailsError('');
    try {
      const fullUser = await apiFetch<User>(`/users/${user.id}`);
      setSelectedUser(fullUser);
    } catch (e: any) {
      setDetailsError(e.message || 'Could not load user details.');
    } finally {
      setDetailsLoading(false);
    }
  }

  async function updateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser) return;
    setDetailsError('');
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const departmentId = form.get('department_id');
    try {
      const newPassword = String(form.get('password') || '');
      const updated = await apiFetch<User>(`/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: String(form.get('name') || '').trim(),
          email: String(form.get('email') || '').trim(),
          role: form.get('role'),
          department_id: departmentId ? Number(departmentId) : null,
          is_active: form.get('is_active') === 'true',
          ...(newPassword ? { password: newPassword } : {}),
        }),
      });
      setSelectedUser(updated);
      setDetailsMode('view');
      await load();
    } catch (e: any) {
      setDetailsError(e.message || 'Could not update this user.');
    } finally {
      setSaving(false);
    }
  }

  return <>
    <PageHeading eyebrow="Team access" title="Staff management" description="Manage user accounts and roles from the hospital database." action={<button onClick={() => { setFormError(''); setOpen(true); }} className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white"><Plus size={15} />Add staff member</button>} />

    <div className="mb-5 grid gap-4 sm:grid-cols-3">
      {[["Total users", users.length], ["Pharmacy staff", users.filter(user => user.role === 'pharmacy_staff').length], ["Active accounts", users.filter(user => user.is_active).length]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-[#e9efeb] bg-white p-5 shadow-soft"><div className="text-xs text-[#84948d]">{label}</div><div className="mt-2 text-2xl font-extrabold">{value}</div></div>)}
    </div>

    {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}
    {loading ? <LoadingState label="Loading staff accounts…" /> : <div className="overflow-hidden rounded-2xl border border-[#e9efeb] bg-white shadow-soft"><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead className="bg-[#f8faf9] text-[10px] font-bold uppercase tracking-wide text-[#95a39d]"><tr>{['Staff member', 'Email', 'Role', 'Department', 'Status', 'Actions'].map(label => <th key={label} className="px-5 py-4">{label}</th>)}</tr></thead><tbody>{users.map(user => <tr key={user.id} className="border-t border-[#f0f3f1] text-xs"><td className="px-5 py-4"><ShieldCheck size={15} className="mr-2 inline text-brand-700" /><b>{user.name}</b></td><td className="px-5 py-4">{user.email}</td><td className="px-5 py-4">{roleName[user.role] || user.role}</td><td className="px-5 py-4 text-[#7d8d86]">{user.department?.name || 'All departments'}</td><td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{user.is_active ? 'Active' : 'Disabled'}</span></td><td className="px-5 py-4"><div className="flex items-center gap-3"><button onClick={() => void openUser(user, 'view')} className="font-semibold text-[#536a60] hover:text-brand-700">View</button><button onClick={() => void openUser(user, 'edit')} className="font-semibold text-brand-700">Edit</button>{currentUserId === user.id ? <span className="text-[10px] text-[#8b9a94]">Current account</span> : <button onClick={() => user.is_active ? void removeUser(user) : void toggle(user)} className="font-semibold text-rose-700">{user.is_active ? 'Remove' : 'Enable'}</button>}</div></td></tr>)}{!users.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-xs text-[#97a69f]">No users found.</td></tr>}</tbody></table></div></div>}

    {open && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4"><div className="my-6 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-lg font-bold">Add staff account</h2><p className="mt-1 text-xs text-[#82928b]">Use a unique email and a password of at least 8 characters.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close form" className="rounded-lg p-2 text-[#82928b] hover:bg-gray-100"><X size={18} /></button></div>
      {formError && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-800">{formError}</div>}
      <form onSubmit={save} className="space-y-3"><input name="name" required placeholder="Full name" autoComplete="name" className="h-11 w-full rounded-xl border px-3 text-sm" /><input name="email" type="email" required placeholder="Email address" autoComplete="email" className="h-11 w-full rounded-xl border px-3 text-sm" /><input name="password" type="password" minLength={8} required placeholder="Temporary password (8+ characters)" autoComplete="new-password" className="h-11 w-full rounded-xl border px-3 text-sm" /><select name="role" required defaultValue="" className="h-11 w-full rounded-xl border px-3 text-sm"><option value="" disabled>Select role</option>{Object.entries(roleName).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select name="department_id" defaultValue="" className="h-11 w-full rounded-xl border px-3 text-sm"><option value="">All / no assigned department</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select><button type="submit" disabled={saving} className="flex h-11 w-full items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{saving ? 'Creating account…' : 'Create account'}</button></form>
    </div></div>}

    {detailsMode && selectedUser && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4"><div className="my-6 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-lg font-bold">{detailsMode === 'view' ? 'User details' : 'Edit user'}</h2><p className="mt-1 text-xs text-[#82928b]">Staff account #{selectedUser.id}</p></div><button type="button" onClick={() => { setDetailsMode(null); setDetailsError(''); }} aria-label="Close user details" className="rounded-lg p-2 text-[#82928b] hover:bg-gray-100"><X size={18} /></button></div>
      {detailsError && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-800">{detailsError}</div>}
      {detailsLoading ? <LoadingState label="Loading user details…" /> : detailsMode === 'view' ? <><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs text-[#8b9a94]">Full name</dt><dd className="mt-1 text-sm font-semibold">{selectedUser.name}</dd></div><div><dt className="text-xs text-[#8b9a94]">Email</dt><dd className="mt-1 text-sm font-semibold">{selectedUser.email}</dd></div><div><dt className="text-xs text-[#8b9a94]">Role</dt><dd className="mt-1 text-sm font-semibold">{roleName[selectedUser.role] || selectedUser.role}</dd></div><div><dt className="text-xs text-[#8b9a94]">Department</dt><dd className="mt-1 text-sm font-semibold">{selectedUser.department?.name || 'All departments'}</dd></div><div><dt className="text-xs text-[#8b9a94]">Account status</dt><dd className="mt-1 text-sm font-semibold">{selectedUser.is_active ? 'Active' : 'Disabled'}</dd></div></dl><button onClick={() => setDetailsMode('edit')} className="mt-6 h-11 w-full rounded-xl bg-brand-600 text-sm font-bold text-white">Edit user</button></> : <form onSubmit={updateUser} className="space-y-3"><label className="block text-xs font-semibold text-[#63786e]">Full name<input name="name" required defaultValue={selectedUser.name} className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal" /></label><label className="block text-xs font-semibold text-[#63786e]">Email<input name="email" type="email" required defaultValue={selectedUser.email} className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal" /></label><label className="block text-xs font-semibold text-[#63786e]">Role<select name="role" defaultValue={selectedUser.role} className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal">{Object.entries(roleName).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block text-xs font-semibold text-[#63786e]">Department<select name="department_id" defaultValue={selectedUser.department_id ?? ''} className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal"><option value="">No assigned department</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label><label className="block text-xs font-semibold text-[#63786e]">Account status<select name="is_active" defaultValue={String(selectedUser.is_active)} className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal"><option value="true">Active</option><option value="false">Disabled</option></select></label><label className="block text-xs font-semibold text-[#63786e]">New password (optional)<input name="password" type="password" minLength={8} autoComplete="new-password" placeholder="Leave empty to keep current password (8+ characters if changing)" className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal" /></label><button type="submit" disabled={saving} className="h-11 w-full rounded-xl bg-brand-600 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Saving changes…' : 'Save changes'}</button></form>}
    </div></div>}
  </>;
}
