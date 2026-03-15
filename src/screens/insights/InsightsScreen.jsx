import React, { useState, useMemo } from 'react'
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

export default function InsightsScreen() {
  const moments = useKairosStore(s => s.moments)
  const addWeeklyAlignment = useKairosStore(s => s.addWeeklyAlignment)
  const weeklyAlignments = useKairosStore(s => s.weeklyAlignments)
  const [alignChoice, setAlignChoice] = useState(null)

  const hasData = moments.length >= 3

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

  // Energy by activity
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
      .map(([activity, { sum, count }]) => ({ activity, avg: Math.round((sum / count) * 10) / 10 }))
      .sort((a, b) => b.avg - a.avg)
  }, [moments])

  const top3 = activityData.slice(0, 3)
  const bottom3 = activityData.slice(-3).reverse()

  const handleAlign = (choice) => {
    setAlignChoice(choice)
    addWeeklyAlignment(choice)
  }

  // Last weekly alignment
  const lastAlignment = weeklyAlignments.length
    ? weeklyAlignments[weeklyAlignments.length - 1]
    : null

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 24px' }}>
      {/* Header */}
      <div style={{ padding: '28px 24px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>Your energy patterns</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Based on your recent check-ins.</p>
      </div>

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
                  <XAxis dataKey="hour" tick={{ fill: 'var(--text-faint)', fontSize: 10, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
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
        <Card>
          {activityData.length === 0 ? (
            <EmptyState message="Log activities to see patterns here." />
          ) : (
            <>
              {[...top3, ...bottom3].map((item, i) => (
                <div key={item.activity} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < top3.length + bottom3.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none',
                  fontSize: 14, color: 'var(--text-secondary)'
                }}>
                  <span style={{ flex: 1, marginRight: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.activity}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 4 }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        width: `${(item.avg / 10) * 100}%`,
                        background: 'linear-gradient(90deg, var(--accent), var(--accent-soft))',
                        opacity: i < 3 ? 1 : 0.4
                      }} />
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 28, textAlign: 'right' }}>{item.avg}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </Card>
        {activityData.length > 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 10, lineHeight: 1.6 }}>
            You consistently report higher energy during certain activities.
          </p>
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
            <p style={{ fontSize: 13, color: 'var(--accent)', marginTop: 12 }}>
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
