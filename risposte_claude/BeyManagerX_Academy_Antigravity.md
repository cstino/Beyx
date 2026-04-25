# BeyManager X — X Academy: Full Learning Platform

**Briefing for Antigravity — April 2026**

---

Hey Antigravity — time to turn the X Academy from a placeholder into a proper learning platform. The user wants a comprehensive curriculum organized by skill level (Beginner → Intermediate → Advanced → Pro), with text + images + visual diagrams, interactive quizzes, and an XP/badge completion system.

This briefing covers:
1. **Database schema** for lessons, quizzes, and progress tracking
2. **Page architecture** — Academy hub, level pages, lesson detail
3. **Component library** for rendering rich content (markdown blocks, diagrams, quizzes)
4. **Full content seed** with 24 lessons across 4 levels (the user can extend later)
5. **XP/badge integration** with the existing system
6. **Progress visualization** on the academy hub

Given the scope, suggested implementation order:
1. Database migrations + content seed
2. Academy hub page (level overview)
3. Lesson detail page with content blocks
4. Quiz component with completion tracking
5. Progress integration with XP/badges

---

## 1. Database Schema

### Lessons & Quizzes Tables

```sql
-- ────────────────────────────────────────────────────
-- ACADEMY LEVELS — Beginner, Intermediate, Advanced, Pro
-- ────────────────────────────────────────────────────
CREATE TABLE academy_levels (
  id          TEXT PRIMARY KEY,        -- 'beginner', 'intermediate', 'advanced', 'pro'
  name        TEXT NOT NULL,            -- 'Principiante', 'Intermedio', etc.
  subtitle    TEXT NOT NULL,            -- 'Le basi del Beyblade X'
  description TEXT NOT NULL,            -- Longer description shown on the level card
  color       TEXT NOT NULL,            -- Accent hex color
  icon        TEXT NOT NULL,            -- Lucide icon name
  sort_order  INT  NOT NULL,
  required_level INT DEFAULT 1          -- Min user level to unlock (gating)
);

-- ────────────────────────────────────────────────────
-- LESSONS — individual learning units
-- ────────────────────────────────────────────────────
CREATE TABLE academy_lessons (
  id             TEXT PRIMARY KEY,      -- slug like 'what-is-beyblade-x'
  level_id       TEXT NOT NULL REFERENCES academy_levels(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  subtitle       TEXT,                  -- Short tagline
  duration_min   INT  DEFAULT 5,        -- Estimated reading time
  xp_reward      INT  DEFAULT 25,       -- XP awarded on completion
  sort_order     INT  NOT NULL,

  -- Content stored as JSONB array of content blocks
  -- Each block: { type: 'text'|'image'|'diagram'|'quote'|'tip'|'list', ... }
  content        JSONB NOT NULL DEFAULT '[]',

  -- Optional: end-of-lesson quiz (separate from inline quizzes in content)
  quiz           JSONB,
                 -- { questions: [{ question, options: [], correctIndex, explanation }] }

  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lessons_level ON academy_lessons(level_id);

-- ────────────────────────────────────────────────────
-- USER LESSON PROGRESS — tracks completion
-- ────────────────────────────────────────────────────
CREATE TABLE user_academy_progress (
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id    TEXT NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,

  status       TEXT NOT NULL CHECK (status IN ('started', 'completed')),
  quiz_score   INT,                     -- Quiz score (out of total questions), null if no quiz
  quiz_passed  BOOLEAN,                 -- True if score >= passing threshold
  completed_at TIMESTAMPTZ,
  started_at   TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX idx_progress_user   ON user_academy_progress(user_id);
CREATE INDEX idx_progress_lesson ON user_academy_progress(lesson_id);

-- ────────────────────────────────────────────────────
-- TRIGGER: award XP on lesson completion
-- ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION award_lesson_xp()
RETURNS TRIGGER AS $$
DECLARE
  reward INT;
BEGIN
  -- Only award XP when transitioning to 'completed'
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed')
     OR (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
    SELECT xp_reward INTO reward FROM academy_lessons WHERE id = NEW.lesson_id;
    UPDATE profiles SET xp = xp + COALESCE(reward, 25), updated_at = NOW()
      WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_lesson_xp ON user_academy_progress;
CREATE TRIGGER trg_lesson_xp
  AFTER INSERT OR UPDATE ON user_academy_progress
  FOR EACH ROW EXECUTE FUNCTION award_lesson_xp();

-- ────────────────────────────────────────────────────
-- RLS POLICIES
-- ────────────────────────────────────────────────────
ALTER TABLE academy_levels       ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_lessons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_academy_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY academy_levels_select   ON academy_levels   FOR SELECT USING (true);
CREATE POLICY academy_lessons_select  ON academy_lessons  FOR SELECT USING (true);

CREATE POLICY progress_select ON user_academy_progress FOR SELECT USING (true);
CREATE POLICY progress_write  ON user_academy_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### New Achievements for Academy

```sql
-- Add new academy-related achievements
INSERT INTO achievements (id, name, description, icon, color, category, threshold, sort_order) VALUES
  ('academy_first',   'Primo Passo',         'Completa la prima lezione dell''Academy', 'BookOpen',  '#4361EE', 'academy', 1,  410),
  ('academy_beginner','Apprendista',          'Completa tutte le lezioni Beginner',     'GraduationCap','#00D68F', 'academy', 6,  420),
  ('academy_inter',   'Studioso',             'Completa tutte le lezioni Intermediate', 'BookMarked','#4361EE', 'academy', 12, 430),
  ('academy_advanced','Veterano',             'Completa tutte le lezioni Advanced',     'Award',     '#A855F7', 'academy', 18, 440),
  ('academy_pro',     'Dottorato',            'Completa tutte le lezioni Pro',          'Crown',     '#F5A623', 'academy', 24, 450),
  ('quiz_perfect',    'Memoria di Ferro',     'Ottieni il punteggio massimo in 5 quiz', 'Brain',     '#E94560', 'academy', 5,  460);

-- Update achievements category check constraint to include 'academy'
ALTER TABLE achievements DROP CONSTRAINT IF EXISTS achievements_category_check;
ALTER TABLE achievements ADD CONSTRAINT achievements_category_check
  CHECK (category IN ('battle', 'collection', 'combo', 'special', 'academy'));

