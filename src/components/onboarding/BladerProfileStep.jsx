import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Sparkles } from 'lucide-react';
import { Avatar, AVATAR_PRESETS } from '../Avatar';

export function BladerProfileStep({ formData, onChange, onComplete, onBack, loading, error }) {
  const nameValid = formData.bladerName.trim().length >= 3
    && formData.bladerName.trim().length <= 16;

  return (
    <div className="flex flex-col h-full">
      {/* Back button + header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack}
          className="p-3 rounded-2xl bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 transition-all">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={24} className="text-[#F5A623] animate-pulse" />
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Crea il tuo Blader
          </h1>
        </div>
        <p className="text-white/50 text-sm mb-10">
          Scegli il tuo nome di battaglia e avatar nell'arena
        </p>
      </motion.div>

      <div className="flex-1 space-y-10">
        {/* Avatar picker */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Selected avatar preview */}
          <div className="flex justify-center mb-8">
            <motion.div
              key={formData.avatarId}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="relative"
            >
              <Avatar avatarId={formData.avatarId} size={110} />
              <div
                className="absolute inset-0 rounded-2xl blur-3xl opacity-20 -z-10"
                style={{ background: '#4361EE' }}
              />
            </motion.div>
          </div>

          <div className="text-[10px] font-black text-white/30 tracking-[0.2em] mb-4 uppercase">
            Scegli il tuo Avatar
          </div>
          <div className="grid grid-cols-5 gap-3">
            {AVATAR_PRESETS.slice(0, 15).map((preset, i) => {
              const selected = formData.avatarId === preset.id;
              return (
                <motion.button
                  key={preset.id}
                  onClick={() => onChange({ avatarId: preset.id })}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.03 }}
                  className={`aspect-square rounded-2xl flex items-center justify-center
                    transition-all p-1.5 border
                    ${selected
                      ? 'border-[#4361EE] bg-[#4361EE]/10 scale-110'
                      : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100 hover:scale-105'}`}
                >
                  <Avatar avatarId={preset.id} size={40} />
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Blader name input */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="text-[10px] font-black text-[#E94560] tracking-[0.2em] mb-3 block uppercase">
            Nome Blader
          </label>
          <div className="flex items-center gap-4 p-4 rounded-2xl border transition-colors
            bg-[#12122A] border-white/10 focus-within:border-[#E94560]/50 shadow-inner">
            <User size={20} className="text-white/20 flex-shrink-0" />
            <input
              type="text"
              placeholder="ES. DRAN_VIPER"
              maxLength={16}
              value={formData.bladerName}
              onChange={e => onChange({ bladerName: e.target.value.toUpperCase() })}
              className="flex-1 bg-transparent text-white text-sm font-black outline-none
                placeholder-white/20 tracking-wider"
            />
            <span className="text-[10px] text-white/20 font-mono tabular-nums flex-shrink-0">
              {formData.bladerName.length}/16
            </span>
          </div>
        </motion.div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          className="my-6 p-4 rounded-2xl bg-[#E94560]/10 border border-[#E94560]/30
            text-[#E94560] text-sm font-medium"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* Create button */}
      <motion.button
        onClick={onComplete}
        disabled={!nameValid || loading}
        whileTap={nameValid && !loading ? { scale: 0.97 } : undefined}
        className="w-full py-5 rounded-2xl font-black tracking-[0.2em] text-white mt-6
          disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase text-xs"
        style={{
          background: nameValid && !loading
            ? 'linear-gradient(135deg, #E94560, #C9304A)'
            : 'rgba(233,69,96,0.3)',
          boxShadow: nameValid && !loading
            ? '0 8px 30px -10px rgba(233,69,96,0.5)'
            : 'none',
        }}
      >
        {loading ? (
          <motion.div
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <div className="flex items-center justify-center gap-3">
            <Sparkles size={18} />
            <span>Diventa una Leggenda</span>
          </div>
        )}
      </motion.button>
    </div>
  );
}
