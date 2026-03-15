import React, { useState } from 'react'
import useKairosStore from '../../store/useKairosStore'
import { Toggle } from '../../components/ui'

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

export default function SettingsScreen() {
  const store = useKairosStore()
  const [showConfirmReset, setShowConfirmReset] = useState(false)

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
        <SettingRow label="Direction" onPress={() => {}} />
        <SettingRow label="Keywords" value={store.keywords.slice(0, 3).join(', ') + (store.keywords.length > 3 ? '…' : '')} onPress={() => {}} />
      </div>

      {/* Reminders */}
      <div style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '.1em', textTransform: 'uppercase', padding: '0 24px', marginBottom: 4 }}>
        Reminders
      </div>
      <div style={{ background: 'rgba(255,255,255,.02)', marginBottom: 8 }}>
        <SettingRow label="Frequency" value={`${store.frequency}× per day`} onPress={() => {}} />
        <div style={{ padding: '8px 24px 16px' }}>
          <Toggle
            on={store.smartTiming}
            onToggle={() => store.setSmartTiming(!store.smartTiming)}
            label="Smart timing"
            sub="evenly distributes reminders across waking hours"
          />
        </div>
        <SettingRow label="Quiet hours" value={`${store.quietHoursStart}:00 – ${String(store.quietHoursEnd).padStart(2,'0')}:00`} onPress={() => {}} />
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
      </div>
    </div>
  )
}
