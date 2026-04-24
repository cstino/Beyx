# BeyManager X — Avatar System & Modal Z-Index Fix

**Briefing for Antigravity — April 2026**

---

Hey Antigravity — two fixes:

1. **Avatar system refactor**: the user is providing custom avatar assets (8 PNG images in mascot/sticker style). We need to drop the SVG-generated avatars and load images from Supabase Storage instead.
2. **Modal save button fix**: the previous fix didn't stick — the SAVE button is still hidden behind the bottom nav bar. This briefing has a more robust solution.

---

## 1. Avatar System: Image-Based Approach

The user will provide 8 PNG avatar images in matching mascot/sticker style (rounded square shape with character inside, transparent background, consistent art style). These will be uploaded to Supabase Storage and referenced by ID.

### Expected Asset Setup (User's Side)

The user will upload files to Supabase Storage with this structure:

```
bucket: avatars/
├── avatar-1.png
├── avatar-2.png
├── avatar-3.png
├── avatar-4.png
├── avatar-5.png
├── avatar-6.png
├── avatar-7.png
└── avatar-8.png
```

- **Format**: PNG with transparent background
- **Dimensions**: square, ~256x256px recommended (served as-is, CSS handles resize)
- **Bucket visibility**: public (read access without auth)

### Storage Bucket Setup SQL

If the bucket doesn't exist yet, create it with public read access:

```sql
-- Create the avatars bucket (run once via Supabase dashboard or SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read policy: anyone can read avatar images
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

### Replacement: `AvatarHex.jsx` → `Avatar.jsx`

The component no longer renders a hexagonal SVG — it's simply an `<img>` wrapped in a sized container. This is more flexible, respects the sticker style, and removes all the color/mask logic that was getting in the way.

```jsx
// components/Avatar.jsx
// Image-based avatar. Loads from Supabase Storage by avatar_id.

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

// Cache the base URL once
const AVATARS_BUCKET_URL = supabase.storage
  .from('avatars')
  .getPublicUrl('')
  .data
  .publicUrl;

export function getAvatarUrl(avatarId) {
  if (!avatarId) return null;
  return `${AVATARS_BUCKET_URL}${avatarId}.png`;
}

export function Avatar({
  avatarId = 'avatar-1',
  username,           // fallback for guests without an avatar
  size = 68,
  showFallback = false,  // true = show initial instead of image (guests)
}) {
  const url = getAvatarUrl(avatarId);

  if (showFallback || !url) {
    // Guest fallback: simple colored circle with initial
    return (
      <div
        className="rounded-xl flex items-center justify-center font-black text-[#0A0A1A] flex-shrink-0"
        style={{
          width: size,
          height: size,
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
      className="object-contain flex-shrink-0 drop-shadow-lg"
      onError={(e) => {
        // Graceful fallback if image fails to load
        e.target.style.display = 'none';
      }}
    />
  );
}
```

### Profile Schema Update

Clean up the profile — we no longer need `avatar_color`:

```sql
-- Drop the unused color column (optional cleanup)
ALTER TABLE profiles DROP COLUMN IF EXISTS avatar_color;

-- Update default avatar_id to match the new naming
ALTER TABLE profiles ALTER COLUMN avatar_id SET DEFAULT 'avatar-1';

-- Migrate existing users to new format if needed
UPDATE profiles SET avatar_id = 'avatar-1' WHERE avatar_id IN ('gold', 'default');
UPDATE profiles SET avatar_id = 'avatar-2' WHERE avatar_id = 'red';
UPDATE profiles SET avatar_id = 'avatar-3' WHERE avatar_id = 'blue';
UPDATE profiles SET avatar_id = 'avatar-4' WHERE avatar_id = 'green';
UPDATE profiles SET avatar_id = 'avatar-5' WHERE avatar_id = 'purple';
UPDATE profiles SET avatar_id = 'avatar-6' WHERE avatar_id = 'cyan';
UPDATE profiles SET avatar_id = 'avatar-7' WHERE avatar_id = 'crimson';
UPDATE profiles SET avatar_id = 'avatar-8' WHERE avatar_id = 'mint';
```

### Update Usages Across the App

Replace all `<AvatarHex>` references with `<Avatar>`. The API is simpler — just `avatarId` and `size`:

```jsx
// Before (various files):
<AvatarHex avatarId={profile.avatar_id} color={profile.avatar_color} username={profile.username} size={88} />

// After:
<Avatar avatarId={profile.avatar_id} size={88} />

// For guest players (Battle flow):
<Avatar username={guestName} size={40} showFallback />

// For the hero card on the home screen:
<Avatar avatarId={blader.avatar_id} size={68} />
```

Files that need updating:
- `components/BladerHeroCard.jsx` — home screen hero
- `pages/AccountPage.jsx` — account profile hero
- `components/battle/PlayerPicker.jsx` — user selection list
- `components/LeaderboardRow.jsx` — top bladers mini avatar
- `components/account/EditProfileModal.jsx` — avatar gallery

You can delete `BladerMaskIcon.jsx` entirely — no longer needed.

### Avatar Gallery in EditProfileModal

The gallery is now much simpler — just a grid of 8 images with a selected ring:

```jsx
// Inside EditProfileModal.jsx — the avatar gallery section

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
          className={`aspect-square rounded-xl flex items-center justify-center
            transition-all p-2
            ${selected
              ? 'ring-2 ring-[#4361EE] bg-[#4361EE]/10 scale-105'
              : 'bg-white/5 hover:bg-white/10 opacity-80 hover:opacity-100'}`}
        >
          <Avatar avatarId={preset.id} size={56} />
        </button>
      );
    })}
  </div>
