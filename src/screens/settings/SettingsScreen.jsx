import { useState, useCallback, useEffect } from 'react'
import useKairosStore from '../../store/useKairosStore'
import { Chip, PipProgress, TextInput } from '../../components/ui'
import { useNotifications } from '../../hooks/useNotifications'

const STOP = new Set(['i','me','my','myself','we','our','ours','you','your','yourself','he','him','his','she','her','hers','it','its','they','them','their','what','which','who','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','do','does','did','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','into','through','during','before','after','to','from','up','down','in','out','on','off','over','under','again','then','here','there','when','where','why','how','all','both','each','more','most','other','some','no','nor','not','only','own','same','so','than','too','very','can','will','just','should','now','want','make','also','stay','get','feel','know','able','always','never','still','even','every','many','much','things','something','life','day','year','time','people','person','way','truly','really','deeply'])
const FALLBACK = ['Focus','Purpose','Balance','Growth','Presence','Depth','Clarity','Courage','Impact','Connection','Rest','Learning','Creativity','Health','Calm','Leadership','Discipline','Adventure','Meaning','Gratitude','Service']

function extractKeywords(text) {
  const tokens = text.toLowerCase()
    .replace(/['']/g, "'").replace(/[^a-z'\s-]/g, ' ')
    .split(/\s+/).map(w => w.replace(/^['-]+|['-]+$/g, ''))
    .filter(w => w.length > 2 && !STOP.has(w))
  const seen = new Set(), unique = []
  tokens.forEach(w => {
    const cap = w.charAt(0).toUpperCase() + w.slice(1)
    if (!seen.has(w)) { seen.add(w); unique.push(cap) }
  })
  return unique
}

function SettingRow({ label, value, onPress, danger }) {
  return (
    <div
      onClick={onPress}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        color: danger ? 'var(--error)' : 'var(--text-secondary)',
        fontSize: 15, cursor: onPress ? 'pointer' : 'default',
        minHeight: 52,
        transition: 'background .15s'
      }}
      onMouseEnter={e => { if (onPress) e.currentTarget.style.background = 'rgba(255,255,255,.03)' }}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span>{label}</span>
      {value && <span style={{ color: 'var(--text-faint)', fontSize: 14 }}>{value}</span>}
      {!value && onPress && !danger && <span style={{ color: 'var(--text-faint)', fontSize: 14 }}>›</span>}
    </div>
  )
}

function EditPanel({ children }) {
  return (
    <div style={{ padding: '16px 24px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(109,40,217,.06)' }}>
      {children}
    </div>
  )
}

function SaveRow({ onSave, onCancel, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
      <button
        onClick={onCancel}
        style={{
          flex: 1, padding: '11px', borderRadius: 12,
          border: '1.5px solid rgba(167,139,250,.3)', background: 'transparent',
          color: 'var(--accent-pale)', fontFamily: 'var(--font-ui)', fontSize: 14, cursor: 'pointer'
        }}
      >Cancel</button>
      <button
        onClick={onSave}
        disabled={disabled}
        style={{
          flex: 1, padding: '11px', borderRadius: 12,
          border: 'none', background: disabled ? 'rgba(109,40,217,.2)' : 'var(--accent)',
          color: disabled ? 'var(--text-faint)' : '#fff',
          fontFamily: 'var(--font-ui)', fontSize: 14,
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1
        }}
      >Save</button>
    </div>
  )
}

