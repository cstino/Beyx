# BeyManager X — Post-Deploy Bug Fixes

**Briefing for Antigravity — April 2026**

---

Hey Antigravity — the app is deployed on Vercel and the user is testing on iPhone. Four issues to fix:

1. **Logo collides with the iPhone Dynamic Island and status bar** — needs safe-area padding
2. **Builder shows all parts as "owned"** + sticky header has a transparency gap at the top
3. **Saved combos cards are visually weak** — need redesign with composed title + part chips + click-through
4. **Avatar gallery shows empty squares** — images aren't loading from Supabase Storage

Let's go through them in order.

---

## 1. Header Safe Area Fix

The "BEYMANAGERX" logo sits flush against the top of the viewport, which on iPhones with Dynamic Island or notch causes it to overlap with both the status bar (clock/battery) and the Dynamic Island itself.

### Root Cause

The page wrapper doesn't respect `env(safe-area-inset-top)`. PWAs in standalone mode (when added to home screen) need explicit safe-area handling because the OS overlays UI elements without leaving padding.

### Fix Part A — Update `index.html` viewport meta

Make sure the viewport meta tag in `index.html` declares safe-area support:

```html
<!-- index.html -->
<meta name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

The critical part is `viewport-fit=cover` — without it, `env(safe-area-inset-*)` returns 0 even on notched devices.

### Fix Part B — Apply safe-area padding to top-level page wrappers

For every full-screen page (Home, Builder, Battle, Account, Collection), add safe-area top padding. The cleanest way is a shared wrapper or a Tailwind utility class.

**Option 1 — Inline style on each page** (simplest, no shared component refactor):

```jsx
// pages/HomePage.jsx (and apply same pattern to all other top-level pages)

export function HomePage() {
  // ... existing code

  return (
    <div
      className="min-h-screen bg-[#0A0A1A] pb-24"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
    >
      {/* Logo header */}
      <div className="px-5 pb-5">
        <Logo size="md" />
      </div>

      {/* ... rest unchanged */}
    </div>
  );
}
```

**Option 2 — Reusable `PageContainer` component** (cleaner, recommended):

```jsx
// components/PageContainer.jsx

export function PageContainer({ children, className = '' }) {
  return (
    <div
      className={`min-h-screen bg-[#0A0A1A] pb-24 ${className}`}
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
    >
      {children}
    </div>
  );
}

// Usage in any page:
// <PageContainer>...</PageContainer>
```

The `+ 12px` provides breathing room between the status bar and the logo. Adjust to `+ 16px` if you want more space, or `+ 8px` for tighter.

### Files to Update

- `pages/HomePage.jsx`
- `pages/CollectionPage.jsx`
- `pages/BuilderPage.jsx`
- `pages/BattlePage.jsx` (the new tile-based version)
- `pages/AccountPage.jsx`
- Any other top-level route

---

## 2. Builder: Wrong "Owned" State + Header Transparency Gap

Two distinct issues on the Builder screen.

### 2A. All Parts Showing as Owned (Green Checkmark)

Every part in the Builder list shows the green checkmark, regardless of whether the user actually owns it. The user has 14/136 parts in their collection — this is clearly wrong.

**Diagnosis**: the `PartCard` rendering in the Builder is likely either:
- Not querying the `user_collections` table to determine ownership
- Defaulting `isOwned` to `true` somewhere in the data flow
- Querying the wrong field or comparing wrong IDs

### Fix: Query Owned Parts and Pass to PartCard

In the Builder data fetching logic (likely `BuilderPage.jsx` or a hook like `useBuilderData`), fetch the user's collection alongside the parts list and compute the owned set:

```jsx
// pages/BuilderPage.jsx (or relevant data hook)

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';

