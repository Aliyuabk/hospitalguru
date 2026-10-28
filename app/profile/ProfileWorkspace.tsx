'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import LoadingIndicator from '@/app/LoadingIndicator';
import UiIcon from '@/app/UiIcon';

type User = {
  id: number;
  name: string;
  username: string;
  email: string | null;
  role_key: string;
  role_name: string;
  location_name: string | null;
  location_names?: string;
  staff_id?: string | null;
  last_login_at?: string | null;
};

const moduleLabels: Record<string, string> = {
  dashboard: 'Dashboard', notifications: 'Notifications', users: 'User accounts', roles: 'Roles',
  locations: 'Locations', settings: 'Settings', drug_catalogue: 'Drug catalogue', suppliers: 'Suppliers',
  inventory: 'Inventory', grns: 'Goods received', transfers: 'Transfers', returns: 'Returns',
  stock_requests: 'Stock requests', sales: 'Sales', payments: 'Payments', procurement: 'Procurement',
  stock_counts: 'Stock counts', audit_logs: 'Audit logs', system_health: 'System health',
};

export default function ProfileWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/auth/me').then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Account details could not be loaded.');
        return body.user as User;
      }),
      fetch('/api/admin?resource=my_permissions').then(async response => {
        const body = await response.json();
        return response.ok && Array.isArray(body.data) ? body.data.map((row: { permission_key: string }) => row.permission_key) : [];
      }).catch(() => [] as string[]),
    ]).then(([account, access]) => {
      if (active) { setUser(account); setPermissions(access); }
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Account details could not be loaded.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const key of permissions) {
      const [module, action] = key.split('.');
      if (!module || !action) continue;
      groups.set(module, [...(groups.get(module) || []), action]);
    }
    return [...groups.entries()];
  }, [permissions]);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (passwords.new_password !== passwords.confirm_password) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    setPasswordBusy(true);
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: passwords.current_password, new_password: passwords.new_password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Password could not be changed.');
      setPasswordMessage('Password updated. Other signed-in sessions have been revoked.');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (reason) {
      setPasswordError(reason instanceof Error ? reason.message : 'Password could not be changed.');
    } finally {
      setPasswordBusy(false);
    }
  }

  if (loading) return <section className="panel profile-loading"><LoadingIndicator>Loading your account profile</LoadingIndicator></section>;
  if (error || !user) return <div className="auth-error" role="alert">{error || 'Account details could not be loaded.'}</div>;

  const initials = user.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'U';
  return <div className="profile-workspace">
    <section className="panel profile-identity">
      <div className="profile-identity-avatar">{initials}</div>
      <div className="profile-identity-copy"><span className="eyebrow">SIGNED-IN ACCOUNT</span><h2>{user.name}</h2><p>{user.role_name} {user.location_names || user.location_name ? `· ${user.location_names || user.location_name}` : ''}</p></div>
      <span className="profile-active"><i /> Active</span>
    </section>

    <div className="profile-workspace-grid">
      <div className="profile-main-column">
        <section className="panel profile-section">
          <div className="profile-section-heading"><span className="profile-section-icon"><UiIcon name="user" size={19} /></span><div><h2>Account details</h2><p>Your identity and assigned hospital access.</p></div></div>
          <div className="profile-detail-grid">
            <div><span>Full name</span><b>{user.name}</b></div>
            <div><span>Username</span><b>{user.username}</b></div>
            <div><span>Email</span><b>{user.email || 'Not provided'}</b></div>
            <div><span>Staff ID</span><b>{user.staff_id || 'Not assigned'}</b></div>
            <div><span>Assigned role</span><b>{user.role_name}</b></div>
            <div><span>Hospital location</span><b>{user.location_names || user.location_name || 'Role-wide access'}</b></div>
            <div><span>Last sign-in</span><b>{user.last_login_at ? new Date(user.last_login_at).toLocaleString('en-NG') : 'Not recorded'}</b></div>
          </div>
        </section>

        <section className="panel profile-section profile-access-section">
          <div className="profile-section-heading"><span className="profile-section-icon"><UiIcon name="shield" size={19} /></span><div><h2>Role access</h2><p>Actions available to your account, based on assigned permissions.</p></div></div>
          {permissionGroups.length ? <div className="profile-access-list">{permissionGroups.map(([module, actions]) => <div className="profile-access-row" key={module}><b>{moduleLabels[module] || module.replaceAll('_', ' ')}</b><div>{actions.map(action => <span key={action}>{action}</span>)}</div></div>)}</div> : <p className="profile-no-access">No module permissions are currently assigned. Contact your hospital administrator.</p>}
          <small className="profile-access-note">Permissions are checked by the server for each protected action. A role title alone does not grant access.</small>
        </section>
      </div>

      <section id="security" className="panel profile-section profile-security-section">
        <div className="profile-section-heading"><span className="profile-section-icon"><UiIcon name="lock" size={19} /></span><div><h2>Security</h2><p>Manage your account credentials.</p></div></div>
        <form className="password-change-form" onSubmit={changePassword}>
          <div className="field"><label htmlFor="current-password">Current password</label><input id="current-password" type="password" autoComplete="current-password" value={passwords.current_password} onChange={event => setPasswords({ ...passwords, current_password: event.target.value })} required /></div>
          <div className="field"><label htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={10} value={passwords.new_password} onChange={event => setPasswords({ ...passwords, new_password: event.target.value })} required /><small>Use at least 10 characters.</small></div>
          <div className="field"><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={10} value={passwords.confirm_password} onChange={event => setPasswords({ ...passwords, confirm_password: event.target.value })} required /></div>
          {passwordError && <div className="auth-error" role="alert">{passwordError}</div>}
          {passwordMessage && <div className="auth-info" role="status">{passwordMessage}</div>}
          <button className="button button-primary" disabled={passwordBusy}>{passwordBusy ? 'Updating…' : 'Change password'}</button>
        </form>
        <div className="profile-security-note"><UiIcon name="shield" size={16} /><span>Changing your password revokes other signed-in sessions.</span></div>
      </section>
    </div>
  </div>;
}
