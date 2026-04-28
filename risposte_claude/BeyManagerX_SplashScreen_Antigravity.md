# BeyManager X — Splash Screen: GO SHOOT! Countdown

**Briefing for Antigravity — April 2026**

---

Hey Antigravity — vogliamo una splash screen animata che si mostra all'apertura dell'app, prima del rendering della Home. Deve avere lo stile di un gioco di corse: logo centrato, poi countdown numerico con numeri che appaiono in grande e svaniscono, chiusura con "GO SHOOT!" esplosivo, e transizione verso l'app.

Il logo `beyx.svg` è già nel progetto. La splash screen appare **una sola volta** per sessione (non ad ogni cambio pagina).

---

## 1. Componente `SplashScreen.jsx`

```jsx
// components/SplashScreen.jsx

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHASES = [
  { key: 'logo',   duration: 1800 },  // Logo appears + holds
  { key: '3',      duration: 800 },
  { key: '2',      duration: 800 },
  { key: '1',      duration: 800 },
  { key: 'go',     duration: 1200 },   // GO SHOOT! holds longer
  { key: 'exit',   duration: 600 },    // Fade out
];

export function SplashScreen({ onComplete }) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    if (phaseIndex >= PHASES.length) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setPhaseIndex(prev => prev + 1);
    }, PHASES[phaseIndex].duration);

    return () => clearTimeout(timer);
  }, [phaseIndex, onComplete]);

  const currentPhase = PHASES[phaseIndex]?.key;

  // After all phases, render nothing (App takes over)
  if (phaseIndex >= PHASES.length) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: '#0A0A1A' }}
      animate={currentPhase === 'exit' ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background pulse ring — appears during countdown */}
      {['3', '2', '1', 'go'].includes(currentPhase) && (
        <motion.div
          key={`ring-${currentPhase}`}
          className="absolute rounded-full border-2"
          style={{
            borderColor: currentPhase === 'go' ? '#E94560' : '#4361EE',
          }}
          initial={{ width: 80, height: 80, opacity: 0.6 }}
          animate={{ width: 600, height: 600, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}

      {/* Subtle radial glow behind content */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full blur-[120px] opacity-20"
        style={{
          background: currentPhase === 'go'
            ? 'radial-gradient(circle, #E94560, transparent)'
            : 'radial-gradient(circle, #4361EE, transparent)',
          transition: 'background 0.3s',
        }}
      />

      <AnimatePresence mode="wait">
        {/* ─── LOGO PHASE ─── */}
        {currentPhase === 'logo' && (
          <motion.div
            key="logo"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{
              enter: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
              exit: { duration: 0.3 },
            }}
          >
            <img
              src="/beyx.svg"
              alt="BeyManager X"
              className="w-48 h-auto drop-shadow-2xl"
            />

            {/* Subtle tagline under the logo */}
            <motion.div
              className="text-[10px] font-extrabold tracking-[0.3em] text-white/30 uppercase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Collection &bull; Build &bull; Battle
            </motion.div>
          </motion.div>
        )}

        {/* ─── COUNTDOWN NUMBERS ─── */}
        {['3', '2', '1'].includes(currentPhase) && (
          <motion.div
            key={`num-${currentPhase}`}
            className="relative"
            initial={{ opacity: 0, scale: 3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              enter: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
              exit: { duration: 0.2 },
            }}
          >
            {/* Number */}
            <span
              className="text-[120px] font-black tabular-nums leading-none select-none"
              style={{
                color: 'transparent',
                WebkitTextStroke: '3px #4361EE',
                filter: 'drop-shadow(0 0 30px rgba(67,97,238,0.6))',
              }}
            >
              {currentPhase}
            </span>

            {/* Solid fill layered on top for depth */}
            <span
              className="absolute inset-0 flex items-center justify-center
                text-[120px] font-black tabular-nums leading-none select-none"
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #4361EE 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {currentPhase}
            </span>
          </motion.div>
        )}

        {/* ─── GO SHOOT! ─── */}
        {currentPhase === 'go' && (
          <motion.div
            key="go"
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 2.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 12,
              stiffness: 200,
            }}
          >
            {/* GO text */}
            <motion.div
              className="text-[72px] font-black leading-none uppercase select-none tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #E94560 0%, #FF6B85 50%, #F5A623 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 40px rgba(233,69,96,0.8))',
              }}
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: 1,
                ease: 'easeInOut',
              }}
            >
              GO
            </motion.div>

            {/* SHOOT! text */}
            <motion.div
              className="text-[48px] font-black leading-none uppercase select-none tracking-[0.1em]"
              style={{
                color: '#FFFFFF',
                textShadow: '0 0 30px rgba(233,69,96,0.6), 0 0 60px rgba(233,69,96,0.3)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              SHOOT!
            </motion.div>

            {/* Accent line under SHOOT */}
            <motion.div
              className="h-1 rounded-full"
              style={{ background: 'linear-gradient(90deg, #E94560, #F5A623)' }}
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom accent line — always visible, pulses with countdown */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{
          background: currentPhase === 'go'
            ? 'linear-gradient(90deg, transparent, #E94560, transparent)'
            : 'linear-gradient(90deg, transparent, #4361EE, transparent)',
          transition: 'background 0.3s',
        }}
        animate={{
          opacity: ['3', '2', '1', 'go'].includes(currentPhase) ? [0.3, 1, 0.3] : 0.15,
        }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
    </motion.div>
  );
}
```

