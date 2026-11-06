import { useEffect } from 'react'
import { createPortal } from 'react-dom'

let scrollLocks = 0
let previousOverflow = ''
import { Loader2, X } from 'lucide-react'
import { initialsOf, gradientFor } from '../lib/utils'

/* ----------------------------------------------------------------------------
 * Avatar — auto-generated gradient circle with the first letter of the name.
 * -------------------------------------------------------------------------- */
export function Avatar({ name = '', size = 'md', ring = false, className = '' }) {
  const sizes = {
    xs: 'h-7 w-7 text-[11px]',
    sm: 'h-9 w-9 text-sm',
    md: 'h-11 w-11 text-base',
    lg: 'h-14 w-14 text-xl',
    xl: 'h-20 w-20 text-3xl',
    '2xl': 'h-24 w-24 text-4xl',
  }
  return (
    <span
      className={`relative inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-extrabold text-white shadow-lg shadow-black/40 ${gradientFor(name)} ${sizes[size]} ${
        ring ? 'ring-2 ring-white/25 ring-offset-2 ring-offset-[#0b1120]' : ''
      } ${className}`}
      aria-hidden="true"
    >
      <span className="absolute inset-0 rounded-full bg-gradient-to-t from-black/25 to-transparent" />
      <span className="relative drop-shadow-sm">{initialsOf(name)}</span>
    </span>
  )
}

/* ----------------------------------------------------------------------------
 * Button
 * -------------------------------------------------------------------------- */
const buttonVariants = {
  primary:
    'bg-gradient-to-r from-[#ff2d20] via-[#f50000] to-[#c00009] text-white shadow-[0_12px_30px_-14px_rgba(255,45,32,0.95)] hover:brightness-110 active:brightness-95',
  secondary:
    'bg-white/[0.06] text-slate-100 border border-white/10 hover:bg-white/[0.1] hover:border-white/20',
  ghost: 'text-slate-300 hover:text-white hover:bg-white/[0.07]',
  purple:
    'bg-gradient-to-r from-[#7c3aed] to-[#5C2D91] text-white shadow-[0_12px_30px_-14px_rgba(124,58,237,0.9)] hover:brightness-110',
  green:
    'bg-gradient-to-r from-[#34d399] to-[#0f9f6e] text-[#04231a] shadow-[0_12px_30px_-14px_rgba(16,185,129,0.9)] hover:brightness-105 font-extrabold',
  danger: 'bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25',
  outline: 'border border-white/15 text-slate-200 hover:bg-white/[0.06] hover:border-white/25',
}

const buttonSizes = {
  sm: 'h-9 gap-1.5 px-3.5 text-[13px] rounded-xl',    md: 'h-11 gap-2 px-[18px] text-sm rounded-xl',
    lg: 'h-12 gap-2 px-5 text-[15px] rounded-2xl',
    xl: 'h-[52px] gap-2.5 px-6 text-base rounded-2xl',
  icon: 'h-10 w-10 rounded-xl',
}

