import { useMemo, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import useKairosStore from '../../store/useKairosStore'
import { Card, SectionLabel } from '../../components/ui'



function EmptyState({ message }) {
  return (
    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-faint)', fontSize: 14, lineHeight: 1.6 }}>
      {message}
    </div>
  )
}

function getMatchingKeywords(activity, keywords) {
  if (!activity || !keywords?.length) return []
  const actLower = activity.toLowerCase()
  return keywords.filter(k => actLower.includes(k.toLowerCase()))
}

function ActivityRow({ item, isLast, dimmed = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: !isLast ? '1px solid rgba(255,255,255,.06)' : 'none',
      fontSize: 14, color: dimmed ? 'var(--text-faint)' : 'var(--text-secondary)'
    }}>
      <span style={{ flex: 1, marginRight: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.activity}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 4 }}>
          <div style={{
            height: '100%', borderRadius: 4,
            width: `${(item.avg / 10) * 100}%`,
            background: dimmed
              ? 'rgba(139,92,246,.25)'
              : 'linear-gradient(90deg, var(--accent), var(--accent-soft))'
          }} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 28, textAlign: 'right' }}>{item.avg}</span>
      </div>
    </div>
  )
}

function generateDirectionSentence(moments, keywords) {
  if (!moments.length || !keywords.length) return null
  const aligned = moments.filter(m => m.tags?.some(t => keywords.some(k => k.toLowerCase() === t.toLowerCase())))
  const other = moments.filter(m => !m.tags?.some(t => keywords.some(k => k.toLowerCase() === t.toLowerCase())))
  if (aligned.length < 2 || other.length < 2) return null
  const avgWith = aligned.reduce((s, m) => s + m.energy, 0) / aligned.length
  const avgWithout = other.reduce((s, m) => s + m.energy, 0) / other.length
  const diff = Math.round(Math.abs(avgWith - avgWithout) * 10) / 10
  if (diff < 1) return null
  if (avgWith > avgWithout) {
    return `Direction-tagged moments give you ${diff} more energy on average than untagged ones.`
  }
  return null
}

function generateActivitySentence(moments, activityData) {
  if (!moments.length || !activityData.length) return null

  // Top vs bottom activity comparison
  if (activityData.length >= 2) {
    const top = activityData[0]
    const bottom = activityData[activityData.length - 1]
    const diff = Math.round((top.avg - bottom.avg) * 10) / 10
    if (diff >= 2) {
      return `"${top.activity}" gives you ${diff} more energy than "${bottom.activity}".`
    }
  }

  // Time of day pattern
  const byPeriod = { morning: [], afternoon: [], evening: [] }
  moments.forEach(m => {
    const h = new Date(m.timestamp).getHours()
    if (h >= 5 && h < 12) byPeriod.morning.push(m.energy)
    else if (h >= 12 && h < 17) byPeriod.afternoon.push(m.energy)
    else if (h >= 17 && h < 22) byPeriod.evening.push(m.energy)
  })
  const periodAvgs = Object.entries(byPeriod)
    .filter(([, es]) => es.length >= 2)
    .map(([period, es]) => ({ period, avg: es.reduce((a, b) => a + b, 0) / es.length }))
    .sort((a, b) => b.avg - a.avg)
  if (periodAvgs.length >= 2) {
    const names = { morning: 'morning', afternoon: 'afternoon', evening: 'evening' }
    return `You're most energized in the ${names[periodAvgs[0].period]} and least in the ${names[periodAvgs[periodAvgs.length - 1].period]}.`
  }

  return null
}

