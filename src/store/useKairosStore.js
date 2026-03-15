import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useKairosStore = create(
  persist(
    (set, get) => ({
      // ── ONBOARDING ──────────────────────────────────────────
      onboardingComplete: false,
      direction: '',
      keywords: [],
      frequency: 4,
      smartTiming: true,
      quietHoursStart: 22,
      quietHoursEnd: 7,
      notificationsGranted: false,

      setDirection: (direction) => set({ direction }),
      setKeywords: (keywords) => set({ keywords }),
      setFrequency: (frequency) => set({ frequency }),
      setSmartTiming: (smartTiming) => set({ smartTiming }),
      setQuietHours: (start, end) => set({ quietHoursStart: start, quietHoursEnd: end }),
      setNotificationsGranted: (v) => set({ notificationsGranted: v }),
      completeOnboarding: () => set({ onboardingComplete: true }),

      // ── MOMENTS ────────────────────────────────────────────
      moments: [],

      addMoment: (moment) => set(state => ({
        moments: [
          ...state.moments,
          {
            id: Date.now().toString(),
            timestamp: Date.now(),
            ...moment
          }
        ]
      })),

      // ── INSIGHTS ───────────────────────────────────────────
      weeklyAlignments: [],

      addWeeklyAlignment: (value) => set(state => ({
        weeklyAlignments: [
          ...state.weeklyAlignments,
          { timestamp: Date.now(), value }
        ]
      })),

      // ── NAVIGATION ─────────────────────────────────────────
      // 'moment' | 'insights' | 'settings'
      activeTab: 'moment',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Open moment flow directly (e.g. from notification)
      momentFlowOpen: false,
      openMomentFlow: () => set({ momentFlowOpen: true }),
      closeMomentFlow: () => set({ momentFlowOpen: false }),

      // ── UTILS ──────────────────────────────────────────────
      getRecentActivities: () => {
        const { moments } = get()
        const seen = new Set()
        const recent = []
        for (let i = moments.length - 1; i >= 0; i--) {
          const a = moments[i].activity?.trim()
          if (a && !seen.has(a)) {
            seen.add(a)
            recent.push(a)
          }
          if (recent.length >= 5) break
        }
        return recent
      },

      exportData: () => {
        const state = get()
        return JSON.stringify({
          direction: state.direction,
          keywords: state.keywords,
          moments: state.moments,
          weeklyAlignments: state.weeklyAlignments,
          exportedAt: new Date().toISOString()
        }, null, 2)
      },

      resetData: () => set({
        onboardingComplete: false,
        direction: '',
        keywords: [],
        frequency: 4,
        smartTiming: true,
        notificationsGranted: false,
        moments: [],
        weeklyAlignments: [],
        activeTab: 'moment',
        momentFlowOpen: false
      })
    }),
    {
      name: 'kairos-storage',
      version: 1
    }
  )
)

export default useKairosStore
