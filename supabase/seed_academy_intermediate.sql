-- ════════════════════════════════════════════════════════════════
-- INTERMEDIATE LEVEL — 6 lessons on parts strategy and combo building
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────
-- Lesson 7: The Four Archetypes
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('archetypes-explained', 'intermediate', 'I Quattro Archetipi', 'Attack, Defense, Stamina e Balance', 7, 35, 1,
'[
  {"type":"paragraph","text":"Ogni Beyblade X appartiene a uno di **quattro archetipi**, che ne definiscono lo stile di gioco e la strategia. Capire come funziona ciascuno è il primo passo per scegliere bene le tue parti e costruire combo vincenti."},
  {"type":"heading","level":2,"text":"Il triangolo delle debolezze"},
  {"type":"paragraph","text":"Tre dei quattro archetipi formano un classico triangolo tipo *carta-forbici-sasso*. Conoscerlo è fondamentale per capire i matchup:"},
  {"type":"diagram","src":"/academy/archetypes_triangle.png","caption":"Attack batte Stamina, Stamina batte Defense, Defense batte Attack"},
  {"type":"list","items":[
    "**Attack** vince contro **Stamina** (impatto distrugge la rotazione)",
    "**Stamina** vince contro **Defense** (sopravvive più a lungo)",
    "**Defense** vince contro **Attack** (assorbe i colpi e contrattacca)",
    "**Balance** è situazionale — adattabile ma senza specializzazione"
  ]},
  {"type":"tip","variant":"info","text":"Questo triangolo non è una regola assoluta — la skill del giocatore e la qualità della specifica combo possono ribaltare ogni matchup. È una linea guida, non una legge."},
  {"type":"heading","level":2,"text":"⚔️ Attack — L''aggressore"},
  {"type":"paragraph","text":"Le Beyblade **Attack** vincono colpendo duro e velocemente. Sfruttano la **Xtreme Line** per accelerare e mandare l''avversario in KO o burst."},
  {"type":"list","items":[
    "**Punti di forza**: alta resistenza al burst, mobilità eccellente, KO rapidi",
    "**Punti deboli**: stamina bassa, può auto-KO se sbaglia il bersaglio, breve durata",
    "**Altezza tipica**: bassa (Ratchet 60mm) per andare sotto i Defense alti",
    "**Bit tipici**: Flat, Low Flat, Rush, Gear Flat, Gear Rush"
  ]},
  {"type":"tip","variant":"success","text":"Strategia: vinci nei primi 10-15 secondi o non vinci. Più la battaglia si prolunga, peggio per te."},
  {"type":"heading","level":2,"text":"🛡️ Defense — Il muro"},
  {"type":"paragraph","text":"Le Beyblade **Defense** vincono assorbendo i colpi e restando in piedi. Hanno peso concentrato al centro (CWD - *Central Weight Distribution*) e tip stabili."},
  {"type":"list","items":[
    "**Punti di forza**: difficili da knockare, contrattacco automatico contro Attack",
    "**Punti deboli**: bassa burst resistance, stamina mediocre, perdono contro Stamina",
    "**Altezza tipica**: media-alta (70-80mm)",
    "**Bit tipici**: Needle, High Needle, Spike, Gear Needle, Wedge"
  ]},
  {"type":"tip","variant":"warning","text":"Defense è considerato l''archetipo più debole nel meta competitivo Beyblade X attuale. È specializzato solo contro Attack — perde contro tutto il resto."},
  {"type":"heading","level":2,"text":"♾️ Stamina — Il maratoneta"},
  {"type":"paragraph","text":"Le Beyblade **Stamina** vincono restando in piedi più a lungo dell''avversario. Hanno peso distribuito verso l''esterno (OWD - *Outward Weight Distribution*) per mantenere lo spin."},
  {"type":"list","items":[
    "**Punti di forza**: enorme stamina, spin steal contro left-spin, dominante nel meta",
    "**Punti deboli**: mobilità bassa, vulnerabili a impatti aggressivi, perdono contro Attack",
    "**Altezza tipica**: variabile (60-80mm) a seconda del Bit",
    "**Bit tipici**: Ball, Disk Ball, Free Ball, Orb, Hexa"
  ]},
  {"type":"tip","variant":"success","text":"Stamina è considerato uno degli archetipi più forti del meta corrente. Combinato con Hexa Bit è uno dei più temuti in tornei."},
  {"type":"heading","level":2,"text":"⚖️ Balance — Il jolly"},
  {"type":"paragraph","text":"Le Beyblade **Balance** combinano caratteristiche dei tre archetipi. Possono difendere come Defense, durare come Stamina e attaccare come Attack — ma senza eccellere in nessun ambito."},
  {"type":"list","items":[
    "**Punti di forza**: adattabili, comportamento variabile contro avversari diversi",
    "**Punti deboli**: nessuna specializzazione, perdono contro chi ha un piano specifico",
    "**Altezza tipica**: variabile",
    "**Bit tipici**: Taper, High Taper, Point, Accel, Cyclone"
  ]},
  {"type":"inline_quiz","question":"Hai un Beyblade Attack e affronti un avversario Defense. Quale strategia adottare?","options":["Aggressione totale, lo distruggerai","Difensiva, sopravvivi più a lungo","Strategia mista — Attack è in svantaggio","Lascia il match — sei spacciato"],"correctIndex":2,"explanation":"Defense batte Attack nel triangolo classico. Devi giocare strategicamente, magari puntando a uno spin finish veloce piuttosto che un KO."}
]',
'{"questions":[
  {"question":"Quale archetipo batte Stamina?","options":["Defense","Attack","Balance","Nessuno"],"correctIndex":1,"explanation":"Attack batte Stamina perché l''aggressività interrompe la rotazione e provoca KO rapidi."},
  {"question":"Quale archetipo è considerato il più debole nel meta competitivo Beyblade X?","options":["Attack","Defense","Stamina","Balance"],"correctIndex":1,"explanation":"Defense è considerato il più debole perché efficace solo contro Attack — perde contro Stamina e Balance."},
  {"question":"Cosa significa OWD?","options":["Over Weight Defense","Outward Weight Distribution","Optimal Win Direction","Outer Wedge Design"],"correctIndex":1,"explanation":"OWD = Outward Weight Distribution. Il peso è distribuito verso l''esterno, tipico delle Stamina per mantenere lo spin."},
  {"question":"Qual è il Bit tipico di un Attack?","options":["Ball","Needle","Flat","Hexa"],"correctIndex":2,"explanation":"Flat (e varianti come Low Flat, Rush, Gear Flat) sono i Bit tipici di Attack per il loro movimento aggressivo."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 8: Choosing a Blade
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('choosing-blades', 'intermediate', 'Come Scegliere un Blade', 'Il pezzo che definisce la tua identità', 6, 35, 2,
'[
  {"type":"paragraph","text":"Il **Blade** è il componente che determina di più l''identità del tuo Beyblade. Definisce il tipo (Attack, Defense, Stamina, Balance), il peso e la forma di contatto. Scegliere bene il Blade è il punto di partenza di ogni combo competitiva."},
  {"type":"heading","level":2,"text":"Anatomia di un Blade"},
  {"type":"paragraph","text":"Un Blade BX è composto da tre elementi visibili:"},
  {"type":"list","items":[
    "**Gear Chip**: il disco centrale con il design del personaggio",
    "**Corpo metallico**: l''anello esterno che entra in contatto con l''avversario",
    "**Sistema di aggancio**: i ganci interni che si collegano al Ratchet"
  ]},
  {"type":"heading","level":2,"text":"Caratteristiche da valutare"},
  {"type":"heading","level":3,"text":"Tipo (Type)"},
  {"type":"paragraph","text":"Il Blade dichiara il suo archetipo principale, ma alcuni Blade possono adattarsi a ruoli diversi se combinati con le parti giuste. Ad esempio, **Hells Scythe** è classificato come Balance ma viene spesso usato come Attack."},
  {"type":"heading","level":3,"text":"Peso"},
  {"type":"paragraph","text":"Il peso di un Blade varia tipicamente tra **30g e 38g**. Più pesante è il Blade, più momento d''inerzia ha — utile per Defense e Stamina. I Blade più leggeri sono più agili — meglio per Attack."},
  {"type":"tip","variant":"info","text":"Attenzione: il peso da solo non è tutto. Conta dove il peso è distribuito. Un Blade di 33g con peso esterno (OWD) batte spesso un Blade di 36g con peso centrale (CWD) in matchup di stamina."},
  {"type":"heading","level":3,"text":"Direzione di rotazione (Spin)"},
  {"type":"paragraph","text":"La maggior parte dei Blade gira **a destra** (right-spin). Esistono però Blade **left-spin** che ruotano in senso antiorario."},
  {"type":"list","items":[
    "**Right vs Right**: scontri normali, perdita di spin graduale",
    "**Right vs Left**: scontri molto più violenti, possibili KO immediati",
    "**Spin Steal**: parti speciali (es. Bit Elevate) permettono ai right-spin di ''rubare'' rotazione ai left-spin"
  ]},
  {"type":"heading","level":3,"text":"Linea di prodotto"},
  {"type":"list","items":[
    "**BX (Basic)**: Blade standard, struttura solida e affidabile",
    "**UX (Unique)**: Blade con gimmick speciali (es. Hells Chain con catena rotante, Bullet Griffon con Ratchet integrato)",
    "**CX (Custom)**: Blade in due pezzi (Lock Chip + Main Blade) per la massima personalizzazione"
  ]},
  {"type":"heading","level":2,"text":"Top Blade per ogni archetipo (meta corrente)"},
  {"type":"two_column","left":[
    {"type":"heading","level":3,"text":"⚔️ Attack"},
    {"type":"list","items":[
      "**Dran Sword**: aggressore classico, contatti pesanti",
      "**Bear Scratch**: alta velocità",
      "**Cobalt Dragoon**: forte contro Stamina"
    ]}
  ],"right":[
    {"type":"heading","level":3,"text":"🛡️ Defense"},
    {"type":"list","items":[
      "**Knight Shield**: difesa rocciosa",
      "**Knight Lance**: contrattacco efficace",
      "**Black Shell**: stabilità altissima"
    ]}
  ]},
  {"type":"two_column","left":[
    {"type":"heading","level":3,"text":"♾️ Stamina"},
    {"type":"list","items":[
      "**Wizard Rod**: re della stamina UX",
      "**Phoenix Wing**: classic stamina",
      "**Aero Pegasus**: stamina + mobilità"
    ]}
  ],"right":[
    {"type":"heading","level":3,"text":"⚖️ Balance"},
    {"type":"list","items":[
      "**Hells Scythe**: il classico balance",
      "**Wizard Arrow**: balance tendente stamina",
      "**Phoenix Feather**: versatile"
    ]}
  ]},
  {"type":"tip","variant":"warning","text":"Il meta cambia continuamente. Le Tier List sono aggiornate dalle community competitive (worldbeyblade.org, beybxdb.com). Quello che è top tier oggi potrebbe non esserlo tra sei mesi."}
]',
'{"questions":[
  {"question":"Cos''è il Gear Chip?","options":["Il sistema di aggancio del Blade","Il disco centrale con il design del personaggio","Il bordo esterno metallico","Un tipo di Bit"],"correctIndex":1,"explanation":"Il Gear Chip è il disco centrale visibile del Blade, dove c''è il design della mascotte/personaggio."},
  {"question":"Qual è il peso tipico di un Blade?","options":["10-15g","20-25g","30-38g","45-50g"],"correctIndex":2,"explanation":"I Blade pesano tipicamente tra 30g e 38g. Quelli più pesanti tendono a essere usati per Defense e Stamina."},
  {"question":"Cosa significa CWD?","options":["Center Wedge Design","Central Weight Distribution","Curved Width Diameter","Combat Win Direction"],"correctIndex":1,"explanation":"CWD = Central Weight Distribution, peso concentrato al centro. Tipico delle Defense per maggiore stabilità."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 9: Understanding Ratchets
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('understanding-ratchets', 'intermediate', 'Capire i Ratchet', 'Lati e altezza definiscono lo stile', 6, 35, 3,
'[
  {"type":"paragraph","text":"Il **Ratchet** è il componente più sottovalutato dai principianti, ma per i giocatori esperti è cruciale tanto quanto il Blade. Influenza burst resistance, baricentro, stabilità e altezza di impatto."},
  {"type":"heading","level":2,"text":"Decodificare il nome"},
  {"type":"paragraph","text":"I Ratchet hanno una nomenclatura precisa. Prendiamo come esempio **`4-60`**:"},
  {"type":"diagram","src":"/academy/ratchet_naming.png","caption":"4 = numero di lati | 60 = altezza in millimetri"},
  {"type":"heading","level":3,"text":"Primo numero (lati)"},
  {"type":"paragraph","text":"Indica il numero di **sporgenze** (lati) del Ratchet. Più sono, maggiore è la resistenza al burst perché più ''denti'' devono saltare per smontare il Beyblade."},
  {"type":"list","items":[
    "**0-1 lati**: bassissima burst resistance — usati raramente",
    "**3-5 lati**: bilanciato — la maggior parte dei meta combo usa questi",
    "**7-9 lati**: alta burst resistance — perfetti contro Attack aggressivi"
  ]},
  {"type":"heading","level":3,"text":"Secondo numero (altezza in mm)"},
  {"type":"paragraph","text":"L''altezza determina la posizione del Blade rispetto allo stadio:"},
  {"type":"two_column","left":[
    {"type":"heading","level":3,"text":"60mm (basso)"},
    {"type":"list","items":[
      "Baricentro basso",
      "Massima stabilità",
      "Va sotto le Defense alte",
      "Ideale per Attack aggressivi"
    ]}
  ],"right":[
    {"type":"heading","level":3,"text":"80mm (alto)"},
    {"type":"list","items":[
      "Baricentro alto",
      "Più momento di inerzia laterale",
      "Colpisce Stamina al loro livello",
      "Ideale per Defense difficili da raggiungere"
    ]}
  ]},
  {"type":"tip","variant":"info","text":"70mm è il valore intermedio — il preferito di chi vuole un combo bilanciato che non sia né troppo basso né troppo alto."},
  {"type":"heading","level":2,"text":"Ratchet meta-defining"},
  {"type":"list","items":[
    "**3-60**: classico per Attack low, baricentro basso e burst res mediocre",
    "**4-60**: il più usato in assoluto — ottimo equilibrio per qualsiasi archetipo",
    "**5-60**: bilanciato, leggermente più burst-resistant di 4-60",
    "**9-60**: tank assoluto, stabilità rocciosa per Defense",
    "**3-80**: alto e aggressivo, per Attack che vogliono colpire da sopra",
    "**5-80**: standard meta per Stamina UX line",
    "**4-70**: medium-all-around, popolare per Balance"
  ]},
  {"type":"heading","level":2,"text":"Ratchet CX e Simple Type"},
  {"type":"paragraph","text":"La linea CX introduce i **Simple Type Ratchet**, costruiti con materiali più leggeri (5-6g invece dei 6-8g standard). Hanno nomenclature diverse:"},
  {"type":"list","items":[
    "**R3-60, R4-55, R4-70**: Simple Ratchet base",
    "**PO3-60**: Partial Override, struttura particolare",
    "**FE4-55**: Free Effect, design innovativo"
  ]},
  {"type":"tip","variant":"warning","text":"I Simple Ratchet sono più leggeri ma anche meno burst-resistant. Sono preferiti in combo dove la velocità è più importante della stabilità."},
  {"type":"heading","level":2,"text":"Ratchet Integrated (UX speciale)"},
  {"type":"paragraph","text":"Alcuni Beyblade UX hanno il Ratchet **integrato nel Blade**. Sono casi particolari come **Hells Chain** o **Bullet Griffon**: il sistema Blade+Ratchet è un pezzo unico, non separabile. Questo limita la personalizzazione ma offre stabilità superiore."},
  {"type":"inline_quiz","question":"Quale Ratchet sceglieresti per un combo Attack che deve infilarsi sotto un Defense alto?","options":["3-80","9-80","3-60","7-70"],"correctIndex":2,"explanation":"3-60 è basso (60mm) il che permette di andare sotto le Defense alte, e ha pochi lati per ridurre il peso e aumentare la velocità di rotazione."}
]',
'{"questions":[
  {"question":"In un Ratchet ''4-60'', cosa indica il numero 60?","options":["Numero di lati","Peso in grammi","Altezza in millimetri","Numero del modello"],"correctIndex":2,"explanation":"Il secondo numero indica l''altezza in mm. 60 = 60mm, il valore più basso comune."},
  {"question":"Più lati ha un Ratchet, maggiore è la sua...","options":["Velocità","Burst Resistance","Stamina","Attacco"],"correctIndex":1,"explanation":"Più lati significano più ''denti'' che devono saltare per smontare il Beyblade, quindi maggiore burst resistance."},
  {"question":"Quanto pesa tipicamente un Ratchet standard?","options":["1-2g","6-8g","15-20g","25-30g"],"correctIndex":1,"explanation":"I Ratchet standard pesano 6-8g. I Simple Type CX sono leggermente più leggeri (5-6g)."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 10: Understanding Bits
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('understanding-bits', 'intermediate', 'Capire i Bit', 'Il punto di contatto fa la differenza', 7, 40, 4,
'[
  {"type":"paragraph","text":"Il **Bit** è il pezzo più piccolo (2-3g) ma forse il più impattante sul gameplay. Determina il **pattern di movimento** del tuo Beyblade — se rimane al centro, se gira aggressivamente, se è stabile o instabile."},
  {"type":"heading","level":2,"text":"Le tre famiglie principali"},
  {"type":"heading","level":3,"text":"⚔️ Bit Attack — Movimento aggressivo"},
  {"type":"paragraph","text":"Bit con superficie piatta o larga che genera attrito asimmetrico. Il Beyblade circola lungo lo stadio cercando l''impatto."},
  {"type":"list","items":[
    "**Flat**: il classico, movimento ampio e veloce",
    "**Low Flat**: come Flat ma più basso — più stabile ma meno aggressivo",
    "**Rush**: movimento erratico, imprevedibile per l''avversario",
    "**Gear Flat**: con denti — può ''dashare'' sulla Xtreme Line per attacchi devastanti",
    "**Kick**: design moderno, ottimo equilibrio tra velocità e controllo"
  ]},
  {"type":"tip","variant":"info","text":"I Bit con ''Gear'' nel nome hanno denti dentati. Se la tua Beyblade entra in contatto con la Xtreme Line, i denti agganciano e accelerano improvvisamente — è da qui che vengono i KO più spettacolari."},
  {"type":"heading","level":3,"text":"🛡️ Bit Defense — Stabilità rocciosa"},
  {"type":"paragraph","text":"Bit appuntiti che entrano nella concavità centrale dello stadio creando un punto di rotazione fisso."},
  {"type":"list","items":[
    "**Needle**: punta sottile, massima stabilità statica",
    "**High Needle**: come Needle ma rialzato",
    "**Spike**: con micro-rilievi per maggior grip",
    "**Gear Needle**: con denti, può dashare ma resta stabile",
    "**Metal Needle**: in metallo, massimo peso e stabilità"
  ]},
  {"type":"heading","level":3,"text":"♾️ Bit Stamina — Permanenza al centro"},
  {"type":"paragraph","text":"Bit sferici che minimizzano l''attrito e permettono al Beyblade di restare al centro dello stadio."},
  {"type":"list","items":[
    "**Ball**: la sfera perfetta, classico stamina",
    "**Disk Ball**: variante con disco di base, più stabile",
    "**Free Ball**: con sfera libera che ruota — riduce ulteriormente l''attrito",
    "**Orb**: superficie sferica più grande",
    "**Hexa**: il bit più dominante del meta corrente, esagonale, eccellente stamina"
  ]},
  {"type":"tip","variant":"success","text":"Hexa Bit è considerato uno dei migliori Bit del meta competitivo Beyblade X attuale. Versatile, stabile, e con stamina eccezionale."},
  {"type":"heading","level":2,"text":"⚖️ Bit Balance — L''equilibrio"},
  {"type":"paragraph","text":"Bit con caratteristiche miste, capaci di adattarsi a strategie diverse."},
  {"type":"list","items":[
    "**Taper**: punta conica, mix di stabilità e mobilità",
    "**Point**: micro-punto, leggermente mobile",
    "**Accel**: il classico starter di Wizard Rod, balance puro",
    "**Cyclone**: movimento circolare ma non aggressivo come Flat",
    "**Wedge**: ottimo per spin steal contro left-spin"
  ]},
  {"type":"heading","level":2,"text":"Larghezza dello shaft"},
  {"type":"paragraph","text":"Lo **shaft** è la parte cilindrica che si inserisce nel Ratchet. La sua larghezza influenza la **burst resistance del Bit**:"},
  {"type":"list","items":[
    "**Shaft sottile**: bassa burst resistance — il Bit può ''slittare'' fuori sotto impatto",
    "**Shaft medio**: bilanciato",
    "**Shaft spesso**: alta burst resistance — Bit più stabili ma più pesanti"
  ]},
  {"type":"heading","level":2,"text":"Usura del Bit"},
  {"type":"paragraph","text":"Diversamente da Blade e Ratchet, **i Bit si usurano con il tempo**. Le sfere si appiattiscono, le punte si arrotondano, le superfici piatte diventano lucide. Un Bit usurato perde performance."},
  {"type":"tip","variant":"warning","text":"Per i tornei competitivi, è normale avere 2-3 copie dello stesso Bit e usare quello in condizioni migliori. Tieni traccia dello stato delle tue parti nella sezione Collezione dell''app!"},
  {"type":"inline_quiz","question":"Vuoi un combo Stamina dominante. Quale Bit sceglieresti?","options":["Flat","Hexa","Needle","Taper"],"correctIndex":1,"explanation":"Hexa è considerato il miglior Bit Stamina del meta corrente, con stamina eccezionale e ottima stabilità."}
]',
'{"questions":[
  {"question":"Cosa fanno i Bit con denti (Gear)?","options":["Aumentano il peso","Possono dashare sulla Xtreme Line","Riducono l''attrito","Cambiano la direzione di rotazione"],"correctIndex":1,"explanation":"I denti dei Bit Gear agganciano la Xtreme Line e provocano accelerazioni improvvise — la base dei KO spettacolari."},
  {"question":"Quale Bit è considerato meta-defining per le Stamina nel meta corrente?","options":["Ball","Hexa","Needle","Flat"],"correctIndex":1,"explanation":"Hexa Bit è uno dei più dominanti del meta Beyblade X, eccellente per build Stamina."},
  {"question":"Cosa succede ai Bit con il tempo?","options":["Diventano più forti","Cambiano colore","Si usurano","Non subiscono cambiamenti"],"correctIndex":2,"explanation":"I Bit si usurano: le sfere si appiattiscono, le punte si arrotondano. Un Bit usurato perde performance."},
  {"question":"Quale Bit è tipicamente usato per Attack aggressivi?","options":["Ball","Needle","Flat","Hexa"],"correctIndex":2,"explanation":"Flat (e le sue varianti come Low Flat, Rush, Gear Flat) creano il movimento circolare aggressivo tipico delle Attack."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 11: Building Your First Combo
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('building-first-combo', 'intermediate', 'Costruire la Tua Prima Combo Vincente', 'Mettere insieme Blade + Ratchet + Bit', 8, 40, 5,
'[
  {"type":"paragraph","text":"Hai imparato come funzionano singolarmente Blade, Ratchet e Bit. Adesso è ora di metterli insieme. Costruire una combo competitiva non è scegliere a caso — è un processo metodico."},
  {"type":"heading","level":2,"text":"Il processo in 4 step"},
  {"type":"heading","level":3,"text":"Step 1: Scegli l''archetipo"},
  {"type":"paragraph","text":"Prima di tutto, decidi che tipo di combo vuoi costruire. Domande da farti:"},
  {"type":"list","items":[
    "**Quale stile di gioco mi piace?** Aggressivo, difensivo, di resistenza?",
    "**Cosa manca al mio deck?** Se hai già 2 Stamina, magari serve un Attack",
    "**Contro chi giocherò?** Se nel mio gruppo dominano Stamina, forse mi serve Attack"
  ]},
  {"type":"heading","level":3,"text":"Step 2: Parti dal Blade"},
  {"type":"paragraph","text":"Il Blade è la tua identità. Sceglilo per primo, basandoti sull''archetipo deciso. Punta su Blade in **tier S o A** se possibile — controlla la Tier List nell''app."},
  {"type":"tip","variant":"info","text":"Per principianti, partire da un Blade meta-collaudato è meglio che provare a forzare un Blade ''di nicchia''. Phoenix Wing, Wizard Rod, Cobalt Dragoon e Hells Scythe sono ottimi punti di partenza."},
  {"type":"heading","level":3,"text":"Step 3: Scegli il Ratchet"},
  {"type":"paragraph","text":"Il Ratchet deve **rinforzare** il piano del Blade, non ostacolarlo:"},
  {"type":"list","items":[
    "**Attack** → Ratchet **basso (60mm)**, **pochi lati (3-5)** per velocità",
    "**Defense** → Ratchet **alto (70-80mm)**, **molti lati (7-9)** per stabilità",
    "**Stamina** → Ratchet **medio-alto (60-70mm)**, **lati medi (5-7)** per equilibrio",
    "**Balance** → Ratchet **medio (4-70 o 5-70)** per versatilità"
  ]},
  {"type":"heading","level":3,"text":"Step 4: Scegli il Bit"},
  {"type":"paragraph","text":"Il Bit è il dettaglio finale che definisce il comportamento esatto del combo:"},
  {"type":"list","items":[
    "**Attack** → **Flat / Rush / Gear Flat** per movimento aggressivo",
    "**Defense** → **Needle / Spike / Wedge** per stabilità",
    "**Stamina** → **Ball / Hexa / Disk Ball** per permanenza",
    "**Balance** → **Taper / Accel / Point** per adattabilità"
  ]},
  {"type":"heading","level":2,"text":"Esempi di combo competitive"},
  {"type":"two_column","left":[
    {"type":"heading","level":3,"text":"⚔️ Attack Combo"},
    {"type":"paragraph","text":"**Cobalt Dragoon 3-60 Flat**"},
    {"type":"list","items":[
      "Blade pesante, alta forza di impatto",
      "Ratchet basso per andare sotto Defense",
      "Bit Flat per movimento aggressivo"
    ]}
  ],"right":[
    {"type":"heading","level":3,"text":"🛡️ Defense Combo"},
    {"type":"paragraph","text":"**Knight Shield 9-80 Spike**"},
    {"type":"list","items":[
      "Blade con CWD, peso centrale",
      "Ratchet alto e con molti lati",
      "Bit Spike per resistenza al KO"
    ]}
  ]},
  {"type":"two_column","left":[
    {"type":"heading","level":3,"text":"♾️ Stamina Combo"},
    {"type":"paragraph","text":"**Wizard Rod 5-70 Hexa**"},
    {"type":"list","items":[
      "Blade UX con grande disco esterno",
      "Ratchet medio-alto bilanciato",
      "Hexa Bit dominante nel meta"
    ]}
  ],"right":[
    {"type":"heading","level":3,"text":"⚖️ Balance Combo"},
    {"type":"paragraph","text":"**Hells Scythe 4-60 Taper**"},
    {"type":"list","items":[
      "Blade versatile",
      "Ratchet popolare bilanciato",
      "Taper per adattabilità"
    ]}
  ]},
  {"type":"heading","level":2,"text":"Come testare la tua combo"},
  {"type":"paragraph","text":"Una volta costruita la combo, testala. Niente teoria sostituisce la pratica:"},
  {"type":"list","ordered":true,"items":[
    "**Lancia almeno 10 volte** in solo per vedere il comportamento naturale",
    "**Testala contro vari avversari** per capire come si comporta nei matchup",
    "**Registra i risultati** nella sezione Battle dell''app per analizzare le performance",
    "**Itera**: cambia un componente alla volta per capire l''effetto di ogni modifica"
  ]},
  {"type":"tip","variant":"success","text":"La regola d''oro: cambia un solo componente alla volta. Se cambi Blade E Bit insieme, non saprai mai quale dei due ha causato la differenza."},
  {"type":"heading","level":2,"text":"Errori comuni"},
  {"type":"list","items":[
    "**Mescolare componenti contraddittori**: Blade Attack + Ratchet alto + Bit Stamina = combo confuso che non eccelle in nulla",
    "**Ignorare il peso totale**: combo troppo leggere perdono presto stamina, troppo pesanti perdono mobilità",
    "**Copiare ciecamente le tier list**: una combo top-tier può non funzionare bene nelle tue mani — la skill conta",
    "**Non testare**: la teoria è solo metà del lavoro"
  ]},
  {"type":"inline_quiz","question":"Quale combo è meglio bilanciato per Attack?","options":["Cobalt Dragoon 9-80 Ball","Cobalt Dragoon 3-60 Flat","Cobalt Dragoon 5-70 Needle","Cobalt Dragoon 4-70 Hexa"],"correctIndex":1,"explanation":"Cobalt Dragoon 3-60 Flat è coerente: Blade Attack + Ratchet basso e leggero + Bit Flat per movimento aggressivo. Le altre combinazioni hanno componenti contraddittori."}
]',
'{"questions":[
  {"question":"Qual è il primo componente da scegliere quando si costruisce una combo?","options":["Il Bit","Il Ratchet","Il Blade","L''avversario"],"correctIndex":2,"explanation":"Il Blade definisce l''identità della combo (archetipo, peso, direzione). Si parte sempre dal Blade e si adattano Ratchet e Bit attorno."},
  {"question":"Per un Attack che vuole infilarsi sotto le Defense, quale Ratchet scegliere?","options":["9-80","3-60","5-70","7-80"],"correctIndex":1,"explanation":"3-60 è basso (60mm) per andare sotto i Defense alti, e ha pochi lati per ridurre peso e aumentare velocità."},
  {"question":"Qual è la regola d''oro per testare una combo?","options":["Cambiare tutto insieme","Cambiare un componente alla volta","Non testare mai","Testare solo contro principianti"],"correctIndex":1,"explanation":"Cambiare un componente alla volta è l''unico modo per capire l''effetto preciso di ogni modifica."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 12: Matchup Basics
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('matchup-basics', 'intermediate', 'Matchup di Base', 'Chi batte chi e perché', 7, 40, 6,
'[
  {"type":"paragraph","text":"Conoscere come si scontrano gli archetipi è essenziale per fare scelte intelligenti durante un match. Non si tratta solo del triangolo classico — ogni matchup ha sfumature, controgiochi e variabili."},
  {"type":"heading","level":2,"text":"La matrice dei matchup"},
  {"type":"diagram","src":"/academy/matchup_matrix.png","caption":"La matrice dei matchup classica in Beyblade X"},
  {"type":"paragraph","text":"In percentuale di vittoria approssimativa (con combo equivalenti):"},
  {"type":"list","items":[
    "**Attack vs Stamina**: 60-70% Attack",
    "**Stamina vs Defense**: 65-75% Stamina",
    "**Defense vs Attack**: 55-65% Defense",
    "**Same vs Same**: 50% (skill-based)",
    "**Balance vs Anything**: 40-55% (situazionale)"
  ]},
  {"type":"tip","variant":"info","text":"Queste percentuali sono indicative. Una combo top-tier può vincere matchup ''sfavorevoli'' contro una combo low-tier dello stesso archetipo dominante."},
  {"type":"heading","level":2,"text":"⚔️ Attack vs Stamina"},
  {"type":"paragraph","text":"Il matchup classico ''aggressivo vs paziente''. L''Attack vince **solo se conclude rapidamente**."},
  {"type":"list","items":[
    "**Strategia Attack**: cerca KO immediato sui primi giri, prima di esaurire spin",
    "**Strategia Stamina**: gioca difensivamente, evita gli impatti diretti, sopravvivi"
  ]},
  {"type":"tip","variant":"success","text":"Se sei Attack e non concludi nei primi 15 secondi, sei in svantaggio. La tua stamina sta crollando velocemente, mentre quella dell''avversario è quasi intatta."},
  {"type":"heading","level":2,"text":"♾️ Stamina vs Defense"},
  {"type":"paragraph","text":"Stamina batte Defense perché ha **più velocità di rotazione** e meno attrito interno. Defense ha CWD ma stamina inferiore."},
  {"type":"list","items":[
    "**Strategia Stamina**: lascia che il Defense si stanchi da solo, gli impatti sono raramente decisivi",
    "**Strategia Defense (in svantaggio)**: cerca contrattacchi che spingano lo Stamina verso il bordo"
  ]},
  {"type":"heading","level":2,"text":"🛡️ Defense vs Attack"},
  {"type":"paragraph","text":"Defense batte Attack perché **assorbe l''aggressione** e contrattacca. L''Attack si auto-sabota: tanti impatti riducono la sua stamina, e ogni rimbalzo lo avvicina alle Over Zones."},
  {"type":"list","items":[
    "**Strategia Defense**: stai al centro, lascia che l''Attack venga da te",
    "**Strategia Attack (in svantaggio)**: punta su Xtreme Finish con lancio bank-shot per evitare lo scontro frontale"
  ]},
  {"type":"heading","level":2,"text":"⚖️ I matchup di Balance"},
  {"type":"paragraph","text":"Balance non ha matchup ''nettamente favorevoli''. Vince per skill, lettura dell''avversario e condizioni specifiche:"},
  {"type":"list","items":[
    "**vs Attack**: come Defense ma meno stabile — vince se l''Attack si auto-KO",
    "**vs Defense**: come Stamina ma con meno spin — vince per piccoli margini",
    "**vs Stamina**: matchup peggiore — non ha la potenza dell''Attack per chiudere veloce"
  ]},
  {"type":"heading","level":2,"text":"Variabili che alterano il matchup"},
  {"type":"heading","level":3,"text":"Direzione di rotazione"},
  {"type":"paragraph","text":"**Right vs Left** crea impatti molto più violenti del normale. Spesso un Beyblade left-spin può ribaltare un matchup classico semplicemente per il maggior danno inflitto sui contatti."},
  {"type":"heading","level":3,"text":"Spin Steal"},
  {"type":"paragraph","text":"Alcune combo (es. con Bit **Wedge** o **Elevate**) possono **rubare** rotazione all''avversario quando hanno direzioni opposte. Questo trasforma matchup difficili in vittorie facili."},
  {"type":"heading","level":3,"text":"Skill del giocatore"},
  {"type":"paragraph","text":"In matchup 50/50 sulla carta, vince chi:"},
  {"type":"list","items":[
    "Conosce meglio il proprio Beyblade",
    "Ha tecnica di lancio più consistente",
    "Sa leggere il pattern di lancio dell''avversario",
    "Ha allenamento e calma sotto pressione"
  ]},
  {"type":"tip","variant":"warning","text":"Mai sottovalutare un avversario solo perché ha una combo ''inferiore'' sulla carta. Un giocatore esperto con una combo B-tier può battere un principiante con una combo S-tier."},
  {"type":"heading","level":2,"text":"Come usare i matchup nel gameplay"},
  {"type":"list","ordered":true,"items":[
    "**Identifica l''archetipo dell''avversario** dal suo Beyblade prima del lancio",
    "**Adatta la tua strategia** in base al matchup teorico",
    "**Modifica il tipo di lancio**: bank shot per Attack, lancio neutro per Stamina",
    "**Riconosci quando perdi**: se sei in svantaggio, gioca per i punti facili (spin finish 1pt) invece di rischiare auto-KO"
  ]},
  {"type":"inline_quiz","question":"Stai giocando con un Beyblade Attack e l''avversario lancia un Defense. Cosa fai?","options":["Aggressione totale","Cerco un Xtreme Finish con bank shot","Lascio scadere il tempo","Cambio Beyblade durante il match"],"correctIndex":1,"explanation":"Defense batte Attack nel matchup standard. Un bank shot mirato alla Xtreme Zone ti dà la possibilità di un finish da 3 punti senza scontro frontale che ti svantaggerebbe. Cambiare Beyblade durante il match è proibito dalle regole ufficiali."}
]',
'{"questions":[
  {"question":"In un matchup Attack vs Stamina, qual è la chiave per la vittoria di Attack?","options":["Resistere a lungo","Concludere rapidamente con KO","Aspettare lo spin finish","Evitare il contatto"],"correctIndex":1,"explanation":"Attack ha stamina bassa quindi deve concludere nei primi 10-15 secondi con un KO o un Burst. Più la battaglia dura, più Attack è in svantaggio."},
  {"question":"Quanto può influire la direzione di rotazione (right vs left) sul matchup?","options":["Per niente","Pochissimo","Significativamente — gli impatti sono più violenti","Solo nei tornei ufficiali"],"correctIndex":2,"explanation":"Right vs Left crea impatti molto più violenti del normale, spesso ribaltando matchup classici."},
  {"question":"Qual è il matchup peggiore per Balance?","options":["vs Attack","vs Defense","vs Stamina","vs altro Balance"],"correctIndex":2,"explanation":"Balance vs Stamina è il matchup peggiore: non ha la potenza dell''Attack per chiudere velocemente e perde sulla stamina pura."}
]}'
) ON CONFLICT (id) DO NOTHING;