---

## 2. Integrazione in `App.jsx`

La splash screen appare una sola volta per sessione. Usa uno state al top level:

```jsx
// App.jsx

import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SplashScreen } from './components/SplashScreen';
import { BottomNav } from './components/BottomNav';
// ... other imports

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  // Show splash screen first
  if (!splashDone) {
    return <SplashScreen onComplete={() => setSplashDone(true)} />;
  }

  // Normal app after splash
  return (
    <BrowserRouter>
      <Routes>
        {/* ... all your existing routes ... */}
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}
```

> 💡 **Perché `useState` e non `sessionStorage`?** Con `useState`, la splash screen appare una volta per caricamento dell'app. Se l'utente refresha la pagina, la rivede (che è il comportamento desiderato per una PWA — ogni apertura è una "sessione"). Se preferisci che NON appaia al refresh durante la stessa sessione del browser, usa `sessionStorage`:

```jsx
// Alternativa con sessionStorage (splash solo una volta per sessione browser)
const [splashDone, setSplashDone] = useState(
  () => sessionStorage.getItem('splashDone') === 'true'
);

function handleSplashComplete() {
  sessionStorage.setItem('splashDone', 'true');
  setSplashDone(true);
}
```

---

## 3. Timing e Animazioni — Breakdown

Ecco il flow temporale completo dalla prima all'ultima frame:

```
t=0.0s    │ Schermo nero
t=0.0s    │ Logo beyx.svg appare (scale 0.7→1, fade in) ── 0.6s animazione
t=0.6s    │ Tagline "Collection • Build • Battle" fade in ── 0.5s
t=1.8s    │ Logo esce (scale→0.9, fade, slide up) ── 0.3s
          │
t=2.1s    │ "3" appare (scale 3→1, fade in) + pulse ring blu
t=2.1s    │   Numero: stroke blu + fill gradient bianco→blu
t=2.9s    │ "3" esce (scale→0.5, fade out)
          │
t=2.9s    │ "2" appare ── stessa animazione
t=3.7s    │ "2" esce
          │
t=3.7s    │ "1" appare ── stessa animazione
t=4.5s    │ "1" esce
          │
t=4.5s    │ "GO" appare (scale 2.5→1, spring bounce) + pulse ring ROSSO
t=4.5s    │   Testo: gradient rosso→rosa→oro, glow rosso
t=4.65s   │ "SHOOT!" appare sotto GO (fade + slide up)
t=4.8s    │ Linea rossa→oro si espande sotto SHOOT
t=4.5s    │ GO pulsa (scale 1→1.05→1) due volte
          │
t=5.7s    │ Tutto lo schermo fade out (opacity→0) ── 0.5s
t=6.2s    │ Splash completa → App visibile
```

**Tempo totale: ~6 secondi.** Abbastanza per essere d'impatto, non abbastanza per essere noioso.

---

## 4. Dettagli Visivi

