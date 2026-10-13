import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthBackdrop, AuthCard, AuthField, GoogleG } from '../components/AuthLayout.jsx';
import { VaultMark } from '../components/Logo.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', team: '', role: 'employee' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the account.');
    } finally {
      setBusy(false);
    }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const eye = (
    <button
      type="button"
      onClick={() => setShowPw((v) => !v)}
      aria-label={showPw ? 'Hide password' : 'Show password'}
      className="transition hover:text-white"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
    </button>
  );

  return (
    <div className="font-poppins relative flex min-h-screen items-center justify-center px-4 py-10">
      <AuthBackdrop />
      <AuthCard>
        <div className="flex justify-center">
          <VaultMark size={52} />
        </div>
        <h1 className="mt-4 text-center text-[34px] font-medium leading-tight text-white">Create account!</h1>
        <p className="mx-auto mt-2 max-w-[320px] text-center text-[13px] leading-relaxed text-white/60">
          Sign up to search, share, and organize your team's knowledge
        </p>

        <form onSubmit={submit} className="mt-7 space-y-5">
          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-2.5 text-[13px] text-red-200">{error}</p>
          )}
          {notice && (
            <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-[13px] text-white/80">{notice}</p>
          )}

          <AuthField
            id="name"
            label="Full name"
            placeholder="Enter your name"
            value={form.name}
            onChange={set('name')}
            required
          />
          <AuthField
            id="email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="team" className="mb-1.5 block text-[13px] text-white/60">Team</label>
              <input
                id="team"
                placeholder="e.g. eng"
                value={form.team}
                onChange={set('team')}
                className="h-[52px] w-full rounded-2xl border border-white/20 bg-white/[0.06] px-5 text-[15px] text-white placeholder:text-white/40 focus:border-[#9d8cff] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="role" className="mb-1.5 block text-[13px] text-white/60">Role</label>
              <select
                id="role"
                value={form.role}
                onChange={set('role')}
                className="h-[52px] w-full appearance-none rounded-2xl border border-white/20 bg-white/[0.06] px-5 text-[15px] text-white focus:border-[#9d8cff] focus:outline-none [&>option]:text-slate-900"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>
          <AuthField
            id="password"
            label="Password"
            type={showPw ? 'text' : 'password'}
            placeholder="At least 6 characters"
            value={form.password}
            onChange={set('password')}
            required
            autoComplete="new-password"
            suffix={eye}
          />

          <button disabled={busy} className="h-[52px] w-full rounded-full bg-white text-[15px] font-semibold text-[#241d55] transition hover:bg-white/90 disabled:opacity-60">
            {busy ? 'Creating…' : 'Sign Up'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-white/15" />
          <span className="text-xs text-white/50">Or</span>
          <span className="h-px flex-1 bg-white/15" />
        </div>

        <button
          type="button"
          onClick={() => setNotice('Google sign-up is not enabled for this workspace — use the form above.')}
          className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full border border-white/25 bg-white/[0.04] text-sm font-medium text-white transition hover:bg-white/10"
        >
          <GoogleG /> Sign Up with Google
        </button>

        <p className="mt-7 text-center text-[13px] text-white/60">
          Already have an account? <Link className="font-semibold text-white hover:underline" to="/login">Sign In</Link>
        </p>
      </AuthCard>
    </div>
  );
}