export function BuilderPage() {
  const userId = useAuthStore(s => s.user?.id);
  const [activeTab, setActiveTab] = useState('blade'); // 'blade' | 'ratchet' | 'bit'
  const [parts, setParts] = useState([]);
  const [ownedIds, setOwnedIds] = useState(new Set());

  // Fetch parts for the active tab
  useEffect(() => {
    const table = activeTab === 'blade' ? 'blades'
                : activeTab === 'ratchet' ? 'ratchets'
                : 'bits';

    supabase.from(table)
      .select('*')
      .order('name')
      .then(({ data }) => setParts(data ?? []));
  }, [activeTab]);

  // Fetch user's collection — owned part IDs
  useEffect(() => {
    if (!userId) return;
    supabase.from('user_collections')
      .select('part_id, part_type')
      .eq('user_id', userId)
      .then(({ data }) => {
        // Build a Set of owned IDs filtered to current part type
        const owned = new Set(
          (data ?? [])
            .filter(c => c.part_type === activeTab)
            .map(c => c.part_id)
        );
        setOwnedIds(owned);
      });
  }, [userId, activeTab]);

  // Render
  return (
    <PageContainer>
      {/* ... existing tabs UI ... */}

      <div className="px-4 pt-4 grid grid-cols-2 gap-3">
        {parts.map(part => (
          <PartCard
            key={part.id}
            part={part}
            isOwned={ownedIds.has(part.id)}   /* ← critical line */
            onClick={() => /* select part */}
          />
        ))}
      </div>
    </PageContainer>
  );
}
```

### Fix the PartCard to Honor `isOwned`

In `components/PartCard.jsx`, ensure the green checkmark is conditional on the `isOwned` prop. Default to `false`:

```jsx
// components/PartCard.jsx

