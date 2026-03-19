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
      lastScheduledDate: null,

      setDirection: (direction) => set({ direction }),
      setKeywords: (keywords) => set({ keywords }),
      setFrequency: (frequency) => set({ frequency }),
      setSmartTiming: (smartTiming) => set({ smartTiming }),
      setQuietHours: (start, end) => set({ quietHoursStart: start, quietHoursEnd: end }),
      setNotificationsGranted: (v) => set({ notificationsGranted: v }),
      setLastScheduledDate: (d) => set({ lastScheduledDate: d }),
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
      getRecentTags: () => {
        const { moments } = get()
        const counts = {}
        moments.forEach(m => {
          if (m.tags?.length) {
            m.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1 })
          }
        })
        return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([t]) => t)
      },

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

      getTopBottomActivities: () => {
        const { moments } = get()
        const byAct = {}
        moments.forEach(m => {
          const a = m.activity?.trim()
          if (!a) return
          if (!byAct[a]) byAct[a] = { sum: 0, count: 0 }
          byAct[a].sum += m.energy
          byAct[a].count++
        })
        const ranked = Object.entries(byAct)
          .map(([activity, { sum, count }]) => ({ activity, avg: sum / count }))
          .sort((a, b) => b.avg - a.avg)
        if (ranked.length <= 5) return { top: ranked.map(r => r.activity), bottom: [] }
        const top = ranked.slice(0, 5).map(r => r.activity)
        const bottom = ranked.slice(-5).reverse().map(r => r.activity)
        return { top, bottom }
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
        lastScheduledDate: null,
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
