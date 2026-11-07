import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppContext } from './appContext'
import { RATES } from '../lib/constants'
import { channelNameFromUrl, isYoutubeUrl, normalizeUrl, receiptCode, taskCode, uid } from '../lib/utils'
import { supabase } from '../supabaseClient'

const STORAGE_KEY = 'subboost-nepal-v2'

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || ''

const nowIso = () => new Date().toISOString()

const normalizeUser = (user) => ({
  ...user,
  name: user.name || 'SubBoost user',
  email: user.email || '',
  phone: user.phone || '',
  password: user.password || '',
  pin: /^\d{4}$/.test(user.pin || '') ? user.pin : '',
  coins: Number.isFinite(user.coins) ? user.coins : 0,
  lifetimeEarned: Number.isFinite(user.lifetimeEarned) ? user.lifetimeEarned : 0,
  role: user.role === 'admin' ? 'admin' : 'user',
  status: user.status === 'suspended' ? 'suspended' : 'active',
  createdAt: user.createdAt || nowIso(),
})

const normalizeCampaign = (campaign) => ({
  ...campaign,
  channelName: campaign.channelName || channelNameFromUrl(campaign.channelUrl) || 'YouTube Channel',
  channelUrl: campaign.channelUrl || 'https://www.youtube.com',
  target: Number(campaign.target) || 1,
  completed: Number(campaign.completed) || 0,
  createdAt: campaign.createdAt || nowIso(),
})

const normalizeSubscription = (entry) => ({
  ...entry,
  channelName: entry.channelName || 'YouTube Channel',
  channelUrl: entry.channelUrl || 'https://www.youtube.com',
  coins: Number(entry.coins) || RATES.taskReward,
  status: entry.status || 'verified',
  createdAt: entry.createdAt || nowIso(),
})

const normalizeDb = (raw = {}) => ({
  version: 1,
  users: (Array.isArray(raw.users) ? raw.users : []).filter((u) => u && u.id).map(normalizeUser),
  campaigns: (Array.isArray(raw.campaigns) ? raw.campaigns : [])
    .filter((c) => c && c.id)
    .map(normalizeCampaign),
  subscriptions: (Array.isArray(raw.subscriptions) ? raw.subscriptions : [])
    .filter((s) => s && s.id)
    .map(normalizeSubscription),
  skipped: Array.isArray(raw.skipped) ? raw.skipped : [],
  deposits: Array.isArray(raw.deposits) ? raw.deposits : [],
  withdrawals: Array.isArray(raw.withdrawals) ? raw.withdrawals : [],
  notifications: Array.isArray(raw.notifications) ? raw.notifications : [],
  adjustments: Array.isArray(raw.adjustments) ? raw.adjustments : [],
  sessionUserId: raw.sessionUserId || null,
  adminSessionUserId: raw.adminSessionUserId || null,
})

const bootstrapAdmin = () => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return null
  return normalizeUser({
    id: 'u_admin',
    name: 'SubBoost Admin',
    email: ADMIN_EMAIL,
    phone: '',
    password: ADMIN_PASSWORD,
    pin: '',
    coins: 0,
    lifetimeEarned: 0,
    role: 'admin',
    status: 'active',
  })
}

// The bootstrap admin always mirrors VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD.
const withAdminAccount = (db) => {
  const admin = bootstrapAdmin()
  if (!admin) return db
  const others = db.users.filter(
    (item) => item.id !== admin.id && item.email.toLowerCase() !== admin.email,
  )
  return { ...db, users: [admin, ...others] }
}

const loadDb = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.users)) {
        return withAdminAccount(normalizeDb(parsed))
      }
    }
  } catch {
    /* corrupted storage — start from an empty ledger */
  }
  return withAdminAccount(normalizeDb({}))
}

const emailLooksValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())

const makeNotification = (userId, { title, message, type = 'info' }) => ({
  id: uid('note'),
  userId,
  title,
  message,
  type,
  read: false,
  createdAt: nowIso(),
})

