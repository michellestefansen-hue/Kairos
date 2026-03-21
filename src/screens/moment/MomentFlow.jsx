import React, { useState } from 'react'
import useKairosStore from '../../store/useKairosStore'
import { useNotifications } from '../../hooks/useNotifications'
import EnergyRing from '../../components/EnergyRing'
import { Screen, ScreenNav, BtnArea, Btn, KairosLogo, Chip } from '../../components/ui'
import { getPostMomentMessage } from '../../data/messages'

const DEFAULT_TAGS = [
  'Focused', 'Creative', 'Energized', 'Inspired', 'Present', 'Calm', 'In flow', 'Productive',
  'Drained', 'Scattered', 'Tired', 'Stressed', 'Anxious', 'Bored', 'Distracted', 'Overwhelmed',
  'Connected', 'Lonely', 'Disconnected', 'Motivated', 'Confident', 'Grateful', 'Curious', 'Restless', 'Content', 'Playful'
]

// ── SCREEN 1: ACTIVITY ────────────────────────────────────────
function ActivityScreen({ value, onChange, onNext }) {
  const getSortedActivities = useKairosStore(s => s.getSortedActivities)
  const activities = getSortedActivities()

  return (
    <Screen>
      <ScreenNav />
      <div style={{ padding: '8px 24px 20px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 19, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 16 }}>
          What are you doing?
        </h1>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Writing strategy..."
          autoFocus
          style={{
            width: '100%', background: 'transparent',
            border: 'none', borderBottom: '1.5px solid rgba(167,139,250,.4)',
            borderRadius: 0, padding: '12px 0',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)', fontSize: 17, fontWeight: 300,
            outline: 'none', transition: 'border-color .2s'
          }}
          onFocus={e => e.target.style.borderBottomColor = 'var(--accent-soft)'}
          onBlur={e => e.target.style.borderBottomColor = 'rgba(167,139,250,.4)'}
        />
      </div>

      {activities.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '.1em', textTransform: 'uppercase', padding: '0 24px', marginBottom: 10 }}>
            Your activities
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 8px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {activities.map(a => (
                <Chip key={a} label={a} onClick={() => onChange(a)} />
              ))}
            </div>
          </div>
        </>
      )}

      {activities.length === 0 && <div style={{ flex: 1 }} />}
      <BtnArea>
        <Btn onClick={onNext}>Next</Btn>
      </BtnArea>
    </Screen>
  )
}

