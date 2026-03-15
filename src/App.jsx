import React, { useEffect } from 'react'
import useKairosStore from './store/useKairosStore'
import StarField from './components/StarField'
import { BottomNav } from './components/ui'
import OnboardingFlow from './screens/onboarding/OnboardingFlow'
import MomentFlow from './screens/moment/MomentFlow'
import InsightsScreen from './screens/insights/InsightsScreen'
import SettingsScreen from './screens/settings/SettingsScreen'
import { useNotifications } from './hooks/useNotifications'

// ── MAIN APP (post-onboarding) ───────────────────────────────
function MainApp() {
  const activeTab = useKairosStore(s => s.activeTab)
  const setActiveTab = useKairosStore(s => s.setActiveTab)
  const momentFlowOpen = useKairosStore(s => s.momentFlowOpen)
  const openMomentFlow = useKairosStore(s => s.openMomentFlow)
  const closeMomentFlow = useKairosStore(s => s.closeMomentFlow)
  const { scheduleToday } = useNotifications()

  // Schedule reminders on mount and re-schedule on settings change
  useEffect(() => {
    scheduleToday()
  }, [scheduleToday])

  // Listen for notification click → open moment flow
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'OPEN_MOMENT') openMomentFlow()
    }
    navigator.serviceWorker?.addEventListener('message', handler)
    // Also check URL param (for notification click on cold start)
    if (window.location.search.includes('moment=1')) {
      openMomentFlow()
      window.history.replaceState({}, '', '/')
    }
    return () => navigator.serviceWorker?.removeEventListener('message', handler)
  }, [openMomentFlow])

  // If moment flow is open (from notification), render it fullscreen
  if (momentFlowOpen) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <MomentFlow onClose={closeMomentFlow} />
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tab content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 'moment' && (
          <MomentFlow onClose={() => {}} key="moment" />
        )}
        {activeTab === 'insights' && <InsightsScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </div>

      {/* Bottom nav (hidden on moment flow step > 0, always visible on insights/settings) */}
      {activeTab !== 'moment' && (
        <BottomNav active={activeTab} onSelect={setActiveTab} />
      )}
      {activeTab === 'moment' && (
        <BottomNav active={activeTab} onSelect={setActiveTab} />
      )}
    </div>
  )
}

// ── ROOT ─────────────────────────────────────────────────────
export default function App() {
  const onboardingComplete = useKairosStore(s => s.onboardingComplete)

  // Unregister any stale service workers that might conflict with OneSignal
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => {
          if (!reg.active?.scriptURL.includes('OneSignal')) reg.unregister()
        })
      })
    }
  }, [])

  // Init OneSignal (handles SW registration + push subscription)
  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
        notifyButton: { enable: false },
        allowLocalhostAsSecureOrigin: true
      })
    })
  }, [])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      maxWidth: 430,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <StarField />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {onboardingComplete ? <MainApp /> : <OnboardingFlow />}
      </div>
    </div>
  )
}
