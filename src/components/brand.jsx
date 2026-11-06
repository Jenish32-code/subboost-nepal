export function YoutubeIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.07 0 12 0 12s0 3.93.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.8ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
    </svg>
  )
}

export function GoogleIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.3H12v4.3h6.5c-.1 1.1-.8 2.7-2.3 3.8l-.1.1 3.4 2.6.2.1c2.1-1.9 3.8-4.8 3.8-8.6Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.8-2.9l-3.7-2.9c-1 .7-2.3 1.2-4.1 1.2a7.1 7.1 0 0 1-6.7-4.9l-.1.1-3.5 2.7v.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.5A7.3 7.3 0 0 1 4.9 12c0-.9.2-1.7.4-2.5v-.1L1.7 6.6l-.1.1A12 12 0 0 0 .4 12c0 1.9.5 3.7 1.2 5.3l3.7-2.8Z" />
      <path fill="#EA4335" d="M12 4.7c2.3 0 3.8 1 4.7 1.8l3.2-3.1C17.9 1.6 15.2.4 12 .4A12 12 0 0 0 1.6 6.7l3.7 2.8A7.1 7.1 0 0 1 12 4.7Z" />
    </svg>
  )
}

export function KhaltiMark({ className = 'h-9 w-9' }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-[#5C2D91] font-extrabold text-white ${className}`}
      aria-hidden="true"
    >
      <span className="text-[1.05em] leading-none tracking-tight">K</span>
    </span>
  )
}

export function EsewaMark({ className = 'h-9 w-9' }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-[#60BB46] font-extrabold text-white ${className}`}
      aria-hidden="true"
    >
      <span className="text-[1.05em] leading-none lowercase">e</span>
    </span>
  )
}

export function BrandMark({ className = 'h-10 w-10' }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-gradient-to-br from-[#ff3b30] via-[#ff0000] to-[#9e0009] shadow-[0_10px_26px_-10px_rgba(255,0,0,0.9)] ${className}`}
      aria-hidden="true"
    >
      <YoutubeIcon className="h-[58%] w-[58%] text-white drop-shadow" />
      <span className="absolute inset-x-0 top-0 h-1/2 bg-white/15" />
    </span>
  )
}

export function Logo({ compact = false, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <BrandMark className={compact ? 'h-9 w-9' : 'h-11 w-11'} />
      <div className="leading-none">
        <p className={`font-extrabold tracking-tight text-white ${compact ? 'text-[15px]' : 'text-[19px]'}`}>
          SubBoost
          <span className="ml-1 bg-gradient-to-r from-[#ff3b30] to-[#ff7a70] bg-clip-text text-transparent">
            Nepal
          </span>
        </p>
        {!compact && (
          <p className="mt-1 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Grow · Earn · Cash out
          </p>
        )}
      </div>
    </div>
  )
}

export function GatewayMark({ method, className = 'h-9 w-9' }) {
  return method === 'khalti' ? <KhaltiMark className={className} /> : <EsewaMark className={className} />
}
