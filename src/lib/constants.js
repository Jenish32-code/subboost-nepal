export const RATES = {
  coinToNpr: 1,
  subscriberCost: 4,
  taskReward: 1,
}

export const PAYMENT_DETAILS = {
  khalti: {
    id: 'khalti',
    label: 'Khalti',
    number: '+977 9840046284',
    name: 'Shadhana Kumari Shahi Shah',
  },
  esewa: {
    id: 'esewa',
    label: 'eSewa',
    number: '+977 9840046284',
    name: 'Shadhana Kumari Shahi Shah',
  },
}

export const PAYMENT_METHODS = [PAYMENT_DETAILS.khalti, PAYMENT_DETAILS.esewa]

export const TABS = {
  home: { id: 'home', label: 'Home', short: 'Home', title: 'Task wall', subtitle: 'Support creators and collect coins' },
  post: { id: 'post', label: 'Post', short: 'Post', title: 'Create a campaign', subtitle: 'Trade coins for real subscribers' },
  subscribed: { id: 'subscribed', label: 'Subscribed', short: 'Subs', title: 'Subscribed channels', subtitle: 'Every channel you have supported' },
  history: { id: 'history', label: 'Earned History', short: 'History', title: 'Earnings ledger', subtitle: 'A verified record of every coin you earned' },
  wallet: { id: 'wallet', label: 'Deposit', short: 'Wallet', title: 'Wallet', subtitle: 'Top up with Khalti or eSewa, or cash out to NPR' },
  withdraw: { id: 'withdraw', label: 'Withdraw', short: 'Wallet', title: 'Wallet', subtitle: 'Top up with Khalti or eSewa, or cash out to NPR' },
  profile: { id: 'profile', label: 'Profile', short: 'Profile', title: 'Your account', subtitle: 'Identity, password and security PIN' },
}

export const GRADIENTS = [
  'from-rose-500 via-red-500 to-orange-400',
  'from-violet-500 via-purple-500 to-fuchsia-500',
  'from-emerald-400 via-teal-500 to-cyan-500',
  'from-amber-400 via-orange-500 to-rose-500',
  'from-sky-400 via-blue-500 to-indigo-600',
  'from-pink-500 via-fuchsia-500 to-violet-600',
  'from-lime-400 via-emerald-500 to-teal-600',
  'from-cyan-400 via-sky-500 to-violet-500',
]
