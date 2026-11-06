import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
  error: <XCircle className="h-5 w-5 text-rose-400" />,
  info: <Info className="h-5 w-5 text-sky-400" />,
}

export function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[120] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[360px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex animate-toast-in items-start gap-3 rounded-2xl border border-white/12 bg-[#111b30]/95 px-4 py-3.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl"
        >
          <span className="mt-0.5 shrink-0">{icons[toast.type] || icons.info}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-white">{toast.title}</p>
            {toast.message && (
              <p className="mt-0.5 text-[12px] leading-relaxed text-slate-400">{toast.message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="rounded-md p-1 text-slate-500 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
