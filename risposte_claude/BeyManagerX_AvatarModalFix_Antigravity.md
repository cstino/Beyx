# BeyManager X — Avatar Gallery & Modal Fixes

**Briefing for Antigravity — April 2026**

---

Hey Antigravity — two small but important fixes for the Account page:

1. The avatar gallery shows empty hexagons with question marks instead of proper avatar designs
2. The save button in the Edit Profile modal is hidden behind the bottom navigation bar

Both are quick fixes. Let's go.

---

## 1. Avatar Gallery: Add Real Designs

The current gallery renders empty hexagons because `AvatarHex` only shows the user's initial — which isn't available in the preset gallery context. The home screen profile card has it right: a **yellow hexagon with the stylized blader icon** (the mask-like face with the spiky bottom). We should use that same style for all presets, just with different colors.

### The Approach

Create a reusable `BladerMaskIcon` that renders the same stylized blader face in any color. The hex frame stays the same — only the mask color changes. This gives 8 visually distinct avatars that all feel part of the same visual system.

### New Component: `BladerMaskIcon.jsx`

SVG reproduction of the blader mask you already use on the home screen:

```jsx
// components/BladerMaskIcon.jsx
// The stylized blader face used inside hexagonal avatars.
// Same shape across all avatars — only the color changes.

export function BladerMaskIcon({ size = 40, color = '#1A0E00' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top visor bar with diagonal stripes */}
      <rect
        x="10" y="18" width="44" height="12"
        rx="2"
        fill={color}
      />
      {/* Visor highlights — two angled stripes */}
      <polygon points="20,20 26,20 22,28 16,28" fill="rgba(255,255,255,0.25)" />
      <polygon points="34,20 40,20 36,28 30,28" fill="rgba(255,255,255,0.25)" />

      {/* Mouth guard — jagged teeth pattern */}
      <path
        d="M 14 38 L 50 38 L 50 44
           L 46 50 L 42 44 L 38 50 L 34 44
           L 30 50 L 26 44 L 22 50 L 18 44 Z"
        fill={color}
      />
    </svg>
  );
}
```

### Updated `AvatarHex.jsx`

Replace the current implementation with a version that renders the mask icon inside the hex. Keep support for the initial-only fallback (useful for guest players without a picked avatar):

```jsx
// components/AvatarHex.jsx
// Hexagonal avatar with stylized blader mask inside.

import { BladerMaskIcon } from './BladerMaskIcon';

export const AVATAR_PRESETS = [
  { id: 'gold',    bg: '#F5A623', glow: 'rgba(245,166,35,0.4)' },
  { id: 'red',     bg: '#E94560', glow: 'rgba(233,69,96,0.4)' },
  { id: 'blue',    bg: '#4361EE', glow: 'rgba(67,97,238,0.4)' },
  { id: 'green',   bg: '#00D68F', glow: 'rgba(0,214,143,0.4)' },
  { id: 'purple',  bg: '#A855F7', glow: 'rgba(168,85,247,0.4)' },
  { id: 'cyan',    bg: '#06B6D4', glow: 'rgba(6,182,212,0.4)' },
  { id: 'crimson', bg: '#DC2626', glow: 'rgba(220,38,38,0.4)' },
  { id: 'mint',    bg: '#10B981', glow: 'rgba(16,185,129,0.4)' },
];

export function AvatarHex({
  avatarId = 'gold',
  username,                // optional — only used as a fallback
  size = 68,
  showMask = true,         // set to false for guest/fallback-only rendering
}) {
  const preset = AVATAR_PRESETS.find(p => p.id === avatarId) ?? AVATAR_PRESETS[0];
  const maskSize = size * 0.58;

  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: size,
        height: size,
        filter: `drop-shadow(0 0 12px ${preset.glow})`,
      }}
    >
      <svg viewBox="0 0 80 80" className="w-full h-full absolute">
        {/* Main hex fill */}
        <polygon
          points="40,4 72,22 72,58 40,76 8,58 8,22"
          fill={preset.bg}
          stroke="#E94560"
          strokeWidth="1.5"
        />
        {/* Inner outline for depth */}
        <polygon
          points="40,10 68,25 68,55 40,70 12,55 12,25"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.5"
        />
      </svg>

      {/* Blader mask icon centered */}
      {showMask ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <BladerMaskIcon size={maskSize} color="#1A0E00" />
        </div>
      ) : (
        /* Fallback: username initial — used for guest players */
        <div
          className="absolute inset-0 flex items-center justify-center font-black text-[#1A0E00]"
          style={{ fontSize: size * 0.4 }}
        >
          {username?.[0]?.toUpperCase() ?? '?'}
        </div>
      )}
    </div>
  );
}
```

### Result

The profile page hero now renders the familiar yellow hex with blader mask — matching the home screen. The preset gallery shows all 8 color variants, each with its own glow color. Selecting a new preset updates the hex instantly because only the background color changes — the mask icon stays the same.

> 💡 Keep the `username` prop on `AvatarHex` for a subtle reason: when rendering avatars for *guest players* in the Battle flow (players without a registered account), they don't have an `avatar_id`. Pass `showMask={false}` and the initial-based fallback kicks in. Registered users always get the mask.

### Where to Update Usages

