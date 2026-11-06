import { useMemo } from 'react'
import { CheckCircle2, Coins, ExternalLink, ShieldCheck } from 'lucide-react'
import { Avatar, Button, EmptyState, StatusBadge } from '../components/ui'
import { YoutubeIcon } from '../components/brand'
import { useApp } from '../store/appContext'
import { RATES } from '../lib/constants'
import { coins as fmtCoins, formatDate } from '../lib/utils'

export function SubscribedTab({ onNavigate }) {
  const { user, db } = useApp()

  const subscriptions = useMemo(
    () =>
      db.subscriptions
        .filter((item) => item.userId === user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [db.subscriptions, user.id],
  )

  const totalCoins = subscriptions.reduce((sum, item) => sum + item.coins, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">Completed tasks</p>
          <h1 className="text-[26px] font-extrabold tracking-tight text-white sm:text-[30px]">Subscribed channels</h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-slate-400">
            Every channel you have supported through SubBoost. These never reappear on your task wall.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Channels</p>
            <p className="font-mono text-lg font-bold text-white">{fmtCoins(subscriptions.length)}</p>
          </div>
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">Coins earned</p>
            <p className="font-mono text-lg font-bold text-emerald-300">+{fmtCoins(totalCoins)}</p>
          </div>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={<YoutubeIcon className="h-6 w-6" />}
          title="You haven't subscribed to anyone yet"
          description="Complete your first task on the Home wall to earn a coin and build your history."
          action={<Button onClick={() => onNavigate('home')}>Browse creator tasks</Button>}
        />
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <table className="hidden w-full md:table">
            <thead>
              <tr className="border-b border-white/[0.07] text-left text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <th className="px-5 py-3.5">Channel</th>
                <th className="px-4 py-3.5">Subscribed on</th>
                <th className="px-4 py-3.5">Coins earned</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Channel link</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((item) => (
                <tr key={item.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={item.channelName} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-white">{item.channelName}</p>
                        <p className="truncate text-[11px] text-slate-500">{item.channelUrl.replace(/^https?:\/\/(www\.)?/, '')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[12.5px] text-slate-300">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] px-2 py-1 font-mono text-[11.5px] font-bold text-emerald-300">
                      <Coins className="h-3 w-3" /> +{item.coins}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status="verified" label="Verified" />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <a
                      href={item.channelUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
                    >
                      Visit <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="divide-y divide-white/[0.06] md:hidden">
            {subscriptions.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={item.channelName} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[13.5px] font-bold text-white">{item.channelName}</p>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-400/[0.07] px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-emerald-300">
                        +{item.coins}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">Subscribed {formatDate(item.createdAt)}</p>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <StatusBadge status="verified" label="Verified" />
                      <a
                        href={item.channelUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#ff8b82]"
                      >
                        Open channel <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-sky-400/15 bg-sky-400/[0.05] p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
        <div>
          <p className="text-[12.5px] font-bold text-sky-100">Keep subscriptions for 30 days</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-sky-200/60">
            Each channel here is permanently removed from your task wall. Task rewards are {RATES.taskReward} coin per
            verified subscription.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/70" />
        Verification logs are stored in your Earned History tab.
      </div>
    </div>
  )
}
