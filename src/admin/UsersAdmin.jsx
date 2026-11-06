import { useMemo, useState } from 'react'
import {
  Ban,
  CheckCircle2,
  Coins,
  KeyRound,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react'
import { Avatar, Button, Modal } from '../components/ui'
import {
  AdminEmpty,
  AdminPageHeader,
  AdminStatCard,
  AdminStatus,
  AdminTableShell,
  ConfirmDialog,
  CopyValue,
  FilterTabs,
  LedgerRow,
  SearchField,
  SuccessNote,
  WarningNote,
} from './ui'
import { useApp } from '../store/appContext'
import { coins as fmtCoins, formatDate, npr, timeAgo } from '../lib/utils'

export function UsersAdmin() {
  const {
    db,
    adminUser,
    adjustBalance,
    resetUserPin,
    resetUserPassword,
    suspendUser,
    activateUser,
    toast,
  } = useApp()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [mode, setMode] = useState('details')
  const [direction, setDirection] = useState('add')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [adjustError, setAdjustError] = useState('')
  const [credential, setCredential] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const usersById = useMemo(
    () => Object.fromEntries(db.users.map((item) => [item.id, item])),
    [db.users],
  )
  const selected = selectedId ? usersById[selectedId] : null

  const sorted = useMemo(
    () => [...db.users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [db.users],
  )

  const counts = {
    all: sorted.length,
    active: sorted.filter((item) => item.status === 'active' && item.role !== 'admin').length,
    suspended: sorted.filter((item) => item.status === 'suspended').length,
    admin: sorted.filter((item) => item.role === 'admin').length,
  }

  const filtered = sorted.filter((item) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      [item.name, item.email, item.phone].filter(Boolean).some((value) =>
        String(value).toLowerCase().includes(query),
      )
    if (!matchesSearch) return false
    if (filter === 'all') return true
    if (filter === 'admin') return item.role === 'admin'
    if (filter === 'suspended') return item.status === 'suspended'
    return item.status === 'active' && item.role !== 'admin'
  })

  const ledgerFor = (userId) => {
    const deposits = db.deposits.filter((item) => item.userId === userId && item.status === 'approved')
    const withdrawals = db.withdrawals.filter(
      (item) => item.userId === userId && item.status === 'approved',
    )
    const campaigns = db.campaigns.filter((item) => item.userId === userId)
    return {
      deposited: deposits.reduce((sum, item) => sum + item.amount, 0),
      withdrawn: withdrawals.reduce((sum, item) => sum + item.npr, 0),
      campaigns: campaigns.length,
      activeCampaigns: campaigns.filter((item) => item.status === 'active').length,
      pendingDeposits: db.deposits.filter((item) => item.userId === userId && item.status === 'pending').length,
      pendingWithdrawals: db.withdrawals.filter(
        (item) => item.userId === userId && item.status === 'pending',
      ).length,
      adjustments: db.adjustments.filter((item) => item.userId === userId),
    }
  }

  const openUser = (userId) => {
    setSelectedId(userId)
    setMode('details')
    setCredential(null)
    setAdjustError('')
    setDirection('add')
    setAmount('')
    setNote('')
  }

  const closeUser = () => {
    setSelectedId(null)
    setCredential(null)
    setBusy(false)
    setMode('details')
  }

  const doAdjust = (event) => {
    event.preventDefault()
    if (!selected) return
    setAdjustError('')
    const value = Number(amount)
    if (!Number.isInteger(value) || value <= 0) {
      setAdjustError('Enter a whole number greater than zero.')
      return
    }
    if (!note.trim()) {
      setAdjustError('An audit note is required for every manual adjustment.')
      return
    }
    const delta = direction === 'add' ? value : -value
    setBusy(true)
    window.setTimeout(() => {
      const result = adjustBalance(selected.id, delta, note)
      setBusy(false)
      if (!result.ok) {
        setAdjustError(result.error)
        return
      }
      toast({
        type: 'success',
        title: delta > 0 ? 'Coins credited' : 'Coins deducted',
        message: `${fmtCoins(Math.abs(delta))} coins ${delta > 0 ? 'added to' : 'removed from'} ${selected.name}'s wallet.`,
      })
      setMode('details')
      setAmount('')
      setNote('')
    }, 400)
  }

  const doResetPin = () => {
    if (!selected) return
    const result = resetUserPin(selected.id)
    if (!result.ok) {
      toast({ type: 'error', title: 'PIN reset failed', message: result.error })
      return
    }
    setCredential({
      label: 'Temporary Security PIN',
      value: result.pin,
      hint: 'Share this only with the verified account owner. They should change it after signing in.',
    })
    toast({ type: 'success', title: 'Security PIN reset', message: `New PIN generated for ${selected.name}.` })
  }

  const doResetPassword = () => {
    if (!selected) return
    const result = resetUserPassword(selected.id)
    if (!result.ok) {
      toast({ type: 'error', title: 'Password reset failed', message: result.error })
      return
    }
    setCredential({
      label: 'Temporary password',
      value: result.password,
      hint: 'Send this through a verified support channel. The user should change it from Profile.',
    })
    toast({ type: 'success', title: 'Password reset', message: `Temporary password generated for ${selected.name}.` })
  }

  const doConfirmStatus = () => {
    if (!selected || !confirm) return
    setBusy(true)
    window.setTimeout(() => {
      const result =
        confirm === 'suspend' ? suspendUser(selected.id) : activateUser(selected.id)
      setBusy(false)
      setConfirm(null)
      if (!result.ok) {
        toast({ type: 'error', title: 'Action failed', message: result.error })
        return
      }
      toast({
        type: confirm === 'suspend' ? 'info' : 'success',
        title: confirm === 'suspend' ? 'Account suspended' : 'Account reinstated',
        message:
          confirm === 'suspend'
            ? 'Login access revoked, campaigns hidden and the user notified.'
            : 'Login access restored and suspended campaigns re-published.',
      })
    }, 400)
  }

  const ledger = selected ? ledgerFor(selected.id) : null
  const recentAdjustments = ledger
    ? [...ledger.adjustments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4)
    : []

  return (
    <div>
      <AdminPageHeader
        eyebrow="Accounts & security"
        title="User database"
        description="Search every creator, inspect their wallet ledger, adjust balances with an audit trail, and freeze accounts that break the rules."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <AdminStatCard
          label="Customers"
          value={fmtCoins(counts.active + counts.suspended)}
          hint="All non-admin accounts"
          icon={<Users className="h-4 w-4" />}
          tone="indigo"
        />
        <AdminStatCard
          label="Suspended"
          value={fmtCoins(counts.suspended)}
          hint="Login revoked · posts hidden"
          icon={<Ban className="h-4 w-4" />}
          tone="rose"
        />
        <AdminStatCard
          label="Administrators"
          value={fmtCoins(counts.admin)}
          hint="Full console access"
          icon={<ShieldCheck className="h-4 w-4" />}
          tone="violet"
        />
      </div>

      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-white/[0.07] bg-[#0d1322] p-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'active', label: 'Active', count: counts.active },
            { id: 'suspended', label: 'Suspended', count: counts.suspended },
            { id: 'admin', label: 'Admins', count: counts.admin },
          ]}
        />
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search name, email or phone…"
          className="sm:w-[280px]"
        />
      </div>

      <AdminTableShell
        footer={
          <>
            <span>
              Showing {filtered.length} of {sorted.length} accounts
            </span>
            <span className="text-[10px] text-slate-500">Every adjustment is logged with the admin note</span>
          </>
        }
      >
        <table className="hidden w-full md:table">
          <thead>
            <tr className="border-b border-white/[0.07] text-left text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-500">
              <th className="px-4 py-3">User</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Balance</th>
              <th className="px-3 py-3">Lifetime earned</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Manage</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={item.name} size="sm" />
                    <div className="min-w-0">
                      <p className="max-w-[150px] truncate text-[12px] font-semibold text-white">{item.name}</p>
                      <p className="max-w-[170px] truncate text-[10px] text-slate-500">{item.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-[10.5px] text-slate-400">{item.phone || '—'}</td>
                <td className="px-3 py-3">
                  <p className="font-mono text-[12px] font-bold text-amber-200">{fmtCoins(item.coins)}</p>
                  <p className="text-[9.5px] text-slate-500">coins</p>
                </td>
                <td className="px-3 py-3 font-mono text-[11px] text-emerald-300">+{fmtCoins(item.lifetimeEarned)}</td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-md border px-2 py-1 text-[9.5px] font-bold uppercase tracking-wider ${
                      item.role === 'admin'
                        ? 'border-violet-400/25 bg-violet-500/10 text-violet-200'
                        : 'border-white/10 bg-white/[0.03] text-slate-400'
                    }`}
                  >
                    {item.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <AdminStatus status={item.status} label={item.status === 'suspended' ? 'Suspended' : 'Active'} />
                </td>
                <td className="px-3 py-3 text-[10px] text-slate-500">{formatDate(item.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openUser(item.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/25 bg-indigo-500/10 px-2.5 py-1.5 text-[10px] font-bold text-indigo-200 transition hover:bg-indigo-500/20"
                  >
                    <UserCog className="h-3 w-3" /> Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="divide-y divide-white/[0.06] md:hidden">
          {filtered.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-4">
              <Avatar name={item.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-bold text-white">{item.name}</p>
                    <p className="truncate text-[10px] text-slate-500">{item.email}</p>
                  </div>
                  <AdminStatus status={item.status} label={item.status === 'suspended' ? 'Suspended' : 'Active'} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                  <span className="font-mono text-amber-200">{fmtCoins(item.coins)} coins</span>
                  <span>{item.role === 'admin' ? 'Administrator' : 'Creator'}</span>
                  <span>{item.phone}</span>
                </div>
                <Button size="sm" variant="secondary" className="mt-2.5 w-full" onClick={() => openUser(item.id)}>
                  <UserCog className="h-3.5 w-3.5" /> Manage account
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <AdminEmpty
            title="No users found"
            description="Try another filter or search term."
            icon={<Users className="h-5 w-5" />}
          />
        )}
      </AdminTableShell>

      {/* User detail modal */}
      <Modal
        open={Boolean(selected)}
        onClose={closeUser}
        size="lg"
        title={mode === 'adjust' ? 'Manual balance adjustment' : 'User account'}
        description={
          selected
            ? mode === 'adjust'
              ? `Adjust ${selected.name}'s wallet with a mandatory audit note.`
              : `${selected.email} · joined ${formatDate(selected.createdAt)}`
            : ''
        }
        locked={busy}
      >
        {selected && ledger && (
          <div className="space-y-4">
            {mode === 'details' ? (
              <>
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/25 p-3.5">
                  <Avatar name={selected.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-[15px] font-extrabold text-white">{selected.name}</p>
                      <AdminStatus
                        status={selected.status}
                        label={selected.status === 'suspended' ? 'Suspended' : 'Active'}
                      />
                      {selected.role === 'admin' && (
                        <span className="rounded-md border border-violet-400/25 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-200">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">{selected.email}</p>
                    <p className="text-[10.5px] text-slate-500">{selected.phone || 'No phone on file'}</p>
                  </div>
                </div>

                {credential && (
                  <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] p-3.5">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-emerald-300/80">
                      {credential.label}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-3">
                      <p className="font-mono text-xl font-bold tracking-wider text-emerald-100">{credential.value}</p>
                      <CopyValue value={credential.value} label="Copy" />
                    </div>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-emerald-200/60">{credential.hint}</p>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Financial ledger
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <LedgerRow label="Current coin balance" value={`${fmtCoins(selected.coins)} coins`} accent="text-amber-200" />
                    <LedgerRow label="Lifetime earned" value={`+${fmtCoins(selected.lifetimeEarned)} coins`} accent="text-emerald-300" />
                    <LedgerRow label="Lifetime deposited" value={npr(ledger.deposited)} />
                    <LedgerRow label="Lifetime withdrawn" value={npr(ledger.withdrawn)} />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-2 text-center">
                      <p className="font-mono text-[13px] font-bold text-white">{ledger.activeCampaigns}</p>
                      <p className="text-[9px] uppercase tracking-wider text-slate-500">Active posts</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-2 text-center">
                      <p className="font-mono text-[13px] font-bold text-amber-300">{ledger.pendingDeposits}</p>
                      <p className="text-[9px] uppercase tracking-wider text-slate-500">Deposits pending</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-2 text-center">
                      <p className="font-mono text-[13px] font-bold text-sky-300">{ledger.pendingWithdrawals}</p>
                      <p className="text-[9px] uppercase tracking-wider text-slate-500">Payouts pending</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setMode('adjust')
                      setCredential(null)
                    }}
                  >
                    <Coins className="h-4 w-4" /> Adjust balance
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="md" onClick={doResetPin}>
                      <KeyRound className="h-4 w-4" /> Reset PIN
                    </Button>
                    <Button variant="secondary" size="md" onClick={doResetPassword}>
                      <Lock className="h-4 w-4" /> Reset password
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    <Wallet className="h-3 w-3" /> Recent balance adjustments
                  </p>
                  {recentAdjustments.length === 0 ? (
                    <p className="text-[10.5px] text-slate-600">No manual adjustments for this account.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {recentAdjustments.map((adjustment) => (
                        <div
                          key={adjustment.id}
                          className="flex items-start justify-between gap-2 rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[10.5px] text-slate-300">{adjustment.note}</p>
                            <p className="text-[9px] text-slate-500">
                              {timeAgo(adjustment.createdAt)} · {usersById[adjustment.adminId]?.name || 'Admin'}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 font-mono text-[10.5px] font-bold ${
                              adjustment.delta > 0 ? 'text-emerald-300' : 'text-rose-300'
                            }`}
                          >
                            {adjustment.delta > 0 ? '+' : ''}
                            {fmtCoins(adjustment.delta)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selected.role === 'admin' ? (
                  <WarningNote>
                    {/* Admin accounts are protected from suspension in this console. */}
                    Administrator accounts cannot be suspended from this console. Use a separate security process.
                  </WarningNote>
                ) : (
                  <div className="flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11.5px] font-bold text-white">
                        {selected.status === 'suspended' ? 'Account is suspended' : 'Account is active'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {selected.status === 'suspended'
                          ? 'Restore login and re-publish paused campaigns.'
                          : 'Freeze login instantly and hide all active posts.'}
                      </p>
                    </div>
                    {selected.status === 'suspended' ? (
                      <Button variant="green" size="sm" onClick={() => setConfirm('activate')}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Reinstate
                      </Button>
                    ) : (
                      <Button variant="danger" size="sm" onClick={() => setConfirm('suspend')}>
                        <Ban className="h-3.5 w-3.5" /> Suspend account
                      </Button>
                    )}
                  </div>
                )}

                {selected.id === adminUser?.id && (
                  <p className="text-center text-[10px] text-slate-600">This is your signed-in admin account.</p>
                )}
              </>
            ) : (
              <form onSubmit={doAdjust} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'add', label: 'Credit coins', icon: Plus, tint: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' },
                    { id: 'deduct', label: 'Deduct coins', icon: Minus, tint: 'border-rose-500/40 bg-rose-500/10 text-rose-200' },
                  ].map((option) => {
                    const Icon = option.icon
                    const active = direction === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setDirection(option.id)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[11.5px] font-bold transition ${
                          active ? option.tint : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" /> {option.label}
                      </button>
                    )
                  })}
                </div>

                <div>
                  <label className="label" htmlFor="adjust-amount">
                    Amount in coins
                  </label>
                  <input
                    id="adjust-amount"
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value.replace(/[^\d]/g, ''))
                      setAdjustError('')
                    }}
                    placeholder="100"
                    className="input font-mono text-lg"
                  />
                  <p className="mt-1.5 text-[10.5px] text-slate-500">
                    Current balance {fmtCoins(selected.coins)} coins →{' '}
                    <span className="font-mono text-slate-300">
                      {fmtCoins(
                        Math.max(0, selected.coins + (direction === 'add' ? 1 : -1) * (Number(amount) || 0)),
                      )}
                    </span>{' '}
                    after this adjustment
                  </p>
                </div>

                <div>
                  <label className="label" htmlFor="adjust-note">
                    Audit note (required)
                  </label>
                  <textarea
                    id="adjust-note"
                    rows={3}
                    value={note}
                    onChange={(event) => {
                      setNote(event.target.value)
                      setAdjustError('')
                    }}
                    placeholder="e.g. Promotional credit approved by support · Ticket #4821"
                    className="input resize-none text-[12px]"
                  />
                </div>

                {adjustError && (
                  <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-[11.5px] font-medium text-rose-300">
                    {adjustError}
                  </p>
                )}

                <SuccessNote>
                  The change is applied instantly, logged against your admin account and the user is notified.
                </SuccessNote>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    onClick={() => setMode('details')}
                  >
                    Back
                  </Button>
                  <Button type="submit" variant="purple" size="md" className="flex-1" loading={busy}>
                    {direction === 'add' ? 'Credit coins' : 'Deduct coins'}
                  </Button>
                </div>
              </form>
            )}

            {mode === 'details' && (
              <Button variant="secondary" size="md" className="w-full" onClick={closeUser}>
                Close
              </Button>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm === 'suspend' ? 'Suspend this account?' : 'Reinstate this account?'}
        description={
          confirm === 'suspend'
            ? 'Login is revoked instantly and all active campaigns are hidden from the task wall.'
            : 'The user can sign in again and paused campaigns return to the wall.'
        }
        confirmLabel={confirm === 'suspend' ? 'Suspend account' : 'Reinstate account'}
        onConfirm={doConfirmStatus}
        busy={busy}
      >
        {selected && (
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/25 p-3">
            <Avatar name={selected.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold text-white">{selected.name}</p>
              <p className="truncate text-[10px] text-slate-500">{selected.email}</p>
            </div>
            <span className="font-mono text-[11px] text-amber-200">{fmtCoins(selected.coins)} coins</span>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
