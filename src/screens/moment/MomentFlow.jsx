import React, { useState } from 'react'
import useKairosStore from '../../store/useKairosStore'
import { useNotifications } from '../../hooks/useNotifications'
import EnergyRing from '../../components/EnergyRing'
import { Screen, ScreenNav, BtnArea, Btn, KairosLogo, Chip } from '../../components/ui'

// ── SCREEN 1: ENERGY ─────────────────────────────────────────
function EnergyScreen({ value, onChange, onNext }) {
  const now = new Date()
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')

  return (
    <Screen>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 16px 4px', flexShrink: 0
      }}>
        <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>{timeStr}</span>
        <KairosLogo size={20} />
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '12px 24px 4px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 19, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          How energized do you feel right now?
        </h1>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <EnergyRing value={value} onChange={onChange} size={270} />
      </div>

      <BtnArea>
        <Btn onClick={onNext}>Next</Btn>
      </BtnArea>
    </Screen>
  )
}

// ── SCREEN 2: ACTIVITY ───────────────────────────────────────
function ActivityScreen({ value, onChange, onNext, onBack }) {
  const getRecentActivities = useKairosStore(s => s.getRecentActivities)
  const recents = getRecentActivities()

  return (
    <Screen>
      <ScreenNav onBack={onBack} />
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

      {recents.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '.1em', textTransform: 'uppercase', padding: '0 24px', marginBottom: 10 }}>
            Recent
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 24px' }}>
            {recents.map(r => (
              <Chip key={r} label={r} onClick={() => onChange(r)} />
            ))}
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />
      <BtnArea>
        <Btn onClick={onNext}>Next</Btn>
      </BtnArea>
    </Screen>
  )
}

// ── SCREEN 3: CONTEXT ────────────────────────────────────────
function ContextScreen({ value, onChange, onSave, onBack, saving, saved }) {
  return (
    <Screen>
      <ScreenNav onBack={onBack} />
      <div style={{ padding: '8px 24px 20px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 19, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 16 }}>
          Add context{' '}
          <span style={{ color: 'var(--text-muted)', fontWeight: 300 }}>(optional)</span>
        </h1>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Anything affecting your energy?"
          rows={5}
          style={{
            width: '100%', background: 'rgba(255,255,255,.06)',
            border: '1.5px solid rgba(167,139,250,.35)', borderRadius: 16,
            padding: 16, color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 300,
            outline: 'none', lineHeight: 1.6, resize: 'none',
            height: 120, transition: 'border-color .2s, background .2s'
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent-soft)'; e.target.style.background = 'rgba(255,255,255,.09)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(167,139,250,.35)'; e.target.style.background = 'rgba(255,255,255,.06)' }}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {saved && (
          <div style={{ textAlign: 'center', animation: 'screenIn .3s ease' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(109,40,217,.2)',
              border: '1.5px solid rgba(167,139,250,.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <polyline points="4,10 8,14 16,6" stroke="var(--accent-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Moment saved.</div>
          </div>
        )}
      </div>

      <BtnArea>
        {!saved && <Btn onClick={onSave}>{saving ? 'Saving...' : 'Save moment'}</Btn>}
      </BtnArea>
    </Screen>
  )
}

// ── MAIN MOMENT FLOW ─────────────────────────────────────────
export default function MomentFlow({ onClose }) {
  const [step, setStep] = useState(0)
  const [energy, setEnergy] = useState(5)
  const [activity, setActivity] = useState('')
  const [context, setContext] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const addMoment = useKairosStore(s => s.addMoment)
  const { notifyMomentLogged } = useNotifications()

  const handleSave = async () => {
    setSaving(true)
    addMoment({ energy, activity: activity.trim(), context: context.trim() })
    notifyMomentLogged()
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      onClose()
    }, 1400)
  }

  if (step === 0) return <EnergyScreen value={energy} onChange={setEnergy} onNext={() => setStep(1)} />
  if (step === 1) return <ActivityScreen value={activity} onChange={setActivity} onNext={() => setStep(2)} onBack={() => setStep(0)} />
  if (step === 2) return <ContextScreen value={context} onChange={setContext} onSave={handleSave} onBack={() => setStep(1)} saving={saving} saved={saved} />
  return null
}
