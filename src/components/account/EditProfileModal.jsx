import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Avatar, AVATAR_PRESETS } from '../Avatar';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

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
  const { fetchProfile } = useAuthStore();
  const setModalOpen = useUIStore(s => s.setModalOpen);
  const [username, setUsername] = useState(profile.username || '');
  const [title, setTitle]       = useState(profile.title || TITLE_OPTIONS[0]);
  const [avatarId, setAvatarId] = useState(profile.avatar_id || 'avatar-1');
  const [saving, setSaving]     = useState(false);

  // Signal global UI that a modal is open
  useEffect(() => {
    setModalOpen(true);
    return () => setModalOpen(false);
  }, [setModalOpen]);

  async function handleSave() {
    if (!username.trim()) return;
    setSaving(true);
    
    const { error } = await supabase.from('profiles')
      .update({
        username: username.trim(),
        title,
        avatar_id: avatarId,
      })
      .eq('id', profile.id);

    if (!error) {
      await fetchProfile(profile.id);
      onSaved();
    } else {
      console.error('Error updating profile:', error);
    }
    setSaving(false);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end justify-center">
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          onClick={onClose}
        />
        <motion.div
          className="relative w-full max-w-lg bg-[#12122A] rounded-t-3xl border-t border-[#4361EE]/30 flex flex-col overflow-hidden shadow-2xl z-[70]"
          style={{ maxHeight: '88vh' }}
          initial={{ y: '100%' }} 
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          {/* Fixed Header */}
          <div className="flex flex-col flex-shrink-0">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />
            <div className="px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-black text-lg uppercase tracking-tight italic">
                Modifica Profilo
              </h2>
              <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-white/40">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="px-6 pb-6 overflow-y-auto flex-1 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Avatar gallery */}
            <div className="mb-8">
              <div className="text-[10px] font-black text-white/30 tracking-[0.2em] mb-4 uppercase">
                GALLERIA AVATAR
              </div>
              <div className="grid grid-cols-4 gap-4">
                {AVATAR_PRESETS.map(preset => {
                  const selected = avatarId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setAvatarId(preset.id)}
                      className={`aspect-square flex items-center justify-center transition-all relative rounded-2xl p-2
                        ${selected 
                          ? 'bg-[#4361EE]/10 ring-2 ring-[#4361EE] scale-105' 
                          : 'bg-white/5 opacity-40 scale-90 hover:opacity-100 hover:bg-white/10'}`}
                    >
                      <Avatar avatarId={preset.id} size={56} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Username */}
            <div className="mb-8">
              <div className="text-[10px] font-black text-[#4361EE] tracking-[0.2em] mb-2 uppercase">
                NOME BLADER
              </div>
              <div className="p-4 rounded-xl bg-[#1A1A3A] border border-white/5 focus-within:border-[#4361EE]/30 transition-all">
                <input
                  type="text" maxLength={20}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-transparent text-white font-bold text-base outline-none placeholder-white/20"
                  placeholder="Inserisci nome..."
                />
              </div>
            </div>

            {/* Title picker */}
            <div>
              <div className="text-[10px] font-black text-white/30 tracking-[0.2em] mb-3 uppercase">
                SCEGLI TITOLO
              </div>
              <div className="flex flex-wrap gap-2">
                {TITLE_OPTIONS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTitle(t)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all uppercase
                      ${title === t
                        ? 'bg-[#4361EE]/15 border-[#4361EE]/60 text-[#4361EE]'
                        : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'}`}
                    style={title === t ? { boxShadow: '0 0 12px -2px rgba(67,97,238,0.4)' } : undefined}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div 
            className="px-6 py-5 border-t border-white/5 bg-[#12122A] flex-shrink-0"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
          >
            <button
              onClick={handleSave}
              disabled={saving || !username.trim()}
              className="w-full py-4 rounded-xl font-black text-[11px] tracking-[0.2em] text-white disabled:opacity-50 shadow-xl flex items-center justify-center gap-3 uppercase transition-opacity"
              style={{
                background: 'linear-gradient(135deg, #E94560, #C9304A)',
                boxShadow: '0 8px 30px -10px rgba(233,69,96,0.6)',
              }}
            >
              {saving ? 'SALVATAGGIO…' : (
                <>
                  <Save size={18} strokeWidth={3} />
                  SALVA MODIFICHE
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
