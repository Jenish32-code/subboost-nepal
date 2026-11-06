import { useMemo, useState } from 'react'
import {
  ExternalLink,
  Flag,
  Megaphone,
  Pause,
  Play,
  Receipt,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { Avatar, Button, ProgressBar } from '../components/ui'
import {
  AdminEmpty,
  AdminPageHeader,
  AdminStatCard,
  AdminStatus,
  AdminTableShell,
  ConfirmDialog,
  FilterTabs,
  ReasonDialog,
  SearchField,
  WarningNote,
} from './ui'
import { YoutubeIcon } from '../components/brand'
import { useApp } from '../store/appContext'
import { RATES } from '../lib/constants'
import { coins as fmtCoins, formatDate } from '../lib/utils'

const statusLabel = {
  active: 'Active',
  paused: 'Paused',
  flagged: 'Flagged',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function CampaignsAdmin() {
  const { db, setCampaignState, deleteCampaign, cancelCampaign, toast } = useApp()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [pauseTarget, setPauseTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const usersById = useMemo(
    () => Object.fromEntries(db.users.map((item) => [item.id, item])),
    [db.users],
  )

  const counts = useMemo(() => {
    const base = { all: db.campaigns.length, active: 0, paused: 0, flagged: 0, completed: 0, cancelled: 0 }
    db.campaigns.forEach((item) => {
      if (base[item.status] !== undefined) base[item.status] += 1
    })
    return base
  }, [db.campaigns])

  const sorted = useMemo(
    () =>
      [...db.campaigns].sort((a, b) => {
        const priority = { flagged: 0, paused: 1, active: 2, completed: 3, cancelled: 4 }
        const diff = (priority[a.status] ?? 5) - (priority[b.status] ?? 5)
        if (diff !== 0) return diff
        return new Date(b.createdAt) - new Date(a.createdAt)
      }),
    [db.campaigns],
  )

  const filtered = sorted.filter((campaign) => {
    const owner = usersById[campaign.userId]
    const matchesFilter = filter === 'all' || campaign.status === filter
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      [campaign.channelName, campaign.channelUrl, campaign.id, owner?.name, owner?.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    return matchesFilter && matchesSearch
  })

  const refundable = db.campaigns
    .filter((item) => ['active', 'paused', 'flagged'].includes(item.status))
    .reduce((sum, item) => sum + Math.max(0, item.target - item.completed) * RATES.subscriberCost, 0)

  const doPause = (reason) => {
    if (!pauseTarget) return
    setBusy(true)
    window.setTimeout(() => {
      const result = setCampaignState(pauseTarget.id, 'paused', reason)
      setBusy(false)
      setPauseTarget(null)
      if (!result.ok) {
        toast({ type: 'error', title: 'Could not pause', message: result.error })
        return
      }
      toast({ type: 'info', title: 'Campaign paused', message: `${pauseTarget.channelName} is hidden from the task wall.` })
    }, 350)
  }

  const doResume = (campaign) => {
    const result = setCampaignState(campaign.id, 'active')
    if (!result.ok) {
      toast({ type: 'error', title: 'Could not restore', message: result.error })
      return
    }
    toast({ type: 'success', title: 'Campaign restored', message: `${campaign.channelName} is live again.` })
  }

  const doCancel = () => {
    if (!cancelTarget) return
    setBusy(true)
    window.setTimeout(() => {
      const result = cancelCampaign(cancelTarget.id, 'Cancelled from admin moderation')
      setBusy(false)
      setCancelTarget(null)
      if (!result.ok) {
        toast({ type: 'error', title: 'Cancellation failed', message: result.error })
        return
      }
      toast({
        type: 'success',
        title: 'Campaign cancelled',
        message: `${fmtCoins(result.refund)} coins refunded for ${result.remaining} unfulfilled slots.`,
      })
    }, 400)
  }

  const doDelete = () => {
    if (!deleteTarget) return
    setBusy(true)
    window.setTimeout(() => {
      const result = deleteCampaign(deleteTarget.id)
      setBusy(false)
      setDeleteTarget(null)
      if (!result.ok) {
        toast({ type: 'error', title: 'Delete failed', message: result.error })
        return
      }
      toast({ type: 'info', title: 'Campaign deleted', message: 'The post is removed from the marketplace.' })
    }, 350)
  }

  const cancelRefund = cancelTarget
    ? Math.max(0, cancelTarget.target - cancelTarget.completed) * RATES.subscriberCost
    : 0

  return (
    <div>
      <AdminPageHeader
        eyebrow="Content moderation"
        title="Campaign moderation"
        description="Audit subscriber campaigns, pause suspicious posts and refund unspent slots when a campaign is terminated."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10.5px] font-semibold text-slate-400">
            <Receipt className="h-3.5 w-3.5" /> 4 coins = 1 subscriber
          </span>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Active campaigns"
          value={fmtCoins(counts.active)}
          hint="Visible on the task wall"
          icon={<Megaphone className="h-4 w-4" />}
          tone="indigo"
        />
        <AdminStatCard
          label="Paused / flagged"
          value={fmtCoins(counts.paused + counts.flagged)}
          hint={`${counts.flagged} flagged for review`}
          icon={<Flag className="h-4 w-4" />}
          tone="rose"
        />
        <AdminStatCard
          label="Completed"
          value={fmtCoins(counts.completed)}
          hint="Fully delivered campaigns"
          icon={<Play className="h-4 w-4" />}
          tone="emerald"
        />
        <AdminStatCard
          label="Refundable value"
          value={`${fmtCoins(refundable)} coins`}
          hint="Unfulfilled slots across live posts"
          icon={<RotateCcw className="h-4 w-4" />}
          tone="amber"
        />
      </div>

      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-white/[0.07] bg-[#0d1322] p-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'active', label: 'Active', count: counts.active },
            { id: 'paused', label: 'Paused', count: counts.paused },
            { id: 'flagged', label: 'Flagged', count: counts.flagged },
            { id: 'completed', label: 'Completed', count: counts.completed },
            { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
          ]}
        />
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search channel or owner…"
          className="sm:w-[260px]"
        />
      </div>

      <AdminTableShell
        footer={
          <>
            <span>
              Showing {filtered.length} of {db.campaigns.length} campaigns
            </span>
            <span className="text-[10px] text-slate-500">Deleting removes the post without a refund</span>
          </>
        }
      >
        <table className="hidden w-full lg:table">
          <thead>
            <tr className="border-b border-white/[0.07] text-left text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-500">
              <th className="px-4 py-3">Campaign</th>
              <th className="px-3 py-3">Owner</th>
              <th className="px-3 py-3">YouTube channel</th>
              <th className="px-3 py-3">Target</th>
              <th className="px-3 py-3">Delivered</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-4 py-3 text-right">Moderation</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((campaign) => {
              const owner = usersById[campaign.userId]
              return (
                <tr key={campaign.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-mono text-[10px] text-slate-500">#{campaign.id.slice(-8).toUpperCase()}</p>
                    <p className="max-w-[150px] truncate text-[12px] font-bold text-white">{campaign.channelName}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={owner?.name} size="xs" />
                      <div className="min-w-0">
                        <p className="max-w-[110px] truncate text-[11px] font-semibold text-slate-200">{owner?.name}</p>
                        <p className="max-w-[110px] truncate text-[9.5px] text-slate-500">{owner?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <a
                      href={campaign.channelUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex max-w-[190px] items-center gap-1.5 text-[10.5px] text-slate-300 transition hover:text-white"
                    >
                      <YoutubeIcon className="h-3.5 w-3.5 shrink-0 text-[#ff5a50]" />
                      <span className="truncate">{campaign.channelUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </td>
                  <td className="px-3 py-3 font-mono text-[11.5px] text-slate-200">{fmtCoins(campaign.target)}</td>
                  <td className="px-3 py-3">
                    <div className="w-[110px]">
                      <div className="mb-1 flex justify-between font-mono text-[9.5px] text-slate-500">
                        <span>
                          {campaign.completed}/{campaign.target}
                        </span>
                        <span>{Math.round((campaign.completed / campaign.target) * 100)}%</span>
                      </div>
                      <ProgressBar
                        value={campaign.completed}
                        max={campaign.target}
                        tone={campaign.status === 'flagged' ? 'amber' : campaign.completed >= campaign.target ? 'green' : 'red'}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <AdminStatus status={campaign.status} label={statusLabel[campaign.status]} />
                    {campaign.pauseReason && (
                      <p className="mt-1 max-w-[130px] truncate text-[9px] text-amber-300/60" title={campaign.pauseReason}>
                        {campaign.pauseReason}
                      </p>
                    )}
                    {campaign.flagReason && (
                      <p className="mt-1 max-w-[130px] truncate text-[9px] text-rose-300/60" title={campaign.flagReason}>
                        {campaign.flagReason}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[10px] text-slate-500">{formatDate(campaign.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {campaign.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => setPauseTarget(campaign)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-400/25 bg-amber-400/[0.08] px-2 py-1.5 text-[9.5px] font-bold text-amber-200 transition hover:bg-amber-400/15"
                        >
                          <Pause className="h-3 w-3" /> Pause
                        </button>
                      )}
                      {['paused', 'flagged'].includes(campaign.status) && (
                        <button
                          type="button"
                          onClick={() => doResume(campaign)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 py-1.5 text-[9.5px] font-bold text-emerald-200 transition hover:bg-emerald-500/20"
                        >
                          <Play className="h-3 w-3" /> Restore
                        </button>
                      )}
                      {campaign.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => setCancelTarget(campaign)}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/25 bg-indigo-500/10 px-2 py-1.5 text-[9.5px] font-bold text-indigo-200 transition hover:bg-indigo-500/20"
                        >
                          <RotateCcw className="h-3 w-3" /> Refund
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(campaign)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 px-2 py-1.5 text-[9.5px] font-bold text-rose-300 transition hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="divide-y divide-white/[0.06] lg:hidden">
          {filtered.map((campaign) => {
            const owner = usersById[campaign.userId]
            return (
              <div key={campaign.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ff0000]/10 text-[#ff7a70]">
                      <YoutubeIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-bold text-white">{campaign.channelName}</p>
                      <p className="truncate font-mono text-[9.5px] text-slate-500">
                        #{campaign.id.slice(-8).toUpperCase()} · {owner?.name}
                      </p>
                    </div>
                  </div>
                  <AdminStatus status={campaign.status} label={statusLabel[campaign.status]} />
                </div>

                <div className="mt-2.5">
                  <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-slate-500">
                    <span>
                      {campaign.completed} / {campaign.target} subscribers
                    </span>
                    <span>{Math.round((campaign.completed / campaign.target) * 100)}%</span>
                  </div>
                  <ProgressBar
                    value={campaign.completed}
                    max={campaign.target}
                    tone={campaign.status === 'flagged' ? 'amber' : campaign.completed >= campaign.target ? 'green' : 'red'}
                  />
                </div>

                <a
                  href={campaign.channelUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-semibold text-indigo-300"
                >
                  Open channel <ExternalLink className="h-3 w-3" />
                </a>

                {(campaign.pauseReason || campaign.flagReason) && (
                  <p className="mt-1.5 rounded-md border border-amber-400/15 bg-amber-400/[0.05] px-2 py-1.5 text-[10px] text-amber-200/70">
                    {campaign.pauseReason || campaign.flagReason}
                  </p>
                )}

                <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  {campaign.status === 'active' ? (
                    <button
                      type="button"
                      onClick={() => setPauseTarget(campaign)}
                      className="rounded-lg border border-amber-400/25 bg-amber-400/[0.08] px-2 py-2 text-[10px] font-bold text-amber-200"
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => doResume(campaign)}
                      className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 py-2 text-[10px] font-bold text-emerald-200"
                    >
                      Restore
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCancelTarget(campaign)}
                    className="rounded-lg border border-indigo-400/25 bg-indigo-500/10 px-2 py-2 text-[10px] font-bold text-indigo-200"
                  >
                    Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(campaign)}
                    className="rounded-lg border border-rose-500/20 px-2 py-2 text-[10px] font-bold text-rose-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <AdminEmpty
            title="No campaigns match this view"
            description="Clear the search or choose another status."
            icon={<Megaphone className="h-5 w-5" />}
          />
        )}
      </AdminTableShell>

      <ReasonDialog
        open={Boolean(pauseTarget)}
        onClose={() => setPauseTarget(null)}
        title="Force-pause campaign"
        description="The campaign disappears from the user task wall until restored."
        presets={['Broken YouTube link', 'Suspicious subscriber activity', 'Channel ownership unverified']}
        confirmLabel="Pause campaign"
        onSubmit={doPause}
        busy={busy}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel campaign & refund"
        description="Unfulfilled subscriber slots are refunded at 4 coins each. This cannot be undone."
        confirmLabel={`Refund ${fmtCoins(cancelRefund)} coins`}
        tone="purple"
        onConfirm={doCancel}
        busy={busy}
      >
        {cancelTarget && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/25 p-3">
              <div>
                <p className="text-[12px] font-bold text-white">{cancelTarget.channelName}</p>
                <p className="text-[10.5px] text-slate-500">
                  {fmtCoins(cancelTarget.completed)} delivered of {fmtCoins(cancelTarget.target)}
                </p>
              </div>
              <span className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.08] px-2 py-1 font-mono text-[11px] font-bold text-emerald-300">
                +{fmtCoins(cancelRefund)} coins
              </span>
            </div>
            <WarningNote>
              The owner will be notified and their wallet credited automatically. Delivered subscribers are not refunded.
            </WarningNote>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete campaign"
        description="The post is permanently removed. No refund is issued — use Cancel & Refund instead if coins should be returned."
        confirmLabel="Delete permanently"
        onConfirm={doDelete}
        busy={busy}
      >
        {deleteTarget && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold text-white">{deleteTarget.channelName}</p>
              <p className="text-[10.5px] text-slate-500">
                {deleteTarget.completed} / {deleteTarget.target} subscribers delivered
              </p>
            </div>
            <Trash2 className="h-4 w-4 shrink-0 text-rose-300" />
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
