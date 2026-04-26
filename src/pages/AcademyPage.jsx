import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { PageContainer } from '../components/PageContainer';

export function AcademyPage() {
  const navigate = useNavigate();
  const userId = useAuthStore(s => s.user?.id);
  const { setHeader, clearHeader } = useUIStore();
  const [levels, setLevels] = useState([]);
  const [progress, setProgress] = useState({}); // { level_id: { total, completed } }

  useEffect(() => {
    setHeader('X ACADEMY', '/');
    return () => clearHeader();
  }, [setHeader, clearHeader]);

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    const { data: levelsData } = await supabase
      .from('academy_levels')
      .select('*')
      .order('sort_order');

    const { data: lessonsData } = await supabase
      .from('academy_lessons')
      .select('id, level_id');

    let completedSet = new Set();
    if (userId) {
      const { data: prog } = await supabase
        .from('user_academy_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('status', 'completed');
      completedSet = new Set((prog ?? []).map(p => p.lesson_id));
    }

    // Compute per-level progress
    const perLevel = {};
    for (const level of (levelsData ?? [])) {
      const lessonIds = (lessonsData ?? [])
        .filter(l => l.level_id === level.id)
        .map(l => l.id);
      perLevel[level.id] = {
        total:     lessonIds.length,
        completed: lessonIds.filter(id => completedSet.has(id)).length,
      };
    }

    setLevels(levelsData ?? []);
    setProgress(perLevel);
  }

  // Total progress across all levels
  const totalLessons = Object.values(progress).reduce((a, p) => a + p.total, 0);
  const completedLessons = Object.values(progress).reduce((a, p) => a + p.completed, 0);
  const overallPct = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <PageContainer>
      {/* Overall progress card */}
      <div className="mx-4 mb-6 rounded-2xl p-4 border border-[#4361EE]/20"
        style={{ background: 'linear-gradient(135deg, #1A1A3A 0%, #0F0F25 100%)' }}>
        <div className="flex justify-between items-baseline mb-2">
          <div className="text-[10px] font-bold tracking-[0.15em] text-white/50">
            PROGRESSO GLOBALE
          </div>
          <div className="text-white font-black tabular-nums">
            {completedLessons} / {totalLessons}
          </div>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #00D68F, #4361EE, #A855F7, #F5A623)' }}
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Level cards */}
      <div className="px-4 space-y-3 mb-6">
        {levels.map((level, i) => {
          const Icon = LucideIcons[level.icon] ?? LucideIcons.BookOpen;
          const p = progress[level.id] ?? { total: 0, completed: 0 };
          const pct = p.total > 0 ? (p.completed / p.total) * 100 : 0;
          const isComplete = p.completed === p.total && p.total > 0;

          return (
            <motion.button
              key={level.id}
              onClick={() => navigate(`/academy/${level.id}`)}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="w-full bg-[#12122A] rounded-xl p-4 relative overflow-hidden border text-left"
              style={{ borderColor: `${level.color}30` }}
            >
              {/* Diagonal background glow */}
              <div className="absolute inset-0 pointer-events-none opacity-50"
                style={{ background: `linear-gradient(110deg, transparent 50%, ${level.color}10 80%, transparent 100%)` }} />

              {/* Header row */}
              <div className="flex items-start gap-3 mb-3 relative">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border"
                  style={{
                    background: `${level.color}15`,
                    borderColor: `${level.color}40`,
                    transform: 'rotate(-3deg)',
                  }}>
                  <Icon size={20} style={{ color: level.color }} strokeWidth={2.2} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold tracking-[0.15em]"
                    style={{ color: level.color }}>
                    LIVELLO {i + 1}
                  </div>
                  <div className="text-white font-black text-lg leading-tight">
                    {level.name}
                  </div>
                  <div className="text-white/50 text-xs mt-0.5">
                    {level.subtitle}
                  </div>
                </div>

                {isComplete ? (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: level.color }}>
                    <LucideIcons.Check size={16} className="text-[#0A0A1A]" strokeWidth={3} />
                  </div>
                ) : (
                  <ChevronRight size={20} className="text-white/30 flex-shrink-0 mt-2" />
                )}
              </div>

              {/* Progress bar */}
              <div className="mb-1.5 flex justify-between text-[10px] font-bold tracking-[0.1em]">
                <span className="text-white/40">{p.completed} / {p.total} LEZIONI</span>
                <span className="text-white/60 tabular-nums">{Math.round(pct)}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: level.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>
    </PageContainer>
  );
}
