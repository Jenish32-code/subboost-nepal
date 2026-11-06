# SubBoost Nepal

A YouTube channel growth and coin-exchange marketplace for Nepal — built as a responsive React + Tailwind CSS single-page app, with a separate dark-themed admin console for operations.

Subscribers earn **1 coin** for each verified subscription task. Creators spend **4 coins per subscriber** on campaigns. Coins convert to NPR at **1:1** and cash out through Khalti or eSewa.

## Run locally

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # production bundle in dist/
npm run preview  # serve the production build
```

No backend or environment variables are required.

## Demo account

| Field | Value |
| --- | --- |
| Email | `jenish@subboost.np` |
| Password | `demo1234` |
| Security PIN | `1234` |

Use the **Use demo** button on the sign-in card to fill the credentials. You can also click **Continue with Google** for a simulated Google sign-in, or create a brand-new account — new accounts are prompted to set a 4-digit Security PIN before entering the app.

## Admin console

Open **`/admin`** (also linked from the sign-in screen). Admin mode uses its own indigo/slate theme and a separate session, so signing into the console does not replace the customer session in the main app.

| Field | Value |
| --- | --- |
| URL | `/admin` |
| Email | `admin@subboost.np` |
| Password | `admin123` |

| Route | Module |
| --- | --- |
| `/admin/dashboard` | Metrics, pending queues, 7-day revenue, quick actions |
| `/admin/deposits` | Khalti/eSewa proof review with screenshot lightbox, approve or reject with reason |
| `/admin/withdrawals` | Payout settlement with reference/proof, or reject and refund coins |
| `/admin/campaigns` | Pause, restore, cancel & refund remaining slots, or delete campaigns |
| `/admin/users` | Search/filter, ledger, PIN/password resets, audited balance adjustments, suspend/reinstate |

Standard user accounts and signed-out visitors are redirected to `/`. Suspending an account blocks sign-in and hides its active posts from the task wall; reinstating restores both. Admin decisions create in-app notifications for the affected user, visible under **Profile → Notifications**.

## What's included

- **Landing / auth gate** — email & password login and signup, mock Google sign-in, first-run Security PIN setup.
- **Home task wall** — live campaign cards with remaining subscriber counts, a 15-second verification timer that opens the channel on YouTube in a new tab, instant +1 coin credit, skip/remove, and a channel never reappearing once subscribed.
- **Post Campaign** — live balance and lifetime-earned stats, target → cost calculator (`target × 4`), YouTube URL validation with channel detection, PIN-gated publishing, and a scrollable feed of recent campaigns with progress bars.
- **Subscribed** — permanent log of completed subscriptions with dates, coins earned and channel links.
- **Earned History** — ledger with task IDs, channel names, coins, timestamps and verification status.
- **Deposit** — Khalti/eSewa selection, account details with copy buttons, NPR → coins conversion, screenshot upload with preview, transaction ID, and a pending-verification list.
- **Withdraw** — coins → NPR conversion, receiver method, editable destination account, PIN approval, and a dynamic 4-digit receipt code in a screenshot-ready receipt modal.
- **Profile & security** — gradient initial avatar, contact details, masked password, change-password modal, change Security PIN, and forgot-PIN recovery via a simulated email OTP.
- **Notifications** — admin decisions appear in Profile with an unread count on the navigation, plus a mark-all-read action.
- **Admin console** — protected routes, live queue badges, responsive tables that switch to cards on mobile, proof lightbox, audit trails and separated admin sessions.
- **Status states** — Pending, Approved and Rejected badges are used across deposit and withdrawal history.

## Design system

- Deep slate `#0F172A` surfaces with glassy cards and soft brand glows.
- YouTube red `#FF0000` for primary actions, Khalti purple `#5C2D91`, eSewa green `#60BB46`, emerald for success.
- Plus Jakarta Sans + JetBrains Mono, auto-generated gradient avatars, toasts, and responsive navigation (sidebar on desktop, bottom tab bar on mobile).

## Project structure

```
src/
  App.jsx                 router, route guards, tab screens + first-run PIN gate
  main.jsx                BrowserRouter + providers + error boundary
  store/AppProvider.jsx   state, coin economy, auth, admin actions, toasts, persistence
  lib/                    constants, seed data, helpers
  components/             layout, UI primitives, PIN modal, toasts, brand marks
  screens/                Auth, Home, Post, Subscribed, History, Wallet (deposit/withdraw), Profile
  admin/                  admin shell, login gate, dashboard and the four queue modules, shared UI
```

## Data & limitations

This is a front-end prototype. Accounts, passwords, PINs, coin balances, campaigns, deposits, withdrawals and notifications are stored in `localStorage` under `subboost-nepal-v1` and are scoped to the browser. Deposit approval and withdrawal settlement are simulated through the admin console: new transactions stay **Pending** until reviewed there. Clearing site data resets the demo to the seeded admin, creators, queues and ledger entries.
