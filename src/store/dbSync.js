import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { coins as fmtCoins, formatDate, timeAgo } from '../lib/utils'

/**
 * Supabase-backed state sync.
 *
 * The new owner schema is:
 *   public.profiles    id uuid pk, user_id uuid, email, name, phone, coins, lifetime_earned, is_admin, status, pin_set, avatar_letter, avatar_color, created_at
 *   public.campaigns   id, user_id, channel_name, channel_url, target, completed, status, pause_reason, flag_reason, created_at
 *   public.task_completions (log) user_id, campaign_id, coins, created_at  <- subscribed channels hide from task wall
 *   public.deposits    id, user_id, amount, coins, method, transaction_id, screenshot_url, screenshot_name, status, reference, created_at, reviewed_at, reviewed_by
 *   public.withdrawals id, user_id, amount, npr, method, account_name, account_number, code, status, admin_reference, payment_proof_url, created_at, resolved_at, resolved_by
 *   public.adjustments id, user_id, admin_id, delta, note, created_at
 *
 * In a development build with credentials missing, the client stays inert and the app
 * keeps working against a local object. Any real write falls back to local state so the
 * prototype is still usable out of the box.
 */

/**
 * A pure in-memory budget that the sync layer writes through.
 * This is the only place plain arrays of rows live; components only ever read
 * derived selectors, which keeps upstream rewrites (Supabase, Postgres, a different
 * backend) a one-file change.
 */
const users = []
const campaigns = []
const taskCompletions = []
const deposits = []
const withdrawals = []
const adjustments = []

/** Read-only snapshot exposed to the React layer. */
export const budget = {
  users: () => [...users],
  campaigns: () => [...campaigns],
  taskCompletions: () => [...taskCompletions],
  deposits: () => [...deposits],
  withdrawals: () => [...withdrawals],
  adjustments: () => [...adjustments],
  findUser: (id) => users.find((item) => item.id === id) || null,
  findCampaign: (id) => campaigns.find((item) => item.id === id) || null,
  findDeposit: (id) => deposits.find((item) => item.id === id) || null,
  findWithdrawal: (id) => withdrawals.find((item) => item.id === id) || null,
  findAdjustment: (id) => adjustments.find((item) => item.id === id) || null,
}

function nowIso() {
  return new Date().toISOString()
}

function makeId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

function initialAvatarFor(name) {
  const first = name ? name.trim().split(/\s+/)[0] : ''
  return { letter: first.slice(0, 1).toUpperCase() || '?', color: null }
}

function createUserFromRecord(record) {
  const avatar = initialAvatarFor(record.name || record.email || 'User')
  return {
    id: record.id,
    userId: record.id,
    name: record.name || 'SubBoost user',
    email: record.email,
    phone: record.phone || '',
    password: record.password || '',
    pin: record.pin || '',
    coins: Number(record.coins ?? 0),
    lifetimeEarned: Number(record.lifetime_earned ?? 0),
    isAdmin: Boolean(record.is_admin),
    status: record.status === 'suspended' ? 'suspended' : 'active',
    pinSet: Boolean(record.pin_set),
    avatarLetter: avatar.letter,
    avatarColor: avatar.color,
    createdAt: record.created_at || nowIso(),
  }
}

function createCampaignFromRecord(record) {
  return {
    id: record.id,
    userId: record.user_id,
    channelName: record.channel_name || record.channel_url || 'YouTube Channel',
    channelUrl: record.channel_url || 'https://www.youtube.com',
    target: Number(record.target) || 1,
    completed: Number(record.completed) || 0,
    status: record.status || 'active',
    pauseReason: record.pause_reason || undefined,
    pauseReasonNote: record.pause_reason_note || undefined,
    flagReason: record.flag_reason || undefined,
    createdAt: record.created_at || nowIso(),
  }
}

function createTaskCompletionFromRecord(record) {
  return {
    id: record.id,
    userId: record.user_id,
    campaignId: record.campaign_id,
    channelName: record.channel_name || 'YouTube Channel',
    channelUrl: record.channel_url || 'https://www.youtube.com',
    coins: Number(record.coins ?? 1),
    status: record.status || 'verified',
    createdAt: record.created_at || nowIso(),
  }
}

function createDepositFromRecord(record) {
  return {
    id: record.id,
    userId: record.user_id,
    ref: record.ref || 'DEP-' + Math.floor(100000 + Math.random() * 900000),
    amount: Number(record.amount ?? 0),
    coins: Number(record.coins ?? 0),
    method: record.method || 'khalti',
    transactionId: record.transaction_id || '',
    screenshot: record.screenshot_url || null,
    screenshotName: record.screenshot_name || null,
    status: record.status || 'pending',
    rejectionReason: record.rejection_reason || undefined,
    reviewedAt: record.reviewed_at || undefined,
    reviewedBy: record.reviewed_by || undefined,
    createdAt: record.created_at || nowIso(),
  }
}

function createWithdrawalFromRecord(record) {
  return {
    id: record.id,
    userId: record.user_id,
    amount: Number(record.amount ?? 0),
    npr: Number(record.npr ?? 0),
    method: record.method || 'khalti',
    accountName: record.account_name || record.accountNumber || '',
    accountNumber: record.account_number || '',
    code: record.code || '',
    status: record.status || 'pending',
    rejectionReason: record.rejection_reason || undefined,
    adminReference: record.admin_reference || undefined,
    paymentProof: record.payment_proof_url || null,
    resolvedAt: record.resolved_at || undefined,
    createdAt: record.created_at || nowIso(),
  }
}

function createAdjustmentFromRecord(record) {
  return {
    id: record.id,
    userId: record.user_id,
    adminId: record.admin_id,
    delta: Number(record.delta ?? 0),
    note: record.note || '',
    createdAt: record.created_at || nowIso(),
  }
}

function upsertUser(input) {
  const existing = users.find((item) => item.id === input.id)
  if (existing) {
    Object.assign(existing, input)
    return existing
  }
  const record = { ...input, id: input.id }
  if (!record.avatarLetter) record.avatarLetter = initialAvatarFor(input.name).letter
  if (!record.avatarColor) record.avatarColor = initialAvatarFor(input.name).color
  users.push(record)
  return record
}

function upsertCampaign(input) {
  const existing = campaigns.find((item) => item.id === input.id)
  if (existing) Object.assign(existing, input)
  else campaigns.push({ ...input })
  return campaigns.find((item) => item.id === input.id)
}

function upsertDeposit(input) {
  const existing = deposits.find((item) => item.id === input.id)
  if (existing) Object.assign(existing, input)
  else deposits.push({ ...input })
  return deposits.find((item) => item.id === input.id)
}

function upsertWithdrawal(input) {
  const existing = withdrawals.find((item) => item.id === input.id)
  if (existing) Object.assign(existing, input)
  else withdrawals.push({ ...input })
  return withdrawals.find((item) => item.id === input.id)
}

function upsertAdjustment(input) {
  const existing = adjustments.find((item) => item.id === input.id)
  if (existing) Object.assign(existing, input)
  else adjustments.push({ ...input })
  return adjustments.find((item) => item.id === input.id)
}

