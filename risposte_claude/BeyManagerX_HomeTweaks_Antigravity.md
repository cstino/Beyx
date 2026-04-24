# BeyManager X — Home Screen: Navigation Tweaks

**Briefing for Antigravity — April 2026**

---

Hey Antigravity — three small but meaningful home screen changes based on user feedback. The goal is to turn the stat cards from pure counters into proper navigation shortcuts, remove dead UI, and stub out the unimplemented tabs so they don't break the user's mental model.

---

## 1. Make Stat Cards Tappable

The "PARTI" and "COMBO" cards currently just display numbers. They should navigate to their respective sections on tap — the counts become an entry point, not just feedback.

### Updated `StatCard.jsx`

Add an `onClick` prop and wrap everything in a button. Keep all the existing styling:

```jsx
// components/StatCard.jsx
// Compact metric card with a colored left accent stripe.
// Now tappable — navigates to the relevant section.

import { motion } from 'framer-motion';

export function StatCard({ label, value, total, subtitle, accentColor, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="bg-[#12122A] rounded-xl p-3.5 relative overflow-hidden
        text-left w-full transition-colors hover:bg-[#16163A]"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      <div
        className="text-[9px] font-extrabold tracking-[0.15em] mb-1"
        style={{ color: accentColor }}
      >
        {label.toUpperCase()}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-[28px] font-black text-white leading-none tabular-nums">
          {value}
        </span>
        {total != null && (
          <span className="text-[11px] text-white/40 font-semibold">
            /{total}
          </span>
        )}
      </div>

      <div className="text-[9px] text-white/35 mt-1.5 tracking-wider font-semibold uppercase">
        {subtitle}
      </div>
    </motion.button>
  );
}
```

### Update `HomePage.jsx`

Wire each card to its destination. "PARTI" goes to the Collection tab, "COMBO" goes to the Builder tab (with a flag to show saved combos):

```jsx
// pages/HomePage.jsx — inside the return statement

<div className="grid grid-cols-2 gap-2.5 mx-4 mt-4 mb-4">
  <StatCard
    label="Parti"
    value={parts.owned}
    total={parts.total}
    subtitle="In collezione"
    accentColor="#4361EE"
    onClick={() => navigate('/collection')}
  />
  <StatCard
    label="Combo"
    value={combos.count}
    subtitle="Creati da te"
    accentColor="#E94560"
    onClick={() => navigate('/builder?view=saved')}
  />
</div>
```

### Builder Page — Handle the `?view=saved` Query Param

When Builder opens with `?view=saved`, it should show the user's saved combos list instead of (or above) the empty builder interface:

