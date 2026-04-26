-- ────────────────────────────────────────────────────
-- ACADEMY LEVELS — Beginner, Intermediate, Advanced, Pro
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academy_levels (
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
CREATE TABLE IF NOT EXISTS academy_lessons (
  id             TEXT PRIMARY KEY,      -- slug like 'what-is-beyblade-x'
  level_id       TEXT NOT NULL REFERENCES academy_levels(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  subtitle       TEXT,                  -- Short tagline
  duration_min   INT  DEFAULT 5,        -- Estimated reading time
  xp_reward      INT  DEFAULT 25,       -- XP awarded on completion
  sort_order     INT  NOT NULL,

  -- Content stored as JSONB array of content blocks
  content        JSONB NOT NULL DEFAULT '[]',

  -- Optional: end-of-lesson quiz
  quiz           JSONB,

  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Safely create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lessons_level') THEN
        CREATE INDEX idx_lessons_level ON academy_lessons(level_id);
    END IF;
END$$;

-- ────────────────────────────────────────────────────
-- USER LESSON PROGRESS — tracks completion
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_academy_progress (
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id    TEXT NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,

  status       TEXT NOT NULL CHECK (status IN ('started', 'completed')),
  quiz_score   INT,                     -- Quiz score (out of total questions), null if no quiz
  quiz_passed  BOOLEAN,                 -- True if score >= passing threshold
  completed_at TIMESTAMPTZ,
  started_at   TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, lesson_id)
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_progress_user') THEN
        CREATE INDEX idx_progress_user ON user_academy_progress(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_progress_lesson') THEN
        CREATE INDEX idx_progress_lesson ON user_academy_progress(lesson_id);
    END IF;
END$$;

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
    UPDATE profiles SET xp = xp + COALESCE(reward, 25)
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

DROP POLICY IF EXISTS academy_levels_select ON academy_levels;
CREATE POLICY academy_levels_select   ON academy_levels   FOR SELECT USING (true);

DROP POLICY IF EXISTS academy_lessons_select ON academy_lessons;
CREATE POLICY academy_lessons_select  ON academy_lessons  FOR SELECT USING (true);

DROP POLICY IF EXISTS progress_select ON user_academy_progress;
CREATE POLICY progress_select ON user_academy_progress FOR SELECT USING (true);

DROP POLICY IF EXISTS progress_write ON user_academy_progress;
CREATE POLICY progress_write  ON user_academy_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update achievements category check constraint to include 'academy'
ALTER TABLE achievements DROP CONSTRAINT IF EXISTS achievements_category_check;
ALTER TABLE achievements ADD CONSTRAINT achievements_category_check
  CHECK (category IN ('battle', 'collection', 'combo', 'special', 'academy'));

-- Add new academy-related achievements safely
INSERT INTO achievements (id, name, description, icon, color, category, threshold, sort_order) VALUES
  ('academy_first',   'Primo Passo',         'Completa la prima lezione dell''Academy', 'BookOpen',  '#4361EE', 'academy', 1,  410),
  ('academy_beginner','Apprendista',          'Completa tutte le lezioni Beginner',     'GraduationCap','#00D68F', 'academy', 6,  420),
  ('academy_inter',   'Studioso',             'Completa tutte le lezioni Intermediate', 'BookMarked','#4361EE', 'academy', 12, 430),
  ('academy_advanced','Veterano',             'Completa tutte le lezioni Advanced',     'Award',     '#A855F7', 'academy', 18, 440),
  ('academy_pro',     'Dottorato',            'Completa tutte le lezioni Pro',          'Crown',     '#F5A623', 'academy', 24, 450),
  ('quiz_perfect',    'Memoria di Ferro',     'Ottieni il punteggio massimo in 5 quiz', 'Brain',     '#E94560', 'academy', 5,  460)
ON CONFLICT (id) DO NOTHING;

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

  IF total_completed >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, 'academy_first') ON CONFLICT DO NOTHING;
  END IF;
  IF beginner_count >= 6 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, 'academy_beginner') ON CONFLICT DO NOTHING;
  END IF;
  IF inter_count >= 6 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, 'academy_inter') ON CONFLICT DO NOTHING;
  END IF;
  IF advanced_count >= 6 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, 'academy_advanced') ON CONFLICT DO NOTHING;
  END IF;
  IF pro_count >= 6 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, 'academy_pro') ON CONFLICT DO NOTHING;
  END IF;
  IF perfect_quizzes >= 5 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, 'quiz_perfect') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_academy_achievements ON user_academy_progress;
CREATE TRIGGER trg_academy_achievements
  AFTER INSERT OR UPDATE ON user_academy_progress
  FOR EACH ROW EXECUTE FUNCTION check_academy_achievements();

INSERT INTO academy_levels (id, name, subtitle, description, color, icon, sort_order) VALUES
  ('beginner', 'Principiante', 'Le basi del Beyblade X', 'Inizia da qui. Imparerai cos''è un Beyblade, come si compone, come si lancia e le regole fondamentali per giocare.', '#00D68F', 'Sprout', 1),
  ('intermediate', 'Intermedio', 'Strategie e composizione', 'Ora che conosci le basi, scopri come scegliere le parti, capire gli archetipi (Attack/Defense/Stamina/Balance) e costruire combo efficaci.', '#4361EE', 'Target', 2),
  ('advanced', 'Avanzato', 'Meta competitivo e tornei', 'Tier list, formati di gioco, tecniche di lancio avanzate e analisi del meta corrente. Per chi vuole vincere i tornei.', '#A855F7', 'Trophy', 3),
  ('pro', 'Professionista', 'Il livello dei campioni', 'Manutenzione delle parti, micro-ottimizzazioni, lettura dell''avversario, psicologia del torneo. Tutto quello che serve per vincere ai massimi livelli.', '#F5A623', 'Crown', 4)
ON CONFLICT (id) DO NOTHING;

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
) ON CONFLICT (id) DO NOTHING;

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
) ON CONFLICT (id) DO NOTHING;

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
) ON CONFLICT (id) DO NOTHING;

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
) ON CONFLICT (id) DO NOTHING;

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
) ON CONFLICT (id) DO NOTHING;

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
) ON CONFLICT (id) DO NOTHING;
