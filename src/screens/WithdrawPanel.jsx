import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Banknote,
  Camera,
  Check,
  Copy,
  Info,
  Landmark,
  Receipt,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Button, EmptyState, Field, InfoRow, Modal, StatusBadge } from '../components/ui'
import { BrandMark, GatewayMark } from '../components/brand'
import { PinModal } from '../components/PinModal'
import { useApp } from '../store/appContext'
import { PAYMENT_DETAILS, PAYMENT_METHODS, RATES } from '../lib/constants'
import { coins as fmtCoins, copyText, formatDateTime, timeAgo } from '../lib/utils'

export function WithdrawPanel({ onNavigate }) {
  const { user, db, requestWithdraw, toast } = useApp()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('khalti')
  const [accountName, setAccountName] = useState(PAYMENT_DETAILS.khalti.name)
  const [accountNumber, setAccountNumber] = useState('')
  const [error, setError] = useState('')
  const [pinOpen, setPinOpen] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [copied, setCopied] = useState(false)

  const numericAmount = Number(amount)
  const validAmount = Number.isInteger(numericAmount) && numericAmount >= 1
  const nprValue = validAmount ? numericAmount * RATES.coinToNpr : 0

  const withdrawals = useMemo(
    () => db.withdrawals.filter((item) => item.userId === user.id),
    [db.withdrawals, user.id],
  )
  const totalWithdrawn = withdrawals.filter((w) => w.status !== 'rejected').reduce((sum, w) => sum + w.npr, 0)

  const submit = (event) => {
    event.preventDefault()
    setError('')
    if (!validAmount) {
      setError('Enter a whole number of coins to withdraw.')
      return
    }
    if (numericAmount > user.coins) {
      setError(`You only have ${user.coins} coins available.`)
      return
    }
    if (accountNumber.replace(/\D/g, '').length < 9) {
      setError('Add a valid destination account number.')
      return
    }
    if (!user.pin) {
      toast({ type: 'info', title: 'Security PIN required', message: 'Set your 4-digit PIN before withdrawing.' })
      onNavigate('profile')
      return
    }
    setPinOpen(true)
  }

  const copyReceipt = async () => {
    if (!receipt) return
    const ok = await copyText(receipt.code)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
      toast({ type: 'success', title: 'Receipt code copied', message: receipt.code })
    }
  }

  const resetForm = () => {
    setAmount('')
    setError('')
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-extrabold text-white">Withdraw your coins</h2>
              <p className="mt-0.5 text-[11.5px] text-slate-500">
                1 coin = NPR {RATES.coinToNpr}. Paid to Khalti or eSewa.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              <ShieldCheck className="h-3 w-3" /> PIN protected
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-white/[0.08] bg-gradient-to-br from-amber-400/[0.08] via-transparent to-transparent p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200/60">Available balance</p>
                <p className="mt-1 font-mono text-[30px] font-bold leading-none text-white">{fmtCoins(user.coins)}</p>
                <p className="mt-1 text-[11px] text-slate-500">coins</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Cash value</p>
                <p className="mt-1 font-mono text-[15px] font-semibold text-emerald-300">NPR {fmtCoins(user.coins)}</p>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Coins to withdraw" htmlFor="withdraw-amount">
                <div className="relative">
                  <input
                    id="withdraw-amount"
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value.replace(/[^\d]/g, ''))
                      if (error) setError('')
                    }}
                    placeholder="0"
                    className="input pr-16 font-mono text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(String(user.coins))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-bold text-slate-300 transition hover:bg-white/[0.1]"
                  >
                    MAX
                  </button>
                </div>
              </Field>
              <Field label="You receive (NPR)" htmlFor="withdraw-npr" hint="Auto-calculated at 1:1">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500">
                    NPR
                  </span>
                  <input
                    id="withdraw-npr"
                    readOnly
                    value={nprValue ? nprValue.toLocaleString('en-IN') : ''}
                    placeholder="0"
                    className="input cursor-not-allowed bg-black/40 pl-12 font-mono text-lg text-emerald-300"
                    tabIndex={-1}
                  />
                </div>
              </Field>
            </div>

            <div>
              <span className="label">Receiver method</span>
              <div className="grid grid-cols-2 gap-2.5">
                {PAYMENT_METHODS.map((gateway) => {
                  const selected = method === gateway.id
                  return (
                    <button
                      key={gateway.id}
                      type="button"
                      onClick={() => setMethod(gateway.id)}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition ${
                        selected
                          ? gateway.id === 'khalti'
                            ? 'border-[#8b5cf6]/50 bg-[#5C2D91]/20'
                            : 'border-[#60BB46]/50 bg-[#60BB46]/15'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <GatewayMark method={gateway.id} className="h-7 w-7 rounded-lg" />
                      <span className="flex-1 text-left text-[12.5px] font-bold text-white">{gateway.label}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-emerald-300" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <Field label="Account holder name" htmlFor="account-name">
              <input
                id="account-name"
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
                className="input"
                placeholder="Full name on the receiving account"
              />
            </Field>

            <Field
              label={`Destination ${method === 'khalti' ? 'Khalti' : 'eSewa'} number`}
              htmlFor="account-number"
              error={error}
              hint="Double-check this number — payouts cannot be reversed."
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Landmark className="h-4 w-4" />
                </span>
                <input
                  id="account-number"
                  type="tel"
                  value={accountNumber}
                  onChange={(event) => {
                    setAccountNumber(event.target.value)
                    if (error) setError('')
                  }}
                  placeholder="+977 98XXXXXXXX"
                  className="input pl-10 font-mono"
                  autoComplete="tel"
                />
              </div>
            </Field>

            <Button type="submit" size="lg" variant="green" className="w-full">
              <ArrowUpRight className="h-4 w-4" /> Withdraw {nprValue ? `NPR ${nprValue.toLocaleString('en-IN')}` : 'coins'}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-[10.5px] text-slate-600">
              <ShieldCheck className="h-3 w-3" /> Your 4-digit Security PIN is required to approve the payout.
            </p>
          </form>
        </section>

        {/* Side column */}
        <div className="space-y-5">
          <section className="card p-5">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">Withdrawn to date</p>
                <p className="mt-1 font-mono text-xl font-bold text-emerald-300">NPR {fmtCoins(totalWithdrawn)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Payout requests</p>
                <p className="mt-1 font-mono text-xl font-bold text-white">{withdrawals.length}</p>
              </div>
            </div>
            <div className="mt-3 space-y-2 rounded-xl border border-white/[0.06] bg-black/20 p-3.5">
              <p className="text-[11.5px] font-bold text-slate-200">Payout rules</p>
              {[
                `Minimum 1 coin · 1 coin = NPR ${RATES.coinToNpr}`,
                'Requests are settled within 24 hours',
                'Account holder name must match the wallet',
                'Receipt codes help support trace payouts',
              ].map((rule) => (
                <p key={rule} className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400/80" /> {rule}
                </p>
              ))}
            </div>
          </section>

          <section className="card flex flex-col p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-bold text-white">Withdrawal history</h2>
                <p className="text-[11px] text-slate-500">Receipt codes and payout status</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10.5px] font-bold text-slate-400">
                {withdrawals.length}
              </span>
            </div>

            <div className="scroll-slim mt-3 max-h-[430px] flex-1 space-y-2.5 overflow-y-auto pr-1">
              {withdrawals.length === 0 ? (
                <EmptyState
                  icon={<Banknote className="h-5 w-5" />}
                  title="No withdrawals yet"
                  description="Cash out your coins and your receipts will be listed here."
                  className="py-10"
                />
              ) : (
                withdrawals.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                    <div className="flex items-start gap-2.5">
                      <GatewayMark method={item.method} className="h-8 w-8" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[12.5px] font-bold text-white">NPR {fmtCoins(item.npr)}</p>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="mt-0.5 truncate text-[10.5px] text-slate-500">
                          {item.accountName} · <span className="font-mono">{item.accountNumber}</span>
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] text-slate-500">
                          <span className="font-mono font-bold text-slate-300">#{item.code}</span>
                          <span className="h-2.5 w-px bg-white/10" />
                          <span>{fmtCoins(item.amount)} coins</span>
                          <span className="h-2.5 w-px bg-white/10" />
                          <span>{timeAgo(item.createdAt)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReceipt(item)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.07]"
                        >
                          <Receipt className="h-3 w-3" /> View receipt
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-sky-400/15 bg-sky-400/[0.05] p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
        <div>
          <p className="text-[12.5px] font-bold text-sky-100">Proof of payout</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-sky-200/60">
            Every withdrawal generates a 4-digit receipt code. Screenshot the receipt and share it with support if admin
            asks for proof — it lets them trace your payout instantly.
          </p>
        </div>
      </div>

      <PinModal
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        mode="verify"
        expectedPin={user.pin}
        title="Approve withdrawal"
        description={`Enter your 4-digit PIN to send NPR ${nprValue.toLocaleString('en-IN')} to your ${method === 'khalti' ? 'Khalti' : 'eSewa'} wallet.`}
        submitLabel="Confirm payout"
        onSuccess={() => {
          const result = requestWithdraw({ amount: numericAmount, method, accountName, accountNumber })
          if (!result.ok) {
            setError(result.error)
            toast({ type: 'error', title: 'Withdrawal failed', message: result.error })
            return false
          }
          setReceipt(result.withdrawal)
          resetForm()
          toast({
            type: 'success',
            title: 'Withdrawal requested',
            message: `Receipt #${result.withdrawal.code} · NPR ${fmtCoins(result.withdrawal.npr)}`,
          })
          return true
        }}
      />

      {/* Receipt modal */}
      <Modal
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        size="md"
        bare
        className="bg-[#0c1424] p-0!"
        bodyClassName="p-0"
      >
        {receipt && (
          <div>
            <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-emerald-400/15 via-[#0f172a] to-[#0f172a] px-5 pb-5 pt-5">
              <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <BrandMark className="h-9 w-9" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">SubBoost Nepal</p>
                    <p className="text-[13px] font-extrabold text-white">Withdrawal receipt</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReceipt(null)}
                  aria-label="Close receipt"
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative mt-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300/70">Amount</p>
                  <p className="mt-1 font-mono text-[28px] font-bold leading-none text-white">
                    NPR {fmtCoins(receipt.npr)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">{fmtCoins(receipt.amount)} coins</p>
                </div>
                <StatusBadge
                  status={receipt.status}
                  label={receipt.status === 'pending' ? 'Pending payout' : receipt.status === 'approved' ? 'Paid' : 'Rejected'}
                />
              </div>
            </div>

            <div className="px-5 py-5">
              <div className="rounded-xl border border-dashed border-emerald-400/40 bg-emerald-400/[0.06] px-4 py-3.5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300/70">Receipt code</p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-[0.35em] text-emerald-200">{receipt.code}</p>
                <p className="mt-1 text-[10.5px] text-emerald-200/50">
                  Keep this code — quote it to support for any payout query.
                </p>
              </div>

              <div className="mt-4 divide-y divide-white/[0.06]">
                <InfoRow label="Requested on" value={formatDateTime(receipt.createdAt)} />
                <InfoRow label="Receiver method" value={receipt.method === 'khalti' ? 'Khalti' : 'eSewa'} />
                <InfoRow label="Account holder" value={receipt.accountName} />
                <InfoRow label="Account number" value={receipt.accountNumber} mono />
                <InfoRow
                  label="Receipt reference"
                  value={`WD-${receipt.code}-${new Date(receipt.createdAt).toISOString().slice(0, 10).replace(/-/g, '')}`}
                  mono
                />
                <InfoRow
                  label="Status"
                  value={
                    receipt.status === 'pending'
                      ? 'Pending admin payout'
                      : receipt.status === 'approved'
                        ? 'Paid to wallet'
                        : 'Rejected — contact support'
                  }
                />
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-black/25 p-3">
                <Camera className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <p className="text-[11px] leading-relaxed text-slate-400">
                  <span className="font-semibold text-slate-200">Screenshot this receipt.</span> If admin support asks
                  for proof, upload this image along with your receipt code. Payouts are usually settled within 24
                  hours.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" size="md" onClick={copyReceipt}>
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy code'}
                </Button>
                <Button size="md" onClick={() => setReceipt(null)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