</div>
```

The image itself carries the visual identity — no need for colored backgrounds or rings. Selected state just gets a blue ring and slight scale-up.

---

## 2. Modal Save Button: Definitive Fix

The SAVE button is still getting hidden behind the bottom navigation. The previous flex-column approach was correct but likely failed due to one of these reasons:

1. **Bottom nav has `position: fixed` and higher z-index** — the modal renders above the page content but below the nav
2. **Modal's `max-height: 90vh` is measured from viewport top**, not accounting for the nav's height at the bottom
3. **`env(safe-area-inset-bottom)` was added but on the inner footer**, not on the modal itself

Here's the robust fix that handles all three issues.

### Root Cause & Strategy

The real fix is to **make the modal sit ABOVE the bottom nav** with a higher z-index, and **reduce its max-height** to account for the nav bar's height. We also hide the bottom nav entirely when any modal is open — it's bad UX to let users tap the nav and navigate away mid-edit anyway.

### Step 1: Check Z-Index Hierarchy

First, audit the z-index values in the app. The hierarchy should be:

```
Modal backdrop + content:   z-50, z-40  (overlay everything)
Bottom navigation:          z-30
Fixed headers:              z-20
Normal content:             z-0
```

Inspect the `BottomNav.jsx` component. If it has `z-index: 50` or higher, lower it to 30:

```jsx
// components/BottomNav.jsx — top-level container

<div className="fixed bottom-0 left-0 right-0 z-30 bg-[#08081A] border-t border-white/5 ...">
  {/* ... tabs ... */}
</div>
```

### Step 2: Hide Bottom Nav When Modal Is Open

Create a tiny Zustand store to track modal state globally:

```jsx
// stores/useUIStore.js
import { create } from 'zustand';

export const useUIStore = create((set) => ({
  modalOpen: false,
  setModalOpen: (open) => set({ modalOpen: open }),
}));
```

Update `BottomNav.jsx` to hide when any modal is open:

```jsx
// components/BottomNav.jsx
import { useUIStore } from '../stores/useUIStore';

export function BottomNav() {
  const modalOpen = useUIStore(s => s.modalOpen);
  const location = useLocation();
  const navigate = useNavigate();

  if (modalOpen) return null;  // ← hide nav entirely when modal is open

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#08081A] border-t border-white/5
      px-2 pt-2.5 pb-3.5 grid grid-cols-5 gap-0">
      {/* ... existing tabs ... */}
    </div>
  );
}
```

### Step 3: Updated EditProfileModal with Proper Structure

```jsx
// components/account/EditProfileModal.jsx

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Avatar, AVATAR_PRESETS } from '../Avatar';
import { useUIStore } from '../../stores/useUIStore';

const TITLE_OPTIONS = [
  "Blader d'Elite",
  "Cacciatore di Bit",
  "Re della Stamina",
  "Maestro dell'Attacco",
  "Guardiano della Difesa",
  "Esploratore del Meta",
  "Maestro Builder",
  "Leggenda Vivente",
];

