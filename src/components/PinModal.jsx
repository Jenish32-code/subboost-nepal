import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, KeyRound, Lock, ShieldCheck } from 'lucide-react'
import { Button, Modal } from './ui'

function PinBoxes({ value, onChange, onComplete, error, disabled = false }) {
  const inputRef = useRef(null)
  const digits = value.split('')

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

  const handleChange = (event) => {
    const next = event.target.value.replace(/\D/g, '').slice(0, 4)
    onChange(next)
    if (next.length === 4) onComplete?.(next)
  }

  return (
    <div>
      <div
        className="relative flex cursor-text items-center justify-center gap-2.5 sm:gap-3"
        onClick={() => inputRef.current?.focus()}
      >
        {[0, 1, 2, 3].map((index) => {
          const filled = Boolean(digits[index])
          const active = !disabled && index === Math.min(value.length, 3)
          return (
            <div
              key={index}
              className={`flex h-14 w-12 items-center justify-center rounded-xl border bg-[#070d1b] font-mono text-2xl font-semibold text-white transition sm:h-16 sm:w-14 ${
                error
                  ? 'border-rose-500/60 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]'
                  : active
                    ? 'border-[#ff3b30]/70 shadow-[0_0_0_4px_rgba(255,59,48,0.14)]'
                    : 'border-white/12'
              } ${disabled ? 'opacity-60' : ''}`}
            >
              {filled ? (
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
              ) : (
                <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[#ff3b30]' : 'bg-white/20'}`} />
              )}
            </div>
          )
        })}
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          aria-label="4-digit security PIN"
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
        />
      </div>
      {error && <p className="mt-3 text-center text-[12.5px] font-medium text-rose-400">{error}</p>}
    </div>
  )
}

export function PinModal({
  open,
  onClose,
  mode = 'verify',
  expectedPin,
  onSuccess,
  title,
  description,
  submitLabel,
  locked = false,
}) {
  const [value, setValue] = useState('')
  const [step, setStep] = useState('create')
  const [first, setFirst] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setValue('')
      setError('')
      setBusy(false)
      setFirst('')
      setStep('create')
    }
  }, [open, mode])

  const finish = (pin) => {
    setBusy(true)
    window.setTimeout(() => {
      const result = onSuccess?.(pin)
      setBusy(false)
      if (result === false) {
        setError('That did not work. Please try again.')
        setValue('')
        return
      }
      setValue('')
      setFirst('')
      onClose?.()
    }, 420)
  }

  const submit = (pin) => {
    if (busy) return
    setError('')
    if (pin.length !== 4) {
      setError('Enter all 4 digits.')
      return
    }
    if (mode === 'verify') {
      if (pin !== expectedPin) {
        setValue('')
        setError('Incorrect PIN. Please try again.')
        return
      }
      finish(pin)
      return
    }
    if (step === 'create') {
      setFirst(pin)
      setStep('confirm')
      setValue('')
      return
    }
    if (pin !== first) {
      setFirst('')
      setStep('create')
      setValue('')
      setError('Those PINs do not match. Start again.')
      return
    }
    finish(pin)
  }

  const heading =
    mode === 'setup'
      ? step === 'confirm'
        ? 'Confirm your PIN'
        : title || 'Create a Security PIN'
      : title || 'Enter your Security PIN'
  const sub =
    mode === 'setup'
      ? step === 'confirm'
        ? 'Type the same 4 digits to lock it in.'
        : 'Pick 4 digits you will remember. You will use them to publish campaigns and approve withdrawals.'
      : description || 'Your 4-digit PIN authorises this action.'
  const action =
    mode === 'setup' ? (step === 'confirm' ? 'Save PIN' : 'Continue') : submitLabel || 'Confirm'

  return (
    <Modal open={open} onClose={onClose} size="sm" locked={locked || busy} className="bg-[#0d1526]">
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#ff3b30]/25 to-transparent text-[#ff7a70]">
          {mode === 'setup' ? <ShieldCheck className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
        </span>
        <h3 className="text-lg font-extrabold tracking-tight text-white">{heading}</h3>
        <p className="mt-1.5 max-w-[19rem] text-[12.5px] leading-relaxed text-slate-400">{sub}</p>

        <div className="mt-6 w-full">
          <PinBoxes
            value={value}
            error={error}
            disabled={busy}
            onChange={(next) => {
              setValue(next)
              if (error) setError('')
            }}
            onComplete={submit}
          />
        </div>

        <div className="mt-6 flex w-full flex-col gap-2">
          <Button size="lg" className="w-full" loading={busy} onClick={() => submit(value)}>
            {action}
          </Button>
          {mode === 'setup' && step === 'confirm' ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                setStep('create')
                setValue('')
                setFirst('')
                setError('')
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Use a different PIN
            </Button>
          ) : (
            !locked && (
              <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
            )
          )}
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-600">
          <Lock className="h-3 w-3" /> This prototype stores the PIN locally on your device.
        </p>
      </div>
    </Modal>
  )
}
