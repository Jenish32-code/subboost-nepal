import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Banknote,
  ChevronRight,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { Avatar } from '../components/ui'
import { AdminMark } from './ui'
import { useApp } from '../store/appContext'

const navItems = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/admin/deposits', label: 'Deposits', icon: CreditCard, key: 'deposits' },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: Banknote, key: 'withdrawals' },
  { to: '/admin/campaigns', label: 'Campaigns', icon: Megaphone, key: 'campaigns' },
  { to: '/admin/users', label: 'Users', icon: Users, key: 'users' },
]

const titles = {
  dashboard: 'Overview',
  deposits: 'Deposit verification',
  withdrawals: 'Withdrawal queue',
  campaigns: 'Campaign moderation',
  users: 'User database',
}

function BrandBlock({ onNavigate }) {
  return (
    <Link to="/admin/dashboard" onClick={onNavigate} className="flex items-center gap-2.5">
      <AdminMark className="h-10 w-10" />
      <div className="leading-tight">
        <p className="text-[16px] font-extrabold tracking-tight text-white">
          SubBoost <span className="text-indigo-300">Admin</span>
        </p>
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-300/50">
          Operations console
        </p>
      </div>
    </Link>
  )
}

function SidebarContent({ counts, adminUser, onSignOut, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] px-5 py-5">
        <BrandBlock onNavigate={onNavigate} />
      </div>

      <nav className="scroll-slim flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[9.5px] font-bold uppercase tracking-[0.18em] text-slate-600">
          Management
        </p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const badge = counts[item.key]
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/[0.06] text-white'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-400" />
                    )}
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                        isActive
                          ? 'border-indigo-400/30 bg-indigo-500/15 text-indigo-200'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-500 group-hover:text-slate-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-[13px] font-semibold">{item.label}</span>
                    {badge > 0 && (
                      <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-amber-300">
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>

        <div className="mt-5 rounded-xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/[0.09] to-transparent p-3.5">
          <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wider text-indigo-300/80">
            <ShieldCheck className="h-3 w-3" /> Review queues
          </div>
          <div className="mt-2.5 space-y-1.5">
            <Link
              to="/admin/deposits"
              onClick={onNavigate}
              className="flex items-center justify-between rounded-lg bg-black/25 px-2.5 py-2 text-[11px] text-slate-300 transition hover:bg-black/40"
            >
              <span>Deposits</span>
              <span className="font-mono font-bold text-amber-300">{counts.deposits}</span>
            </Link>
            <Link
              to="/admin/withdrawals"
              onClick={onNavigate}
              className="flex items-center justify-between rounded-lg bg-black/25 px-2.5 py-2 text-[11px] text-slate-300 transition hover:bg-black/40"
            >
              <span>Payouts</span>
              <span className="font-mono font-bold text-amber-300">{counts.withdrawals}</span>
            </Link>
            <Link
              to="/admin/campaigns"
              onClick={onNavigate}
              className="flex items-center justify-between rounded-lg bg-black/25 px-2.5 py-2 text-[11px] text-slate-300 transition hover:bg-black/40"
            >
              <span>Flagged posts</span>
              <span className="font-mono font-bold text-rose-300">{counts.flagged}</span>
            </Link>
          </div>
        </div>

        <Link
          to="/"
          className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2.5 text-[11.5px] font-semibold text-slate-400 transition hover:border-white/15 hover:text-white"
        >
          <span className="inline-flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5" /> User application
          </span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5">
          <Avatar name={adminUser?.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-white">{adminUser?.name}</p>
            <p className="truncate text-[10px] text-indigo-300/70">Super admin · full access</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out of admin console"
            title="Sign out"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.07] hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminShell({ children }) {
  const { db, adminUser, adminSignOut, toast } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const counts = {
    deposits: db.deposits.filter((item) => item.status === 'pending').length,
    withdrawals: db.withdrawals.filter((item) => item.status === 'pending').length,
    flagged: db.campaigns.filter((item) => item.status === 'flagged').length,
  }

  const section = location.pathname.split('/')[2] || 'dashboard'

  useEffect(() => {
    setDrawerOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  const signOut = () => {
    adminSignOut()
    toast({ type: 'info', title: 'Signed out of admin', message: 'Admin routes are locked again.' })
    navigate('/admin', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-[#090D16] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(900px_500px_at_15%_-10%,rgba(79,70,229,0.16),transparent_60%),radial-gradient(700px_500px_at_100%_0%,rgba(168,85,247,0.08),transparent_60%)]" />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-white/[0.06] bg-[#080c15]/95 backdrop-blur-xl lg:block">
        <SidebarContent counts={counts} adminUser={adminUser} onSignOut={signOut} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-[280px] animate-fade-up border-r border-white/10 bg-[#080c15]">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent
              counts={counts}
              adminUser={adminUser}
              onSignOut={signOut}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="relative lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#090D16]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open admin navigation"
                className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-300 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-300/60">
                  SubBoost admin
                </p>
                <p className="truncate text-[13px] font-bold text-white">{titles[section] || 'Admin'}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/admin/deposits"
                className="hidden items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-2.5 py-1 text-[10px] font-bold text-amber-200 transition hover:bg-amber-400/[0.12] sm:inline-flex"
              >
                Deposits <span className="font-mono">{counts.deposits}</span>
              </Link>
              <Link
                to="/admin/withdrawals"
                className="hidden items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/[0.07] px-2.5 py-1 text-[10px] font-bold text-sky-200 transition hover:bg-sky-400/[0.12] sm:inline-flex"
              >
                Payouts <span className="font-mono">{counts.withdrawals}</span>
              </Link>
              <Link
                to="/"
                className="hidden items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10.5px] font-semibold text-slate-400 transition hover:text-white md:inline-flex"
              >
                User app <ArrowUpRight className="h-3 w-3" />
              </Link>
              <Avatar name={adminUser?.name} size="sm" ring />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1280px] px-4 pb-14 pt-5 sm:px-6 lg:px-8 lg:pt-7">{children}</main>
      </div>
    </div>
  )
}
