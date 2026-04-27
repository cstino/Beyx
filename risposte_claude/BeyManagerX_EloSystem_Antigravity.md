# BeyManager X — Sistema ELO & Ranking Competitivo

**Briefing for Antigravity — April 2026**

---

Hey Antigravity — ora costruiamo la dimensione competitiva dell'app: un sistema **ELO ranking** con rank gaming-style (Iron → Grandmaster), distinzione tra **partite ufficiali** (che danno ELO) e **amichevoli** (che non lo danno), e una **leaderboard ELO globale**. Il design è ispirato al sistema scacchi ma adattato per Beyblade X con considerazione del margine di punteggio.

**Decisioni chiave (già prese)**:
- ELO iniziale: **1000**
- Calcolo: vittoria/sconfitta + **margine di punteggio** (4-0 vale più di 4-3)
- Battle eligibility: **1v1 + 3v3 + tornei**, con pesi diversi
- Rank style: **Iron → Bronze → Silver → Gold → Platinum → Diamond → Champion → Grandmaster**

---

## 1. Database Schema

### Tabella ELO ratings (storico per utente)

```sql
-- ────────────────────────────────────────────────────
-- USER ELO HISTORY — tracking rating changes over time
-- ────────────────────────────────────────────────────
CREATE TABLE user_elo_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  elo_before   INT NOT NULL,
  elo_after    INT NOT NULL,
  delta        INT NOT NULL,                                -- elo_after - elo_before
  reason       TEXT NOT NULL CHECK (reason IN ('1v1', '3v3', 'tournament', 'placement', 'decay', 'admin')),
  battle_id    UUID REFERENCES battles(id) ON DELETE SET NULL,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  opponent_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  opponent_elo INT,                                          -- ELO dell'avversario al momento del match
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_elo_history_user      ON user_elo_history(user_id, created_at DESC);
CREATE INDEX idx_elo_history_battle    ON user_elo_history(battle_id);
CREATE INDEX idx_elo_history_tournament ON user_elo_history(tournament_id);
```

### Estensioni alla tabella profiles

```sql
-- Aggiungi campo ELO al profilo utente
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS elo INT NOT NULL DEFAULT 1000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS elo_peak INT NOT NULL DEFAULT 1000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS elo_matches INT NOT NULL DEFAULT 0;     -- match ufficiali giocati
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS placement_done BOOLEAN NOT NULL DEFAULT false;  -- 5 placement match completati?

-- Index per leaderboard veloce
CREATE INDEX idx_profiles_elo ON profiles(elo DESC) WHERE elo_matches >= 5;
```

### Estensioni alle tabelle battles e tournaments

```sql
-- Distinguere battaglie ufficiali (ELO) da amichevoli (no ELO)
ALTER TABLE battles ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false;

-- Stessa cosa per i tornei
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false;

-- Index per query veloce delle partite ELO
CREATE INDEX idx_battles_official ON battles(is_official) WHERE is_official = true;
CREATE INDEX idx_tournaments_official ON tournaments(is_official) WHERE is_official = true;
```