### Numeri del countdown (3, 2, 1)
- **Dimensione**: 120px, font-black
- **Stile**: doppio layer per effetto depth:
  - Layer 1 (dietro): solo stroke blu `#4361EE` da 3px, trasparente dentro
  - Layer 2 (davanti): fill con gradient verticale bianco→blu
- **Glow**: `drop-shadow(0 0 30px rgba(67,97,238,0.6))`
- **Animazione entrata**: parte da scale 3x (enorme, fuori schermo) e arriva a 1x con easing aggressivo
- **Animazione uscita**: shrink a 0.5x con fade

### GO SHOOT!
- **"GO"**: 72px, gradient 3 colori (rosso→rosa→oro), glow rosso intenso, pulsazione scale
- **"SHOOT!"**: 48px, bianco puro con text-shadow rosso, appare 150ms dopo GO con slide up
- **Linea sotto**: gradient rosso→oro, si espande da 0 a 120px
- **Pulse ring**: rosso invece di blu (cambio colore dal countdown)

### Background
- Sfondo solido `#0A0A1A` (stesso dell'app)
- Glow radiale dietro il contenuto (blu durante countdown, rosso durante GO SHOOT)
- Linea bottom che pulsa con il countdown
- Pulse ring che si espande dal centro ad ogni fase

---

## 5. Considerazioni PWA

### Evitare il "flash" bianco all'apertura
Il `background-color` nel `manifest.json` e nel `<meta name="theme-color">` devono essere `#0A0A1A` (lo stesso dello splash screen):

```json
// manifest.json
{
  "background_color": "#0A0A1A",
  "theme_color": "#0A0A1A"
}
```

```html
<!-- index.html -->
<meta name="theme-color" content="#0A0A1A" />
```

Questo garantisce che il browser/OS mostri il colore corretto prima ancora che React si avvii — niente flash bianco.

### Performance
La splash screen non deve caricare nulla di pesante. Tutto è CSS + SVG (il logo) + Framer Motion (già nel bundle). Nessuna chiamata API, nessuna immagine esterna. Il rendering è istantaneo.

---

## 6. Skip Opzionale (Tap to Skip)

Per gli utenti impazienti, aggiungi un "tap to skip" invisibile che appare dopo 2 secondi:

```jsx
// Aggiungi dentro SplashScreen, dopo l'AnimatePresence:

{phaseIndex >= 1 && (
  <motion.button
    onClick={() => {
      setPhaseIndex(PHASES.length);
      onComplete();
    }}
    className="absolute bottom-12 text-white/20 text-[10px] font-bold
      tracking-[0.2em] uppercase"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.5 }}
  >
    TOCCA PER SALTARE
  </motion.button>
)}
```

> 💡 Il testo "TOCCA PER SALTARE" è intenzionalmente poco visibile (opacity 20%). Chi lo cerca lo trova, chi si gode l'animazione non viene distratto.

---

## 7. File Structure

```
components/
└── SplashScreen.jsx     ← nuovo file
```

Modifiche a file esistenti:
- `App.jsx` — wrapper condizionale con `splashDone` state
- `manifest.json` — verifica `background_color: "#0A0A1A"`
- `index.html` — verifica `<meta name="theme-color" content="#0A0A1A">`

Nessuna dipendenza aggiuntiva — usa solo Framer Motion (già installato) e il logo SVG già presente.

---

## 8. Checklist Implementazione

1. ✅ **Crea `components/SplashScreen.jsx`** — copia il componente di questo briefing
2. ✅ **Aggiorna `App.jsx`** — aggiungi stato `splashDone` e rendering condizionale
3. ✅ **Verifica `manifest.json`** — `background_color` e `theme_color` impostati a `#0A0A1A`
4. ✅ **Verifica `index.html`** — meta `theme-color` a `#0A0A1A`
5. ✅ **Verifica che `beyx.svg`** sia accessibile da `/beyx.svg` (nella cartella `public/`)
6. ✅ **Test su mobile** — verifica la sequenza di animazione completa e il timing
7. ✅ **Test skip** — tocca durante il countdown e verifica che salti subito all'app

---

*End of Briefing — BeyManager X Splash Screen — April 2026*