```jsx
// pages/BuilderPage.jsx

import { useSearchParams } from 'react-router-dom';

export function BuilderPage() {
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get('view') === 'saved' ? 'saved' : 'build';
  const [view, setView] = useState(initialView);

  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-24">
      {/* Top tabs: Build | Saved */}
      <div className="flex gap-2 mx-4 mt-4 mb-6 p-1 bg-[#12122A] rounded-xl">
        <button
          onClick={() => setView('build')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold tracking-wider transition-colors
            ${view === 'build'
              ? 'bg-[#E94560] text-white'
              : 'text-white/50 hover:text-white/80'}`}
        >
          BUILD
        </button>
        <button
          onClick={() => setView('saved')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold tracking-wider transition-colors
            ${view === 'saved'
              ? 'bg-[#E94560] text-white'
              : 'text-white/50 hover:text-white/80'}`}
        >
          SAVED
        </button>
      </div>

      {view === 'build' ? <ComboBuilder /> : <SavedCombosList />}
    </div>
  );
}
```

If you already have a saved combos view elsewhere, just make sure the Builder tab renders it when the query param is set. No need to restructure if it already works differently — the key requirement is that tapping the "COMBO" card on home lands the user on their saved combos list.

---

## 2. Remove the "Analizza Meta & Combo" Button

The CTA button at the bottom of the home screen should be removed entirely. It adds visual weight without a real destination yet.

### Update `HomePage.jsx`

Delete this block:

```jsx
{/* REMOVE THIS ENTIRE BLOCK */}
<div className="mx-4 mt-4">
  <PrimaryCTA
    label="ANALIZZA META & COMBO"
    onClick={() => navigate('/meta')}
  />
</div>
```

You can keep the `PrimaryCTA` component file — it'll be useful later for other primary actions. Just remove the import from `HomePage.jsx` if it's no longer used there.

> 💡 With the CTA gone, the Top Bladers section becomes the last element before the bottom nav. That's actually a better visual ending — the leaderboard naturally invites scrolling, and the home screen feels less "salesy" without the big pink button.

---

## 3. Stub Out Battle & Account Tabs

The Battle and Account tabs currently have no functionality. Instead of redirecting to home (which is confusing — the user taps and nothing apparent happens), show a clean **"Coming Soon"** placeholder page for each. This maintains the user's mental model: each tab leads somewhere, it's just not ready yet.

### Create `ComingSoon.jsx`

A reusable component with an icon, a message, and the app's visual language:

```jsx
// components/ComingSoon.jsx

import { motion } from 'framer-motion';

export function ComingSoon({ icon: Icon, title, description, accentColor = '#E94560' }) {
  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-24 px-6 flex flex-col items-center justify-center">
      {/* Animated icon container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative mb-6"
      >
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-2xl blur-2xl opacity-40"
          style={{ background: accentColor }}
        />
        <div
          className="relative w-20 h-20 rounded-2xl flex items-center justify-center border"
          style={{
            background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
            borderColor: `${accentColor}40`,
          }}
        >
          <Icon size={36} style={{ color: accentColor }} strokeWidth={2} />
        </div>
      </motion.div>

      {/* Badge */}
      <div
        className="text-[10px] font-extrabold tracking-[0.2em] mb-2 px-3 py-1 rounded-full"
        style={{
          color: accentColor,
          background: `${accentColor}15`,
          border: `1px solid ${accentColor}30`,
        }}
      >
        PROSSIMAMENTE
      </div>

      {/* Title */}
      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2 text-center">
        {title}
      </h2>

      {/* Description */}
      <p className="text-white/50 text-sm text-center max-w-xs leading-relaxed">
        {description}
      </p>

      {/* Subtle animated loader dots */}
      <div className="flex gap-1.5 mt-8">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: accentColor }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### Create `BattlePage.jsx`

```jsx
// pages/BattlePage.jsx

import { Swords } from 'lucide-react';
import { ComingSoon } from '../components/ComingSoon';

export function BattlePage() {
  return (
    <ComingSoon
      icon={Swords}
      title="Battle Arena"
      description="Registra le tue battaglie, traccia le statistiche e scala la classifica con i tuoi amici."
      accentColor="#E94560"
    />
  );
}
```

### Create `AccountPage.jsx`

```jsx
// pages/AccountPage.jsx

import { User } from 'lucide-react';
import { ComingSoon } from '../components/ComingSoon';

export function AccountPage() {
  return (
    <ComingSoon
      icon={User}
      title="Account"
      description="Gestisci il tuo profilo, personalizza il tuo avatar e sblocca achievement."
      accentColor="#4361EE"
    />
  );
}
```

### Update Routes

In your router config, make sure both paths point to the new pages (not home):

```jsx
// App.jsx or your router config

<Route path="/battle" element={<BattlePage />} />
<Route path="/account" element={<AccountPage />} />
```

> 💡 Each Coming Soon page uses a different accent color (red for Battle, blue for Account) matching the overall palette. This small detail makes the stubs feel intentional and part of the app, not placeholder pages.

---

## 4. Implementation Checklist

1. **Update `StatCard.jsx`** — add `onClick` prop, wrap in motion.button
2. **Update `HomePage.jsx`** — pass onClick to both StatCards, remove the PrimaryCTA block
3. **Update `BuilderPage.jsx`** — handle `?view=saved` query param to show saved combos list
4. **Create `ComingSoon.jsx`** — shared placeholder component
5. **Create `BattlePage.jsx`** — uses ComingSoon
6. **Create `AccountPage.jsx`** — uses ComingSoon
7. **Update router** — point `/battle` and `/account` to the new pages

No other changes needed. All edits are additive or simple removals — no refactoring of existing components.

---

*End of Briefing — BeyManager X Home Tweaks — April 2026*
