import React, { useState, useCallback } from 'react'
import useKairosStore from '../../store/useKairosStore'
import { useNotifications } from '../../hooks/useNotifications'
import {
  Screen, ScreenNav, BtnArea, Btn, KairosLogo,
  DotProgress, Chip, Toggle, TextInput,
  PipProgress, StatusMsg
} from '../../components/ui'

// ── STOP WORDS ───────────────────────────────────────────────
const STOP = new Set(['i','me','my','myself','we','our','ours','you','your','yourself','he','him','his','she','her','hers','it','its','they','them','their','what','which','who','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','do','does','did','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','into','through','during','before','after','to','from','up','down','in','out','on','off','over','under','again','then','here','there','when','where','why','how','all','both','each','more','most','other','some','no','nor','not','only','own','same','so','than','too','very','can','will','just','should','now','want','make','also','stay','get','feel','know','able','always','never','still','even','every','many','much','things','something','life','day','year','time','people','person','way','truly','really','deeply'])
const FALLBACK = ['Focus','Purpose','Balance','Growth','Presence','Depth','Clarity','Courage','Impact','Connection','Rest','Learning','Creativity','Health','Calm','Leadership','Vitality','Joy','Freedom','Confidence','Belonging','Wonder','Resilience','Flow','Gratitude','Meaning','Strength','Peace','Enthusiasm','Openness','Acceptance','Aliveness','Harmony','Playfulness']

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

// ── SLIDE 1–3 ────────────────────────────────────────────────
function IntroSlide({ slide, onNext }) {
  const slides = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="14" stroke="rgba(167,139,250,.6)" strokeWidth="1.5" strokeDasharray="4 3"/>
          <circle cx="18" cy="18" r="7" fill="rgba(109,40,217,.3)"/>
          <circle cx="18" cy="18" r="2.5" fill="#A78BFA"/>
        </svg>
      ),
      title: 'You probably don\'t know when you\'re at your best.',
      sub: 'Not when you assume. When you actually are. Kairos helps you find out.'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
          <path d="M8 28 Q14 10 18 18 Q22 26 28 8" stroke="#A78BFA" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <circle cx="18" cy="18" r="2.5" fill="#7C3AED"/>
          <circle cx="8" cy="28" r="1.5" fill="rgba(167,139,250,.5)"/>
          <circle cx="28" cy="8" r="1.5" fill="rgba(167,139,250,.5)"/>
        </svg>
      ),
      title: 'A few honest check-ins each day.',
      sub: 'How much energy do you have? What are you doing? That\'s it. After a few days, real patterns emerge.'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
          <rect x="8" y="20" width="4" height="10" rx="1" fill="rgba(167,139,250,.4)"/>
          <rect x="16" y="14" width="4" height="16" rx="1" fill="rgba(167,139,250,.6)"/>
          <rect x="24" y="8" width="4" height="22" rx="1" fill="#A78BFA"/>
        </svg>
      ),
      title: 'Then you start living differently.',
      sub: 'Not based on what you think you should do — but on what actually works for you.'
    }
  ]
  const s = slides[slide]

  return (
    <Screen>
      <ScreenNav center={<DotProgress total={3} current={slide} />} />
      <div style={{ padding: '8px 0 4px', textAlign: 'center', flexShrink: 0 }}>
        <KairosLogo size={28} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(109,40,217,.15)',
          border: '1.5px solid rgba(167,139,250,.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28
        }}>
          {s.icon}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.35, marginBottom: 12 }}>
          {s.title}
        </h1>
        <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
          {s.sub}
        </p>
      </div>
      <BtnArea>
        <Btn onClick={onNext}>{slide < 2 ? 'Continue' : 'Get started'}</Btn>
      </BtnArea>
    </Screen>
  )
}

