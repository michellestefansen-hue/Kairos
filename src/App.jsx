import React, { useEffect, useState } from 'react'
import useKairosStore from './store/useKairosStore'
import StarField from './components/StarField'
import { BottomNav } from './components/ui'
import OnboardingFlow from './screens/onboarding/OnboardingFlow'
import MomentFlow from './screens/moment/MomentFlow'
import InsightsScreen from './screens/insights/InsightsScreen'
import SettingsScreen from './screens/settings/SettingsScreen'
import { useNotifications } from './hooks/useNotifications'

// ── WEEKLY ALIGNMENT MODAL ───────────────────────────────────
function WeeklyAlignmentModal({ onAnswer, onDismiss }) {
  const [choice, setChoice] = useState(null)

  const handleAnswer = (opt) => {
    setChoice(opt)
    setTimeout(() => onAnswer(opt), 600)
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end'
    }}>
      <div style={{
        width: '100%',
        background: 'var(--bg-surface)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border-soft)',
        padding: '32px 24px 40px'
      }}>
        <p style={{ fontSize: 11, color: 'var(--text-accent)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          Weekly reflection
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: 24 }}>
          Did you live in line with your direction this week?
        </h2>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {['Yes', 'Partly', 'No'].map(opt => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              style={{
                flex: 1, padding: '14px 8px', borderRadius: 14,
                border: `1.5px solid ${choice === opt ? 'var(--accent-mid)' : 'rgba(167,139,250,.3)'}`,
                background: choice === opt ? '#5B21B6' : 'rgba(109,40,217,.08)',
                color: choice === opt ? '#fff' : 'var(--accent-pale)',
                fontFamily: 'var(--font-ui)', fontSize: 15,
                cursor: 'pointer', transition: 'all .2s',
                WebkitAppearance: 'none', appearance: 'none'
              }}
            >{opt}</button>
          ))}
        </div>
        <button
          onClick={onDismiss}
          style={{
            width: '100%', background: 'none', border: 'none',
            color: 'var(--text-faint)', fontSize: 14,
            cursor: 'pointer', fontFamily: 'var(--font-ui)', padding: '8px'
          }}
        >Remind me later today</button>
      </div>
    </div>
  )
}

// ── MAIN APP (post-onboarding) ───────────────────────────────
function MainApp() {
  const activeTab = useKairosStore(s => s.activeTab)
  const setActiveTab = useKairosStore(s => s.setActiveTab)
  const momentFlowOpen = useKairosStore(s => s.momentFlowOpen)
  const openMomentFlow = useKairosStore(s => s.openMomentFlow)
  const closeMomentFlow = useKairosStore(s => s.closeMomentFlow)
  const addWeeklyAlignment = useKairosStore(s => s.addWeeklyAlignment)
  const lastWeeklyPromptDate = useKairosStore(s => s.lastWeeklyPromptDate)
  const setLastWeeklyPromptDate = useKairosStore(s => s.setLastWeeklyPromptDate)
  const { scheduleToday } = useNotifications()
  const [showWeeklyPrompt, setShowWeeklyPrompt] = useState(false)

  // Schedule reminders on mount
  useEffect(() => {
    scheduleToday()
  }, [scheduleToday])

  // Show weekly prompt on Sundays, once per day
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const isSunday = new Date().getDay() === 0
    if (isSunday && lastWeeklyPromptDate !== today) {
      setShowWeeklyPrompt(true)
    }
  }, [lastWeeklyPromptDate])

  // Listen for notification click → open moment flow
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'OPEN_MOMENT') openMomentFlow()
    }
    navigator.serviceWorker?.addEventListener('message', handler)
    if (window.location.search.includes('moment=1')) {
      openMomentFlow()
      window.history.replaceState({}, '', '/')
    }
    return () => navigator.serviceWorker?.removeEventListener('message', handler)
  }, [openMomentFlow])

  const handleWeeklyAnswer = (choice) => {
    addWeeklyAlignment(choice)
    setLastWeeklyPromptDate(new Date().toISOString().slice(0, 10))
    setShowWeeklyPrompt(false)
  }

  const dismissWeeklyPrompt = () => {
    setLastWeeklyPromptDate(new Date().toISOString().slice(0, 10))
    setShowWeeklyPrompt(false)
  }

  // If moment flow is open (from notification), render it fullscreen
  if (momentFlowOpen) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <MomentFlow onClose={closeMomentFlow} />
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Tab content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 'moment' && (
          <MomentFlow onClose={() => {}} key="moment" />
        )}
        {activeTab === 'insights' && <InsightsScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </div>

      <BottomNav active={activeTab} onSelect={setActiveTab} />

      {showWeeklyPrompt && (
        <WeeklyAlignmentModal onAnswer={handleWeeklyAnswer} onDismiss={dismissWeeklyPrompt} />
      )}
    </div>
  )
}

// ── ROOT ─────────────────────────────────────────────────────
export default function App() {
  const onboardingComplete = useKairosStore(s => s.onboardingComplete)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => {
          if (!reg.active?.scriptURL.includes('OneSignal')) reg.unregister()
        })
      })
    }
  }, [])

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
