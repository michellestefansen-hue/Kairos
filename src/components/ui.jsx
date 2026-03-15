import React from 'react'

// ── BUTTON ──────────────────────────────────────────────────
export function Btn({ children, onClick, disabled, ghost, style, ...props }) {
  const base = {
    display: 'block',
    width: '100%',
    padding: '17px',
    borderRadius: 'var(--radius-btn)',
    border: ghost ? '1.5px solid rgba(167,139,250,.5)' : 'none',
    background: ghost ? 'transparent' : (disabled ? 'rgba(109,40,217,.2)' : 'var(--accent)'),
    color: ghost ? 'var(--accent-pale)' : (disabled ? 'var(--text-faint)' : '#fff'),
    fontFamily: 'var(--font-ui)',
    fontSize: '16px',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    textAlign: 'center',
    letterSpacing: '.02em',
    opacity: disabled ? 0.45 : 1,
    transition: 'background .15s, transform .1s, opacity .2s',
    WebkitAppearance: 'none',
    appearance: 'none',
    ...style
  }
  return (
    <button
      style={base}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={e => { if (!disabled && !ghost) e.currentTarget.style.background = 'var(--accent-mid)' }}
      onMouseLeave={e => { if (!disabled && !ghost) e.currentTarget.style.background = 'var(--accent)' }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(.98)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      {...props}
    >
      {children}
    </button>
  )
}

// ── BACK BUTTON ─────────────────────────────────────────────
export function BackBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,.5)',
        fontSize: '22px',
        cursor: 'pointer',
        padding: '4px 8px',
        minWidth: 40,
        minHeight: 40,
        display: 'flex',
        alignItems: 'center',
        lineHeight: 1,
        transition: 'color .15s'
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.5)'}
      aria-label="Back"
    >‹</button>
  )
}

// ── NAV BAR ─────────────────────────────────────────────────
export function ScreenNav({ onBack, right, center }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 4px 8px', minHeight: 52, flexShrink: 0
    }}>
      <div style={{ width: 40 }}>
        {onBack && <BackBtn onClick={onBack} />}
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {center}
      </div>
      <div style={{ width: 40, display: 'flex', justifyContent: 'flex-end' }}>
        {right}
      </div>
    </div>
  )
}

// ── LOGO ────────────────────────────────────────────────────
export function KairosLogo({ size = 28 }) {
  return (
    <span style={{
      fontFamily: 'var(--font-logo)',
      fontSize: size,
      fontWeight: 400,
      color: 'var(--text-primary)',
      letterSpacing: '.08em'
    }}>Kairos</span>
  )
}

// ── CHIP ────────────────────────────────────────────────────
export function Chip({ label, selected, onClick, isYours }) {
  return (
    <div
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
      style={{
        padding: '9px 16px',
        borderRadius: 'var(--radius-chip)',
        border: `1.5px solid ${selected ? 'var(--accent-mid)' : isYours ? 'rgba(167,139,250,.5)' : 'rgba(167,139,250,.3)'}`,
        background: selected ? '#5B21B6' : isYours ? 'rgba(109,40,217,.14)' : 'var(--accent-ghost)',
        color: selected ? '#fff' : isYours ? '#DDD6FE' : 'var(--accent-pale)',
        fontFamily: 'var(--font-ui)',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all .18s',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        minHeight: 38
      }}
    >
      {isYours && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: selected ? 'rgba(255,255,255,.5)' : 'rgba(167,139,250,.6)',
          flexShrink: 0
        }} />
      )}
      {label}
    </div>
  )
}

// ── CARD ────────────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--radius-card)',
      padding: '20px',
      ...style
    }}>
      {children}
    </div>
  )
}

// ── SECTION LABEL ───────────────────────────────────────────
export function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 12,
      color: 'var(--text-muted)',
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      marginBottom: 12
    }}>
      {children}
    </div>
  )
}

// ── TOGGLE ──────────────────────────────────────────────────
export function Toggle({ on, onToggle, label, sub }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px',
      background: 'var(--bg-surface-2)',
      borderRadius: 16,
      border: '1px solid var(--border-ui)'
    }}>
      <div>
        <div style={{ color: '#CBD5E1', fontSize: 14 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-accent)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div
        role="switch"
        aria-checked={on}
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggle()}
        style={{
          width: 44, height: 26,
          background: on ? 'var(--accent)' : '#334155',
          borderRadius: 100,
          position: 'relative',
          cursor: 'pointer',
          transition: 'background .2s',
          flexShrink: 0
        }}
      >
        <span style={{
          position: 'absolute',
          top: 3, left: 3,
          width: 20, height: 20,
          borderRadius: '50%',
          background: 'white',
          transition: 'transform .2s',
          transform: on ? 'translateX(18px)' : 'translateX(0)'
        }} />
      </div>
    </div>
  )
}