// ── DIRECTION ────────────────────────────────────────────────
function DirectionScreen({ onNext, onBack }) {
  const { direction, setDirection } = useKairosStore()
  const [text, setText] = useState(direction)

  const keywords = extractKeywords(text)

  const handleChange = (e) => {
    setText(e.target.value)
    setDirection(e.target.value)
  }

  // Build highlighted preview
  const highlighted = React.useMemo(() => {
    if (!text.trim() || keywords.length === 0) return text
    let h = text
    keywords.forEach(w => {
      const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      h = h.replace(new RegExp(`(${esc})`, 'gi'), '|||$1|||')
    })
    return h.split('|||').map((part, i) => {
      const isHighlighted = keywords.some(w => w.toLowerCase() === part.toLowerCase())
      return isHighlighted
        ? <mark key={i} style={{ background: 'none', color: '#C4B5FD', fontWeight: 500, borderBottom: '1px solid rgba(167,139,250,.4)', padding: '0 1px' }}>{part}</mark>
        : part
    })
  }, [text, keywords])

  return (
    <Screen>
      <ScreenNav onBack={onBack} />
      <div style={{ padding: '8px 24px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: 8 }}>
          Imagine your life summarized in one sentence.
        </h1>
        <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--text-secondary)', marginBottom: 4 }}>
          What would you want it to say?
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Write about how you feel and what you value — not what you want to own or achieve.</p>

        <textarea
          value={text}
          onChange={handleChange}
          placeholder="I feel alive when I'm creating, deeply connected to the people I love, and free to grow."
          rows={4}
          style={{
            width: '100%', background: 'rgba(255,255,255,.06)',
            border: '1.5px solid rgba(167,139,250,.35)', borderRadius: 16,
            padding: 16, color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 300,
            outline: 'none', lineHeight: 1.6, resize: 'none',
            minHeight: 100
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent-soft)'; e.target.style.background = 'rgba(255,255,255,.09)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(167,139,250,.35)'; e.target.style.background = 'rgba(255,255,255,.06)' }}
        />

        {text.trim() && keywords.length > 0 && (
          <div style={{ marginTop: 16, fontSize: 15, fontWeight: 300, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            {highlighted}
          </div>
        )}
        <div style={{ flex: 1 }} />
      </div>
      <BtnArea>
        <Btn onClick={onNext} disabled={text.trim().length < 6}>Continue</Btn>
      </BtnArea>
    </Screen>
  )
}

// ── KEYWORDS ─────────────────────────────────────────────────
function KeywordsScreen({ onNext, onBack }) {
  const { direction, keywords: savedKeywords, setKeywords } = useKairosStore()
  const [selected, setSelected] = useState(new Set(savedKeywords))

  const yourWords = extractKeywords(direction).slice(0, 8)
  const yourLower = new Set(yourWords.map(w => w.toLowerCase()))
  const keywords = FALLBACK.filter(w => !yourLower.has(w.toLowerCase()))

  const toggle = useCallback((word) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(word)) next.delete(word)
      else if (next.size < 5) next.add(word)
      return next
    })
  }, [])

  const n = selected.size
  const ready = n >= 3 && n <= 5
  const countText = n === 0 ? 'Choose at least 3'
    : n < 3 ? `${n} selected — ${3 - n} more to go`
    : n <= 5 ? `${n} selected — good to go`
    : `${n} selected — maximum is 5`

  const handleNext = () => {
    setKeywords([...selected])
    onNext()
  }

  return (
    <Screen>
      <ScreenNav onBack={onBack} />
      <div style={{ padding: '8px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>Choose what Kairos watches over.</h1>
        <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--text-secondary)', marginBottom: 4 }}>Pick 3–5 feelings or inner states you want more of in your life.</p>

        {yourWords.length > 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Your sentence suggests: <span style={{ color: 'var(--accent-soft)', fontWeight: 400 }}>{yourWords.join(' · ')}</span>
          </p>
        )}

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 12 }}>
            Select your keywords
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {keywords.map(w => (
              <Chip key={w} label={w} selected={selected.has(w)} onClick={() => toggle(w)} />
            ))}
          </div>
        </div>

        <PipProgress total={5} filled={n} text={countText} textReady={ready} />
      </div>
      <BtnArea>
        <Btn onClick={handleNext} disabled={!ready}>Continue</Btn>
      </BtnArea>
    </Screen>
  )
}

