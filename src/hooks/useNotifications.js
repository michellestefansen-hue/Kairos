import { useCallback } from 'react'
import useKairosStore from '../store/useKairosStore'

// Build a reminder schedule for a given date
function buildSchedule(frequency, smartTiming, quietStart, quietEnd, date = new Date()) {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())

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
      const minuteOfDay = windowStart + Math.random() * (windowEnd - windowStart)
      times.push(minuteOfDay)
    }
  } else {
    // Fixed blocks: morning, midday, afternoon, evening
    const blocks = [
      [wakeMinutes, wakeMinutes + 180],
      [wakeMinutes + 180, wakeMinutes + 360],
      [wakeMinutes + 360, wakeMinutes + 540],
      [sleepMinutes - 240, sleepMinutes - 60],
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
    setNotificationsGranted, notificationsGranted,
    lastScheduledDate, setLastScheduledDate
  } = useKairosStore()

  const requestPermission = useCallback(async () => {
    if (!window.OneSignal) return 'unsupported'
    try {
      await window.OneSignal.Notifications.requestPermission()
      const granted = window.OneSignal.Notifications.permission
      if (granted) setNotificationsGranted(true)
      return granted ? 'granted' : 'denied'
    } catch {
      return 'denied'
    }
  }, [setNotificationsGranted])

  const scheduleToday = useCallback(async () => {
    const today = new Date().toDateString()
    // Reschedule if never done, or if the last batch was scheduled more than 6 days ago
    const daysSinceScheduled = lastScheduledDate
      ? (Date.now() - new Date(lastScheduledDate).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity
    if (daysSinceScheduled < 6) return

    if (!window.OneSignal) return

    const playerId = window.OneSignal.User?.PushSubscription?.id
    if (!playerId) return

    // Build schedule for today + next 6 days
    const schedule = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      schedule.push(...buildSchedule(frequency, smartTiming, quietHoursStart, quietHoursEnd, date))
    }
    if (!schedule.length) return

    try {
      await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, schedule })
      })
      setLastScheduledDate(today)
    } catch (e) {
      console.error('Failed to schedule notifications', e)
    }
  }, [frequency, smartTiming, quietHoursStart, quietHoursEnd, lastScheduledDate, setLastScheduledDate])

  const notifyMomentLogged = useCallback(() => {
    // no-op: OneSignal delivers scheduled notifications server-side
  }, [])

  return { requestPermission, scheduleToday, notifyMomentLogged, notificationsGranted }
}