// ── SCREEN 3: KEYWORDS ───────────────────────────────────────
function KeywordsScreen({ selected, onToggle, onAddCustom, onSave, onBack, saving, saved, message }) {
  const getRecentTags = useKairosStore(s => s.getRecentTags)
  const directionKeywords = useKairosStore(s => s.keywords)
  const recentTags = getRecentTags()
  const [customInput, setCustomInput] = useState('')

  const recentSet = new Set(recentTags.map(t => t.toLowerCase()))
  const directionSet = new Set(directionKeywords.map(t => t.toLowerCase()))
  const allSeen = new Set([...recentSet, ...directionSet])
  const otherSuggestions = [
    ...recentTags.filter(t => !directionSet.has(t.toLowerCase())),
    ...DEFAULT_TAGS.filter(t => !allSeen.has(t.toLowerCase()))
  ]

  const handleAddCustom = () => {
    const tag = customInput.trim()
    if (tag) {
      onAddCustom(tag)
      setCustomInput('')
    }
  }

  const customTags = [...selected].filter(t => !directionKeywords.includes(t) && !otherSuggestions.includes(t))

  return (
    <Screen>
      <style>{`
        @keyframes circleIn {
          0%   { transform: scale(0); opacity: 0; }
          65%  { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes checkDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(109,40,217,0); }
          50%       { box-shadow: 0 0 0 10px rgba(109,40,217,.12); }
        }
      `}</style>
      <ScreenNav onBack={saved ? undefined : onBack} />
      {!saved && (
        <div style={{ padding: '8px 24px 4px', flexShrink: 0 }}>
          <h1 style={{ fontSize: 19, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
            How does it feel?
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Optional — pick all that apply.</p>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 8px' }}>
        {saved ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 32px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(109,40,217,.25)',
              border: '1.5px solid rgba(167,139,250,.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 18,
              animation: 'circleIn .5s cubic-bezier(.34,1.56,.64,1) forwards, glowRing 2s ease-in-out .6s infinite'
            }}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <polyline
                  points="4,10 8,14 16,6"
                  stroke="var(--accent-soft)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="30"
                  strokeDashoffset="30"
                  style={{ animation: 'checkDraw .35s ease forwards .28s' }}
                />
              </svg>
            </div>
            <div style={{
              color: 'var(--text-secondary)', fontSize: 15,
              marginBottom: message ? 20 : 0,
              opacity: 0,
              animation: 'fadeUp .4s ease forwards .4s'
            }}>
              Moment saved.
            </div>
            {message && (
              <p style={{
                fontSize: 14, fontWeight: 300, color: 'var(--text-muted)',
                textAlign: 'center', lineHeight: 1.75, margin: 0,
                opacity: 0,
                animation: 'fadeUp .5s ease forwards .65s'
              }}>
                {message}
              </p>
            )}
          </div>
        ) : (
          <>
            {directionKeywords.length > 0 && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {directionKeywords.map(tag => (
                    <Chip key={tag} label={tag} selected={selected.has(tag)} isYours onClick={() => onToggle(tag)} />
                  ))}
                </div>
                <div style={{ height: 1, background: 'rgba(167,139,250,.12)', marginBottom: 16 }} />
              </>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {otherSuggestions.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  selected={selected.has(tag)}
                  isYours={recentSet.has(tag.toLowerCase())}
                  onClick={() => onToggle(tag)}
                />
              ))}
              {customTags.map(tag => (
                <Chip key={tag} label={tag} selected onClick={() => onToggle(tag)} />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                placeholder="Add your own..."
                style={{
                  flex: 1, background: 'transparent',
                  border: 'none', borderBottom: '1px solid rgba(167,139,250,.3)',
                  padding: '8px 0', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 300,
                  outline: 'none'
                }}
                onFocus={e => e.target.style.borderBottomColor = 'var(--accent-soft)'}
                onBlur={e => e.target.style.borderBottomColor = 'rgba(167,139,250,.3)'}
              />
              {customInput.trim() && (
                <button
                  onClick={handleAddCustom}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--text-accent)', fontSize: 14,
                    cursor: 'pointer', fontFamily: 'var(--font-ui)', padding: '4px'
                  }}
                >Add</button>
              )}
            </div>
          </>
        )}
      </div>

      <BtnArea>
        {saved ? <Btn onClick={onClose}>Done</Btn> : <Btn onClick={onSave}>{saving ? 'Saving...' : 'Save moment'}</Btn>}
      </BtnArea>
    </Screen>
  )
}

// ── SCREEN 1: ENERGY ─────────────────────────────────────────
function EnergyScreen({ value, onChange, onNext }) {
  const now = new Date()
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')

  return (
    <Screen>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '28px 16px 8px', flexShrink: 0, gap: 6
      }}>
        <KairosLogo size={20} />
        <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>{timeStr}</span>
      </div>

      <div style={{ padding: '12px 24px 4px', flexShrink: 0, textAlign: 'center' }}>
        <h1 style={{ fontSize: 19, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          How energized do you feel right now?
        </h1>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <EnergyRing value={value} onChange={onChange} size={270} />
      </div>

      <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6, padding: '0 32px 16px' }}>
        Some activities feel energizing in the moment, but draining afterwards. Kairos captures both by measuring how you feel throughout the day.
      </p>

      <BtnArea>
        <Btn onClick={onNext}>Next</Btn>
      </BtnArea>
    </Screen>
  )
}

// ── MAIN MOMENT FLOW ──────────────────────────────────────────
export default function MomentFlow({ onClose }) {
  const [step, setStep] = useState(0)
  const [activity, setActivity] = useState('')
  const [tags, setTags] = useState(new Set())
  const [energy, setEnergy] = useState(5)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [message, setMessage] = useState(null)

  const addMoment = useKairosStore(s => s.addMoment)
  const { notifyMomentLogged } = useNotifications()

  const toggleTag = (tag) => {
    setTags(prev => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  const addCustomTag = (tag) => {
    setTags(prev => new Set([...prev, tag]))
  }

  const handleSave = async () => {
    setSaving(true)
    addMoment({ energy, activity: activity.trim(), tags: [...tags] })
    notifyMomentLogged()
    setMessage(getPostMomentMessage(energy, [...tags]))
    setSaving(false)
    setSaved(true)
  }

  if (step === 0) return <EnergyScreen value={energy} onChange={setEnergy} onNext={() => setStep(1)} />
  if (step === 1) return <ActivityScreen value={activity} onChange={setActivity} onNext={() => setStep(2)} onBack={() => setStep(0)} />
  if (step === 2) return <KeywordsScreen selected={tags} onToggle={toggleTag} onAddCustom={addCustomTag} onSave={handleSave} onBack={() => setStep(1)} saving={saving} saved={saved} message={message} />
  return null
}
