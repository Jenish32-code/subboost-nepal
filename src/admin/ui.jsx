import { useState } from 'react'
import {
  Check,
  CheckCircle2,
  Copy,
  Image as ImageIcon,
  Inbox,
  Search,
  ShieldCheck,
  TriangleAlert,
  X,
} from 'lucide-react'
import { Button, Modal, StatusBadge } from '../components/ui'
import { useApp } from '../store/appContext'
import { coins as fmtCoins, copyText } from '../lib/utils'

export function AdminMark({ className = 'h-10 w-10' }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_10px_28px_-10px_rgba(99,102,241,0.9)] ${className}`}
      aria-hidden="true"
    >
      <ShieldCheck className="h-[56%] w-[56%]" />
      <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-[13px] bg-white/15" />
    </span>
  )
}

export function AdminPageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-indigo-300/80">
          {eyebrow}
        </p>
        <h1 className="text-[25px] font-extrabold tracking-tight text-white sm:text-[29px]">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-slate-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const tones = {
  indigo: { ring: 'border-indigo-400/20', glow: 'from-indigo-500/[0.14]', icon: 'bg-indigo-500/15 text-indigo-300' },
  violet: { ring: 'border-violet-400/20', glow: 'from-violet-500/[0.14]', icon: 'bg-violet-500/15 text-violet-300' },
  amber: { ring: 'border-amber-400/20', glow: 'from-amber-400/[0.1]', icon: 'bg-amber-400/10 text-amber-300' },
  emerald: { ring: 'border-emerald-400/20', glow: 'from-emerald-400/[0.1]', icon: 'bg-emerald-400/10 text-emerald-300' },
  sky: { ring: 'border-sky-400/20', glow: 'from-sky-400/[0.1]', icon: 'bg-sky-400/10 text-sky-300' },
  rose: { ring: 'border-rose-400/20', glow: 'from-rose-500/[0.1]', icon: 'bg-rose-500/10 text-rose-300' },
}

export function AdminStatCard({ label, value, hint, icon, tone = 'indigo', onClick, footer }) {
  const style = tones[tone] || tones.indigo
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent p-4 text-left transition ${style.ring} ${style.glow} ${
        onClick ? 'hover:border-white/20 hover:brightness-110' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase leading-tight tracking-[0.11em] text-slate-400">{label}</p>
        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.icon}`}>
          {icon}
        </span>
      </div>
      <p className="mt-2.5 font-mono text-[26px] font-bold leading-none text-white">{value}</p>
      {hint && <p className="mt-1.5 text-[10.5px] text-slate-500">{hint}</p>}
      {footer}
    </Tag>
  )
}

