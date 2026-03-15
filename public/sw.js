// Kairos Service Worker
// Handles push notifications and schedule management

import { precacheAndRoute } from 'workbox-precaching'
precacheAndRoute(self.__WB_MANIFEST)

const CACHE_NAME = 'kairos-v1'

// ── INSTALL & CACHE ──────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim())
})

// ── PUSH NOTIFICATIONS ───────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Kairos moment', {
      body: data.body || 'How energized do you feel right now?',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'kairos-moment',
      renotify: true,
      data: { url: '/?moment=1' }
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const url = event.notification.data?.url || '/?moment=1'
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'OPEN_MOMENT' })
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})

// ── SCHEDULED NOTIFICATIONS (local, no server needed) ────────
// The app posts messages to the SW to schedule today's reminders
self.addEventListener('message', event => {
  const { type, schedule } = event.data || {}

  if (type === 'SCHEDULE_REMINDERS') {
    // Clear any pending alarms, store new schedule
    self.kairosSchedule = schedule || []
    scheduleNext()
  }

  if (type === 'CANCEL_REMINDERS') {
    if (self.kairosTimer) clearTimeout(self.kairosTimer)
    self.kairosSchedule = []
  }
})

function scheduleNext() {
  if (self.kairosTimer) clearTimeout(self.kairosTimer)
  if (!self.kairosSchedule || self.kairosSchedule.length === 0) return

  const now = Date.now()
  const next = self.kairosSchedule.find(t => t > now)
  if (!next) return

  const delay = next - now
  self.kairosTimer = setTimeout(async () => {
    // Check: skip if user logged a moment in the last 60 minutes
    const cache = await caches.open(CACHE_NAME)
    const lastLogResp = await cache.match('/kairos-last-log')
    if (lastLogResp) {
      const { timestamp } = await lastLogResp.json()
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        // Skip this one, schedule the next
        self.kairosSchedule = self.kairosSchedule.filter(t => t !== next)
        scheduleNext()
        return
      }
    }

    self.registration.showNotification('Kairos moment', {
      body: 'How energized do you feel right now?',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'kairos-moment',
      renotify: true,
      data: { url: '/?moment=1' }
    })

    self.kairosSchedule = self.kairosSchedule.filter(t => t !== next)
    scheduleNext()
  }, delay)
}

// Store last log timestamp (called from app after saving a moment)
self.addEventListener('message', event => {
  if (event.data?.type === 'LOG_MOMENT') {
    caches.open(CACHE_NAME).then(cache => {
      cache.put('/kairos-last-log',
        new Response(JSON.stringify({ timestamp: Date.now() })))
    })
  }
})
