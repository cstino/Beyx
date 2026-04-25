import React from 'react';

// Combined local presets and expanded dynamic DiceBear bots
export const AVATAR_PRESETS = [
  // Local Mascot Avatars (1-12)
  { id: 'avatar-1' }, { id: 'avatar-2' }, { id: 'avatar-3' }, { id: 'avatar-4' },
  { id: 'avatar-5' }, { id: 'avatar-6' }, { id: 'avatar-7' }, { id: 'avatar-8' },
  { id: 'avatar-9' }, { id: 'avatar-10' }, { id: 'avatar-11' }, { id: 'avatar-12' },
  
  // Premium DiceBear Bots - Collection 1 (Interactive/Color)
  { id: 'bot-1', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Circuit' },
  { id: 'bot-2', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Matrix' },
  { id: 'bot-3', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Neon' },
  { id: 'bot-4', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Glow' },
  { id: 'bot-5', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Flash' },
  { id: 'bot-6', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Zero' },
  { id: 'bot-7', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Prime' },
  { id: 'bot-8', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Cyber' },

  // Premium DiceBear Bots - Collection 2 (Heavy/Tech)
  { id: 'bot-9',  url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Titan' },
  { id: 'bot-10', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ghost' },
  { id: 'bot-11', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Omega' },
  { id: 'bot-12', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Delta' },
  { id: 'bot-13', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Logic' },
  { id: 'bot-14', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Gear' },
  { id: 'bot-15', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Bolt' },
  { id: 'bot-16', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Aero' },
  { id: 'bot-17', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Brave' },
  { id: 'bot-18', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Spark' },
  { id: 'bot-19', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Zen' },
  { id: 'bot-20', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Iron' },
];

export function getAvatarUrl(avatarId) {
  if (!avatarId) return null;
  
  // Check if it's a direct URL (like Dicebear)
  if (avatarId.startsWith('http')) return avatarId;

  // Check if it's one of our dynamic bots
  const botMatch = AVATAR_PRESETS.find(p => p.id === avatarId && p.url);
  if (botMatch) return botMatch.url;

  // Legacy & Local mapping
  const legacyMap = {
    'gold': '1', 'default': '1', 'yellow': '1',
    'red': '2', 'blue': '3', 'green': '4',
    'purple': '5', 'cyan': '6', 'light-blue': '6',
    'crimson': '7', 'mint': '8',
    'avatar-1': '1', 'avatar-2': '2', 'avatar-3': '3', 'avatar-4': '4',
    'avatar-5': '5', 'avatar-6': '6', 'avatar-7': '7', 'avatar-8': '8',
    'avatar-9': '9', 'avatar-10': '10', 'avatar-11': '11', 'avatar-12': '12',
    'avatar-13': '13', 'avatar-14': '14'
  };
  
  const id = legacyMap[avatarId] || avatarId.replace('avatar-', '');
  return `/avatar/${id}.png`;
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
        className="rounded-2xl flex items-center justify-center font-black text-[#0A0A1A] flex-shrink-0"
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
    <div 
        className="flex-shrink-0 rounded-2xl overflow-hidden bg-white/5"
        style={{ width: size, height: size }}
    >
      <img
        src={url}
        alt={`Avatar ${avatarId}`}
        style={{ width: '100%', height: '100%' }}
        className="object-contain drop-shadow-md"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement.style.background = 'rgba(255,255,255,0.05)';
        }}
      />
    </div>
  );
}