> 💡 **Filosofia**: di default tutte le battaglie sono **amichevoli** (`is_official = false`). L'utente deve esplicitamente flaggarle come ufficiali al momento della creazione. Questo previene inflazione/deflazione accidentale dell'ELO. Solo le battaglie tra due utenti registrati possono essere ufficiali — battaglie con guest non danno ELO (mancherebbe l'avversario nel sistema).

### RLS Policies

```sql
ALTER TABLE user_elo_history ENABLE ROW LEVEL SECURITY;

-- Tutti possono leggere lo storico ELO (per leaderboard, profili pubblici)
CREATE POLICY elo_history_select ON user_elo_history FOR SELECT USING (true);

-- Solo il sistema può inserire (via trigger), nessuno via client
-- (Le INSERT avvengono solo da SECURITY DEFINER functions)
```

---

## 2. Formula ELO

### Calcolo base (formula scacchi adattata)

La formula classica ELO con **K-factor adattivo** e **modificatore di margine**:

```
ELO_new = ELO_current + K × (Score_actual - Score_expected) × Margin_multiplier

dove:
  Score_expected = 1 / (1 + 10^((ELO_opponent - ELO_current) / 400))
  Score_actual   = 1 (vittoria), 0.5 (pareggio), 0 (sconfitta)
  K              = K-factor (vedi sotto)
  Margin_multiplier = bonus/penalità per margine punteggio (vedi sotto)
```

### K-Factor

Determina **quanto** un singolo match impatta l'ELO. Valori più alti = più volatilità, più bassi = più stabilità:

| Condizione | K-Factor | Note |
|---|---|---|
| Placement (primi 5 match) | **40** | Stabilizzazione iniziale veloce |
| Player normale (5-30 match) | **24** | Standard |
| Player veterano (30+ match) | **16** | Stabilità ELO consolidato |
| Player in zona Diamond+ (1700+) | **12** | Massima stabilità ad alto livello |

```sql
CREATE OR REPLACE FUNCTION get_k_factor(p_elo INT, p_matches INT)
RETURNS INT AS $$
BEGIN
  IF p_matches < 5 THEN
    RETURN 40;  -- Placement
  ELSIF p_elo >= 1700 THEN
    RETURN 12;  -- Diamond+
  ELSIF p_matches >= 30 THEN
    RETURN 16;  -- Veteran
  ELSE
    RETURN 24;  -- Normal
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Margin Multiplier

Tiene conto della differenza di punteggio del match. Una vittoria 4-0 vale più di una 4-3:

```
Margin_multiplier = 1 + 0.15 × (margin_ratio - 0.5)

dove:
  margin_ratio = vincitore_punti / (vincitore_punti + perdente_punti)
  Range: 0.5 (4-3 = 4/7 ≈ 0.57) → 1.0 (4-0 = 4/4 = 1.0)
  Multiplier finale: 1.0 (margine minimo) → 1.15 (margine massimo)
```

Una "stomp" 4-0 dà il 15% in più di ELO, una vittoria stretta 4-3 invece dà l'ELO base. Mai meno del valore base (multiplier minimo 1.0).

### Battle Type Weight

Diversi tipi di battaglia hanno pesi diversi:

| Tipo | Weight | Note |
|---|---|---|
| 1v1 ufficiale | **1.0x** | Standard |
| 3v3 ufficiale | **1.5x** | Più strategia, più difficile |
| Tornei (per match) | **1.2x** | Pressure tournament |
| Vincitore torneo (bonus) | **+50 ELO** | Bonus piazzamento |
| 2° posto torneo (bonus) | **+30 ELO** | |
| 3°-4° posto torneo (bonus) | **+15 ELO** | |

### Funzione SQL completa

```sql
-- ────────────────────────────────────────────────────
-- CALCOLO ELO per battaglia (chiamata dal trigger)
-- ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_elo_change(
  p_winner_elo INT,
  p_loser_elo  INT,
  p_winner_matches INT,
  p_loser_matches  INT,
  p_winner_score INT,
  p_loser_score  INT,
  p_battle_type TEXT  -- '1v1' | '3v3' | 'tournament'
)
RETURNS TABLE(winner_delta INT, loser_delta INT) AS $$
DECLARE
  expected_winner FLOAT;
  expected_loser  FLOAT;
  k_winner        INT;
  k_loser         INT;
  margin_ratio    FLOAT;
  margin_mult     FLOAT;
  type_weight     FLOAT;
  raw_delta_w     FLOAT;
  raw_delta_l     FLOAT;
BEGIN
  -- Score atteso (formula ELO standard)
  expected_winner := 1.0 / (1.0 + power(10.0, (p_loser_elo - p_winner_elo) / 400.0));
  expected_loser  := 1.0 - expected_winner;

  -- K-factor per ciascun giocatore
  k_winner := get_k_factor(p_winner_elo, p_winner_matches);
  k_loser  := get_k_factor(p_loser_elo, p_loser_matches);

  -- Margin multiplier (1.0 - 1.15)
  IF (p_winner_score + p_loser_score) > 0 THEN
    margin_ratio := p_winner_score::FLOAT / (p_winner_score + p_loser_score);
    margin_mult  := 1.0 + 0.15 * (margin_ratio - 0.5) * 2.0;  -- normalizzato in 0-1
    margin_mult  := GREATEST(1.0, LEAST(1.15, margin_mult));
  ELSE
    margin_mult := 1.0;  -- pareggio, no margine
  END IF;

  -- Type weight
  type_weight := CASE p_battle_type
    WHEN '1v1'        THEN 1.0
    WHEN '3v3'        THEN 1.5
    WHEN 'tournament' THEN 1.2
    ELSE 1.0
  END;

  -- Calcolo finale
  raw_delta_w := k_winner * (1.0 - expected_winner) * margin_mult * type_weight;
  raw_delta_l := k_loser  * (0.0 - expected_loser)  * margin_mult * type_weight;

  RETURN QUERY SELECT
    ROUND(raw_delta_w)::INT AS winner_delta,
    ROUND(raw_delta_l)::INT AS loser_delta;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Trigger su battles

```sql
-- ────────────────────────────────────────────────────
-- AUTO-UPDATE ELO quando viene salvata una battaglia ufficiale
-- ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_elo_on_battle()
RETURNS TRIGGER AS $$
DECLARE
  v_winner_id  UUID;
  v_loser_id   UUID;
  v_winner_elo INT;
  v_loser_elo  INT;
  v_winner_matches INT;
  v_loser_matches  INT;
  v_winner_score INT;
  v_loser_score  INT;
  v_delta_w INT;
  v_delta_l INT;
BEGIN
  -- Solo per battaglie ufficiali tra due utenti registrati
  IF NEW.is_official IS NOT TRUE THEN RETURN NEW; END IF;
  IF NEW.player1_user_id IS NULL OR NEW.player2_user_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.winner_side IS NULL OR NEW.winner_side = 'draw' THEN RETURN NEW; END IF;

  -- Determina vincitore e perdente
  IF NEW.winner_side = 'p1' THEN
    v_winner_id := NEW.player1_user_id;
    v_loser_id  := NEW.player2_user_id;
    v_winner_score := COALESCE(NEW.points_p1, 0);
    v_loser_score  := COALESCE(NEW.points_p2, 0);
  ELSE
    v_winner_id := NEW.player2_user_id;
    v_loser_id  := NEW.player1_user_id;
    v_winner_score := COALESCE(NEW.points_p2, 0);
    v_loser_score  := COALESCE(NEW.points_p1, 0);
  END IF;

  -- Fetch ELO correnti e match count
  SELECT elo, elo_matches INTO v_winner_elo, v_winner_matches
    FROM profiles WHERE id = v_winner_id;
  SELECT elo, elo_matches INTO v_loser_elo, v_loser_matches
    FROM profiles WHERE id = v_loser_id;

  -- Calcola delta
  SELECT * INTO v_delta_w, v_delta_l
    FROM calculate_elo_change(
      v_winner_elo, v_loser_elo,
      v_winner_matches, v_loser_matches,
      v_winner_score, v_loser_score,
      NEW.format
    );

  -- Update ELO + tracking peak + match count
  UPDATE profiles SET
    elo = elo + v_delta_w,
    elo_peak = GREATEST(elo_peak, elo + v_delta_w),
    elo_matches = elo_matches + 1,
    placement_done = (elo_matches + 1 >= 5)
  WHERE id = v_winner_id;

  UPDATE profiles SET
    elo = GREATEST(0, elo + v_delta_l),  -- ELO non scende sotto 0
    elo_matches = elo_matches + 1,
    placement_done = (elo_matches + 1 >= 5)
  WHERE id = v_loser_id;

  -- Storico per il vincitore
  INSERT INTO user_elo_history (user_id, elo_before, elo_after, delta, reason, battle_id, opponent_id, opponent_elo)
    VALUES (v_winner_id, v_winner_elo, v_winner_elo + v_delta_w, v_delta_w,
            CASE NEW.format WHEN 'tournament' THEN 'tournament' ELSE NEW.format END,
            NEW.id, v_loser_id, v_loser_elo);

  -- Storico per il perdente
  INSERT INTO user_elo_history (user_id, elo_before, elo_after, delta, reason, battle_id, opponent_id, opponent_elo)
    VALUES (v_loser_id, v_loser_elo, GREATEST(0, v_loser_elo + v_delta_l), v_delta_l,
            CASE NEW.format WHEN 'tournament' THEN 'tournament' ELSE NEW.format END,
            NEW.id, v_winner_id, v_winner_elo);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_elo_on_battle ON battles;
CREATE TRIGGER trg_elo_on_battle
  AFTER INSERT ON battles
  FOR EACH ROW EXECUTE FUNCTION update_elo_on_battle();
```

### Trigger sui tornei (bonus piazzamento)

```sql
-- ────────────────────────────────────────────────────
-- BONUS ELO quando un torneo ufficiale termina
-- ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION award_tournament_bonus()
RETURNS TRIGGER AS $$
DECLARE
  v_winner_id UUID;
  v_runner_up_id UUID;
  v_third_id UUID;
  v_fourth_id UUID;
BEGIN
  -- Solo quando un torneo passa da non-completato a completato
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN RETURN NEW; END IF;
  IF NEW.is_official IS NOT TRUE THEN RETURN NEW; END IF;

  v_winner_id := NEW.winner_user_id;

  -- Estrai 2°, 3°, 4° dalla structure JSONB
  -- (l'implementazione esatta dipende da come BracketView salva i piazzamenti)
  -- Esempio per single elimination:
  v_runner_up_id := (NEW.structure->'final'->>'loser_user_id')::UUID;
  -- v_third_id, v_fourth_id estratti analogamente

  -- Bonus al vincitore: +50 ELO
  IF v_winner_id IS NOT NULL THEN
    UPDATE profiles SET
      elo = elo + 50,
      elo_peak = GREATEST(elo_peak, elo + 50)
    WHERE id = v_winner_id;

    INSERT INTO user_elo_history (user_id, elo_before, elo_after, delta, reason, tournament_id)
      SELECT id, elo - 50, elo, 50, 'placement', NEW.id
      FROM profiles WHERE id = v_winner_id;
  END IF;

  -- Bonus al runner-up: +30 ELO
  IF v_runner_up_id IS NOT NULL THEN
    UPDATE profiles SET
      elo = elo + 30,
      elo_peak = GREATEST(elo_peak, elo + 30)
    WHERE id = v_runner_up_id;

    INSERT INTO user_elo_history (user_id, elo_before, elo_after, delta, reason, tournament_id)
      SELECT id, elo - 30, elo, 30, 'placement', NEW.id
      FROM profiles WHERE id = v_runner_up_id;
  END IF;

  -- Analoghi per 3° (+15) e 4° (+15) se applicabile

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_tournament_bonus ON tournaments;
CREATE TRIGGER trg_tournament_bonus
  AFTER UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION award_tournament_bonus();
```

---

## 3. Sistema di Rank (Iron → Grandmaster)

### Tabella delle soglie ELO

| Rank | Soglia ELO | Colore | Icon (Lucide) |
|---|---|---|---|
| **Iron** | 0 - 999 | `#6B7280` (grigio scuro) | `Shield` |
| **Bronze** | 1000 - 1199 | `#A16207` (bronzo) | `Award` |
| **Silver** | 1200 - 1399 | `#94A3B8` (argento) | `Award` |
| **Gold** | 1400 - 1599 | `#F59E0B` (oro) | `Award` |
| **Platinum** | 1600 - 1799 | `#06B6D4` (ciano) | `Star` |
| **Diamond** | 1800 - 1999 | `#3B82F6` (blu brillante) | `Gem` |
| **Champion** | 2000 - 2199 | `#A855F7` (viola) | `Trophy` |
| **Grandmaster** | 2200+ | `#E94560` (rosso fuoco) | `Crown` |

### Funzione SQL helper

```sql
CREATE OR REPLACE FUNCTION get_rank_from_elo(p_elo INT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN p_elo >= 2200 THEN 'grandmaster'
    WHEN p_elo >= 2000 THEN 'champion'
    WHEN p_elo >= 1800 THEN 'diamond'
    WHEN p_elo >= 1600 THEN 'platinum'
    WHEN p_elo >= 1400 THEN 'gold'
    WHEN p_elo >= 1200 THEN 'silver'
    WHEN p_elo >= 1000 THEN 'bronze'
    ELSE 'iron'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Component React: `RankBadge.jsx`

```jsx
// components/RankBadge.jsx
import { Shield, Award, Star, Gem, Trophy, Crown } from 'lucide-react';

export const RANK_TIERS = [
  { id: 'iron',        name: 'Iron',        minElo: 0,    maxElo: 999,  color: '#6B7280', glow: 'rgba(107,114,128,0.3)', icon: Shield },
  { id: 'bronze',      name: 'Bronze',      minElo: 1000, maxElo: 1199, color: '#A16207', glow: 'rgba(161,98,7,0.3)',    icon: Award },
  { id: 'silver',      name: 'Silver',      minElo: 1200, maxElo: 1399, color: '#94A3B8', glow: 'rgba(148,163,184,0.4)', icon: Award },
  { id: 'gold',        name: 'Gold',        minElo: 1400, maxElo: 1599, color: '#F59E0B', glow: 'rgba(245,158,11,0.4)',  icon: Award },
  { id: 'platinum',    name: 'Platinum',    minElo: 1600, maxElo: 1799, color: '#06B6D4', glow: 'rgba(6,182,212,0.4)',   icon: Star },
  { id: 'diamond',     name: 'Diamond',     minElo: 1800, maxElo: 1999, color: '#3B82F6', glow: 'rgba(59,130,246,0.5)',  icon: Gem },
  { id: 'champion',    name: 'Champion',    minElo: 2000, maxElo: 2199, color: '#A855F7', glow: 'rgba(168,85,247,0.5)',  icon: Trophy },
  { id: 'grandmaster', name: 'Grandmaster', minElo: 2200, maxElo: 9999, color: '#E94560', glow: 'rgba(233,69,96,0.6)',   icon: Crown },
];

export function getRankFromElo(elo) {
  return RANK_TIERS.find(t => elo >= t.minElo && elo <= t.maxElo) ?? RANK_TIERS[0];
}

export function RankBadge({ elo, size = 'md', showName = true, showElo = false }) {
  const rank = getRankFromElo(elo);
  const Icon = rank.icon;

  const sizes = {
    sm: { iconBox: 28, icon: 14, text: 'text-[10px]', elo: 'text-[9px]' },
    md: { iconBox: 40, icon: 20, text: 'text-xs',     elo: 'text-[10px]' },
    lg: { iconBox: 56, icon: 28, text: 'text-sm',     elo: 'text-xs' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-lg flex items-center justify-center flex-shrink-0 border"
        style={{
          width: s.iconBox,
          height: s.iconBox,
          background: `${rank.color}15`,
          borderColor: `${rank.color}40`,
          boxShadow: `0 0 12px -2px ${rank.glow}`,
        }}
      >
        <Icon size={s.icon} style={{ color: rank.color }} strokeWidth={2.2} />
      </div>

      {(showName || showElo) && (
        <div className="flex flex-col leading-tight">
          {showName && (
            <div className={`${s.text} font-extrabold tracking-wider uppercase`}
              style={{ color: rank.color }}>
              {rank.name}
            </div>
          )}
          {showElo && (
            <div className={`${s.elo} text-white/60 font-bold tabular-nums`}>
              {elo} ELO
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 4. Modifiche alla Battle UI

### Toggle "Ufficiale vs Amichevole"

Aggiungi questo toggle al **PlayerPicker** o al **BattleSummary** del flow 1v1, e analogamente per 3v3 e Tornei:

```jsx
// components/battle/OfficialToggle.jsx

import { Shield, Coffee } from 'lucide-react';

export function OfficialToggle({ isOfficial, onChange, canBeOfficial = true, reason = '' }) {
  return (
    <div className="bg-[#12122A] rounded-xl p-3 border border-white/5">
      <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3">
        TIPO BATTAGLIA
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => canBeOfficial && onChange(true)}
          disabled={!canBeOfficial}
          className={`p-3 rounded-lg border transition-all
            ${isOfficial && canBeOfficial
              ? 'bg-[#E94560]/15 border-[#E94560]/50'
              : 'bg-white/5 border-white/10'}
            ${!canBeOfficial ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <Shield size={16}
            className={isOfficial && canBeOfficial ? 'text-[#E94560]' : 'text-white/40'} />
          <div className={`text-xs font-bold mt-1.5
            ${isOfficial && canBeOfficial ? 'text-white' : 'text-white/50'}`}>
            UFFICIALE
          </div>
          <div className="text-[9px] text-white/40 mt-0.5">
            Conta per ELO
          </div>
        </button>

        <button
          onClick={() => onChange(false)}
          className={`p-3 rounded-lg border transition-all
            ${!isOfficial
              ? 'bg-[#4361EE]/15 border-[#4361EE]/50'
              : 'bg-white/5 border-white/10'}`}
        >
          <Coffee size={16}
            className={!isOfficial ? 'text-[#4361EE]' : 'text-white/40'} />
          <div className={`text-xs font-bold mt-1.5
            ${!isOfficial ? 'text-white' : 'text-white/50'}`}>
            AMICHEVOLE
          </div>
          <div className="text-[9px] text-white/40 mt-0.5">
            Solo statistiche
          </div>
        </button>
      </div>

      {!canBeOfficial && reason && (
        <div className="text-[10px] text-[#F5A623]/80 mt-2 leading-relaxed">
          ⚠️ {reason}
        </div>
      )}
    </div>
  );
}
```

### Logica di abilitazione "Ufficiale"

Una battaglia può essere **ufficiale solo se entrambi i player sono utenti registrati**:

```jsx
// In New1v1Page.jsx (e simili)
const canBeOfficial =
  battle.player1.user_id != null &&
  battle.player2.user_id != null;

const reason = !canBeOfficial
  ? 'Le battaglie con ospiti non possono essere ufficiali'
  : '';

<OfficialToggle
  isOfficial={battle.is_official ?? false}
  canBeOfficial={canBeOfficial}
  reason={reason}
  onChange={(val) => setBattle({ ...battle, is_official: val })}
/>
```

E nel salvataggio finale:

```jsx
const { error } = await supabase.from('battles').insert({
  // ... altri campi ...
  is_official: battle.is_official && canBeOfficial,
});
```

### Indicatore visivo nelle battle list

Nelle liste di battaglie recenti, mostra un piccolo badge:

```jsx
{battle.is_official ? (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px]
    font-bold bg-[#E94560]/15 text-[#E94560] border border-[#E94560]/30">
    <Shield size={9} />
    UFFICIALE
  </span>
) : (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px]
    font-bold bg-white/5 text-white/40 border border-white/10">
    AMICHEVOLE
  </span>
)}
```

### Summary card mostra delta ELO

Nel `BattleSummary` (pagina di conferma), se la battaglia è ufficiale, mostra anche il delta ELO previsto (calcolato lato client per anteprima):

```jsx
{battle.is_official && canBeOfficial && (
  <div className="rounded-xl bg-[#12122A] p-4 border border-[#E94560]/20">
    <div className="text-[10px] font-bold text-[#E94560] tracking-[0.15em] mb-2">
      IMPATTO ELO PREVISTO
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <div className="text-[9px] text-white/40 font-bold tracking-wider">TU</div>
        <div className={`text-lg font-black tabular-nums ${
          predictedDelta.you > 0 ? 'text-[#00D68F]' : 'text-[#E94560]'
        }`}>
          {predictedDelta.you > 0 ? '+' : ''}{predictedDelta.you}
        </div>
      </div>
      <div>
        <div className="text-[9px] text-white/40 font-bold tracking-wider">AVVERSARIO</div>
        <div className={`text-lg font-black tabular-nums ${
          predictedDelta.opponent > 0 ? 'text-[#00D68F]' : 'text-[#E94560]'
        }`}>
          {predictedDelta.opponent > 0 ? '+' : ''}{predictedDelta.opponent}
        </div>
      </div>
    </div>
  </div>
)}
```

E la funzione `calculateEloChange` lato client (mirror del SQL):

```javascript
// utils/elo.js

export function calculateEloChange({
  winnerElo,
  loserElo,
  winnerMatches = 5,
  loserMatches = 5,
  winnerScore,
  loserScore,
  battleType = '1v1',
}) {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser  = 1 - expectedWinner;

  const kFactor = (elo, matches) => {
    if (matches < 5) return 40;
    if (elo >= 1700) return 12;
    if (matches >= 30) return 16;
    return 24;
  };

  const totalScore = winnerScore + loserScore;
  let marginMult = 1.0;
  if (totalScore > 0) {
    const ratio = winnerScore / totalScore;
    marginMult = Math.max(1.0, Math.min(1.15, 1.0 + 0.15 * (ratio - 0.5) * 2));
  }

  const typeWeight = { '1v1': 1.0, '3v3': 1.5, 'tournament': 1.2 }[battleType] ?? 1.0;

  const winnerDelta = Math.round(
    kFactor(winnerElo, winnerMatches) * (1 - expectedWinner) * marginMult * typeWeight
  );
  const loserDelta = Math.round(
    kFactor(loserElo, loserMatches) * (0 - expectedLoser) * marginMult * typeWeight
  );

  return { winnerDelta, loserDelta };
}
```

---

## 5. Account Page: ELO & Rank Display

Aggiungi una sezione ELO al profilo nell'Account page, sopra la `StatGrid`:

```jsx
// components/account/EloSection.jsx

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { RankBadge, getRankFromElo, RANK_TIERS } from '../RankBadge';

export function EloSection({ profile }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [profile.id]);

  async function loadHistory() {
    const { data } = await supabase
      .from('user_elo_history')
      .select('elo_after, delta, created_at, reason')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setHistory(data ?? []);
    setLoading(false);
  }

  const rank = getRankFromElo(profile.elo);
  const currentRankIndex = RANK_TIERS.findIndex(t => t.id === rank.id);
  const nextRank = RANK_TIERS[currentRankIndex + 1];

  const isPlacement = !profile.placement_done;
  const placementProgress = Math.min(profile.elo_matches, 5);

  // Progress to next rank
  const rangeStart = rank.minElo;
  const rangeEnd = nextRank ? nextRank.minElo : rank.maxElo;
  const progressPct = nextRank
    ? ((profile.elo - rangeStart) / (rangeEnd - rangeStart)) * 100
    : 100;

  // Last 5 matches trend
  const last5 = history.slice(0, 5);
  const trend = last5.reduce((a, h) => a + h.delta, 0);

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-[3px] h-3.5 bg-[#A855F7]" />
        <div className="text-[11px] font-extrabold text-white tracking-[0.15em]">
          RANKING COMPETITIVO
        </div>
      </div>

      <motion.div
        className="rounded-2xl overflow-hidden border"
        style={{
          background: 'linear-gradient(135deg, #1A1A3A 0%, #0F0F25 100%)',
          borderColor: `${rank.color}40`,
          boxShadow: `0 0 24px -8px ${rank.glow}`,
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-5">
          {/* Rank header */}
          <div className="flex items-center justify-between mb-4">
            <RankBadge elo={profile.elo} size="lg" showName showElo />

            {!isPlacement && (
              <div className="text-right">
                <div className="text-[10px] text-white/50 font-bold tracking-wider">
                  PEAK
                </div>
                <div className="text-white font-black text-lg tabular-nums">
                  {profile.elo_peak}
                </div>
              </div>
            )}
          </div>

          {/* Placement vs Normal display */}
          {isPlacement ? (
            <div>
              <div className="flex justify-between text-[10px] font-bold tracking-[0.1em] mb-1.5">
                <span className="text-[#F5A623]">PLACEMENT</span>
                <span className="text-white tabular-nums">{placementProgress} / 5</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#F5A623] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(placementProgress / 5) * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <div className="text-[10px] text-white/50 mt-2 leading-relaxed">
                Completa {5 - placementProgress} partite ufficiali per uscire dal placement
              </div>
            </div>
          ) : nextRank ? (
            <div>
              <div className="flex justify-between text-[10px] font-bold tracking-[0.1em] mb-1.5">
                <span className="text-white/50">VERSO {nextRank.name.toUpperCase()}</span>
                <span className="text-white tabular-nums">
                  {profile.elo} / {nextRank.minElo}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: rank.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="text-[10px] font-bold text-[#E94560] tracking-[0.15em]">
                ⭐ MASSIMO RANK RAGGIUNTO
              </div>
            </div>
          )}

          {/* Trend stats */}
          {!isPlacement && last5.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/5">
              <div>
                <div className="text-[10px] text-white/50 font-bold tracking-wider mb-1">
                  ULTIME 5 PARTITE
                </div>
                <div className="flex items-center gap-1.5">
                  {trend > 0 ? <TrendingUp size={14} className="text-[#00D68F]" /> :
                   trend < 0 ? <TrendingDown size={14} className="text-[#E94560]" /> :
                   <Minus size={14} className="text-white/40" />}
                  <span className={`font-black text-lg tabular-nums ${
                    trend > 0 ? 'text-[#00D68F]' : trend < 0 ? 'text-[#E94560]' : 'text-white/60'
                  }`}>
                    {trend > 0 ? '+' : ''}{trend}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-white/50 font-bold tracking-wider mb-1">
                  PARTITE UFFICIALI
                </div>
                <div className="text-white font-black text-lg tabular-nums">
                  {profile.elo_matches}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
```

---

## 6. Leaderboard ELO Globale

### Nuova pagina: `pages/LeaderboardPage.jsx`

```jsx
// pages/LeaderboardPage.jsx

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { PageContainer } from '../components/PageContainer';
import { RankBadge, getRankFromElo, RANK_TIERS } from '../components/RankBadge';
import { Avatar } from '../components/Avatar';

export function LeaderboardPage() {
  const navigate = useNavigate();
  const userId = useAuthStore(s => s.user?.id);
  const [filter, setFilter] = useState('all');  // 'all' | rank id
  const [users, setUsers] = useState([]);
  const [myPosition, setMyPosition] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  async function loadLeaderboard() {
    let query = supabase
      .from('profiles')
      .select('id, username, avatar_id, title, elo, elo_peak, elo_matches')
      .gte('elo_matches', 5)  // solo chi ha completato il placement
      .order('elo', { ascending: false })
      .limit(100);

    if (filter !== 'all') {
      const tier = RANK_TIERS.find(t => t.id === filter);
      if (tier) {
        query = query.gte('elo', tier.minElo).lte('elo', tier.maxElo);
      }
    }

    const { data } = await query;
    setUsers(data ?? []);

    // Trova la posizione del current user
    if (userId) {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('elo_matches', 5)
        .gt('elo', (data ?? []).find(u => u.id === userId)?.elo ?? 0);
      setMyPosition(count != null ? count + 1 : null);
    }
  }

  return (
    <PageContainer>
      <div className="px-4 mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 text-white/70">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[#E94560]">
            ▲ LEADERBOARD
          </div>
          <h1 className="text-white text-2xl font-black uppercase tracking-tight">
            Top Bladers
          </h1>
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-4 mb-5 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          <FilterChip
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="TUTTI"
          />
          {RANK_TIERS.slice().reverse().map(tier => (
            <FilterChip
              key={tier.id}
              active={filter === tier.id}
              onClick={() => setFilter(tier.id)}
              label={tier.name.toUpperCase()}
              color={tier.color}
            />
          ))}
        </div>
      </div>

      {/* My position banner */}
      {myPosition && filter === 'all' && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-[#12122A] border border-[#4361EE]/30
          flex items-center gap-3">
          <div className="text-[#4361EE] font-black text-lg tabular-nums">
            #{myPosition}
          </div>
          <div className="text-white/70 text-xs">
            La tua posizione nella classifica
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      {filter === 'all' && users.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 mx-4 mb-5">
          <PodiumCard user={users[1]} position={2} accentColor="#94A3B8" />
          <PodiumCard user={users[0]} position={1} accentColor="#F5A623" featured />
          <PodiumCard user={users[2]} position={3} accentColor="#A16207" />
        </div>
      )}

      {/* List */}
      <div className="px-4 space-y-2">
        {users.map((user, i) => {
          const isMe = user.id === userId;
          const rank = getRankFromElo(user.elo);

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`p-3 rounded-xl flex items-center gap-3 border
                ${isMe
                  ? 'bg-[#4361EE]/10 border-[#4361EE]/40'
                  : 'bg-[#12122A] border-white/5'}`}
            >
              {/* Position number */}
              <div className="w-7 text-center">
                <div className={`font-black tabular-nums ${
                  i === 0 ? 'text-[#F5A623] text-lg' :
                  i === 1 ? 'text-[#94A3B8] text-base' :
                  i === 2 ? 'text-[#A16207] text-base' :
                  'text-white/40 text-sm'
                }`}>
                  {i + 1}
                </div>
              </div>

              {/* Avatar */}
              <Avatar avatarId={user.avatar_id} size={40} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold truncate">{user.username}</div>
                <div className="text-[10px] text-white/50 truncate">{user.title}</div>
              </div>

              {/* Rank + ELO */}
              <div className="text-right">
                <div className="text-white font-black tabular-nums leading-tight">
                  {user.elo}
                </div>
                <div className={`text-[9px] font-extrabold tracking-wider uppercase`}
                  style={{ color: rank.color }}>
                  {rank.name}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </PageContainer>
  );
}

function FilterChip({ active, onClick, label, color = '#4361EE' }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider whitespace-nowrap border transition-colors
        ${active ? '' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
      style={active ? {
        background: `${color}15`,
        borderColor: `${color}50`,
        color: color,
      } : undefined}
    >
      {label}
    </button>
  );
}

function PodiumCard({ user, position, accentColor, featured = false }) {
  if (!user) return null;
  const rank = getRankFromElo(user.elo);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-3 text-center border ${featured ? 'pt-5 pb-4' : 'pt-3 pb-3'}`}
      style={{
        background: `${accentColor}10`,
        borderColor: `${accentColor}40`,
        boxShadow: featured ? `0 0 20px -4px ${accentColor}50` : 'none',
      }}
    >
      <div className={`font-black tabular-nums mb-2 ${
        featured ? 'text-3xl' : 'text-2xl'
      }`} style={{ color: accentColor }}>
        {position === 1 && <Crown size={20} className="inline mb-1" />}
        {' '}
        #{position}
      </div>

      <div className="flex justify-center mb-2">
        <Avatar avatarId={user.avatar_id} size={featured ? 56 : 44} />
      </div>

      <div className="text-white font-bold text-xs truncate">{user.username}</div>
      <div className={`text-[10px] font-extrabold tracking-wider mt-1`}
        style={{ color: rank.color }}>
        {user.elo} ELO
      </div>
    </motion.div>
  );
}
```

### Aggiungi route + entry point

```jsx
// In App.jsx (router config)
<Route path="/leaderboard" element={<LeaderboardPage />} />
```

```jsx
// In HomePage.jsx — cambia il "VEDI TUTTI" della sezione Top Bladers
<SectionHeader
  title="Top Bladers"
  accentColor="#F5A623"
  onSeeAll={() => navigate('/leaderboard')}
/>
```

---

## 7. Achievement nuovi per il sistema ELO

```sql
INSERT INTO achievements (id, name, description, icon, color, category, threshold, sort_order) VALUES
  ('elo_first_win',   'Primo Sangue Ufficiale', 'Vinci la prima partita ufficiale',          'Swords',     '#E94560', 'battle', 1,    180),
  ('elo_silver',      'Promosso',                'Raggiungi rank Silver',                     'Award',      '#94A3B8', 'battle', 1200, 181),
  ('elo_gold',        'Mira d''Oro',             'Raggiungi rank Gold',                       'Award',      '#F5A623', 'battle', 1400, 182),
  ('elo_platinum',    'Elite',                   'Raggiungi rank Platinum',                   'Star',       '#06B6D4', 'battle', 1600, 183),
  ('elo_diamond',     'Diamante',                'Raggiungi rank Diamond',                    'Gem',        '#3B82F6', 'battle', 1800, 184),
  ('elo_champion',    'Campione',                'Raggiungi rank Champion',                   'Trophy',     '#A855F7', 'battle', 2000, 185),
  ('elo_grandmaster', 'Gran Maestro',            'Raggiungi rank Grandmaster',                'Crown',      '#E94560', 'battle', 2200, 186),
  ('elo_streak_5',    'Imbattibile',             'Vinci 5 partite ufficiali consecutive',     'Flame',      '#F5A623', 'battle', 5,    187);

-- Trigger per check ELO achievements (chiamato dal trigger ELO esistente)
CREATE OR REPLACE FUNCTION check_elo_achievements(p_user_id UUID, p_new_elo INT)
RETURNS VOID AS $$
BEGIN
  IF p_new_elo >= 1200 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_silver') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 1400 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_gold') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 1600 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_platinum') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 1800 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_diamond') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 2000 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_champion') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 2200 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_grandmaster') ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Nel trigger principale `update_elo_on_battle` aggiungi una chiamata: `PERFORM check_elo_achievements(v_winner_id, v_winner_elo + v_delta_w);`

---

## 8. Lezione X Academy bonus

Aggiungi una **nuova lezione** all'Academy che spiega il sistema ELO. Inseriscila come `lesson 25` nel livello Pro:

```sql
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content) VALUES
('elo-system', 'pro', 'Il Sistema ELO di BeyManager X', 'Come funziona il ranking competitivo', 6, 50, 7,
'[
  {"type":"paragraph","text":"BeyManager X usa un sistema di ranking **ELO** ispirato agli scacchi per misurare le tue performance competitive. Capire come funziona ti aiuta a fare scelte strategiche."},
  {"type":"heading","level":2,"text":"Le basi"},
  {"type":"list","items":[
    "**ELO iniziale**: 1000 (rank Bronze)",
    "**Placement**: i primi 5 match ufficiali stabilizzano il tuo ELO",
    "**Vittoria**: ELO sale, di più se l''avversario aveva ELO più alto",
    "**Sconfitta**: ELO scende, di meno se l''avversario aveva ELO più alto"
  ]},
  {"type":"heading","level":2,"text":"Ufficiale vs Amichevole"},
  {"type":"paragraph","text":"Quando crei una battaglia, scegli se è **ufficiale** (conta per ELO) o **amichevole** (solo statistiche). Le partite con ospiti non registrati sono sempre amichevoli."},
  {"type":"heading","level":2,"text":"Cosa influenza il guadagno ELO"},
  {"type":"list","items":[
    "**Differenza ELO con l''avversario**: battere uno più forte vale di più",
    "**Margine di punteggio**: 4-0 vale fino al 15% in più di 4-3",
    "**Tipo di battaglia**: 3v3 vale 1.5x rispetto a 1v1",
    "**Tornei**: ogni partita conta 1.2x, più bonus per piazzamento finale"
  ]},
  {"type":"heading","level":2,"text":"I rank"},
  {"type":"list","items":[
    "**Iron**: < 1000 ELO",
    "**Bronze**: 1000-1199 (default iniziale)",
    "**Silver**: 1200-1399",
    "**Gold**: 1400-1599",
    "**Platinum**: 1600-1799",
    "**Diamond**: 1800-1999",
    "**Champion**: 2000-2199",
    "**Grandmaster**: 2200+"
  ]},
  {"type":"tip","variant":"info","text":"L''ELO peak (massimo storico raggiunto) è permanente. Anche se scendi di rank, manterrai sempre la traccia del tuo punto più alto."}
]'
);
```

---

## 9. Implementation Checklist

1. ✅ **Run database migrations** — tabelle `user_elo_history`, estensioni a `profiles`/`battles`/`tournaments`
2. ✅ **Create SQL functions** — `get_k_factor`, `get_rank_from_elo`, `calculate_elo_change`, `check_elo_achievements`
3. ✅ **Create triggers** — `update_elo_on_battle`, `award_tournament_bonus`
4. ✅ **Seed achievements** — 8 nuovi achievement ELO
5. ✅ **Create components**:
   - `RankBadge.jsx` (con `RANK_TIERS` export)
   - `OfficialToggle.jsx` (per battle UI)
   - `EloSection.jsx` (per AccountPage)
6. ✅ **Update battle flows** — aggiungi `OfficialToggle` in 1v1, 3v3, tournament setup
7. ✅ **Update battle save** — passa `is_official` flag
8. ✅ **Update battle list/cards** — mostra badge "UFFICIALE" / "AMICHEVOLE"
9. ✅ **Add ELO preview** in BattleSummary con `calculateEloChange` client-side
10. ✅ **Add EloSection** in AccountPage sopra la StatGrid
11. ✅ **Create LeaderboardPage** + route `/leaderboard`
12. ✅ **Update HomePage** — link "VEDI TUTTI" punta a `/leaderboard`
13. ✅ **Add new Academy lesson** — `elo-system` nel Pro level

---

## 10. Note di Design

**Perché il margine pesa "solo" 1.0-1.15x?**
Un range più ampio renderebbe il sistema instabile: una stomp 4-0 darebbe troppi punti, smorzando l'effetto delle vittorie strette in matchup duri. Il 15% è un bonus tangibile ma controllato.

**Perché il K-factor scende a 12 a Diamond+?**
Per evitare oscillazioni eccessive ad alto livello. Un Grandmaster non dovrebbe perdere 30 ELO contro un Bronze fortunato — il K basso protegge la stabilità del ranking d'élite.

**Perché 5 placement match e non 10?**
La community è piccola e 10 match prima di vedere il rank disincentiva. 5 sono sufficienti con K=40 per avere un ELO ragionevole, e poi si stabilizza naturalmente.

**Perché ELO non scende sotto 0?**
Floor protettivo: un nuovo player con bad streak non dovrebbe arrivare a -200 ELO. È matematicamente difficile ma il floor a 0 garantisce sicurezza.

---

*End of Briefing — BeyManager X ELO Ranking System — April 2026*