export function EditProfileModal({ profile, onClose, onSaved }) {
  const setModalOpen = useUIStore(s => s.setModalOpen);
  const [username, setUsername] = useState(profile.username ?? '');
  const [title, setTitle]       = useState(profile.title ?? "Blader d'Elite");
  const [avatarId, setAvatarId] = useState(profile.avatar_id ?? 'avatar-1');
  const [saving, setSaving]     = useState(false);

  // Signal global UI that a modal is open
  useEffect(() => {
    setModalOpen(true);
    return () => setModalOpen(false);
  }, [setModalOpen]);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from('profiles')
      .update({
        username: username.trim(),
        title,
        avatar_id: avatarId,
      })
      .eq('id', profile.id);
    setSaving(false);
    if (!error) onSaved();
  }

  return (
    <AnimatePresence>
      {/* Backdrop — z-[60] to sit above everything */}
      <motion.div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        style={{ zIndex: 60 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal sheet — z-[70] on top of backdrop */}
      <motion.div
        className="fixed left-0 right-0 bottom-0 rounded-t-3xl overflow-hidden
          bg-[#12122A] border-t border-[#4361EE]/30
          flex flex-col"
        style={{
          zIndex: 70,
          maxHeight: '88vh',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 flex items-center justify-between flex-shrink-0">
          <div className="text-white text-lg font-black uppercase tracking-tight">
            Modifica Profilo
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* SCROLLABLE content */}
        <div className="px-5 overflow-y-auto flex-1 pb-4"
          style={{ WebkitOverflowScrolling: 'touch' }}>

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
                    className={`aspect-square rounded-xl flex items-center justify-center
                      transition-all p-2
                      ${selected
                        ? 'ring-2 ring-[#4361EE] bg-[#4361EE]/10 scale-105'
                        : 'bg-white/5 hover:bg-white/10 opacity-80 hover:opacity-100'}`}
                  >
                    <Avatar avatarId={preset.id} size={56} />
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
                  style={title === t ? {
                    boxShadow: '0 0 12px -2px rgba(67,97,238,0.4)'
                  } : undefined}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FIXED FOOTER — outside the scroll flow */}
        <div
          className="px-5 pt-4 border-t border-white/5 bg-[#12122A] flex-shrink-0"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          }}
        >
          <button
            onClick={handleSave}
            disabled={saving || !username.trim()}
            className="w-full py-4 rounded-xl font-bold tracking-wider text-white
              disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
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
}
```

### Key Changes From Previous Attempt

| Issue | Previous Approach | New Approach |
|---|---|---|
| Z-index conflict | `z-50` on modal, unknown nav z-index | Explicit `zIndex: 70` on modal, `z-30` on nav |
| Nav still tappable | Visible behind modal | Nav hidden entirely via `useUIStore` |
| Max-height cutoff | `85vh` | `88vh` with footer guaranteed visible |
| Scroll momentum on iOS | Missing | `WebkitOverflowScrolling: 'touch'` |
| Save disabled state | Only `saving` | Also disabled when `username` is empty |

### Apply the Same Pattern to Other Modals

Any other bottom-drawer modal in the app (e.g. `PartDetailDrawer`) should use the same three-ingredient recipe:

1. `useUIStore` to hide the bottom nav
2. Explicit high z-index (60 for backdrop, 70 for sheet)
3. Flex column layout with fixed footer + scrollable middle

Consider extracting this into a `<BottomSheet>` wrapper component in a future refactor — for now, copy-paste is fine since there are only 2-3 modals using this pattern.

---

## 3. Implementation Checklist

1. **User uploads 8 PNG avatars** to Supabase Storage bucket `avatars/` named `avatar-1.png` through `avatar-8.png`
2. **Run the storage bucket policy SQL** (if not already set up)
3. **Run the profile migration SQL** — drop `avatar_color`, update default, migrate old IDs
4. **Delete `components/BladerMaskIcon.jsx`** — no longer used
5. **Delete `components/AvatarHex.jsx`** — replaced by `Avatar.jsx`
6. **Create `components/Avatar.jsx`** — new image-based component
7. **Create `stores/useUIStore.js`** — modal state tracker
8. **Update `components/BottomNav.jsx`** — lower z-index, hide when modal open
9. **Update `components/account/EditProfileModal.jsx`** — new layout with higher z-index
10. **Replace all `<AvatarHex>` usages** across the app with `<Avatar>`
11. **Test on mobile**: open Edit Profile modal → scroll through titles → confirm SAVE stays visible

---

*End of Briefing — BeyManager X Avatar & Modal Fix — April 2026*