export function FilterTabs({ options, value, onChange, className = '' }) {
  return (
    <div className={`scroll-slim flex gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/30 p-1 ${className}`}>
      {options.map((option) => {
        const active = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11.5px] font-bold transition ${
              active ? 'bg-indigo-500/20 text-indigo-100 shadow-[inset_0_0_0_1px_rgba(129,140,248,0.3)]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {option.label}
            {typeof option.count === 'number' && (
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[9.5px] ${
                  active ? 'bg-indigo-400/25 text-indigo-100' : 'bg-white/[0.06] text-slate-500'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function SearchField({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-white/10 bg-black/30 pl-9 pr-8 text-[12px] text-slate-100 placeholder:text-slate-600 focus:border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

export function AdminEmpty({ title, description, action, icon }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-500">
        {icon || <Inbox className="h-5 w-5" />}
      </span>
      <p className="text-[13.5px] font-bold text-white">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function AdminTableShell({ children, footer }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1322]">
      <div className="scroll-slim overflow-x-auto">{children}</div>
      {footer && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] bg-black/20 px-4 py-3 text-[10.5px] text-slate-500">
          {footer}
        </div>
      )}
    </div>
  )
}

export function AdminThumb({ src, alt = 'Payment proof', onClick, size = 'md' }) {
  const dims = size === 'sm' ? 'h-10 w-10' : 'h-14 w-14'
  if (!src) {
    return (
      <span
        className={`inline-flex ${dims} items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] text-slate-600`}
        title="No screenshot attached"
      >
        <ImageIcon className="h-4 w-4" />
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title="Inspect screenshot"
      className={`group relative inline-flex ${dims} shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40 transition hover:border-indigo-400/50`}
    >
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
        <Search className="h-4 w-4" />
      </span>
    </button>
  )
}

export function ProofLightbox({ proof, onClose, title = 'Payment screenshot' }) {
  return (
    <Modal open={Boolean(proof)} onClose={onClose} size="xl" title={title} description="Inspect the transfer before approving.">
      {proof && (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-black/50 p-2">
            <img
              src={proof}
              alt="Payment proof full size"
              className="mx-auto max-h-[62vh] w-auto rounded-lg object-contain"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10.5px] text-slate-500">
              Compare the amount, transaction ID and receiver number with the request before deciding.
            </p>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'primary',
  onConfirm,
  children,
  busy = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm" locked={busy}>
      {children && <div className="mb-4">{children}</div>}
      <div className="flex gap-2">
        <Button variant="secondary" size="md" className="flex-1" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          size="md"
          className="flex-1"
          variant={tone === 'purple' ? 'purple' : 'primary'}
          loading={busy}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

export function ReasonDialog({
  open,
  onClose,
  title,
  description,
  presets = [],
  onSubmit,
  confirmLabel = 'Confirm',
  tone = 'primary',
  busy = false,
  children,
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const close = () => {
    if (busy) return
    setReason('')
    setError('')
    onClose?.()
  }

  const submit = () => {
    if (!reason.trim()) {
      setError('Please provide a reason.')
      return
    }
    onSubmit?.(reason.trim())
    setReason('')
    setError('')
  }

  return (
    <Modal open={open} onClose={close} title={title} description={description} size="md" locked={busy}>
      {children}
      {presets.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setReason(preset)
                setError('')
              }}
              className={`rounded-lg border px-2.5 py-1.5 text-[10.5px] font-semibold transition ${
                reason === preset
                  ? 'border-indigo-400/40 bg-indigo-500/15 text-indigo-100'
                  : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      )}
      <label className="label" htmlFor="admin-reason">
        Reason
      </label>
      <textarea
        id="admin-reason"
        value={reason}
        onChange={(event) => {
          setReason(event.target.value)
          setError('')
        }}
        rows={3}
        placeholder="Explain the decision — this is stored with the transaction."
        className="input resize-none text-[12.5px]"
      />
      {error && <p className="mt-1.5 text-[11.5px] font-medium text-rose-400">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" size="md" className="flex-1" onClick={close} disabled={busy}>
          Cancel
        </Button>
        <Button
          size="md"
          className="flex-1"
          variant={tone === 'purple' ? 'purple' : 'primary'}
          loading={busy}
          onClick={submit}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

export function CopyValue({ value, label }) {
  const { toast } = useApp()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    const ok = await copyText(value)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
      toast({ type: 'success', title: 'Copied', message: value })
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[11px] text-slate-200 transition hover:bg-white/[0.09]"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {label || value}
    </button>
  )
}

export function AdminStatus({ status, label }) {
  const map = {
    approved: label || 'Approved',
    rejected: label || 'Rejected',
    pending: label || 'Pending',
    active: label || 'Active',
    completed: label || 'Completed',
    paused: label || 'Paused',
    flagged: label || 'Flagged',
    cancelled: label || 'Cancelled',
    suspended: label || 'Suspended',
    admin: label || 'Admin',
  }
  const key = status === 'suspended' ? 'rejected' : status === 'admin' ? 'completed' : status
  return <StatusBadge status={key} label={map[status] || status} />
}

export function LedgerRow({ label, value, accent = 'text-slate-100' }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2.5">
      <span className="text-[11px] text-slate-400">{label}</span>
      <span className={`font-mono text-[12px] font-semibold ${accent}`}>{value}</span>
    </div>
  )
}

export function WarningNote({ children, tone = 'amber' }) {
  const cls =
    tone === 'rose'
      ? 'border-rose-500/20 bg-rose-500/[0.06] text-rose-200/80'
      : 'border-amber-400/20 bg-amber-400/[0.06] text-amber-200/80'
  return (
    <div className={`flex items-start gap-2 rounded-xl border p-3 text-[11px] leading-relaxed ${cls}`}>
      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

export function SuccessNote({ children }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-3 text-[11px] leading-relaxed text-emerald-200/80">
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

export { fmtCoins }
