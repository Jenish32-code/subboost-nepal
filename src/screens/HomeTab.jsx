import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  ListChecks,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { Avatar, Button, EmptyState, Modal, ProgressBar, SectionHeading } from '../components/ui'
import { YoutubeIcon } from '../components/brand'
import { useApp } from '../store/appContext'
import { RATES } from '../lib/constants'
import { coins as fmtCoins, timeAgo } from '../lib/utils'

function StatTile({ icon, label, value, suffix, accent = 'text-white' }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-3.5 py-3">
      <div className="flex items-start gap-1.5 text-[9.5px] font-bold uppercase leading-tight tracking-[0.06em] text-slate-500">
        <span className="mt-px shrink-0">{icon}</span>
        <span className="min-w-0">{label}</span>
      </div>
      <p className={`mt-1.5 font-mono text-lg font-bold ${accent}`}>
        {value}
        {suffix && <span className="ml-1 text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-500">{suffix}</span>}
      </p>
    </div>
  )
}

function TaskCard({ task, onSubscribe, onSkip }) {
  const remaining = Math.max(0, task.target - task.completed)
  const pct = Math.round((task.completed / task.target) * 100)
  return (
    <article className="card card-hover animate-fade-up p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Avatar name={task.channelName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[14.5px] font-bold text-white">{task.channelName}</h3>
            <span className="shrink-0 rounded-full border border-amber-400/25 bg-amber-400/[0.08] px-2 py-0.5 text-[10px] font-bold text-amber-200">
              {remaining} left
            </span>
          </div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-300">{task.channelName}</span> requested{' '}
            <span className="font-semibold text-slate-200">{fmtCoins(task.target)} subscribers</span>
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {timeAgo(task.createdAt)}
            </span>
            <span className="h-2.5 w-px bg-white/10" />
            <span className="inline-flex items-center gap-1">
              <YoutubeIcon className="h-3 w-3 text-[#ff5a50]" /> YouTube
            </span>
            <span className="h-2.5 w-px bg-white/10" />
            <span className="inline-flex items-center gap-1 text-emerald-300/90">
              <Coins className="h-3 w-3" /> +{RATES.taskReward} coin
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium">
          <span className="text-slate-400">
            {task.completed} / {task.target} subscribed
          </span>
          <span className={pct >= 80 ? 'font-semibold text-emerald-300' : 'text-slate-500'}>{pct}%</span>
        </div>
        <ProgressBar value={task.completed} max={task.target} tone={pct >= 80 ? 'green' : 'red'} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button size="md" className="flex-1" onClick={() => onSubscribe(task)}>
          <YoutubeIcon className="h-4 w-4" />
          Subscribe (+{RATES.taskReward} Coin)
        </Button>
        <a
          href={task.channelUrl}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Open channel on YouTube"
          title="Open channel"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-white/20 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={() => onSkip(task)}
          aria-label="Remove task"
          title="Not interested"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-slate-500 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}

function CountdownModal({ task, open, onClose }) {
  const { completeTask, toast } = useApp()
  const [remaining, setRemaining] = useState(15)
  const [phase, setPhase] = useState('countdown')
  const total = 15

  useEffect(() => {
    if (!open) return undefined
    setRemaining(15)
    setPhase('countdown')
    const started = Date.now()
    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000)
      const left = Math.max(0, total - elapsed)
      setRemaining(left)
      if (left === 0) {
        window.clearInterval(interval)
        setPhase((current) => (current === 'countdown' ? 'ready' : current))
      }
    }, 250)
    return () => window.clearInterval(interval)
  }, [open, task?.id])

  if (!task) return null

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = (total - remaining) / total

  const claim = () => {
    setPhase('verifying')
    window.setTimeout(() => {
      const result = completeTask(task.id)
      if (!result.ok) {
        setPhase('ready')
        toast({ type: 'error', title: 'Could not verify', message: result.error })
        return
      }
      setPhase('done')
      toast({
        type: 'success',
        title: `+${RATES.taskReward} coin added`,
        message: `Welcome to ${task.channelName} — new balance updated.`,
      })
      window.setTimeout(() => onClose?.(), 1500)
    }, 900)
  }

  return (
    <Modal
      open={open}
      onClose={phase === 'done' ? undefined : onClose}
      size="md"
      locked={phase === 'verifying'}
      title={phase === 'done' ? 'Subscription verified' : 'Verify your subscription'}
      description={
        phase === 'done'
          ? 'Coin credited instantly to your wallet.'
          : 'Complete these steps to claim your reward.'
      }
      icon={<YoutubeIcon className="h-5 w-5" />}
    >
      <div className="flex flex-col items-center">
        {phase === 'done' ? (
          <div className="animate-pop py-4 text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </span>
            <p className="mt-5 text-2xl font-extrabold tracking-tight text-white">+{RATES.taskReward} coin</p>
            <p className="mt-1 text-[12.5px] text-slate-400">
              {task.channelName} added to your Subscribed tab.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified · paid instantly
            </div>
          </div>
        ) : (
          <>
            <div className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-black/25 p-3">
              <Avatar name={task.channelName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-white">{task.channelName}</p>
                <p className="truncate text-[11px] text-slate-500">{task.channelUrl.replace(/^https?:\/\//, '')}</p>
              </div>
              <a
                href={task.channelUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-bold text-slate-200 transition hover:bg-white/[0.1]"
              >
                Open <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="relative mt-6 flex items-center justify-center">
              <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
                <defs>
                  <linearGradient id="pinTimer" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff3b30" />
                    <stop offset="100%" stopColor="#ffb4ac" />
                  </linearGradient>
                </defs>
                <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  fill="none"
                  stroke={remaining === 0 ? '#34d399' : 'url(#pinTimer)'}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-4xl font-bold text-white">{remaining}</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {remaining === 0 ? 'Ready' : 'Seconds'}
                </span>
              </div>
            </div>

            <p className="mt-4 max-w-[19rem] text-center text-[12px] leading-relaxed text-slate-400">
              Subscribe on YouTube, then come back. The timer stops you rushing so the channel keeps a genuine
              subscriber.
            </p>

            <div className="mt-5 flex w-full flex-col gap-2">
              <Button
                size="lg"
                variant={remaining === 0 ? 'green' : 'secondary'}
                className="w-full"
                loading={phase === 'verifying'}
                disabled={remaining > 0}
                onClick={claim}
              >
                {phase === 'verifying' ? (
                  'Verifying subscription…'
                ) : remaining > 0 ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Waiting {remaining}s…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> I&apos;ve subscribed — claim +{RATES.taskReward} coin
                  </>
                )}
              </Button>
              <a
                href={task.channelUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/10 text-[12.5px] font-semibold text-slate-300 transition hover:bg-white/[0.05]"
              >
                <YoutubeIcon className="h-3.5 w-3.5 text-[#ff5a50]" /> Open channel again
              </a>
            </div>

            <p className="mt-3 text-center text-[10.5px] text-slate-600">
              Keep the subscription for 30 days — unsubscribing can reverse the reward.
            </p>
          </>
        )}
      </div>
    </Modal>
  )
}

export function HomeTab({ onNavigate }) {
  const { user, db, skipTask, toast } = useApp()
  const [activeTask, setActiveTask] = useState(null)

  const subscribedIds = useMemo(
    () => new Set(db.subscriptions.filter((s) => s.userId === user.id).map((s) => s.campaignId)),
    [db.subscriptions, user.id],
  )
  const skippedIds = useMemo(
    () => new Set(db.skipped.filter((s) => s.userId === user.id).map((s) => s.campaignId)),
    [db.skipped, user.id],
  )

  const tasks = useMemo(
    () =>
      db.campaigns
        .filter(
          (task) =>
            task.userId !== user.id &&
            (!task.status || task.status === 'active') &&
            task.completed < task.target &&
            !subscribedIds.has(task.id) &&
            !skippedIds.has(task.id),
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [db.campaigns, user.id, subscribedIds, skippedIds],
  )

  const startTask = (task) => {
    const win = window.open(task.channelUrl, '_blank', 'noopener,noreferrer')
    setActiveTask(task)
    if (!win) {
      toast({
        type: 'info',
        title: 'Pop-up blocked',
        message: 'Use “Open channel again” inside the timer to visit YouTube.',
      })
    }
  }

  const skip = (task) => {
    skipTask(task.id)
    toast({ type: 'info', title: 'Task removed', message: `${task.channelName} will not appear again on your wall.` })
  }

  const mySubs = db.subscriptions.filter((s) => s.userId === user.id).length
  const earnedToday = db.subscriptions.filter(
    (s) => s.userId === user.id && new Date(s.createdAt).toDateString() === new Date().toDateString(),
  ).length

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[24px] border border-white/[0.09] bg-gradient-to-br from-[#1c1320] via-[#101b30] to-[#0b1120] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#ff0000]/20 blur-[70px]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#5C2D91]/35 blur-[80px]" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">
                <Sparkles className="h-3 w-3 text-amber-300" /> Task wall
              </span>
              <h1 className="mt-3 text-balance text-[25px] font-extrabold leading-tight tracking-tight text-white sm:text-[30px]">
                Namaste, {user.name.split(' ')[0]} 👋
              </h1>
              <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-slate-400">
                Subscribe to a channel, wait for verification and pocket{' '}
                <span className="font-semibold text-emerald-300">1 coin</span> per task. Coins cash out at NPR 1 each.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:w-auto">
              <Button
                variant="secondary"
                size="md"
                className="w-full whitespace-nowrap sm:w-auto"
                onClick={() => onNavigate('post')}
              >
                Post campaign
              </Button>
              <Button
                variant="green"
                size="md"
                className="w-full whitespace-nowrap sm:w-auto"
                onClick={() => onNavigate('withdraw')}
              >
                <ArrowUpRight className="h-4 w-4" /> Cash out
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatTile
              icon={<Wallet className="h-3.5 w-3.5" />}
              label="Coin balance"
              value={fmtCoins(user.coins)}
              suffix="coins"
              accent="text-amber-200"
            />
            <StatTile
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              label="Lifetime earned"
              value={fmtCoins(user.lifetimeEarned)}
              suffix="coins"
              accent="text-emerald-300"
            />
            <StatTile
              icon={<Users className="h-3.5 w-3.5" />}
              label="Subscribed"
              value={fmtCoins(mySubs)}
              suffix="channels"
            />
            <StatTile
              icon={<Coins className="h-3.5 w-3.5" />}
              label="Earned today"
              value={fmtCoins(earnedToday)}
              suffix="coins"
              accent="text-sky-300"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          { icon: <YoutubeIcon className="h-4 w-4" />, title: 'Open & subscribe', copy: 'Channel opens on YouTube in a new tab.' },
          { icon: <Clock className="h-4 w-4" />, title: '15-second check', copy: 'The timer keeps growth genuine.' },
          { icon: <Coins className="h-4 w-4" />, title: 'Coin credited', copy: 'Balance updates the moment you confirm.' },
        ].map((step, index) => (
          <div
            key={step.title}
            className="flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-[#ff8b82]">
              {step.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-slate-100">
                <span className="mr-1.5 font-mono text-[10px] text-slate-500">0{index + 1}</span>
                {step.title}
              </p>
              <p className="truncate text-[11px] text-slate-500">{step.copy}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Task list */}
      <section>
        <SectionHeading
          eyebrow="Available now"
          title="Creator tasks"
          description={`${tasks.length} active ${tasks.length === 1 ? 'task' : 'tasks'} waiting for your support`}
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-400">
              <ListChecks className="h-3.5 w-3.5" /> {db.campaigns.filter((c) => c.completed < c.target).length} live campaigns
            </span>
          }
        />

        {tasks.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<CheckCircle2 className="h-6 w-6 text-emerald-400" />}
            title="You cleared the task wall"
            description="You have subscribed to every available channel. New campaigns appear as creators post them — or spend your coins on your own growth."
            action={
              <Button onClick={() => onNavigate('post')}>
                Post my campaign <ArrowRight className="h-4 w-4" />
              </Button>
            }
          />
        ) : (
          <div className="mt-4 grid gap-3.5 md:grid-cols-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onSubscribe={startTask} onSkip={skip} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-400/15 bg-gradient-to-r from-emerald-400/[0.08] to-transparent p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[13px] font-bold text-white">Your coins are ready to cash out</p>
            <p className="mt-0.5 text-[12px] text-slate-400">
              {fmtCoins(user.coins)} coins ≈ NPR {fmtCoins(user.coins)} via Khalti or eSewa.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => onNavigate('withdraw')}>
          Withdraw <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      </section>

      <CountdownModal task={activeTask} open={Boolean(activeTask)} onClose={() => setActiveTask(null)} />
    </div>
  )
}
