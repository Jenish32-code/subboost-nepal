import { useMemo, useRef, useState } from 'react'
import {
  Banknote,
  Check,
  Clock,
  ImagePlus,
  Loader2,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'
import { Avatar, Button, Field, Modal } from '../components/ui'
import {
  AdminEmpty,
  AdminPageHeader,
  AdminStatCard,
  AdminStatus,
  AdminTableShell,
  AdminThumb,
  CopyValue,
  FilterTabs,
  ProofLightbox,
  ReasonDialog,
  SearchField,
} from './ui'
import { useApp } from '../store/appContext'
import { coins as fmtCoins, fileToThumbnail, formatDateTime, npr, timeAgo } from '../lib/utils'

function MethodPill({ method }) {
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

export function WithdrawalsAdmin() {
  const { db, approveWithdrawal, rejectWithdrawal, toast } = useApp()
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [payTarget, setPayTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [reference, setReference] = useState('')
  const [proof, setProof] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  const usersById = useMemo(
    () => Object.fromEntries(db.users.map((item) => [item.id, item])),
    [db.users],
  )

  const sorted = useMemo(
    () =>
      [...db.withdrawals].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (b.status === 'pending' && a.status !== 'pending') return 1
        return new Date(b.createdAt) - new Date(a.createdAt)
      }),
    [db.withdrawals],
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
      [owner?.name, owner?.email, item.accountName, item.accountNumber, item.code, item.method]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    return matchesFilter && matchesSearch
  })

  const pendingNpr = db.withdrawals
    .filter((item) => item.status === 'pending')
    .reduce((sum, item) => sum + item.npr, 0)
  const paidNpr = db.withdrawals
    .filter((item) => item.status === 'approved')
    .reduce((sum, item) => sum + item.npr, 0)

  const openPay = (withdrawal) => {
    setPayTarget(withdrawal)
    setReference('')
    setProof(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const pickProof = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ type: 'error', title: 'Unsupported file', message: 'Attach a PNG or JPG payout proof.' })
      return
    }
    setUploading(true)
    try {
      setProof(await fileToThumbnail(file, 600))
    } catch (error) {
      toast({ type: 'error', title: 'Could not read image', message: error.message })
    } finally {
      setUploading(false)
    }
  }

  const doPay = () => {
    if (!payTarget) return
    setBusy(true)
    window.setTimeout(() => {
      const result = approveWithdrawal(payTarget.id, { reference, proof })
      setBusy(false)
      setPayTarget(null)
      if (!result.ok) {
        toast({ type: 'error', title: 'Payout not completed', message: result.error })
        return
      }
      toast({
        type: 'success',
        title: 'Payout marked as paid',
        message: `NPR ${fmtCoins(payTarget.npr)} to ${payTarget.accountName} · Receipt #${payTarget.code}.`,
      })
    }, 450)
  }

  const doReject = (reason) => {
    if (!rejectTarget) return
    setBusy(true)
    window.setTimeout(() => {
      const result = rejectWithdrawal(rejectTarget.id, reason)
      setBusy(false)
      setRejectTarget(null)
      if (!result.ok) {
        toast({ type: 'error', title: 'Refund failed', message: result.error })
        return
      }
      toast({
        type: 'info',
        title: 'Payout rejected & refunded',
        message: `${fmtCoins(result.refunded)} coins returned to the user's wallet.`,
      })
    }, 400)
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Payout settlement"
        title="Withdrawal queue"
        description="Coins are already deducted when a request is made. Pay the destination wallet, then mark it paid — or reject and refund in one step."
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
          label="Pending payouts"
          value={fmtCoins(counts.pending)}
          hint={`NPR ${fmtCoins(pendingNpr)} to settle`}
          icon={<Clock className="h-4 w-4" />}
          tone="amber"
        />
        <AdminStatCard
          label="Paid to date"
          value={`NPR ${fmtCoins(paidNpr)}`}
          hint={`${counts.approved} completed payouts`}
          icon={<Banknote className="h-4 w-4" />}
          tone="emerald"
        />
        <AdminStatCard
          label="Rejected & refunded"
          value={fmtCoins(counts.rejected)}
          hint="Coins returned to users"
          icon={<Wallet className="h-4 w-4" />}
          tone="rose"
        />
      </div>

      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-white/[0.07] bg-[#0d1322] p-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'pending', label: 'Pending', count: counts.pending },
            { id: 'approved', label: 'Paid', count: counts.approved },
            { id: 'rejected', label: 'Rejected', count: counts.rejected },
            { id: 'all', label: 'All', count: counts.all },
          ]}
        />
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search user, account, receipt…"
          className="sm:w-[280px]"
        />
      </div>

      <AdminTableShell
        footer={
          <>
            <span>
              Showing {filtered.length} of {sorted.length} payout requests
            </span>
            <span className="font-mono text-[10px] text-slate-500">1 coin = NPR 1</span>
          </>
        }
      >
        <table className="hidden w-full lg:table">
          <thead>
            <tr className="border-b border-white/[0.07] text-left text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-500">
              <th className="px-4 py-3">User</th>
              <th className="px-3 py-3">Destination</th>
              <th className="px-3 py-3">Method</th>
              <th className="px-3 py-3">Coins</th>
              <th className="px-3 py-3">Payout</th>
              <th className="px-3 py-3">Receipt</th>
              <th className="px-3 py-3">Requested</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((withdrawal) => {
              const owner = usersById[withdrawal.userId]
              return (
                <tr key={withdrawal.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={owner?.name} size="xs" />
                      <div className="min-w-0">
                        <p className="max-w-[130px] truncate text-[12px] font-semibold text-white">
                          {owner?.name || 'Unknown'}
                        </p>
                        <p className="max-w-[130px] truncate text-[10px] text-slate-500">{owner?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-[11px] font-semibold text-slate-200">{withdrawal.accountName}</p>
                    <p className="font-mono text-[10px] text-slate-400">{withdrawal.accountNumber}</p>
                  </td>
                  <td className="px-3 py-3">
                    <MethodPill method={withdrawal.method} />
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-mono text-[12px] font-semibold text-amber-200">
                      −{fmtCoins(withdrawal.amount)}
                    </p>
                    <p className="text-[9.5px] text-slate-500">coins deducted</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-mono text-[12px] font-semibold text-white">NPR {fmtCoins(withdrawal.npr)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-md border border-indigo-400/20 bg-indigo-500/[0.08] px-2 py-1 font-mono text-[11px] font-bold tracking-widest text-indigo-200">
                      {withdrawal.code}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-[11px] text-slate-300">{timeAgo(withdrawal.createdAt)}</p>
                    <p className="text-[9.5px] text-slate-500">{formatDateTime(withdrawal.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <AdminStatus status={withdrawal.status} label={withdrawal.status === 'approved' ? 'Paid' : undefined} />
                    {withdrawal.status === 'rejected' && withdrawal.rejectionReason && (
                      <p
                        className="mt-1 max-w-[130px] truncate text-[9.5px] text-rose-300/70"
                        title={withdrawal.rejectionReason}
                      >
                        {withdrawal.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {withdrawal.status === 'pending' ? (
                      <div className="flex flex-col items-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openPay(withdrawal)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/25 bg-emerald-500/15 px-2 py-1.5 text-[10px] font-bold text-emerald-200 transition hover:bg-emerald-500/25"
                        >
                          <Check className="h-3 w-3" /> Mark paid
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectTarget(withdrawal)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 px-2 py-1 text-[9.5px] font-bold text-rose-300/90 transition hover:bg-rose-500/10"
                        >
                          <X className="h-3 w-3" /> Reject & refund
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-[10px] text-slate-500">
                          {withdrawal.resolvedAt ? `Resolved ${timeAgo(withdrawal.resolvedAt)}` : '—'}
                        </p>
                        {withdrawal.payoutProof && (
                          <AdminThumb
                            src={withdrawal.payoutProof}
                            size="sm"
                            onClick={() => setLightbox({ proof: withdrawal.payoutProof, code: withdrawal.code })}
                          />
                        )}
                        {withdrawal.adminReference && (
                          <p className="max-w-[110px] truncate font-mono text-[9px] text-slate-500">
                            {withdrawal.adminReference}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="divide-y divide-white/[0.06] lg:hidden">
          {filtered.map((withdrawal) => {
            const owner = usersById[withdrawal.userId]
            return (
              <div key={withdrawal.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={owner?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-bold text-white">{owner?.name}</p>
                        <p className="truncate text-[10px] text-slate-500">{owner?.email}</p>
                      </div>
                      <AdminStatus
                        status={withdrawal.status}
                        label={withdrawal.status === 'approved' ? 'Paid' : undefined}
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <MethodPill method={withdrawal.method} />
                      <span className="font-mono text-[12px] font-bold text-white">NPR {fmtCoins(withdrawal.npr)}</span>
                      <span className="font-mono text-[10px] text-amber-300">−{fmtCoins(withdrawal.amount)} coins</span>
                    </div>

                    <div className="mt-2 space-y-1 rounded-lg border border-white/[0.06] bg-black/20 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500">Receipt</span>
                        <span className="font-mono text-[11px] font-bold tracking-widest text-indigo-200">
                          #{withdrawal.code}
                        </span>
                      </div>
                      <p className="truncate text-[10.5px] text-slate-300">
                        {withdrawal.accountName} · <span className="font-mono">{withdrawal.accountNumber}</span>
                      </p>
                    </div>

                    {withdrawal.status === 'pending' ? (
                      <div className="mt-2.5 grid grid-cols-2 gap-2">
                        <Button size="sm" variant="green" onClick={() => openPay(withdrawal)}>
                          <Check className="h-3.5 w-3.5" /> Mark paid
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setRejectTarget(withdrawal)}>
                          <X className="h-3.5 w-3.5" /> Refund
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-[10px] text-slate-500">
                          {withdrawal.rejectionReason
                            ? `Reason: ${withdrawal.rejectionReason}`
                            : withdrawal.adminReference || 'Resolved'}
                        </p>
                        {withdrawal.payoutProof && (
                          <button
                            type="button"
                            onClick={() => setLightbox({ proof: withdrawal.payoutProof, code: withdrawal.code })}
                            className="text-[10px] font-semibold text-indigo-300"
                          >
                            View proof
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <AdminEmpty
            title="No payouts match this view"
            description="Try another status tab or clear the search."
            icon={<Banknote className="h-5 w-5" />}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFilter('pending')
                  setSearch('')
                }}
              >
                Show pending payouts
              </Button>
            }
          />
        )}
      </AdminTableShell>

      <ProofLightbox
        proof={lightbox?.proof}
        onClose={() => setLightbox(null)}
        title={lightbox ? `Payout proof · Receipt #${lightbox.code}` : 'Payout proof'}
      />

      {/* Mark paid modal */}
      <Modal
        open={Boolean(payTarget)}
        onClose={() => setPayTarget(null)}
        title="Mark payout as paid"
        description="Confirm the transfer before resolving this request."
        size="md"
        locked={busy}
      >
        {payTarget && (
          <div className="space-y-3.5">
            <div className="rounded-xl border border-white/[0.08] bg-black/25 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Paying</p>
                  <p className="mt-0.5 font-mono text-xl font-bold text-white">NPR {fmtCoins(payTarget.npr)}</p>
                </div>
                <div className="text-right">
                  <MethodPill method={payTarget.method} />
                  <p className="mt-1 font-mono text-[10px] tracking-widest text-indigo-200">#{payTarget.code}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-2.5 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Account holder</span>
                  <span className="font-semibold text-slate-200">{payTarget.accountName}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Destination</span>
                  <CopyValue value={payTarget.accountNumber} />
                </div>
              </div>
            </div>

            <Field
              label="Admin reference ID (optional)"
              htmlFor="payout-ref"
              hint="Gateway transaction ID for your own reconciliation."
            >
              <input
                id="payout-ref"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="e.g. KHL-PAY-994120"
                className="input font-mono text-[12.5px]"
              />
            </Field>

            <div>
              <span className="label">Payout proof (optional)</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => pickProof(event.target.files?.[0])}
              />
              {proof ? (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-2.5">
                  <img src={proof.dataUrl} alt="Payout proof preview" className="h-12 w-12 rounded-lg border border-white/10 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-slate-100">{proof.name}</p>
                    <p className="text-[10px] text-slate-500">Attached to this payout</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProof(null)
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                    aria-label="Remove proof"
                    className="rounded-lg border border-white/10 p-2 text-slate-400 hover:border-rose-400/30 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-black/20 px-3 py-3 text-[11.5px] font-semibold text-slate-300 transition hover:border-indigo-400/40 hover:bg-indigo-500/[0.04]"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {uploading ? 'Preparing preview…' : 'Attach payment screenshot'}
                </button>
              )}
            </div>

            <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-2.5 text-[10.5px] leading-relaxed text-emerald-200/70">
              Marking paid finalises the payout and notifies the user. The coins were already deducted at request time.
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="md" className="flex-1" onClick={() => setPayTarget(null)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="purple" size="md" className="flex-1" loading={busy} onClick={doPay}>
                <Check className="h-4 w-4" /> Confirm paid
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ReasonDialog
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject & refund payout"
        description="The deducted coins are returned to the user's wallet immediately."
        presets={['Account Number Mismatch', 'Invalid Receipt Code', 'Suspicious Activity']}
        confirmLabel={rejectTarget ? `Refund ${fmtCoins(rejectTarget.amount)} coins` : 'Reject & refund'}
        onSubmit={doReject}
        busy={busy}
      >
        {rejectTarget && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-black/25 p-3 text-[11px]">
            <div>
              <p className="font-semibold text-white">{usersById[rejectTarget.userId]?.name}</p>
              <p className="text-slate-500">
                Receipt #{rejectTarget.code} · NPR {fmtCoins(rejectTarget.npr)}
              </p>
            </div>
            <span className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-1 font-mono text-[11px] font-bold text-rose-300">
              +{fmtCoins(rejectTarget.amount)} coins back
            </span>
          </div>
        )}
      </ReasonDialog>
    </div>
  )
}
