const now = Date.now()
const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString()
const daysAgo = (d) => new Date(now - d * 24 * 3600 * 1000).toISOString()

/** Lightweight SVG stand-in for an uploaded payment receipt. */
const paymentProof = ({ method, amount, txn, date }) => {
  const khalti = method === 'khalti'
  const brand = khalti ? '#5C2D91' : '#60BB46'
  const label = khalti ? 'Khalti' : 'eSewa'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="680" viewBox="0 0 520 680">
  <rect width="520" height="680" fill="#0d1424"/>
  <rect x="24" y="24" width="472" height="632" rx="22" fill="#111c31" stroke="#26324a"/>
  <circle cx="72" cy="82" r="22" fill="${brand}"/>
  <text x="72" y="90" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#fff" text-anchor="middle">${khalti ? 'K' : 'e'}</text>
  <text x="108" y="78" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">${label} wallet</text>
  <text x="108" y="98" font-family="Arial, sans-serif" font-size="12" fill="#8fa0bd">Payment successful</text>
  <circle cx="260" cy="180" r="34" fill="${brand}" opacity="0.18"/>
  <path d="M246 180 l10 10 20 -22" stroke="${brand}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="260" y="252" font-family="Arial, sans-serif" font-size="13" fill="#8fa0bd" text-anchor="middle">Amount paid</text>
  <text x="260" y="292" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff" text-anchor="middle">NPR ${Number(amount).toLocaleString('en-IN')}</text>
  <line x1="56" y1="330" x2="464" y2="330" stroke="#26324a"/>
  <text x="56" y="372" font-family="Arial, sans-serif" font-size="12" fill="#8fa0bd">Transaction ID</text>
  <text x="464" y="372" font-family="Arial, sans-serif" font-size="13" fill="#e7ecf6" text-anchor="end">${txn}</text>
  <text x="56" y="414" font-family="Arial, sans-serif" font-size="12" fill="#8fa0bd">Date</text>
  <text x="464" y="414" font-family="Arial, sans-serif" font-size="13" fill="#e7ecf6" text-anchor="end">${date}</text>
  <text x="56" y="456" font-family="Arial, sans-serif" font-size="12" fill="#8fa0bd">Receiver</text>
  <text x="464" y="456" font-family="Arial, sans-serif" font-size="13" fill="#e7ecf6" text-anchor="end">Shadhana Kumari Shahi Shah</text>
  <text x="56" y="498" font-family="Arial, sans-serif" font-size="12" fill="#8fa0bd">Receiver number</text>
  <text x="464" y="498" font-family="Arial, sans-serif" font-size="13" fill="#e7ecf6" text-anchor="end">+977 9840046284</text>
  <rect x="56" y="540" width="408" height="64" rx="12" fill="${brand}" opacity="0.12"/>
  <text x="260" y="578" font-family="Arial, sans-serif" font-size="12" fill="${khalti ? '#c4b5fd' : '#bbf7d0'}" text-anchor="middle">SubBoost Nepal · coin top-up</text>
  <text x="260" y="620" font-family="Arial, sans-serif" font-size="10" fill="#5c6b85" text-anchor="middle">Demo receipt generated for the SubBoost admin prototype</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

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
    role: 'admin',
    status: 'active',
    createdAt: daysAgo(365),
  },
]

export const seedAdmin = admins[0]

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
    role: 'user',
    status: 'active',
    createdAt: daysAgo(64),
  },
]

