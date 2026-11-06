import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  History,
  Home,
  LogOut,
  Plus,
  User,
  Wallet,
} from 'lucide-react'
import { Avatar } from './ui'
import { Logo } from './brand'
import { useApp } from '../store/appContext'

const primaryNav = [
  { id: 'home', label: 'Home', icon: Home, hint: 'Task wall' },
  { id: 'post', label: 'Post Campaign', icon: Plus, hint: 'Buy subscribers' },
  { id: 'subscribed', label: 'Subscribed', icon: CheckCircle2, hint: 'Completed tasks' },
  { id: 'history', label: 'Earned History', icon: History, hint: 'Coin ledger' },
]

const walletNav = [
  { id: 'wallet', label: 'Deposit', icon: ArrowDownLeft, hint: 'Buy coins' },
  { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight, hint: 'Cash out' },
]

function NavButton({ item, active, onClick, compact = false, badge = 0 }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-[#ff3b30]/18 to-transparent text-white'
          : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100'
      }`}
    >
      {active && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#ff3b30]" />}
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
          active
            ? 'border-[#ff3b30]/30 bg-[#ff3b30]/15 text-[#ff8b82]'
            : 'border-white/[0.06] bg-white/[0.03] text-slate-500 group-hover:text-slate-300'
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold">{item.label}</span>
        {!compact && <span className="block truncate text-[11px] text-slate-500">{item.hint}</span>}
      </span>
      {badge > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff3b30] px-1 font-mono text-[9.5px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

export function CoinPill({ value, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/[0.08] px-3 py-1.5 text-amber-200 transition hover:border-amber-300/40 hover:bg-amber-400/[0.14] ${className}`}
    >
      <Coins className="h-3.5 w-3.5" />
      <span className="font-mono text-[13px] font-semibold text-amber-100">
        {Number(value || 0).toLocaleString('en-IN')}
      </span>
      <span className="hidden text-[10px] font-bold uppercase tracking-wider text-amber-300/70 min-[360px]:inline">coins</span>
    </button>
  )
}

export function Layout({ user, activeTab, onNavigate, onLogout, children }) {
  const { db } = useApp()
  const unreadCount = db.notifications.filter((item) => item.userId === user.id && !item.read).length

  const isActive = (id) =>
    activeTab === id || (id === 'wallet' && activeTab === 'withdraw')

  const navigate = (id) => {
    onNavigate(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[266px] lg:flex-col lg:border-r lg:border-white/[0.06] lg:bg-[#0a1120]/80 lg:backdrop-blur-xl">
        <div className="px-5 pb-5 pt-6">
          <Logo />
        </div>

        <nav className="scroll-slim flex-1 space-y-1 overflow-y-auto px-3">
          <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
            Marketplace
          </p>
          {primaryNav.map((item) => (
            <NavButton key={item.id} item={item} active={isActive(item.id)} onClick={() => navigate(item.id)} />
          ))}
          <p className="px-3 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Wallet</p>
          {walletNav.map((item) => (
            <NavButton key={item.id} item={item} active={isActive(item.id)} onClick={() => navigate(item.id)} />
          ))}
          <p className="px-3 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Account</p>
          <NavButton
            item={{ id: 'profile', label: 'Profile & Security', icon: User, hint: 'PIN, password, details' }}
            active={isActive('profile')}
            onClick={() => navigate('profile')}
            badge={unreadCount}
          />
        </nav>

        <div className="space-y-3 px-4 pb-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#1a1226] via-[#0f1a2e] to-[#0d1526] p-4">
            <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#ff3b30]/25 blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Balance</span>
              <Wallet className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold text-white">{Number(user?.coins || 0).toLocaleString('en-IN')}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">coins</span>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              ≈ NPR {Number(user?.coins || 0).toLocaleString('en-IN')} cash value
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigate('wallet')}
                className="rounded-lg bg-white/[0.08] px-2 py-1.5 text-[11px] font-bold text-slate-100 transition hover:bg-white/[0.14]"
              >
                Deposit
              </button>
              <button
                type="button"
                onClick={() => navigate('withdraw')}
                className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2 py-1.5 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                Withdraw
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2.5">
            <Avatar name={user?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-bold text-white">{user?.name}</p>
              <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.07] hover:text-rose-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[266px]">
        {/* Mobile / desktop top bar */}
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0b1120]/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6 lg:px-8 lg:py-4">
            <div className="min-w-0 lg:hidden">
              <Logo compact />
            </div>
            <div className="hidden lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                SubBoost Nepal
              </p>
              <p className="text-[13px] text-slate-400">
                Namaste, <span className="font-semibold text-slate-200">{user?.name?.split(' ')[0]}</span> — here is your
                marketplace.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 sm:inline-flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live
              </span>
              <CoinPill value={user?.coins} onClick={() => navigate('wallet')} />
              <button
                type="button"
                onClick={() => navigate('profile')}
                aria-label="Open profile"
                className="rounded-full transition hover:opacity-90"
              >
                <Avatar name={user?.name} size="sm" ring />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1180px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-14 lg:pt-8">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#0a1120]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-1 py-1.5">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'post', label: 'Post', icon: Plus },
            { id: 'subscribed', label: 'Subs', icon: CheckCircle2 },
            { id: 'wallet', label: 'Wallet', icon: Wallet },
            { id: 'history', label: 'History', icon: History },
            { id: 'profile', label: 'Profile', icon: User },
          ].map((item) => {
            const Icon = item.icon
            const active = activeTab === item.id || (item.id === 'wallet' && activeTab === 'withdraw')
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                aria-label={item.id === 'subscribed' ? 'Subscribed channels' : item.label}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[9.5px] font-bold transition ${
                  active ? 'text-white' : 'text-slate-500'
                }`}
              >
                <span
                  className={`inline-flex h-7 w-8 items-center justify-center rounded-lg transition ${
                    active ? 'bg-[#ff3b30]/15 text-[#ff8b82]' : ''
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="truncate">{item.label}</span>
                {item.id === 'profile' && unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1 h-1.5 w-1.5 rounded-full bg-[#ff3b30] ring-2 ring-[#0a1120]" />
                )}
                {active && <span className="absolute -top-0.5 h-1 w-5 rounded-full bg-[#ff3b30]" />}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
