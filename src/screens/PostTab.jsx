import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  Info,
  Layers,
  Plus,
  Rocket,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Avatar, Button, EmptyState, Field, ProgressBar, SectionHeading, StatusBadge } from '../components/ui'
import { PinModal } from '../components/PinModal'
import { YoutubeIcon } from '../components/brand'
import { useApp } from '../store/appContext'
import { RATES } from '../lib/constants'
import { channelNameFromUrl, coins as fmtCoins, isYoutubeUrl, timeAgo } from '../lib/utils'

const presets = [10, 25, 50, 100]

function CampaignRow({ campaign }) {
  const pct = Math.round((campaign.completed / campaign.target) * 100)
  const done = campaign.completed >= campaign.target
  const state = ['paused', 'flagged', 'cancelled'].includes(campaign.status)
    ? campaign.status
    : done
      ? 'completed'
      : 'active'
  const stateLabel = { active: 'Active', completed: 'Completed', paused: 'Paused', flagged: 'Flagged', cancelled: 'Cancelled' }[state]
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3.5 transition hover:border-white/[0.14]">
      <div className="flex items-start gap-3">
        <Avatar name={campaign.channelName} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[13px] font-bold text-white">{campaign.channelName}</p>
            <StatusBadge status={state} label={stateLabel} />
          </div>
          <a
            href={campaign.channelUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-slate-500 transition hover:text-slate-300"
          >
            <span className="truncate">{campaign.channelUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          <div className="mt-2.5">
            <div className="mb-1 flex items-center justify-between text-[10.5px] font-semibold">
              <span className="text-slate-400">
                {campaign.completed} / {campaign.target} subscribers completed
              </span>
              <span className={done ? 'text-emerald-300' : 'text-slate-500'}>{pct}%</span>
            </div>
            <ProgressBar value={campaign.completed} max={campaign.target} tone={done ? 'green' : 'red'} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Coins className="h-3 w-3 text-amber-300/80" /> {fmtCoins(campaign.target * RATES.subscriberCost)} coins spent
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {timeAgo(campaign.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PostTab({ onNavigate }) {
  const { user, db, createCampaign, toast } = useApp()
  const [target, setTarget] = useState('10')
  const [url, setUrl] = useState('')
  const [touched, setTouched] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)

  const numericTarget = Number(target)
  const validTarget = Number.isInteger(numericTarget) && numericTarget >= 1
  const cost = validTarget ? numericTarget * RATES.subscriberCost : 0
  const validUrl = isYoutubeUrl(url)
  const derivedName = validUrl ? channelNameFromUrl(url) : ''
  const canAfford = cost > 0 && cost <= user.coins

  const myCampaigns = useMemo(
    () =>
      db.campaigns
        .filter((c) => c.userId === user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [db.campaigns, user.id],
  )

  const activeCount = myCampaigns.filter((c) => c.completed < c.target).length
  const subscribersDelivered = myCampaigns.reduce((sum, c) => sum + c.completed, 0)

  const startPublish = () => {
    setTouched(true)
    if (!validTarget || !validUrl) {
      toast({ type: 'error', title: 'Check your campaign', message: 'Add a subscriber target and a valid YouTube URL.' })
      return
    }
    if (!canAfford) {
      toast({
        type: 'error',
        title: 'Not enough coins',
        message: `This campaign costs ${cost} coins — you have ${user.coins}. Top up to continue.`,
      })
      return
    }
    if (!user.pin) {
      toast({ type: 'info', title: 'Security PIN required', message: 'Set your 4-digit PIN in Profile first.' })
      onNavigate('profile')
      return
    }
    setPinOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff7a70]">Campaign studio</p>
          <h1 className="text-[26px] font-extrabold tracking-tight text-white sm:text-[30px]">Create a campaign</h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-slate-400">
            Trade coins for real subscribers. Every {RATES.subscriberCost} coins delivers{' '}
            <span className="font-semibold text-slate-200">1 subscriber</span> from the community task wall.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onNavigate('wallet')}>
          <Wallet className="h-3.5 w-3.5" /> Buy coins
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/[0.12] to-transparent p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-amber-200/70">Current balance</span>
            <Coins className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-2 font-mono text-[26px] font-bold leading-none text-amber-100">{fmtCoins(user.coins)}</p>
          <p className="mt-1.5 text-[11px] text-amber-200/50">coins · ≈ NPR {fmtCoins(user.coins)}</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.1] to-transparent p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-emerald-200/70">Lifetime earned</span>
            <TrendingUp className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-2 font-mono text-[26px] font-bold leading-none text-emerald-100">{fmtCoins(user.lifetimeEarned)}</p>
          <p className="mt-1.5 text-[11px] text-emerald-200/50">coins from subscription tasks</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.12] to-transparent p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-violet-200/70">Your campaigns</span>
            <Layers className="h-4 w-4 text-violet-300" />
          </div>
          <p className="mt-2 font-mono text-[26px] font-bold leading-none text-white">{activeCount}</p>
          <p className="mt-1.5 text-[11px] text-violet-200/50">
            active · {subscribersDelivered} subscribers delivered
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        {/* Form */}
        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#ff3b30]/25 bg-[#ff3b30]/10 text-[#ff8b82]">
              <Rocket className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[15px] font-extrabold text-white">New campaign</h2>
              <p className="text-[11.5px] text-slate-500">Publishing requires your Security PIN.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field
              label="Target subscribers"
              htmlFor="target"
              hint={`${RATES.subscriberCost} coins are charged per subscriber.`}
              error={touched && !validTarget ? 'Enter a whole number of at least 1.' : ''}
            >
              <div className="relative">
                <input
                  id="target"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={target}
                  onChange={(event) => setTarget(event.target.value.replace(/[^\d]/g, ''))}
                  placeholder="10"
                  className="input pr-24 font-mono text-lg"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  subscribers
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTarget(String(preset))}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                      Number(target) === preset
                        ? 'border-[#ff3b30]/40 bg-[#ff3b30]/15 text-[#ffb4ac]'
                        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Total cost in coins" hint="Calculated automatically — read only.">
              <div
                className={`flex items-center justify-between rounded-xl border px-4 py-3.5 ${
                  !canAfford && cost > 0
                    ? 'border-rose-500/30 bg-rose-500/[0.07]'
                    : 'border-amber-400/25 bg-amber-400/[0.06]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
                    <Coins className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Campaign cost</p>
                    <p className="text-[10.5px] text-slate-500">
                      {validTarget ? `${numericTarget} × ${RATES.subscriberCost} coins` : 'Enter a target'}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xl font-bold text-amber-100">{fmtCoins(cost)}</span>
              </div>
              {!canAfford && cost > 0 && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-medium text-rose-300">
                  <Info className="h-3.5 w-3.5" /> You need {fmtCoins(cost - user.coins)} more coins.
                  <button type="button" onClick={() => onNavigate('wallet')} className="underline underline-offset-2">
                    Deposit
                  </button>
                </p>
              )}
            </Field>

            <Field
              label="YouTube channel URL"
              htmlFor="channel-url"
              error={touched && !validUrl ? 'Paste a valid youtube.com channel link.' : ''}
              hint={validUrl && derivedName ? `Channel detected: ${derivedName}` : 'e.g. youtube.com/@yourchannel'}
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ff5a50]">
                  <YoutubeIcon className="h-4 w-4" />
                </span>
                <input
                  id="channel-url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://www.youtube.com/@yourchannel"
                  className="input pl-10"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            </Field>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-slate-400">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
                Coins are deducted the moment your campaign goes live. Tasks appear on the wall for other creators right
                away.
              </p>
            </div>

            <Button size="lg" className="w-full" onClick={startPublish}>
              <Plus className="h-4 w-4" /> Publish campaign
            </Button>
            <p className="text-center text-[10.5px] text-slate-600">
              Protected by your 4-digit Security PIN · {RATES.subscriberCost} coins = 1 subscriber
            </p>
          </div>
        </section>

        {/* Recent uploads */}
        <section className="card flex flex-col p-5 sm:p-6">
          <SectionHeading
            title="Recent uploads"
            description="Your campaigns and live progress"
            action={
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10.5px] font-bold text-slate-400">
                {myCampaigns.length} total
              </span>
            }
          />
          <div className="scroll-slim mt-4 max-h-[430px] flex-1 space-y-2.5 overflow-y-auto pr-1">
            {myCampaigns.length === 0 ? (
              <EmptyState
                icon={<Rocket className="h-5 w-5" />}
                title="No campaigns yet"
                description="Publish your first campaign and watch subscribers roll in."
                className="h-full"
              />
            ) : (
              myCampaigns.map((campaign) => <CampaignRow key={campaign.id} campaign={campaign} />)
            )}
          </div>
          {myCampaigns.length > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {subscribersDelivered} subscribers delivered
              </span>
              <a
                href={myCampaigns[0].channelUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 font-semibold text-slate-300 transition hover:text-white"
              >
                View channel <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          )}
        </section>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
        <h3 className="text-[13px] font-bold text-white">How campaign delivery works</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { title: 'Publish', copy: 'Set a target, confirm with your PIN and go live instantly.' },
            { title: 'Community subscribes', copy: 'Real creators on the task wall subscribe for 1 coin each.' },
            { title: 'Track progress', copy: 'Watch the progress bar fill until every slot is delivered.' },
          ].map((step, index) => (
            <div key={step.title} className="flex gap-2.5">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] font-mono text-[10px] font-bold text-slate-400">
                {index + 1}
              </span>
              <div>
                <p className="text-[12px] font-semibold text-slate-100">{step.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{step.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PinModal
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        mode="verify"
        expectedPin={user.pin}
        title="Authorise your campaign"
        description={`Enter your 4-digit PIN to spend ${fmtCoins(cost)} coins on ${numericTarget} subscribers.`}
        submitLabel={`Pay ${fmtCoins(cost)} coins`}
        onSuccess={() => {
          const result = createCampaign({ target: numericTarget, channelUrl: url })
          if (!result.ok) {
            toast({ type: 'error', title: 'Campaign not published', message: result.error })
            return false
          }
          toast({
            type: 'success',
            title: 'Campaign is live',
            message: `${result.campaign.channelName} is now on the task wall · ${fmtCoins(result.cost)} coins deducted.`,
          })
          setUrl('')
          setTarget('10')
          setTouched(false)
          return true
        }}
      />
    </div>
  )
}
