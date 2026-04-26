import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { PageContainer } from '../components/PageContainer';
import { LessonContent } from '../components/academy/LessonContent';
import { LessonQuiz } from '../components/academy/LessonQuiz';

export function AcademyLessonPage() {
  const { levelId, lessonId } = useParams();
  const navigate = useNavigate();
  const userId = useAuthStore(s => s.user?.id);
  const { setHeader, clearHeader } = useUIStore();
  const [lesson, setLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    return () => clearHeader();
  }, [clearHeader]);

  useEffect(() => {
    if (lesson) {
      setHeader(lesson.title, `/academy/${levelId}`);
    }
  }, [lesson, levelId, setHeader]);

  useEffect(() => {
    loadData();
  }, [lessonId, userId]);

  async function loadData() {
    const [lessonRes, progressRes] = await Promise.all([
      supabase.from('academy_lessons').select('*').eq('id', lessonId).single(),
      userId
        ? supabase.from('user_academy_progress')
            .select('*').eq('user_id', userId).eq('lesson_id', lessonId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    setLesson(lessonRes.data);
    setProgress(progressRes.data);

    // Mark as started if not already
    if (userId && !progressRes.data) {
      await supabase.from('user_academy_progress').insert({
        user_id: userId, lesson_id: lessonId, status: 'started',
      });
    }
  }

  async function handleComplete(quizResult = null) {
    if (!userId) return;
    const updates = {
      user_id: userId,
      lesson_id: lessonId,
      status: 'completed',
      completed_at: new Date().toISOString(),
    };
    if (quizResult) {
      updates.quiz_score  = quizResult.score;
      updates.quiz_passed = quizResult.passed;
    }
    await supabase.from('user_academy_progress').upsert(updates, { onConflict: 'user_id,lesson_id' });
    navigate(`/academy/${levelId}`);
  }

  if (!lesson) return null;

  const hasQuiz = lesson.quiz?.questions?.length > 0;
  const isCompleted = progress?.status === 'completed';

  if (showQuiz && hasQuiz) {
    return (
      <PageContainer>
        <LessonQuiz
          quiz={lesson.quiz}
          onComplete={handleComplete}
          onCancel={() => setShowQuiz(false)}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Subtitle */}
      {lesson.subtitle && (
        <div className="mx-4 mb-5 text-white/60 italic text-sm">
          {lesson.subtitle}
        </div>
      )}

      {/* Content */}
      <div className="px-4 mb-6">
        <LessonContent blocks={lesson.content} />
      </div>

      {/* Complete button */}
      <div className="px-4 pb-4">
        {hasQuiz ? (
          <motion.button
            onClick={() => setShowQuiz(true)}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-xl font-bold tracking-wider text-white
              flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #4361EE, #2E45C9)',
              boxShadow: '0 4px 20px -4px rgba(67,97,238,0.5)',
            }}
          >
            <Trophy size={16} />
            <span>INIZIA QUIZ FINALE</span>
          </motion.button>
        ) : (
          <motion.button
            onClick={() => handleComplete()}
            whileTap={{ scale: 0.97 }}
            disabled={isCompleted}
            className="w-full py-4 rounded-xl font-bold tracking-wider text-white
              disabled:opacity-50"
            style={{
              background: isCompleted
                ? 'rgba(0,214,143,0.15)'
                : 'linear-gradient(135deg, #00D68F, #00A86F)',
              boxShadow: isCompleted ? 'none' : '0 4px 20px -4px rgba(0,214,143,0.5)',
            }}
          >
            {isCompleted ? '✓ COMPLETATA' : `COMPLETA LEZIONE (+${lesson.xp_reward} XP)`}
          </motion.button>
        )}
      </div>
    </PageContainer>
  );
}
