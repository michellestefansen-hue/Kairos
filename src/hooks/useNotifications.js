import { useCallback } from 'react'
import useKairosStore from '../store/useKairosStore'

// Build today's reminder schedule
function buildSchedule(frequency, smartTiming, quietStart, quietEnd) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Waking hours in minutes from midnight
  const wakeMinutes = quietEnd * 60      // e.g. 07:00 = 420
  const sleepMinutes = quietStart * 60   // e.g. 22:00 = 1320
  const availableMinutes = sleepMinutes - wakeMinutes

  const times = []

  if (smartTiming) {
    // Divide waking hours into equal windows, pick random time in each
    const windowSize = availableMinutes / frequency
    for (let i = 0; i < frequency; i++) {
      const windowStart = wakeMinutes + i * windowSize
      const windowEnd = windowStart + windowSize
      // Random time within window, minimum 90 min gap enforced below
      const minuteOfDay = windowStart + Math.random() * (windowEnd - windowStart)
      times.push(minuteOfDay)
    }
  } else {
    // Fixed blocks: morning, midday, afternoon, evening
    const blocks = [
      [wakeMinutes, wakeMinutes + 180],        // wake → wake+3h
      [wakeMinutes + 180, wakeMinutes + 360],  // +3h → +6h
      [wakeMinutes + 360, wakeMinutes + 540],  // +6h → +9h
      [sleepMinutes - 240, sleepMinutes - 60], // sleep-4h → sleep-1h
    ]
    const selectedBlocks = blocks.slice(0, frequency)
    selectedBlocks.forEach(([start, end]) => {
      times.push(start + Math.random() * (end - start))
    })
  }

  // Enforce minimum 90 min gap
  times.sort((a, b) => a - b)
  const enforced = [times[0]]
  for (let i = 1; i < times.length; i++) {
    if (times[i] - enforced[enforced.length - 1] >= 90) {
      enforced.push(times[i])
    } else {
      enforced.push(enforced[enforced.length - 1] + 90)
    }
  }

  // Convert to absolute timestamps (today)
  return enforced
    .filter(m => m < sleepMinutes)
    .map(m => {
      const h = Math.floor(m / 60)
      const min = Math.floor(m % 60)
      const t = new Date(today)
      t.setHours(h, min, 0, 0)
      return t.getTime()
    })
    .filter(t => t > Date.now()) // only future times
}

export function useNotifications() {
  const {
    frequency, smartTiming, quietHoursStart, quietHoursEnd,
    setNotificationsGranted, notificationsGranted
  } = useKairosStore()

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported'
    const result = await Notification.requestPermission()
    if (result === 'granted') {
      setNotificationsGranted(true)
      scheduleToday()
    }
    return result
  }, [])

  const scheduleToday = useCallback(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready.then(reg => {
      if (!reg.active) return
      const schedule = buildSchedule(frequency, smartTiming, quietHoursStart, quietHoursEnd)
      reg.active.postMessage({ type: 'SCHEDULE_REMINDERS', schedule })
    })
  }, [frequency, smartTiming, quietHoursStart, quietHoursEnd])

  const notifyMomentLogged = useCallback(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready.then(reg => {
      if (reg.active) reg.active.postMessage({ type: 'LOG_MOMENT' })
    })
  }, [])

  return { requestPermission, scheduleToday, notifyMomentLogged, notificationsGranted }
}
