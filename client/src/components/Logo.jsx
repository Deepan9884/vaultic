export function VaultMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" role="img" aria-label="Vaultic logo">
      <defs>
        <linearGradient id="vault-g" x1="8" y1="2" x2="32" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8b8bf5" />
          <stop offset="0.5" stopColor="#5b5bd6" />
          <stop offset="1" stopColor="#352a86" />
        </linearGradient>
        <linearGradient id="vault-glass" x1="5" y1="5" x2="35" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="vault-depth" x1="20" y1="18" x2="20" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1c1450" stopOpacity="0" />
          <stop offset="1" stopColor="#1c1450" stopOpacity="0.45" />
        </linearGradient>
        <clipPath id="vault-clip">
          <path d="M20 2.5 34.5 8v11.5c0 9.5-6.2 14.6-14.5 17C11.7 34.1 5.5 29 5.5 19.5V8L20 2.5Z" />
        </clipPath>
      </defs>
      <path
        d="M20 2.5 34.5 8v11.5c0 9.5-6.2 14.6-14.5 17C11.7 34.1 5.5 29 5.5 19.5V8L20 2.5Z"
        fill="url(#vault-g)"
      />
      {/* liquid glass overlays */}
      <g clipPath="url(#vault-clip)">
        <rect x="0" y="0" width="40" height="40" fill="url(#vault-glass)" />
        <rect x="0" y="0" width="40" height="40" fill="url(#vault-depth)" />
        <ellipse cx="14" cy="8" rx="10" ry="5" fill="#fff" opacity="0.35" transform="rotate(-18 14 8)" />
      </g>
      {/* lit edge */}
      <path
        d="M20 2.5 34.5 8v11.5c0 9.5-6.2 14.6-14.5 17C11.7 34.1 5.5 29 5.5 19.5V8L20 2.5Z"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.65"
        strokeWidth="1.2"
      />
      <path d="M8 8.5 20 3.8l9.5 3.7" fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M20 7 30.5 11v8.5c0 7-4.4 10.9-10.5 12.7C13.9 30.4 9.5 26.5 9.5 19.5V11L20 7Z"
        stroke="#fff"
        strokeOpacity="0.4"
        strokeWidth="1.2"
        fill="none"
      />
      {/* keyhole */}
      <circle cx="20" cy="17.5" r="4" fill="#fff" />
      <path d="M18.4 20.2 17 26.5h6l-1.4-6.3Z" fill="#fff" />
      <circle cx="18.6" cy="16.2" r="1.1" fill="#8b8bf5" opacity="0.8" />
    </svg>
  );
}

export default function Logo({ tone = 'dark', size = 30 }) {
  return (
    <span className="flex items-center gap-2">
      <VaultMark size={size} />
      <span
        className={`text-[16px] font-bold leading-none tracking-[-0.01em] ${tone === 'light' ? 'text-white' : 'text-[#2e2950]'}`}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700 }}
      >
        Vaultic
      </span>
    </span>
  );
}
