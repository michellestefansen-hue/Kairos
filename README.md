# Kairos — Energy Optimization Tool

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Deploy to Vercel (free)

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → Import your repo
3. Click Deploy — done. HTTPS is automatic.

## Deploy to Netlify (free)

```bash
npm run build
# Drag the dist/ folder to netlify.com/drop
```

## Push notifications

Push notifications require HTTPS to work. They will not fire on http://localhost,
but will work correctly once deployed to Vercel or Netlify.

To test locally: use `npm run preview` after `npm run build`, then visit
https://localhost:4173 (Vite preview uses self-signed HTTPS).

## Project structure

```
src/
  App.jsx                    # Root — onboarding vs main app routing
  main.jsx                   # Entry point
  store/
    useKairosStore.js        # Zustand store, persisted to localStorage
  hooks/
    useNotifications.js      # Permission request + SW scheduling
  components/
    EnergyRing.jsx           # Circular arc drag input
    StarField.jsx            # Animated background
    ui.jsx                   # Shared components (Btn, Chip, Card, Toggle...)
  screens/
    onboarding/
      OnboardingFlow.jsx     # 7-step onboarding
    moment/
      MomentFlow.jsx         # 3-screen moment capture
    insights/
      InsightsScreen.jsx     # Charts + weekly alignment
    settings/
      SettingsScreen.jsx     # All settings + export/reset
  styles/
    global.css               # Design tokens + reset
public/
  sw.js                      # Service worker (push + scheduling)
```

## Data

All data is stored in localStorage under the key `kairos-storage`.
Nothing leaves the device. Export via Settings → Export data (JSON).