const others = [
  { id: 'u_sujan', name: 'Sujan Rai', email: 'sujan@example.com', phone: '+977 9801112233', password: 'demo1234', pin: '1111', coins: 96, lifetimeEarned: 180, role: 'user', status: 'active', createdAt: daysAgo(120) },
  { id: 'u_techbits', name: 'Nepal Tech Bits', email: 'techbits@example.com', phone: '+977 9812223344', password: 'demo1234', pin: '2222', coins: 140, lifetimeEarned: 320, role: 'user', status: 'active', createdAt: daysAgo(96) },
  { id: 'u_himalaya', name: 'Himalayan Vlogs', email: 'himalaya@example.com', phone: '+977 9845556677', password: 'demo1234', pin: '3333', coins: 72, lifetimeEarned: 150, role: 'user', status: 'active', createdAt: daysAgo(52) },
  { id: 'u_sneha', name: 'Sneha Gurung', email: 'sneha@example.com', phone: '+977 9867778899', password: 'demo1234', pin: '4444', coins: 210, lifetimeEarned: 640, role: 'user', status: 'active', createdAt: daysAgo(210) },
  { id: 'u_bibek', name: 'Bibek Shrestha', email: 'bibek@example.com', phone: '+977 9808889900', password: 'demo1234', pin: '5555', coins: 40, lifetimeEarned: 90, role: 'user', status: 'active', createdAt: daysAgo(31) },
  { id: 'u_kitchen', name: 'Kathmandu Kitchen', email: 'kitchen@example.com', phone: '+977 9819990011', password: 'demo1234', pin: '6666', coins: 165, lifetimeEarned: 280, role: 'user', status: 'active', createdAt: daysAgo(140) },
  { id: 'u_aayush', name: 'Aayush Thapa', email: 'aayush@example.com', phone: '+977 9801122334', password: 'demo1234', pin: '7777', coins: 88, lifetimeEarned: 140, role: 'user', status: 'active', createdAt: daysAgo(48) },
  { id: 'u_poonam', name: 'Poonam K.C.', email: 'poonam@example.com', phone: '+977 9846677889', password: 'demo1234', pin: '8888', coins: 56, lifetimeEarned: 110, role: 'user', status: 'active', createdAt: daysAgo(72) },
  { id: 'u_spam', name: 'Rapid Growth NP', email: 'rapidgrowth@example.com', phone: '+977 9800011122', password: 'demo1234', pin: '1212', coins: 0, lifetimeEarned: 0, role: 'user', status: 'suspended', createdAt: daysAgo(17) },
]

const campaigns = [
  {
    id: 'c_jenish_50',
    userId: 'u_jenish',
    channelName: 'Jenish Shah',
    channelUrl: 'https://www.youtube.com/@JenishShah',
    target: 50,
    completed: 38,
    createdAt: hoursAgo(5),
    status: 'active',
  },
  {
    id: 'c_techbits_30',
    userId: 'u_techbits',
    channelName: 'Nepal Tech Bits',
    channelUrl: 'https://www.youtube.com/@NepalTechBits',
    target: 30,
    completed: 11,
    createdAt: hoursAgo(21),
    status: 'active',
  },
  {
    id: 'c_himalaya_25',
    userId: 'u_himalaya',
    channelName: 'Himalayan Vlogs',
    channelUrl: 'https://www.youtube.com/@HimalayanVlogs',
    target: 25,
    completed: 22,
    createdAt: daysAgo(1),
    status: 'active',
  },
  {
    id: 'c_sneha_100',
    userId: 'u_sneha',
    channelName: 'Sneha Gurung',
    channelUrl: 'https://www.youtube.com/@SnehaGurungMusic',
    target: 100,
    completed: 47,
    createdAt: daysAgo(2),
    status: 'active',
  },
  {
    id: 'c_bibek_20',
    userId: 'u_bibek',
    channelName: 'Bibek Shrestha',
    channelUrl: 'https://www.youtube.com/@BibekShrestha',
    target: 20,
    completed: 3,
    createdAt: daysAgo(2),
    status: 'active',
  },
  {
    id: 'c_kitchen_40',
    userId: 'u_kitchen',
    channelName: 'Kathmandu Kitchen',
    channelUrl: 'https://www.youtube.com/@KathmanduKitchen',
    target: 40,
    completed: 33,
    createdAt: daysAgo(4),
    status: 'active',
  },
  {
    id: 'c_sujan_60',
    userId: 'u_sujan',
    channelName: 'Sujan Rai',
    channelUrl: 'https://www.youtube.com/@SujanRaiOfficial',
    target: 60,
    completed: 24,
    createdAt: hoursAgo(9),
    status: 'active',
  },
  {
    id: 'c_aayush_35',
    userId: 'u_aayush',
    channelName: 'Aayush Thapa',
    channelUrl: 'https://www.youtube.com/@AayushThapa',
    target: 35,
    completed: 30,
    createdAt: hoursAgo(16),
    status: 'active',
  },
  {
    id: 'c_poonam_15',
    userId: 'u_poonam',
    channelName: 'Poonam K.C.',
    channelUrl: 'https://www.youtube.com/@PoonamKC',
    target: 15,
    completed: 12,
    createdAt: daysAgo(3),
    status: 'active',
  },
  {
    id: 'c_techbits_done',
    userId: 'u_techbits',
    channelName: 'Nepal Tech Bits',
    channelUrl: 'https://www.youtube.com/@NepalTechBits',
    target: 20,
    completed: 20,
    createdAt: daysAgo(12),
    status: 'completed',
  },
  {
    id: 'c_kitchen_paused',
    userId: 'u_kitchen',
    channelName: 'Kathmandu Kitchen Shorts',
    channelUrl: 'https://www.youtube.com/@KathmanduKitchenShorts',
    target: 90,
    completed: 20,
    createdAt: daysAgo(7),
    status: 'paused',
    pauseReason: 'Awaiting channel ownership verification',
  },
  {
    id: 'c_bibek_flagged',
    userId: 'u_bibek',
    channelName: 'Bibek Daily',
    channelUrl: 'https://www.youtube.com/@BibekDaily',
    target: 200,
    completed: 4,
    createdAt: daysAgo(5),
    status: 'flagged',
    flagReason: 'Subscriber spike reported by two users',
  },
]

