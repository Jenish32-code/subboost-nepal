import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'
import { AdminMark } from './ui'
import { Button } from '../components/ui'
import { useApp } from '../store/appContext'

export function AdminLogin() {
  const { adminSignIn, toast } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    window.setTimeout(() => {
      const result = adminSignIn(email, password)
      setBusy(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast({
        type: 'success',
        title: 'Admin access granted',
        message: 'Welcome to the SubBoost operations console.',
      })
      navigate('/admin/dashboard', { replace: true })
    }, 500)
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#090D16] px-4 py-10">
      <div className="pointer-events-none absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-[440px] w-[440px] rounded-full bg-fuchsia-600/15 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,0.12),transparent_60%)]" />

      <div className="relative w-full max-w-[420px]">
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-500 transition hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to SubBoost Nepal
        </Link>

        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0d1322]/95 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl">
          <div className="relative border-b border-white/[0.07] bg-gradient-to-br from-indigo-500/[0.14] via-transparent to-fuchsia-500/[0.08] px-6 pb-5 pt-6">
            <div className="flex items-center gap-3">
              <AdminMark className="h-11 w-11" />
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-indigo-300/80">
                  Restricted access
                </p>
                <h1 className="text-[19px] font-extrabold tracking-tight text-white">Admin console</h1>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
              Sign in with a designated administrator account to manage deposits, payouts, campaigns and users.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3.5 px-6 py-5">
            <div>
              <label className="label" htmlFor="admin-email">
                Admin email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setError('')
                  }}
                  placeholder="admin@subboost.np"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="admin-password">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError('')
                  }}
                  placeholder="Admin password"
                  className="input pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-slate-200"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-[11.5px] font-medium text-rose-300">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" variant="purple" className="w-full" loading={busy}>
              {busy ? 'Verifying role…' : 'Enter admin console'}
              {!busy && <ShieldCheck className="h-4 w-4" />}
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-600">
              <Loader2 className="hidden" />
              Standard user accounts are denied access and redirected to the app.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
