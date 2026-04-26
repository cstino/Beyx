import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Lock, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { PageContainer } from '../components/PageContainer';

export function AcademyLevelPage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const userId = useAuthStore(s => s.user?.id);
  const { setHeader, clearHeader } = useUIStore();
  const [level, setLevel] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());

  useEffect(() => {
    return () => clearHeader();
  }, [clearHeader]);

  useEffect(() => {
    if (level) {
      setHeader(level.name, '/academy');
    }
  }, [level, setHeader]);

  useEffect(() => {
    loadData();
  }, [levelId, userId]);

  async function loadData() {
    const [levelRes, lessonsRes, progressRes] = await Promise.all([
      supabase.from('academy_levels').select('*').eq('id', levelId).single(),
      supabase.from('academy_lessons')
        .select('id, title, subtitle, duration_min, xp_reward, sort_order')
        .eq('level_id', levelId)
        .order('sort_order'),
      userId
        ? supabase.from('user_academy_progress')
            .select('lesson_id').eq('user_id', userId).eq('status', 'completed')
        : Promise.resolve({ data: [] }),
    ]);

    setLevel(levelRes.data);
    setLessons(lessonsRes.data ?? []);
    setCompletedIds(new Set((progressRes.data ?? []).map(p => p.lesson_id)));
  }

  if (!level) return null;

  return (
    <PageContainer>
      {/* Description card */}
      <div className="mx-4 mb-5 rounded-xl bg-[#12122A] p-4 border-l-2"
        style={{ borderLeftColor: level.color }}>
        <p className="text-white/70 text-sm leading-relaxed">{level.description}</p>
      </div>

      {/* Lessons */}
      <div className="px-4 space-y-2.5">
        {lessons.map((lesson, i) => {
          const completed = completedIds.has(lesson.id);
          const previousCompleted = i === 0 || completedIds.has(lessons[i - 1].id);
          const locked = !previousCompleted && !completed;

          return (
            <motion.button
              key={lesson.id}
              onClick={() => !locked && navigate(`/academy/${levelId}/${lesson.id}`)}
              whileTap={!locked ? { scale: 0.98 } : undefined}
              disabled={locked}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`w-full bg-[#12122A] rounded-xl p-3.5 border text-left
                flex items-center gap-3 transition-colors
                ${completed ? 'border-' + level.color : 'border-white/5'}
                ${locked ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/15'}`}
              style={completed ? { borderColor: `${level.color}50` } : undefined}
            >
              {/* Status icon */}
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                font-black text-sm"
                style={{
                  background: completed ? level.color
                            : locked    ? 'rgba(255,255,255,0.05)'
                            : `${level.color}15`,
                  color: completed ? '#0A0A1A'
                       : locked    ? 'rgba(255,255,255,0.3)'
                       : level.color,
                  border: completed ? 'none' : `1px solid ${level.color}30`,
                }}>
                {completed ? <Check size={18} strokeWidth={3} />
                 : locked   ? <Lock size={14} />
                 : i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm leading-tight">
                  {lesson.title}
                </div>
                {lesson.subtitle && (
                  <div className="text-white/40 text-xs mt-0.5 truncate">
                    {lesson.subtitle}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1 text-[10px] text-white/40">
                    <Clock size={10} />
                    <span>{lesson.duration_min} min</span>
                  </div>
                  <div className="text-[10px] font-bold"
                    style={{ color: level.color }}>
                    +{lesson.xp_reward} XP
                  </div>
                </div>
              </div>

              {!locked && !completed && (
                <ChevronRight size={18} className="text-white/30 flex-shrink-0" />
              )}
            </motion.button>
          );
        })}
      </div>
    </PageContainer>
  );
}