export default function SettingsScreen() {
  const store = useKairosStore()
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [debugInfo, setDebugInfo] = useState('checking...')
  const { requestPermission, scheduleToday } = useNotifications()
  const [notifStatus, setNotifStatus] = useState(null)
  const [editingSection, setEditingSection] = useState(null) // null | 'direction' | 'keywords' | 'frequency' | 'quietHours'

  // Direction edit state
  const [draftDirection, setDraftDirection] = useState('')

  // Keywords edit state
  const [draftSelected, setDraftSelected] = useState(new Set())
  const [customKeywordInput, setCustomKeywordInput] = useState('')

  // Frequency edit state
  const [draftFrequency, setDraftFrequency] = useState(store.frequency)

  // Quiet hours edit state
  const [draftQuietStart, setDraftQuietStart] = useState(store.quietHoursStart)
  const [draftQuietEnd, setDraftQuietEnd] = useState(store.quietHoursEnd)

  useEffect(() => {
    async function check() {
      if (!window.OneSignal) { setDebugInfo('OneSignal not loaded'); return }
      try {
        const id = window.OneSignal.User?.PushSubscription?.id
        const permission = window.OneSignal.Notifications?.permission
        setDebugInfo(`id: ${id || 'null'} | permission: ${permission}`)
        // Sync store with live browser permission (e.g. user revoked in Chrome settings)
        if (!permission && store.notificationsGranted) store.setNotificationsGranted(false)
        if (permission && !store.notificationsGranted) store.setNotificationsGranted(true)
      } catch (e) {
        setDebugInfo(`error: ${e.message}`)
      }
    }
    check()
  }, [])

  const openDirection = () => {
    setDraftDirection(store.direction)
    setEditingSection('direction')
  }

  const saveDirection = () => {
    store.setDirection(draftDirection)
    setEditingSection(null)
  }

  const openKeywords = () => {
    setDraftSelected(new Set(store.keywords))
    setEditingSection('keywords')
  }

  const toggleKeyword = useCallback((word) => {
    setDraftSelected(prev => {
      const next = new Set(prev)
      if (next.has(word)) next.delete(word)
      else if (next.size < 5) next.add(word)
      return next
    })
  }, [])

  const saveKeywords = () => {
    store.setKeywords([...draftSelected])
    setEditingSection(null)
  }

  const openFrequency = () => {
    setDraftFrequency(store.frequency)
    setEditingSection('frequency')
  }

  const saveFrequency = () => {
    store.setFrequency(draftFrequency)
    store.setLastScheduledDate(null)
    setEditingSection(null)
  }

  const openQuietHours = () => {
    setDraftQuietStart(store.quietHoursStart)
    setDraftQuietEnd(store.quietHoursEnd)
    setEditingSection('quietHours')
  }

  const saveQuietHours = () => {
    store.setQuietHours(draftQuietStart, draftQuietEnd)
    store.setLastScheduledDate(null)
    setEditingSection(null)
  }

  const cancel = () => setEditingSection(null)

  const handleExport = () => {
    const data = store.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kairos-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    if (showConfirmReset) {
      store.resetData()
      setShowConfirmReset(false)
    } else {
      setShowConfirmReset(true)
      setTimeout(() => setShowConfirmReset(false), 4000)
    }
  }

  // Keyword picker options based on current (draft) direction
  const directionForKeywords = editingSection === 'keywords' ? store.direction : ''
  const yourWords = extractKeywords(directionForKeywords).slice(0, 8)
  const yourLower = new Set(yourWords.map(w => w.toLowerCase()))
  const extras = FALLBACK.filter(w => !yourLower.has(w.toLowerCase()))
  const kwCount = draftSelected.size
  const kwReady = kwCount >= 3 && kwCount <= 5
  const kwCountText = kwCount === 0 ? 'Choose at least 3'
    : kwCount < 3 ? `${kwCount} selected — ${3 - kwCount} more to go`
    : kwCount <= 5 ? `${kwCount} selected — good to go`
    : `${kwCount} selected — maximum is 5`

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '28px 24px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 500, color: 'var(--text-primary)' }}>Settings</h1>
      </div>

      {/* Direction */}
      <div style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '.1em', textTransform: 'uppercase', padding: '0 24px', marginBottom: 4 }}>
        Profile
      </div>
      <div style={{ background: 'rgba(255,255,255,.02)', marginBottom: 20 }}>
        <SettingRow
          label="Direction"
          value={store.direction ? store.direction.slice(0, 32) + (store.direction.length > 32 ? '…' : '') : 'Not set'}
          onPress={editingSection === 'direction' ? null : openDirection}
        />
        {editingSection === 'direction' && (
          <EditPanel>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
              Imagine your life summarized in one sentence.
            </p>
            <TextInput
              multiline
              rows={3}
              value={draftDirection}
              onChange={e => setDraftDirection(e.target.value)}
              placeholder="I create meaningful work and stay present for my family."
            />
            <SaveRow onSave={saveDirection} onCancel={cancel} disabled={draftDirection.trim().length < 6} />
          </EditPanel>
        )}

        <SettingRow
          label="Keywords"
          value={store.keywords.length ? store.keywords.slice(0, 3).join(', ') + (store.keywords.length > 3 ? '…' : '') : 'Not set'}
          onPress={editingSection === 'keywords' ? null : openKeywords}
        />
        {editingSection === 'keywords' && (
          <EditPanel>
            {yourWords.length > 0 && (
              <>
                <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 10 }}>
                  From your direction
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {yourWords.map(w => (
                    <Chip key={w} label={w} isYours selected={draftSelected.has(w)} onClick={() => toggleKeyword(w)} />
                  ))}
                </div>
                <div style={{ height: 1, background: 'rgba(167,139,250,.1)', marginBottom: 14 }} />
              </>
            )}
            <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 10 }}>
              Suggestions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {extras.map(w => (
                <Chip key={w} label={w} selected={draftSelected.has(w)} onClick={() => toggleKeyword(w)} />
              ))}
              {[...draftSelected].filter(w => !yourWords.includes(w) && !extras.includes(w)).map(w => (
                <Chip key={w} label={w} selected onClick={() => toggleKeyword(w)} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <input
                type="text"
                value={customKeywordInput}
                onChange={e => setCustomKeywordInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && customKeywordInput.trim() && draftSelected.size < 5) {
                    setDraftSelected(prev => new Set([...prev, customKeywordInput.trim()]))
                    setCustomKeywordInput('')
                  }
                }}
                placeholder="Add your own keyword..."
                style={{
                  flex: 1, background: 'transparent',
                  border: 'none', borderBottom: '1px solid rgba(167,139,250,.3)',
                  padding: '8px 0', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 300,
                  outline: 'none'
                }}
                onFocus={e => e.target.style.borderBottomColor = 'var(--accent-soft)'}
                onBlur={e => e.target.style.borderBottomColor = 'rgba(167,139,250,.3)'}
              />
              {customKeywordInput.trim() && (
                <button
                  onClick={() => {
                    if (draftSelected.size < 5) {
                      setDraftSelected(prev => new Set([...prev, customKeywordInput.trim()]))
                      setCustomKeywordInput('')
                    }
                  }}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--text-accent)', fontSize: 14,
                    cursor: 'pointer', fontFamily: 'var(--font-ui)', padding: '4px'
                  }}
                >Add</button>
              )}
            </div>
            <PipProgress total={5} filled={kwCount} text={kwCountText} textReady={kwReady} />
            <SaveRow onSave={saveKeywords} onCancel={cancel} disabled={!kwReady} />
          </EditPanel>
        )}
      </div>

      {/* Reminders */}
      <div style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '.1em', textTransform: 'uppercase', padding: '0 24px', marginBottom: 4 }}>
        Reminders
      </div>
      <div style={{ background: 'rgba(255,255,255,.02)', marginBottom: 8 }}>
        <SettingRow
          label="Frequency"
          value={`${store.frequency}× per day`}
          onPress={editingSection === 'frequency' ? null : openFrequency}
        />
        {editingSection === 'frequency' && (
          <EditPanel>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
              {[3, 4, 5, 6].map(n => (
                <button
                  key={n}
                  onClick={() => setDraftFrequency(n)}
                  style={{
                    width: 56, height: 56, borderRadius: '50%',
                    border: `1.5px solid ${draftFrequency === n ? 'var(--accent-mid)' : 'rgba(167,139,250,.35)'}`,
                    background: draftFrequency === n ? '#5B21B6' : 'rgba(109,40,217,.08)',
                    color: draftFrequency === n ? '#fff' : 'var(--accent-pale)',
                    fontFamily: 'var(--font-ui)', fontSize: 18,
                    cursor: 'pointer',
                    WebkitAppearance: 'none', appearance: 'none'
                  }}
                >{n}</button>
              ))}
            </div>
            <SaveRow onSave={saveFrequency} onCancel={cancel} />
          </EditPanel>
        )}
        <SettingRow
          label="Quiet hours"
          value={`${String(store.quietHoursStart).padStart(2,'0')}:00 – ${String(store.quietHoursEnd).padStart(2,'0')}:00`}
          onPress={editingSection === 'quietHours' ? null : openQuietHours}
        />
        {editingSection === 'quietHours' && (
          <EditPanel>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>No notifications will be sent during these hours.</p>
            {[
              { label: 'Sleep from', value: draftQuietStart, set: setDraftQuietStart, min: 18, max: 23 },
              { label: 'Wake at', value: draftQuietEnd, set: setDraftQuietEnd, min: 4, max: 11 },
            ].map(({ label, value, set, min, max }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => set(v => Math.max(min, v - 1))}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(167,139,250,.35)', background: 'rgba(109,40,217,.08)', color: 'var(--accent-pale)', fontFamily: 'var(--font-ui)', fontSize: 18, cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none' }}
                  >−</button>
                  <span style={{ fontSize: 16, color: 'var(--text-primary)', minWidth: 40, textAlign: 'center' }}>
                    {String(value).padStart(2,'0')}:00
                  </span>
                  <button
                    onClick={() => set(v => Math.min(max, v + 1))}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(167,139,250,.35)', background: 'rgba(109,40,217,.08)', color: 'var(--accent-pale)', fontFamily: 'var(--font-ui)', fontSize: 18, cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none' }}
                  >+</button>
                </div>
              </div>
            ))}
            <SaveRow onSave={saveQuietHours} onCancel={cancel} />
          </EditPanel>
        )}
        <div style={{ padding: '12px 24px' }}>
          {store.notificationsGranted && notifStatus !== 'scheduling' ? (
            <p style={{ fontSize: 13, color: 'var(--text-accent)', textAlign: 'center' }}>
              {notifStatus === 'scheduled' ? 'Reminders scheduled.' : 'Reminders are active.'}
            </p>
          ) : (
            <button
              disabled={notifStatus === 'scheduling'}
              onClick={async () => {
                setNotifStatus('scheduling')
                const result = await requestPermission()
                if (result === 'granted') {
                  await scheduleToday(true)
                  setNotifStatus('scheduled')
                } else if ('Notification' in window && Notification.permission === 'denied') {
                  setNotifStatus('blocked')
                } else {
                  setNotifStatus('failed')
                }
              }}
              style={{
                width: '100%', padding: '12px', borderRadius: 12,
                background: 'rgba(109,40,217,.25)', border: '1.5px solid rgba(167,139,250,.4)',
                color: 'var(--text-primary)', fontSize: 15, cursor: 'pointer',
                fontFamily: 'var(--font-ui)', opacity: notifStatus === 'scheduling' ? 0.5 : 1
              }}
            >
              {notifStatus === 'scheduling' ? 'Enabling…' : 'Enable reminders'}
            </button>
          )}
          {notifStatus === 'blocked' && (
            <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 8, textAlign: 'center' }}>
              Blocked. In Chrome: ⋮ → Settings → Site settings → Notifications → find this site → Allow.
            </p>
          )}
          {notifStatus === 'failed' && (
            <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 8, textAlign: 'center' }}>
              Something went wrong. Make sure you're using Chrome and try again.
            </p>
          )}
        </div>
      </div>

      {/* Data */}
      <div style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '.1em', textTransform: 'uppercase', padding: '0 24px', marginBottom: 4, marginTop: 20 }}>
        Data
      </div>
      <div style={{ background: 'rgba(255,255,255,.02)', marginBottom: 20 }}>
        <SettingRow label="Export data" value="JSON" onPress={handleExport} />
        <SettingRow
          label={showConfirmReset ? 'Tap again to confirm reset' : 'Reset all data'}
          onPress={handleReset}
          danger
        />
      </div>

      {/* Version */}
      <div style={{ padding: '8px 24px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Kairos · 1.0.0</p>
        <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4, wordBreak: 'break-all' }}>{debugInfo}</p>
      </div>
    </div>
  )
}
