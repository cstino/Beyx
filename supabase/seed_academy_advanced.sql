-- ════════════════════════════════════════════════════════════════
-- ADVANCED LEVEL — 6 lessons on competitive play
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────
-- Lesson 13: Tier List Explained
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('tier-list-explained', 'advanced', 'Capire le Tier List', 'Come leggere e usare le classifiche competitive', 7, 45, 1,
'[
  {"type":"paragraph","text":"Una **Tier List** è una classifica gerarchica che ordina le parti (o le combo intere) dalla più forte alla più debole nel meta competitivo. Conoscere la Tier List ti aiuta a fare scelte informate, ma capirla è più importante che memorizzarla."},
  {"type":"heading","level":2,"text":"I tier classici"},
  {"type":"diagram","src":"assets/academy/tierlist.png","caption":"La gerarchia dei tier dal più forte al più debole"},
  {"type":"list","items":[
    "**S Tier** (oro): Meta-defining. Domina il torneo, must-have. Quasi tutte le top combo le includono",
    "**A Tier** (viola): Molto forte, competitivo. Performance sopra la media in più matchup",
    "**B Tier** (blu): Solido, scelta valida. Funziona bene in contesti specifici",
    "**C Tier** (verde): Situazionale, di nicchia. Buono solo in matchup particolari",
    "**D Tier** (grigio): Debole, raramente usato. Outclassato in quasi ogni scenario"
  ]},
  {"type":"tip","variant":"info","text":"Le Tier List sono opinioni informate, non leggi assolute. Le compilano top player e analyst dopo molti tornei, ma il meta evolve continuamente — quello che è S oggi può scendere a B in 6 mesi."},
  {"type":"heading","level":2,"text":"Tier List per parte vs Tier List per combo"},
  {"type":"paragraph","text":"Esistono **due tipi** di Tier List che è importante distinguere:"},
  {"type":"two_column","left":[
    {"type":"heading","level":3,"text":"Per parte"},
    {"type":"paragraph","text":"Classifica singolarmente Blade, Ratchet, Bit. Più utile per chi compone combo."},
    {"type":"list","items":[
      "Blade S Tier",
      "Ratchet S Tier",
      "Bit S Tier"
    ]}
  ],"right":[
    {"type":"heading","level":3,"text":"Per combo intera"},
    {"type":"paragraph","text":"Classifica combo complete (Blade+Ratchet+Bit). Più utile per replicare build vincenti."},
    {"type":"list","items":[
      "Wizard Rod 5-70 Hexa = S",
      "Cobalt Drake 3-60 Flat = A",
      "Hells Scythe 4-60 Taper = B"
    ]}
  ]},
  {"type":"heading","level":2,"text":"Dove trovare Tier List affidabili"},
  {"type":"list","items":[
    "**WorldBeyblade.org**: la community competitiva globale, Tier List ufficiali aggiornate periodicamente",
    "**BeyBxDB.com**: database con statistiche oggettive e tier",
    "**Subreddit r/Beyblade**: discussioni meta e tier proposte dalla community",
    "**Top player YouTube**: alcuni player condividono le proprie analisi (es. ZankyeR, BeyBase)"
  ]},
  {"type":"tip","variant":"warning","text":"Diffida delle Tier List vecchie. Una Tier List di 12+ mesi fa potrebbe non riflettere il meta attuale, soprattutto dopo l''uscita di nuove linee come UX e CX."},
  {"type":"heading","level":2,"text":"Come usare la Tier List intelligentemente"},
  {"type":"list","ordered":true,"items":[
    "**Non copiare ciecamente**: una combo S-tier in mano sbagliata perde contro una B-tier ben usata",
    "**Considera il tuo stile**: se odi giocare Defense, non forzarti a usare un Defense S-tier solo perché è ''forte''",
    "**Adatta al meta locale**: nel tuo gruppo di amici potrebbe esserci un meta diverso da quello globale",
    "**Studia i matchup**: una S contro Stamina può essere C contro Attack — il contesto conta"
  ]},
  {"type":"heading","level":2,"text":"Il fenomeno del ''pocket pick''"},
  {"type":"paragraph","text":"Un **pocket pick** è una combo non-meta che eccelle solo contro avversari specifici. Top player la portano nascosta nei deck per situazioni precise."},
  {"type":"tip","variant":"success","text":"Esempio classico: una Defense B-tier può diventare devastante contro un meta dominato da Attack S-tier, perché ne sfrutta le debolezze. È la base della metà-game di alto livello."},
  {"type":"inline_quiz","question":"Hai una combo C-tier che vince sempre nel tuo gruppo. Cosa fai?","options":["La sostituisco con qualcosa di S-tier","La continuo a usare — vinco","La nascondo per non sembrare un newbie","Pubblico la combo per fama"],"correctIndex":1,"explanation":"Se una combo vince nel tuo contesto, il tier non importa. La Tier List è una guida, non una sentenza. Continua a usare quello che funziona per te."}
]',
'{"questions":[
  {"question":"Cosa significa S Tier?","options":["Standard","Slow","Strongest / Meta-defining","Special edition"],"correctIndex":2,"explanation":"S Tier indica le parti più forti del meta corrente, le ''meta-defining'' che dominano la maggior parte dei tornei."},
  {"question":"Una Tier List è...","options":["Una legge assoluta","Una classifica oggettiva immutabile","Un''opinione informata che evolve nel tempo","Solo per principianti"],"correctIndex":2,"explanation":"Le Tier List sono opinioni informate compilate da top player e analyst. Non sono leggi assolute e cambiano nel tempo con l''evoluzione del meta."},
  {"question":"Cos''è un ''pocket pick''?","options":["Una combo da nascondere","Una combo non-meta efficace contro avversari specifici","Una combo per principianti","Un Beyblade tascabile"],"correctIndex":1,"explanation":"Un pocket pick è una combo non-meta che eccelle in situazioni specifiche. Top player la portano per contrastare avversari particolari."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 14: Meta Analysis
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('meta-analysis', 'advanced', 'Analizzare il Meta Corrente', 'Come si evolve il gioco competitivo', 8, 45, 2,
'[
  {"type":"paragraph","text":"Il **meta** (abbreviazione di *metagame*) è l''insieme delle strategie, combo e parti dominanti in un dato momento del gioco competitivo. Capire come evolve il meta è quello che separa un top player da un giocatore casuale."},
  {"type":"heading","level":2,"text":"Cosa determina il meta"},
  {"type":"list","items":[
    "**Nuove release**: ogni nuova linea (BX, UX, CX) introduce parti che possono ribaltare il meta",
    "**Scoperte tecniche**: la community trova interazioni o sinergie nuove tra parti esistenti",
    "**Cambi regolamento**: variazioni nei punteggi o nei formati tornei possono favorire/sfavorire archetipi",
    "**Risultati tornei**: le combo che vincono i grandi tornei diventano popolari per imitazione",
    "**Innovazioni di top player**: un singolo player con una build innovativa può cambiare il meta"
  ]},
  {"type":"heading","level":2,"text":"Le ere del Meta Beyblade X"},
  {"type":"heading","level":3,"text":"Era BX (2023-2024)"},
  {"type":"paragraph","text":"Il meta iniziale era dominato dalle Attack aggressive grazie alla novità della Xtreme Line. **Dran Sword**, **Cobalt Drake** e i Bit **Flat/Rush** dominavano. Le Stamina erano sottovalutate."},
  {"type":"heading","level":3,"text":"Era UX (2024-2025)"},
  {"type":"paragraph","text":"L''introduzione della Unique Line ha riequilibrato il gioco. **Wizard Rod**, **Phoenix Wing**, e l''arrivo del **Hexa Bit** hanno reso le Stamina dominanti. Il meta è diventato più lento e tecnico."},
  {"type":"heading","level":3,"text":"Era CX (2025-2026)"},
  {"type":"paragraph","text":"La Custom Line con Lock Chip + Main Blade + Assist Blade ha portato la massima personalizzazione. Combo ibride mai viste prima dominano i tornei top-level."},
  {"type":"tip","variant":"info","text":"Il meta corrente (aprile 2026) è caratterizzato da forte presenza di build CX customizzate, dominanza delle Stamina con Hexa, e nicchie Attack dedicate al counter delle Stamina meta."},
  {"type":"heading","level":2,"text":"Meta corrente — top tier"},
  {"type":"two_column","left":[
    {"type":"heading","level":3,"text":"S Tier oggi"},
    {"type":"list","items":[
      "**Wizard Rod 5-70 Hexa** — re Stamina",
      "**Cobalt Drake 3-60 Gear Flat** — Attack KO machine",
      "**Phoenix Wing 4-70 Disk Ball** — Stamina sicuro",
      "**Bear Scratch 1-60 Rush** — Attack veloce"
    ]}
  ],"right":[
    {"type":"heading","level":3,"text":"A Tier oggi"},
    {"type":"list","items":[
      "**Hells Scythe 4-60 Taper** — Balance versatile",
      "**Knight Lance 9-60 Spike** — Defense counter-Attack",
      "**Aero Pegasus 9-80 Orb** — Stamina alternativo",
      "Combo CX ibride personalizzate"
    ]}
  ]},
  {"type":"heading","level":2,"text":"Come restare aggiornato"},
  {"type":"list","items":[
    "**Segui i tornei top**: Beyblade X World Championship, eventi WBO, tornei Hasbro/Takara Tomy",
    "**Frequenta worldbeyblade.org**: thread di discussione meta aggiornati",
    "**Segui creator competitivi**: ZankyeR, BeyBase, BeyChannel su YouTube",
    "**Partecipa al meta locale**: scopri cosa funziona nel tuo gruppo, non sempre coincide col meta globale"
  ]},
  {"type":"heading","level":2,"text":"Predire l''evoluzione del meta"},
  {"type":"paragraph","text":"I top player non si limitano a giocare il meta — provano a **anticiparlo**. Quando una nuova parte esce, le domande chiave sono:"},
  {"type":"list","ordered":true,"items":[
    "**Cosa fa di nuovo questa parte?** Una sinergia mai vista, una stat mai raggiunta, un gimmick unico?",
    "**Cosa controgioca questa parte?** Se diventa S-tier, cosa la batterà nel meta successivo?",
    "**Come si combina con parti esistenti?** Le sinergie nascoste sono spesso decisive"
  ]},
  {"type":"tip","variant":"success","text":"Il meta è un ecosistema. Ogni nuova top combo crea automaticamente una nuova nicchia di counter-strategie. Saper anticipare è un vantaggio enorme."},
  {"type":"inline_quiz","question":"Una nuova parte esce e i top player iniziano a usarla. Cosa indica?","options":["È destinata a essere S-tier","Vale la pena studiarla anche se non la userò","Devo comprarla subito","È sopravvalutata"],"correctIndex":1,"explanation":"Quando i top player si concentrano su una nuova parte, vale sempre la pena studiarla. Anche se non la userai, capire come funziona ti aiuta a capire cosa affronterai nei prossimi mesi."}
]',
'{"questions":[
  {"question":"Il meta è...","options":["Le regole ufficiali del gioco","L''insieme di strategie e combo dominanti in un dato momento","Una parte specifica del Beyblade","Il livello di difficoltà"],"correctIndex":1,"explanation":"Meta = metagame. È l''insieme di strategie, combo e parti che dominano il gioco competitivo in un dato momento."},
  {"question":"Quale linea ha reso le Stamina dominanti nel meta?","options":["BX (Basic)","UX (Unique)","CX (Custom)","Nessuna"],"correctIndex":1,"explanation":"L''introduzione della UX line, in particolare di Wizard Rod e l''Hexa Bit, ha spostato il meta verso le Stamina."},
  {"question":"Qual è una buona fonte per restare aggiornati sul meta?","options":["Wikipedia","WorldBeyblade.org","Solo l''anime","Solo i propri amici"],"correctIndex":1,"explanation":"WorldBeyblade.org è la community competitiva globale di riferimento, con discussioni meta sempre aggiornate."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 15: Tournament Formats
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('tournament-formats', 'advanced', 'Formati di Torneo', '1v1, 3v3, Swiss, Bracket e oltre', 8, 45, 3,
'[
  {"type":"paragraph","text":"I tornei di Beyblade X possono usare formati molto diversi tra loro. Conoscerli ti permette di prepararti correttamente, scegliere le combo giuste e gestire la strategia complessiva del torneo."},
  {"type":"heading","level":2,"text":"Tipi di match"},
  {"type":"heading","level":3,"text":"1v1 Match"},
  {"type":"paragraph","text":"Il formato più semplice: ogni giocatore porta **un solo Beyblade** e lo usa per tutto il match. Vince chi raggiunge per primo il punteggio target (4 o 7 punti)."},
  {"type":"list","items":[
    "**Pro**: Semplice, veloce, skill-focused",
    "**Contro**: Nessuna strategia di matchup — sei bloccato sulla tua combo",
    "**Ideale per**: Eventi rapidi, principianti, tornei locali"
  ]},
  {"type":"heading","level":3,"text":"3v3 Deck Format"},
  {"type":"paragraph","text":"Il formato competitivo standard. Ogni giocatore registra un **deck di 3 Beyblade diverse**. Per ogni battle si sceglie una delle 3 (a turno alternato di rivelazione). Una stessa parte non può comparire due volte nello stesso deck (eccezione: i Lock Chip CX)."},
  {"type":"list","items":[
    "**Pro**: Strategia profonda, copertura matchup, mind games",
    "**Contro**: Richiede più parti e più preparazione",
    "**Ideale per**: Tornei ufficiali, eventi competitivi"
  ]},
  {"type":"tip","variant":"info","text":"Nel 3v3, una stessa parte è considerata uguale anche tra varianti regionali. Ad esempio, Phoenix Wing e Soar Phoenix sono lo stesso Blade — non puoi usare entrambi nello stesso deck."},
  {"type":"heading","level":2,"text":"Strutture di torneo"},
  {"type":"heading","level":3,"text":"Swiss Format"},
  {"type":"paragraph","text":"Il formato più diffuso nei tornei medio-grandi. Tutti i giocatori giocano un **numero fisso di round** (tipicamente 4-5). Dopo ogni round, ti accoppiano con qualcuno con un record simile al tuo."},
  {"type":"list","items":[
    "**Pro**: Tutti giocano lo stesso numero di match, classifica precisa",
    "**Contro**: Lungo, può durare ore",
    "**Conta**: Il punteggio finale (vittorie/sconfitte) determina chi accede ai playoff"
  ]},
  {"type":"heading","level":3,"text":"Single Elimination"},
  {"type":"paragraph","text":"Il classico bracket: perdi una volta = eliminato. Veloce e drammatico."},
  {"type":"list","items":[
    "**Pro**: Veloce, intenso, ogni match conta",
    "**Contro**: Una sconfitta sfortunata ti elimina — poco margine d''errore",
    "**Ideale per**: Fasi finali, finals di tornei"
  ]},
  {"type":"heading","level":3,"text":"Double Elimination"},
  {"type":"paragraph","text":"Stile bracket ma con due tabelloni: vincenti e perdenti. Devi perdere **due volte** per essere eliminato. Più giusto del single elimination."},
  {"type":"list","items":[
    "**Pro**: Una sconfitta non è fatale, classifiche più giuste",
    "**Contro**: Più lungo, struttura complessa",
    "**Tipico per**: Top cut di tornei major"
  ]},
  {"type":"heading","level":3,"text":"Round Robin"},
  {"type":"paragraph","text":"**Ogni giocatore affronta tutti gli altri** una volta. Chi ha il record migliore vince. Tipico per gironi piccoli (4-8 giocatori)."},
  {"type":"list","items":[
    "**Pro**: Massima fairness, vede tutti contro tutti",
    "**Contro**: Non scala — con 32 giocatori sono 496 match",
    "**Ideale per**: Gironi piccoli, fase qualificazione"
  ]},
  {"type":"heading","level":2,"text":"Strutture ibride"},
  {"type":"paragraph","text":"I tornei major spesso combinano formati:"},
  {"type":"list","items":[
    "**Swiss + Top Cut**: Swiss qualifica i top 8, poi single elimination",
    "**Round Robin + Bracket**: Gironi small round robin → bracket finale",
    "**Esempio reale**: Beyblade X World Championship usa Round Robin per qualificare 8 finalisti, poi bracket"
  ]},
  {"type":"heading","level":2,"text":"Punteggi target"},
  {"type":"makeTable","items":[]},
  {"type":"list","items":[
    "**4 punti**: Default per la prima fase di tornei (regolamento ufficiale 8th edition)",
    "**7 punti**: Default per le finali",
    "**10 punti**: Usato in finali speciali (es. National Championship USA 2025)",
    "**20 punti totali**: Per match a squadre (es. Hasbro Secret Showdown)"
  ]},
  {"type":"heading","level":2,"text":"Strategia per formato"},
  {"type":"two_column","left":[
    {"type":"heading","level":3,"text":"In Swiss"},
    {"type":"list","items":[
      "Gioca consistentemente, evita gli upset",
      "Tieni una combo solida vs il maggior numero di matchup",
      "Non rivelare il tuo deck migliore subito"
    ]}
  ],"right":[
    {"type":"heading","level":3,"text":"In Bracket"},
    {"type":"list","items":[
      "Tira fuori il pocket pick contro avversari noti",
      "Studia chi affronterai prima del match",
      "Gioca aggressivo — non puoi permetterti pareggi"
    ]}
  ]},
  {"type":"tip","variant":"warning","text":"Il regolamento ufficiale prevede che eventuali ''ties'' (pareggi) siano risolti con un sudden death match. In bracket, una sconfitta in sudden death ti elimina."},
  {"type":"inline_quiz","question":"In un torneo Swiss a 5 round, hai 3 vittorie e 2 sconfitte. Sei qualificato per il top 8?","options":["Sicuramente sì","Probabilmente, ma dipende dagli altri","No, ho perso troppo","Solo se vinco l''ultimo round"],"correctIndex":1,"explanation":"In Swiss, dipende dai record degli altri partecipanti. Con 3-2 sei spesso al limite del top cut. La qualità degli avversari (tiebreaker) può fare la differenza."}
]',
'{"questions":[
  {"question":"Nel formato 3v3 Deck, quante Beyblade diverse devi registrare?","options":["1","2","3","Quante vuoi"],"correctIndex":2,"explanation":"Il formato 3v3 richiede esattamente 3 Beyblade diverse nel deck. Stessa parte non può comparire due volte (tranne i Lock Chip CX)."},
  {"question":"Cosa caratterizza il formato Swiss?","options":["Eliminazione immediata","Numero fisso di round con accoppiamenti basati sul record","Tutti contro tutti","Solo i top 4 giocano"],"correctIndex":1,"explanation":"In Swiss, tutti giocano lo stesso numero di round e dopo ogni round vieni accoppiato con qualcuno con record simile al tuo."},
  {"question":"Quanti punti servono per vincere nella prima fase di un torneo standard?","options":["3","4","7","10"],"correctIndex":1,"explanation":"Il regolamento ufficiale (8th edition) prevede 4 punti per la prima fase. 7 punti per le finali."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 16: Advanced Launching Techniques
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('launching-techniques', 'advanced', 'Tecniche di Lancio Avanzate', 'Bank Shot, Sliding Shoot e altre tecniche pro', 9, 50, 4,
'[
  {"type":"paragraph","text":"Il lancio non è solo ''tirare il winder''. I top player usano **tecniche di lancio specializzate** che possono trasformare una combo media in una macchina da guerra. Ogni archetipo ha tecniche ottimali."},
  {"type":"heading","level":2,"text":"Lancio neutro (refresher)"},
  {"type":"paragraph","text":"Prima di passare alle avanzate: il lancio standard prevede launcher **perpendicolare allo stadio**, allineato con l''area di lancio centrale. Il Beyblade scende dritto al centro. Questo è l''ideale per **Stamina e Defense**, che vogliono restare al centro."},
  {"type":"tip","variant":"info","text":"Il lancio neutro è chiamato anche ''Standard Shoot'' o ''Center Shoot'' nella terminologia Beyblade competitiva."},
  {"type":"heading","level":2,"text":"⚔️ Bank Shot (Banking Shoot)"},
  {"type":"paragraph","text":"La tecnica fondamentale per **Attack**. Si inclina il launcher in modo che la base del Beyblade sia **parallela alla pendenza della Xtreme Line**. Risultato: il Beyblade scende verso il bordo dello stadio invece che al centro."},
  {"type":"heading","level":3,"text":"Come eseguirla"},
  {"type":"list","ordered":true,"items":[
    "**Inclina il launcher** di circa 30-45° rispetto alla verticale",
    "**Punta la punta del Beyblade** verso il bordo dello stadio (non l''avversario diretto)",
    "**Tieni la base parallela alla Xtreme Line**, non perpendicolare allo stadio",
    "**Tira il winder con forza standard** — non serve forza extra"
  ]},
  {"type":"heading","level":3,"text":"Effetto: Flower Pattern"},
  {"type":"paragraph","text":"Il Bank Shot crea un movimento a **forma di fiore**: il Beyblade gira lungo la Xtreme Line, accelera, torna verso il centro, esce di nuovo verso il bordo. Da fuori sembra che disegni petali. Questo pattern è ideale per attacchi multipli e KO."},
  {"type":"tip","variant":"warning","text":"Errore comune: lanciare troppo forte col Bank Shot. Il Beyblade rimbalzerà sui muri perdendo stamina. La forza ottimale è inferiore a quella di un lancio neutro."},
  {"type":"heading","level":2,"text":"⚡ Sliding Shoot"},
  {"type":"paragraph","text":"L''evoluzione del Bank Shot, considerata la tecnica più avanzata. Combina Banking + **Catapult** (movimento del braccio in avanti) per dare ulteriore velocità di entrata."},
  {"type":"heading","level":3,"text":"Come eseguirla"},
  {"type":"list","ordered":true,"items":[
    "**Posizionati con il braccio sinistro piegato** (gomito flesso) tenendo il launcher",
    "**Inclina il launcher** come nel Bank Shot (parallelo alla Xtreme Line)",
    "**Mentre tiri il winder con la destra**, contemporaneamente **estendi il braccio sinistro in avanti**",
    "**Movimento delle braccia opposto**: sinistra avanti, destra indietro, simultaneamente"
  ]},
  {"type":"heading","level":3,"text":"Effetto"},
  {"type":"paragraph","text":"Il Beyblade entra nello stadio **già in movimento orizzontale** verso il bordo, con velocità superiore. Il flower pattern è più aggressivo, gli attacchi più devastanti. Lo Sliding Shoot ottimale **non tocca nemmeno il muro** all''entrata — il Beyblade si dirige direttamente sulla Xtreme Line."},
  {"type":"tip","variant":"warning","text":"Tecnica difficile! Richiede settimane o mesi di pratica per padroneggiarla. **Allenati da solo** prima di usarla in match — un errore può mandare il Beyblade fuori dallo stadio."},
  {"type":"heading","level":2,"text":"🎯 Bank Down Shot"},
  {"type":"paragraph","text":"Variante del Bank Shot: launcher inclinato **verso il basso** dentro lo stadio (non parallelo). Più semplice del Sliding Shoot e leggermente meno potente, ma molto più consistente. Ideale per chi sta imparando."},
  {"type":"heading","level":2,"text":"💨 Flash Shoot"},
  {"type":"paragraph","text":"Tecnica avanzata per **timing perfetto**. Si lancia esattamente al ''Go'' del countdown ma con il launcher **inclinato in basso**, quasi parallelo al pavimento dello stadio. Il Beyblade entra rasoterra, eseguendo un attacco immediato."},
  {"type":"tip","variant":"info","text":"Il Flash Shoot è rischioso ma può sorprendere l''avversario nei primi mezzo-secondo del match. Usato raramente dai pro, ma efficace contro Stamina passive."},
  {"type":"heading","level":2,"text":"♾️ Tecniche per Stamina e Defense"},
  {"type":"paragraph","text":"Per le combo di tipo Stamina e Defense, l''obiettivo è **opposto**: tenere il Beyblade al centro dello stadio."},
  {"type":"list","items":[
    "**Center Shoot**: lancio perpendicolare standard, mira al centro esatto della launch area",
    "**Soft Shoot**: lancio con forza ridotta — preserva stamina sacrificando velocità iniziale",
    "**Trick Banking minimal**: leggera angolazione (10-15°) per posizionarsi dietro a un Defense piuttosto che davanti"
  ]},
  {"type":"heading","level":2,"text":"Tabella riassuntiva"},
  {"type":"makeTable","items":[]},
  {"type":"list","items":[
    "**Bank Shot** → Attack: flower pattern, KO setup",
    "**Sliding Shoot** → Attack avanzato: massima aggressività, alta skill cap",
    "**Bank Down Shot** → Attack intermedio: flower pattern più semplice",
    "**Flash Shoot** → Attack situazionale: sorpresa nei primi secondi",
    "**Center Shoot** → Stamina/Defense: stabilità al centro",
    "**Soft Shoot** → Stamina: preservazione spin a lungo termine"
  ]},
  {"type":"heading","level":2,"text":"Come allenarsi"},
  {"type":"list","ordered":true,"items":[
    "**Pratica solo** prima di usare in match",
    "**Inizia col Bank Shot base**, poi passa al Bank Down Shot, poi al Sliding Shoot",
    "**Filma i tuoi lanci** per analizzare la tecnica visivamente",
    "**Conta le tue ripetizioni**: serve consistenza prima della perfezione",
    "**Adatta alla tua altezza**: persone più alte/basse trovano angoli ottimali diversi"
  ]},
  {"type":"tip","variant":"success","text":"Il segreto dei pro: **non tutte le partite richiedono tecniche avanzate**. Sapere QUANDO usare un Sliding Shoot vs un Center Shoot è importante quanto saperlo eseguire."},
  {"type":"inline_quiz","question":"Stai giocando con una combo Attack contro un Defense alto. Quale tecnica usi?","options":["Center Shoot","Bank Shot","Soft Shoot","Flash Shoot"],"correctIndex":1,"explanation":"Bank Shot crea il flower pattern ideale per attaccare ripetutamente un Defense. Il Center Shoot lascerebbe l''Attack al centro, dove il Defense è più stabile."}
]',
'{"questions":[
  {"question":"Cosa caratterizza il Bank Shot?","options":["Launcher perpendicolare","Launcher inclinato parallelo alla Xtreme Line","Launcher tenuto basso","Launcher tirato indietro"],"correctIndex":1,"explanation":"Il Bank Shot prevede di inclinare il launcher in modo che la base del Beyblade sia parallela alla pendenza della Xtreme Line."},
  {"question":"Il Sliding Shoot combina...","options":["Bank Shot + Catapult","Two launches simultanei","Lancio normale + tilt","Bank Shot + lancio basso"],"correctIndex":0,"explanation":"Sliding Shoot = Banking + Catapult Shoot. L''inclinazione del launcher si combina al movimento delle braccia opposto per massima velocità."},
  {"question":"Quale tecnica è ideale per le Stamina?","options":["Bank Shot","Sliding Shoot","Center Shoot","Flash Shoot"],"correctIndex":2,"explanation":"Il Center Shoot (lancio perpendicolare standard) tiene la Stamina al centro dello stadio dove può sfruttare la sua resistenza."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 17: Deck Building
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('deck-building', 'advanced', 'Costruire un Deck Competitivo', 'La strategia dietro al 3v3', 9, 50, 5,
'[
  {"type":"paragraph","text":"Nel formato 3v3, scegliere le 3 combo del tuo deck è un esercizio di **strategia profonda**. Un buon deck non è ''tre combo forti messe insieme'', ma un sistema bilanciato che copre i matchup principali."},
  {"type":"heading","level":2,"text":"I principi del deck building"},
  {"type":"heading","level":3,"text":"1. Copertura dei matchup"},
  {"type":"paragraph","text":"Il tuo deck dovrebbe avere una risposta per ogni matchup probabile. Se 2 delle 3 combo sono Attack, perderai contro un avversario che gioca 2 Defense."},
  {"type":"list","items":[
    "**Almeno 1 Attack** per gestire le Stamina meta",
    "**Almeno 1 Stamina** per matchup contro Defense e neutralità",
    "**1 Balance/Defense** come ''safety net'' versatile"
  ]},
  {"type":"heading","level":3,"text":"2. Sinergia tra le combo"},
  {"type":"paragraph","text":"Le tue 3 combo devono **completarsi**, non sovrapporsi. Se tutte e 3 sono Stamina, perdi automaticamente contro un avversario con Attack forte."},
  {"type":"tip","variant":"info","text":"La regola 70/20/10: 70% delle combo del deck sono ''main play'' (top tier), 20% sono ''pocket'' (counter specifici), 10% è ''wild card'' (sorprese)."},
  {"type":"heading","level":3,"text":"3. Versatilità delle parti"},
  {"type":"paragraph","text":"Una stessa parte non può comparire in 2 combo del deck (eccezione: i Lock Chip CX). Quindi devi avere **sufficiente varietà di parti** per costruire 3 combo complete e diverse."},
  {"type":"heading","level":2,"text":"Archetipi di deck"},
  {"type":"heading","level":3,"text":"Deck Aggressive (Attack-Heavy)"},
  {"type":"paragraph","text":"2 Attack + 1 Stamina come fallback. Strategia: vincere veloce nei primi due match, lasciando il terzo per situazioni controllate."},
  {"type":"list","items":[
    "**Pro**: Pressione costante sull''avversario, KO rapidi",
    "**Contro**: Crolla contro avversario con Defense forte"
  ]},
  {"type":"heading","level":3,"text":"Deck Stamina-focused"},
  {"type":"paragraph","text":"2 Stamina + 1 Attack per emergenze. Il classico deck ''sicuro'' del meta corrente."},
  {"type":"list","items":[
    "**Pro**: Stabile, vince per attrito, pochi rischi",
    "**Contro**: Vulnerabile a un deck Attack-heavy specializzato"
  ]},
  {"type":"heading","level":3,"text":"Deck Balanced (1-1-1)"},
  {"type":"paragraph","text":"1 Attack + 1 Defense + 1 Stamina. Il deck più ''completo'' e flessibile. Standard per principianti competitivi."},
  {"type":"list","items":[
    "**Pro**: Risposta a ogni matchup",
    "**Contro**: Nessuna specializzazione — può perdere contro deck specializzati"
  ]},
  {"type":"heading","level":3,"text":"Deck Tech (Pocket-heavy)"},
  {"type":"paragraph","text":"1 Top tier + 2 pocket pick contro matchup specifici. Solo per giocatori esperti che conoscono profondamente il meta locale."},
  {"type":"list","items":[
    "**Pro**: Devastante in tornei prevedibili dove conosci gli avversari",
    "**Contro**: Crolla contro un meta diverso da quello previsto"
  ]},
  {"type":"heading","level":2,"text":"L''ordine di rivelazione"},
  {"type":"paragraph","text":"Nel 3v3, le Beyblade vengono rivelate **una alla volta**, alternando tra giocatori. Questa è una sotto-strategia critica."},
  {"type":"heading","level":3,"text":"Strategia di rivelazione"},
  {"type":"list","items":[
    "**Apertura forte**: rivela subito la combo migliore per metterli sotto pressione",
    "**Apertura difensiva**: rivela una combo neutrale (Balance) per non rivelare il piano",
    "**Counter-pick**: aspetta che lui riveli, poi scegli la counter dal tuo deck"
  ]},
  {"type":"tip","variant":"warning","text":"Una volta che una combo gioca, **non può tornare nello stesso match**. Quindi se rivela il tuo Attack contro la sua Stamina e perdi, hai perso anche la tua arma migliore contro Stamina nei round successivi."},
  {"type":"heading","level":2,"text":"Esempi di deck competitivi"},
  {"type":"two_column","left":[
    {"type":"heading","level":3,"text":"Deck Meta Standard"},
    {"type":"list","items":[
      "**Cobalt Drake 3-60 Gear Flat** (Attack)",
      "**Wizard Rod 5-70 Hexa** (Stamina)",
      "**Hells Scythe 4-60 Taper** (Balance)"
    ]},
    {"type":"paragraph","text":"Il deck più sicuro: copertura completa, parti tutte top-tier, nessuna debolezza grave."}
  ],"right":[
    {"type":"heading","level":3,"text":"Deck Aggressive"},
    {"type":"list","items":[
      "**Bear Scratch 1-60 Rush** (Attack)",
      "**Cobalt Dragoon 3-60 Flat** (Attack)",
      "**Phoenix Wing 4-70 Disk Ball** (Stamina backup)"
    ]},
    {"type":"paragraph","text":"Pressione massima. Vince spesso prima di arrivare al terzo match."}
  ]},
  {"type":"heading","level":2,"text":"Errori comuni nel deck building"},
  {"type":"list","items":[
    "**Tutti dello stesso archetipo**: garantisce sconfitta contro il counter",
    "**Tutte combo S-tier ma senza coerenza**: 3 Stamina top tier perdono contro 1 Attack medio",
    "**Mancanza di Attack**: senza Attack, non puoi gestire Stamina pesanti",
    "**Rivelare la combo migliore subito**: regala il tempo all''avversario di prepararsi",
    "**Ignorare i pocket pick**: a livello competitivo, le sorprese vincono"
  ]},
  {"type":"inline_quiz","question":"Stai costruendo un deck e hai già scelto 2 Stamina top-tier. Quale dovrebbe essere la terza combo?","options":["Un''altra Stamina","Un Attack potente","Un Defense","Una Balance generica"],"correctIndex":1,"explanation":"Un Attack potente come terza combo copre il matchup più pericoloso (avversari con anti-stamina). Tre Stamina creano una debolezza fatale contro un singolo Attack."}
]',
'{"questions":[
  {"question":"Nel deck 3v3, una stessa parte può comparire in più combo?","options":["Sì, sempre","No, mai","No, eccetto i Lock Chip CX","Solo se ha colore diverso"],"correctIndex":2,"explanation":"Una stessa parte non può comparire in 2 combo dello stesso deck. L''unica eccezione sono i Lock Chip della linea CX."},
  {"question":"Qual è il principio chiave del deck building?","options":["Usare solo combo S-tier","Coprire diversi matchup con sinergia","Massimizzare l''aggressività","Copiare i deck dei top player"],"correctIndex":1,"explanation":"Il deck building riguarda la copertura dei matchup possibili e la sinergia tra le 3 combo, non la pura potenza individuale."},
  {"question":"Cosa succede se rivela la tua combo migliore nel primo match e perdi?","options":["Niente, posso riusarla","La perdo per il resto del match","La sostituisco con un''altra","Posso ripeterla solo se l''avversario perde"],"correctIndex":1,"explanation":"Una volta che una combo gioca, non può tornare nello stesso match. Per questo l''ordine di rivelazione è strategico."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 18: Reading the Opponent
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('reading-opponent', 'advanced', 'Leggere l''Avversario', 'Il gioco mentale del Beyblade', 8, 50, 6,
'[
  {"type":"paragraph","text":"A livello competitivo, vincere non dipende solo dalla tua combo o dalla tua tecnica di lancio. Saper **leggere l''avversario** — interpretare le sue scelte, anticipare le sue mosse, riconoscere il suo stile — è quello che separa i veri pro dai giocatori medi."},
  {"type":"heading","level":2,"text":"Cosa osservare prima del match"},
  {"type":"heading","level":3,"text":"La sua combo"},
  {"type":"paragraph","text":"Prima del lancio, l''avversario rivela la sua Beyblade. Cosa puoi capire in pochi secondi?"},
  {"type":"list","items":[
    "**Archetipo**: dal Bit (Flat = Attack, Ball = Stamina, Needle = Defense, Taper = Balance)",
    "**Altezza**: dal Ratchet (60mm = aggressivo basso, 80mm = alto stabile)",
    "**Burst resistance**: dai lati del Ratchet (3-5 = medio, 9 = altissimo)",
    "**Direzione**: dalla forma dei contatti del Blade — verifica se è left-spin"
  ]},
  {"type":"tip","variant":"info","text":"Memorizzare i Bit principali è il modo più veloce per identificare un archetipo a colpo d''occhio. Con la pratica, riconoscerai 90% delle combo in 2 secondi."},
  {"type":"heading","level":3,"text":"Il suo launcher e tecnica"},
  {"type":"paragraph","text":"Osserva come tiene il launcher prima del countdown:"},
  {"type":"list","items":[
    "**Launcher perpendicolare**: lancio neutro — sta giocando passivo",
    "**Launcher inclinato**: Bank Shot in arrivo — aspettati Attack aggressivo",
    "**Postura particolare**: braccio sinistro piegato → Sliding Shoot",
    "**Posizione del corpo**: spostato lateralmente per angolare il lancio?"
  ]},
  {"type":"heading","level":2,"text":"Durante la battaglia"},
  {"type":"heading","level":3,"text":"Pattern di movimento"},
  {"type":"paragraph","text":"Il movimento della Beyblade rivela molto:"},
  {"type":"list","items":[
    "**Flower pattern preciso**: avversario ha tecnica solida — preparati a KO veloci",
    "**Movimento erratico**: tecnica imperfetta — può auto-KO se aspetti",
    "**Stallo al centro**: Stamina stabilita — devi forzare il contatto",
    "**Va dritto verso il bordo**: errore di lancio — sfruttalo"
  ]},
  {"type":"heading","level":3,"text":"Reazioni dell''avversario"},
  {"type":"paragraph","text":"Osserva la sua reazione ai colpi tuoi:"},
  {"type":"list","items":[
    "**Sorride / Annuisce**: si aspettava il colpo — ha letto bene la tua mossa",
    "**Appare frustrato**: il suo piano sta fallendo — premi l''attacco",
    "**Rilassato anche se perde**: ha un piano B — preparati a sorprese"
  ]},
  {"type":"heading","level":2,"text":"Mind games e meta-game"},
  {"type":"heading","level":3,"text":"Il bluff dell''ordine di rivelazione"},
  {"type":"paragraph","text":"Nel 3v3, l''ordine in cui riveli le tue combo trasmette informazioni. Top player giocano con questo:"},
  {"type":"list","items":[
    "**Aprire con il pocket pick**: confonde l''avversario, lo spinge a tirare fuori la sua combo migliore quando non serve",
    "**Aprire con la combo standard**: gioca un meta-game prevedibile per nascondere il pocket",
    "**Tenere il top tier per ultimo**: l''avversario potrebbe non avere più contromisure"
  ]},
  {"type":"heading","level":3,"text":"Il principio di Sherlock"},
  {"type":"paragraph","text":"Top player ragionano per **eliminazione**. Se il tuo avversario è in un bracket dove ha già giocato 2 partite, hai informazioni preziose:"},
  {"type":"list","items":[
    "Quali combo ha mostrato",
    "Come ha lanciato",
    "Cosa ha funzionato/non funzionato",
    "Probabili scelte rimaste nel suo deck"
  ]},
  {"type":"tip","variant":"success","text":"Nel 3v3, ricorda: se l''avversario ha già rivelato 2 combo nei precedenti round, puoi predire la terza con ragionevole accuratezza basandoti su cosa NON ha ancora rivelato."},
  {"type":"heading","level":2,"text":"Tipi di giocatori da riconoscere"},
  {"type":"two_column","left":[
    {"type":"heading","level":3,"text":"Il Meta Slave"},
    {"type":"paragraph","text":"Usa solo combo S-tier copiate da Internet."},
    {"type":"list","items":[
      "**Punto forte**: parti potenti",
      "**Debolezza**: prevedibile",
      "**Contromossa**: pocket pick anti-meta"
    ]}
  ],"right":[
    {"type":"heading","level":3,"text":"L''Innovatore"},
    {"type":"paragraph","text":"Sperimenta combo non-standard."},
    {"type":"list","items":[
      "**Punto forte**: imprevedibile",
      "**Debolezza**: non sempre ottimizzato",
      "**Contromossa**: gioca solido, non azzardare"
    ]}
  ]},
  {"type":"two_column","left":[
    {"type":"heading","level":3,"text":"Il Tecnico"},
    {"type":"paragraph","text":"Padroneggia tecniche di lancio difficili."},
    {"type":"list","items":[
      "**Punto forte**: massima esecuzione",
      "**Debolezza**: rigido nei piani",
      "**Contromossa**: rompi il suo timing"
    ]}
  ],"right":[
    {"type":"heading","level":3,"text":"Il Wildcard"},
    {"type":"paragraph","text":"Gioca emotivamente, varia stile spesso."},
    {"type":"list","items":[
      "**Punto forte**: imprevedibile",
      "**Debolezza**: poca consistency",
      "**Contromossa**: gioca paziente"
    ]}
  ]},
  {"type":"heading","level":2,"text":"Tecniche di mind game"},
  {"type":"heading","level":3,"text":"Distrazione"},
  {"type":"paragraph","text":"Conversazione casuale prima del lancio può rompere la concentrazione dell''avversario. Pro player la usano in modo etico — niente trash talk, ma small talk distrattivo."},
  {"type":"heading","level":3,"text":"Falsi tell"},
  {"type":"paragraph","text":"Mostrare segnali finti per ingannare l''avversario. Esempio: tenere il launcher inclinato come per Bank Shot, ma poi all''ultimo raddrizzarlo."},
  {"type":"tip","variant":"warning","text":"I mind games sono permessi, ma il **trash talk e l''intimidazione sono violazioni del codice di condotta WBO** e Takara Tomy. Possono portare alla squalifica. Gioca duro, ma con rispetto."},
  {"type":"heading","level":2,"text":"Etica e sportsmanship"},
  {"type":"paragraph","text":"Il vero top player rispetta sempre l''avversario, indipendentemente dal livello:"},
  {"type":"list","items":[
    "**Stretta di mano** prima e dopo il match",
    "**Niente lamentele** sui risultati arbitrali",
    "**Niente celebrazioni eccessive** dopo una vittoria",
    "**Rispetta il tempo**: non stallare, non perdere tempo intenzionalmente",
    "**Ammetti gli errori** dell''avversario solo se richiesti dal giudice"
  ]},
  {"type":"inline_quiz","question":"L''avversario tiene il launcher inclinato e ha le braccia in posizione di Sliding Shoot. Cosa fai?","options":["Anch''io faccio Sliding Shoot","Mi preparo a un attacco aggressivo, lancio neutro per stabilità","Lancio prima del countdown","Cambio Beyblade"],"correctIndex":1,"explanation":"Riconoscendo lo Sliding Shoot dell''avversario, sai che arriva un attacco aggressivo. Un lancio neutro stabile ti permette di assorbire il primo impatto e contrattaccare. Cambiare Beyblade durante un match è proibito."}
]',
'{"questions":[
  {"question":"Come puoi capire l''archetipo dell''avversario al volo?","options":["Dal colore del Beyblade","Dal Bit","Dal nome del giocatore","Dal launcher"],"correctIndex":1,"explanation":"Il Bit è il modo più veloce per identificare l''archetipo. Flat = Attack, Ball = Stamina, Needle = Defense, Taper = Balance."},
  {"question":"Cosa indica un launcher inclinato in posizione di lancio?","options":["Errore","Attack imminente con Bank Shot","Stamina conservativa","Defense reattiva"],"correctIndex":1,"explanation":"Un launcher inclinato è il segnale di Bank Shot o Sliding Shoot — preparazione a un attacco aggressivo tipico delle combo Attack."},
  {"question":"I mind games etici includono...","options":["Trash talk","Intimidazione fisica","Conversazione distrattiva e falsi tell","Sabotaggio del Beyblade avversario"],"correctIndex":2,"explanation":"Mind games etici come distrazione conversazionale e falsi tell sono permessi. Trash talk e intimidazione possono portare alla squalifica."}
]}'
) ON CONFLICT (id) DO NOTHING;


