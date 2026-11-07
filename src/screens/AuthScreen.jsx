import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Coins,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react'
import { Avatar, Button, ProgressBar } from '../components/ui'
import { BrandMark, EsewaMark, GoogleIcon, KhaltiMark, Logo, YoutubeIcon } from '../components/brand'
import { useApp } from '../store/appContext'
import { RATES } from '../lib/constants'

const highlights = [
  { icon: Coins, title: 'Earn 1 coin per subscribe', copy: 'Every verified subscription task pays instantly.' },
  { icon: TrendingUp, title: '4 coins = 1 real subscriber', copy: 'Creators get genuine growth, not bots.' },
  { icon: Wallet, title: 'Cash out to Khalti or eSewa', copy: 'Coins convert at NPR 1 — no hidden fees.' },
]

const fieldWrapper = 'relative'
const fieldIcon = 'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500'

export function AuthScreen() {
  const { signIn, signUp, signInWithGoogle, toast } = useApp()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
    if (error) setError('')
  }

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setShowPassword(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    window.setTimeout(() => {
      const result = mode === 'login' ? signIn(form.email, form.password) : signUp(form)
      setBusy(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast({
        type: 'success',
        title: mode === 'login' ? 'Welcome back to SubBoost' : 'Account created',
        message:
          mode === 'login'
            ? 'Your task wall is ready.'
            : result.needsPin
              ? 'One quick step: set your 4-digit Security PIN.'
              : 'Your account is ready to go.',
      })
    }, 480)
  }

  const handleGoogle = async () => {
    setGoogleBusy(true)
    setError('')
    const result = await signInWithGoogle()
    if (!result.ok) {
      setError(result.error)
      setGoogleBusy(false)
      return
    }
    // A redirect follows when Supabase returns an OAuth URL.
    window.setTimeout(() => setGoogleBusy(false), 1200)
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute -left-32 top-[-10%] h-[420px] w-[420px] rounded-full bg-[#ff0000]/12 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-[460px] w-[460px] rounded-full bg-[#5C2D91]/25 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-15%] left-1/3 h-[380px] w-[380px] rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-10 lg:py-12">
        {/* Marketing panel */}
        <div className="order-2 hidden lg:order-1 lg:block">
          <Logo />
          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Nepal&apos;s YouTube growth marketplace
          </div>
          <h1 className="mt-5 max-w-xl text-balance text-[42px] font-extrabold leading-[1.06] tracking-tight text-white xl:text-[52px]">
            Real subscribers.
            <br />
            <span className="bg-gradient-to-r from-[#ff3b30] via-[#ff7a70] to-[#ffb4ac] bg-clip-text text-transparent">
              Real coins.
            </span>{' '}
            Real NPR.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-400">
            Grow your channel with a community that actually subscribes — and earn coins for supporting theirs. Cash out
            to Khalti or eSewa at NPR 1 per coin.
          </p>

          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            {[
              { value: '4,280+', label: 'Nepali creators' },
              { value: '128k', label: 'Subs delivered' },
              { value: 'NPR 4.2M', label: 'Cashed out' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3">
                <p className="text-lg font-extrabold tracking-tight text-white">{stat.value}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 max-w-lg space-y-3.5">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#ff8b82]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-slate-100">{item.title}</p>
                    <p className="text-[12px] text-slate-500">{item.copy}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Floating task card preview */}
          <div className="mt-10 max-w-sm animate-float rounded-2xl border border-white/10 bg-[#0f1a2e]/90 p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
            <div className="flex items-center gap-3">
              <Avatar name="Jenish Shah" size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-white">Jenish requested 50 subscribers</p>
                <p className="text-[11px] text-slate-500">12 slots left · pays 1 coin</p>
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff0000]/15 text-[#ff7a70]">
                <YoutubeIcon className="h-4 w-4" />
              </span>
            </div>
            <ProgressBar value={38} max={50} className="mt-3" />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">38 / 50 subscribed</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#ff2d20] to-[#c00009] px-3 py-1.5 text-[11px] font-bold text-white">
                Subscribe +1 <Coins className="h-3 w-3" />
              </span>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> PIN-protected wallet
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="flex items-center gap-1.5">
              <KhaltiMark className="h-4 w-4 rounded-[5px] text-[9px]" /> Khalti
            </span>
            <span className="flex items-center gap-1.5">
              <EsewaMark className="h-4 w-4 rounded-[5px] text-[9px]" /> eSewa
            </span>
          </div>
        </div>

        {/* Auth card */}
        <div className="order-1 mx-auto w-full max-w-[460px] lg:order-2">
          <div className="mb-6 flex justify-center lg:hidden">
            <Logo />
          </div>

          <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#0d1628]/90 p-5 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-7">
            <div className="pointer-events-none absolute inset-x-0 -top-28 h-56 bg-[radial-gradient(closest-side,rgba(255,59,48,0.22),transparent)]" />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                    {mode === 'login' ? 'Welcome back' : 'Join SubBoost Nepal'}
                  </h2>
                  <p className="mt-1 text-[12.5px] text-slate-400">
                    {mode === 'login'
                      ? 'Sign in to earn coins and grow your channel.'
                      : 'Create your account in under a minute.'}
                  </p>
                </div>
                <BrandMark className="h-11 w-11" />
              </div>

              <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-white/[0.07] bg-black/25 p-1">
                {[
                  { id: 'login', label: 'Sign in' },
                  { id: 'signup', label: 'Create account' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => switchMode(tab.id)}
                    className={`rounded-lg px-3 py-2 text-[12.5px] font-bold transition ${
                      mode === tab.id
                        ? 'bg-white/[0.09] text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleBusy || busy}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[13px] font-semibold text-slate-100 transition hover:bg-white/[0.08] disabled:opacity-60"
              >
                {googleBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
                Continue with Google
              </button>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  or use email
                </span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <div className={fieldWrapper}>
                    <User className={fieldIcon} />
                    <input
                      className="input pl-10"
                      placeholder="Full name"
                      autoComplete="name"
                      value={form.name}
                      onChange={update('name')}
                      required
                    />
                  </div>
                )}
                <div className={fieldWrapper}>
                  <Mail className={fieldIcon} />
                  <input
                    className="input pl-10"
                    type="email"
                    placeholder="Email address"
                    autoComplete="email"
                    value={form.email}
                    onChange={update('email')}
                    required
                  />
                </div>
                {mode === 'signup' && (
                  <div className={fieldWrapper}>
                    <Phone className={fieldIcon} />
                    <input
                      className="input pl-10"
                      type="tel"
                      placeholder="Phone number (e.g. 9841234567)"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      required
                    />
                  </div>
                )}
                <div className={fieldWrapper}>
                  <Lock className={fieldIcon} />
                  <input
                    className="input pl-10 pr-11"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={form.password}
                    onChange={update('password')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {mode === 'signup' && (
                  <p className="flex items-start gap-2 rounded-xl border border-sky-400/15 bg-sky-400/[0.06] px-3 py-2.5 text-[11.5px] leading-relaxed text-sky-200/80">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Next you&apos;ll set a 4-digit Security PIN. It protects your coins, campaigns and withdrawals.
                  </p>
                )}

                {error && (
                  <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-[12px] font-medium text-rose-300">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" className="w-full" loading={busy}>
                  {mode === 'login' ? 'Sign in' : 'Create my account'}
                  {!busy && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2.5">
                <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <p className="text-[11px] leading-relaxed text-slate-400">
                  New here? Create an account to start subscribing, earning coins and posting your own channel.
                </p>
              </div>

              <p className="mt-4 text-center text-[10.5px] leading-relaxed text-slate-600">
                By continuing you agree to the SubBoost Nepal terms. 1 coin = NPR {RATES.coinToNpr}.
              </p>
              <div className="mt-3 flex justify-center">
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 transition hover:border-indigo-400/25 hover:text-indigo-300"
                >
                  <ShieldCheck className="h-3 w-3" /> Platform staff? Open admin console
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
