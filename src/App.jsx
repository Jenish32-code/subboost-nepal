import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ToastStack } from './components/ToastStack'
import { PinModal } from './components/PinModal'
import { AuthScreen } from './screens/AuthScreen'
import { HomeTab } from './screens/HomeTab'
import { PostTab } from './screens/PostTab'
import { SubscribedTab } from './screens/SubscribedTab'
import { HistoryTab } from './screens/HistoryTab'
import { WalletTab } from './screens/WalletTab'
import { ProfileTab } from './screens/ProfileTab'
import { useApp } from './store/appContext'

const AdminLogin = lazy(() => import('./admin/AdminLogin').then((m) => ({ default: m.AdminLogin })))
const AdminShell = lazy(() => import('./admin/AdminShell').then((m) => ({ default: m.AdminShell })))
const AdminDashboard = lazy(() => import('./admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))
const DepositsAdmin = lazy(() => import('./admin/DepositsAdmin').then((m) => ({ default: m.DepositsAdmin })))
const WithdrawalsAdmin = lazy(() =>
  import('./admin/WithdrawalsAdmin').then((m) => ({ default: m.WithdrawalsAdmin })),
)
const CampaignsAdmin = lazy(() =>
  import('./admin/CampaignsAdmin').then((m) => ({ default: m.CampaignsAdmin })),
)
const UsersAdmin = lazy(() => import('./admin/UsersAdmin').then((m) => ({ default: m.UsersAdmin })))

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090D16] text-slate-400">
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em]">Loading admin console</span>
      </div>
    </div>
  )
}

function UserApp() {
  const { user, signOut, setPin, toast } = useApp()
  const [tab, setTab] = useState('home')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [tab])

  const navigate = (next) => {
    if (next === 'withdraw') setTab('withdraw')
    else if (next === 'wallet') setTab('wallet')
    else setTab(next)
  }

  const handleLogout = () => {
    signOut()
    setTab('home')
    toast({ type: 'info', title: 'Signed out', message: 'Your data stays saved on this device.' })
  }

  if (!user) return <AuthScreen />

  const screens = {
    home: <HomeTab onNavigate={navigate} />,
    post: <PostTab onNavigate={navigate} />,
    subscribed: <SubscribedTab onNavigate={navigate} />,
    history: <HistoryTab onNavigate={navigate} />,
    wallet: (
      <WalletTab
        mode="deposit"
        onModeChange={(mode) => setTab(mode === 'withdraw' ? 'withdraw' : 'wallet')}
        onNavigate={navigate}
      />
    ),
    withdraw: (
      <WalletTab
        mode="withdraw"
        onModeChange={(mode) => setTab(mode === 'withdraw' ? 'withdraw' : 'wallet')}
        onNavigate={navigate}
      />
    ),
    profile: <ProfileTab onNavigate={navigate} onLogout={handleLogout} />,
  }

  return (
    <>
      <Layout user={user} activeTab={tab} onNavigate={navigate} onLogout={handleLogout}>
        <div key={tab} className="animate-fade-up">
          {screens[tab] || screens.home}
        </div>
      </Layout>

      {/* First-run / missing PIN gate */}
      <PinModal
        open={!user.pin}
        mode="setup"
        locked
        title="Set your Security PIN"
        onClose={() => {}}
        onSuccess={(pin) => {
          const result = setPin(pin)
          if (!result.ok) return false
          toast({
            type: 'success',
            title: 'PIN created',
            message: 'You are ready to earn, post campaigns and withdraw.',
          })
          return true
        }}
      />
    </>
  )
}

function AdminGate() {
  const { adminUser } = useApp()
  if (adminUser) return <Navigate to="/admin/dashboard" replace />
  return <AdminLogin />
}

function AdminProtected() {
  const { adminUser } = useApp()
  if (!adminUser) return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  const { toasts, dismissToast } = useApp()

  return (
    <>
      <Suspense fallback={<AdminFallback />}>
        <Routes>
          <Route path="/" element={<UserApp />} />
          <Route path="/admin" element={<AdminGate />} />
          <Route element={<AdminProtected />}>
            <Route
              path="/admin/dashboard"
              element={
                <AdminShell>
                  <AdminDashboard />
                </AdminShell>
              }
            />
            <Route
              path="/admin/deposits"
              element={
                <AdminShell>
                  <DepositsAdmin />
                </AdminShell>
              }
            />
            <Route
              path="/admin/withdrawals"
              element={
                <AdminShell>
                  <WithdrawalsAdmin />
                </AdminShell>
              }
            />
            <Route
              path="/admin/campaigns"
              element={
                <AdminShell>
                  <CampaignsAdmin />
                </AdminShell>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminShell>
                  <UsersAdmin />
                </AdminShell>
              }
            />
            <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}