// ── TEXT INPUT ──────────────────────────────────────────────
export function TextInput({ value, onChange, placeholder, multiline, rows = 3, style }) {
  const base = {
    width: '100%',
    background: 'rgba(255,255,255,.06)',
    border: '1.5px solid rgba(167,139,250,.35)',
    borderRadius: 'var(--radius-input)',
    padding: '16px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-ui)',
    fontSize: 15,
    fontWeight: 300,
    outline: 'none',
    lineHeight: 1.6,
    resize: 'none',
    transition: 'border-color .2s, background .2s',
    ...style
  }

  const handlers = {
    onFocus: e => {
      e.target.style.borderColor = 'var(--accent-soft)'
      e.target.style.background = 'rgba(255,255,255,.09)'
    },
    onBlur: e => {
      e.target.style.borderColor = 'rgba(167,139,250,.35)'
      e.target.style.background = 'rgba(255,255,255,.06)'
    }
  }

  if (multiline) {
    return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={base} {...handlers} />
  }
  return <input type="text" value={value} onChange={onChange} placeholder={placeholder} style={base} {...handlers} />
}

// ── DOTS PROGRESS ───────────────────────────────────────────
export function DotProgress({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: i === current ? 'var(--accent-soft)' : 'rgba(139,92,246,.25)',
          transition: 'background .3s'
        }} />
      ))}
    </div>
  )
}

// ── PIP PROGRESS ────────────────────────────────────────────
export function PipProgress({ total, filled, text, textReady }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0 0', flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width: 20, height: 4, borderRadius: 2,
            background: i < filled ? 'var(--accent-mid)' : 'rgba(167,139,250,.15)',
            transition: 'background .2s'
          }} />
        ))}
      </div>
      <div style={{
        fontSize: 13,
        color: textReady ? 'var(--text-accent)' : 'var(--text-muted)',
        transition: 'color .2s'
      }}>
        {text}
      </div>
    </div>
  )
}

// ── STATUS MESSAGE ──────────────────────────────────────────
export function StatusMsg({ type, children }) {
  if (!children) return null
  const isSuccess = type === 'success'
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 14,
      fontSize: 14,
      textAlign: 'center',
      background: isSuccess ? 'var(--success-bg)' : 'var(--error-bg)',
      border: `1.5px solid ${isSuccess ? 'var(--success-border)' : 'var(--error-border)'}`,
      color: isSuccess ? 'var(--success)' : 'var(--error)'
    }}>
      {children}
    </div>
  )
}

// ── BOTTOM NAV ──────────────────────────────────────────────
const NAV_ICONS = {
  moment: (active) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke={active ? '#A78BFA' : '#334155'} strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="2.5" fill={active ? '#A78BFA' : '#334155'}/>
    </svg>
  ),
  insights: (active) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <polyline points="3,15 7,9 11,12 17,4" stroke={active ? '#A78BFA' : '#334155'} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  settings: (active) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.5" stroke={active ? '#A78BFA' : '#334155'} strokeWidth="1.5"/>
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.1 4.1l1.4 1.4M14.5 14.5l1.4 1.4M4.1 15.9l1.4-1.4M14.5 5.5l1.4-1.4" stroke={active ? '#A78BFA' : '#334155'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function BottomNav({ active, onSelect }) {
  const tabs = ['moment', 'insights', 'settings']
  return (
    <div style={{
      display: 'flex',
      background: 'rgba(15,23,42,.95)',
      borderTop: '1px solid rgba(167,139,250,.12)',
      padding: '10px 0 18px',
      flexShrink: 0
    }}>
      {tabs.map(tab => (
        <div
          key={tab}
          role="tab"
          aria-selected={active === tab}
          tabIndex={0}
          onClick={() => onSelect(tab)}
          onKeyDown={e => e.key === 'Enter' && onSelect(tab)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            minHeight: 44,
            justifyContent: 'center'
          }}
        >
          {NAV_ICONS[tab](active === tab)}
          <span style={{
            fontSize: 11,
            color: active === tab ? 'var(--text-accent)' : 'var(--text-faint)'
          }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── SCREEN WRAPPER ──────────────────────────────────────────
export function Screen({ children, style }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      animation: 'screenIn .3s ease',
      ...style
    }}>
      {children}
    </div>
  )
}

// ── BTN AREA ────────────────────────────────────────────────
export function BtnArea({ children }) {
  return (
    <div style={{
      flexShrink: 0,
      padding: '16px 24px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }}>
      {children}
    </div>
  )
}