export function AppProvider({ children }) {
  const [db, setDb] = useState(loadDb)
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    } catch {
      /* storage full or unavailable — app still works in memory */
    }
  }, [db])

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    ({ type = 'success', title, message = '', duration = 4200 }) => {
      const id = uid('toast')
      setToasts((list) => [...list.slice(-3), { id, type, title, message }])
      const timer = setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== id))
        timers.current.delete(id)
      }, duration)
      timers.current.set(id, timer)
      return id
    },
    [],
  )

  const user = useMemo(
    () => db.users.find((item) => item.id === db.sessionUserId) || null,
    [db.users, db.sessionUserId],
  )

  const adminUser = useMemo(
    () =>
      db.users.find((item) => item.id === db.adminSessionUserId && item.role === 'admin') || null,
    [db.users, db.adminSessionUserId],
  )

  // Pick up a Supabase OAuth session (Google) that returned to the app.
  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      const authUser = data?.session?.user
      if (!active || !authUser) return
      setDb((prev) => {
        const existing = prev.users.find((item) => item.id === authUser.id)
        if (existing) return { ...prev, sessionUserId: existing.id }
        const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'SubBoost user'
        const nextUser = normalizeUser({
          id: authUser.id,
          name,
          email: authUser.email,
          phone: authUser.user_metadata?.phone || '',
          coins: 0,
          lifetimeEarned: 0,
          role: 'user',
          status: 'active',
        })
        return { ...prev, users: [...prev.users, nextUser], sessionUserId: nextUser.id }
      })
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const updateUser = useCallback((userId, patch) => {
    setDb((prev) => ({
      ...prev,
      users: prev.users.map((item) =>
        item.id === userId ? { ...item, ...(typeof patch === 'function' ? patch(item) : patch) } : item,
      ),
    }))
  }, [])

  const signIn = useCallback(
    (email, password) => {
      const normalized = email.trim().toLowerCase()
      const match = db.users.find(
        (item) => item.email.toLowerCase() === normalized && item.password === password,
      )
      if (!match) return { ok: false, error: 'Incorrect email or password. Please try again.' }
      if (match.status === 'suspended') {
        return { ok: false, error: 'This account is suspended. Contact support@subboost.np.' }
      }
      setDb((prev) => ({ ...prev, sessionUserId: match.id }))
      return { ok: true, needsPin: !match.pin }
    },
    [db.users],
  )

  const signUp = useCallback(
    ({ name, email, phone, password }) => {
      const cleanName = name.trim()
      const cleanEmail = email.trim().toLowerCase()
      if (cleanName.length < 2) return { ok: false, error: 'Please enter your full name.' }
      if (!emailLooksValid(cleanEmail)) return { ok: false, error: 'That email address does not look right.' }
      if (phone.replace(/\D/g, '').length < 9) return { ok: false, error: 'Enter a valid phone number.' }
      if (password.length < 6) return { ok: false, error: 'Use at least 6 characters for your password.' }
      if (db.users.some((item) => item.email.toLowerCase() === cleanEmail)) {
        return { ok: false, error: 'An account with this email already exists.' }
      }
      const newUser = {
        id: uid('user'),
        name: cleanName,
        email: cleanEmail,
        phone: phone.trim(),
        password,
        pin: '',
        coins: 0,
        lifetimeEarned: 0,
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      setDb((prev) => ({ ...prev, users: [...prev.users, newUser], sessionUserId: newUser.id }))
      return { ok: true, needsPin: true }
    },
    [db.users],
  )

  const signInWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
      if (data?.url) window.location.href = data.url
      return { ok: true, pending: true }
    } catch (err) {
      return { ok: false, error: err?.message || 'Google sign-in is unavailable right now.' }
    }
  }, [])

  const signOut = useCallback(() => {
    supabase.auth.signOut().catch(() => {})
    setDb((prev) => ({ ...prev, sessionUserId: null }))
  }, [])

  const setPin = useCallback(
    (pin) => {
      if (!user) return { ok: false, error: 'No active session.' }
      if (!/^\d{4}$/.test(pin)) return { ok: false, error: 'Your PIN must be exactly 4 digits.' }
      updateUser(user.id, { pin })
      return { ok: true }
    },
    [user, updateUser],
  )

  const changePassword = useCallback(
    (current, next) => {
      if (!user) return { ok: false, error: 'No active session.' }
      if (user.password !== current) return { ok: false, error: 'Your current password is incorrect.' }
      if (next.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' }
      updateUser(user.id, { password: next })
      return { ok: true }
    },
    [user, updateUser],
  )

  const verifyPin = useCallback((pin) => Boolean(user?.pin) && user.pin === pin, [user])

  const skipTask = useCallback((campaignId) => {
    setDb((prev) => {
      if (!prev.sessionUserId) return prev
      if (prev.skipped.some((s) => s.userId === prev.sessionUserId && s.campaignId === campaignId)) return prev
      return {
        ...prev,
        skipped: [...prev.skipped, { userId: prev.sessionUserId, campaignId, at: new Date().toISOString() }],
      }
    })
  }, [])

  const completeTask = useCallback(
    (campaignId) => {
      if (!user) return { ok: false, error: 'Please sign in again.' }
      const campaign = db.campaigns.find((c) => c.id === campaignId)
      if (!campaign) return { ok: false, error: 'This task is no longer available.' }
      if (campaign.userId === user.id) return { ok: false, error: 'You cannot subscribe to your own campaign.' }
      if (campaign.status && campaign.status !== 'active') {
        return { ok: false, error: 'This campaign is not accepting subscribers right now.' }
      }
      if (db.subscriptions.some((s) => s.userId === user.id && s.campaignId === campaignId)) {
        return { ok: false, error: 'You already completed this task.' }
      }
      if (campaign.completed >= campaign.target) return { ok: false, error: 'This campaign is already full.' }

      const record = {
        id: taskCode(),
        userId: user.id,
        campaignId,
        channelName: campaign.channelName,
        channelUrl: campaign.channelUrl,
        coins: RATES.taskReward,
        status: 'verified',
        createdAt: new Date().toISOString(),
      }
      setDb((prev) => ({
        ...prev,
        campaigns: prev.campaigns.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                completed: Math.min(c.target, c.completed + 1),
                status: c.completed + 1 >= c.target ? 'completed' : 'active',
              }
            : c,
        ),
        subscriptions: [record, ...prev.subscriptions],
        skipped: prev.skipped.filter(
          (s) => !(s.userId === user.id && s.campaignId === campaignId),
        ),
        users: prev.users.map((item) =>
          item.id === user.id
            ? { ...item, coins: item.coins + RATES.taskReward, lifetimeEarned: (item.lifetimeEarned || 0) + RATES.taskReward }
            : item,
        ),
      }))
      return { ok: true, record }
    },
    [user, db.campaigns, db.subscriptions],
  )

  const createCampaign = useCallback(
    ({ target, channelUrl }) => {
      if (!user) return { ok: false, error: 'Please sign in again.' }
      const count = Number(target)
      if (!Number.isInteger(count) || count < 1) {
        return { ok: false, error: 'Target must be a whole number of at least 1.' }
      }
      if (count > 5000) return { ok: false, error: 'For this demo, keep a single campaign under 5,000 subscribers.' }
      if (!isYoutubeUrl(channelUrl)) return { ok: false, error: 'Enter a valid YouTube channel URL.' }
      const cost = count * RATES.subscriberCost
      if (cost > user.coins) {
        return { ok: false, error: `You need ${cost} coins but only have ${user.coins}. Top up your wallet first.` }
      }
      const campaign = {
        id: uid('camp'),
        userId: user.id,
        channelName: channelNameFromUrl(channelUrl) || 'My YouTube Channel',
        channelUrl: normalizeUrl(channelUrl),
        target: count,
        completed: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      setDb((prev) => ({
        ...prev,
        campaigns: [campaign, ...prev.campaigns],
        users: prev.users.map((item) =>
          item.id === user.id ? { ...item, coins: item.coins - cost } : item,
        ),
      }))
      return { ok: true, campaign, cost }
    },
    [user],
  )

  const submitDeposit = useCallback(
    ({ amount, method, transactionId, screenshot }) => {
      if (!user) return { ok: false, error: 'Please sign in again.' }
      const value = Number(amount)
      if (!Number.isFinite(value) || value <= 0) return { ok: false, error: 'Enter a deposit amount.' }
      if (!transactionId.trim()) return { ok: false, error: 'Add the transaction ID from your payment app.' }
      const deposit = {
        id: uid('dep'),
        ref: 'DEP-' + Math.floor(100000 + Math.random() * 900000),
        userId: user.id,
        amount: value,
        coins: Math.round(value * RATES.coinToNpr),
        method,
        transactionId: transactionId.trim(),
        screenshot: screenshot?.dataUrl || null,
        screenshotName: screenshot?.name || null,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      setDb((prev) => ({ ...prev, deposits: [deposit, ...prev.deposits] }))
      return { ok: true, deposit }
    },
    [user],
  )

  const requestWithdraw = useCallback(
    ({ amount, method, accountName, accountNumber }) => {
      if (!user) return { ok: false, error: 'Please sign in again.' }
      const value = Number(amount)
      if (!Number.isInteger(value) || value < 1) return { ok: false, error: 'Enter a whole number of coins.' }
      if (value > user.coins) return { ok: false, error: `You only have ${user.coins} coins available.` }
      if (!accountName.trim()) return { ok: false, error: 'Add the receiver account holder name.' }
      if (accountNumber.replace(/\D/g, '').length < 9) {
        return { ok: false, error: 'Add a valid destination account number.' }
      }
      const withdrawal = {
        id: uid('wd'),
        code: receiptCode(),
        userId: user.id,
        amount: value,
        npr: value * RATES.coinToNpr,
        method,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      setDb((prev) => ({
        ...prev,
        withdrawals: [withdrawal, ...prev.withdrawals],
        users: prev.users.map((item) =>
          item.id === user.id ? { ...item, coins: item.coins - value } : item,
        ),
      }))
      return { ok: true, withdrawal }
    },
    [user],
  )

  /* ------------------------------------------------------------------------
   * Admin console
   * ---------------------------------------------------------------------- */
  const adminSignIn = useCallback(
    (email, password) => {
      const normalized = email.trim().toLowerCase()
      const match = db.users.find((item) => item.email.toLowerCase() === normalized)
      if (!match) return { ok: false, error: 'No account found with that email address.' }
      if (match.role !== 'admin') {
        return { ok: false, error: 'This account does not have admin access.' }
      }
      if (match.status === 'suspended') {
        return { ok: false, error: 'This admin account is suspended.' }
      }
      if (match.password !== password) return { ok: false, error: 'Incorrect admin password.' }
      setDb((prev) => ({ ...prev, adminSessionUserId: match.id }))
      return { ok: true }
    },
    [db.users],
  )

  const adminSignOut = useCallback(() => {
    setDb((prev) => ({ ...prev, adminSessionUserId: null }))
  }, [])

  const approveDeposit = useCallback(
    (depositId) => {
      if (!adminUser) return { ok: false, error: 'Admin session required.' }
      const deposit = db.deposits.find((item) => item.id === depositId)
      if (!deposit) return { ok: false, error: 'Deposit not found.' }
      if (deposit.status !== 'pending') return { ok: false, error: 'This deposit has already been reviewed.' }
      const recipient = db.users.find((item) => item.id === deposit.userId)
      setDb((prev) => ({
        ...prev,
        deposits: prev.deposits.map((item) =>
          item.id === depositId
            ? {
                ...item,
                status: 'approved',
                reviewedAt: nowIso(),
                reviewedBy: adminUser.id,
              }
            : item,
        ),
        users: prev.users.map((item) =>
          item.id === deposit.userId ? { ...item, coins: item.coins + deposit.coins } : item,
        ),
        notifications: [
          makeNotification(deposit.userId, {
            type: 'success',
            title: 'Deposit approved',
            message: `${deposit.coins.toLocaleString('en-IN')} coins were added to your wallet · ${deposit.ref}.`,
          }),
          ...prev.notifications,
        ],
      }))
      return { ok: true, coins: deposit.coins, name: recipient?.name || 'User' }
    },
    [adminUser, db.deposits, db.users],
  )

  const rejectDeposit = useCallback(
    (depositId, reason) => {
      if (!adminUser) return { ok: false, error: 'Admin session required.' }
      const deposit = db.deposits.find((item) => item.id === depositId)
      if (!deposit) return { ok: false, error: 'Deposit not found.' }
      if (deposit.status !== 'pending') return { ok: false, error: 'This deposit has already been reviewed.' }
      if (!reason?.trim()) return { ok: false, error: 'A rejection reason is required.' }
      setDb((prev) => ({
        ...prev,
        deposits: prev.deposits.map((item) =>
          item.id === depositId
            ? {
                ...item,
                status: 'rejected',
                rejectionReason: reason.trim(),
                reviewedAt: nowIso(),
                reviewedBy: adminUser.id,
              }
            : item,
        ),
        notifications: [
          makeNotification(deposit.userId, {
            type: 'error',
            title: 'Deposit rejected',
            message: `${deposit.ref}: ${reason.trim()}`,
          }),
          ...prev.notifications,
        ],
      }))
      return { ok: true }
    },
    [adminUser, db.deposits],
  )

  const approveWithdrawal = useCallback(
    (withdrawalId, { reference = '', proof = null } = {}) => {
      if (!adminUser) return { ok: false, error: 'Admin session required.' }
      const withdrawal = db.withdrawals.find((item) => item.id === withdrawalId)
      if (!withdrawal) return { ok: false, error: 'Withdrawal not found.' }
      if (withdrawal.status !== 'pending') return { ok: false, error: 'This payout is already resolved.' }
      setDb((prev) => ({
        ...prev,
        withdrawals: prev.withdrawals.map((item) =>
          item.id === withdrawalId
            ? {
                ...item,
                status: 'approved',
                adminReference: reference.trim() || null,
                payoutProof: proof || null,
                resolvedAt: nowIso(),
                resolvedBy: adminUser.id,
              }
            : item,
        ),
        notifications: [
          makeNotification(withdrawal.userId, {
            type: 'success',
            title: 'Withdrawal paid',
            message: `NPR ${withdrawal.npr.toLocaleString('en-IN')} was sent to your ${withdrawal.method === 'khalti' ? 'Khalti' : 'eSewa'} wallet${reference ? ` · Ref ${reference.trim()}` : ''} · Receipt #${withdrawal.code}.`,
          }),
          ...prev.notifications,
        ],
      }))
      return { ok: true }
    },
    [adminUser, db.withdrawals],
  )

  const rejectWithdrawal = useCallback(
    (withdrawalId, reason) => {
      if (!adminUser) return { ok: false, error: 'Admin session required.' }
      const withdrawal = db.withdrawals.find((item) => item.id === withdrawalId)
      if (!withdrawal) return { ok: false, error: 'Withdrawal not found.' }
      if (withdrawal.status !== 'pending') return { ok: false, error: 'This payout is already resolved.' }
      if (!reason?.trim()) return { ok: false, error: 'A rejection reason is required.' }
      setDb((prev) => ({
        ...prev,
        withdrawals: prev.withdrawals.map((item) =>
          item.id === withdrawalId
            ? {
                ...item,
                status: 'rejected',
                rejectionReason: reason.trim(),
                refunded: true,
                resolvedAt: nowIso(),
                resolvedBy: adminUser.id,
              }
            : item,
        ),
        users: prev.users.map((item) =>
          item.id === withdrawal.userId ? { ...item, coins: item.coins + withdrawal.amount } : item,
        ),
        notifications: [
          makeNotification(withdrawal.userId, {
            type: 'error',
            title: 'Withdrawal rejected — coins refunded',
            message: `${withdrawal.amount.toLocaleString('en-IN')} coins were returned to your wallet. Reason: ${reason.trim()}`,
          }),
          ...prev.notifications,
        ],
      }))
      return { ok: true, refunded: withdrawal.amount }
    },
    [adminUser, db.withdrawals],
  )

  const setCampaignState = useCallback(
    (campaignId, nextState, reason = '') => {
      if (!adminUser) return { ok: false, error: 'Admin session required.' }
      if (!['active', 'paused'].includes(nextState)) return { ok: false, error: 'Unsupported campaign state.' }
      const campaign = db.campaigns.find((item) => item.id === campaignId)
      if (!campaign) return { ok: false, error: 'Campaign not found.' }
      const paused = nextState === 'paused'
      setDb((prev) => ({
        ...prev,
        campaigns: prev.campaigns.map((item) =>
          item.id === campaignId
            ? {
                ...item,
                status: nextState,
                pauseReason: paused ? reason.trim() || 'Paused by admin' : undefined,
                pausedBy: paused ? 'admin' : undefined,
                resumedAt: paused ? item.resumedAt : nowIso(),
              }
            : item,
        ),
        notifications: [
          makeNotification(campaign.userId, {
            type: paused ? 'error' : 'success',
            title: paused ? 'Campaign paused' : 'Campaign resumed',
            message: paused
              ? `${campaign.channelName} is paused. ${reason.trim() || 'Contact support for details.'}`
              : `${campaign.channelName} is live on the task wall again.`,
          }),
          ...prev.notifications,
        ],
      }))
      return { ok: true }
    },
    [adminUser, db.campaigns],
  )

  const deleteCampaign = useCallback(
    (campaignId) => {
      if (!adminUser) return { ok: false, error: 'Admin session required.' }
      const campaign = db.campaigns.find((item) => item.id === campaignId)
      if (!campaign) return { ok: false, error: 'Campaign not found.' }
      setDb((prev) => ({
        ...prev,
        campaigns: prev.campaigns.filter((item) => item.id !== campaignId),
        notifications: [
          makeNotification(campaign.userId, {
            type: 'error',
            title: 'Campaign removed',
            message: `${campaign.channelName} was removed by moderation for breaking marketplace rules.`,
          }),
          ...prev.notifications,
        ],
      }))
      return { ok: true }
    },
    [adminUser, db.campaigns],
  )

  const cancelCampaign = useCallback(
    (campaignId, reason = 'Cancelled by admin') => {
      if (!adminUser) return { ok: false, error: 'Admin session required.' }
      const campaign = db.campaigns.find((item) => item.id === campaignId)
      if (!campaign) return { ok: false, error: 'Campaign not found.' }
      if (campaign.status === 'cancelled') return { ok: false, error: 'This campaign is already cancelled.' }
      const remaining = Math.max(0, campaign.target - campaign.completed)
      const refund = remaining * RATES.subscriberCost
      setDb((prev) => ({
        ...prev,
        campaigns: prev.campaigns.map((item) =>
          item.id === campaignId
            ? {
                ...item,
                status: 'cancelled',
                cancelReason: reason.trim(),
                refundedCoins: refund,
                cancelledAt: nowIso(),
              }
            : item,
        ),
        users: prev.users.map((item) =>
          item.id === campaign.userId ? { ...item, coins: item.coins + refund } : item,
        ),
        notifications: [
          makeNotification(campaign.userId, {
            type: 'info',
            title: 'Campaign cancelled — coins refunded',
            message: `${campaign.channelName} was cancelled. ${refund.toLocaleString('en-IN')} coins for ${remaining} unfulfilled slots were returned to your wallet.`,
          }),
          ...prev.notifications,
        ],
      }))
      return { ok: true, refund, remaining }
    },
    [adminUser, db.campaigns],
  )

  const suspendUser = useCallback(
    (userId) => {
      if (!adminUser) return { ok: false, error: 'Admin session required.' }
      if (userId === adminUser.id) return { ok: false, error: 'You cannot suspend your own admin account.' }
      const target = db.users.find((item) => item.id === userId)
      if (!target) return { ok: false, error: 'User not found.' }
      if (target.role === 'admin') return { ok: false, error: 'Admin accounts cannot be suspended here.' }
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((item) =>
          item.id === userId ? { ...item, status: 'suspended' } : item,
        ),
        campaigns: prev.campaigns.map((item) =>
          item.userId === userId && item.status === 'active'
            ? { ...item, status: 'paused', pauseReason: 'Owner account suspended', pausedBy: 'suspension' }
            : item,
        ),
        sessionUserId: prev.sessionUserId === userId ? null : prev.sessionUserId,
        notifications: [
          makeNotification(userId, {
            type: 'error',
            title: 'Account suspended',
            message: 'Your account has been suspended and your campaigns are hidden. Contact support@subboost.np.',
          }),
          ...prev.notifications,
        ],
      }))
      return { ok: true, name: target.name }
    },
    [adminUser, db.users],
  )

  const activateUser = useCallback(
    (userId) => {
      if (!adminUser) return { ok: false, error: 'Admin session required.' }
      const target = db.users.find((item) => item.id === userId)
      if (!target) return { ok: false, error: 'User not found.' }
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((item) =>
          item.id === userId ? { ...item, status: 'active' } : item,
        ),
        campaigns: prev.campaigns.map((item) =>
          item.userId === userId && item.status === 'paused' && item.pausedBy === 'suspension'
            ? { ...item, status: 'active', pauseReason: undefined, pausedBy: undefined }
            : item,
        ),
        notifications: [
          makeNotification(userId, {
            type: 'success',
            title: 'Account reinstated',
            message: 'Your account is active again. Your campaigns are back on the task wall.',
          }),
          ...prev.notifications,
        ],
      }))
      return { ok: true, name: target.name }
    },
    [adminUser, db.users],
  )

  const adjustBalance = useCallback(
    (userId, delta, note) => {
      if (!adminUser) return { ok: false, error: 'Admin session required.' }
      const amount = Number(delta)
      if (!Number.isInteger(amount) || amount === 0) {
        return { ok: false, error: 'Enter a non-zero whole number of coins.' }
      }
      if (!note?.trim() || note.trim().length < 4) {
        return { ok: false, error: 'An audit note of at least 4 characters is required.' }
      }
      const target = db.users.find((item) => item.id === userId)
      if (!target) return { ok: false, error: 'User not found.' }
      if (target.coins + amount < 0) {
        return { ok: false, error: `Cannot deduct ${Math.abs(amount)} coins — user only has ${target.coins}.` }
      }
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((item) =>
          item.id === userId ? { ...item, coins: item.coins + amount } : item,
        ),
        adjustments: [
          {
            id: uid('adj'),
            userId,
            adminId: adminUser.id,
            delta: amount,
            note: note.trim(),
            createdAt: nowIso(),
          },
          ...prev.adjustments,
        ],
        notifications: [
          makeNotification(userId, {
            type: amount > 0 ? 'success' : 'error',
            title: amount > 0 ? 'Coins added by support' : 'Coins deducted by support',
            message: `${Math.abs(amount).toLocaleString('en-IN')} coins ${amount > 0 ? 'credited' : 'deducted'} · ${note.trim()}`,
          }),
          ...prev.notifications,
        ],
      }))
      return { ok: true, balance: target.coins + amount }
    },
    [adminUser, db.users],
  )

  const resetUserPin = useCallback(
    (userId) => {
      if (!adminUser) return { ok: false, error: 'Admin session required.' }
      const target = db.users.find((item) => item.id === userId)
      if (!target) return { ok: false, error: 'User not found.' }
      const pin = String(Math.floor(1000 + Math.random() * 9000))
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((item) => (item.id === userId ? { ...item, pin } : item)),
        notifications: [
          makeNotification(userId, {
            type: 'info',
            title: 'Security PIN reset',
            message: 'Support reset your 4-digit PIN. Set a new one from Profile after signing in.',
          }),
          ...prev.notifications,
        ],
      }))
      return { ok: true, pin, name: target.name }
    },
    [adminUser, db.users],
  )

  const resetUserPassword = useCallback(
    (userId) => {
      if (!adminUser) return { ok: false, error: 'Admin session required.' }
      const target = db.users.find((item) => item.id === userId)
      if (!target) return { ok: false, error: 'User not found.' }
      const password = `SB-${Math.random().toString(36).slice(2, 8)}`
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((item) => (item.id === userId ? { ...item, password } : item)),
        notifications: [
          makeNotification(userId, {
            type: 'info',
            title: 'Password reset by support',
            message: 'Use the temporary password shared by support, then change it from Profile.',
          }),
          ...prev.notifications,
        ],
      }))
      return { ok: true, password, name: target.name }
    },
    [adminUser, db.users],
  )

  const markNotificationsRead = useCallback((userId) => {
    setDb((prev) => ({
      ...prev,
      notifications: prev.notifications.map((item) =>
        item.userId === userId ? { ...item, read: true } : item,
      ),
    }))
  }, [])

  const value = useMemo(
    () => ({
      db,
      user,
      adminUser,
      toasts,
      toast,
      dismissToast,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      setPin,
      changePassword,
      verifyPin,
      skipTask,
      completeTask,
      createCampaign,
      submitDeposit,
      requestWithdraw,
      adminSignIn,
      adminSignOut,
      approveDeposit,
      rejectDeposit,
      approveWithdrawal,
      rejectWithdrawal,
      setCampaignState,
      deleteCampaign,
      cancelCampaign,
      suspendUser,
      activateUser,
      adjustBalance,
      resetUserPin,
      resetUserPassword,
      markNotificationsRead,
    }),
    [
      db,
      user,
      adminUser,
      toasts,
      toast,
      dismissToast,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      setPin,
      changePassword,
      verifyPin,
      skipTask,
      completeTask,
      createCampaign,
      submitDeposit,
      requestWithdraw,
      adminSignIn,
      adminSignOut,
      approveDeposit,
      rejectDeposit,
      approveWithdrawal,
      rejectWithdrawal,
      setCampaignState,
      deleteCampaign,
      cancelCampaign,
      suspendUser,
      activateUser,
      adjustBalance,
      resetUserPin,
      resetUserPassword,
      markNotificationsRead,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
