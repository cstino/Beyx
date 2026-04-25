import React from 'react';
import { supabase } from '../lib/supabaseClient';

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

  // Legacy ID mapping for backward compatibility
  const legacyMap = {
    'gold': 'avatar-1', 'default': 'avatar-1', 'yellow': 'avatar-1',
    'red': 'avatar-2',
    'blue': 'avatar-3',
    'green': 'avatar-4',
    'purple': 'avatar-5',
    'cyan': 'avatar-6', 'light-blue': 'avatar-6',
    'crimson': 'avatar-7',
    'mint': 'avatar-8'
  };
  
  const id = legacyMap[avatarId] || avatarId;
  
  // Get public URL from Supabase avatars bucket
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${id}.png`);

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
    <div 
        className="flex-shrink-0"
        style={{ width: size, height: size }}
    >
      <img
        src={url}
        alt={`Avatar ${avatarId}`}
        style={{ width: '100%', height: '100%' }}
        className="object-contain drop-shadow-md"
        onError={(e) => {
          // Hide broken image icon
          e.currentTarget.style.visibility = 'hidden';
          console.error(`Avatar failed to load: ${url}`);
        }}
      />
    </div>
  );
}
