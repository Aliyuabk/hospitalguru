'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UiIcon from '@/app/UiIcon';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setup, setSetup] = useState(false);
  const [dbReady, setDbReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/setup')
      .then(async response => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(data => { setSetup(data.setup_required); setDbReady(true); })
      .catch(() => setDbReady(false));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign-in failed.');
      router.replace(data.redirect);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <div className="auth-brand-photo"><Image src="/images.jpg" alt="" fill priority sizes="43vw" /></div>
        <div className="auth-brand-content">
          <div className="auth-logo"><Image src="/logo.jpeg" alt="BKD General Hospital" width={47} height={56} priority /></div>
          <div className="auth-brand-name">BKD <b>GENERAL HOSPITAL</b></div>
          <div className="auth-divider" />
          <p>Pharmacy Inventory,<br />Dispensing &amp; Management</p>
          <div className="auth-art" aria-hidden="true"><div className="auth-ring ring-one" /><div className="auth-ring ring-two" /><div className="auth-cross">+</div><div className="art-pill pill-a" /><div className="art-pill pill-b" /><div className="art-card"><span>PHARMACY</span><b>Care, organized.</b><i className="auth-dots"><span/><span/><span/></i></div></div>
          <small className="auth-brand-footer">Trusted care. Better operations.</small>
        </div>
      </section>

      <section className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-mark"><Image src="/logo.jpeg" alt="BKD General Hospital" width={28} height={34} /> BKD GENERAL HOSPITAL</div>
          <div className="auth-kicker">PHARMACY MANAGEMENT SYSTEM</div>
          <h1>Welcome back</h1>
          <p className="auth-description">Sign in to continue to your workspace.</p>
          {error && <div className="auth-error" role="alert"><span>!</span>{error}</div>}
          {dbReady === false && <div className="auth-error" role="status"><span>!</span>Database connection unavailable. Start XAMPP MySQL and import database/schema.sql.</div>}
          {dbReady && setup && <div className="auth-info"><span>i</span><div><b>First time setup</b><small>Create the initial Super Administrator account for this installation.</small><Link href="/setup">Create administrator account <span aria-hidden="true">{'\u2192'}</span></Link></div></div>}

          <form onSubmit={submit}>
            <label htmlFor="username">Username or email</label>
            <div className="auth-input"><span><UiIcon name="user" size={17} /></span><input id="username" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="Enter your username" required /></div>
            <div className="auth-label-row"><label htmlFor="password">Password</label><Link href="/forgot-password">Forgot password?</Link></div>
            <div className="auth-input"><span><UiIcon name="lock" size={17} /></span><input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" required /><button className="auth-password-toggle" type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}><UiIcon name={show ? 'eye-off' : 'eye'} size={16} /></button></div>
            <div className="auth-session-note">Sessions expire automatically after 12 hours.</div>
            <button className={`auth-submit ${loading ? 'is-loading' : ''}`} aria-busy={loading} disabled={loading || dbReady === false}>{loading ? 'Signing in...' : 'Sign in'}<span aria-hidden="true">{'\u2192'}</span></button>
          </form>

          <div className="auth-secure"><span><UiIcon name="shield" size={15} /></span>Secure access. Your role determines your workspace and permissions.</div>
          <div className="auth-footer">Need help accessing your account? <a href="mailto:it@bkdmedical.com.ng">Contact hospital IT</a></div>
        </div>
        <div className="auth-copyright">© {new Date().getFullYear()} BKD General Hospital <span>·</span> Powered by Kowgururu Technology Limited</div>
      </section>
    </main>
  );
}
