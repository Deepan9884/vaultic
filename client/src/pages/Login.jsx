import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthBackdrop, AuthCard, AuthField, GoogleG } from '../components/AuthLayout.jsx';
import { VaultMark } from '../components/Logo.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
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
      await login(form.email, form.password, remember);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not sign in with those credentials.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="font-poppins relative flex min-h-screen items-center justify-center px-4 py-10">
      <AuthBackdrop />
      <AuthCard>
        <div className="flex justify-center">
          <VaultMark size={52} />
        </div>
        <h1 className="mt-4 text-center text-[34px] font-medium leading-tight text-white">Welcome back!</h1>
        <p className="mx-auto mt-2 max-w-[320px] text-center text-[13px] leading-relaxed text-white/60">
          Sign in to access your documents, team spaces, and shared knowledge
        </p>

        <form onSubmit={submit} className="mt-7 space-y-5">
          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-2.5 text-[13px] text-red-200">{error}</p>
          )}
          {notice && (
            <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-[13px] text-white/80">{notice}</p>
          )}

          <AuthField
            id="email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoComplete="email"
          />

          <AuthField
            id="password"
            label="Password"
            type={showPw ? 'text' : 'password'}
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete="current-password"
            suffix={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="transition hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
              </button>
            }
          />

          <div className="flex items-center justify-between text-[13px]">
            <label className="flex cursor-pointer items-center gap-2 text-white/85">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded accent-[#8b5cf6]"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => setNotice('Ask your workspace admin to reset your password.')}
              className="text-white/85 hover:text-white hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button disabled={busy} className="h-[52px] w-full rounded-full bg-white text-[15px] font-semibold text-[#241d55] transition hover:bg-white/90 disabled:opacity-60">
            {busy ? 'Signing in…' : 'Log In'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-white/15" />
          <span className="text-xs text-white/50">Or</span>
          <span className="h-px flex-1 bg-white/15" />
        </div>

        <button
          type="button"
          onClick={() => setNotice('Google sign-in is not enabled for this workspace — use your email and password.')}
          className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full border border-white/25 bg-white/[0.04] text-sm font-medium text-white transition hover:bg-white/10"
        >
          <GoogleG /> Sign In with Google
        </button>

        <p className="mt-7 text-center text-[13px] text-white/60">
          Don't have an account? <Link className="font-semibold text-white hover:underline" to="/register">Sign Up</Link>
        </p>
      </AuthCard>
    </div>
  );
}