export function PartCard({ part, isOwned = false, onClick }) {
  return (
    <button onClick={() => onClick(part)} className="...">
      {/* Owned indicator — only shown when actually owned */}
      {isOwned && (
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#00D68F]
          flex items-center justify-center">
          <svg viewBox="0 0 24 24" width="14" height="14"
            fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* ... rest of card ... */}
    </button>
  );
}
```

> 💡 **Important**: check that `user_collections` actually has a `part_type` column distinguishing 'blade' / 'ratchet' / 'bit'. If your schema uses separate junction tables or a different structure, adapt the query accordingly. If `part_id` references different tables based on type, you need that type field to filter correctly.

### 2B. Header Has a Transparency Gap When Scrolling

When the user scrolls the parts list, content is visible above the sticky header. This means the header has either:
- No background color
- A semi-transparent background
- Doesn't extend up to the safe-area inset

### Fix: Make the Header Properly Sticky and Opaque

The Builder header (with "CREA COMBO" title, Blade/Ratchet/Bit tabs, and the BLADE/RATCHET/BIT slot indicators) needs:

1. `position: sticky; top: 0` so it stays in place during scroll
2. A solid background that extends INTO the safe area
3. Z-index above the scrolling content

```jsx
// pages/BuilderPage.jsx — header structure

return (
  <div className="min-h-screen bg-[#0A0A1A] pb-24">
    {/* Sticky header — extends into safe area with proper background */}
    <div
      className="sticky top-0 z-20 bg-[#0A0A1A] border-b border-white/5"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
      }}
    >
      <div className="px-4 pb-4">
        <h1 className="text-white text-2xl font-black uppercase tracking-tight">
          Crea Combo
        </h1>
        <div className="text-[#4361EE] text-xs font-bold tracking-[0.15em] mt-1">
          SELEZIONA {activeTab.toUpperCase()}
        </div>

        {/* Slot indicators (BLADE / RATCHET / BIT preview) */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {/* ... existing slot UI ... */}
        </div>

        {/* Tabs (BLADE / RATCHET / BIT switcher) */}
        <div className="flex gap-1 mt-4 p-1 bg-[#12122A] rounded-xl">
          {['blade', 'ratchet', 'bit'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold tracking-wider
                ${activeTab === tab
                  ? 'bg-[#4361EE] text-white'
                  : 'text-white/50'}`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Scrollable parts list — NOT inside the sticky div */}
    <div className="px-4 pt-4 grid grid-cols-2 gap-3">
      {parts.map(part => (
        <PartCard key={part.id} part={part} isOwned={ownedIds.has(part.id)} ... />
      ))}
    </div>
  </div>
);
```

### Key Changes

- `sticky top-0 z-20` on the header — keeps it pinned to the top during scroll
- `bg-[#0A0A1A]` solid background — no transparency means content can't bleed through
- `paddingTop: env(safe-area-inset-top)` IS on the sticky header itself — so the colored background extends all the way up to the screen edge, covering the area behind the status bar
- The scrollable content is a sibling div, not nested inside the sticky element

> 💡 The trick is that the sticky element's background needs to extend into the safe area. Don't put the safe-area padding on a parent wrapper — put it on the sticky header itself, so its colored background covers the status bar area.

---

## 3. Saved Combos Cards Redesign

The current saved combos cards just show a small radar chart with a truncated title — they're functional but ugly and the radar is too small to be readable. The user wants:

- Composed title showing all parts together (e.g., "WizardRod 1-60 Hexa")
- Visual chips for each part (Blade, Ratchet, Bit)
- Tap to open a detail page with full stats

### New `SavedComboCard.jsx`

A horizontal card showing the part chips clearly:

```jsx
// components/builder/SavedComboCard.jsx

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const TYPE_COLORS = {
  attack:  '#E94560',
  defense: '#4361EE',
  stamina: '#F5A623',
  balance: '#A855F7',
};

const TYPE_LABELS = {
  attack:  'ATT',
  defense: 'DEF',
  stamina: 'STA',
  balance: 'BAL',
};

export function SavedComboCard({ combo, onClick }) {
  const accentColor = TYPE_COLORS[combo.combo_type] ?? '#4361EE';
  const typeLabel = TYPE_LABELS[combo.combo_type] ?? '';

  // Compose the full name from selected parts
  const composedName = [
    combo.blade?.name,
    combo.ratchet?.name,
    combo.bit?.name,
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      onClick={() => onClick(combo)}
      whileTap={{ scale: 0.98 }}
      className="w-full bg-[#12122A] rounded-xl overflow-hidden border border-white/5
        hover:border-white/15 transition-colors text-left"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      {/* Top row: type badge + name + chevron */}
      <div className="px-4 pt-3.5 pb-2 flex items-center gap-2">
        <span
          className="text-[9px] font-extrabold tracking-[0.15em] px-2 py-0.5 rounded-md"
          style={{
            color: accentColor,
            background: `${accentColor}15`,
            border: `1px solid ${accentColor}30`,
          }}
        >
          {typeLabel}
        </span>
        <div className="text-white font-extrabold text-base flex-1 truncate uppercase">
          {composedName || combo.name}
        </div>
        <ChevronRight size={16} className="text-white/30" strokeWidth={2.5} />
      </div>

      {/* Part chips row */}
      <div className="px-4 pb-3.5 flex gap-2">
        <PartChip label="BLADE"   value={combo.blade?.name}   />
        <PartChip label="RATCHET" value={combo.ratchet?.name} />
        <PartChip label="BIT"     value={combo.bit?.name}     />
      </div>

      {/* Optional: overall score footer */}
      {combo.overall_score != null && (
        <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5
          flex items-center justify-between">
          <div className="text-[9px] text-white/40 font-semibold tracking-[0.15em]">
            OVERALL SCORE
          </div>
          <div className="text-white font-black text-sm tabular-nums"
            style={{ color: accentColor }}>
            {combo.overall_score}
          </div>
        </div>
      )}
    </motion.button>
  );
}

function PartChip({ label, value }) {
  return (
    <div className="flex-1 bg-[#0A0A1A] rounded-lg px-2.5 py-2 border border-white/5">
      <div className="text-[8px] text-white/40 font-bold tracking-[0.15em] mb-0.5">
        {label}
      </div>
      <div className="text-white text-xs font-bold truncate">
        {value || '—'}
      </div>
    </div>
  );
}
```

### Update the Saved Combos List Query

The Supabase query needs to JOIN the parts so the card can show actual part names:

```jsx
// In your saved combos data fetching

const { data: combos } = await supabase
  .from('combos')
  .select(`
    id,
    name,
    combo_type,
    overall_score,
    is_favorite,
    created_at,
    blade:blade_id(id, name, type, image_url, attributes),
    ratchet:ratchet_id(id, name, attributes, stat_modifiers),
    bit:bit_id(id, name, type, attributes, stat_modifiers)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Render the Cards

```jsx
// In the Builder "Saved" tab view

<div className="px-4 space-y-2.5">
  <h2 className="text-white text-xl font-black uppercase tracking-tight mb-3">
    Le tue Configurazioni
  </h2>

  {combos.map(combo => (
    <SavedComboCard
      key={combo.id}
      combo={combo}
      onClick={(c) => navigate(`/combo/${c.id}`)}
    />
  ))}
</div>
```

### New Detail Page: `ComboDetailPage.jsx`

Tapping a saved combo opens a dedicated page with the full radar chart, stats, and parts:

```jsx
// pages/ComboDetailPage.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StatRadar } from '../components/StatRadar';
import { PageContainer } from '../components/PageContainer';

const TYPE_COLORS = {
  attack: '#E94560', defense: '#4361EE',
  stamina: '#F5A623', balance: '#A855F7',
};

export function ComboDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [combo, setCombo] = useState(null);

  useEffect(() => {
    supabase.from('combos')
      .select(`
        *,
        blade:blade_id(*),
        ratchet:ratchet_id(*),
        bit:bit_id(*)
      `)
      .eq('id', id)
      .single()
      .then(({ data }) => setCombo(data));
  }, [id]);

  if (!combo) return null;

  const accentColor = TYPE_COLORS[combo.combo_type] ?? '#4361EE';
  const composedName = [
    combo.blade?.name, combo.ratchet?.name, combo.bit?.name,
  ].filter(Boolean).join(' ');

  // Compute final stats (blade base + ratchet/bit modifiers)
  const finalStats = computeFinalStats(combo);
  const totalWeight = (combo.blade?.weight ?? 0)
                    + (combo.ratchet?.weight ?? 0)
                    + (combo.bit?.weight ?? 0);

  async function handleDelete() {
    if (!confirm('Eliminare questo combo?')) return;
    await supabase.from('combos').delete().eq('id', id);
    navigate('/builder?view=saved');
  }

  return (
    <PageContainer>
      {/* Header with back button */}
      <div className="px-4 mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 text-white/70">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold tracking-[0.15em]"
            style={{ color: accentColor }}>
            ▲ {combo.combo_type?.toUpperCase()}
          </div>
          <h1 className="text-white text-xl font-black uppercase truncate">
            {composedName}
          </h1>
        </div>
        <button onClick={handleDelete}
          className="p-2 rounded-xl bg-white/5 text-red-400/70 hover:text-red-400">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Radar chart */}
      <div className="mx-4 bg-[#12122A] rounded-2xl p-6 mb-4 flex justify-center">
        <StatRadar stats={finalStats} color={accentColor} size={260} />
      </div>

      {/* Combo metadata */}
      <div className="grid grid-cols-2 gap-2.5 mx-4 mb-4">
        <MetaTile label="Score"
          value={combo.overall_score?.toFixed(1) ?? '—'}
          accent={accentColor} />
        <MetaTile label="Peso"
          value={`${totalWeight.toFixed(1)}g`}
          accent={accentColor} />
      </div>

      {/* Part list */}
      <div className="mx-4 space-y-2 mb-4">
        <PartRow label="BLADE"   part={combo.blade} />
        <PartRow label="RATCHET" part={combo.ratchet} />
        <PartRow label="BIT"     part={combo.bit} />
      </div>
    </PageContainer>
  );
}

function MetaTile({ label, value, accent }) {
  return (
    <div className="bg-[#12122A] rounded-xl p-3.5"
      style={{ borderLeft: `3px solid ${accent}` }}>
      <div className="text-[9px] font-extrabold tracking-[0.15em] mb-1"
        style={{ color: accent }}>{label}</div>
      <div className="text-white font-black text-2xl tabular-nums">{value}</div>
    </div>
  );
}

function PartRow({ label, part }) {
  if (!part) return null;
  return (
    <div className="bg-[#12122A] rounded-xl p-3 flex items-center gap-3">
      {part.image_url && (
        <img src={part.image_url} alt={part.name}
          className="w-12 h-12 object-contain" />
      )}
      <div className="flex-1">
        <div className="text-[9px] text-white/40 font-bold tracking-[0.15em]">
          {label}
        </div>
        <div className="text-white font-bold">{part.name}</div>
      </div>
    </div>
  );
}

function computeFinalStats(combo) {
  const b = combo.blade?.attributes ?? {};
  const r = combo.ratchet?.stat_modifiers ?? {};
  const t = combo.bit?.stat_modifiers ?? {};
  const clamp = v => Math.max(1, Math.min(10, v));

  return {
    attack:           clamp((b.attack ?? 5) + (r.attack ?? 0) + (t.attack ?? 0)),
    defense:          clamp((b.defense ?? 5) + (r.defense ?? 0) + (t.defense ?? 0)),
    stamina:          clamp((b.stamina ?? 5) + (r.stamina ?? 0) + (t.stamina ?? 0)),
    burst_resistance: clamp((b.burst_resistance ?? 5)
                           + (r.burst_resistance ?? 0)
                           + (t.burst_resistance ?? 0)),
    dash_performance: clamp((b.dash_performance ?? 5)
                           + (r.dash_performance ?? 0)
                           + (t.dash_performance ?? 0)),
  };
}
```

### Add the Route

```jsx
// App.jsx or your router config
<Route path="/combo/:id" element={<ComboDetailPage />} />
```

---

## 4. Avatar Gallery Empty: Image Loading Issue

The avatar gallery in the Edit Profile modal shows empty rounded squares — meaning the `<img>` tags are rendering, but the images aren't loading. The user already uploaded the avatars to Supabase Storage.

### Diagnosis Checklist

The issue is one (or more) of these:

1. The bucket isn't actually public, so unauthenticated requests get 403
2. The file naming doesn't match what the code expects (`avatar-1.png` vs `Avatar_1.png` etc.)
3. The bucket name in code doesn't match what's in Supabase
4. The `getPublicUrl` is returning a URL with a missing or wrong path
5. The file extension is different from what's hardcoded (PNG vs JPG vs WEBP)

### Fix: Verify and Debug Each Step

**Step 1 — Verify bucket is public**

In Supabase Studio → Storage → click on the `avatars` bucket → Settings tab. Confirm "Public bucket" is enabled. If not, run:

```sql
UPDATE storage.buckets SET public = true WHERE id = 'avatars';
```

**Step 2 — Verify exact file names**

In Supabase Studio → Storage → `avatars` bucket → confirm the files are named exactly `avatar-1.png`, `avatar-2.png`, etc. (lowercase, hyphen, no spaces, `.png` extension). If naming differs, either rename the files or update the code.

**Step 3 — Test the public URL directly**

Get one of the file URLs and paste it in a new browser tab. The URL pattern is:

```
https://YOUR_PROJECT.supabase.co/storage/v1/object/public/avatars/avatar-1.png
```

If the image loads, the bucket and files are fine — the issue is in the React code. If you get a 400/404, the file/bucket setup is wrong.

**Step 4 — Fix `Avatar.jsx` URL construction**

The previous version of `Avatar.jsx` used `supabase.storage.from('avatars').getPublicUrl('')` and concatenated the filename, which can produce a malformed URL with a trailing slash issue. Use the correct method per file:

```jsx
// components/Avatar.jsx — corrected URL construction

import { supabase } from '../lib/supabase';

export const AVATAR_PRESETS = [
  { id: 'avatar-1' },
  { id: 'avatar-2' },
  { id: 'avatar-3' },
  { id: 'avatar-4' },
  { id: 'avatar-5' },
  { id: 'avatar-6' },
  { id: 'avatar-7' },
  { id: 'avatar-8' },
];

export function getAvatarUrl(avatarId) {
  if (!avatarId) return null;

  // Use Supabase's getPublicUrl per file — it handles the URL construction correctly
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${avatarId}.png`);

  return data?.publicUrl ?? null;
}

export function Avatar({
  avatarId = 'avatar-1',
  username,
  size = 68,
  showFallback = false,
}) {
  const url = getAvatarUrl(avatarId);

  if (showFallback || !url) {
    return (
      <div
        className="rounded-xl flex items-center justify-center font-black
          text-[#0A0A1A] flex-shrink-0"
        style={{
          width: size, height: size,
          fontSize: size * 0.4,
          background: '#F5A623',
        }}
      >
        {username?.[0]?.toUpperCase() ?? '?'}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`Avatar ${avatarId}`}
      style={{ width: size, height: size }}
      className="object-contain flex-shrink-0"
      onError={(e) => {
        // Log error for debugging
        console.error(`Avatar failed to load: ${url}`);
        // Hide broken image icon
        e.currentTarget.style.visibility = 'hidden';
      }}
      onLoad={() => {
        // Optional: log success during dev
        // console.log(`Avatar loaded: ${avatarId}`);
      }}
    />
  );
}
```

**Step 5 — Open browser DevTools to verify**

After deploying the fix, open the app in Chrome/Safari, open DevTools → Network tab, then open the avatar modal. You should see 8 image requests to `*.supabase.co/storage/...`. Check:

- **Status 200** → image is loading correctly. If gallery still shows empty, it's a CSS issue (images might be loading but invisible).
- **Status 403/400** → bucket isn't public. Re-check Step 1.
- **Status 404** → file path/name mismatch. Re-check Step 2.
- **No requests at all** → URL is null/empty. Add `console.log(url)` inside `Avatar` and check what's being constructed.

### Likely Quick Fix

Based on the symptom (empty squares rendering, no broken-image icons visible), the most likely cause is that `<img src>` is being set to an invalid string and the `onError` is hiding the icon. The fix in Step 4 (using `getPublicUrl` per file) typically resolves this.

If after the fix the avatars still don't load, ask the user to share one of the actual public URLs from their Supabase dashboard so we can verify the URL pattern.

---

## 5. Implementation Checklist

1. ✅ **Update `index.html`** — add `viewport-fit=cover`
2. ✅ **Create `components/PageContainer.jsx`** with safe-area top padding
3. ✅ **Replace top wrappers** in HomePage, CollectionPage, BuilderPage, BattlePage, AccountPage
4. ✅ **Fix Builder ownership query** — fetch user_collections and pass `isOwned` to PartCard
5. ✅ **Fix Builder header** — sticky positioning with safe-area padding on the header itself
6. ✅ **Create `SavedComboCard.jsx`** — replace current saved combo cards
7. ✅ **Update saved combos query** — JOIN parts to get full names
8. ✅ **Create `pages/ComboDetailPage.jsx`** + add `/combo/:id` route
9. ✅ **Verify Supabase avatars bucket** is public, files named correctly
10. ✅ **Update `Avatar.jsx`** — use `getPublicUrl` per file with proper extension
11. ✅ **Test end-to-end** on iPhone in Vercel-deployed PWA

---

*End of Briefing — BeyManager X Post-Deploy Fixes — April 2026*
