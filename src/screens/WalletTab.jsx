import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react'
import { DepositPanel } from './DepositPanel'
import { WithdrawPanel } from './WithdrawPanel'
import { useApp } from '../store/appContext'
import { coins as fmtCoins } from '../lib/utils'

export function WalletTab({ mode, onModeChange, onNavigate }) {
  const { user } = useApp()
  const isDeposit = mode !== 'withdraw'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff7a70]">Coin wallet</p>
          <h1 className="text-[26px] font-extrabold tracking-tight text-white sm:text-[30px]">Deposit & withdraw</h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-slate-400">
            Buy coins with Khalti or eSewa, or turn earned coins back into NPR at a 1:1 rate.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 sm:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Balance</p>
              <p className="font-mono text-[13px] font-bold text-white">{fmtCoins(user.coins)} coins</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/[0.08] bg-black/30 p-1 sm:inline-grid sm:w-auto">
        <button
          type="button"
          onClick={() => onModeChange('deposit')}
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[12.5px] font-bold transition ${
            isDeposit ? 'bg-white/[0.09] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownLeft className={`h-4 w-4 ${isDeposit ? 'text-emerald-400' : ''}`} /> Buy coins
        </button>
        <button
          type="button"
          onClick={() => onModeChange('withdraw')}
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[12.5px] font-bold transition ${
            !isDeposit ? 'bg-white/[0.09] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowUpRight className={`h-4 w-4 ${!isDeposit ? 'text-emerald-400' : ''}`} /> Cash out
        </button>
      </div>

      {isDeposit ? <DepositPanel /> : <WithdrawPanel onNavigate={onNavigate} />}
    </div>
  )
}