-- Trigger: check academy achievements on lesson completion
CREATE OR REPLACE FUNCTION check_academy_achievements()
RETURNS TRIGGER AS $$
DECLARE
  total_completed INT;
  beginner_count  INT;
  inter_count     INT;
  advanced_count  INT;
  pro_count       INT;
  perfect_quizzes INT;
BEGIN
  IF NEW.status != 'completed' THEN RETURN NEW; END IF;

  -- Count completed lessons by level
  SELECT COUNT(*) INTO total_completed
    FROM user_academy_progress WHERE user_id = NEW.user_id AND status = 'completed';
  SELECT COUNT(*) INTO beginner_count
    FROM user_academy_progress p JOIN academy_lessons l ON l.id = p.lesson_id
    WHERE p.user_id = NEW.user_id AND p.status = 'completed' AND l.level_id = 'beginner';
  SELECT COUNT(*) INTO inter_count
    FROM user_academy_progress p JOIN academy_lessons l ON l.id = p.lesson_id
    WHERE p.user_id = NEW.user_id AND p.status = 'completed' AND l.level_id = 'intermediate';
  SELECT COUNT(*) INTO advanced_count
    FROM user_academy_progress p JOIN academy_lessons l ON l.id = p.lesson_id
    WHERE p.user_id = NEW.user_id AND p.status = 'completed' AND l.level_id = 'advanced';
  SELECT COUNT(*) INTO pro_count
    FROM user_academy_progress p JOIN academy_lessons l ON l.id = p.lesson_id
    WHERE p.user_id = NEW.user_id AND p.status = 'completed' AND l.level_id = 'pro';
  SELECT COUNT(*) INTO perfect_quizzes
    FROM user_academy_progress WHERE user_id = NEW.user_id AND quiz_passed = true;

  -- Unlock achievements
  IF total_completed >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, 'academy_first')
      ON CONFLICT DO NOTHING;
  END IF;
  IF beginner_count >= 6 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, 'academy_beginner')
      ON CONFLICT DO NOTHING;
  END IF;
  IF inter_count >= 6 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, 'academy_inter')
      ON CONFLICT DO NOTHING;
  END IF;
  IF advanced_count >= 6 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, 'academy_advanced')
      ON CONFLICT DO NOTHING;
  END IF;
  IF pro_count >= 6 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, 'academy_pro')
      ON CONFLICT DO NOTHING;
  END IF;
  IF perfect_quizzes >= 5 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, 'quiz_perfect')
      ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_academy_achievements
  AFTER INSERT OR UPDATE ON user_academy_progress
  FOR EACH ROW EXECUTE FUNCTION check_academy_achievements();
```

---

## 2. Levels Seed

```sql
INSERT INTO academy_levels (id, name, subtitle, description, color, icon, sort_order) VALUES
  ('beginner', 'Principiante',
   'Le basi del Beyblade X',
   'Inizia da qui. Imparerai cos''è un Beyblade, come si compone, come si lancia e le regole fondamentali per giocare.',
   '#00D68F', 'Sprout', 1),

  ('intermediate', 'Intermedio',
   'Strategie e composizione',
   'Ora che conosci le basi, scopri come scegliere le parti, capire gli archetipi (Attack/Defense/Stamina/Balance) e costruire combo efficaci.',
   '#4361EE', 'Target', 2),

  ('advanced', 'Avanzato',
   'Meta competitivo e tornei',
   'Tier list, formati di gioco, tecniche di lancio avanzate e analisi del meta corrente. Per chi vuole vincere i tornei.',
   '#A855F7', 'Trophy', 3),

  ('pro', 'Professionista',
   'Il livello dei campioni',
   'Manutenzione delle parti, micro-ottimizzazioni, lettura dell''avversario, psicologia del torneo. Tutto quello che serve per vincere ai massimi livelli.',
   '#F5A623', 'Crown', 4);
```

---

## 3. Content Block System

Lessons are stored as a JSONB array of "content blocks". Each block has a `type` and renders differently. This keeps content structured but flexible — you can add new block types later without migrations.

### Supported Block Types

```typescript
// Reference shape — implemented in TypeScript or just JSDoc
type ContentBlock =
  | { type: 'heading',  level: 1|2|3, text: string }
  | { type: 'paragraph', text: string }                 // Supports basic markdown: **bold**, *italic*, `code`
  | { type: 'image',    src: string, alt: string, caption?: string }
  | { type: 'diagram',  src: string, caption: string }   // Same as image but with prominent caption
  | { type: 'list',     items: string[], ordered?: boolean }
  | { type: 'tip',      text: string, variant?: 'info'|'warning'|'success' }
  | { type: 'quote',    text: string, author?: string }
  | { type: 'inline_quiz', question: string, options: string[], correctIndex: number, explanation: string }
  | { type: 'video',    src: string, caption?: string }  // YouTube embed URL
  | { type: 'divider' }
  | { type: 'two_column', left: ContentBlock[], right: ContentBlock[] }  // For comparisons
```

### Renderer Component

```jsx
// components/academy/LessonContent.jsx

import { motion } from 'framer-motion';
import { Info, AlertTriangle, CheckCircle2, Quote } from 'lucide-react';
import { InlineQuiz } from './InlineQuiz';

export function LessonContent({ blocks }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <BlockRenderer block={block} />
        </motion.div>
      ))}
    </div>
  );
}

function BlockRenderer({ block }) {
  switch (block.type) {
    case 'heading':
      return <Heading level={block.level} text={block.text} />;
    case 'paragraph':
      return <Paragraph text={block.text} />;
    case 'image':
      return <ImageBlock src={block.src} alt={block.alt} caption={block.caption} />;
    case 'diagram':
      return <DiagramBlock src={block.src} caption={block.caption} />;
    case 'list':
      return <ListBlock items={block.items} ordered={block.ordered} />;
    case 'tip':
      return <TipBlock text={block.text} variant={block.variant} />;
    case 'quote':
      return <QuoteBlock text={block.text} author={block.author} />;
    case 'inline_quiz':
      return <InlineQuiz {...block} />;
    case 'video':
      return <VideoBlock src={block.src} caption={block.caption} />;
    case 'divider':
      return <div className="h-px bg-white/10 my-4" />;
    case 'two_column':
      return <TwoColumn left={block.left} right={block.right} />;
    default:
      return null;
  }
}

