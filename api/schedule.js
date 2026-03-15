export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { playerId, schedule } = req.body

  if (!playerId || !Array.isArray(schedule) || schedule.length === 0) {
    return res.status(400).json({ error: 'Missing playerId or schedule' })
  }

  const appId = process.env.ONESIGNAL_APP_ID
  const apiKey = process.env.ONESIGNAL_REST_API_KEY

  if (!appId || !apiKey) {
    return res.status(500).json({ error: 'OneSignal not configured' })
  }

  const results = await Promise.allSettled(
    schedule.map(timestamp => {
      const sendAfter = new Date(timestamp).toUTCString()
      return fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${apiKey}`
        },
        body: JSON.stringify({
          app_id: appId,
          include_player_ids: [playerId],
          contents: { en: 'How energized do you feel right now?' },
          headings: { en: 'Kairos moment' },
          send_after: sendAfter,
          chrome_web_icon: '/icon-192.png',
          url: '/?moment=1'
        })
      }).then(r => r.json())
    })
  )

  const scheduled = results.filter(r => r.status === 'fulfilled').length
  res.status(200).json({ scheduled })
}