// ── FREQUENCY ────────────────────────────────────────────────
function FrequencyScreen({ onNext, onBack }) {
  const { frequency, setFrequency, smartTiming, setSmartTiming } = useKairosStore()

  return (
    <Screen>
      <ScreenNav onBack={onBack} />
      <div style={{ padding: '8px 24px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
          How many times a day?
        </h1>
        <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--text-secondary)', marginBottom: 24 }}>
          4 check-ins takes less than 2 minutes a day. More moments means clearer patterns, faster.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
          {[3, 4, 5, 6].map(n => (
            <div key={n} style={{ position: 'relative' }}>
              <button
                onClick={() => setFrequency(n)}
                style={{
                  width: 64, height: 64, borderRadius: '50%',
                  border: `1.5px solid ${frequency === n ? 'var(--accent-mid)' : 'rgba(167,139,250,.35)'}`,
                  background: frequency === n ? '#5B21B6' : 'rgba(109,40,217,.08)',
                  color: frequency === n ? '#fff' : 'var(--accent-pale)',
                  fontFamily: 'var(--font-ui)', fontSize: 20,
                  cursor: 'pointer', transition: 'all .2s',
                  WebkitAppearance: 'none', appearance: 'none'
                }}
              >{n}</button>
              {n === 4 && (
                <span style={{
                  position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 10, color: 'var(--text-accent)', whiteSpace: 'nowrap'
                }}>recommended</span>
              )}
            </div>
          ))}
        </div>

        <Toggle
          on={smartTiming}
          onToggle={() => setSmartTiming(!smartTiming)}
          label="Smart timing"
          sub="recommended"
        />
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
          You can always adjust this later.
        </p>
        <div style={{ flex: 1 }} />
      </div>
      <BtnArea>
        <Btn onClick={onNext}>Activate tracking</Btn>
      </BtnArea>
    </Screen>
  )
}

// ── NOTIFICATIONS ────────────────────────────────────────────
function NotificationsScreen({ onNext, onBack }) {
  const [status, setStatus] = useState(null) // null | 'granted' | 'denied' | 'unsupported'
  const { requestPermission } = useNotifications()

  const handleEnable = async () => {
    const result = await requestPermission()
    setStatus(result === 'granted' ? 'granted' : result === 'unsupported' ? 'unsupported' : 'denied')
  }

  return (
    <Screen>
      <ScreenNav onBack={onBack} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(109,40,217,.18)',
          border: '1.5px solid rgba(167,139,250,.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28
        }}>
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <path d="M16 4C16 4 8 8 8 17V22H6V24H26V22H24V17C24 8 16 4 16 4Z" fill="rgba(109,40,217,.35)" stroke="rgba(167,139,250,.6)" strokeWidth="1" strokeLinejoin="round"/>
            <rect x="13" y="25" width="6" height="3" rx="1.5" fill="rgba(167,139,250,.5)"/>
            <circle cx="22" cy="7" r="4" fill="var(--accent)"/>
            <line x1="22" y1="5" x2="22" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="22" cy="9.5" r=".8" fill="white"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 12 }}>Let Kairos find you.</h1>
        <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 4 }}>
          Without reminders it's easy to forget. With them, Kairos gently taps you at the right moments during the day.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Never intrusive. Never during quiet hours.</p>

        {status === 'granted' && (
          <div style={{ marginTop: 20, width: '100%' }}>
            <StatusMsg type="success">Reminders enabled.</StatusMsg>
          </div>
        )}
        {(status === 'denied' || status === 'unsupported') && (
          <div style={{ marginTop: 20, width: '100%' }}>
            <StatusMsg type="error">
              Notifications are currently disabled.{' '}
              <span
                style={{ color: 'var(--text-accent)', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => alert('Go to Settings > Notifications > Kairos to enable reminders.')}
              >Open instructions</span>
            </StatusMsg>
          </div>
        )}
      </div>

      <BtnArea>
        {!status && <Btn onClick={handleEnable}>Enable notifications</Btn>}
        {status === 'granted' && <Btn onClick={onNext}>Continue to Kairos</Btn>}
        {(status === 'denied' || status === 'unsupported') && <Btn onClick={onNext}>Continue anyway</Btn>}
        {!status && <Btn ghost onClick={onNext}>Maybe later</Btn>}
      </BtnArea>
    </Screen>
  )
}

// ── MAIN ONBOARDING FLOW ─────────────────────────────────────
export default function OnboardingFlow() {
  const [step, setStep] = useState(0)
  const { completeOnboarding } = useKairosStore()

  // step 0,1,2 = intro slides
  // step 3 = direction
  // step 4 = keywords
  // step 5 = frequency
  // step 6 = notifications

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => Math.max(0, s - 1))

  if (step <= 2) return <IntroSlide slide={step} onNext={next} />
  if (step === 3) return <DirectionScreen onNext={next} onBack={back} />
  if (step === 4) return <KeywordsScreen onNext={next} onBack={back} />
  if (step === 5) return <FrequencyScreen onNext={next} onBack={back} />
  if (step === 6) return <NotificationsScreen onNext={completeOnboarding} onBack={back} />

  return null
}
