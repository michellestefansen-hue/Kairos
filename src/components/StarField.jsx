import React, { useMemo } from 'react'

export default function StarField() {
  const stars = useMemo(() => (
    Array.from({ length: 90 }, (_, i) => ({
      id: i,
      size: Math.random() * 1.8 + 0.3,
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: Math.random() * 0.45 + 0.08,
      duration: Math.random() * 6 + 3,
      delay: Math.random() * 8
    }))
  ), [])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {/* Gradient background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, #0F172A 0%, #1E1B4B 100%)'
      }} />

      {/* Ambient glow blobs */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 60% 50% at 28% 18%, rgba(109,40,217,.22) 0%, transparent 65%),
          radial-gradient(ellipse 45% 40% at 75% 72%, rgba(67,20,140,.18) 0%, transparent 65%)
        `,
        animation: 'ambientDrift 40s ease-in-out infinite alternate'
      }} />

      {/* Stars */}
      {stars.map(s => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            width: s.size,
            height: s.size,
            top: `${s.top}%`,
            left: `${s.left}%`,
            borderRadius: '50%',
            background: 'white',
            animation: `starTwinkle ${s.duration}s ${s.delay}s ease-in-out infinite alternate`,
            '--opacity': s.opacity
          }}
        />
      ))}

      <style>{`
        @keyframes ambientDrift {
          0%   { opacity: .7; transform: scale(1) translate(0,0); }
          50%  { opacity: 1;  transform: scale(1.04) translate(1%,1%); }
          100% { opacity: .8; transform: scale(1.01) translate(-1%,-1%); }
        }
        @keyframes starTwinkle {
          0%   { opacity: var(--opacity, .2); }
          100% { opacity: calc(var(--opacity, .2) * .2); }
        }
        @keyframes screenIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