export function seedBudgetFromLocal(db) {
  users.length = 0
  campaigns.length = 0
  taskCompletions.length = 0
  deposits.length = 0
  withdrawals.length = 0
  adjustments.length = 0

  const now = Date.now()
  const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString()
  const daysAgo = (d) => new Date(now - d * 24 * 3600 * 1000).toISOString()

  const admins = [
    {
      id: 'u_admin',
      name: 'SubBoost Admin',
      email: 'admin@subboost.np',
      phone: '+977 9800000000',
      password: 'admin123',
      pin: '9999',
      coins: 0,
      lifetimeEarned: 0,
      is_admin: true,
      role: 'admin',
      status: 'active',
      createdAt: daysAgo(365),
    },
  ]

  const creators = [
    {
      id: 'u_jenish',
      name: 'Jenish Shah',
      email: 'jenish@subboost.np',
      phone: '+977 9841234567',
      password: 'demo1234',
      pin: '1234',
      coins: 248,
      lifetimeEarned: 412,
      is_admin: false,
      role: 'user',
      status: 'active',
      createdAt: daysAgo(64),
    },
  ]

  const others = [
    { id: 'u_sujan', name: 'Sujan Rai', email: 'sujan@example.com', phone: '+977 9801112233', password: 'demo1234', pin: '1111', coins: 96, lifetimeEarned: 180, is_admin: false, role: 'user', status: 'active', createdAt: daysAgo(120) },
    { id: 'u_techbits', name: 'Nepal Tech Bits', email: 'techbits@example.com', phone: '+977 9812223344', password: 'demo1234', pin: '2222', coins: 140, lifetimeEarned: 320, is_admin: false, role: 'user', status: 'active', createdAt: daysAgo(96) },
    { id: 'u_himalaya', name: 'Himalayan Vlogs', email: 'himalaya@example.com', phone: '+977 9845556677', password: 'demo1234', pin: '3333', coins: 72, lifetimeEarned: 150, is_admin: false, role: 'user', status: 'active', createdAt: daysAgo(52) },
    { id: 'u_sneha', name: 'Sneha Gurung', email: 'sneha@example.com', phone: '+977 9867778899', password: 'demo1234', pin: '4444', coins: 210, lifetimeEarned: 640, is_admin: false, role: 'user', status: 'active', createdAt: daysAgo(210) },
    { id: 'u_bibek', name: 'Bibek Shrestha', email: 'bibek@example.com', phone: '+977 9808889900', password: 'demo1234', pin: '5555', coins: 40, lifetimeEarned: 90, is_admin: false, role: 'user', status: 'active', createdAt: daysAgo(31) },
    { id: 'u_kitchen', name: 'Kathmandu Kitchen', email: 'kitchen@example.com', phone: '+977 9819990011', password: 'demo1234', pin: '6666', coins: 165, lifetimeEarned: 280, is_admin: false, role: 'user', status: 'active', createdAt: daysAgo(140) },
    { id: 'u_aayush', name: 'Aayush Thapa', email: 'aayush@example.com', phone: '+977 9801122334', password: 'demo1234', pin: '7777', coins: 88, lifetimeEarned: 140, is_admin: false, role: 'user', status: 'active', createdAt: daysAgo(48) },
    { id: 'u_poonam', name: 'Poonam K.C.', email: 'poonam@example.com', phone: '+977 9846677889', password: 'demo1234', pin: '8888', coins: 56, lifetimeEarned: 110, is_admin: false, role: 'user', status: 'active', createdAt: daysAgo(72) },
    { id: 'u_spam', name: 'Rapid Growth NP', email: 'rapidgrowth@example.com', phone: '+977 9800011122', password: 'demo1234', pin: '1212', coins: 0, lifetimeEarned: 0, is_admin: false, role: 'user', status: 'suspended', createdAt: daysAgo(17) },
  ]

  const accounts = [...admins, ...creators, ...others]

  accounts.forEach((account) => {
    upsertUser({
      id: account.id,
      name: account.name,
      email: account.email,
      phone: account.phone,
      password: account.password,
      pin: account.pin,
      coins: account.coins,
      lifetimeEarned: account.lifetimeEarned,
      isAdmin: account.is_admin,
      status: account.status,
      pinSet: Boolean(account.pin),
      createdAt: account.createdAt,
    })
  })

  const baseCampaigns = [
    { id: 'c_jenish_50', userId: 'u_jenish', channelName: 'Jenish Shah', channelUrl: 'https://www.youtube.com/@JenishShah', target: 50, completed: 38, createdAt: hoursAgo(5), status: 'active' },
    { id: 'c_techbits_30', userId: 'u_techbits', channelName: 'Nepal Tech Bits', channelUrl: 'https://www.youtube.com/@NepalTechBits', target: 30, completed: 11, createdAt: hoursAgo(21), status: 'active' },
    { id: 'c_himalaya_25', userId: 'u_himalaya', channelName: 'Himalayan Vlogs', channelUrl: 'https://www.youtube.com/@HimalayanVlogs', target: 25, completed: 22, createdAt: daysAgo(1), status: 'active' },
    { id: 'c_sneha_100', userId: 'u_sneha', channelName: 'Sneha Gurung', channelUrl: 'https://www.youtube.com/@SnehaGurungMusic', target: 100, completed: 47, createdAt: daysAgo(2), status: 'active' },
    { id: 'c_bibek_20', userId: 'u_bibek', channelName: 'Bibek Shrestha', channelUrl: 'https://www.youtube.com/@BibekShrestha', target: 20, completed: 3, createdAt: daysAgo(2), status: 'active' },
    { id: 'c_kitchen_40', userId: 'u_kitchen', channelName: 'Kathmandu Kitchen', channelUrl: 'https://www.youtube.com/@KathmanduKitchen', target: 40, completed: 33, createdAt: daysAgo(4), status: 'active' },
    { id: 'c_sujan_60', userId: 'u_sujan', channelName: 'Sujan Rai', channelUrl: 'https://www.youtube.com/@SujanRaiOfficial', target: 60, completed: 24, createdAt: hoursAgo(9), status: 'active' },
    { id: 'c_aayush_35', userId: 'u_aayush', channelName: 'Aayush Thapa', channelUrl: 'https://www.youtube.com/@AayushThapa', target: 35, completed: 30, createdAt: hoursAgo(16), status: 'active' },
    { id: 'c_poonam_15', userId: 'u_poonam', channelName: 'Poonam K.C.', channelUrl: 'https://www.youtube.com/@PoonamKC', target: 15, completed: 12, createdAt: daysAgo(3), status: 'active' },
    { id: 'c_techbits_done', userId: 'u_techbits', channelName: 'Nepal Tech Bits', channelUrl: 'https://www.youtube.com/@NepalTechBits', target: 20, completed: 20, createdAt: daysAgo(12), status: 'completed' },
    { id: 'c_kitchen_paused', userId: 'u_kitchen', channelName: 'Kathmandu Kitchen Shorts', channelUrl: 'https://www.youtube.com/@KathmanduKitchenShorts', target: 90, completed: 20, createdAt: daysAgo(7), status: 'paused', pauseReason: 'Awaiting channel ownership verification' },
    { id: 'c_bibek_flagged', userId: 'u_bibek', channelName: 'Bibek Daily', channelUrl: 'https://www.youtube.com/@BibekDaily', target: 200, completed: 4, createdAt: daysAgo(5), status: 'flagged', flagReason: 'Subscriber spike reported by two users' },
  ]

  baseCampaigns.forEach((campaign) => {
    upsertCampaign({ ...campaign, userId: campaign.userId })
  })

  const subscriptions = ['c_himalaya_25', 'c_kitchen_40', 'c_sneha_100'].map((campaignId, index) => {
    const campaign = campaigns.find((item) => item.id === campaignId)
    const channelName = campaign?.channelName || 'YouTube Channel'
    const now = Date.now()
    const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString()
    const code = ['SB-K7M2P', 'SB-Q4TY9', 'SB-X8W3R'][index]
    upsertTaskCompletion({
      id: code,
      userId: 'u_jenish',
      campaignId,
      channelName,
      channelUrl: channelName === 'Himalayan Vlogs' ? 'https://www.youtube.com/@HimalayanVlogs' : campaign?.channelUrl || 'https://www.youtube.com',
      coins: 1,
      status: 'verified',
      createdAt: hoursAgo(index + 3),
    })
    return code
  })

  const paymentProof = (method, amount, txn, date) => {
    const khalti = method === 'khalti'
    const brand = khalti ? '#5C2D91' : '#60BB46'
    const label = khalti ? 'Khalti' : 'eSewa'
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="680" viewBox="0 0 520 680"><rect width="520" height="680" fill="#0d1424"/><rect x="24" y="24" width="472" height="632" rx="22" fill="#111c31" stroke="#26324a"/><circle cx="72" cy="82" r="22" fill="${brand}"/><text x="72" y="90" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#fff" text-anchor="middle">${khalti ? 'K' : 'e'}</text><text x="108" y="78" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">${label} wallet</text><text x="108" y="98" font-family="Arial, sans-serif" font-size="12" fill="#8fa0bd">Payment successful</text><circle cx="260" cy="180" r="34" fill="${brand}" opacity="0.18"/><path d="M246 180 l10 10 20 -22" stroke="${brand}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="260" y="252" font-family="Arial, sans-serif" font-size="13" fill="#8fa0bd" text-anchor="middle">Amount paid</text><text x="260" y="292" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff" text-anchor="middle">NPR ${Number(amount).toLocaleString('en-IN')}</text><line x1="56" y1="330" x2="464" y2="330" stroke="#26324a"/><text x="56" y="372" font-family="Arial, sans-serif" font-size="12" fill="#8fa0bd">Transaction ID</text><text x="464" y="372" font-family="Arial, sans-serif" font-size="13" fill="#e7ecf6" text-anchor="end">${txn}</text><text x="56" y="414" font-family="Arial, sans-serif" font-size="12" fill="#8fa0bd">Date</text><text x="464" y="414" font-family="Arial, sans-serif" font-size="13" fill="#e7ecf6" text-anchor="end">${date}</text><text x="56" y="456" font-family="Arial, sans-serif" font-size="12" fill="#8fa0bd">Receiver</text><text x="464" y="456" font-family="Arial, sans-serif" font-size="13" fill="#e7ecf6" text-anchor="end">Shadhana Kumari Shahi Shah</text><text x="56" y="498" font-family="Arial, sans-serif" font-size="12" fill="#8fa0bd">Receiver number</text><text x="464" y="498" font-family="Arial, sans-serif" font-size="13" fill="#e7ecf6" text-anchor="end">+977 9840046284</text><rect x="56" y="540" width="408" height="64" rx="12" fill="${brand}" opacity="0.12"/><text x="260" y="578" font-family="Arial, sans-serif" font-size="12" fill="${khalti ? '#c4b5fd' : '#bbf7d0'}" text-anchor="middle">SubBoost Nepal · coin top-up</text><text x="260" y="620" font-family="Arial, sans-serif" font-size="10" fill="#5c6b85" text-anchor="middle">Demo receipt generated for the SubBoost admin prototype</text></svg>`
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }

  const depositSeeds = [
    { id: 'dep_seed_1', userId: 'u_jenish', amount: 500, coins: 500, method: 'khalti', transactionId: 'KHX9912AB', screenshot: null, screenshotName: null, status: 'approved', createdAt: daysAgo(18), reviewedAt: daysAgo(18), reviewedBy: 'u_admin' },
    { id: 'dep_seed_2', userId: 'u_jenish', amount: 100, coins: 100, method: 'esewa', transactionId: 'ESW-00021', screenshot: null, screenshotName: null, status: 'rejected', rejectionReason: 'Payment not received', createdAt: daysAgo(9), reviewedAt: daysAgo(9), reviewedBy: 'u_admin' },
    { id: 'dep_seed_3', userId: 'u_sujan', amount: 500, coins: 500, method: 'khalti', transactionId: 'KHX884291', screenshot: paymentProof('khalti', 500, 'KHX884291', daysAgo(0.2).slice(0, 10)), screenshotName: 'khalti-500.png', status: 'pending', createdAt: hoursAgo(3) },
    { id: 'dep_seed_4', userId: 'u_sneha', amount: 1200, coins: 1200, method: 'esewa', transactionId: 'ESW-993214', screenshot: paymentProof('esewa', 1200, 'ESW-993214', daysAgo(0.4).slice(0, 10)), screenshotName: 'esewa-1200.png', status: 'pending', createdAt: hoursAgo(6) },
    { id: 'dep_seed_5', userId: 'u_bibek', amount: 300, coins: 300, method: 'khalti', transactionId: 'KHX771203', screenshot: paymentProof('khalti', 300, 'KHX771203', daysAgo(1).slice(0, 10)), screenshotName: 'khalti-300.png', status: 'pending', createdAt: daysAgo(1) },
    { id: 'dep_seed_6', userId: 'u_poonam', amount: 800, coins: 800, method: 'esewa', transactionId: 'ESW-771290', screenshot: paymentProof('esewa', 800, 'ESW-771290', daysAgo(1.4).slice(0, 10)), screenshotName: 'esewa-800.png', status: 'pending', createdAt: daysAgo(1.4) },
    { id: 'dep_seed_7', userId: 'u_aayush', amount: 700, coins: 700, method: 'khalti', transactionId: 'KHX559901', screenshot: paymentProof('khalti', 700, 'KHX559901', daysAgo(11).slice(0, 10)), screenshotName: 'khalti-700.png', status: 'approved', createdAt: daysAgo(11), reviewedAt: daysAgo(11), reviewedBy: 'u_admin' },
  ]

  depositSeeds.forEach((deposit) => {
    upsertDeposit(deposit)
  })

  const withdrawalSeeds = [
    { id: 'wd_seed_1', userId: 'u_jenish', amount: 400, npr: 400, method: 'khalti', accountName: 'Shadhana Kumari Shahi Shah', accountNumber: '+977 9840046284', code: '7412', status: 'approved', createdAt: daysAgo(6), resolvedAt: daysAgo(6), adminReference: 'KHL-PAY-994120' },
    { id: 'wd_seed_2', userId: 'u_sujan', amount: 250, npr: 250, method: 'khalti', accountName: 'Sujan Rai', accountNumber: '+977 9801112233', code: '5214', status: 'pending', createdAt: hoursAgo(4) },
    { id: 'wd_seed_3', userId: 'u_bibek', amount: 100, npr: 100, method: 'esewa', accountName: 'Bibek Shrestha', accountNumber: '+977 9808889900', code: '9081', status: 'pending', createdAt: daysAgo(1) },
    { id: 'wd_seed_4', userId: 'u_aayush', amount: 60, npr: 60, method: 'khalti', accountName: 'Aayush Thapa', accountNumber: '+977 9801122334', code: '3345', status: 'pending', createdAt: daysAgo(1.5) },
    { id: 'wd_seed_5', userId: 'u_himalaya', amount: 150, npr: 150, method: 'esewa', accountName: 'Himalayan Vlogs', accountNumber: '+977 9845556677', code: '1177', status: 'rejected', rejectionReason: 'Account number does not match the wallet name', refunded: true, createdAt: daysAgo(8), resolvedAt: daysAgo(7) },
  ]

  withdrawalSeeds.forEach((withdrawal) => {
    upsertWithdrawal(withdrawal)
  })

  const notificationSeeds = [
    { id: 'note_seed_1', userId: 'u_jenish', title: 'Deposit approved', message: '500 coins were added to your wallet. Ref DEP-882104.', type: 'success', read: false, createdAt: daysAgo(18) },
    { id: 'note_seed_2', userId: 'u_jenish', title: 'Withdrawal paid', message: 'NPR 400 was sent to your Khalti wallet. Receipt #7412.', type: 'success', read: true, createdAt: daysAgo(6) },
    { id: 'note_seed_3', userId: 'u_jenish', title: 'Welcome to SubBoost Nepal', message: 'Subscribe to your first channel to earn your first coin.', type: 'info', read: true, createdAt: daysAgo(64) },
    { id: 'note_seed_4', userId: 'u_sujan', title: 'Withdrawal paid', message: 'NPR 400 was sent to your Khalti wallet.', type: 'success', read: true, createdAt: daysAgo(20) },
  ]

  notificationSeeds.forEach((notification) => {
    upsertNotification(notification)
  })

  const adminSeed = {
    id: 'u_admin',
    name: 'SubBoost Admin',
    email: 'admin@subboost.np',
    phone: '+977 9800000000',
    pin: '9999',
    coins: 0,
    lifetimeEarned: 0,
    is_admin: true,
    role: 'admin',
    status: 'active',
    createdAt: daysAgo(365),
  }
  upsertUser(adminSeed)
}