const subscriptions = ['c_himalaya_25', 'c_kitchen_40', 'c_sneha_100'].map((campaignId, index) => {
  const campaign = campaigns.find((item) => item.id === campaignId)
  return {
    id: taskCodeFor(index),
    userId: 'u_jenish',
    campaignId,
    channelName: campaign.channelName,
    channelUrl: campaign.channelUrl,
    coins: 1,
    status: 'verified',
    createdAt: daysAgo(index + 3),
  }
})

function taskCodeFor(index) {
  return ['SB-K7M2P', 'SB-Q4TY9', 'SB-X8W3R'][index]
}

const deposits = [
  {
    id: 'dep_seed_1',
    ref: 'DEP-882104',
    userId: 'u_jenish',
    amount: 500,
    coins: 500,
    method: 'khalti',
    transactionId: 'KHX9912AB',
    screenshot: null,
    screenshotName: null,
    status: 'approved',
    createdAt: daysAgo(18),
    reviewedAt: daysAgo(18),
    reviewedBy: 'u_admin',
  },
  {
    id: 'dep_seed_2',
    ref: 'DEP-773510',
    userId: 'u_jenish',
    amount: 100,
    coins: 100,
    method: 'esewa',
    transactionId: 'ESW-00021',
    screenshot: null,
    screenshotName: null,
    status: 'rejected',
    rejectionReason: 'Payment not received',
    createdAt: daysAgo(9),
    reviewedAt: daysAgo(9),
    reviewedBy: 'u_admin',
  },
  {
    id: 'dep_seed_3',
    ref: 'DEP-481207',
    userId: 'u_sujan',
    amount: 500,
    coins: 500,
    method: 'khalti',
    transactionId: 'KHX884291',
    screenshot: paymentProof({ method: 'khalti', amount: 500, txn: 'KHX884291', date: daysAgo(0.2).slice(0, 10) }),
    screenshotName: 'khalti-500.png',
    status: 'pending',
    createdAt: hoursAgo(3),
  },
  {
    id: 'dep_seed_4',
    ref: 'DEP-592611',
    userId: 'u_sneha',
    amount: 1200,
    coins: 1200,
    method: 'esewa',
    transactionId: 'ESW-993214',
    screenshot: paymentProof({ method: 'esewa', amount: 1200, txn: 'ESW-993214', date: daysAgo(0.4).slice(0, 10) }),
    screenshotName: 'esewa-1200.png',
    status: 'pending',
    createdAt: hoursAgo(6),
  },
  {
    id: 'dep_seed_5',
    ref: 'DEP-338194',
    userId: 'u_bibek',
    amount: 300,
    coins: 300,
    method: 'khalti',
    transactionId: 'KHX771203',
    screenshot: paymentProof({ method: 'khalti', amount: 300, txn: 'KHX771203', date: daysAgo(1).slice(0, 10) }),
    screenshotName: 'khalti-300.png',
    status: 'pending',
    createdAt: daysAgo(1),
  },
  {
    id: 'dep_seed_6',
    ref: 'DEP-661820',
    userId: 'u_poonam',
    amount: 800,
    coins: 800,
    method: 'esewa',
    transactionId: 'ESW-771290',
    screenshot: paymentProof({ method: 'esewa', amount: 800, txn: 'ESW-771290', date: daysAgo(1).slice(0, 10) }),
    screenshotName: 'esewa-800.png',
    status: 'pending',
    createdAt: daysAgo(1.4),
  },
  {
    id: 'dep_seed_7',
    ref: 'DEP-112093',
    userId: 'u_aayush',
    amount: 700,
    coins: 700,
    method: 'khalti',
    transactionId: 'KHX559901',
    screenshot: paymentProof({ method: 'khalti', amount: 700, txn: 'KHX559901', date: daysAgo(11).slice(0, 10) }),
    screenshotName: 'khalti-700.png',
    status: 'approved',
    createdAt: daysAgo(11),
    reviewedAt: daysAgo(11),
    reviewedBy: 'u_admin',
  },
]

