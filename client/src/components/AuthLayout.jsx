import authBg from '../assets/auth-bg.png';

export function GoogleG() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.1.1-3.6 2.8v.1C3.5 21.4 7.4 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.5-2.7H1.5C.6 8.7 0 10.2 0 12s.6 3.3 1.5 4.8l3.7-2.4z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.4 0 3.5 2.6 1.5 6.8l3.7 2.9c1-2.9 3.7-5 6.8-5z" />
    </svg>
  );
}

export function AuthBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <img
        src={authBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* legibility overlays */}
      <div className="absolute inset-0 bg-[#0d0b2e]/55" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(8,5,25,.6) 100%)' }} />
    </div>
  );
}

export function AuthCard({ children }) {
  return (
    <div
      className="relative z-10 mx-auto w-full max-w-[440px] rounded-[30px] p-px shadow-[0_32px_80px_-24px_rgba(20,10,60,0.8),0_0_60px_-20px_rgba(139,124,255,0.35)]"
      style={{ background: 'linear-gradient(160deg, rgba(255,255,255,.5), rgba(255,255,255,.08) 30%, rgba(139,124,255,.35) 70%, rgba(255,255,255,.35))' }}
    >
      <div className="relative overflow-hidden rounded-[29px] bg-[#221c55]/40 px-8 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.2)] backdrop-blur-[28px] sm:px-10">
        {/* specular sheen */}
        <div
          className="pointer-events-none absolute inset-x-8 top-0 h-24"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.14), transparent)', filter: 'blur(6px)' }}
        />
        {children}
      </div>
    </div>
  );
}

export function AuthField({ id, label, suffix, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] text-white/60">{label}</label>
      <div className="relative">
        <input
          id={id}
          {...props}
          className="h-[52px] w-full rounded-2xl border border-white/20 bg-white/[0.06] px-5 pr-12 text-[15px] text-white placeholder:text-white/40 focus:border-[#9d8cff] focus:outline-none"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">{suffix}</span>
        )}
      </div>
    </div>
  );
}