// ── SNAPSHOT CARD GENERATOR ──────────────────────────────────
const isSameDay = (ts1, ts2) => {
  const d1 = new Date(ts1), d2 = new Date(ts2)
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

function generateSnapshotCard(moments, keywords) {
  if (moments.length < 3) return null

  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000
const recentWithActivity = moments.filter(m => m.timestamp > sevenDaysAgo && m.activity?.trim())
  const candidates = []

  // ── shared stats ──────────────────────────────────────────────
  const actStats = {}
  moments.forEach(m => {
    const a = m.activity?.trim()
    if (!a) return
    if (!actStats[a]) actStats[a] = { sum: 0, count: 0, entries: [] }
    actStats[a].sum += m.energy
    actStats[a].count++
    actStats[a].entries.push(m)
  })
  const ranked = Object.entries(actStats)
    .map(([a, { sum, count, entries }]) => ({ activity: a, avg: sum / count, count, entries }))
    .sort((a, b) => b.avg - a.avg)
  const overallAvg = moments.length
    ? Math.round((moments.reduce((s, m) => s + m.energy, 0) / moments.length) * 10) / 10
    : 5

  // ── 1. Flow moment ────────────────────────────────────────────
  if (recentWithActivity.length >= 1) {
    const peak = recentWithActivity.reduce((a, b) => a.energy > b.energy ? a : b)
    if (peak.energy >= 7) {
      candidates.push({
        type: 'flow',
        headline: 'Flow moment',
        detail: peak.activity.trim(),
        sub: `Energy ${peak.energy}/10 this week. That's a state worth chasing again.`
      })
    }
  }

  // ── 2. Personal record ────────────────────────────────────────
  const allTimeMax = {}
  moments.forEach(m => {
    const a = m.activity?.trim()
    if (!a) return
    if (m.energy > (allTimeMax[a] || 0)) allTimeMax[a] = m.energy
  })
  const recentMax = {}
  recentWithActivity.forEach(m => {
    const a = m.activity.trim()
    if (m.energy >= (recentMax[a] || 0)) recentMax[a] = m.energy
  })
  const record = Object.entries(recentMax)
    .filter(([a, e]) => e >= 8 && e >= allTimeMax[a])
    .sort((a, b) => b[1] - a[1])[0]
  if (record) {
    candidates.push({
      type: 'record',
      headline: 'Personal best',
      detail: record[0],
      sub: `${record[1]}/10 — your highest ever for this. Remember what made it that good.`
    })
  }

  // ── 3. Direction streak ───────────────────────────────────────
  if (keywords.length > 0) {
    const dirMoments = moments.filter(m =>
      m.tags?.some(t => keywords.some(k => k.toLowerCase() === t.toLowerCase()))
    )
    if (dirMoments.length >= 2) {
      const days = [...new Set(dirMoments.map(m => new Date(m.timestamp).toISOString().slice(0, 10)))].sort()
      let streak = 1, maxStreak = 1
      for (let i = 1; i < days.length; i++) {
        const diff = (new Date(days[i]) - new Date(days[i - 1])) / 86400000
        if (diff === 1) { streak++; maxStreak = Math.max(maxStreak, streak) }
        else streak = 1
      }
      if (maxStreak >= 2) {
        candidates.push({
          type: 'streak',
          headline: 'Direction streak',
          detail: `${maxStreak} days living your direction`,
          sub: `Consistency like this is how values become identity.`
        })
      }
    }
  }

  // ── 4. Hidden gem ─────────────────────────────────────────────
  const gem = ranked.find(s => s.count <= 2 && s.avg >= 7)
  if (gem) {
    candidates.push({
      type: 'gem',
      headline: 'Hidden gem',
      detail: gem.activity,
      sub: `High energy but rarely logged. What's holding you back from doing this more?`
    })
  }

  // ── 5. Contrast ───────────────────────────────────────────────
  if (ranked.length >= 2) {
    const top = ranked[0]
    const bottom = ranked[ranked.length - 1]
    const diff = Math.round((top.avg - bottom.avg) * 10) / 10
    if (diff >= 2) {
      candidates.push({
        type: 'contrast',
        headline: 'Energy contrast',
        detail: `"${top.activity}" lifts you. "${bottom.activity}" drains you.`,
        sub: `A ${diff}-point gap. That difference is data — use it.`
      })
    }
  }

  // ── 6. Time-of-day pattern ────────────────────────────────────
  const byPeriod = { morning: [], afternoon: [], evening: [] }
  moments.forEach(m => {
    const h = new Date(m.timestamp).getHours()
    if (h >= 5 && h < 12) byPeriod.morning.push(m.energy)
    else if (h >= 12 && h < 17) byPeriod.afternoon.push(m.energy)
    else if (h >= 17 && h < 22) byPeriod.evening.push(m.energy)
  })
  const periodAvgs = Object.entries(byPeriod)
    .filter(([, es]) => es.length >= 2)
    .map(([period, es]) => ({ period, avg: Math.round((es.reduce((a, b) => a + b, 0) / es.length) * 10) / 10 }))
    .sort((a, b) => b.avg - a.avg)
  if (periodAvgs.length >= 1) {
    const peak = periodAvgs[0]
    candidates.push({
      type: 'pattern',
      headline: 'Your energy window',
      detail: `You come alive in the ${peak.period}`,
      sub: `${peak.avg}/10 average. Guard that time — it's yours.`
    })
  }

  // ── 7. Anchor activity ────────────────────────────────────────
  const anchor = ranked.find(s => s.count >= 4 && s.avg >= 6.5)
  if (anchor) {
    candidates.push({
      type: 'anchor',
      headline: 'Your anchor',
      detail: anchor.activity,
      sub: `${anchor.count} check-ins, averaging ${Math.round(anchor.avg * 10) / 10}/10. This one is a foundation — protect it.`
    })
  }

  // ── 8. Momentum ───────────────────────────────────────────────
  const thisWeek = moments.filter(m => m.timestamp > sevenDaysAgo).length
  const lastWeek = moments.filter(m => m.timestamp > fourteenDaysAgo && m.timestamp <= sevenDaysAgo).length
  if (lastWeek > 0 && thisWeek > lastWeek) {
    candidates.push({
      type: 'momentum',
      headline: 'Building momentum',
      detail: `${thisWeek} check-ins this week vs ${lastWeek} last week`,
      sub: `You're showing up more. That's how change actually happens.`
    })
  }

  // ── 9. Keyword energy vs overall ─────────────────────────────
  if (keywords.length > 0) {
    const kwMoments = moments.filter(m =>
      m.tags?.some(t => keywords.some(k => k.toLowerCase() === t.toLowerCase()))
    )
    if (kwMoments.length >= 3) {
      const kwAvg = Math.round((kwMoments.reduce((s, m) => s + m.energy, 0) / kwMoments.length) * 10) / 10
      const diff = Math.round((kwAvg - overallAvg) * 10) / 10
      const kw = keywords[0]
      if (Math.abs(diff) >= 0.5) {
        const higher = diff > 0
        candidates.push({
          type: 'keyword',
          headline: 'Direction insight',
          detail: higher
            ? `"${kw}" moments run ${diff} points above your average`
            : `"${kw}" moments run ${Math.abs(diff)} points below your average`,
          sub: higher
            ? `Your direction is genuinely energising you. That's not nothing.`
            : `Low energy here isn't failure — it might mean you need a different approach.`
        })
      }
    }
  }

  // ── 10. Direction nudge ───────────────────────────────────────
  if (keywords.length > 0) {
    const lastDirMoment = moments
      .filter(m => m.tags?.some(t => keywords.some(k => k.toLowerCase() === t.toLowerCase())))
      .sort((a, b) => b.timestamp - a.timestamp)[0]
    const daysSince = lastDirMoment
      ? Math.floor((now - lastDirMoment.timestamp) / 86400000)
      : null
    if (daysSince !== null && daysSince >= 3) {
      candidates.push({
        type: 'nudge',
        headline: 'Direction check-in',
        detail: `${daysSince} days since a "${keywords[0]}" moment`,
        sub: `No pressure — but what would a small step look like today?`
      })
    }
  }

  // ── 11. Recovery prompt ───────────────────────────────────────
  const recentAvg = recentWithActivity.length
    ? Math.round((recentWithActivity.reduce((s, m) => s + m.energy, 0) / recentWithActivity.length) * 10) / 10
    : null
  if (recentAvg !== null && recentAvg < overallAvg - 0.8 && ranked[0]) {
    candidates.push({
      type: 'recovery',
      headline: 'Energy check',
      detail: `It's been a lower-energy stretch`,
      sub: `"${ranked[0].activity}" usually brings you up to ${Math.round(ranked[0].avg * 10) / 10}/10. Worth making space for it.`
    })
  }

  // ── 12. Consistency win ───────────────────────────────────────
  const recentActCount = {}
  recentWithActivity.forEach(m => {
    const a = m.activity.trim()
    recentActCount[a] = (recentActCount[a] || 0) + 1
  })
  const consistent = Object.entries(recentActCount).sort((a, b) => b[1] - a[1])[0]
  if (consistent && consistent[1] >= 3) {
    candidates.push({
      type: 'consistent',
      headline: 'Showing up',
      detail: `"${consistent[0]}" — ${consistent[1]} times this week`,
      sub: `Repetition is underrated. You're building something.`
    })
  }

  // ── 13. Energy trend (rising) ─────────────────────────────────
  const trendCandidates = ranked.filter(s => s.count >= 4)
  for (const s of trendCandidates) {
    const sorted = [...s.entries].sort((a, b) => a.timestamp - b.timestamp)
    const half = Math.floor(sorted.length / 2)
    const firstHalf = sorted.slice(0, half)
    const secondHalf = sorted.slice(half)
    const avgFirst = firstHalf.reduce((a, m) => a + m.energy, 0) / firstHalf.length
    const avgSecond = secondHalf.reduce((a, m) => a + m.energy, 0) / secondHalf.length
    if (avgSecond - avgFirst >= 1) {
      candidates.push({
        type: 'trend',
        headline: 'Rising energy',
        detail: `Your energy in "${s.activity}" keeps climbing`,
        sub: `From ${Math.round(avgFirst * 10) / 10} to ${Math.round(avgSecond * 10) / 10}/10. Something is working.`
      })
      break
    }
  }

  // ── 14. Quiet appreciation ────────────────────────────────────
  const appreciated = ranked.find(s => s.count >= 5 && s.avg >= 6)
  if (appreciated) {
    candidates.push({
      type: 'appreciation',
      headline: 'Worth appreciating',
      detail: appreciated.activity,
      sub: `You've logged this ${appreciated.count} times. It keeps showing up because it matters to you.`
    })
  }

  // ── 15. Variety ───────────────────────────────────────────────
  const uniqueActivities = Object.keys(actStats).length
  if (uniqueActivities >= 6) {
    candidates.push({
      type: 'variety',
      headline: 'Rich life',
      detail: `${uniqueActivities} different activities logged`,
      sub: `Variety in what energises you is a strength, not a distraction.`
    })
  }

  // ── Pick by day so it rotates daily ───────────────────────────
  if (candidates.length === 0) return null
  const today = new Date()
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const pick = candidates[daySeed % candidates.length]
  return { ...pick, generatedAt: now }
}

const CARD_STYLES = {
  flow:         { symbol: '⚡', color: '#A78BFA', bg: 'rgba(139,92,246,.12)',  border: 'rgba(139,92,246,.35)' },
  record:       { symbol: '◈',  color: '#FCD34D', bg: 'rgba(251,191,36,.08)',  border: 'rgba(251,191,36,.3)'  },
  streak:       { symbol: '◉',  color: '#FB923C', bg: 'rgba(251,146,60,.08)',  border: 'rgba(251,146,60,.3)'  },
  gem:          { symbol: '◆',  color: '#34D399', bg: 'rgba(52,211,153,.08)',  border: 'rgba(52,211,153,.3)'  },
  contrast:     { symbol: '⬡',  color: '#A78BFA', bg: 'rgba(109,40,217,.1)',   border: 'rgba(167,139,250,.3)' },
  pattern:      { symbol: '◐',  color: '#60A5FA', bg: 'rgba(96,165,250,.08)',  border: 'rgba(96,165,250,.3)'  },
  anchor:       { symbol: '⬤',  color: '#F472B6', bg: 'rgba(244,114,182,.08)', border: 'rgba(244,114,182,.3)' },
  momentum:     { symbol: '▲',  color: '#4ADE80', bg: 'rgba(74,222,128,.08)',  border: 'rgba(74,222,128,.3)'  },
  keyword:      { symbol: '◎',  color: '#FB923C', bg: 'rgba(251,146,60,.08)',  border: 'rgba(251,146,60,.3)'  },
  nudge:        { symbol: '→',  color: '#60A5FA', bg: 'rgba(96,165,250,.08)',  border: 'rgba(96,165,250,.3)'  },
  recovery:     { symbol: '◑',  color: '#C084FC', bg: 'rgba(192,132,252,.08)', border: 'rgba(192,132,252,.3)' },
  consistent:   { symbol: '▣',  color: '#34D399', bg: 'rgba(52,211,153,.08)',  border: 'rgba(52,211,153,.3)'  },
  trend:        { symbol: '↑',  color: '#FCD34D', bg: 'rgba(251,191,36,.08)',  border: 'rgba(251,191,36,.3)'  },
  appreciation: { symbol: '◇',  color: '#F9A8D4', bg: 'rgba(249,168,212,.08)', border: 'rgba(249,168,212,.3)' },
  variety:      { symbol: '⬟',  color: '#A78BFA', bg: 'rgba(139,92,246,.1)',   border: 'rgba(139,92,246,.3)'  },
}

function SnapshotCard({ card }) {
  const cfg = CARD_STYLES[card.type] || CARD_STYLES.pattern
  return (
    <div style={{
      borderRadius: 16,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      padding: '24px 20px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle glow spot */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 100, height: 100, borderRadius: '50%',
        background: cfg.color, opacity: 0.07, pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: `${cfg.color}22`,
          border: `1px solid ${cfg.color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18
        }}>
          {cfg.symbol}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: cfg.color, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            {card.headline}
          </div>
          <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: 6, wordBreak: 'break-word' }}>
            {card.detail}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {card.sub}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function InsightsScreen() {
  const moments = useKairosStore(s => s.moments)
  const keywords = useKairosStore(s => s.keywords)
  const direction = useKairosStore(s => s.direction)
  const setActiveTab = useKairosStore(s => s.setActiveTab)
  const weeklyAlignments = useKairosStore(s => s.weeklyAlignments)
  const snapshotCard = useKairosStore(s => s.snapshotCard)
  const setSnapshotCard = useKairosStore(s => s.setSnapshotCard)

  const hasData = moments.length >= 3

  // Generate/refresh snapshot card every 2 days
  useEffect(() => {
    if (!hasData) return
    const isStale = !snapshotCard || !isSameDay(snapshotCard.generatedAt, Date.now())
    if (isStale) {
      const card = generateSnapshotCard(moments, keywords)
      if (card) setSnapshotCard(card)
    }
  }, [hasData, moments.length])

  const isAligned = (m) => m.tags?.some(t => keywords.some(k => k.toLowerCase() === t.toLowerCase()))

  // Per-keyword breakdown using logged tags
  const directionStats = useMemo(() => {
    if (!hasData || !keywords.length) return null
    const keywordStats = keywords.map(keyword => {
      const matching = moments.filter(m =>
        m.tags?.some(t => t.toLowerCase() === keyword.toLowerCase())
      )
      if (!matching.length) return { keyword, avg: null, count: 0, topActivities: [] }
      const avg = Math.round((matching.reduce((s, m) => s + m.energy, 0) / matching.length) * 10) / 10
      const activityCounts = {}
      matching.forEach(m => {
        const a = m.activity?.trim()
        if (a) activityCounts[a] = (activityCounts[a] || 0) + 1
      })
      const topActivities = Object.entries(activityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([a]) => a)
      return { keyword, avg, count: matching.length, topActivities }
    })
    const anyLogged = keywordStats.some(s => s.count > 0)
    return anyLogged ? { keywordStats } : null
  }, [moments, keywords, hasData])

  // Gap indicator: % of moments that have at least one direction tag
  const gapPct = useMemo(() => {
    if (!hasData || !keywords.length) return null
    const aligned = moments.filter(isAligned)
    return Math.round((aligned.length / moments.length) * 100)
  }, [moments, keywords, hasData])

  // Energy by hour
  const hourData = useMemo(() => {
    if (!hasData) return []
    const byHour = {}
    moments.forEach(m => {
      const h = new Date(m.timestamp).getHours()
      const label = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
      if (!byHour[label]) byHour[label] = { sum: 0, count: 0 }
      byHour[label].sum += m.energy
      byHour[label].count++
    })
    return Object.entries(byHour)
      .map(([hour, { sum, count }]) => ({ hour, avg: Math.round((sum / count) * 10) / 10 }))
      .sort((a, b) => {
        const parse = s => parseInt(s) + (s.includes('pm') && !s.startsWith('12') ? 12 : 0)
        return parse(a.hour) - parse(b.hour)
      })
  }, [moments])

  const peakHour = hourData.length ? hourData.reduce((a, b) => a.avg > b.avg ? a : b) : null
  const lowestHour = hourData.length ? hourData.reduce((a, b) => a.avg < b.avg ? a : b) : null

  // Energy by activity with keyword matching
  const activityData = useMemo(() => {
    if (!hasData) return []
    const byAct = {}
    moments.forEach(m => {
      const a = m.activity?.trim()
      if (!a) return
      if (!byAct[a]) byAct[a] = { sum: 0, count: 0 }
      byAct[a].sum += m.energy
      byAct[a].count++
    })
    return Object.entries(byAct)
      .map(([activity, { sum, count }]) => ({
        activity,
        avg: Math.round((sum / count) * 10) / 10,
        matchedKeywords: getMatchingKeywords(activity, keywords)
      }))
      .sort((a, b) => b.avg - a.avg)
  }, [moments, keywords, hasData])


  const directionSentence = useMemo(() =>
    generateDirectionSentence(moments, keywords),
    [moments, keywords]
  )

  const activitySentence = useMemo(() =>
    generateActivitySentence(moments, activityData),
    [moments, activityData]
  )

  const top5 = activityData.slice(0, 5)
  const bottom5 = activityData.length > 5 ? activityData.slice(-5).reverse() : []


  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 24px' }}>
      {/* Header */}
      <div style={{ padding: '28px 24px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>Your energy patterns</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Based on your recent check-ins.</p>
      </div>

      {/* Your direction */}
      {(direction || keywords.length > 0) && (
        <div style={{ padding: '0 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Your direction</div>
            <button
              onClick={() => setActiveTab('settings')}
              style={{ background: 'none', border: 'none', color: 'var(--text-accent)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-ui)', padding: '4px 0' }}
            >Edit →</button>
          </div>
          <Card>
            {direction && (
              <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--text-secondary)', lineHeight: 1.7, margin: keywords.length > 0 ? '0 0 14px' : 0, fontStyle: 'italic' }}>
                "{direction}"
              </p>
            )}
            {keywords.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {keywords.map(k => (
                  <span key={k} style={{
                    fontSize: 12, padding: '4px 10px', borderRadius: 20,
                    background: 'rgba(109,40,217,.18)',
                    border: '1px solid rgba(167,139,250,.3)',
                    color: 'var(--accent-pale)',
                    fontFamily: 'var(--font-ui)'
                  }}>{k}</span>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Not enough data gate */}
      {!hasData && (
        <div style={{ padding: '0 24px' }}>
          <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>○</div>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Not enough data yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
              Log at least <span style={{ color: 'var(--text-accent)', fontWeight: 500 }}>3 moments</span> to see patterns here.
              You have {moments.length} of 3.
            </p>
          </Card>
        </div>
      )}

      {/* Direction alignment */}
      {hasData && keywords.length > 0 && (
        <div style={{ padding: '0 24px', marginBottom: 28 }}>
          <SectionLabel>Direction alignment</SectionLabel>
          <Card>
            {directionStats ? (
              <div style={{ marginBottom: 16 }}>
                {directionStats.keywordStats.map(({ keyword, avg, count, topActivities }, i) => (
                  <div key={keyword} style={{
                    padding: '10px 0',
                    borderBottom: i < directionStats.keywordStats.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ flex: 1, fontSize: 14, color: avg ? 'var(--text-secondary)' : 'var(--text-faint)' }}>
                        {keyword}
                      </span>
                      {avg ? (
                        <>
                          <div style={{ width: 72, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 4, marginRight: 10 }}>
                            <div style={{
                              height: '100%', borderRadius: 4,
                              width: `${(avg / 10) * 100}%`,
                              background: 'linear-gradient(90deg, var(--accent), var(--accent-soft))'
                            }} />
                          </div>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 28, textAlign: 'right' }}>{avg}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 10, minWidth: 28, textAlign: 'right' }}>{count}×</span>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic' }}>not logged yet</span>
                      )}
                    </div>
                    {topActivities.length > 0 && (
                      <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '5px 0 0', lineHeight: 1.5 }}>
                        {topActivities.join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.6 }}>
                Tag moments with your direction keywords to see alignment here.
              </p>
            )}

            {/* Gap indicator */}
            {gapPct !== null && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>Time invested in direction</span>
                  <span>{gapPct}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 6 }}>
                  <div style={{
                    height: '100%', borderRadius: 6,
                    width: `${gapPct}%`,
                    background: gapPct >= 50
                      ? 'linear-gradient(90deg, var(--accent), var(--accent-soft))'
                      : 'linear-gradient(90deg, rgba(139,92,246,.4), rgba(167,139,250,.4))',
                    transition: 'width 0.6s ease'
                  }} />
                </div>
              </div>
            )}

            {directionSentence && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '14px 0 0', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.06)', lineHeight: 1.6 }}>
                {directionSentence}
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Energy by hour */}
      <div style={{ padding: '0 24px', marginBottom: 28 }}>
        <SectionLabel>Energy throughout the day</SectionLabel>
        <Card>
          {!hasData ? (
            <EmptyState message="More check-ins will reveal clearer patterns." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={hourData} barSize={14} margin={{ top: 4, right: 0, left: -32, bottom: 0 }}>
                  <XAxis dataKey="hour" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} hide />
                  <Bar dataKey="avg" radius={[3, 3, 0, 0]}>
                    {hourData.map((entry, i) => (
                      <Cell key={i} fill={entry.avg >= 7 ? 'var(--accent-soft)' : 'rgba(139,92,246,.35)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {peakHour && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>Peak energy <span style={{ color: 'var(--text-accent)', fontWeight: 500 }}>{peakHour.hour}</span></span>
                  <span>Lowest <span style={{ color: 'var(--text-accent)', fontWeight: 500 }}>{lowestHour.hour}</span></span>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Energy by activity */}
      <div style={{ padding: '0 24px', marginBottom: 28 }}>
        <SectionLabel>Energy by activity</SectionLabel>
        {activityData.length === 0 ? (
          <Card>
            <EmptyState message="Log activities to see patterns here." />
          </Card>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-accent)', marginBottom: 6, paddingLeft: 2 }}>
              Most energizing
            </div>
            <Card style={{ padding: '4px 20px', marginBottom: 12 }}>
              {top5.map((item, i) => (
                <ActivityRow key={item.activity} item={item} isLast={i === top5.length - 1} />
              ))}
            </Card>
            {bottom5.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, paddingLeft: 2 }}>
                  Most draining
                </div>
                <Card style={{ padding: '4px 20px' }}>
                  {bottom5.map((item, i) => (
                    <ActivityRow key={item.activity} item={item} isLast={i === bottom5.length - 1} dimmed />
                  ))}
                </Card>
              </>
            )}
            {activitySentence && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '16px 0 0', lineHeight: 1.6 }}>
                {activitySentence}
              </p>
            )}
          </>
        )}
      </div>

      {/* Weekly alignment history */}
      <div style={{ padding: '0 24px', marginBottom: 28 }}>
        <SectionLabel>Weekly alignment</SectionLabel>
        <Card>
          {weeklyAlignments.length === 0 ? (
            <EmptyState message="Your weekly Sunday reflection will appear here." />
          ) : (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {weeklyAlignments.slice(-12).map((a, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: a.value === 'Yes' ? '#4ADE80' : a.value === 'Partly' ? '#FACC15' : 'rgba(255,255,255,.15)'
                  }} />
                ))}
              </div>
              {weeklyAlignments.slice(-4).reverse().map((a, i, arr) => {
                const weeksAgo = i === 0 ? 'This week' : i === 1 ? 'Last week' : `${i} weeks ago`
                return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none'
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{weeksAgo}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 500,
                      color: a.value === 'Yes' ? '#4ADE80' : a.value === 'Partly' ? '#FACC15' : 'var(--text-faint)'
                    }}>{a.value}</span>
                  </div>
                )
              })}
            </>
          )}
        </Card>
      </div>

      {/* Snapshot card */}
      <div style={{ padding: '0 24px' }}>
        <SectionLabel>Energy snapshot</SectionLabel>
        {!hasData ? (
          <Card style={{ textAlign: 'center' }}>
            <EmptyState message="Log at least 3 moments to unlock your first snapshot." />
          </Card>
        ) : snapshotCard ? (
          <SnapshotCard card={snapshotCard} />
        ) : (
          <Card style={{ textAlign: 'center' }}>
            <EmptyState message="Keep logging — your snapshot is almost ready." />
          </Card>
        )}
      </div>
    </div>
  )
}