const withdrawals = [
  {
    id: 'wd_seed_1',
    code: '7412',
    userId: 'u_jenish',
    amount: 400,
    npr: 400,
    method: 'khalti',
    accountName: 'Shadhana Kumari Shahi Shah',
    accountNumber: '+977 9840046284',
    status: 'approved',
    createdAt: daysAgo(6),
    resolvedAt: daysAgo(6),
    adminReference: 'KHL-PAY-994120',
  },
  {
    id: 'wd_seed_2',
    code: '5214',
    userId: 'u_sujan',
    amount: 250,
    npr: 250,
    method: 'khalti',
    accountName: 'Sujan Rai',
    accountNumber: '+977 9801112233',
    status: 'pending',
    createdAt: hoursAgo(4),
  },
  {
    id: 'wd_seed_3',
    code: '9081',
    userId: 'u_bibek',
    amount: 100,
    npr: 100,
    method: 'esewa',
    accountName: 'Bibek Shrestha',
    accountNumber: '+977 9808889900',
    status: 'pending',
    createdAt: daysAgo(1),
  },
  {
    id: 'wd_seed_4',
    code: '3345',
    userId: 'u_aayush',
    amount: 60,
    npr: 60,
    method: 'khalti',
    accountName: 'Aayush Thapa',
    accountNumber: '+977 9801122334',
    status: 'pending',
    createdAt: daysAgo(1.5),
  },
  {
    id: 'wd_seed_5',
    code: '1177',
    userId: 'u_himalaya',
    amount: 150,
    npr: 150,
    method: 'esewa',
    accountName: 'Himalayan Vlogs',
    accountNumber: '+977 9845556677',
    status: 'rejected',
    rejectionReason: 'Account number does not match the wallet name',
    refunded: true,
    createdAt: daysAgo(8),
    resolvedAt: daysAgo(7),
  },
]

const notifications = [
  {
    id: 'note_seed_1',
    userId: 'u_jenish',
    type: 'success',
    title: 'Deposit approved',
    message: '500 coins were added to your wallet. Ref DEP-882104.',
    read: false,
    createdAt: daysAgo(18),
  },
  {
    id: 'note_seed_2',
    userId: 'u_jenish',
    type: 'success',
    title: 'Withdrawal paid',
    message: 'NPR 400 was sent to your Khalti wallet. Receipt #7412.',
    read: true,
    createdAt: daysAgo(6),
  },
  {
    id: 'note_seed_3',
    userId: 'u_jenish',
    type: 'info',
    title: 'Welcome to SubBoost Nepal',
    message: 'Subscribe to your first channel to earn your first coin.',
    read: true,
    createdAt: daysAgo(64),
  },
  {
    id: 'note_seed_4',
    userId: 'u_sujan',
    type: 'success',
    title: 'Withdrawal paid',
    message: 'NPR 400 was sent to your Khalti wallet.',
    read: true,
    createdAt: daysAgo(20),
  },
]

export function createSeedDb() {
  return {
    version: 2,
    users: [...admins, ...creators, ...others],
    sessionUserId: null,
    adminSessionUserId: null,
    campaigns,
    subscriptions,
    skipped: [],
    deposits,
    withdrawals,
    notifications,
    adjustments: [],
  }
}