export function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  return (
    <Tag
      className={`inline-flex select-none items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b30]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1120] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Tag>
  )
}

/* ----------------------------------------------------------------------------
 * Status badge
 * -------------------------------------------------------------------------- */
const badgeStyles = {
  pending: { cls: 'bg-amber-400/10 text-amber-300 border-amber-400/25', dot: 'bg-amber-400' },
  approved: { cls: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25', dot: 'bg-emerald-400' },
  rejected: { cls: 'bg-rose-500/10 text-rose-300 border-rose-500/25', dot: 'bg-rose-400' },
  active: { cls: 'bg-sky-400/10 text-sky-300 border-sky-400/25', dot: 'bg-sky-400' },
  completed: { cls: 'bg-indigo-400/10 text-indigo-300 border-indigo-400/25', dot: 'bg-indigo-400' },
  paused: { cls: 'bg-amber-400/10 text-amber-300 border-amber-400/25', dot: 'bg-amber-400' },
  flagged: { cls: 'bg-orange-500/10 text-orange-300 border-orange-500/25', dot: 'bg-orange-400' },
  cancelled: { cls: 'bg-slate-500/10 text-slate-300 border-slate-500/25', dot: 'bg-slate-400' },
  verified: { cls: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25', dot: 'bg-emerald-400' },
  info: { cls: 'bg-white/[0.06] text-slate-300 border-white/10', dot: 'bg-slate-400' },
}

export function StatusBadge({ status = 'pending', label, className = '', dot = true }) {
  const style = badgeStyles[String(status).toLowerCase()] || badgeStyles.info
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${style.cls} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />}
      {label || status}
    </span>
  )
}

/* ----------------------------------------------------------------------------
 * Progress
 * -------------------------------------------------------------------------- */
export function ProgressBar({ value = 0, max = 1, tone = 'red', showLabel = false, className = '' }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const tones = {
    red: 'from-[#ff3b30] to-[#ff8a65]',
    green: 'from-emerald-400 to-teal-300',
    purple: 'from-violet-400 to-fuchsia-400',
    amber: 'from-amber-400 to-orange-400',
  }
  return (
    <div className={className}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out ${tones[tone] || tones.red}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-slate-400">
          <span>
            {value} / {max}
          </span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * Modal
 * -------------------------------------------------------------------------- */
export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  icon,
  size = 'md',
  locked = false,
  bare = false,
  className = '',
  bodyClassName = '',
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape' && !locked) onClose?.()
    }
    document.addEventListener('keydown', onKey)
    if (scrollLocks === 0) previousOverflow = document.body.style.overflow
    scrollLocks += 1
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      scrollLocks = Math.max(0, scrollLocks - 1)
      if (scrollLocks === 0) document.body.style.overflow = previousOverflow
    }
  }, [open, locked, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-[#040812]/80 backdrop-blur-md animate-fade-in"
        onClick={() => !locked && onClose?.()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dialog'}
        className={`scroll-slim relative max-h-[92dvh] w-full animate-pop overflow-y-auto overflow-x-hidden rounded-t-[26px] border border-white/10 bg-[#0f172a] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] sm:rounded-3xl ${sizes[size]} ${className}`}
      >
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(closest-side,rgba(255,59,48,0.22),transparent)]" />
        {!bare && (title || !locked) && (
          <div className="relative flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              {icon && (
                <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-[#ff7a70]">
                  {icon}
                </span>
              )}
              <div>
                {title && <h3 className="text-[15px] font-bold text-white"> {title}</h3>}
                {description && <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">{description}</p>}
              </div>
            </div>
            {!locked && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mr-1 -mt-1 rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.07] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        <div className={bodyClassName || 'relative px-5 py-5 sm:px-6'}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/* ----------------------------------------------------------------------------
 * Small building blocks
 * -------------------------------------------------------------------------- */
export function Field({ label, hint, error, children, className = '', htmlFor }) {
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-[12px] text-slate-500">{hint}</p>}
      {error && <p className="mt-1.5 text-[12px] font-medium text-rose-400">{error}</p>}
    </div>
  )
}

export function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-14 text-center ${className}`}
    >
      {icon && (
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
          {icon}
        </span>
      )}
      <h4 className="text-[15px] font-bold text-white">{title}</h4>
      {description && <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function CoinAmount({ value, className = '', showSign = false, icon = true }) {
  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`}>
      {icon && <span className="text-[0.72em] font-extrabold text-amber-300">●</span>}
      <span className="font-mono font-semibold">
        {showSign && Number(value) > 0 ? '+' : ''}
        {Number(value || 0).toLocaleString('en-IN')}
      </span>
    </span>
  )
}

export function SectionHeading({ eyebrow, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-3 ${className}`}>
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff7a70]">{eyebrow}</p>
        )}
        <h2 className="text-lg font-extrabold tracking-tight text-white sm:text-xl">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function InfoRow({ label, value, mono = false, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2.5 ${className}`}>
      <span className="text-[12.5px] text-slate-400">{label}</span>
      <span className={`text-right text-[13px] font-semibold text-slate-100 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
