import { useState } from 'react'
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  CheckCircle2,
  Coins,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Phone,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'
import { Avatar, Button, Field, Modal, SectionHeading, StatusBadge } from '../components/ui'
import { PinModal } from '../components/PinModal'
import { useApp } from '../store/appContext'
import { coins as fmtCoins, formatDate, otpCode, timeAgo } from '../lib/utils'

export function ProfileTab({ onNavigate, onLogout }) {
  const { user, db, setPin, changePassword, markNotificationsRead, toast } = useApp()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [pinGate, setPinGate] = useState(false)
  const [pinSetup, setPinSetup] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotStep, setForgotStep] = useState('request')
  const [otp, setOtp] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [otpError, setOtpError] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  const myCampaigns = db.campaigns.filter((c) => c.userId === user.id)
  const mySubs = db.subscriptions.filter((s) => s.userId === user.id)
  const notifications = db.notifications
    .filter((item) => item.userId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)
  const unreadNotifications = notifications.filter((item) => !item.read)
  const pendingWithdrawals = db.withdrawals.filter((w) => w.userId === user.id && w.status === 'pending').length

  const openPassword = () => {
    setPwForm({ current: '', next: '', confirm: '' })
    setPwError('')
    setShowNewPassword(false)
    setPasswordOpen(true)
  }

  const savePassword = (event) => {
    event.preventDefault()
    setPwError('')
    if (pwForm.next !== pwForm.confirm) {
      setPwError('New passwords do not match.')
      return
    }
    setPwBusy(true)
    window.setTimeout(() => {
      const result = changePassword(pwForm.current, pwForm.next)
      setPwBusy(false)
      if (!result.ok) {
        setPwError(result.error)
        return
      }
      setPasswordOpen(false)
      toast({ type: 'success', title: 'Password updated', message: 'Use your new password next time you sign in.' })
    }, 600)
  }

  const requestOtp = () => {
    const code = otpCode()
    setOtp(code)
    setOtpInput('')
    setOtpError('')
    setForgotStep('verify')
    toast({
      type: 'info',
      title: 'OTP sent',
      message: `Demo OTP ${code} was sent to ${user.email}.`,
    })
  }

  const verifyOtp = () => {
    if (otpInput.trim() !== otp) {
      setOtpError('That OTP is incorrect. Check the code and try again.')
      return
    }
    setForgotOpen(false)
    setForgotStep('request')
    setPinSetup(true)
    toast({ type: 'success', title: 'OTP verified', message: 'Set a new 4-digit Security PIN.' })
  }

  const closeForgot = () => {
    setForgotOpen(false)
    setForgotStep('request')
    setOtpInput('')
    setOtpError('')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff7a70]">Account</p>
          <h1 className="text-[26px] font-extrabold tracking-tight text-white sm:text-[30px]">Profile & security</h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-slate-400">
            Manage your identity, password and 4-digit Security PIN.
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={onLogout}>
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-5">
          {/* Identity card */}
          <section className="card relative overflow-hidden p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#5C2D91]/30 blur-[70px]" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={user.name} size="2xl" ring />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-extrabold tracking-tight text-white">{user.name}</h2>
                  <StatusBadge status="verified" label="Verified" />
                </div>
                <p className="mt-1 truncate text-[12.5px] text-slate-400">{user.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {user.phone}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> Member since {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:w-[150px]">
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-2.5 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-amber-200/60">Coins</p>
                  <p className="font-mono text-[15px] font-bold text-amber-100">{fmtCoins(user.coins)}</p>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-300/60">Earned</p>
                  <p className="font-mono text-[15px] font-bold text-emerald-300">{fmtCoins(user.lifetimeEarned)}</p>
                </div>
              </div>
            </div>

            <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { icon: <Users className="h-3.5 w-3.5" />, label: 'Subscribed', value: mySubs.length },
                { icon: <Sparkles className="h-3.5 w-3.5" />, label: 'Campaigns', value: myCampaigns.length },
                { icon: <TrendingUp className="h-3.5 w-3.5" />, label: 'Delivered', value: myCampaigns.reduce((s, c) => s + c.completed, 0) },
                { icon: <Coins className="h-3.5 w-3.5" />, label: 'Payouts', value: pendingWithdrawals },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {stat.icon} {stat.label}
                  </span>
                  <p className="mt-1 font-mono text-base font-bold text-slate-100">{stat.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Account details */}
          <section className="card p-5 sm:p-6">
            <SectionHeading title="Account details" description="The identity attached to your wallet" />
            <div className="mt-4 divide-y divide-white/[0.06]">
              {[
                { icon: <User className="h-4 w-4" />, label: 'Full name', value: user.name },
                { icon: <Mail className="h-4 w-4" />, label: 'Email address', value: user.email },
                { icon: <Phone className="h-4 w-4" />, label: 'Phone number', value: user.phone },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 py-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-400">
                    {row.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{row.label}</p>
                    <p className="truncate text-[13px] font-semibold text-slate-100">{row.value}</p>
                  </div>
                  <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400/70" />
                </div>
              ))}

              <div className="flex items-center gap-3 py-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Password</p>
                  <p className="text-[15px] tracking-[0.25em] text-slate-300">••••••••</p>
                </div>
                <Button variant="secondary" size="sm" onClick={openPassword}>
                  Change password
                </Button>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#ff3b30]/25 bg-[#ff3b30]/10 text-[#ff8b82]">
                  <Bell className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[15px] font-extrabold text-white">Notifications</h2>
                  <p className="mt-0.5 text-[11.5px] text-slate-500">
                    {unreadNotifications.length > 0
                      ? `${unreadNotifications.length} unread update${unreadNotifications.length === 1 ? '' : 's'}`
                      : 'Admin updates about your wallet and campaigns'}
                  </p>
                </div>
              </div>
              {unreadNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    markNotificationsRead(user.id)
                    toast({ type: 'info', title: 'Notifications cleared', message: 'All updates marked as read.' })
                  }}
                  className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10.5px] font-bold text-slate-300 transition hover:bg-white/[0.09]"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="mt-4 divide-y divide-white/[0.06]">
              {notifications.length === 0 ? (
                <p className="py-5 text-center text-[11.5px] text-slate-500">
                  No notifications yet. Wallet and campaign updates will appear here.
                </p>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-2.5 py-3">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        notification.read
                          ? 'bg-slate-700'
                          : notification.type === 'error'
                            ? 'bg-rose-400'
                            : notification.type === 'success'
                              ? 'bg-emerald-400'
                              : 'bg-sky-400'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-[12px] ${notification.read ? 'font-medium text-slate-300' : 'font-bold text-white'}`}>
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-[9.5px] text-slate-500">{timeAgo(notification.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-500">{notification.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Security */}
        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-extrabold text-white">Security PIN</h2>
                <p className="mt-0.5 text-[11.5px] text-slate-500">Required for campaigns and withdrawals.</p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#ff3b30]/25 bg-[#ff3b30]/10 text-[#ff8b82]">
                <KeyRound className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current PIN</p>
                <p className="mt-0.5 font-mono text-xl tracking-[0.4em] text-slate-200">{user.pin ? '••••' : '----'}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                <ShieldCheck className="h-3 w-3" /> {user.pin ? 'Active' : 'Not set'}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  if (!user.pin) {
                    setPinSetup(true)
                    return
                  }
                  setPinGate(true)
                }}
              >
                <KeyRound className="h-4 w-4" /> Change PIN
              </Button>
              <Button variant="outline" size="md" onClick={() => setForgotOpen(true)}>
                <Send className="h-4 w-4" /> Forgot PIN
              </Button>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
              <p className="text-[11px] leading-relaxed text-slate-500">
                Never share your PIN. SubBoost support will never ask for it. PIN recovery uses a one-time code sent to
                your registered email.
              </p>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-[14px] font-bold text-white">Wallet snapshot</h2>
            <div className="mt-3 space-y-2">
              {[
                { label: 'Coin balance', value: `${fmtCoins(user.coins)} coins`, accent: 'text-amber-200' },
                { label: 'Lifetime earned', value: `+${fmtCoins(user.lifetimeEarned)} coins`, accent: 'text-emerald-300' },
                { label: 'Pending payouts', value: `${pendingWithdrawals} request${pendingWithdrawals === 1 ? '' : 's'}`, accent: 'text-slate-200' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2.5">
                  <span className="text-[11.5px] text-slate-400">{row.label}</span>
                  <span className={`font-mono text-[12px] font-semibold ${row.accent}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={() => onNavigate('wallet')}>
                Deposit
              </Button>
              <Button variant="green" size="sm" onClick={() => onNavigate('withdraw')}>
                Withdraw
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              <Smartphone className="h-3.5 w-3.5" /> Demo account
            </p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-slate-600">
              This build stores your profile, PIN and coin ledger in your browser. Payments to Khalti and eSewa are
              simulated for demonstration.
            </p>
            <button
              type="button"
              onClick={onLogout}
              className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-300/80 transition hover:text-rose-200"
            >
              <LogOut className="h-3 w-3" /> Sign out of this device
            </button>
          </section>
        </div>
      </div>

      {/* Change password */}
      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Change password"
        description="Confirm your current password, then choose a new one."
        icon={<Lock className="h-5 w-5" />}
        size="sm"
      >
        <form onSubmit={savePassword} className="space-y-3.5">
          <Field label="Current password" htmlFor="current-pw">
            <input
              id="current-pw"
              type="password"
              value={pwForm.current}
              onChange={(event) => {
                setPwForm((prev) => ({ ...prev, current: event.target.value }))
                setPwError('')
              }}
              placeholder="Enter current password"
              className="input"
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password" htmlFor="new-pw" hint="At least 6 characters.">
            <div className="relative">
              <input
                id="new-pw"
                type={showNewPassword ? 'text' : 'password'}
                value={pwForm.next}
                onChange={(event) => {
                  setPwForm((prev) => ({ ...prev, next: event.target.value }))
                  setPwError('')
                }}
                placeholder="New password"
                className="input pr-11"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-slate-200"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm new password" htmlFor="confirm-pw" error={pwError}>
            <input
              id="confirm-pw"
              type="password"
              value={pwForm.confirm}
              onChange={(event) => {
                setPwForm((prev) => ({ ...prev, confirm: event.target.value }))
                setPwError('')
              }}
              placeholder="Repeat new password"
              className="input"
              autoComplete="new-password"
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" size="md" className="flex-1" onClick={() => setPasswordOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="md" className="flex-1" loading={pwBusy}>
              Save password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Verify current PIN before change */}
      <PinModal
        open={pinGate}
        onClose={() => setPinGate(false)}
        mode="verify"
        expectedPin={user.pin}
        title="Confirm your current PIN"
        description="Verify it is really you before choosing a new PIN."
        submitLabel="Continue"
        onSuccess={() => {
          setPinSetup(true)
          return true
        }}
      />

      {/* Set new PIN */}
      <PinModal
        open={pinSetup}
        onClose={() => setPinSetup(false)}
        mode="setup"
        title={user.pin ? 'Choose a new Security PIN' : 'Set your Security PIN'}
        onSuccess={(pin) => {
          const result = setPin(pin)
          if (!result.ok) {
            toast({ type: 'error', title: 'PIN not saved', message: result.error })
            return false
          }
          toast({
            type: 'success',
            title: user.pin ? 'Security PIN updated' : 'Security PIN created',
            message: 'You will use it to publish campaigns and approve withdrawals.',
          })
          return true
        }}
      />

      {/* Forgot PIN / OTP simulation */}
      <Modal
        open={forgotOpen}
        onClose={closeForgot}
        title="Reset Security PIN"
        description={forgotStep === 'request' ? 'We will email a one-time code to your registered address.' : 'Enter the 4-digit code we sent you.'}
        icon={<Send className="h-5 w-5" />}
        size="sm"
      >
        {forgotStep === 'request' ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Code will be sent to</p>
              <p className="mt-0.5 flex items-center gap-2 text-[13px] font-semibold text-slate-100">
                <Mail className="h-3.5 w-3.5 text-slate-500" /> {user.email}
              </p>
            </div>
            <Button size="lg" className="w-full" onClick={requestOtp}>
              <Send className="h-4 w-4" /> Send OTP
            </Button>
            <p className="text-center text-[10.5px] text-slate-600">
              Demo mode: the OTP is shown on the next screen instead of being emailed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200/70">Demo OTP</p>
              <p className="mt-0.5 font-mono text-2xl font-bold tracking-[0.3em] text-amber-100">{otp}</p>
              <p className="mt-0.5 text-[10px] text-amber-200/50">Sent to {user.email}</p>
            </div>
            <Field label="Enter OTP" htmlFor="otp-input" error={otpError}>
              <input
                id="otp-input"
                value={otpInput}
                onChange={(event) => {
                  setOtpInput(event.target.value.replace(/\D/g, '').slice(0, 4))
                  setOtpError('')
                }}
                inputMode="numeric"
                placeholder="••••"
                className="input text-center font-mono text-xl tracking-[0.5em]"
                autoFocus
              />
            </Field>
            <div className="flex gap-2">
              <Button variant="secondary" size="md" className="flex-1" onClick={requestOtp}>
                Resend
              </Button>
              <Button size="md" className="flex-1" onClick={verifyOtp}>
                Verify OTP
              </Button>
            </div>
            <button
              type="button"
              onClick={closeForgot}
              className="mx-auto block text-[11px] font-semibold text-slate-500 transition hover:text-slate-300"
            >
              Cancel reset
            </button>
          </div>
        )}
      </Modal>

      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/70" />
        Profile and security settings are saved to this device automatically.
      </div>
    </div>
  )
}