/** Premium and basic helpers shared by the sync layer and later DB modules. */
export const createNotification = (userId, { title, message, type = 'info' } = {}) => ({
  id: makeId('note'),
  userId,
  title,
  message,
  type,
  read: false,
  createdAt: nowIso(),
})

export const createUserActivityLog = ({
  userId,
  action,
  label,
  detail,
  adminId = null,
} = {}) => ({
  id: makeId('log'),
  userId,
  action,
  label: label || action,
  detail,
  adminId: adminId || null,
  createdAt: nowIso(),
})

export function isDevMode() {
  try {
    return !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY
  } catch {
    return true
  }
}

export function createDbSync({ appName = 'SubBoost Nepal' } = {}) {
  const [isReady, setIsReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [db, setDb] = useState(() => {
    try {
      const parsed = localStorage.getItem(appName)
      if (parsed) {
        const parsedDb = JSON.parse(parsed)
        if (parsedDb && typeof parsedDb === 'object') {
          const users = (parsedDb.users || []).map((item) =>
            typeof item.id === 'string' ? item : null,
          ).filter(Boolean)
          return {
            users,
            campaigns: parsedDb.campaigns || [],
            taskCompletions: parsedDb.taskCompletions || [],
            deposits: parsedDb.deposits || [],
            withdrawals: parsedDb.withdrawals || [],
            adjustments: parsedDb.adjustments || [],
            sessions: parsedDb.sessions || {},
            version: parsedDb.version || 1,
            updatedAt: parsedDb.updatedAt || null,
          }
        }
      }
    } catch {
      /* corrupted storage — fall back to empty budget */
    }
    return {
      users: [],
      campaigns: [],
      taskCompletions: [],
      deposits: [],
      withdrawals: [],
      adjustments: [],
      sessions: {},
      version: 1,
      updatedAt: null,
    }
  })

  const dbVersion = 1

  const save = () => {
    try {
      localStorage.setItem(appName, JSON.stringify(db))
    } catch {
      /* storage full or unavailable — the session is still usable in memory */
    }
  }

  const hydrate = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, email, name, phone, coins, lifetime_earned, is_admin, status, pin_set, pin, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (Array.isArray(data) && data.length > 0) {
        const nextUsers = data.map((item) => createUserFromRecord(item))
        setDb((prev) => ({
          ...prev,
          users: nextUsers,
          updatedAt: nowIso(),
        }))
        return nextUsers
      }

      // No profiles yet: keep the budget empty rather than seeding demo data.
      setDb((prev) => ({
        ...prev,
        users: [],
        updatedAt: nowIso(),
      }))
      return []
    } catch (err) {
      setError(err)
      setDb((prev) => ({
        ...prev,
        users: [],
        updatedAt: nowIso(),
      }))
      return []
    } finally {
      setLoading(false)
      setIsReady(true)
    }
  }

  const syncLocalToSupabase = async () => {
    if (isDevMode()) return
    try {
      for (const user of users) {
        const { error } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              user_id: user.userId,
              email: user.email,
              name: user.name,
              phone: user.phone,
              coins: user.coins,
              lifetime_earned: user.lifetimeEarned,
              is_admin: user.isAdmin,
              status: user.status,
              pin_set: user.pinSet,
              pin: user.pin,
              created_at: user.createdAt,
            },
            { onConflict: 'id' },
          )
        if (error) throw error
      }
      for (const campaign of campaigns) {
        const { error } = await supabase.from('campaigns').upsert(
          {
            id: campaign.id,
            user_id: campaign.userId,
            channel_name: campaign.channelName,
            channel_url: campaign.channelUrl,
            target: campaign.target,
            completed: campaign.completed,
            status: campaign.status,
            pause_reason: campaign.pauseReason,
            pause_reason_note: campaign.pauseReasonNote,
            flag_reason: campaign.flagReason,
            created_at: campaign.createdAt,
          },
          { onConflict: 'id' },
        )
        if (error) throw error
      }
      for (const completion of taskCompletions) {
        const { error } = await supabase
          .from('task_completions')
          .upsert(
            {
              id: completion.id,
              user_id: completion.userId,
              campaign_id: completion.campaignId,
              coins: completion.coins,
              status: completion.status,
              created_at: completion.createdAt,
            },
            { onConflict: 'id' },
          )
        if (error) throw error
      }
      for (const deposit of deposits) {
        const { error } = await supabase.from('deposits').upsert(
          {
            id: deposit.id,
            user_id: deposit.userId,
            amount: deposit.amount,
            coins: deposit.coins,
            method: deposit.method,
            transaction_id: deposit.transactionId,
            screenshot_url: deposit.screenshot,
            screenshot_name: deposit.screenshotName,
            status: deposit.status,
            rejection_reason: deposit.rejectionReason,
            reference: deposit.ref,
            reviewed_at: deposit.reviewedAt,
            reviewed_by: deposit.reviewedBy,
            created_at: deposit.createdAt,
          },
          { onConflict: 'id' },
        )
        if (error) throw error
      }
      for (const withdrawal of withdrawals) {
        const { error } = await supabase.from('withdrawals').upsert(
          {
            id: withdrawal.id,
            user_id: withdrawal.userId,
            amount: withdrawal.amount,
            npr: withdrawal.npr,
            method: withdrawal.method,
            account_name: withdrawal.accountName,
            account_number: withdrawal.accountNumber,
            code: withdrawal.code,
            status: withdrawal.status,
            rejection_reason: withdrawal.rejectionReason,
            admin_reference: withdrawal.adminReference,
            payment_proof_url: withdrawal.paymentProof,
            created_at: withdrawal.createdAt,
            resolved_at: withdrawal.resolvedAt,
            resolved_by: withdrawal.resolvedBy,
          },
          { onConflict: 'id' },
        )
        if (error) throw error
      }
      for (const adjustment of adjustments) {
        const { error } = await supabase.from('adjustments').upsert(
          {
            id: adjustment.id,
            user_id: adjustment.userId,
            admin_id: adjustment.adminId,
            delta: adjustment.delta,
            note: adjustment.note,
            created_at: adjustment.createdAt,
          },
          { onConflict: 'id' },
        )
        if (error) throw error
      }
    } catch (err) {
      console.warn('[Supabase sync] Could not sync local budget to Supabase:', err)
    }
  }

  const refreshFromSupabase = async () => {
    try {
      if (isDevMode()) return
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, email, name, phone, coins, lifetime_earned, is_admin, status, pin_set, pin, created_at')
      if (error) throw error
      const next = Array.isArray(data) ? data.map(createUserFromRecord) : []
      setDb((prev) => ({
        ...prev,
        users: next,
        updatedAt: nowIso(),
      }))
      return next
    } catch (err) {
      setError(err)
      return db.users
    }
  }

  const signUp = async (email, password, name = '', phone = '') => {
    try {
      if (isDevMode()) {
        const newUser = {
          id: makeId('user'),
          userId: makeId('user'),
          name,
          email: email.trim().toLowerCase(),
          phone,
          password,
          pin: '',
          coins: 0,
          lifetimeEarned: 0,
          isAdmin: false,
          status: 'active',
          pinSet: false,
          createdAt: nowIso(),
        }
        upsertUser(newUser)
        setDb((prev) => ({
          ...prev,
          users: [...prev.users, newUser],
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true, user: newUser }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone, source: 'subboost' },
        },
      })

      if (error) throw error

      if (!data.user) {
        return { ok: true, needsPin: true, pending: true }
      }

      // Create the profile row so the rest of the app can read it.
      const profile = {
        id: data.user.id,
        user_id: data.user.id,
        email: data.user.email,
        name,
        phone,
        coins: 0,
        lifetime_earned: 0,
        is_admin: false,
        status: 'active',
        pin_set: false,
        pin: '',
        created_at: nowIso(),
      }
      const { error: profileError } = await supabase.from('profiles').insert(profile)
      if (profileError) throw profileError

      // In a real deployment the auth hook would also create the profile.
      // We wait a short time for the Supabase hook to fire so the app does not
      // end up with a profile that is missing first/last name fields.
      await new Promise((resolve) => setTimeout(resolve, 400))

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!userData.user) throw new Error('Supabase auth returned no user after sign up.')

      const freshUser = createUserFromRecord({
        id: userData.user.id,
        user_id: userData.user.id,
        email: userData.user.email,
        name,
        phone,
        coins: 0,
        lifetime_earned: 0,
        is_admin: false,
        status: 'active',
        pin_set: false,
        pin: '',
        created_at: nowIso(),
      })
      upsertUser(freshUser)
      setDb((prev) => ({
        ...prev,
        users: [...prev.users, freshUser],
        updatedAt: nowIso(),
      }))
      save()
      return { ok: true, user: freshUser, needsPin: true }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const signIn = async (email, password) => {
    try {
      if (isDevMode()) {
        const next = await refreshFromSupabase()
        const match = db.users.find(
          (item) =>
            item.email.toLowerCase() === email.trim().toLowerCase() &&
            item.password === password,
        )
        if (!match) return { ok: false, error: 'Incorrect email or password. Please try again.' }
        if (match.status === 'suspended') {
          return { ok: false, error: 'This account is suspended. Contact support@subboost.np.' }
        }
        setDb((prev) => ({
          ...prev,
          sessions: { ...prev.sessions, [match.id]: true },
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true, user: match, needsPin: !match.pinSet }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!userData.user) throw new Error('Supabase auth returned no user after sign in.')

      const freshUser = createUserFromRecord({
        id: userData.user.id,
        user_id: userData.user.id,
        email: userData.user.email,
        name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'User',
        phone: userData.user.user_metadata?.phone || '',
        coins: 0,
        lifetime_earned: 0,
        is_admin: false,
        status: 'active',
        pin_set: false,
        pin: '',
        created_at: nowIso(),
      })
      upsertUser(freshUser)
      setDb((prev) => ({
        ...prev,
        users: [...prev.users, freshUser],
        sessions: { ...prev.sessions, [freshUser.id]: true },
        updatedAt: nowIso(),
      }))
      save()
      return { ok: true, user: freshUser, needsPin: !freshUser.pinSet }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const signInWithGoogle = async () => {
    try {
      if (isDevMode()) {
        const demo = db.users.find((item) => item.email === 'jenish@subboost.np')
        if (demo) {
          if (demo.status === 'suspended') return { ok: false, error: 'This account is suspended.' }
          setDb((prev) => ({
            ...prev,
            sessions: { ...prev.sessions, [demo.id]: true },
            updatedAt: nowIso(),
          }))
          save()
          return { ok: true, user: demo, needsPin: !demo.pinSet }
        }
        const googleUser = {
          id: makeId('user'),
          userId: makeId('user'),
          name: 'Jenish Shah',
          email: 'jenish@gmail.com',
          phone: '+977 9841234567',
          password: makeId('g'),
          pin: '',
          coins: 0,
          lifetimeEarned: 0,
          isAdmin: false,
          status: 'active',
          pinSet: false,
          createdAt: nowIso(),
        }
        upsertUser(googleUser)
        setDb((prev) => ({
          ...prev,
          users: [...prev.users, googleUser],
          sessions: { ...prev.sessions, [googleUser.id]: true },
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true, user: googleUser, needsPin: true }
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })

      if (error) throw error

      if (!data.url) throw new Error('Google OAuth did not return a redirect URL.')
      window.location.href = data.url
      return { ok: true, pending: true }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const signOut = async () => {
    try {
      if (isDevMode()) {
        setDb((prev) => ({
          ...prev,
          sessions: {},
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true }
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setDb((prev) => ({
        ...prev,
        sessions: {},
        updatedAt: nowIso(),
      }))
      save()
      return { ok: true }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const setPin = async (pin) => {
    try {
      if (!user) return { ok: false, error: 'No active session.' }
      if (!/^\d{4}$/.test(pin)) return { ok: false, error: 'Your PIN must be exactly 4 digits.' }

      if (isDevMode()) {
        const match = db.users.find((item) => item.id === user.id)
        if (!match) return { ok: false, error: 'User not found.' }
        const next = { ...match, pin }
        upsertUser({ ...next, pinSet: true })
        setDb((prev) => ({
          ...prev,
          users: prev.users.map((item) => (item.id === user.id ? next : item)),
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true }
      }

      const { error } = await supabase.from('profiles').update({
        pin: pin,
        pin_set: true,
      }).eq('id', user.id)

      if (error) throw error
      return { ok: true }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const changePassword = async (current, next) => {
    try {
      if (isDevMode()) {
        const match = db.users.find((item) => item.id === user.id)
        if (!match) return { ok: false, error: 'User not found.' }
        if (match.password !== current) return { ok: false, error: 'Your current password is incorrect.' }
        if (next.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' }
        const nextUser = { ...match, password: next }
        upsertUser(nextUser)
        setDb((prev) => ({
          ...prev,
          users: prev.users.map((item) => (item.id === user.id ? nextUser : item)),
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true }
      }

      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) throw error
      return { ok: true }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const verifyPin = (pin) => {
    const match = db.users.find((item) => item.id === user?.id)
    return Boolean(match && match.pin === pin)
  }

  const updateProfile = async ({ name, phone } = {}) => {
    try {
      if (isDevMode()) {
        const match = db.users.find((item) => item.id === user.id)
        if (!match) return { ok: false, error: 'User not found.' }
        const next = { ...match }
        if (name) next.name = name
        if (phone) next.phone = phone
        upsertUser({ ...next, createdAt: match.createdAt })
        setDb((prev) => ({
          ...prev,
          users: prev.users.map((item) => (item.id === user.id ? next : item)),
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true }
      }

      const { error } = await supabase.from('profiles').update({
        name: name || null,
        phone: phone || null,
      }).eq('id', user.id)

      if (error) throw error
      return { ok: true }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const completeTask = async (campaignId) => {
    try {
      const campaign = db.findCampaign(campaignId)
      if (!campaign) return { ok: false, error: 'This task is no longer available.' }
      if (campaign.userId === user.id) return { ok: false, error: 'You cannot subscribe to your own campaign.' }
      if (campaign.status !== 'active') return { ok: false, error: 'This campaign is not accepting subscribers right now.' }
      if (campaign.completed >= campaign.target) return { ok: false, error: 'This campaign is already full.' }

      const record = {
        id: makeId('task'),
        campaignId,
        userId: user.id,
        coins: RATES.taskReward,
        status: 'accepted',
        createdAt: nowIso(),
      }

      if (isDevMode()) {
        upsertTaskCompletion(record)
        setDb((prev) => {
          const updatedCampaigns = prev.campaigns.map((c) =>
            c.id === campaignId
              ? {
                  ...c,
                  completed: Math.min(c.target, c.completed + 1),
                  status: c.completed + 1 >= c.target ? 'completed' : 'active',
                }
              : c,
          )
          const updatedUser = prev.users.find((item) => item.id === user.id)
          return {
            ...prev,
            campaigns: updatedCampaigns,
            taskCompletions: [...prev.taskCompletions, record],
            users: prev.users.map((item) =>
              item.id === user.id
                ? {
                    ...item,
                    coins: item.coins + RATES.taskReward,
                    lifetimeEarned: (item.lifetimeEarned || 0) + RATES.taskReward,
                  }
                : item,
            ),
            updatedAt: nowIso(),
          }
        })
        save()
        return { ok: true, record }
      }

      const { error: insertError } = await supabase.from('task_completions').insert({
        id: record.id,
        user_id: user.id,
        campaign_id: campaign.id,
        coins: RATES.taskReward,
        status: record.status,
        created_at: record.createdAt,
      })
      if (insertError) throw insertError

      const { error: updateError } = await supabase.from('campaigns').update({
        completed: campaign.completed + 1,
        status: campaign.completed + 1 >= campaign.target ? 'completed' : 'active',
      }).eq('id', campaign.id)

      if (updateError) throw updateError

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('coins, lifetime_earned')
        .eq('id', user.id)
        .single()
      if (userError) throw userError

      const coins = Number(userData.coins || 0) + RATES.taskReward
      const lifetimeEarned = Number(userData.lifetime_earned || 0) + RATES.taskReward
      const { error: updateUserError } = await supabase
        .from('profiles')
        .update({ coins, lifetime_earned: lifetimeEarned })
        .eq('id', user.id)
      if (updateUserError) throw updateUserError

      return { ok: true, record, coins }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const createCampaign = async ({ target, channelUrl } = {}) => {
    try {
      if (isDevMode()) {
        const count = Number(target)
        if (!Number.isInteger(count) || count < 1) {
          return { ok: false, error: 'Target must be a whole number of at least 1.' }
        }
        if (count > 5000) return { ok: false, error: 'For this demo, keep a single campaign under 5,000 subscribers.' }
        const cost = count * RATES.subscriberCost
        if (cost > user.coins) {
          return { ok: false, error: `You need ${cost} coins but only have ${user.coins}. Top up your wallet first.` }
        }
        const campaign = {
          id: makeId('camp'),
          userId: user.id,
          channelName: channelNameFromUrl(channelUrl) || 'My YouTube Channel',
          channelUrl: normalizeUrl(channelUrl),
          target: count,
          completed: 0,
          status: 'active',
          createdAt: nowIso(),
          cost,
        }
        upsertCampaign(campaign)
        setDb((prev) => ({
          ...prev,
          campaigns: [campaign, ...prev.campaigns],
          users: prev.users.map((item) =>
            item.id === user.id ? { ...item, coins: item.coins - cost } : item,
          ),
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true, campaign, cost }
      }

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', user.id)
        .single()
      if (userError) throw userError

      const coins = Number(userData.coins || 0)
      const cost = Number(target) * RATES.subscriberCost
      if (cost > coins) {
        return { ok: false, error: `You need ${cost} coins but only have ${coins}. Top up your wallet first.` }
      }

      const { error } = await supabase.from('campaigns').insert({
        id: makeId('camp'),
        user_id: user.id,
        channel_name: channelNameFromUrl(channelUrl) || 'My YouTube Channel',
        channel_url: normalizeUrl(channelUrl),
        target: Number(target),
        completed: 0,
        status: 'active',
        created_at: nowIso(),
      })
      if (error) throw error

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: coins - cost })
        .eq('id', user.id)
      if (updateError) throw updateError

      return { ok: true, cost }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const submitDeposit = async ({ amount, method, transactionId, screenshot } = {}) => {
    try {
      if (isDevMode()) {
        const value = Number(amount)
        if (!Number.isFinite(value) || value <= 0) return { ok: false, error: 'Enter a deposit amount.' }
        if (!transactionId?.trim()) return { ok: false, error: 'Add the transaction ID from your payment app.' }
        const deposit = {
          id: makeId('dep'),
          userId: user.id,
          ref: 'DEP-' + Math.floor(100000 + Math.random() * 900000),
          amount: value,
          coins: Math.round(value * RATES.coinToNpr),
          method,
          transactionId: transactionId.trim(),
          screenshot: screenshot?.dataUrl || null,
          screenshotName: screenshot?.name || null,
          status: 'pending',
          createdAt: nowIso(),
        }
        upsertDeposit(deposit)
        setDb((prev) => ({
          ...prev,
          deposits: [deposit, ...prev.deposits],
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true, deposit }
      }

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', user.id)
        .single()
      if (userError) throw userError

      const coinValue = Math.round(Number(amount) * RATES.coinToNpr)
      const { error } = await supabase.from('deposits').insert({
        id: makeId('dep'),
        user_id: user.id,
        amount: Number(amount),
        coins: coinValue,
        method,
        transaction_id: transactionId.trim(),
        screenshot_url: screenshot?.dataUrl || null,
        screenshot_name: screenshot?.name || null,
        status: 'pending',
        created_at: nowIso(),
      })
      if (error) throw error

      return { ok: true, deposit: { id: makeId('dep'), status: 'pending', coins: coinValue, ref: 'DEP-' + Math.floor(100000 + Math.random() * 900000) } }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const requestWithdraw = async ({ amount, method, accountName, accountNumber } = {}) => {
    try {
      const value = Number(amount)
      if (!Number.isInteger(value) || value < 1) return { ok: false, error: 'Enter a whole number of coins.' }
      if (value > user.coins) return { ok: false, error: `You only have ${user.coins} coins available.` }
      if (!accountName.trim()) return { ok: false, error: 'Add the receiver account holder name.' }
      if (accountNumber.replace(/\\D/g, '').length < 9) {
        return { ok: false, error: 'Add a valid destination account number.' }
      }

      const code = String(Math.floor(1000 + Math.random() * 9000))
      const withdrawal = {
        id: makeId('wd'),
        userId: user.id,
        amount: value,
        npr: value * RATES.coinToNpr,
        method,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        code,
        status: 'pending',
        createdAt: nowIso(),
      }

      if (isDevMode()) {
        upsertWithdrawal(withdrawal)
        setDb((prev) => ({
          ...prev,
          withdrawals: [withdrawal, ...prev.withdrawals],
          users: prev.users.map((item) =>
            item.id === user.id ? { ...item, coins: item.coins - value } : item,
          ),
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true, withdrawal }
      }

      const { error } = await supabase.from('withdrawals').insert({
        id: withdrawal.id,
        user_id: user.id,
        amount: value,
        npr: value * RATES.coinToNpr,
        method,
        account_name: withdrawal.accountName,
        account_number: withdrawal.accountNumber,
        code: withdrawal.code,
        status: 'pending',
        created_at: nowIso(),
      })
      if (error) throw error

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: user.coins - value })
        .eq('id', user.id)
      if (updateError) throw updateError

      return { ok: true, withdrawal }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const approveDeposit = async (depositId, { auditNote } = {}) => {
    try {
      if (isDevMode()) {
        const deposit = db.findDeposit(depositId)
        if (!deposit || deposit.status !== 'pending') return { ok: false, error: 'Deposit not found.' }
        const recipient = db.findUser(deposit.userId)
        if (!recipient) return { ok: false, error: 'Recipient not found.' }
        const next = { ...deposit, status: 'approved', reviewedAt: nowIso(), reviewedBy: user.id }
        upsertDeposit(next)
        setDb((prev) => ({
          ...prev,
          deposits: prev.deposits.map((item) => (item.id === depositId ? next : item)),
          users: prev.users.map((item) =>
            item.id === recipient.id ? { ...item, coins: item.coins + deposit.coins } : item,
          ),
          adjustments: [
            {
              id: makeId('adj'),
              userId: recipient.id,
              adminId: user.id,
              delta: deposit.coins,
              note: auditNote ? `Admin approval: ${auditNote}` : 'Admin approval of pending deposit',
              createdAt: nowIso(),
            },
            ...prev.adjustments,
          ],
          notifications: [
            createNotification(recipient.id, {
              title: 'Deposit approved',
              type: 'success',
              message: `${deposit.coins.toLocaleString('en-IN')} coins were added to your wallet · ${deposit.ref}.`,
            }),
            ...prev.notifications,
          ],
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true, coins: deposit.coins, name: recipient.name }
      }

      const { data: depositData, error: findError } = await supabase
        .from('deposits')
        .select('id, user_id, status, amount, coins, ref, user:userId')
        .eq('id', depositId)
        .single()
      if (findError) throw findError

      if (depositData.status !== 'pending') {
        return { ok: false, error: 'This deposit has already been reviewed.' }
      }

      const { error } = await supabase.from('deposits').update({
        status: 'approved',
        reviewed_at: nowIso(),
        reviewed_by: user.id,
      }).eq('id', depositId)
      if (error) throw error

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, name, coins')
        .eq('id', depositData.user_id)
        .single()
      if (userError) throw userError

      const coins = Number(userData.coins || 0) + Number(depositData.coins || 0)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins })
        .eq('id', userData.id)
      if (updateError) throw updateError

      const { error: logError } = await supabase.from('user_activity_logs').insert({
        id: makeId('log'),
        user_id: userData.id,
        action: 'deposit_approved',
        label: 'Deposit approved',
        detail: `Approved ${depositData.ref} (${depositData.amount} NPR)`,
        admin_id: user.id,
        created_at: nowIso(),
      })
      if (logError) console.warn('[Supabase sync] Could not write activity log:', logError)

      return { ok: true, coins: Number(depositData.coins || 0), name: userData.name }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const rejectDeposit = async (depositId, reason) => {
    try {
      if (isDevMode()) {
        const deposit = db.findDeposit(depositId)
        if (!deposit || deposit.status !== 'pending') return { ok: false, error: 'Deposit not found.' }
        const next = { ...deposit, status: 'rejected', rejectionReason: reason.trim() }
        upsertDeposit(next)
        setDb((prev) => ({
          ...prev,
          deposits: prev.deposits.map((item) => (item.id === depositId ? next : item)),
          notifications: [
            createNotification(deposit.userId, {
              title: 'Deposit rejected',
              type: 'error',
              message: `${deposit.ref}: ${reason.trim()}`,
            }),
            ...prev.notifications,
          ],
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true }
      }

      const { data, error } = await supabase
        .from('deposits')
        .select('id, user_id, status, ref, amount')
        .eq('id', depositId)
        .single()
      if (error) throw error
      if (data.status !== 'pending') return { ok: false, error: 'This deposit has already been reviewed.' }

      const { error: updateError } = await supabase
        .from('deposits')
        .update({
          status: 'rejected',
          rejection_reason: reason.trim(),
          reviewed_at: nowIso(),
          reviewed_by: user.id,
        })
        .eq('id', depositId)
      if (updateError) throw updateError

      const { error: logError } = await supabase.from('user_activity_logs').insert({
        id: makeId('log'),
        user_id: data.user_id,
        action: 'deposit_rejected',
        label: 'Deposit rejected',
        detail: `${data.ref} — ${reason.trim()}`,
        admin_id: user.id,
        created_at: nowIso(),
      })
      if (logError) console.warn('[Supabase sync] Could not write activity log:', logError)

      return { ok: true }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const approveWithdrawal = async (withdrawalId, { reference = '', proof = null } = {}) => {
    try {
      if (isDevMode()) {
        const withdrawal = db.findWithdrawal(withdrawalId)
        if (!withdrawal || withdrawal.status !== 'pending') return { ok: false, error: 'Payout not found.' }
        const next = {
          ...withdrawal,
          status: 'approved',
          adminReference: reference.trim() || null,
          paymentProof: proof || null,
          resolvedAt: nowIso(),
          resolvedBy: user.id,
        }
        upsertWithdrawal(next)
        setDb((prev) => ({
          ...prev,
          withdrawals: prev.withdrawals.map((item) => (item.id === withdrawalId ? next : item)),
          notifications: [
            createNotification(withdrawal.userId, {
              title: 'Withdrawal paid',
              type: 'success',
              message: `NPR ${withdrawal.npr.toLocaleString('en-IN')} was sent to your ${withdrawal.method === 'khalti' ? 'Khalti' : 'eSewa'} wallet${reference ? ` · Ref ${reference.trim()}` : ''} · Receipt #${withdrawal.code}.`,
            }),
            ...prev.notifications,
          ],
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true }
      }

      const { data, error } = await supabase
        .from('withdrawals')
        .select('id, user_id, status, npr, method, code')
        .eq('id', withdrawalId)
        .single()
      if (error) throw error
      if (data.status !== 'pending') return { ok: false, error: 'This payout is already resolved.' }

      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'approved',
          admin_reference: reference.trim() || null,
          payment_proof_url: proof || null,
          resolved_at: nowIso(),
          resolved_by: user.id,
        })
        .eq('id', withdrawalId)
      if (updateError) throw updateError

      const { error: logError } = await supabase.from('user_activity_logs').insert({
        id: makeId('log'),
        user_id: data.user_id,
        action: 'withdrawal_approved',
        label: 'Withdrawal paid',
        detail: `Paid ${data.code} — NPR ${data.npr} via ${data.method}${reference ? ` · ref ${reference.trim()}` : ''}`,
        admin_id: user.id,
        created_at: nowIso(),
      })
      if (logError) console.warn('[Supabase sync] Could not write activity log:', logError)

      return { ok: true }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const rejectWithdrawal = async (withdrawalId, reason) => {
    try {
      if (isDevMode()) {
        const withdrawal = db.findWithdrawal(withdrawalId)
        if (!withdrawal || withdrawal.status !== 'pending') return { ok: false, error: 'Payout not found.' }
        const next = {
          ...withdrawal,
          status: 'rejected',
          rejectionReason: reason.trim(),
          refunded: true,
          resolvedAt: nowIso(),
        }
        upsertWithdrawal(next)
        setDb((prev) => ({
          ...prev,
          withdrawals: prev.withdrawals.map((item) => (item.id === withdrawalId ? next : item)),
          users: prev.users.map((item) =>
            item.id === withdrawal.userId ? { ...item, coins: item.coins + withdrawal.amount } : item,
          ),
          notifications: [
            createNotification(withdrawal.userId, {
              title: 'Withdrawal rejected — coins refunded',
              type: 'error',
              message: `${withdrawal.amount.toLocaleString('en-IN')} coins were returned to your wallet. Reason: ${reason.trim()}`,
            }),
            ...prev.notifications,
          ],
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true, refunded: withdrawal.amount }
      }

      const { data, error } = await supabase
        .from('withdrawals')
        .select('id, user_id, status, amount, code')
        .eq('id', withdrawalId)
        .single()
      if (error) throw error
      if (data.status !== 'pending') return { ok: false, error: 'This payout is already resolved.' }

      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          rejection_reason: reason.trim(),
          refunded: true,
          resolved_at: nowIso(),
          resolved_by: user.id,
        })
        .eq('id', withdrawalId)
      if (updateError) throw updateError

      const { error: logError } = await supabase.from('user_activity_logs').insert({
        id: makeId('log'),
        user_id: data.user_id,
        action: 'withdrawal_rejected',
        label: 'Withdrawal rejected & refunded',
        detail: `Refunded ${data.code} — NPR ${data.amount} · ${reason.trim()}`,
        admin_id: user.id,
        created_at: nowIso(),
      })
      if (logError) console.warn('[Supabase sync] Could not write activity log:', logError)

      return { ok: true, refunded: Number(data.amount || 0) }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const setCampaignState = async (campaignId, nextState, reason = '') => {
    try {
      if (isDevMode()) {
        const campaign = db.findCampaign(campaignId)
        if (!campaign) return { ok: false, error: 'Campaign not found.' }
        const next = { ...campaign, status: nextState, pauseReason: nextState === 'paused' ? reason.trim() || 'Paused by admin' : undefined }
        upsertCampaign(next)
        setDb((prev) => ({
          ...prev,
          campaigns: prev.campaigns.map((item) =>
            item.id === campaignId ? next : item,
          ),
          notifications: [
            createNotification(campaign.userId, {
              title: nextState === 'paused' ? 'Campaign paused' : 'Campaign resumed',
              type: nextState === 'paused' ? 'error' : 'success',
              message: nextState === 'paused'
                ? `${campaign.channelName} is paused. ${reason.trim() || 'Contact support for details.'}`
                : `${campaign.channelName} is live on the task wall again.`,
            }),
            ...prev.notifications,
          ],
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true }
      }

      const { data, error } = await supabase
        .from('campaigns')
        .select('id, user_id, channel_name, status')
        .eq('id', campaignId)
        .single()
      if (error) throw error
      if (!['active', 'paused', 'flagged', 'completed', 'cancelled'].includes(data.status)) {
        return { ok: false, error: 'This campaign cannot be changed right now.' }
      }

      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: nextState,
          pause_reason: nextState === 'paused' ? (reason.trim() || 'Paused by admin') : null,
          pause_reason_note: nextState === 'paused' ? reason.trim() : null,
          resumed_at: nextState === 'active' ? nowIso() : null,
        })
        .eq('id', campaignId)
      if (updateError) throw updateError

      const { error: logError } = await supabase.from('user_activity_logs').insert({
        id: makeId('log'),
        user_id: data.user_id,
        action: nextState === 'paused' ? 'campaign_paused' : 'campaign_resumed',
        label: nextState === 'paused' ? 'Campaign paused' : 'Campaign resumed',
        detail: `${data.channel_name} now ${nextState === 'paused' ? 'paused' : 'live'}`,
        admin_id: user.id,
        created_at: nowIso(),
      })
      if (logError) console.warn('[Supabase sync] Could not write activity log:', logError)

      return { ok: true }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const deleteCampaign = async (campaignId) => {
    try {
      if (isDevMode()) {
        const campaign = db.findCampaign(campaignId)
        if (!campaign) return { ok: false, error: 'Campaign not found.' }
        const next = campaigns.filter((item) => item.id !== campaignId)
        setDb((prev) => ({
          ...prev,
          campaigns: next,
          notifications: [
            createNotification(campaign.userId, {
              title: 'Campaign removed',
              type: 'error',
              message: `${campaign.channelName} was removed from the marketplace by moderation.`,
            }),
            ...prev.notifications,
          ],
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true }
      }

      const { data, error } = await supabase
        .from('campaigns')
        .select('id, user_id, channel_name')
        .eq('id', campaignId)
        .single()
      if (error) throw error
      if (!data) return { ok: false, error: 'Campaign not found.' }

      const { error: deleteError } = await supabase.from('campaigns').delete().eq('id', campaignId)
      if (deleteError) throw deleteError

      const { error: logError } = await supabase.from('user_activity_logs').insert({
        id: makeId('log'),
        user_id: data.user_id,
        action: 'campaign_deleted',
        label: 'Campaign deleted',
        detail: `${data.channel_name}`,
        admin_id: user.id,
        created_at: nowIso(),
      })
      if (logError) console.warn('[Supabase sync] Could not write activity log:', logError)

      return { ok: true }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const cancelCampaign = async (campaignId, reason = 'Cancelled by admin') => {
    try {
      if (isDevMode()) {
        const campaign = db.findCampaign(campaignId)
        if (!campaign) return { ok: false, error: 'Campaign not found.' }
        const remaining = Math.max(0, campaign.target - campaign.completed)
        const refund = remaining * RATES.subscriberCost
        const next = {
          ...campaign,
          status: 'cancelled',
          cancelReason: reason.trim(),
          refundedCoins: refund,
          cancelledAt: nowIso(),
        }
        upsertCampaign(next)
        setDb((prev) => ({
          ...prev,
          campaigns: prev.campaigns.map((item) =>
            item.id === campaignId ? next : item,
          ),
          users: prev.users.map((item) =>
            item.id === campaign.userId
              ? { ...item, coins: item.coins + refund }
              : item,
          ),
          notifications: [
            createNotification(campaign.userId, {
              title: 'Campaign cancelled — coins refunded',
              type: 'info',
              message: `${campaign.channelName} was cancelled. ${refund.toLocaleString('en-IN')} coins for ${remaining} unfulfilled slots were returned to your wallet.`,
            }),
            ...prev.notifications,
          ],
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true, refund, remaining }
      }

      const { data, error } = await supabase
        .from('campaigns')
        .select('id, user_id, channel_name, target, completed')
        .eq('id', campaignId)
        .single()
      if (error) throw error

      const remaining = Math.max(0, Number(data.completed || 0) - Number(data.target || 0))
      const refund = remaining * RATES.subscriberCost
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: 'cancelled',
          cancel_reason: reason.trim(),
          refunded_coins: refund,
          cancelled_at: nowIso(),
        })
        .eq('id', campaignId)
      if (updateError) throw updateError

      const { error: logError } = await supabase.from('user_activity_logs').insert({
        id: makeId('log'),
        user_id: data.user_id,
        action: 'campaign_cancelled',
        label: 'Campaign cancelled',
        detail: `${data.channel_name} — ${remaining} unfulfilled slots refunded`,
        admin_id: user.id,
        created_at: nowIso(),
      })
      if (logError) console.warn('[Supabase sync] Could not write activity log:', logError)

      return { ok: true, refund, remaining }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const suspendUser = async (userId) => {
    try {
      if (isDevMode()) {
        const target = db.findUser(userId)
        if (!target) return { ok: false, error: 'User not found.' }
        if (target.isAdmin) return { ok: false, error: 'Admin accounts cannot be suspended here.' }
        const next = { ...target, status: 'suspended' }
        upsertUser({ ...next, status: 'suspended' })
        setDb((prev) => ({
          ...prev,
          users: prev.users.map((item) => (item.id === userId ? next : item)),
          campaigns: prev.campaigns.map((item) =>
            item.userId === userId && item.status === 'active'
              ? { ...item, status: 'paused', pauseReason: 'Owner account suspended' }
              : item,
          ),
          sessions: prev.sessions[userId] ? { ...prev.sessions, [userId]: false } : prev.sessions,
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true, name: target.name }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, is_admin')
        .eq('id', userId)
        .single()
      if (error) throw error
      if (!data) return { ok: false, error: 'User not found.' }
      if (data.is_admin) return { ok: false, error: 'Admin accounts cannot be suspended here.' }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'suspended' })
        .eq('id', userId)
      if (updateError) throw updateError

      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({
          status: 'paused',
          pause_reason: 'Owner account suspended',
        })
        .eq('user_id', userId)
      if (campaignError) throw campaignError

      const { error: logError } = await supabase.from('user_activity_logs').insert({
        id: makeId('log'),
        user_id: data.id,
        action: 'account_suspended',
        label: 'Account suspended',
        detail: `${data.name} was suspended by admin`,
        admin_id: user.id,
        created_at: nowIso(),
      })
      if (logError) console.warn('[Supabase sync] Could not write activity log:', logError)

      return { ok: true, name: data.name }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const activateUser = async (userId) => {
    try {
      if (isDevMode()) {
        const target = db.findUser(userId)
        if (!target) return { ok: false, error: 'User not found.' }
        const next = { ...target, status: 'active' }
        upsertUser({ ...next, status: 'active' })
        setDb((prev) => ({
          ...prev,
          users: prev.users.map((item) => (item.id === userId ? next : item)),
          campaigns: prev.campaigns.map((item) =>
            item.userId === userId && item.status === 'paused'
              ? { ...item, status: 'active', pauseReason: undefined }
              : item,
          ),
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, is_admin')
        .eq('id', userId)
        .single()
      if (error) throw error
      if (!data) return { ok: false, error: 'User not found.' }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId)
      if (updateError) throw updateError

      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({
          status: 'active',
          pause_reason: null,
          pause_reason_note: null,
          resumed_at: nowIso(),
        })
        .eq('user_id', userId)
        .eq('status', 'paused')
      if (campaignError) throw campaignError

      const { error: logError } = await supabase.from('user_activity_logs').insert({
        id: makeId('log'),
        user_id: data.id,
        action: 'account_reactivated',
        label: 'Account reinstated',
        detail: `${data.name} was reinstated by admin`,
        admin_id: user.id,
        created_at: nowIso(),
      })
      if (logError) console.warn('[Supabase sync] Could not write activity log:', logError)

      return { ok: true }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const adjustBalance = async (userId, delta, note) => {
    try {
      if (isDevMode()) {
        const target = db.findUser(userId)
        if (!target) return { ok: false, error: 'User not found.' }
        const amount = Number(delta)
        if (!Number.isInteger(amount) || amount === 0) {
          return { ok: false, error: 'Enter a non-zero whole number of coins.' }
        }
        if (!note?.trim() || note.trim().length < 4) {
          return { ok: false, error: 'An audit note of at least 4 characters is required.' }
        }
        if (target.coins + amount < 0) {
          return { ok: false, error: `Cannot deduct ${Math.abs(amount)} coins — user only has ${target.coins}.` }
        }
        const next = { ...target, coins: target.coins + amount }
        upsertUser({ ...next, coins: target.coins + amount })
        upsertAdjustment({
          id: makeId('adj'),
          userId,
          adminId: user.id,
          delta: amount,
          note: note.trim(),
          createdAt: nowIso(),
        })
        setDb((prev) => ({
          ...prev,
          users: prev.users.map((item) => (item.id === userId ? next : item)),
          adjustments: [
            { id: makeId('adj'), userId, adminId: user.id, delta: amount, note: note.trim(), createdAt: nowIso() },
            ...prev.adjustments,
          ],
          notifications: [
            createNotification(userId, {
              title: amount > 0 ? 'Coins added by support' : 'Coins deducted by support',
              type: amount > 0 ? 'success' : 'error',
              message: `${Math.abs(amount).toLocaleString('en-IN')} coins ${amount > 0 ? 'credited' : 'deducted'} · ${note.trim()}`,
            }),
            ...prev.notifications,
          ],
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true, balance: target.coins + amount }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, coins')
        .eq('id', userId)
        .single()
      if (error) throw error
      if (!data) return { ok: false, error: 'User not found.' }
      const current = Number(data.coins || 0)
      const amount = Number(delta)
      if (!Number.isInteger(amount) || amount === 0) {
        return { ok: false, error: 'Enter a non-zero whole number of coins.' }
      }
      if (current + amount < 0) {
        return { ok: false, error: `Cannot deduct ${Math.abs(amount)} coins — user only has ${current}.` }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: current + amount })
        .eq('id', userId)
      if (updateError) throw updateError

      const { error: logError } = await supabase.from('adjustments').insert({
        id: makeId('adj'),
        user_id: userId,
        admin_id: user.id,
        delta: amount,
        note: note.trim(),
        created_at: nowIso(),
      })
      if (logError) throw logError

      return { ok: true, balance: current + amount }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const resetUserPin = async (userId) => {
    try {
      if (isDevMode()) {
        const target = db.findUser(userId)
        if (!target) return { ok: false, error: 'User not found.' }
        const pin = String(Math.floor(1000 + Math.random() * 9000))
        const next = { ...target, pin, pinSet: true }
        upsertUser({ ...next, pin, pinSet: true })
        setDb((prev) => ({
          ...prev,
          users: prev.users.map((item) => (item.id === userId ? next : item)),
          notifications: [
            createNotification(userId, {
              title: 'Security PIN reset',
              type: 'info',
              message: 'Support reset your 4-digit PIN. Set a new one from Profile after signing in.',
            }),
            ...prev.notifications,
          ],
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true, pin }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()
      if (error) throw error
      if (!data) return { ok: false, error: 'User not found.' }

      const pin = String(Math.floor(1000 + Math.random() * 9000))
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ pin, pin_set: true })
        .eq('id', userId)
      if (updateError) throw updateError

      const { error: logError } = await supabase.from('user_activity_logs').insert({
        id: makeId('log'),
        user_id: data.id,
        action: 'pin_reset',
        label: 'PIN reset',
        detail: 'Support reset the 4-digit PIN from the profile.',
        admin_id: user.id,
        created_at: nowIso(),
      })
      if (logError) console.warn('[Supabase sync] Could not write activity log:', logError)

      return { ok: true, pin }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const resetUserPassword = async (userId) => {
    try {
      if (isDevMode()) {
        const target = db.findUser(userId)
        if (!target) return { ok: false, error: 'User not found.' }
        const password = `SB-${Math.random().toString(36).slice(2, 8)}`
        const next = { ...target, password }
        upsertUser({ ...next, password })
        setDb((prev) => ({
          ...prev,
          users: prev.users.map((item) => (item.id === userId ? next : item)),
          notifications: [
            createNotification(userId, {
              title: 'Password reset by support',
              type: 'info',
              message: 'Use the temporary password shared by support, then change it from Profile.',
            }),
            ...prev.notifications,
          ],
          updatedAt: nowIso(),
        }))
        save()
        return { ok: true, password }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', userId)
        .single()
      if (error) throw error
      if (!data) return { ok: false, error: 'User not found.' }

      const password = `SB-${Math.random().toString(36).slice(2, 8)}`
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ password })
        .eq('id', userId)
      if (updateError) throw updateError

      const { error: logError } = await supabase.from('user_activity_logs').insert({
        id: makeId('log'),
        user_id: data.id,
        action: 'password_reset',
        label: 'Password reset',
        detail: 'Support reset the password from the profile.',
        admin_id: user.id,
        created_at: nowIso(),
      })
      if (logError) console.warn('[Supabase sync] Could not write activity log:', logError)

      return { ok: true, password }
    } catch (err) {
      setError(err)
      return { ok: false, error: err.message }
    }
  }

  const getUserById = (userId) => {
    const record = db.findUser(userId)
    if (!record) return null
    return {
      ...record,
      avatarLetter: record.avatarLetter || (record.name ? record.name.trim().split(/\s+/)[0].slice(0, 1).toUpperCase() : '?'),
      avatarColor: record.avatarColor,
    }
  }

  const markNotificationsRead = async (userId) => {
    try {
      if (isDevMode()) {
        setDb((prev) => ({
          ...prev,
          notifications: prev.notifications.map((item) =>
            item.userId === userId ? { ...item, read: true } : item,
          ),
          updatedAt: nowIso(),
        }))
        save()
        return true
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
      if (error) throw error
      return true
    } catch (err) {
      setError(err)
      return false
    }
  }

  const fetchNotifications = async (userId) => {
    try {
      if (isDevMode()) {
        return db.notifications.filter((item) => item.userId === userId)
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return Array.isArray(data) ? data : []
    } catch (err) {
      setError(err)
      return []
    }
  }

  const markNotificationRead = async (notificationId, userId) => {
    try {
      if (isDevMode()) {
        setDb((prev) => ({
          ...prev,
          notifications: prev.notifications.map((item) =>
            item.id === notificationId ? { ...item, read: true } : item,
          ),
          updatedAt: nowIso(),
        }))
        save()
        return true
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
      if (error) throw error
      return true
    } catch (err) {
      setError(err)
      return false
    }
  }

  const refreshDeposits = async (userId) => {
    try {
      if (isDevMode()) return db.deposits
      const { data, error } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return Array.isArray(data) ? data.map(createDepositFromRecord) : []
    } catch (err) {
      setError(err)
      return db.deposits
    }
  }

  const refreshWithdrawals = async (userId) => {
    try {
      if (isDevMode()) return db.withdrawals
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return Array.isArray(data) ? data.map(createWithdrawalFromRecord) : []
    } catch (err) {
      setError(err)
      return db.withdrawals
    }
  }

  const refreshCampaigns = async () => {
    try {
      if (isDevMode()) return db.campaigns
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return Array.isArray(data) ? data.map(createCampaignFromRecord) : []
    } catch (err) {
      setError(err)
      return db.campaigns
    }
  }

  /** Subscribe to real-time changes for a table so the UI stays fresh after writes. */
  const subscribe = (table, callback) => {
    if (isDevMode() || !supabase) return () => {}
    const channel = supabase
      .channel(`subboost-${table}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table },
        (payload) => {
          const item = payload.new
          if (table === 'profiles') {
            const next = createUserFromRecord(item)
            setDb((prev) => ({
              ...prev,
              users: prev.users.map((u) => (u.id === next.id ? next : u)),
              updatedAt: nowIso(),
            }))
            save()
            callback({ type: 'profile', data: next })
          } else if (table === 'campaigns') {
            const next = createCampaignFromRecord(item)
            setDb((prev) => ({
              ...prev,
              campaigns: prev.campaigns.map((c) => (c.id === next.id ? next : c)),
              updatedAt: nowIso(),
            }))
            save()
            callback({ type: 'campaign', data: next })
          } else if (table === 'task_completions') {
            const next = createTaskCompletionFromRecord(item)
            setDb((prev) => ({
              ...prev,
              taskCompletions: prev.taskCompletions.map((t) => (t.id === next.id ? next : t)),
              updatedAt: nowIso(),
            }))
            save()
            callback({ type: 'completion', data: next })
          } else if (table === 'deposits') {
            const next = createDepositFromRecord(item)
            setDb((prev) => ({
              ...prev,
              deposits: prev.deposits.map((d) => (d.id === next.id ? next : d)),
              updatedAt: nowIso(),
            }))
            save()
            callback({ type: 'deposit', data: next })
          } else if (table === 'withdrawals') {
            const next = createWithdrawalFromRecord(item)
            setDb((prev) => ({
              ...prev,
              withdrawals: prev.withdrawals.map((w) => (w.id === next.id ? next : w)),
              updatedAt: nowIso(),
            }))
            save()
            callback({ type: 'withdrawal', data: next })
          } else if (table === 'adjustments') {
            const next = createAdjustmentFromRecord(item)
            setDb((prev) => ({
              ...prev,
              adjustments: prev.adjustments.map((a) => (a.id === next.id ? next : a)),
              updatedAt: nowIso(),
            }))
            save()
            callback({ type: 'adjustment', data: next })
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log(`[Supabase] subscribed to ${table}`)
      })
    return () => {
      try {
        supabase.removeChannel(channel)
      } catch {
        /* channel already removed */
      }
    }
  }

  const value = {
    isReady,
    loading,
    error,
    db,
    users: db.users,
    campaigns: db.campaigns,
    taskCompletions: db.taskCompletions,
    deposits: db.deposits,
    withdrawals: db.withdrawals,
    adjustments: db.adjustments,
    sessions: db.sessions,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    setPin,
    changePassword,
    updateProfile,
    verifyPin,
    completeTask,
    createCampaign,
    submitDeposit,
    requestWithdraw,
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
    getUserById,
    markNotificationsRead,
    fetchNotifications,
    markNotificationRead,
    refreshDeposits,
    refreshWithdrawals,
    refreshCampaigns,
    subscribe,
    refreshFromSupabase,
  }

  useEffect(() => {
    hydrate()
    const cleanup = subscribe('profiles', () => {})
    return () => {
      try { cleanup() } catch { /* ignore */ }
    }
  }, [])

  return value
}
