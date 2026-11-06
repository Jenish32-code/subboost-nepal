import { useMemo } from 'react'
import { BadgeCheck, Coins, History, Receipt, TrendingUp } from 'lucide-react'
import { Avatar, Button, EmptyState, StatusBadge } from '../components/ui'
import { useApp } from '../store/appContext'
import { coins as fmtCoins, formatDateTime, formatDate } from '../lib/utils'

export function HistoryTab({ onNavigate }) {
  const { user, db } = useApp()

  const entries = useMemo(
    () =>
      db.subscriptions
        .filter((item) => item.userId === user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [db.subscriptions, user.id],
  )

  const totalCoins = entries.reduce((sum, item) => sum + item.coins, 0)
  const verified = entries.filter((item) => item.status === 'verified').length
  const lastEntry = entries[0]
  const thisWeek = entries.filter(
    (item) => Date.now() - new Date(item.createdAt).getTime() < 7 * 24 * 3600 * 1000,
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff7a70]">Earnings ledger</p>
          <h1 className="text-[26px] font-extrabold tracking-tight text-white sm:text-[30px]">Earned history</h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-slate-400">
            A timestamped record of every subscription task, its reward and verification status.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onNavigate('home')}>
          Earn more coins
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            icon: <Coins className="h-4 w-4" />,
            label: 'Total earned',
            value: `+${fmtCoins(totalCoins)}`,
            unit: 'coins',
            tint: 'text-amber-200 border-amber-400/20 from-amber-400/[0.1]',
          },
          {
            icon: <History className="h-4 w-4" />,
            label: 'Tasks completed',
            value: fmtCoins(entries.length),
            unit: 'tasks',
            tint: 'text-white border-white/10 from-white/[0.05]',
          },
          {
            icon: <BadgeCheck className="h-4 w-4" />,
            label: 'Verified rate',
            value: entries.length ? `${Math.round((verified / entries.length) * 100)}%` : '—',
            unit: 'verified',
            tint: 'text-emerald-300 border-emerald-400/20 from-emerald-400/[0.08]',
          },
          {
            icon: <TrendingUp className="h-4 w-4" />,
            label: 'This week',
            value: fmtCoins(thisWeek),
            unit: 'tasks',
            tint: 'text-sky-300 border-sky-400/20 from-sky-400/[0.08]',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border bg-gradient-to-br to-transparent p-4 ${stat.tint}`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] opacity-70">
              {stat.icon}
              <span className="truncate">{stat.label}</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold leading-none">{stat.value}</p>
            <p className="mt-1.5 text-[10.5px] text-slate-500">{stat.unit}</p>
          </div>
        ))}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-6 w-6" />}
          title="No earnings recorded yet"
          description="Complete a subscription task and it will show up here with a task ID and timestamp."
          action={<Button onClick={() => onNavigate('home')}>Go to the task wall</Button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-5 py-4">
            <div>
              <h2 className="text-[14px] font-bold text-white">Coin ledger</h2>
              <p className="text-[11px] text-slate-500">Newest earnings first</p>
            </div>
            {lastEntry && (
              <p className="text-[11px] text-slate-500">
                Last earning <span className="font-semibold text-slate-300">{formatDate(lastEntry.createdAt)}</span>
              </p>
            )}
          </div>

          <table className="hidden w-full sm:table">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <th className="px-5 py-3">Task ID</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Coins earned</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-5 py-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px] text-slate-300">
                      {entry.id}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={entry.channelName} size="xs" />
                      <span className="text-[12.5px] font-semibold text-slate-100">{entry.channelName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-[12px] font-bold text-emerald-300">+{entry.coins}</span>
                  </td>
                  <td className="px-4 py-3.5 text-[11.5px] text-slate-400">{formatDateTime(entry.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <StatusBadge status={entry.status} label={entry.status === 'verified' ? 'Verified' : entry.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divide-y divide-white/[0.06] sm:hidden">
            {entries.map((entry) => (
              <div key={entry.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={entry.channelName} size="xs" />
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-bold text-white">{entry.channelName}</p>
                      <p className="font-mono text-[10px] text-slate-500">{entry.id}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md border border-emerald-400/20 bg-emerald-400/[0.08] px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                    +{entry.coins}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10.5px] text-slate-500">{formatDateTime(entry.createdAt)}</span>
                  <StatusBadge status={entry.status} label="Verified" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] bg-black/20 px-5 py-3 text-[11px]">
            <span className="text-slate-500">
              {entries.length} entries · all rewards credited to your coin balance
            </span>
            <span className="font-mono font-bold text-emerald-300">Total +{fmtCoins(totalCoins)} coins</span>
          </div>
        </div>
      )}
    </div>
  )
}
