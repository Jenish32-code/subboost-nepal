import { useMemo, useState } from 'react'
import {
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
  ShieldX,
  X,
} from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import {
  AdminEmpty,
  AdminPageHeader,
  AdminStatCard,
  AdminStatus,
  AdminTableShell,
  AdminThumb,
  ConfirmDialog,
  FilterTabs,
  ProofLightbox,
  ReasonDialog,
  SearchField,
} from './ui'
import { useApp } from '../store/appContext'
import { coins as fmtCoins, formatDateTime, npr, timeAgo } from '../lib/utils'

function GatewayPill({ method }) {
  const khalti = method === 'khalti'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold ${
        khalti
          ? 'border-[#8b5cf6]/30 bg-[#5C2D91]/20 text-violet-200'
          : 'border-[#60BB46]/30 bg-[#60BB46]/15 text-emerald-200'
      }`}
    >
      <span
        className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] text-[8px] font-extrabold text-white ${
          khalti ? 'bg-[#5C2D91]' : 'bg-[#60BB46]'
        }`}
      >
        {khalti ? 'K' : 'e'}
      </span>
      {khalti ? 'Khalti' : 'eSewa'}
    </span>
  )
}

export function DepositsAdmin() {
  const { db, approveDeposit, rejectDeposit, toast } = useApp()
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const usersById = useMemo(
    () => Object.fromEntries(db.users.map((item) => [item.id, item])),
    [db.users],
  )

  const sorted = useMemo(
    () =>
      [...db.deposits].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (b.status === 'pending' && a.status !== 'pending') return 1
        return new Date(b.createdAt) - new Date(a.createdAt)
      }),
    [db.deposits],
  )

  const counts = {
    all: sorted.length,
    pending: sorted.filter((item) => item.status === 'pending').length,
    approved: sorted.filter((item) => item.status === 'approved').length,
    rejected: sorted.filter((item) => item.status === 'rejected').length,
  }

  const filtered = sorted.filter((item) => {
    const owner = usersById[item.userId]
    const matchesFilter = filter === 'all' || item.status === filter
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      [owner?.name, owner?.email, item.transactionId, item.ref, item.method]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    return matchesFilter && matchesSearch
  })

  const pendingValue = db.deposits
    .filter((item) => item.status === 'pending')
    .reduce((sum, item) => sum + item.amount, 0)
  const approvedValue = db.deposits
    .filter((item) => item.status === 'approved')
    .reduce((sum, item) => sum + item.amount, 0)

  const doApprove = () => {
    if (!approveTarget) return
    setBusy(true)
    window.setTimeout(() => {
      const result = approveDeposit(approveTarget.id)
      setBusy(false)
      setApproveTarget(null)
      if (!result.ok) {
        toast({ type: 'error', title: 'Approval failed', message: result.error })
        return
      }
      toast({
        type: 'success',
        title: 'Deposit approved',
        message: `${fmtCoins(result.coins)} coins credited to ${result.name}.`,
      })
    }, 500)
  }

  const doReject = (reason) => {
    if (!rejectTarget) return
    setBusy(true)
    window.setTimeout(() => {
      const result = rejectDeposit(rejectTarget.id, reason)
      setBusy(false)
      setRejectTarget(null)
      if (!result.ok) {
        toast({ type: 'error', title: 'Rejection failed', message: result.error })
        return
      }
      toast({
        type: 'info',
        title: 'Deposit rejected',
        message: 'No coins were credited. The user has been notified.',
      })
    }, 400)
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Manual verification"
        title="Deposit queue"
        description="Match Khalti and eSewa transfers against the submitted transaction ID and screenshot before crediting coins."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setFilter('pending')
              setSearch('')
            }}
          >
            <Clock className="h-3.5 w-3.5" /> Reset queue filters
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <AdminStatCard
          label="Pending deposits"
          value={fmtCoins(counts.pending)}
          hint={`NPR ${fmtCoins(pendingValue)} awaiting review`}
          icon={<Clock className="h-4 w-4" />}
          tone="amber"
        />
        <AdminStatCard
          label="Approved revenue"
          value={`NPR ${fmtCoins(approvedValue)}`}
          hint={`${counts.approved} verified transfers`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="emerald"
        />
        <AdminStatCard
          label="Rejected deposits"
          value={fmtCoins(counts.rejected)}
          hint="No coins credited"
          icon={<ShieldX className="h-4 w-4" />}
          tone="rose"
        />
      </div>

      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-white/[0.07] bg-[#0d1322] p-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'pending', label: 'Pending', count: counts.pending },
            { id: 'approved', label: 'Approved', count: counts.approved },
            { id: 'rejected', label: 'Rejected', count: counts.rejected },
            { id: 'all', label: 'All', count: counts.all },
          ]}
        />
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search user, txn ID, ref…"
          className="sm:w-[280px]"
        />
      </div>

      <AdminTableShell
        footer={
          <>
            <span>
              Showing {filtered.length} of {sorted.length} deposits
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-amber-300/80">
              <ShieldCheck className="h-3 w-3" /> Approving credits coins instantly
            </span>
          </>
        }
      >
        {/* Desktop table */}
        <table className="hidden w-full lg:table">
          <thead>
            <tr className="border-b border-white/[0.07] text-left text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-500">
              <th className="px-4 py-3">User</th>
              <th className="px-3 py-3">Gateway</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Txn / Ref</th>
              <th className="px-3 py-3">Proof</th>
              <th className="px-3 py-3">Requested</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((deposit) => {
              const owner = usersById[deposit.userId]
              return (
                <tr key={deposit.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={owner?.name} size="xs" />
                      <div className="min-w-0">
                        <p className="max-w-[150px] truncate text-[12px] font-semibold text-white">
                          {owner?.name || 'Unknown'}
                        </p>
                        <p className="max-w-[150px] truncate text-[10px] text-slate-500">{owner?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <GatewayPill method={deposit.method} />
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-mono text-[12px] font-semibold text-white">NPR {fmtCoins(deposit.amount)}</p>
                    <p className="text-[10px] text-amber-300/80">+{fmtCoins(deposit.coins)} coins</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="max-w-[130px] truncate font-mono text-[11px] text-slate-200">{deposit.transactionId}</p>
                    <p className="font-mono text-[9.5px] text-slate-500">{deposit.ref}</p>
                  </td>
                  <td className="px-3 py-3">
                    <AdminThumb src={deposit.screenshot} onClick={() => setLightbox(deposit)} />
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-[11px] text-slate-300">{timeAgo(deposit.createdAt)}</p>
                    <p className="text-[9.5px] text-slate-500">{formatDateTime(deposit.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <AdminStatus status={deposit.status} />
                    {deposit.status === 'rejected' && deposit.rejectionReason && (
                      <p className="mt-1 max-w-[130px] truncate text-[9.5px] text-rose-300/70" title={deposit.rejectionReason}>
                        {deposit.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {deposit.status === 'pending' ? (
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setApproveTarget(deposit)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/25 bg-emerald-500/15 px-2 py-1.5 text-[10px] font-bold text-emerald-200 transition hover:bg-emerald-500/25"
                        >
                          <Check className="h-3 w-3" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectTarget(deposit)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/10 px-2 py-1.5 text-[10px] font-bold text-rose-200 transition hover:bg-rose-500/20"
                        >
                          <X className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    ) : (
                      <p className="text-right text-[10px] text-slate-500">
                        {deposit.reviewedAt ? `Reviewed ${timeAgo(deposit.reviewedAt)}` : '—'}
                      </p>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="divide-y divide-white/[0.06] lg:hidden">
          {filtered.map((deposit) => {
            const owner = usersById[deposit.userId]
            return (
              <div key={deposit.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={owner?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-bold text-white">{owner?.name}</p>
                        <p className="truncate text-[10px] text-slate-500">{owner?.email}</p>
                      </div>
                      <AdminStatus status={deposit.status} />
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <GatewayPill method={deposit.method} />
                      <span className="font-mono text-[11px] text-slate-200">NPR {fmtCoins(deposit.amount)}</span>
                      <span className="font-mono text-[10px] text-amber-300">+{fmtCoins(deposit.coins)}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-black/20 p-2">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[10.5px] text-slate-300">{deposit.transactionId}</p>
                        <p className="text-[9.5px] text-slate-500">
                          {deposit.ref} · {timeAgo(deposit.createdAt)}
                        </p>
                      </div>
                      <AdminThumb
                        src={deposit.screenshot}
                        size="sm"
                        onClick={() => setLightbox(deposit)}
                      />
                    </div>

                    {deposit.status === 'pending' ? (
                      <div className="mt-2.5 grid grid-cols-2 gap-2">
                        <Button size="sm" variant="green" onClick={() => setApproveTarget(deposit)}>
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setRejectTarget(deposit)}>
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-2 text-[10px] text-slate-500">
                        {deposit.rejectionReason
                          ? `Reason: ${deposit.rejectionReason}`
                          : `Reviewed ${deposit.reviewedAt ? timeAgo(deposit.reviewedAt) : ''}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <AdminEmpty
            title="No deposits match this view"
            description="Try a different status tab or clear the search."
            icon={<CreditCard className="h-5 w-5" />}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFilter('pending')
                  setSearch('')
                }}
              >
                Show pending queue
              </Button>
            }
          />
        )}
      </AdminTableShell>

      <ProofLightbox
        proof={lightbox?.screenshot}
        onClose={() => setLightbox(null)}
        title={`${lightbox?.method === 'khalti' ? 'Khalti' : 'eSewa'} payment · ${lightbox ? npr(lightbox.amount) : ''}`}
      />

      <ConfirmDialog
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        title="Approve this deposit?"
        description="The coins are credited to the user's live wallet immediately."
        confirmLabel={
          approveTarget ? `Credit ${fmtCoins(approveTarget.coins)} coins` : 'Approve deposit'
        }
        onConfirm={doApprove}
        busy={busy}
      >
        {approveTarget && (
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/25 p-3">
            <Avatar name={usersById[approveTarget.userId]?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold text-white">
                {usersById[approveTarget.userId]?.name}
              </p>
              <p className="truncate text-[10.5px] text-slate-500">{usersById[approveTarget.userId]?.email}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[12px] font-bold text-emerald-300">+{fmtCoins(approveTarget.coins)}</p>
              <p className="text-[10px] text-slate-500">{npr(approveTarget.amount)}</p>
            </div>
          </div>
        )}
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-2.5 text-[10.5px] leading-relaxed text-amber-200/70">
          <Banknote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Only approve once the screenshot, amount and reference match.
        </div>
      </ConfirmDialog>

      <ReasonDialog
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject this deposit"
        description="No coins will be credited. The user receives your reason in their notifications."
        presets={['Invalid Reference Code', 'Illegible Screenshot', 'Payment Not Received']}
        confirmLabel="Reject deposit"
        onSubmit={doReject}
        busy={busy}
      />
    </div>
  )
}
