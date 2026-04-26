import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';

export function AcademyBanner({ onClick }) {
  const userId = useAuthStore(s => s.user?.id);
  const [stats, setStats] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    loadStats();
  }, [userId]);

  async function loadStats() {
    const { count: total } = await supabase
      .from('academy_lessons')
      .select('id', { count: 'exact', head: true });

    let completed = 0;
    if (userId) {
      const { count } = await supabase
        .from('user_academy_progress')
        .select('lesson_id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');
      completed = count ?? 0;
    }

    setStats({ completed, total: total ?? 0 });
  }

  const pct = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full relative overflow-hidden rounded-2xl px-4 py-4 flex items-center gap-4 shadow-[0_0_20px_rgba(67,97,238,0.4)] border border-white/20 group cursor-pointer"
    >
      {/* Animated Radiant Background */}
      <motion.div 
        className="absolute inset-0 z-0"
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 6, ease: "linear", repeat: Infinity }}
        style={{
          background: 'linear-gradient(90deg, #4361EE, #A855F7, #E94560, #4361EE)',
          backgroundSize: '300% 100%'
        }}
      />
      
      {/* Glossy & Dark Overlays for depth and contrast */}
      <div className="absolute inset-0 z-0 bg-black/10" />
      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent z-0" />

      {/* Content Wrapper */}
      <div className="relative z-10 flex items-center gap-4 w-full">
        {/* Dynamic Icon Box */}
        <div className="w-[46px] h-[46px] rounded-xl flex items-center justify-center flex-shrink-0 bg-white/20 backdrop-blur-md border border-white/40 shadow-inner group-hover:-rotate-6 group-hover:scale-110 transition-all duration-300">
          <BookOpen size={24} className="text-white drop-shadow-md" strokeWidth={2.5} />
        </div>

        {/* Text and Progress bar */}
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[15px] font-black text-white leading-tight drop-shadow-md tracking-wider">
            X ACADEMY
          </div>
          <div className="text-[11px] text-white/90 mt-0.5 font-bold drop-shadow-md">
            {stats.completed} / {stats.total} lezioni completate
          </div>
          
          {stats.total > 0 && (
            <div className="h-1.5 bg-black/30 rounded-full overflow-hidden mt-2.5 border border-white/10 relative">
              <div
                className="absolute left-0 top-0 bottom-0 bg-white rounded-full transition-all duration-500 shadow-[0_0_8px_white]"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>

        {/* Action Chevron */}
        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 flex-shrink-0 group-hover:bg-white/30 transition-colors">
          <ChevronRight size={18} className="text-white drop-shadow-md ml-0.5" strokeWidth={3} />
        </div>
      </div>
    </motion.button>
  );
}