The `AvatarHex` signature stays the same for registered user calls — just remove the `color` prop from existing usages (it's now derived from `avatarId` internally):

```jsx
// Before:
<AvatarHex avatarId={profile.avatar_id} color={profile.avatar_color} username={profile.username} size={88} />

// After:
<AvatarHex avatarId={profile.avatar_id} size={88} />

// For guest players in Battle:
<AvatarHex avatarId="gold" username={guestName} size={40} showMask={false} />
```

You can also safely drop the `avatar_color` column read from `profiles` — the color is derived from `avatar_id`. The column can stay in the DB for now, just don't query or write it anymore.

---

## 2. Edit Profile Modal: Fix the Save Button

The modal content is scrollable (`overflow-y-auto max-h-[85vh]`), but the save button is inside the scroll area AND the modal is rendered above the bottom navigation — so the button can end up hidden behind the nav bar at the bottom of the screen.

### Two Parts to the Fix

**A. Pin the save button to the bottom of the modal** instead of letting it scroll with the form content. This way it's always visible regardless of how far the user has scrolled.

**B. Use `max-h-[90vh]` + flex column layout** so the scroll area takes all available space except what the fixed footer needs.

### Updated Modal Layout

Replace the modal body in `EditProfileModal.jsx`:

```jsx
// components/account/EditProfileModal.jsx — structural changes

return (
  <AnimatePresence>
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    />

    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden
        bg-[#12122A] border-t border-[#4361EE]/30
        flex flex-col"
      style={{ maxHeight: '90vh' }}
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
    >
      {/* Drag handle — always at top, never scrolls */}
      <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>

      {/* Header — always at top, never scrolls */}
      <div className="px-5 pt-3 pb-4 flex items-center justify-between flex-shrink-0">
        <div className="text-white text-lg font-black uppercase tracking-tight">
          Modifica Profilo
        </div>
        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-white/40">
          <X size={18} />
        </button>
      </div>

      {/* SCROLLABLE content area — takes all available space */}
      <div className="px-5 overflow-y-auto flex-1 pb-4">
        {/* Avatar gallery */}
        <div className="mb-5">
          <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3">
            SELEZIONA AVATAR
          </div>
          <div className="grid grid-cols-4 gap-3">
            {AVATAR_PRESETS.map(preset => {
              const selected = avatarId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setAvatarId(preset.id)}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all
                    ${selected
                      ? 'ring-2 ring-[#4361EE] scale-105 bg-white/5'
                      : 'opacity-70 hover:opacity-100'}`}
                >
                  <AvatarHex avatarId={preset.id} size={56} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Username input */}
        <div className="mb-5">
          <div className="text-[10px] font-bold text-[#4361EE] tracking-[0.15em] mb-2">
            NOME BLADER
          </div>
          <input
            type="text" maxLength={20}
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Inserisci nome..."
            className="w-full p-3 rounded-xl bg-[#1A1A3A] border border-white/10
              text-white font-bold outline-none focus:border-[#4361EE]/50
              placeholder-white/30"
          />
        </div>

        {/* Title picker */}
        <div>
          <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-2">
            SCEGLI TITOLO
          </div>
          <div className="flex flex-wrap gap-2">
            {TITLE_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => setTitle(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors
                  ${title === t
                    ? 'bg-[#4361EE]/15 border-[#4361EE]/60 text-[#4361EE]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
                style={title === t ? { boxShadow: '0 0 12px -2px rgba(67,97,238,0.4)' } : undefined}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FIXED FOOTER — always visible, outside the scroll area */}
      <div
        className="px-5 py-4 border-t border-white/5 bg-[#12122A] flex-shrink-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-xl font-bold tracking-wider text-white disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #E94560, #C9304A)',
            boxShadow: '0 4px 20px -4px rgba(233,69,96,0.5)',
          }}
        >
          {saving ? 'SALVATAGGIO…' : 'SALVA'}
        </button>
      </div>
    </motion.div>
  </AnimatePresence>
);
```

### Key Changes Explained

- **`flex flex-col` on the modal** — turns it into a vertical flex container so the header, scroll area, and footer can properly share space.
- **`flex-shrink-0` on drag handle, header, and footer** — these stay their natural size. Only the scroll area flexes.
- **`flex-1` + `overflow-y-auto` on the content div** — the form fields take all remaining space and scroll internally when needed.
- **`border-t` separator on the footer** — a thin divider that visually signals the save button is "anchored" and outside the scroll flow.
- **`env(safe-area-inset-bottom)` padding** — respects the iPhone home indicator. Without this, on iOS the button can sit too close to the bottom edge or get covered by the indicator bar.
- **`max-h-[90vh]`** instead of `max-h-[85vh]` — 5% more room for content, which matters on shorter phones.

> 💡 The same fixed-footer pattern should be applied to any future modal with a primary action (e.g. the Battle outcome confirmation, saving a combo, etc.). It's a simple rule: "primary action always visible, regardless of scroll." Consider extracting this as a reusable `BottomSheetModal` wrapper later — but for now, the copy-paste approach is fine.

---

## 3. Implementation Checklist

1. **Create `components/BladerMaskIcon.jsx`** — the reusable blader mask SVG
2. **Update `components/AvatarHex.jsx`** — use the new mask icon, update PRESETS with `glow` color
3. **Update `components/account/EditProfileModal.jsx`** — flex layout with fixed footer
4. **Remove `color` prop** from existing `AvatarHex` usages (optional cleanup, not blocking)
5. **Test on mobile** — scroll through the title list and confirm the SAVE button remains visible

---

*End of Briefing — BeyManager X Avatar & Modal Fixes — April 2026*
