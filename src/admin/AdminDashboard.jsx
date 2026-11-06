import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Banknote,
  Coins,
  CreditCard,
  Flag,
  Megaphone,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { Avatar, ProgressBar, StatusBadge } from '../components/ui'
import {
  AdminEmpty,
  AdminPageHeader,
  AdminStatCard,
  AdminStatus,
} from './ui'
import { useApp } from '../store/appContext'
import { coins as fmtCoins, formatDate, npr, timeAgo } from '../lib/utils'

function QueueRow({ to, title, subtitle, right }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2.5 transition hover:border-white/15 hover:bg-white/[0.04]"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-white">{title}</p>
        <p className="truncate text-[10.5px] text-slate-500">{subtitle}</p>
      </div>
      <div className="shrink-0 text-right">{right}</div>
    </Link>
  )
}

export function AdminDashboard() {
  const { db } = useApp()

  const metrics = useMemo(() => {
    const customers = db.users.filter((item) => item.role !== 'admin')
    const activeCampaigns = db.campaigns.filter(
      (item) => item.status === 'active' && item.completed < item.target,
    )
    const approvedDeposits = db.deposits.filter((item) => item.status === 'approved')
    return {
      users: customers.length,
      activeCampaigns: activeCampaigns.length,
      circulating: customers.reduce((sum, item) => sum + (item.coins || 0), 0),
      pendingDeposits: db.deposits.filter((item) => item.status === 'pending').length,
      pendingWithdrawals: db.withdrawals.filter((item) => item.status === 'pending').length,
      revenue: approvedDeposits.reduce((sum, item) => sum + item.amount, 0),
      suspended: customers.filter((item) => item.status === 'suspended').length,
      flagged: db.campaigns.filter((item) => item.status === 'flagged').length,
    }
  }, [db])

  const pendingDeposits = [...db.deposits]
    .filter((item) => item.status === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4)

  const pendingWithdrawals = [...db.withdrawals]
    .filter((item) => item.status === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4)

  const flaggedCampaigns = db.campaigns.filter((item) => item.status === 'flagged').slice(0, 3)
  const recentUsers = [...db.users]
    .filter((item) => item.role !== 'admin')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const revenueSeries = useMemo(() => {
    const days = []
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - offset)
      const next = new Date(date)
      next.setDate(next.getDate() + 1)
      const total = db.deposits
        .filter((item) => item.status === 'approved')
        .filter((item) => {
          const at = new Date(item.createdAt)
          return at >= date && at < next
        })
        .reduce((sum, item) => sum + item.amount, 0)
      days.push({ label: date.toLocaleDateString('en-GB', { weekday: 'short' }), total })
    }
    return days
  }, [db.deposits])

  const maxRevenue = Math.max(1, ...revenueSeries.map((day) => day.total))

  const userName = (id) => db.users.find((item) => item.id === id)?.name || 'Unknown user'

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operations overview"
        title="Marketplace at a glance"
        description={`Live metrics across ${metrics.users} customers. Review payment proofs, settle payouts and keep the task wall clean.`}
        actions={
          <>
            <Link
              to="/admin/deposits"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-indigo-400/30 bg-indigo-500/15 px-3 text-[11.5px] font-bold text-indigo-100 transition hover:bg-indigo-500/25"
            >
              <CreditCard className="h-3.5 w-3.5" /> Review deposits
            </Link>
            <Link
              to="/admin/withdrawals"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[11.5px] font-bold text-slate-200 transition hover:bg-white/[0.09]"
            >
              <Banknote className="h-3.5 w-3.5" /> Payout queue
            </Link>
          </>
        }
      />

      {/* Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          label="Total registered users"
          value={fmtCoins(metrics.users)}
          hint={`${metrics.suspended} suspended account${metrics.suspended === 1 ? '' : 's'}`}
          icon={<Users className="h-4 w-4" />}
          tone="indigo"
        />
        <AdminStatCard
          label="Active campaigns"
          value={fmtCoins(metrics.activeCampaigns)}
          hint={`${db.campaigns.length} campaigns in total`}
          icon={<Megaphone className="h-4 w-4" />}
          tone="violet"
        />
        <AdminStatCard
          label="Coins circulating"
          value={fmtCoins(metrics.circulating)}
          hint={`≈ ${npr(metrics.circulating)} wallet value`}
          icon={<Coins className="h-4 w-4" />}
          tone="amber"
        />
        <AdminStatCard
          label="Pending deposits"
          value={fmtCoins(metrics.pendingDeposits)}
          hint="Awaiting proof verification"
          icon={<CreditCard className="h-4 w-4" />}
          tone="sky"
          onClick={undefined}
        />
        <AdminStatCard
          label="Pending withdrawals"
          value={fmtCoins(metrics.pendingWithdrawals)}
          hint="Awaiting payout settlement"
          icon={<Banknote className="h-4 w-4" />}
          tone="rose"
        />
        <AdminStatCard
          label="Approved revenue (NPR)"
          value={npr(metrics.revenue).replace('NPR ', '')}
          hint={`${db.deposits.filter((d) => d.status === 'approved').length} verified top-ups`}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="emerald"
        />
      </div>

      {/* Quick actions */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            to: '/admin/deposits',
            title: 'Deposit queue',
            count: metrics.pendingDeposits,
            copy: 'Verify Khalti & eSewa proofs',
            icon: <CreditCard className="h-4 w-4" />,
            tint: 'from-amber-400/[0.12] border-amber-400/20 text-amber-200',
          },
          {
            to: '/admin/withdrawals',
            title: 'Withdrawal queue',
            count: metrics.pendingWithdrawals,
            copy: 'Settle or refund payouts',
            icon: <Banknote className="h-4 w-4" />,
            tint: 'from-sky-400/[0.12] border-sky-400/20 text-sky-200',
          },
          {
            to: '/admin/campaigns',
            title: 'Flagged campaigns',
            count: metrics.flagged,
            copy: 'Pause or remove bad links',
            icon: <Flag className="h-4 w-4" />,
            tint: 'from-rose-500/[0.12] border-rose-500/20 text-rose-200',
          },
          {
            to: '/admin/users',
            title: 'Suspended users',
            count: metrics.suspended,
            copy: 'Review account controls',
            icon: <ShieldCheck className="h-4 w-4" />,
            tint: 'from-indigo-500/[0.14] border-indigo-400/20 text-indigo-200',
          },
        ].map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent p-4 transition hover:border-white/25 ${item.tint}`}
          >
            <div className="flex items-start justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black/25">{item.icon}</span>
              <ArrowRight className="h-4 w-4 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-90" />
            </div>
            <p className="mt-3 font-mono text-2xl font-bold leading-none text-white">
              {fmtCoins(item.count)}
            </p>
            <p className="mt-1.5 text-[12px] font-bold text-white">{item.title}</p>
            <p className="mt-0.5 text-[10.5px] text-slate-400">{item.copy}</p>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {/* Deposit queue preview */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#0d1322] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
                  <CreditCard className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[13.5px] font-bold text-white">Recent deposit requests</h2>
                  <p className="text-[10.5px] text-slate-500">Proof awaiting manual review</p>
                </div>
              </div>
              <Link to="/admin/deposits" className="text-[10.5px] font-bold text-indigo-300 hover:text-indigo-200">
                View queue →
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {pendingDeposits.length === 0 ? (
                <AdminEmpty title="No pending deposits" description="Every deposit has been reviewed." icon={<ShieldCheck className="h-5 w-5" />} />
              ) : (
                pendingDeposits.map((deposit) => (
                  <QueueRow
                    key={deposit.id}
                    to="/admin/deposits"
                    title={`${userName(deposit.userId)} · NPR ${fmtCoins(deposit.amount)}`}
                    subtitle={`${deposit.method === 'khalti' ? 'Khalti' : 'eSewa'} · ${deposit.transactionId} · ${timeAgo(deposit.createdAt)}`}
                    right={
                      <span className="font-mono text-[11px] font-bold text-amber-300">
                        +{fmtCoins(deposit.coins)}
                      </span>
                    }
                  />
                ))
              )}
            </div>
          </section>

          {/* Withdrawal queue preview */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#0d1322] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
                  <Banknote className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[13.5px] font-bold text-white">Pending payouts</h2>
                  <p className="text-[10.5px] text-slate-500">Coins already deducted from users</p>
                </div>
              </div>
              <Link to="/admin/withdrawals" className="text-[10.5px] font-bold text-indigo-300 hover:text-indigo-200">
                View queue →
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {pendingWithdrawals.length === 0 ? (
                <AdminEmpty title="No pending payouts" description="All withdrawals are settled." icon={<ShieldCheck className="h-5 w-5" />} />
              ) : (
                pendingWithdrawals.map((withdrawal) => (
                  <QueueRow
                    key={withdrawal.id}
                    to="/admin/withdrawals"
                    title={`${userName(withdrawal.userId)} · NPR ${fmtCoins(withdrawal.npr)}`}
                    subtitle={`${withdrawal.method === 'khalti' ? 'Khalti' : 'eSewa'} · ${withdrawal.accountNumber} · Receipt #${withdrawal.code}`}
                    right={<AdminStatus status={withdrawal.status} />}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          {/* Revenue chart */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#0d1322] p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[13.5px] font-bold text-white">Verified revenue</h2>
                <p className="text-[10.5px] text-slate-500">Last 7 days · approved deposits</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2 py-0.5 text-[9.5px] font-bold text-emerald-300">
                <TrendingUp className="h-3 w-3" /> {npr(metrics.revenue)}
              </span>
            </div>
            <div className="mt-4 flex h-[120px] items-end gap-2">
              {revenueSeries.map((day) => (
                <div key={day.label} className="group flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[9px] font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100">
                    {day.total ? `NPR ${fmtCoins(day.total)}` : '—'}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-indigo-600/40 to-violet-400/80 transition group-hover:from-indigo-500/60 group-hover:to-violet-300"
                    style={{ height: `${Math.max(4, (day.total / maxRevenue) * 92)}px` }}
                  />
                  <span className="text-[9.5px] font-semibold text-slate-500">{day.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Newest users */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#0d1322] p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
                <UserPlus className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-[13.5px] font-bold text-white">Newest accounts</h2>
                <p className="text-[10.5px] text-slate-500">Recently registered creators</p>
              </div>
            </div>
            <div className="mt-3 divide-y divide-white/[0.06]">
              {recentUsers.map((item) => (
                <Link
                  key={item.id}
                  to="/admin/users"
                  className="flex items-center gap-2.5 py-2.5 transition hover:opacity-90"
                >
                  <Avatar name={item.name} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-semibold text-white">{item.name}</p>
                    <p className="truncate text-[10px] text-slate-500">{item.email}</p>
                  </div>
                  <span className={`shrink-0 font-mono text-[10.5px] font-bold ${item.status === 'suspended' ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {item.status === 'suspended' ? 'Suspended' : `${fmtCoins(item.coins)} coins`}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Flagged campaigns */}
          {flaggedCampaigns.length > 0 && (
            <section className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.07] to-transparent p-4">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-rose-300" />
                <h2 className="text-[13px] font-bold text-white">Needs moderation</h2>
              </div>
              <div className="mt-2 space-y-2">
                {flaggedCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    to="/admin/campaigns"
                    className="block rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 transition hover:border-white/15"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[11.5px] font-semibold text-white">{campaign.channelName}</p>
                      <StatusBadge status="flagged" label="Flagged" />
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <ProgressBar value={campaign.completed} max={campaign.target} tone="amber" className="flex-1" />
                      <span className="font-mono text-[9.5px] text-slate-500">
                        {campaign.completed}/{campaign.target}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[10.5px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-indigo-300" />
          Admin actions are applied instantly to the shared marketplace ledger.
        </span>
        <span>Signed in {formatDate(new Date().toISOString())}</span>
      </div>
    </div>
  )
}