function Heading({ level, text }) {
  if (level === 1) return (
    <h1 className="text-white text-2xl font-black uppercase tracking-tight mt-6 mb-2">
      {text}
    </h1>
  );
  if (level === 2) return (
    <h2 className="text-white text-xl font-black uppercase tracking-tight mt-5 mb-2
      flex items-center gap-2">
      <div className="w-1 h-5 bg-[#4361EE]" />
      {text}
    </h2>
  );
  return (
    <h3 className="text-[#4361EE] text-sm font-extrabold tracking-[0.15em] uppercase mt-4 mb-1">
      {text}
    </h3>
  );
}

function Paragraph({ text }) {
  // Simple markdown: **bold**, *italic*, `code`
  const html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-white/90 italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[#4361EE] text-sm font-mono">$1</code>');
  return (
    <p
      className="text-white/75 text-base leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ImageBlock({ src, alt, caption }) {
  return (
    <figure className="my-2">
      <img
        src={src}
        alt={alt}
        className="w-full rounded-xl border border-white/5"
        loading="lazy"
      />
      {caption && (
        <figcaption className="text-white/50 text-xs text-center mt-2 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function DiagramBlock({ src, caption }) {
  return (
    <figure className="my-2 bg-[#12122A] rounded-xl p-4 border border-[#4361EE]/20">
      <img src={src} alt={caption} className="w-full" loading="lazy" />
      <figcaption className="text-[#4361EE] text-xs text-center mt-3 font-bold tracking-wider uppercase">
        {caption}
      </figcaption>
    </figure>
  );
}

function ListBlock({ items, ordered }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={`space-y-2 ${ordered ? 'list-decimal list-inside' : ''}`}>
      {items.map((item, i) => (
        <li key={i}
          className={`text-white/75 text-base leading-relaxed
            ${!ordered ? 'flex gap-3 items-start' : ''}`}
        >
          {!ordered && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#4361EE] mt-2 flex-shrink-0" />
          )}
          <span>{item}</span>
        </li>
      ))}
    </Tag>
  );
}

function TipBlock({ text, variant = 'info' }) {
  const styles = {
    info:    { color: '#4361EE', icon: Info,           label: 'INFO' },
    warning: { color: '#F5A623', icon: AlertTriangle,  label: 'ATTENZIONE' },
    success: { color: '#00D68F', icon: CheckCircle2,   label: 'TIP' },
  };
  const s = styles[variant] ?? styles.info;
  const Icon = s.icon;
  return (
    <div
      className="rounded-xl p-4 my-2 border-l-4"
      style={{
        background: `${s.color}10`,
        borderLeftColor: s.color,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={14} style={{ color: s.color }} />
        <div className="text-[10px] font-extrabold tracking-[0.15em]"
          style={{ color: s.color }}>
          {s.label}
        </div>
      </div>
      <div className="text-white/80 text-sm leading-relaxed">{text}</div>
    </div>
  );
}

function QuoteBlock({ text, author }) {
  return (
    <blockquote className="border-l-2 border-white/20 pl-4 py-2 my-2">
      <Quote size={14} className="text-white/30 mb-1" />
      <p className="text-white/85 italic leading-relaxed">"{text}"</p>
      {author && (
        <cite className="text-white/40 text-xs mt-2 block not-italic">— {author}</cite>
      )}
    </blockquote>
  );
}

function VideoBlock({ src, caption }) {
  return (
    <figure className="my-2">
      <div className="relative pb-[56.25%] rounded-xl overflow-hidden border border-white/5">
        <iframe
          src={src}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {caption && (
        <figcaption className="text-white/50 text-xs text-center mt-2 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function TwoColumn({ left, right }) {
  return (
    <div className="grid grid-cols-2 gap-3 my-2">
      <div className="bg-[#12122A] rounded-xl p-3 space-y-2">
        {left.map((b, i) => <BlockRenderer key={i} block={b} />)}
      </div>
      <div className="bg-[#12122A] rounded-xl p-3 space-y-2">
        {right.map((b, i) => <BlockRenderer key={i} block={b} />)}
      </div>
    </div>
  );
}
```

### InlineQuiz Component

```jsx
// components/academy/InlineQuiz.jsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

export function InlineQuiz({ question, options, correctIndex, explanation }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const isCorrect = selected === correctIndex;

  function handleSelect(idx) {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
  }

  return (
    <div className="rounded-xl bg-[#12122A] border border-[#4361EE]/20 p-4 my-3">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle size={14} className="text-[#4361EE]" />
        <div className="text-[10px] font-extrabold tracking-[0.15em] text-[#4361EE]">
          QUIZ RAPIDO
        </div>
      </div>

      <p className="text-white font-bold mb-3">{question}</p>

      <div className="space-y-2">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isAnswerCorrect = i === correctIndex;
          const showAsCorrect   = revealed && isAnswerCorrect;
          const showAsWrong     = revealed && isSelected && !isAnswerCorrect;

          return (
            <motion.button
              key={i}
              onClick={() => handleSelect(i)}
              whileTap={{ scale: revealed ? 1 : 0.98 }}
              disabled={revealed}
              className={`w-full p-3 rounded-lg border text-left text-sm transition-colors
                flex items-center gap-3
                ${showAsCorrect ? 'bg-[#00D68F]/15 border-[#00D68F]/50 text-white' : ''}
                ${showAsWrong   ? 'bg-[#E94560]/15 border-[#E94560]/50 text-white' : ''}
                ${!revealed     ? 'bg-white/5 border-white/10 text-white/80 hover:border-white/30' : ''}
                ${revealed && !isSelected && !isAnswerCorrect ? 'opacity-40 bg-white/5 border-white/10 text-white/60' : ''}
              `}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                ${showAsCorrect ? 'bg-[#00D68F]' : showAsWrong ? 'bg-[#E94560]' : 'bg-white/10'}`}>
                {showAsCorrect && <CheckCircle2 size={14} className="text-white" />}
                {showAsWrong && <XCircle size={14} className="text-white" />}
              </div>
              <span className="font-medium">{opt}</span>
            </motion.button>
          );
        })}
      </div>

      {revealed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-3 p-3 rounded-lg text-sm
            ${isCorrect ? 'bg-[#00D68F]/10' : 'bg-[#E94560]/10'}`}
        >
          <div className={`text-xs font-bold mb-1 tracking-wider
            ${isCorrect ? 'text-[#00D68F]' : 'text-[#E94560]'}`}>
            {isCorrect ? '✓ CORRETTO' : '✗ NON ESATTO'}
          </div>
          <p className="text-white/80 text-sm leading-relaxed">{explanation}</p>
        </motion.div>
      )}
    </div>
  );
}
```

---

## 4. Pages

### Academy Hub — `pages/AcademyPage.jsx`

```jsx
// pages/AcademyPage.jsx

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { PageContainer } from '../components/PageContainer';

export function AcademyPage() {
  const navigate = useNavigate();
  const userId = useAuthStore(s => s.user?.id);
  const [levels, setLevels] = useState([]);
  const [progress, setProgress] = useState({}); // { level_id: { total, completed } }

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
      {/* Back button */}
      <div className="px-4 mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 text-white/70">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[#4361EE]">
            ▲ ACADEMY
          </div>
          <h1 className="text-white text-2xl font-black uppercase tracking-tight">
            X Academy
          </h1>
        </div>
      </div>

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
```

### Level Detail Page — `pages/AcademyLevelPage.jsx`

```jsx
// pages/AcademyLevelPage.jsx

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Lock, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { PageContainer } from '../components/PageContainer';

export function AcademyLevelPage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const userId = useAuthStore(s => s.user?.id);
  const [level, setLevel] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());

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
      <div className="px-4 mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 text-white/70">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold tracking-[0.15em]"
            style={{ color: level.color }}>
            ▲ {level.name.toUpperCase()}
          </div>
          <h1 className="text-white text-xl font-black uppercase tracking-tight truncate">
            {level.subtitle}
          </h1>
        </div>
      </div>

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
```

### Lesson Detail Page — `pages/AcademyLessonPage.jsx`

```jsx
// pages/AcademyLessonPage.jsx

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { PageContainer } from '../components/PageContainer';
import { LessonContent } from '../components/academy/LessonContent';
import { LessonQuiz } from '../components/academy/LessonQuiz';

export function AcademyLessonPage() {
  const { levelId, lessonId } = useParams();
  const navigate = useNavigate();
  const userId = useAuthStore(s => s.user?.id);
  const [lesson, setLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);

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
      <div className="px-4 mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 text-white/70">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[#4361EE]">
            ▲ LEZIONE
          </div>
          <h1 className="text-white text-lg font-black uppercase tracking-tight truncate">
            {lesson.title}
          </h1>
        </div>
        {isCompleted && (
          <div className="w-8 h-8 rounded-full bg-[#00D68F] flex items-center justify-center">
            <Check size={16} className="text-[#0A0A1A]" strokeWidth={3} />
          </div>
        )}
      </div>

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
```

### LessonQuiz Component

```jsx
// components/academy/LessonQuiz.jsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronLeft, Trophy } from 'lucide-react';

export function LessonQuiz({ quiz, onComplete, onCancel }) {
  const questions = quiz.questions ?? [];
  const passingScore = quiz.passingScore ?? Math.ceil(questions.length * 0.7);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]); // array of selected indices
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[step];

  function selectAnswer(idx) {
    const newAnswers = [...answers];
    newAnswers[step] = idx;
    setAnswers(newAnswers);
  }

  function next() {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResults(true);
    }
  }

  function finish() {
    const score = answers.reduce((acc, ans, i) =>
      acc + (ans === questions[i].correctIndex ? 1 : 0), 0);
    const passed = score >= passingScore;
    onComplete({ score, passed, total: questions.length });
  }

  // Results screen
  if (showResults) {
    const score = answers.reduce((acc, ans, i) =>
      acc + (ans === questions[i].correctIndex ? 1 : 0), 0);
    const passed = score >= passingScore;
    const isPerfect = score === questions.length;

    return (
      <div className="px-4 pt-8">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: passed ? 'rgba(0,214,143,0.15)' : 'rgba(233,69,96,0.15)',
              border: passed ? '2px solid #00D68F' : '2px solid #E94560',
            }}>
            {passed
              ? <Trophy size={40} style={{ color: '#00D68F' }} />
              : <X size={40} style={{ color: '#E94560' }} strokeWidth={2.5} />}
          </div>
          <h2 className="text-white text-3xl font-black uppercase tracking-tight mb-2">
            {isPerfect ? 'Perfetto!' : passed ? 'Superato!' : 'Riprova'}
          </h2>
          <div className="text-white/60 text-sm">
            {score} su {questions.length} risposte corrette
          </div>
        </motion.div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl bg-white/5 text-white/70 font-bold tracking-wider"
          >
            INDIETRO
          </button>
          {passed ? (
            <button
              onClick={finish}
              className="flex-1 py-3.5 rounded-xl text-white font-bold tracking-wider"
              style={{ background: 'linear-gradient(135deg, #00D68F, #00A86F)' }}
            >
              COMPLETA
            </button>
          ) : (
            <button
              onClick={() => { setStep(0); setAnswers([]); setShowResults(false); }}
              className="flex-1 py-3.5 rounded-xl text-white font-bold tracking-wider"
              style={{ background: 'linear-gradient(135deg, #4361EE, #2E45C9)' }}
            >
              RIPROVA
            </button>
          )}
        </div>
      </div>
    );
  }

  // Question screen
  const selectedAnswer = answers[step];
  return (
    <div>
      <div className="px-4 mb-4 flex items-center gap-3">
        <button onClick={onCancel}
          className="p-2 rounded-xl bg-white/5 text-white/70">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[#4361EE]">
            QUIZ — DOMANDA {step + 1} / {questions.length}
          </div>
          <h1 className="text-white text-base font-black uppercase tracking-tight">
            Test finale
          </h1>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-4 h-1 bg-white/5 rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full bg-[#4361EE]"
          animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-white text-lg font-bold mb-6 leading-relaxed">
              {currentQuestion.question}
            </p>

            <div className="space-y-2.5 mb-6">
              {currentQuestion.options.map((opt, i) => {
                const isSelected = selectedAnswer === i;
                return (
                  <motion.button
                    key={i}
                    onClick={() => selectAnswer(i)}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-colors
                      ${isSelected
                        ? 'bg-[#4361EE]/15 border-[#4361EE] text-white'
                        : 'bg-[#12122A] border-white/10 text-white/80 hover:border-white/30'}`}
                  >
                    <span className="font-medium">{opt}</span>
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={next}
              disabled={selectedAnswer == null}
              className="w-full py-4 rounded-xl font-bold tracking-wider text-white
                disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #4361EE, #2E45C9)' }}
            >
              {step === questions.length - 1 ? 'VEDI RISULTATI' : 'PROSSIMA'}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
```

### Routes

```jsx
// App.jsx — add to router
<Route path="/academy"                     element={<AcademyPage />} />
<Route path="/academy/:levelId"            element={<AcademyLevelPage />} />
<Route path="/academy/:levelId/:lessonId"  element={<AcademyLessonPage />} />
```

---

## 5. Content Seed — 24 Lessons

Below is the SQL to seed the full curriculum. Each lesson has structured content blocks. Content is in Italian to match the app language.

> ⚠️ This is **a lot** of SQL. I recommend running it in chunks — one INSERT per lesson — so it's easier to debug if something fails. Place it in a migration file like `migrations/seed_academy_lessons.sql`.

### Beginner Level (6 lessons)

```sql
-- ════════════════════════════════════════════════════════════════
-- BEGINNER LEVEL
-- ════════════════════════════════════════════════════════════════

-- Lesson 1: What is Beyblade X
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('what-is-beyblade-x', 'beginner', 'Cos''è Beyblade X', 'La nuova generazione delle trottole da battaglia', 4, 25, 1,
'[
  {"type":"paragraph","text":"**Beyblade X** è la quarta generazione del franchise Beyblade, lanciata da Takara Tomy nel **luglio 2023** in Giappone e successivamente distribuita da Hasbro nel resto del mondo. Rappresenta un''evoluzione importante rispetto alle generazioni precedenti (Plastic, Metal, Burst) introducendo meccaniche di gioco completamente nuove."},
  {"type":"heading","level":2,"text":"Cosa la rende diversa"},
  {"type":"paragraph","text":"La differenza più rivoluzionaria è il sistema **Xtreme Dash**: lo stadio ha una rotaia inclinata sul bordo (la *Xtreme Line*) su cui le Beyblade possono accelerare violentemente. Questo crea battaglie molto più dinamiche e aggressive rispetto alle generazioni precedenti."},
  {"type":"list","items":[
    "**Xtreme Line**: rotaia che amplifica la velocità e crea KO devastanti",
    "**Sistema modulare**: ogni Beyblade è composto da 3 parti intercambiabili",
    "**Gameplay più veloce**: battaglie tipicamente più brevi ma intense",
    "**Più peso e materiale metallico** rispetto a Burst"
  ]},
  {"type":"tip","variant":"info","text":"Beyblade X è anche conosciuto come ''X Generation'' o ''Beyblade 4G'' nella community competitiva."},
  {"type":"heading","level":2,"text":"Le tre linee di prodotto"},
  {"type":"paragraph","text":"Beyblade X si divide in tre linee principali, ognuna con caratteristiche tecniche diverse:"},
  {"type":"list","items":[
    "**BX (Basic)**: la linea base, struttura standard a 3 parti (Blade + Ratchet + Bit)",
    "**UX (Unique)**: introduce gimmick speciali come Ratchet integrati nel Blade",
    "**CX (Custom)**: aggiunge personalizzazione con Lock Chip + Main Blade + Assist Blade"
  ]}
]',
'{"questions":[
  {"question":"In che anno è stato lanciato Beyblade X in Giappone?","options":["2021","2023","2024","2020"],"correctIndex":1,"explanation":"Beyblade X è stato lanciato da Takara Tomy nel luglio 2023 in Giappone."},
  {"question":"Cosa è la Xtreme Line?","options":["Una sfera al centro dello stadio","Una rotaia inclinata sul bordo dello stadio","Il bordo esterno del Beyblade","Una mossa speciale del lanciatore"],"correctIndex":1,"explanation":"La Xtreme Line è la rotaia inclinata sul bordo dello stadio che permette ai Beyblade di accelerare e creare KO devastanti."},
  {"question":"Quante linee principali di prodotto esistono in Beyblade X?","options":["2","3","4","5"],"correctIndex":1,"explanation":"Le tre linee principali sono BX (Basic), UX (Unique) e CX (Custom)."}
]}'
);

-- Lesson 2: Anatomy of a Beyblade
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content) VALUES
('beyblade-anatomy', 'beginner', 'Anatomia di un Beyblade X', 'Le tre parti che compongono ogni Bey', 5, 30, 2,
'[
  {"type":"paragraph","text":"Ogni Beyblade X (linea BX e UX) è composto da **tre parti modulari** che si combinano per formare la trottola completa. Conoscere il ruolo di ciascuna è fondamentale per costruire combo efficaci."},
  {"type":"heading","level":2,"text":"1. Blade — Il Cuore"},
  {"type":"paragraph","text":"Il **Blade** è la parte superiore, la più visibile e iconica. È quello che entra in contatto con l''avversario durante la battaglia. La sua forma determina:"},
  {"type":"list","items":[
    "Il **tipo** del Beyblade (Attack, Defense, Stamina, Balance)",
    "Il **peso totale** (un Blade pesa tipicamente 30-38g)",
    "La **direzione di rotazione** (Right o Left)",
    "Il **design estetico** (la mascotte/disegno centrale)"
  ]},
  {"type":"heading","level":2,"text":"2. Ratchet — La Spina Dorsale"},
  {"type":"paragraph","text":"Il **Ratchet** è il componente centrale, una sorta di anello dentato. Si nomina con due numeri, ad esempio `4-60`, dove:"},
  {"type":"list","items":[
    "**Primo numero (4)**: numero di lati/sporgenze del ratchet — più sono, maggiore la resistenza al burst",
    "**Secondo numero (60)**: altezza in millimetri — i valori comuni sono 60mm, 70mm, 80mm"
  ]},
  {"type":"tip","variant":"success","text":"Un Ratchet alto (80mm) sposta il baricentro in alto rendendo il Beyblade più aggressivo. Uno basso (60mm) abbassa il baricentro per maggiore stabilità."},
  {"type":"heading","level":2,"text":"3. Bit — Il Punto di Contatto"},
  {"type":"paragraph","text":"Il **Bit** è la punta inferiore che tocca lo stadio. È il componente più piccolo ma uno dei più importanti perché determina come il Beyblade si muove durante la battaglia."},
  {"type":"list","items":[
    "**Bit piatti** (Flat): movimento aggressivo e veloce, perfetti per Attack",
    "**Bit sferici** (Ball): permanenza al centro, ideali per Stamina",
    "**Bit appuntiti** (Needle): stabilità rocciosa, tipici dei Defense"
  ]},
  {"type":"tip","variant":"warning","text":"I Bit con la dicitura ''Gear'' hanno denti dentati che permettono di ''dashare'' sulla Xtreme Line per attacchi devastanti."}
]'
);

-- Lesson 3: Stadium and Components
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('stadium-and-zones', 'beginner', 'Lo Stadio e le sue Zone', 'Conoscere il campo di battaglia', 4, 25, 3,
'[
  {"type":"paragraph","text":"Lo stadio ufficiale di Beyblade X è chiamato **Xtreme Stadium** (Hasbro lo distribuisce come *Xtreme Beystadium F9588*). Solo questo modello e i suoi equivalenti regionali sono ammessi nei tornei ufficiali."},
  {"type":"heading","level":2,"text":"Le tre zone dello stadio"},
  {"type":"paragraph","text":"Lo stadio è diviso in **tre zone** distinte, ognuna con effetti diversi sulla battaglia:"},
  {"type":"heading","level":3,"text":"Battle Zone"},
  {"type":"paragraph","text":"L''area centrale dove si svolge la maggior parte della battaglia. È la zona più ampia e si trova al centro dello stadio."},
  {"type":"heading","level":3,"text":"Over Zones"},
  {"type":"paragraph","text":"Sono le **due tasche laterali** (sinistra e destra). Se il tuo Beyblade finisce in una Over Zone, è considerato KO standard e l''avversario guadagna **2 punti**."},
  {"type":"heading","level":3,"text":"Xtreme Zone"},
  {"type":"paragraph","text":"È il **buco centrale frontale** dello stadio. Più difficile da raggiungere, ma se il tuo Beyblade ci finisce dentro, l''avversario ottiene **3 punti** invece di 2 (variante WBO) o comunque la vittoria immediata in molti formati."},
  {"type":"tip","variant":"info","text":"La Xtreme Line, il bordo inclinato che corre attorno alla Battle Zone, è dove avvengono i ''dash'' più spettacolari. I Bit con gear sfruttano questa rotaia per accelerare e mandare gli avversari in KO."},
  {"type":"heading","level":2,"text":"Launcher e Winder"},
  {"type":"paragraph","text":"Per lanciare il Beyblade ti servono due componenti:"},
  {"type":"list","items":[
    "**Launcher**: il dispositivo a cui agganci il Beyblade. Ne esistono modelli base, sport e da gara",
    "**Winder (ripcord)**: la striscia dentata che inserisci nel launcher e tiri per dare la rotazione"
  ]},
  {"type":"tip","variant":"warning","text":"I launcher devono corrispondere alla direzione di rotazione del Beyblade: Right launcher per Bey right-spin, Left launcher per Bey left-spin. Usare il launcher sbagliato non funziona!"}
]',
'{"questions":[
  {"question":"Quanti punti vale un KO nella Xtreme Zone (regole WBO)?","options":["1 punto","2 punti","3 punti","4 punti"],"correctIndex":2,"explanation":"Nelle regole WBO, un KO nella Xtreme Zone vale 3 punti, mentre in Over Zone vale 2 punti."},
  {"question":"Cosa devi tirare per lanciare un Beyblade?","options":["Il launcher","Il winder/ripcord","Il Bit","Il Ratchet"],"correctIndex":1,"explanation":"Il winder (o ripcord) è la striscia dentata che si tira velocemente per dare rotazione al Beyblade."}
]}'
);

-- Lesson 4: How to Launch
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content) VALUES
('how-to-launch', 'beginner', 'Come Lanciare', 'Le basi del lancio corretto', 5, 30, 4,
'[
  {"type":"paragraph","text":"Saper lanciare correttamente è la prima skill che ogni blader deve acquisire. Un buon lancio può fare la differenza tra una vittoria e una sconfitta. Vediamo i passaggi fondamentali."},
  {"type":"heading","level":2,"text":"Il lancio passo-passo"},
  {"type":"list","ordered":true,"items":[
    "**Aggancia il Beyblade al launcher** allineando le tacche",
    "**Inserisci il winder** nel launcher fino in fondo",
    "**Posizionati di fronte allo stadio** con i piedi fermi nella zona di lancio",
    "**Tieni il launcher sopra l''area di lancio** dello stadio (il foro centrale)",
    "**Tira il winder con un movimento deciso e orizzontale**, non in diagonale",
    "**Mantieni il launcher fermo** mentre tiri — il movimento deve essere solo del winder"
  ]},
  {"type":"tip","variant":"success","text":"La velocità di rotazione (RPM) dipende quasi interamente dalla velocità con cui tiri il winder. Più veloce e fluido è il movimento, più giri al minuto otterrai."},
  {"type":"heading","level":2,"text":"Errori comuni da evitare"},
  {"type":"list","items":[
    "**Lancio diagonale**: tirare il winder in diagonale riduce la potenza e può far cadere il Beyblade fuori dall''area",
    "**Lancio fiacco**: non tirare con decisione produce poca rotazione e perdi subito",
    "**Mani tremolanti**: muovere il launcher mentre tiri causa lanci imprecisi",
    "**Posizione sbagliata**: lanciare lontano dall''area di lancio è considerato fallo nei tornei"
  ]},
  {"type":"heading","level":2,"text":"Tipi di lancio (basi)"},
  {"type":"paragraph","text":"Esistono tecniche di lancio diverse che imparerai più avanti, ma per ora è importante conoscere queste due:"},
  {"type":"list","items":[
    "**Lancio neutro**: launcher tenuto perpendicolare allo stadio, equilibrato",
    "**Bank shot (lancio inclinato)**: launcher leggermente inclinato per direzionare il Beyblade verso la Xtreme Line"
  ]},
  {"type":"tip","variant":"info","text":"Le tecniche avanzate di lancio (bank shot, sliding shoot, ecc.) le approfondiremo nel livello Intermedio e Avanzato."}
]'
);

-- Lesson 5: Basic Rules
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('basic-rules', 'beginner', 'Regole Fondamentali', 'Come si vince una battaglia', 6, 30, 5,
'[
  {"type":"paragraph","text":"Beyblade X ha un sistema di punteggio basato sui **finishing moves**: ogni modo di vincere una battaglia attribuisce un certo numero di punti. Conoscere questi punti è essenziale per pianificare la propria strategia."},
  {"type":"heading","level":2,"text":"I quattro tipi di vittoria"},
  {"type":"heading","level":3,"text":"Burst Finish (2 punti)"},
  {"type":"paragraph","text":"Quando il Beyblade dell''avversario **si smonta** (le parti si staccano) durante l''impatto. È il finish più spettacolare e vale 2 punti."},
  {"type":"heading","level":3,"text":"Over Finish / Knock-Out (2 punti)"},
  {"type":"paragraph","text":"Quando il Beyblade dell''avversario viene **espulso dallo stadio** finendo in una delle due Over Zones laterali. Vale 2 punti."},
  {"type":"heading","level":3,"text":"Xtreme Finish (3 punti)"},
  {"type":"paragraph","text":"Quando il Beyblade dell''avversario finisce nella **Xtreme Zone centrale** (il buco frontale). Vale 3 punti — il finish più redditizio."},
  {"type":"heading","level":3,"text":"Spin Finish / Out-Spin (1 punto)"},
  {"type":"paragraph","text":"Quando il tuo Beyblade **continua a girare dopo che quello dell''avversario si è fermato**. È il finish più ''pacifico'' e vale 1 punto."},
  {"type":"heading","level":2,"text":"Quando si vince un match"},
  {"type":"paragraph","text":"Un match si conclude quando un giocatore raggiunge il punteggio target, che varia per formato:"},
  {"type":"list","items":[
    "**Tornei standard (prima fase)**: primo a 4 punti vince",
    "**Tornei avanzati (fase finale)**: primo a 7 punti vince",
    "**Round Robin**: quasi sempre primo a 4 punti",
    "**Casual / casa**: generalmente primo a 3 punti"
  ]},
  {"type":"tip","variant":"info","text":"Il regolamento ufficiale Takara Tomy (8th edition, April 2025) usa il primo a 4 punti come default. Il regolamento Hasbro USA del 2025 ha portato il primo turno a 4 punti e i finals a 10 punti per il National Championship."},
  {"type":"heading","level":2,"text":"Spin direction matters"},
  {"type":"paragraph","text":"Beyblade X include sia Bey **right-spin** (rotazione oraria, la più comune) sia **left-spin** (antioraria). Quando si scontrano due Bey con direzioni opposte, l''impatto è molto più violento."},
  {"type":"tip","variant":"warning","text":"Devi usare il launcher giusto per ogni direzione: launcher right per right-spin, launcher left per left-spin. Sono dispositivi diversi e non intercambiabili!"}
]',
'{"questions":[
  {"question":"Quanti punti vale un Burst Finish?","options":["1","2","3","4"],"correctIndex":1,"explanation":"Il Burst Finish (quando il Beyblade dell''avversario si smonta) vale 2 punti."},
  {"question":"Qual è il finish che vale di più?","options":["Burst Finish","Over Finish","Xtreme Finish","Spin Finish"],"correctIndex":2,"explanation":"L''Xtreme Finish vale 3 punti, il massimo."},
  {"question":"Nei tornei standard, qual è il primo punteggio per vincere?","options":["3","4","5","7"],"correctIndex":1,"explanation":"Il regolamento ufficiale (8th edition) prevede che il primo a 4 punti vinca il match nella prima fase del torneo."}
]}'
);

-- Lesson 6: Your First Battle
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content) VALUES
('first-battle', 'beginner', 'La Tua Prima Battaglia', 'Pronto per scendere in arena', 4, 30, 6,
'[
  {"type":"paragraph","text":"Hai imparato cos''è Beyblade X, come è composto, come si lancia e le regole base. Ora è il momento di mettere tutto insieme e affrontare la tua prima battaglia. Ecco un walkthrough completo."},
  {"type":"heading","level":2,"text":"Prima del lancio"},
  {"type":"list","ordered":true,"items":[
    "**Scegli il tuo Beyblade**: per iniziare, va bene qualsiasi Bey della linea BX (Basic). Wizard Arrow, Knight Shield e Hells Scythe sono ottime scelte da starter",
    "**Verifica le parti**: il Beyblade deve essere assemblato correttamente — Blade + Ratchet + Bit avvitati saldamente",
    "**Prepara launcher e winder**: il launcher giusto per la direzione di rotazione del Bey",
    "**Mettiti d''accordo con l''avversario**: entrambi confermate il punteggio target (3, 4 o 7 punti)"
  ]},
  {"type":"heading","level":2,"text":"Il countdown"},
  {"type":"paragraph","text":"Il giudice (o uno dei giocatori, in casual) chiama il countdown standard:"},
  {"type":"quote","text":"3... 2... 1... GO SHOOT!","author":"Comando standard di lancio"},
  {"type":"paragraph","text":"Devi lanciare **esattamente sulla parola ''SHOOT''**. Lanciare prima è un *premature launch* (falso start), lanciare dopo è un *late shot*. Entrambi sono falli."},
  {"type":"tip","variant":"warning","text":"Due falli nello stesso match danno 1 punto all''avversario e si rigioca la battaglia. Sii attento al timing!"},
  {"type":"heading","level":2,"text":"Durante la battaglia"},
  {"type":"list","items":[
    "**Fai un passo indietro** dopo aver lanciato — non sporgerti sullo stadio",
    "**Non guardare dentro lo stadio** prima della fine della battaglia",
    "**Non toccare il Beyblade** finché non si ferma o non viene chiamato il finish",
    "**Aspetta il giudice** per la chiamata ufficiale del finish e dei punti"
  ]},
  {"type":"heading","level":2,"text":"Dopo il finish"},
  {"type":"paragraph","text":"Una volta che il giudice ha assegnato i punti, raccogli il tuo Beyblade, controlla che non si sia rotto, e prepara il prossimo lancio. La battaglia continua finché uno dei due raggiunge il punteggio target."},
  {"type":"tip","variant":"success","text":"Importante: **mai cambiare le parti del Beyblade** durante un match torneo, a meno che una parte non si rompa. In quel caso, si sostituisce con una parte identica e si rigioca."},
  {"type":"heading","level":2,"text":"Etichetta del blader"},
  {"type":"list","items":[
    "**Saluta sempre l''avversario** prima e dopo il match",
    "**Stringi la mano** alla fine, indipendentemente dal risultato",
    "**Non lamentarti** delle sconfitte — sono parte del gioco",
    "**Festeggia con misura** le vittorie — niente trash talk eccessivo"
  ]}
]'
);
```

### Intermediate, Advanced, and Pro Levels

> 💡 **Per ragioni di lunghezza del documento**, includo qui la struttura completa con titoli e sottotitoli per i restanti 18 lessons. Posso fornire il contenuto completo di ciascuno in un follow-up separato — saranno circa 4-5 lezioni per documento. Fammi sapere quando vuoi i contenuti dei livelli successivi.

```sql
-- ════════════════════════════════════════════════════════════════
-- INTERMEDIATE LEVEL (placeholder structure — content to be added)
-- ════════════════════════════════════════════════════════════════
-- Lesson 7:  'archetypes-explained'    — I Quattro Archetipi (Attack/Defense/Stamina/Balance)
-- Lesson 8:  'choosing-blades'         — Come Scegliere un Blade
-- Lesson 9:  'understanding-ratchets'  — Capire i Ratchet (lati e altezza)
-- Lesson 10: 'understanding-bits'      — Capire i Bit (movimento e materiale)
-- Lesson 11: 'building-first-combo'    — Costruire la Tua Prima Combo Vincente
-- Lesson 12: 'matchup-basics'          — Matchup di Base (chi batte chi)

-- ════════════════════════════════════════════════════════════════
-- ADVANCED LEVEL (placeholder structure — content to be added)
-- ════════════════════════════════════════════════════════════════
-- Lesson 13: 'tier-list-explained'     — Capire le Tier List (S/A/B/C/D)
-- Lesson 14: 'meta-analysis'           — Analizzare il Meta Corrente
-- Lesson 15: 'tournament-formats'      — Formati di Torneo (1v1, 3v3, Swiss, Bracket)
-- Lesson 16: 'launching-techniques'    — Tecniche di Lancio Avanzate (Bank Shot, Sliding Shoot)
-- Lesson 17: 'deck-building'           — Costruire un Deck Competitivo (3v3)
-- Lesson 18: 'reading-opponent'        — Leggere l''Avversario

-- ════════════════════════════════════════════════════════════════
-- PRO LEVEL (placeholder structure — content to be added)
-- ════════════════════════════════════════════════════════════════
-- Lesson 19: 'parts-maintenance'       — Manutenzione delle Parti
-- Lesson 20: 'wear-and-replacement'    — Usura e Sostituzione (quando rinnovare)
-- Lesson 21: 'micro-optimizations'     — Micro-Ottimizzazioni
-- Lesson 22: 'mind-games'              — Mind Games e Psicologia
-- Lesson 23: 'tournament-prep'         — Preparazione al Torneo
-- Lesson 24: 'becoming-a-champion'     — Diventare un Campione
```

---

## 6. Update Home Screen Academy Banner

The existing X Academy banner on the home screen should now show real progress data instead of just being a static link:

```jsx
// components/AcademyBanner.jsx — updated to show progress

import { useEffect, useState } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';

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
    <button
      onClick={onClick}
      className="w-full relative overflow-hidden rounded-xl bg-[#12122A]
        border border-[#4361EE]/20 px-4 py-3.5 flex items-center gap-3.5
        hover:border-[#4361EE]/40 transition-colors"
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(110deg, transparent 40%, rgba(67,97,238,0.08) 70%, transparent 100%)' }} />

      <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center flex-shrink-0
        bg-[#4361EE]/[0.12] border border-[#4361EE]/30"
        style={{ transform: 'rotate(-3deg)' }}>
        <BookOpen size={20} className="text-[#4361EE]" />
      </div>

      <div className="flex-1 min-w-0 relative text-left">
        <div className="text-[13px] font-extrabold text-white leading-tight">
          X ACADEMY
        </div>
        <div className="text-[10px] text-white/45 mt-0.5 font-medium">
          {stats.completed} / {stats.total} lezioni completate
        </div>
        {stats.total > 0 && (
          <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-[#4361EE] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      <ChevronRight size={16} className="text-[#4361EE]" strokeWidth={3} />
    </button>
  );
}
```

---

## 7. Implementation Checklist

1. ✅ **Run database migrations** — academy_levels, academy_lessons, user_academy_progress tables + triggers
2. ✅ **Seed academy_levels** — 4 levels with metadata
3. ✅ **Seed achievements** — 6 new academy achievements + update category constraint
4. ✅ **Seed first 6 lessons** (Beginner) — content provided in this briefing
5. ✅ **Create components**:
   - `LessonContent.jsx` (block renderer)
   - `InlineQuiz.jsx` (mid-lesson quiz)
   - `LessonQuiz.jsx` (end-of-lesson quiz)
6. ✅ **Create pages**:
   - `AcademyPage.jsx` (hub)
   - `AcademyLevelPage.jsx` (lesson list per level)
   - `AcademyLessonPage.jsx` (lesson detail + content)
7. ✅ **Add routes** for `/academy`, `/academy/:levelId`, `/academy/:levelId/:lessonId`
8. ✅ **Update `AcademyBanner.jsx`** on home screen to show progress
9. 🔜 **Request remaining 18 lessons content** in follow-up briefings (Intermediate, Advanced, Pro)

---

*End of Briefing — BeyManager X Academy — April 2026*
