import React, { useRef, useEffect, useCallback, useState } from 'react'

// All geometry lives in SVG space (viewBox 0 0 280 280)
// The handle is drawn INSIDE the SVG — no DOM offset math needed
const CX = 140, CY = 140, R = 112, STROKE = 16
const CIRC = 2 * Math.PI * R
const START_ANGLE = -220
const ARC_SPAN = 270

const ENERGY_LABELS = [
  '', 'Completely drained', 'Very low energy', 'Low energy',
  'Below average', 'Neutral', 'Decent energy', 'Good energy',
  'High energy', 'Very high energy', 'Fully in flow'
]

function valueToAngleDeg(val) {
  return START_ANGLE + ((val - 1) / 9) * ARC_SPAN
}

function angleToValue(angleDeg) {
  let rel = ((angleDeg - START_ANGLE) % 360 + 360) % 360
  if (rel > ARC_SPAN + 25) rel = 0
  rel = Math.max(0, Math.min(ARC_SPAN, rel))
  return 1 + (rel / ARC_SPAN) * 9
}

export default function EnergyRing({ value, onChange, size = 280 }) {
  const outerRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [bumping, setBumping] = useState(false)
  const prevVal = useRef(value)

  const frac = (value - 1) / 9
  const dashOffset = CIRC - (CIRC * 0.75 * frac + CIRC * 0.02)

  // Handle position in SVG coordinates — always correct, no layout dependency
  const handleAngleRad = valueToAngleDeg(value) * Math.PI / 180
  const handleSvgX = CX + R * Math.cos(handleAngleRad)
  const handleSvgY = CY + R * Math.sin(handleAngleRad)

  // Bump animation on value change
  useEffect(() => {
    if (prevVal.current !== value) {
      setBumping(true)
      const t = setTimeout(() => setBumping(false), 200)
      prevVal.current = value
      return () => clearTimeout(t)
    }
  }, [value])

  const getAngleFromEvent = useCallback((e) => {
    if (!outerRef.current) return 0
    const rect = outerRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI
  }, [])

  const handleInteraction = useCallback((e) => {
    const raw = angleToValue(getAngleFromEvent(e))
    const snapped = Math.max(1, Math.min(10, Math.round(raw)))
    if (snapped !== value) onChange(snapped)
  }, [getAngleFromEvent, onChange, value])

  useEffect(() => {
    const onMove = (e) => { if (isDragging) handleInteraction(e) }
    const onUp = () => setIsDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [isDragging, handleInteraction])

  // Tick marks
  const ticks = []
  for (let i = 1; i <= 10; i++) {
    const f = (i - 1) / 9
    const deg = START_ANGLE + f * ARC_SPAN
    const rad = deg * Math.PI / 180
    const rOut = R + STROKE / 2 + 5
    const rIn  = R - STROKE / 2 - 5
    const rLbl = R - STROKE / 2 - 18
    const isEdge = i === 1 || i === 10
    ticks.push(
      <line key={`t${i}`}
        x1={CX + rOut * Math.cos(rad)} y1={CY + rOut * Math.sin(rad)}
        x2={CX + rIn  * Math.cos(rad)} y2={CY + rIn  * Math.sin(rad)}
        stroke={isEdge ? 'rgba(167,139,250,.5)' : 'rgba(167,139,250,.2)'}
        strokeWidth={isEdge ? 1.5 : 1}
      />,
      <text key={`l${i}`}
        x={CX + rLbl * Math.cos(rad)} y={CY + rLbl * Math.sin(rad)}
        textAnchor="middle" dominantBaseline="central"
        fill={isEdge ? 'rgba(167,139,250,.7)' : 'rgba(255,255,255,.2)'}
        fontSize={isEdge ? 12 : 10}
        fontFamily="DM Sans, sans-serif"
      >{i}</text>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        ref={outerRef}
        role="slider"
        aria-valuemin={1} aria-valuemax={10} aria-valuenow={value}
        aria-label="Energy level"
        tabIndex={0}
        style={{ position: 'relative', width: size, height: size, cursor: 'pointer', touchAction: 'none', userSelect: 'none' }}
        onMouseDown={e => { setIsDragging(true); handleInteraction(e) }}
        onTouchStart={e => { e.preventDefault(); setIsDragging(true); handleInteraction(e) }}
        onKeyDown={e => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(10, value + 1))
          if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') onChange(Math.max(1, value - 1))
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', inset: -20, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(109,40,217,${0.06 + frac * 0.18}) 20%, rgba(139,92,246,${0.03 + frac * 0.09}) 60%, transparent 80%)`,
          filter: 'blur(18px)',
          opacity: 0.3 + frac * 0.7,
          pointerEvents: 'none',
          transition: 'opacity .6s ease'
        }} />

        {/* Single SVG — handle lives inside, perfectly aligned always */}
        <svg width={size} height={size} viewBox="0 0 280 280" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#4C1D95" />
              <stop offset="55%"  stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#C4B5FD" />
            </linearGradient>
            <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke="rgba(167,139,250,.1)" strokeWidth={STROKE} strokeLinecap="round" />

          {/* Progress arc */}
          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke="url(#arcGrad)" strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={dashOffset}
            transform={`rotate(${START_ANGLE} ${CX} ${CY})`}
            filter="url(#arcGlow)"
            style={{ transition: isDragging ? 'none' : 'stroke-dashoffset .2s ease' }}
          />

          {/* Inner depth rings */}
          <circle cx={CX} cy={CY} r={88} fill="none" stroke="rgba(167,139,250,.04)" strokeWidth={1} />
          <circle cx={CX} cy={CY} r={64} fill="none" stroke="rgba(167,139,250,.03)" strokeWidth={1} />

          {/* Ticks */}
          {ticks}

          {/* Handle — drawn in SVG space, always pixel-perfect on the arc */}
          <circle
            cx={handleSvgX}
            cy={handleSvgY}
            r={15}
            fill="white"
            style={{ filter: isDragging
              ? 'drop-shadow(0 0 0 6px rgba(167,139,250,.65)) drop-shadow(0 0 12px rgba(139,92,246,.9))'
              : 'drop-shadow(0 0 0 5px rgba(167,139,250,.5)) drop-shadow(0 0 8px rgba(139,92,246,.7))'
            }}
          />
          {/* Outer ring on handle for glow effect */}
          <circle
            cx={handleSvgX}
            cy={handleSvgY}
            r={isDragging ? 20 : 17}
            fill="none"
            stroke="rgba(167,139,250,.4)"
            strokeWidth={isDragging ? 2.5 : 2}
            style={{ transition: 'r .15s ease, stroke-width .15s ease' }}
          />

          {/* Center number */}
          <text
            x={CX} y={CY - 10}
            textAnchor="middle" dominantBaseline="central"
            fill="white"
            fontSize={52}
            fontWeight={300}
            fontFamily="DM Sans, sans-serif"
            style={{
              transform: bumping ? `scale(1.1)` : 'scale(1)',
              transformOrigin: `${CX}px ${CY}px`,
              transition: 'transform .15s ease'
            }}
          >{value}</text>

          {/* Center label */}
          <text
            x={CX} y={CY + 36}
            textAnchor="middle" dominantBaseline="central"
            fill="rgba(100,116,139,.9)"
            fontSize={13}
            fontWeight={300}
            fontFamily="DM Sans, sans-serif"
          >{ENERGY_LABELS[value]}</text>
        </svg>
      </div>

      {/* Labels below ring */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        width: size, marginTop: 12,
        fontSize: 12, color: 'var(--text-faint)',
        padding: '0 8px'
      }}>
        <span>1 · drained</span>
        <span>10 · fully in flow</span>
      </div>
    </div>
  )
}
