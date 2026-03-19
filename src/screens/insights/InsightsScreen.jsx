import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import useKairosStore from '../../store/useKairosStore'
import { Card, SectionLabel } from '../../components/ui'

const ALIGNMENT_SCORES = { Yes: 100, Partly: 60, No: 20 }

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

function generatePatternSentence(moments, keywords, activityData) {
  if (!moments.length || !activityData.length) return null

  // Keyword vs non-keyword energy difference
  if (keywords.length > 0) {
    const withKeyword = moments.filter(m => m.activity && getMatchingKeywords(m.activity, keywords).length > 0)
    const withoutKeyword = moments.filter(m => m.activity && getMatchingKeywords(m.activity, keywords).length === 0)
    if (withKeyword.length >= 2 && withoutKeyword.length >= 2) {
      const avgWith = withKeyword.reduce((s, m) => s + m.energy, 0) / withKeyword.length
      const avgWithout = withoutKeyword.reduce((s, m) => s + m.energy, 0) / withoutKeyword.length
      const diff = Math.round(Math.abs(avgWith - avgWithout) * 10) / 10
      if (diff >= 1) {
        if (avgWith > avgWithout) {
          return `Activities matching your direction give you ${diff} more points of energy on average.`
        } else {
          return `Activities outside your direction give you ${diff} more points of energy — worth reflecting on.`
        }
      }
    }
  }

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

export default function InsightsScreen() {
  const moments = useKairosStore(s => s.moments)
  const keywords = useKairosStore(s => s.keywords)
  const direction = useKairosStore(s => s.direction)
  const setActiveTab = useKairosStore(s => s.setActiveTab)
  const addWeeklyAlignment = useKairosStore(s => s.addWeeklyAlignment)
  const [alignChoice, setAlignChoice] = useState(null)

  const hasData = moments.length >= 3

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


  const patternSentence = useMemo(() =>
    generatePatternSentence(moments, keywords, activityData),
    [moments, keywords, activityData]
  )

  const top5 = activityData.slice(0, 5)
  const bottom5 = activityData.length > 5 ? activityData.slice(-5).reverse() : []

  const handleAlign = (choice) => {
    setAlignChoice(choice)
    addWeeklyAlignment(choice)
  }

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

            {/* Pattern sentence */}
            {patternSentence && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '14px 0 0', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.06)', lineHeight: 1.6 }}>
                {patternSentence}
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
          </>
        )}
      </div>

      {/* Weekly alignment */}
      <div style={{ padding: '0 24px', marginBottom: 28 }}>
        <SectionLabel>Weekly alignment</SectionLabel>
        <Card>
          <p style={{ fontSize: 15, color: '#CBD5E1', marginBottom: 0 }}>
            Did you live in line with your direction this week?
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }} role="group">
            {['Yes', 'Partly', 'No'].map(opt => (
              <button
                key={opt}
                onClick={() => handleAlign(opt)}
                style={{
                  flex: 1, padding: '12px 8px', borderRadius: 14,
                  border: `1.5px solid ${alignChoice === opt ? 'var(--accent-mid)' : 'rgba(167,139,250,.3)'}`,
                  background: alignChoice === opt ? '#5B21B6' : 'rgba(109,40,217,.08)',
                  color: alignChoice === opt ? '#fff' : 'var(--accent-pale)',
                  fontFamily: 'var(--font-ui)', fontSize: 14,
                  cursor: 'pointer', transition: 'all .2s', textAlign: 'center',
                  minHeight: 44, WebkitAppearance: 'none', appearance: 'none'
                }}
              >{opt}</button>
            ))}
          </div>
          {alignChoice && (
            <p style={{ fontSize: 13, color: 'var(--text-accent)', marginTop: 12 }}>
              Alignment score: {ALIGNMENT_SCORES[alignChoice]}
            </p>
          )}
        </Card>
      </div>

      {/* Snapshot cards placeholder */}
      <div style={{ padding: '0 24px' }}>
        <SectionLabel>Create an energy snapshot</SectionLabel>
        <Card style={{ textAlign: 'center' }}>
          {!hasData ? (
            <EmptyState message="Log at least 3 moments to generate your first snapshot." />
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
              Snapshot cards coming soon. Log more moments to unlock.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
