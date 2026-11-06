import { useMemo, useRef, useState } from 'react'
import {
  Check,
  Copy,
  ImagePlus,
  Info,
  Loader2,
  Receipt,
  ShieldCheck,
  Trash2,
  Upload,
  Wallet,
  X,
} from 'lucide-react'
import { Button, EmptyState, Field, Modal, StatusBadge } from '../components/ui'
import { GatewayMark } from '../components/brand'
import { useApp } from '../store/appContext'
import { PAYMENT_METHODS, RATES } from '../lib/constants'
import { coins as fmtCoins, copyText, fileToThumbnail, timeAgo } from '../lib/utils'

export function DepositPanel() {
  const { user, db, submitDeposit, toast } = useApp()
  const fileRef = useRef(null)
  const [method, setMethod] = useState('khalti')
  const [amount, setAmount] = useState('')
  const [txn, setTxn] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [copied, setCopied] = useState('')

  const active = PAYMENT_METHODS.find((item) => item.id === method)
  const numericAmount = Number(amount)
  const coinValue = Number.isFinite(numericAmount) && numericAmount > 0 ? Math.round(numericAmount * RATES.coinToNpr) : 0

  const deposits = useMemo(
    () => db.deposits.filter((item) => item.userId === user.id),
    [db.deposits, user.id],
  )
  const pendingCoins = deposits.filter((d) => d.status === 'pending').reduce((sum, d) => sum + d.coins, 0)

  const handleCopy = async (value) => {
    const ok = await copyText(value)
    if (ok) {
      setCopied(value)
      window.setTimeout(() => setCopied(''), 1800)
      toast({ type: 'success', title: 'Copied to clipboard', message: value })
    } else {
      toast({ type: 'error', title: 'Copy failed', message: 'Select the number and copy it manually.' })
    }
  }

  const pickFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ type: 'error', title: 'Unsupported file', message: 'Upload a PNG or JPG payment screenshot.' })
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ type: 'error', title: 'Image too large', message: 'Keep the screenshot under 8 MB.' })
      return
    }
    setUploading(true)
    try {
      const thumb = await fileToThumbnail(file)
      setScreenshot(thumb)
    } catch (err) {
      toast({ type: 'error', title: 'Could not read image', message: err.message })
    } finally {
      setUploading(false)
    }
  }

  const submit = (event) => {
    event.preventDefault()
    setError('')
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter the amount you paid in NPR.')
      return
    }
    if (!txn.trim()) {
      setError('Add the transaction ID from your payment receipt.')
      return
    }
    setBusy(true)
    window.setTimeout(() => {
      const result = submitDeposit({ amount: numericAmount, method, transactionId: txn, screenshot })
      setBusy(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast({
        type: 'success',
        title: 'Deposit submitted',
        message: `${fmtCoins(result.deposit.coins)} coins are pending verification (${result.deposit.ref}).`,
      })
      setAmount('')
      setTxn('')
      setScreenshot(null)
      if (fileRef.current) fileRef.current.value = ''
    }, 650)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-5">
        {/* Gateway selector */}
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-extrabold text-white">Choose your gateway</h2>
              <p className="mt-0.5 text-[11.5px] text-slate-500">Send a payment, then submit the proof below.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              <ShieldCheck className="h-3 w-3" /> Secure
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {PAYMENT_METHODS.map((gateway) => {
              const selected = gateway.id === method
              return (
                <button
                  key={gateway.id}
                  type="button"
                  onClick={() => setMethod(gateway.id)}
                  className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    selected
                      ? gateway.id === 'khalti'
                        ? 'border-[#8b5cf6]/50 bg-[#5C2D91]/20'
                        : 'border-[#60BB46]/50 bg-[#60BB46]/15'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <GatewayMark method={gateway.id} className="h-9 w-9" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-white">{gateway.label}</p>
                    <p className="truncate text-[10.5px] text-slate-500">
                      {gateway.id === 'khalti' ? 'Wallet transfer' : 'eSewa wallet'}
                    </p>
                  </div>
                  {selected && (
                    <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#0b1120]">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Payment details */}
          <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-black/25">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <GatewayMark method={method} className="h-5 w-5 rounded-md text-[10px]" />
                {active.label} payment details
              </span>
              <span className="text-[10px] font-semibold text-slate-600">1 coin = NPR 1</span>
            </div>
            <div className="divide-y divide-white/[0.05]">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Account number</p>
                  <p className="mt-0.5 font-mono text-[15px] font-semibold text-white">{active.number}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(active.number)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-bold text-slate-200 transition hover:bg-white/[0.1]"
                >
                  {copied === active.number ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === active.number ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-4 py-3">
                <div className="min-w-0 flex-1 basis-[190px]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Account holder</p>
                  <p className="mt-0.5 text-[13px] font-semibold leading-snug text-slate-100">{active.name}</p>
                </div>
                <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-slate-500">
                  Verified merchant
                </span>
              </div>
            </div>
          </div>

          <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
            Send the exact amount from your {active.label} wallet to the number above, then upload the screenshot and
            transaction ID. Coins are credited after admin verification.
          </p>
        </section>

        {/* Deposit form */}
        <section className="card p-5 sm:p-6">
          <h2 className="text-[15px] font-extrabold text-white">Submit your deposit</h2>
          <p className="mt-0.5 text-[11.5px] text-slate-500">Proof is reviewed by the SubBoost support team.</p>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Amount in NPR" htmlFor="deposit-amount" hint={`Minimum suggestion: NPR 50`}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500">
                    NPR
                  </span>
                  <input
                    id="deposit-amount"
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value.replace(/[^\d.]/g, ''))
                      if (error) setError('')
                    }}
                    placeholder="500"
                    className="input pl-12 font-mono text-lg"
                  />
                </div>
              </Field>
              <Field label="Coins you receive" hint="Credited after verification">
                <div className="flex h-[46px] items-center justify-between rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-4">
                  <span className="font-mono text-lg font-bold text-amber-100">{fmtCoins(coinValue)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/70">coins</span>
                </div>
              </Field>
            </div>

            {/* Upload */}
            <div>
              <span className="label">Payment screenshot</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => pickFile(event.target.files?.[0])}
              />
              {screenshot ? (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-3">
                  <img
                    src={screenshot.dataUrl}
                    alt="Payment screenshot preview"
                    className="h-16 w-16 shrink-0 rounded-lg border border-white/10 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-slate-100">{screenshot.name}</p>
                    <p className="text-[10.5px] text-slate-500">{(screenshot.size / 1024).toFixed(0)} KB · attached</p>
                    <button
                      type="button"
                      onClick={() => setPreview(screenshot.dataUrl)}
                      className="mt-1 text-[11px] font-semibold text-sky-300 hover:text-sky-200"
                    >
                      View full screenshot
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshot(null)
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                    aria-label="Remove screenshot"
                    className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:border-rose-400/30 hover:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    pickFile(event.dataTransfer.files?.[0])
                  }}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-6 text-center transition hover:border-[#ff3b30]/40 hover:bg-[#ff3b30]/[0.04]"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400">
                      <Upload className="h-4 w-4" />
                    </span>
                  )}
                  <span className="text-[12px] font-semibold text-slate-200">
                    {uploading ? 'Preparing preview…' : 'Click to upload or drag a screenshot'}
                  </span>
                  <span className="text-[10.5px] text-slate-500">PNG, JPG or WebP · up to 8 MB</span>
                </button>
              )}
            </div>

            <Field
              label="Transaction ID / reference code"
              htmlFor="txn"
              error={error}
              hint="You will find this in your payment app history."
            >
              <input
                id="txn"
                value={txn}
                onChange={(event) => {
                  setTxn(event.target.value)
                  if (error) setError('')
                }}
                placeholder="e.g. KHX9821QB7"
                className="input font-mono uppercase tracking-wide"
                autoComplete="off"
              />
            </Field>

            <Button type="submit" size="lg" className="w-full" loading={busy}>
              <ImagePlus className="h-4 w-4" /> Submit deposit
            </Button>
            <p className="text-center text-[10.5px] text-slate-600">
              Deposits are verified manually. Never share your PIN or password with support.
            </p>
          </form>
        </section>
      </div>

      {/* Pending list */}
      <div className="space-y-5">
        <section className="card p-5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200/70">Pending coins</p>
              <p className="mt-1 font-mono text-xl font-bold text-amber-100">{fmtCoins(pendingCoins)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current balance</p>
              <p className="mt-1 font-mono text-xl font-bold text-white">{fmtCoins(user.coins)}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-3.5 py-2.5">
            <span className="inline-flex items-center gap-2 text-[11.5px] text-slate-400">
              <Wallet className="h-3.5 w-3.5 text-slate-500" /> Cash value
            </span>
            <span className="font-mono text-[12px] font-semibold text-slate-200">
              NPR {fmtCoins(user.coins + pendingCoins)}
            </span>
          </div>
        </section>

        <section className="card flex flex-col p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-bold text-white">Deposit history</h2>
              <p className="text-[11px] text-slate-500">Verification status of every top-up</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10.5px] font-bold text-slate-400">
              {deposits.length}
            </span>
          </div>

          <div className="scroll-slim mt-3 max-h-[520px] flex-1 space-y-2.5 overflow-y-auto pr-1">
            {deposits.length === 0 ? (
              <EmptyState
                icon={<Receipt className="h-5 w-5" />}
                title="No deposits yet"
                description="Your submitted top-ups will appear here with a live status."
                className="py-10"
              />
            ) : (
              deposits.map((deposit) => (
                <div key={deposit.id} className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                  <div className="flex items-start gap-2.5">
                    <GatewayMark method={deposit.method} className="h-8 w-8" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12.5px] font-bold capitalize text-white">
                          {deposit.method} · NPR {fmtCoins(deposit.amount)}
                        </p>
                        <StatusBadge status={deposit.status} />
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-500">{deposit.ref}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] text-slate-500">
                        <span className="font-semibold text-amber-200/80">+{fmtCoins(deposit.coins)} coins</span>
                        <span className="h-2.5 w-px bg-white/10" />
                        <span className="truncate font-mono">{deposit.transactionId}</span>
                        <span className="h-2.5 w-px bg-white/10" />
                        <span>{timeAgo(deposit.createdAt)}</span>
                      </div>
                      {deposit.screenshot && (
                        <button
                          type="button"
                          onClick={() => setPreview(deposit.screenshot)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.07]"
                        >
                          <ImagePlus className="h-3 w-3" /> View proof
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="mt-3 border-t border-white/[0.06] pt-3 text-[10.5px] leading-relaxed text-slate-600">
            Verification usually completes within 24 hours. Approved coins are added to your balance automatically.
          </p>
        </section>
      </div>

      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title="Payment proof" size="lg">
        {preview && (
          <div className="space-y-3">
            <img src={preview} alt="Payment screenshot" className="max-h-[65vh] w-full rounded-xl border border-white/10 object-contain" />
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setPreview(null)}>
                <X className="h-3.5 w-3.5" /> Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
