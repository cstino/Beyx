-- ════════════════════════════════════════════════════════════════
-- PRO LEVEL — 6 lessons on champion-level play
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────
-- Lesson 19: Parts Maintenance
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('parts-maintenance', 'pro', 'Manutenzione delle Parti', 'Tieni le tue parti in condizioni da torneo', 8, 55, 1,
'[
  {"type":"paragraph","text":"Una Beyblade in cattive condizioni perde performance, anche se sulla carta è S-tier. I pro player trattano le proprie parti come strumenti professionali: pulite, controllate, sostituite quando serve. Una parte ben mantenuta vale più di una nuova mai pulita."},
  {"type":"heading","level":2,"text":"La routine post-battaglia"},
  {"type":"paragraph","text":"Dopo ogni sessione (allenamento o torneo), dedica 5 minuti alla manutenzione di base:"},
  {"type":"list","ordered":true,"items":[
    "**Smonta la combo** in Blade, Ratchet e Bit",
    "**Ispeziona ogni parte** sotto luce diretta cercando danni o detriti",
    "**Pulisci ogni pezzo** con un panno in microfibra asciutto",
    "**Controlla le filettature** e i punti di aggancio per residui",
    "**Riassembla con cura** verificando che ogni click sia completo"
  ]},
  {"type":"tip","variant":"info","text":"La microfibra è il materiale ideale per la pulizia: non rilascia fibre, non graffia il metallo, ed è efficace anche solo a secco."},
  {"type":"heading","level":2,"text":"Pulizia approfondita (mensile)"},
  {"type":"paragraph","text":"Una volta al mese, dedica un''ora alla pulizia profonda. Per le parti molto sporche:"},
  {"type":"list","items":[
    "**Acqua tiepida + sapone neutro**: per Blade e Ratchet (non Bit con gomma!) — risciacqua bene e asciuga",
    "**Cotton fioc**: per gli interstizi e le filettature dove il panno non arriva",
    "**Spazzolino morbido**: per i denti dei Ratchet e i Bit Gear",
    "**Aria compressa**: per rimuovere detriti dai punti più nascosti"
  ]},
  {"type":"tip","variant":"warning","text":"NON usare mai detergenti chimici aggressivi (acetone, alcol denaturato puro, candeggina). Possono corrodere le finiture metalliche e degradare la plastica. Sapone neutro per piatti diluito è il massimo che dovresti usare."},
  {"type":"heading","level":2,"text":"Cosa controllare in ogni parte"},
  {"type":"heading","level":3,"text":"Blade"},
  {"type":"list","items":[
    "**Bordi metallici**: cerca dent (ammaccature), chip (scheggiature), graffi profondi",
    "**Gear Chip**: deve girare libero, non incastrato",
    "**Filettatura interna**: pulita, senza filamenti di plastica deformati",
    "**Peso**: pesa periodicamente con bilancia di precisione (errori di peso > 0,5g indicano usura significativa)"
  ]},
  {"type":"heading","level":3,"text":"Ratchet"},
  {"type":"list","items":[
    "**Denti dei lati**: devono essere netti, non arrotondati. Denti smussati = burst rate alto",
    "**Filettatura**: i punti di aggancio al Blade devono essere intatti",
    "**Sfregamenti laterali**: assenza di crepe o linee di stress sui muri laterali",
    "**Smaltimento**: se il Ratchet ha un peso visibilmente diverso dall''originale, è troppo usurato"
  ]},
  {"type":"heading","level":3,"text":"Bit"},
  {"type":"list","items":[
    "**Punto di contatto**: è la parte che si usura più velocemente",
    "**Sfere**: Ball, Disk Ball, Free Ball — devono restare PERFETTAMENTE sferiche. Una sfera appiattita perde stamina drasticamente",
    "**Punte**: Needle, Spike, Point — devono restare appuntite. Una punta arrotondata perde stabilità",
    "**Superfici piatte**: Flat, Low Flat — non devono lucidarsi (la lucentezza indica usura del materiale)",
    "**Denti Gear**: i denti dei Bit Gear devono essere netti"
  ]},
  {"type":"heading","level":2,"text":"Lubrificazione"},
  {"type":"paragraph","text":"Argomento controverso. La regola generale: **non serve a meno che non sia espressamente necessaria**."},
  {"type":"list","items":[
    "**Tra Ratchet e Bit**: una microgoccia di lubrificante per plastica può migliorare la rotazione (uso opzionale)",
    "**Mai sui Bit di gomma**: la gomma deve avere alto attrito, lubrificarla la rovina",
    "**Mai sui contatti del Blade**: il contatto deve essere ''sporco'' di attrito controllato",
    "**Solo lubrificanti specifici per giocattoli plastica/metallo** (PTFE-based o silicon spray)"
  ]},
  {"type":"tip","variant":"warning","text":"Molti giocatori esperti consigliano di NON lubrificare. Il rischio di errore (lubrificare la parte sbagliata, usare il prodotto sbagliato) supera spesso il beneficio. Se sei in dubbio, lascia le parti naturali."},
  {"type":"heading","level":2,"text":"Storage corretto"},
  {"type":"paragraph","text":"Come tieni le tue parti tra una sessione e l''altra impatta direttamente sulla loro durata."},
  {"type":"list","items":[
    "**Custodia compartimentata**: ogni parte separata, niente metalli che strofinano contro plastica",
    "**Ambiente secco**: l''umidità danneggia il metallo (ossidazione) e degrada la gomma",
    "**Lontano dalla luce solare diretta**: i raggi UV scoloriscono le decalcomanie e indeboliscono la plastica",
    "**Temperatura stabile**: estremi caldo/freddo causano stress termico ai materiali",
    "**Smonta dopo l''uso**: lasciare assemblato per mesi può deformare i punti di aggancio"
  ]},
  {"type":"heading","level":2,"text":"Tracciare l''uso"},
  {"type":"paragraph","text":"I pro player tengono un **battle log**: una lista di quali parti hanno usato in quante battaglie. Questo aiuta a:"},
  {"type":"list","items":[
    "**Predire l''usura** prima che diventi problematica",
    "**Ruotare le parti** distribuendo il consumo",
    "**Identificare pattern** di perdita di performance",
    "**Decidere quando rinnovare** un componente"
  ]},
  {"type":"tip","variant":"success","text":"L''app BeyManager X ha proprio questa funzione: traccia le tue battaglie con quale combo, e ti dà un''idea oggettiva dell''uso accumulato di ogni parte."},
  {"type":"inline_quiz","question":"Il tuo Bit Ball perfettamente sferico inizia a sembrare leggermente appiattito sulla punta. Cosa fai?","options":["Continui a usarlo, non è grave","Lo sostituisci con uno nuovo identico","Lo cerchi di rimodellare con la lima","Lo smonti e lo conservi come pezzo da collezione"],"correctIndex":1,"explanation":"Una sfera appiattita perde drasticamente stamina. La sostituzione è l''unica opzione — i pro player tengono spesso 2-3 copie dei Bit più usati per questo motivo. Non lo si modifica mai (le modifiche sono illegali nei tornei)."}
]',
'{"questions":[
  {"question":"Qual è il materiale ideale per pulire le parti dopo ogni sessione?","options":["Carta vetrata","Microfibra","Tovagliolo di carta","Stoffa ruvida"],"correctIndex":1,"explanation":"La microfibra non graffia, non rilascia fibre, ed è efficace anche solo a secco — il materiale di scelta per pulire le parti."},
  {"question":"Cosa NON dovresti MAI lubrificare?","options":["Il Ratchet","Il Blade","I Bit di gomma","Il launcher"],"correctIndex":2,"explanation":"I Bit di gomma devono avere alto attrito per funzionare. Lubrificarli ne distrugge le proprietà e li rende inutili."},
  {"question":"Come tenere le parti tra una sessione e l''altra?","options":["Sempre assemblate","In custodia compartimentata, smontate","Sciolte in un cassetto","In acqua per pulirle"],"correctIndex":1,"explanation":"Custodia compartimentata + parti smontate = no metallo contro plastica, no stress sui punti di aggancio, longevità massima."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 20: Wear and Replacement
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('wear-and-replacement', 'pro', 'Usura e Sostituzione', 'Quando dire addio a una parte', 8, 55, 2,
'[
  {"type":"paragraph","text":"Ogni parte di Beyblade X ha una **vita utile** misurabile. Sapere quando una parte ha esaurito il suo potenziale è una skill cruciale: continuare a usare parti usurate ti farà perdere tornei evitabili."},
  {"type":"heading","level":2,"text":"Vita utile media per categoria"},
  {"type":"paragraph","text":"Queste sono stime generali — il consumo varia molto in base a stile di gioco e qualità della manutenzione:"},
  {"type":"list","items":[
    "**Blade**: 100-200+ battaglie prima di mostrare degradazione significativa",
    "**Ratchet**: 80-150 battaglie. I lati si arrotondano gradualmente",
    "**Bit Standard (Flat, Taper)**: 50-100 battaglie",
    "**Bit Gear**: 40-80 battaglie. I denti si consumano velocemente con i dash",
    "**Bit Ball/Sferici**: 25-50 battaglie. La sfera si appiattisce visibilmente",
    "**Bit Rubber**: 30-60 battaglie. La gomma indurisce e perde grip"
  ]},
  {"type":"tip","variant":"info","text":"Top player tendono ad avere multiple copie dei Bit più usati e li ruotano per distribuire l''usura. Non è raro avere 3-4 copie dello stesso Hexa o Ball nei loro arsenali."},
  {"type":"heading","level":2,"text":"Segnali di usura per parte"},
  {"type":"heading","level":3,"text":"Blade — Quando sostituire"},
  {"type":"list","items":[
    "**Dent profonde** sul bordo metallico — riducono il momento di inerzia",
    "**Chip** dove dovrebbe esserci il punto di contatto principale — l''energia si disperde anziché trasferirsi",
    "**Gear Chip che gira male** o si blocca",
    "**Peso ridotto di > 0,5g** rispetto all''originale (segnale di danno strutturale)",
    "**Sbilanciamento visibile** quando ruoti il Blade in mano — non gira liscio"
  ]},
  {"type":"heading","level":3,"text":"Ratchet — Quando sostituire"},
  {"type":"list","items":[
    "**Denti dei lati arrotondati** — burst rate aumentato significativamente",
    "**Crepe visibili** sotto luce, soprattutto sulla parte centrale",
    "**Gioco eccessivo** quando il Blade è agganciato — non si sente più il ''click'' netto",
    "**Filettatura sfilacciata** o danneggiata"
  ]},
  {"type":"heading","level":3,"text":"Bit — Quando sostituire (la categoria più critica)"},
  {"type":"list","items":[
    "**Bit sferici**: la sfera appare ''ovale'' o ha un punto piatto",
    "**Bit appuntiti**: la punta è ora arrotondata o ha un piccolo cratere",
    "**Bit piatti**: la superficie è lucida (era opaca quando nuova)",
    "**Bit Gear**: i denti sono evidentemente più piccoli o smussati",
    "**Bit Rubber**: la gomma è indurita, lucida, o crepata"
  ]},
  {"type":"tip","variant":"warning","text":"I Bit Ball degradano più velocemente di quanto immaginiamo. Dopo solo 25 battaglie intense, una Ball può passare da S-tier a A-tier solo per usura. È la principale causa di self-KO nei tornei."},
  {"type":"heading","level":2,"text":"Test pratici per misurare l''usura"},
  {"type":"heading","level":3,"text":"Spin Test (Stamina)"},
  {"type":"paragraph","text":"Lancia il Beyblade in stadio vuoto con forza standardizzata. Cronometra il tempo di rotazione fino allo stop completo."},
  {"type":"list","items":[
    "**Prima volta** (parte nuova): registra il tempo come baseline (es. 90 secondi)",
    "**Test periodico**: ripeti ogni 25 battaglie",
    "**Soglia di sostituzione**: quando la stamina cala del 25% rispetto al baseline (es. 67 secondi)"
  ]},
  {"type":"heading","level":3,"text":"Wobble Test (Stabilità)"},
  {"type":"paragraph","text":"Lancia con forza minima e osserva il pattern di rotazione:"},
  {"type":"list","items":[
    "**Beyblade nuovo**: ruota in cerchio perfetto, stabile",
    "**Beyblade leggermente usurato**: leggera oscillazione laterale",
    "**Beyblade molto usurato**: oscillazione marcata, ''wobble'' visibile",
    "**Beyblade da sostituire**: cade entro 30 secondi dal lancio"
  ]},
  {"type":"heading","level":3,"text":"Burst Test (Resistenza)"},
  {"type":"paragraph","text":"Per il Ratchet specificamente. Tenta delicatamente di smontare il Beyblade ruotando in senso opposto:"},
  {"type":"list","items":[
    "**Click netto**: Ratchet ancora in buone condizioni",
    "**Click morbido**: usura iniziale",
    "**Burst troppo facile**: sostituire immediatamente"
  ]},
  {"type":"heading","level":2,"text":"Strategia di rotazione"},
  {"type":"paragraph","text":"I pro player non usano sempre la stessa parte — la **ruotano** strategicamente:"},
  {"type":"list","items":[
    "**Parti A**: per allenamento — quelle più usurate ma ancora utilizzabili",
    "**Parti B**: per tornei locali e piccoli eventi",
    "**Parti C** (mint condition): per i grandi tornei dove ogni dettaglio conta"
  ]},
  {"type":"tip","variant":"success","text":"La regola del ''Tournament Set'': i pro hanno un set di parti completamente nuove o quasi che usano SOLO per i tornei major. Questo set non vede mai allenamenti casual."},
  {"type":"heading","level":2,"text":"Quando NON sostituire"},
  {"type":"paragraph","text":"A volte un piccolo difetto cosmetico non significa fine vita:"},
  {"type":"list","items":[
    "**Graffi superficiali sul Blade**: estetici, performance non impattata",
    "**Decalcomanie sbiadite**: zero impatto sul gioco",
    "**Piccolo gioco al click**: se la stamina è ancora alta, può ancora andare",
    "**Lievi segni di battaglia**: aggiungono ''carattere'' senza compromettere"
  ]},
  {"type":"inline_quiz","question":"Il tuo Bit Ball ha perso il 30% della stamina nel test rispetto a quando era nuovo. Cosa indica?","options":["È normale dopo qualche mese","È pronto per la sostituzione","Devi solo lavarlo","Devi lubrificarlo"],"correctIndex":1,"explanation":"Una perdita > 25% nel spin test indica usura significativa. Continuarlo a usare in tornei competitivi è un rischio: le tue stamina battle saranno tutte in svantaggio dal lancio."}
]',
'{"questions":[
  {"question":"Qual è la categoria di parti che si usura più velocemente?","options":["Blade","Ratchet","Bit","Tutti uguali"],"correctIndex":2,"explanation":"I Bit sono i più piccoli e quelli più a contatto con lo stadio — si usurano molto più velocemente di Blade e Ratchet."},
  {"question":"Il Bit Ball mostra una piccola area piatta sulla sfera. Cosa indica?","options":["È una caratteristica del modello","Usura significativa, da sostituire","Va bene così","Va riscaldato"],"correctIndex":1,"explanation":"Una sfera appiattita perde drasticamente stamina. È il segnale classico di sostituzione per i Bit Ball."},
  {"question":"Cos''è il ''Tournament Set''?","options":["Un set di parti vendute insieme","Un set di parti riservate solo ai grandi tornei","Una collana per il Beyblade","Il prezzo di iscrizione"],"correctIndex":1,"explanation":"I pro player hanno un set di parti in mint condition usate SOLO per i tornei major, mai in allenamento, per garantire performance massima."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 21: Micro-Optimizations
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('micro-optimizations', 'pro', 'Micro-Ottimizzazioni', 'I dettagli che separano i top dagli altri', 9, 55, 3,
'[
  {"type":"paragraph","text":"A livello pro, la differenza tra vincere e perdere si misura in dettagli minuscoli. Quando affronti un altro top player con build simile, sono le **micro-ottimizzazioni** che decidono il match. Sono piccole cose, ma sommate fanno una differenza enorme."},
  {"type":"heading","level":2,"text":"Bilanciamento delle parti"},
  {"type":"paragraph","text":"Due parti dello stesso modello possono essere leggermente diverse a causa delle tolleranze di produzione. Top player **selezionano** la versione migliore quando ne hanno multiple:"},
  {"type":"list","items":[
    "**Test peso**: con bilancia di precisione, identifica la copia più pesante (più stamina)",
    "**Test bilanciamento**: lancia entrambe e osserva quale ha meno wobble naturale",
    "**Test stamina**: 5 lanci ciascuna, calcola la media. La differenza può essere 5-10 secondi",
    "**Test consistency**: la copia più consistente è preferibile alla più potente ma instabile"
  ]},
  {"type":"tip","variant":"info","text":"Esistono strumenti di bilanciamento dedicati al Beyblade X (es. ''Diagnostic Tuning Tool'') che identificano differenze sottili tra parti identiche. Sono usati dai top player per selezionare l''ottimale."},
  {"type":"heading","level":2,"text":"Click consistency"},
  {"type":"paragraph","text":"Quando assembli Blade + Ratchet + Bit, devi sentire un **click netto** ad ogni connessione. Un click ''morbido'' indica:"},
  {"type":"list","items":[
    "**Aggancio non completo**: rischio burst aumentato",
    "**Filettatura usurata**: preludio di rottura",
    "**Polvere o detriti**: pulizia necessaria",
    "**Tolleranza imperfetta**: alcune copie sono nate ''male'' di fabbrica"
  ]},
  {"type":"tip","variant":"warning","text":"Sentire ''mezzo click'' è il singolo errore di assemblaggio più frequente. Sempre, sempre, sempre verifica un click completo prima di lanciare in torneo."},
  {"type":"heading","level":2,"text":"Direzione di assemblaggio"},
  {"type":"paragraph","text":"Sembra banale, ma alcuni Blade e Ratchet possono essere agganciati in **posizioni leggermente diverse** (rotazioni dell''aggancio):"},
  {"type":"list","items":[
    "**Allineamento dei loghi/decalcomanie**: per riproducibilità — sempre la stessa posizione di partenza",
    "**Orientamento dei contatti del Blade**: piccole variazioni di angolo possono influenzare il pattern di impatto",
    "**Posizione dei lati del Ratchet**: alcune build hanno ''sweet spot'' di posizionamento"
  ]},
  {"type":"heading","level":2,"text":"Standardizzare il proprio lancio"},
  {"type":"paragraph","text":"La consistenza del lancio è una skill ottimizzabile. Un pro player lancia in modo IDENTICO ogni volta:"},
  {"type":"list","items":[
    "**Stessa posizione del corpo**: piedi, gomito, postura",
    "**Stessa velocità di tiro**: mira a una velocità ''sweet spot'' invece che ''massima''",
    "**Stessa altezza del launcher**: 5cm sopra l''area di lancio è lo standard",
    "**Stesso momento del countdown**: lancia esattamente al ''SHOOT'' ogni volta",
    "**Stessa modalità respirazione**: trattieni il respiro mentre lanci"
  ]},
  {"type":"tip","variant":"success","text":"Filma i tuoi lanci dall''alto. Sarai sorpreso di quanto varino in posizionamento e velocità. La consistenza è la differenza tra ''vinco a volte'' e ''vinco sempre''."},
  {"type":"heading","level":2,"text":"Ottimizzazioni del launcher"},
  {"type":"paragraph","text":"Il launcher stesso può essere ottimizzato (entro le regole):"},
  {"type":"list","items":[
    "**Pulisci i meccanismi interni**: detriti dentro il launcher rallentano il tiro",
    "**Verifica le tolleranze**: alcuni launcher producono RPM più alti di altri",
    "**Multipli launcher**: testa diversi launcher dello stesso modello per identificare il migliore",
    "**Winder ottimale**: i winder si usurano. Un winder vecchio produce lanci meno potenti"
  ]},
  {"type":"tip","variant":"warning","text":"Modificare fisicamente il launcher (lubrificarlo internamente, alterarne i meccanismi) è proibito dal regolamento ufficiale. Solo pulizia e selezione tra unità sono permesse."},
  {"type":"heading","level":2,"text":"Conoscere il proprio stadio"},
  {"type":"paragraph","text":"Anche se gli stadi ufficiali sono standardizzati, ogni stadio ha **piccole imperfezioni**:"},
  {"type":"list","items":[
    "**Pendenza della Xtreme Line**: leggermente diversa tra stadi diversi",
    "**Punti del campo**: alcuni stadi hanno micro-graffi o detriti che creano ''zone morte''",
    "**Posizione delle Over Zone**: lievi variazioni di profondità",
    "**Conoscere lo stadio del torneo**: arriva in anticipo, fai 2-3 lanci di prova per capirne le caratteristiche"
  ]},
  {"type":"heading","level":2,"text":"L''importanza di una scheda combo"},
  {"type":"paragraph","text":"I pro player tengono **schede dettagliate** delle proprie combo:"},
  {"type":"list","items":[
    "**Quale variante di parte usare** (se hanno multiple copie)",
    "**Posizione di assemblaggio ottimale**",
    "**Tipo di lancio preferito** per quella combo specifica",
    "**Matchup migliori e peggiori**",
    "**Note su comportamenti specifici**"
  ]},
  {"type":"tip","variant":"info","text":"L''app BeyManager X ha un sistema di salvataggio combo che ti permette di tenere queste informazioni in modo organizzato. Usalo!"},
  {"type":"heading","level":2,"text":"Le 5 micro-ottimizzazioni più importanti"},
  {"type":"list","ordered":true,"items":[
    "**Selezione della parte ottimale** quando ne hai multiple copie",
    "**Click verifica** prima di ogni lancio",
    "**Lancio standardizzato** sempre uguale a se stesso",
    "**Pulizia immediata** dopo ogni sessione (mai accumulare)",
    "**Conoscenza dello stadio** del torneo specifico"
  ]},
  {"type":"inline_quiz","question":"Hai 3 copie dello stesso Blade Wizard Rod. Come scegli quale portare al torneo?","options":["Quella più nuova","Quella più pesante","Quella che ha la migliore consistency nei test","Quella con i colori più belli"],"correctIndex":2,"explanation":"La consistency (consistenza nei test ripetuti) è più importante della pura potenza o novità. Una parte ''leggermente meno potente ma più consistente'' vince più match di una potente ma instabile."}
]',
'{"questions":[
  {"question":"Cosa significa ''click netto'' nell''assemblaggio?","options":["Un suono casuale","L''aggancio completo tra due parti","Un errore di fabbrica","Un colpo durante la battaglia"],"correctIndex":1,"explanation":"Il click netto è il segnale che l''aggancio tra due parti è completo. Un click ''morbido'' o ''mezzo click'' indica un aggancio imperfetto e rischio burst."},
  {"question":"Modificare fisicamente il launcher è...","options":["Permesso","Permesso solo nei tornei amatoriali","Proibito dal regolamento ufficiale","Obbligatorio"],"correctIndex":2,"explanation":"Modificare il launcher è proibito dal regolamento ufficiale Takara Tomy/Hasbro. Solo pulizia e selezione tra unità identiche sono permesse."},
  {"question":"Tra due copie identiche dello stesso Blade, quale preferire?","options":["La più recente","La più consistente nei test","La più colorata","La più leggera"],"correctIndex":1,"explanation":"La consistency batte la pura potenza. Una parte che performa in modo prevedibile è più affidabile in torneo di una potente ma irregolare."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 22: Mind Games
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('mind-games', 'pro', 'Mind Games e Psicologia', 'Vincere prima ancora di lanciare', 8, 55, 4,
'[
  {"type":"paragraph","text":"A livello pro, l''aspetto **mentale** del Beyblade è grande quanto quello tecnico. Un giocatore mentalmente forte con una build B-tier può battere un giocatore mentalmente fragile con una build S-tier. Questa lezione esplora la psicologia del gioco competitivo."},
  {"type":"heading","level":2,"text":"La pressione del torneo"},
  {"type":"paragraph","text":"In allenamento, sei rilassato. Lanci 100 volte e perfeziona la tua tecnica. In torneo, è completamente diverso:"},
  {"type":"list","items":[
    "**Ogni lancio conta**: non c''è ''riprova''",
    "**Pubblico ti guarda**: aumenta lo stress",
    "**Tempo limitato**: non puoi prendere infinite pause",
    "**Avversario sconosciuto**: imprevedibilità",
    "**Stakes alti**: trofei, ranking, reputazione"
  ]},
  {"type":"tip","variant":"info","text":"Il fenomeno del ''choking sotto pressione'' è studiato negli sport competitivi: anche atleti professionisti perdono performance del 15-20% in situazioni ad alto stress."},
  {"type":"heading","level":2,"text":"Tecniche di gestione dello stress"},
  {"type":"heading","level":3,"text":"Respirazione"},
  {"type":"paragraph","text":"Il primo strumento contro lo stress è la respirazione controllata:"},
  {"type":"list","items":[
    "**4-7-8**: inspira 4 secondi, trattieni 7, espira 8 — calma il sistema nervoso",
    "**Box breathing**: 4-4-4-4, usato dai Navy SEAL prima delle missioni",
    "**Respirazione diaframmatica**: pancia che si espande, non petto"
  ]},
  {"type":"heading","level":3,"text":"Routine pre-match"},
  {"type":"paragraph","text":"I pro hanno una **routine** che ripetono prima di ogni match. La routine ancora la mente in uno stato familiare:"},
  {"type":"list","ordered":true,"items":[
    "**Verifica le parti**: ispezione veloce",
    "**Test launcher**: due click di prova senza Beyblade",
    "**Respirazione**: 30 secondi di respirazione 4-7-8",
    "**Visualizzazione**: immagina mentalmente il lancio perfetto",
    "**Posizionamento**: assumi la postura standardizzata"
  ]},
  {"type":"tip","variant":"success","text":"Avere una routine **identica** prima di ogni match crea un ''ancoraggio'' psicologico. Il tuo cervello associa la routine alla performance di alto livello, e tu performi automaticamente meglio."},
  {"type":"heading","level":2,"text":"Mind games offensivi"},
  {"type":"paragraph","text":"Sono tecniche che, **all''interno delle regole**, mettono pressione psicologica sull''avversario."},
  {"type":"heading","level":3,"text":"Confidenza visibile"},
  {"type":"paragraph","text":"Il linguaggio del corpo è un''arma:"},
  {"type":"list","items":[
    "**Postura eretta** durante il setup, non curvo",
    "**Movimenti decisi**: assemblaggio veloce e sicuro",
    "**Niente esitazioni**: ogni gesto trasmette controllo",
    "**Sguardo diretto**: occasionalmente guarda l''avversario, mai sfuggente"
  ]},
  {"type":"heading","level":3,"text":"Setup psicologico"},
  {"type":"paragraph","text":"Piccoli gesti che destabilizzano l''avversario senza essere antisportivi:"},
  {"type":"list","items":[
    "**Mostrare la combo prima**: rivela la combo con sicurezza, come a dire ''non ho paura che tu la veda''",
    "**Conversazione casuale**: small talk amichevole rompe la concentrazione dell''avversario sui suoi piani",
    "**Routine lenta**: prendi il tuo tempo (legalmente) — destabilizza chi vuole giocare veloce",
    "**Routine veloce**: lancia prontissimo — destabilizza chi vuole pianificare"
  ]},
  {"type":"tip","variant":"warning","text":"Il limite tra ''mind game'' e ''antisportività'' è sottile. Trash talk, intimidazione fisica, distrazione deliberata e rumori intenzionali sono **vietati** dai regolamenti ufficiali e portano alla squalifica."},
  {"type":"heading","level":2,"text":"Mind games difensivi"},
  {"type":"paragraph","text":"Più importanti dei mind games offensivi: **come proteggere te stesso** dagli attacchi psicologici dell''avversario."},
  {"type":"heading","level":3,"text":"Tunnel vision"},
  {"type":"paragraph","text":"Il modo migliore per non farsi distrarre è **non prestare attenzione** all''avversario:"},
  {"type":"list","items":[
    "**Concentrati sul tuo Beyblade**, non sul suo",
    "**Ignora il pubblico**: mai guardare gli spettatori",
    "**Filtra il rumore**: cuffie tra match (se permesse)",
    "**Stai nella tua zona**: visualizza lo stadio come ''il tuo dojo'', non un''arena pubblica"
  ]},
  {"type":"heading","level":3,"text":"Reset mentale"},
  {"type":"paragraph","text":"Quando perdi un match, hai 30-60 secondi prima del prossimo. Usali per resettare:"},
  {"type":"list","items":[
    "**3 respiri profondi**: rompe il loop di stress fisico",
    "**Frase mantra**: una breve frase di reset (''focus su questo lancio'')",
    "**Cambio postura**: muoviti, scuoti le spalle, ripristina il corpo",
    "**Lascia andare il match precedente**: pensare alla sconfitta peggiora le successive"
  ]},
  {"type":"tip","variant":"success","text":"Il ''reset mentale'' tra match è probabilmente la skill mentale più importante in qualsiasi sport competitivo. Top player perdono singoli match come tutti, ma non lasciano che una sconfitta ne causi altre."},
  {"type":"heading","level":2,"text":"Affrontare il ''tilt''"},
  {"type":"paragraph","text":"Il **tilt** è uno stato di frustrazione che peggiora le performance. Come riconoscerlo e gestirlo:"},
  {"type":"list","items":[
    "**Segnali di tilt**: respirazione affrettata, mani tremolanti, decisioni impulsive, pensieri negativi ricorrenti",
    "**Gestione immediata**: respirazione + reset fisico (cammina 1 minuto se possibile)",
    "**Strategia**: cambia approccio (es. da Attack a Defense per ridurre il rischio)",
    "**Non rincorrere**: cerca il ''gioco minimo'' invece del ''lancio risolutivo''"
  ]},
  {"type":"heading","level":2,"text":"La forza del piano B"},
  {"type":"paragraph","text":"Mentalmente, sapere di avere **opzioni** ti rende più resistente. Avere un piano B (e C) per ogni situazione:"},
  {"type":"list","items":[
    "**Se la mia Attack non funziona**: passa a strategy difensiva",
    "**Se l''avversario controgioca bene**: cambia tipo di lancio",
    "**Se sono in svantaggio nel match**: punta al spin finish (1 pt) invece che KO rischioso",
    "**Se sono in tilt**: routine di reset mentale forzata"
  ]},
  {"type":"inline_quiz","question":"Stai perdendo 0-3 in un match a 4 punti. Che mindset adotti?","options":["Devo vincere a tutti i costi col prossimo KO","Tutto è perso, abbandono mentalmente","Concentrati sul prossimo singolo lancio, non sul match","Cerco di mettere pressione fisica all''avversario"],"correctIndex":2,"explanation":"Il mental reset più potente è restringere il focus sul lancio immediato, non sul risultato finale. ''Devo vincere'' aumenta la pressione e peggiora la performance. ''Solo questo lancio'' è gestibile."}
]',
'{"questions":[
  {"question":"Cos''è il ''tilt''?","options":["Un tipo di lancio","Uno stato di frustrazione che peggiora performance","Una mossa speciale","Un Beyblade inclinato"],"correctIndex":1,"explanation":"Il tilt è uno stato mentale di frustrazione (mutuato dal poker) che porta a decisioni impulsive e performance peggiori. Riconoscerlo e gestirlo è una skill cruciale."},
  {"question":"Qual è la skill mentale più importante tra match?","options":["Memorizzare ogni mossa","Reset mentale dopo una sconfitta","Distrarre l''avversario","Cambiare combo"],"correctIndex":1,"explanation":"Lasciar andare il match precedente è cruciale: top player perdono singoli match come tutti, ma non lasciano che una sconfitta ne causi altre."},
  {"question":"Trash talk e intimidazione sono...","options":["Permessi","Strategicamente intelligenti","Vietati e causano squalifica","Obbligatori in alto livello"],"correctIndex":2,"explanation":"Trash talk e intimidazione sono espressamente vietati dai regolamenti ufficiali Takara Tomy e WBO, e possono portare alla squalifica."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 23: Tournament Preparation
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('tournament-prep', 'pro', 'Preparazione al Torneo', 'Le settimane prima decidono il risultato', 10, 60, 5,
'[
  {"type":"paragraph","text":"Un torneo non si vince il giorno del torneo. Si vince nelle **settimane di preparazione**. La differenza tra un giocatore che vince i tornei e uno che ci prova ma perde sempre è di solito nel processo di preparazione, non nel talent puro."},
  {"type":"heading","level":2,"text":"Timeline di preparazione (mese prima)"},
  {"type":"heading","level":3,"text":"4 settimane prima"},
  {"type":"list","items":[
    "**Studia il regolamento**: che formato? Quanti punti? Numero di round?",
    "**Identifica il meta locale**: chi sono i top player attesi? Che combo usano?",
    "**Inventario completo**: hai tutte le parti che ti servono? Manca qualcosa?",
    "**Inizia testing combo**: hai 4 settimane per testare e iterare"
  ]},
  {"type":"heading","level":3,"text":"3 settimane prima"},
  {"type":"list","items":[
    "**Restringi a 5-6 combo candidate** che funzionano bene per te",
    "**Test contro vari archetipi**: prova ognuna contro Attack, Defense, Stamina, Balance",
    "**Identifica il ''main play''**: la combo più affidabile, quella su cui contare",
    "**Identifica i pocket pick**: counter specifici per matchup difficili"
  ]},
  {"type":"heading","level":3,"text":"2 settimane prima"},
  {"type":"list","items":[
    "**Scegli il deck definitivo** (per 3v3) o la combo principale (per 1v1)",
    "**Pratica intensiva**: 100+ lanci con la combo finale",
    "**Allenamento tecnica di lancio**: perfeziona il Bank Shot/Sliding Shoot specifico per la tua combo",
    "**Match simulati**: con amici, replica le condizioni del torneo"
  ]},
  {"type":"heading","level":3,"text":"1 settimana prima"},
  {"type":"list","items":[
    "**Manutenzione completa** delle parti",
    "**Backup**: porta 2-3 copie di ogni parte critica",
    "**Riposo strategico**: niente allenamenti pesanti gli ultimi 2 giorni",
    "**Visualizzazione**: immagina mentalmente vari scenari di match",
    "**Logistica**: prepara borsa, snack, identità, soldi"
  ]},
  {"type":"tip","variant":"info","text":"L''ultima settimana è più importante riposare che allenarsi. Si chiama ''taper'' negli sport: riduci l''intensità per arrivare freschi alla competizione."},
  {"type":"heading","level":2,"text":"Il giorno prima"},
  {"type":"list","items":[
    "**Niente nuove combo**: usa solo quelle che hai testato",
    "**Pulizia finale** delle parti",
    "**Verifica regolamento**: rileggi le regole specifiche del torneo",
    "**Vai a letto presto**: 8 ore di sonno sono cruciali per la performance",
    "**Pasto leggero la sera**: niente alcol, niente cibi pesanti"
  ]},
  {"type":"heading","level":2,"text":"Il mattino del torneo"},
  {"type":"list","ordered":true,"items":[
    "**Sveglia presto**: arriva sul posto con almeno 30 minuti di anticipo",
    "**Colazione bilanciata**: carboidrati complessi + proteine, niente zuccheri puri",
    "**Idratazione**: acqua, niente caffeina eccessiva",
    "**Riscaldamento mentale**: 10 minuti di visualizzazione",
    "**Riscaldamento fisico**: stretching delle braccia, mani, polso"
  ]},
  {"type":"tip","variant":"warning","text":"Mai sperimentare al mattino del torneo. Niente nuovi cibi, nuove abitudini, nuovi caffè. Usa solo cose che già funzionano per te."},
  {"type":"heading","level":2,"text":"Cosa portare"},
  {"type":"two_column","left":[
    {"type":"heading","level":3,"text":"Equipaggiamento"},
    {"type":"list","items":[
      "Combo principale + backup parti",
      "2 launcher (uno principale + spare)",
      "5+ winder",
      "Custodia parti compartimentata",
      "Panno microfibra",
      "Cotton fioc + spazzolino morbido"
    ]}
  ],"right":[
    {"type":"heading","level":3,"text":"Personali"},
    {"type":"list","items":[
      "Acqua (almeno 1L)",
      "Snack energetici (banana, barrette)",
      "Documento d''identità (se richiesto)",
      "Soldi per iscrizione + spese",
      "Carica-batterie telefono",
      "Asciugamano (per le mani sudate)"
    ]}
  ]},
  {"type":"heading","level":2,"text":"Durante il torneo"},
  {"type":"heading","level":3,"text":"Tra match"},
  {"type":"list","items":[
    "**Idratati**: piccoli sorsi tra ogni match",
    "**Snack rapidi**: una banana o barretta dopo 4-5 match",
    "**Reset mentale**: 30-60 secondi di respirazione",
    "**Verifica parti**: una rapida ispezione visiva tra round"
  ]},
  {"type":"heading","level":3,"text":"Tra fasi del torneo (es. dopo Swiss, prima di bracket)"},
  {"type":"list","items":[
    "**Pausa più lunga**: 5-10 minuti di camminata",
    "**Snack più sostanzioso**: panino, frutta",
    "**Pulizia approfondita** delle parti",
    "**Mental reset**: pausa dal social, niente confronti con punteggi altrui"
  ]},
  {"type":"heading","level":2,"text":"Cosa NON fare"},
  {"type":"list","items":[
    "**Cambiare combo a metà torneo** se la principale non funziona — fidati della preparazione",
    "**Stressarti per le prime sconfitte** — il torneo è lungo, c''è tempo per recuperare",
    "**Confrontarti continuamente con altri** — focus su te stesso",
    "**Sovrapensare** ogni decisione — affidati alla preparazione",
    "**Mangiare cibo nuovo o pesante** durante il torneo"
  ]},
  {"type":"heading","level":2,"text":"Dopo il torneo"},
  {"type":"paragraph","text":"Indipendentemente dal risultato:"},
  {"type":"list","items":[
    "**Stretta di mano** con tutti gli avversari affrontati",
    "**Niente recriminazioni** sui risultati",
    "**Fai analisi a freddo** il giorno dopo, non subito",
    "**Cosa ha funzionato? Cosa no?** Lezioni per il prossimo torneo",
    "**Ringrazia gli organizzatori** — il torneo richiede lavoro"
  ]},
  {"type":"tip","variant":"success","text":"L''analisi a posteriori è oro. Top player tengono ''diari di torneo'' dove appuntano cosa hanno imparato. Dopo 5-10 tornei, la differenza tra te e un principiante diventa enorme."},
  {"type":"inline_quiz","question":"Il torneo è domani. La tua combo principale ha avuto 7 sconfitte di fila in allenamento questa settimana. Cosa fai?","options":["Cambio combo all''ultimo minuto","Vado al torneo con la combo principale comunque, la preparazione è già fatta","Salto il torneo","Provo combo nuove stanotte"],"correctIndex":1,"explanation":"Cambiare strategia all''ultimo minuto raramente funziona. La preparazione di settimane vale più di una settimana di sconfitte recenti, che potrebbero essere statistiche o stato d''animo. Mai sperimentare il giorno prima del torneo."}
]',
'{"questions":[
  {"question":"Quanto tempo prima del torneo dovresti iniziare la preparazione seria?","options":["Il giorno stesso","Il giorno prima","2-4 settimane prima","Mesi prima"],"correctIndex":2,"explanation":"2-4 settimane permette di testare combo, identificare debolezze, perfezionare tecnica. Meno è troppo poco, più rischia di iper-allenarsi."},
  {"question":"Cosa NON fare il giorno del torneo?","options":["Bere acqua","Mangiare colazione","Sperimentare cibo o caffè nuovo","Fare riscaldamento"],"correctIndex":2,"explanation":"Il giorno del torneo non è il momento di sperimentare. Usa solo cose che già conosci e che funzionano per te."},
  {"question":"L''ultima settimana prima del torneo dovrebbe essere...","options":["Allenamento intensivo","Riposo strategico (taper)","Cambio combo","Non importa"],"correctIndex":1,"explanation":"L''ultima settimana è il ''taper'': riduzione dell''intensità per arrivare freschi al torneo. Allenarsi pesantemente fino al giorno prima causa stanchezza in gara."}
]}'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- Lesson 24: Becoming a Champion
-- ────────────────────────────────────────────────────
INSERT INTO academy_lessons (id, level_id, title, subtitle, duration_min, xp_reward, sort_order, content, quiz) VALUES
('becoming-a-champion', 'pro', 'Diventare un Campione', 'Il mindset del vincitore', 10, 100, 6,
'[
  {"type":"paragraph","text":"Hai completato 23 lezioni. Conosci le regole, le parti, il meta, le tecniche, i mind games, la preparazione. Ma sapere tutto questo non ti rende automaticamente un campione. La **trasformazione finale** è interna: il mindset del vincitore."},
  {"type":"quote","text":"Il talento vince partite, ma il lavoro di squadra e l''intelligenza vincono campionati.","author":"Michael Jordan"},
  {"type":"heading","level":2,"text":"Le 5 caratteristiche del campione"},
  {"type":"heading","level":3,"text":"1. Disciplina sopra il talento"},
  {"type":"paragraph","text":"Il talento è una scintilla, la disciplina è il fuoco. Top player non sono ''nati blader'': hanno fatto migliaia di lanci. Hanno tenuto note dettagliate. Hanno studiato il meta come se fosse un esame universitario."},
  {"type":"list","items":[
    "**Allenamento regolare**: anche solo 15 minuti al giorno > 3 ore a settimana",
    "**Tracking dei risultati**: numeri concreti, non sensazioni",
    "**Studio del meta**: come una materia da imparare, non solo un hobby",
    "**Manutenzione costante**: routine non negoziabile"
  ]},
  {"type":"tip","variant":"info","text":"Esiste un proverbio: ''Sii ordinario al lavoro 5 giorni a settimana per essere straordinario una volta''. La consistenza batte l''intensità sporadica."},
  {"type":"heading","level":3,"text":"2. Mentalità di crescita"},
  {"type":"paragraph","text":"Carol Dweck, psicologa di Stanford, distingue tra **fixed mindset** e **growth mindset**:"},
  {"type":"two_column","left":[
    {"type":"heading","level":3,"text":"Fixed mindset"},
    {"type":"list","items":[
      "''Sono bravo o sono scarso''",
      "Le sconfitte sono umiliazioni",
      "Evita le sfide difficili",
      "Si paragona ai migliori e si demoralizza"
    ]}
  ],"right":[
    {"type":"heading","level":3,"text":"Growth mindset"},
    {"type":"list","items":[
      "''Posso migliorare con sforzo''",
      "Le sconfitte sono lezioni",
      "Cerca le sfide difficili",
      "Si paragona ai migliori per imparare"
    ]}
  ]},
  {"type":"tip","variant":"success","text":"Cambia il vocabolario interno: invece di ''non sono capace'', dì ''non sono ancora capace''. Una sola parola — ''ancora'' — trasforma il mindset."},
  {"type":"heading","level":3,"text":"3. Autocoscienza"},
  {"type":"paragraph","text":"Conoscere se stessi: punti forti, debolezze, abitudini, tendenze sotto stress."},
  {"type":"list","items":[
    "**Quali matchup mi mettono in difficoltà?** Studiali",
    "**Sotto pressione, divento aggressivo o passivo?** Adatta la strategia",
    "**Che tipo di lancio mi viene meglio?** Specializzati lì",
    "**Quanto sono propenso al tilt?** Sviluppa contro-strategie"
  ]},
  {"type":"heading","level":3,"text":"4. Resilienza"},
  {"type":"paragraph","text":"Tutti perdono. La differenza è **come reagisci** alle sconfitte:"},
  {"type":"list","items":[
    "**Sconfitta singola**: lezione, non identità",
    "**Cattiva giornata**: una giornata, non una sentenza",
    "**Pareggio inaspettato**: dato statistico, non maledizione",
    "**Sconfitta in finale**: motivazione, non depressione"
  ]},
  {"type":"quote","text":"Non ho perso. O ho vinto, o ho imparato.","author":"Nelson Mandela"},
  {"type":"heading","level":3,"text":"5. Generosità"},
  {"type":"paragraph","text":"Sembra controintuitivo, ma i veri campioni sono **generosi** con la community:"},
  {"type":"list","items":[
    "**Aiutano principianti**: insegnando si impara",
    "**Condividono conoscenza**: la community cresce, e tu con lei",
    "**Riconoscono il merito altrui**: vittorie meritate degli avversari",
    "**Promuovono il fair play**: lo sport sopra il singolo risultato"
  ]},
  {"type":"tip","variant":"info","text":"I migliori giocatori di Beyblade nella storia (e in molti sport) sono ricordati per la loro generosità verso la community, non solo per i loro trofei."},
  {"type":"heading","level":2,"text":"La piramide del campione"},
  {"type":"paragraph","text":"Visualizza il tuo sviluppo come una piramide. Cosa serve, dal basso verso l''alto:"},
  {"type":"list","ordered":true,"items":[
    "**Conoscenza tecnica**: regole, parti, meta (le hai imparate)",
    "**Skill di lancio**: tecniche, consistency (allenamento)",
    "**Strategia**: deck building, matchup, mind games",
    "**Preparazione**: routine, equipaggiamento, fitness mentale",
    "**Mindset**: disciplina, growth mindset, resilienza, generosità"
  ]},
  {"type":"paragraph","text":"Solo i primi 2 livelli sono ''hard skill''. Gli ultimi 3 sono ''soft skill'' e sono quelli che separano i top player da tutti gli altri."},
  {"type":"heading","level":2,"text":"L''importanza della community"},
  {"type":"paragraph","text":"Nessun campione è fatto in solitudine. Avere una community attorno è cruciale:"},
  {"type":"list","items":[
    "**Sparring partner**: per allenarsi contro avversari di livello",
    "**Mentor**: top player che condividono saggezza",
    "**Pari**: amici con cui condividere il viaggio",
    "**Allievi**: insegnando si comprende profondamente"
  ]},
  {"type":"tip","variant":"success","text":"L''app BeyManager X include un sistema di gruppi e leaderboard proprio per questo: la community è parte integrante del cammino verso la maestria."},
  {"type":"heading","level":2,"text":"Obiettivi a lungo termine"},
  {"type":"paragraph","text":"Stabilire obiettivi chiari ti dà direzione:"},
  {"type":"list","items":[
    "**3 mesi**: vincere il prossimo torneo locale",
    "**6 mesi**: partecipare a un torneo regionale, top 16",
    "**1 anno**: top 8 a livello regionale, presenza online attiva",
    "**3 anni**: sponsorizzazione o leadership della community locale",
    "**5 anni**: livello competitivo nazionale, mentor riconosciuto"
  ]},
  {"type":"tip","variant":"info","text":"Gli obiettivi devono essere SMART: Specifici, Misurabili, Ambiziosi, Realistici, Temporali. ''Vincere il torneo del 15 giugno'' è SMART. ''Diventare il migliore'' non lo è."},
  {"type":"heading","level":2,"text":"Errori da evitare nel cammino"},
  {"type":"list","items":[
    "**Imitazione cieca**: copiare top player senza capire perché funzionano",
    "**Iperspecializzazione precoce**: limitarsi a un solo archetipo non ti fa crescere",
    "**Burnout**: sessioni troppo lunghe portano alla saturazione",
    "**Ego**: pensare di sapere già tutto chiude la mente all''apprendimento",
    "**Confronto continuo**: paragonarsi sempre con i migliori demotiva senza insegnare"
  ]},
  {"type":"heading","level":2,"text":"L''ultima lezione"},
  {"type":"paragraph","text":"Beyblade X è un gioco. Un gioco serio per te, ma un gioco. La gioia di lanciare, di vedere la trottola girare, di celebrare le vittorie e accettare le sconfitte con dignità — questo è il cuore."},
  {"type":"paragraph","text":"Diventare un campione non significa vincere ogni torneo. Significa diventare la **migliore versione di te stesso come blader e come persona**. Significa lasciare la community migliore di come l''hai trovata."},
  {"type":"quote","text":"Il successo non è la chiave per la felicità. La felicità è la chiave per il successo. Se ami quello che fai, avrai successo.","author":"Albert Schweitzer"},
  {"type":"tip","variant":"success","text":"Hai completato l''X Academy. Ora il vero allenamento inizia. Ricorda: ogni top player è stato un principiante. Ogni campione ha perso il suo primo torneo. La differenza non è dove inizi, ma dove arrivi. **Buona fortuna, blader. È tempo di scendere in arena.**"},
  {"type":"inline_quiz","question":"Qual è la differenza fondamentale tra fixed mindset e growth mindset?","options":["Età del giocatore","Convinzione che si possa migliorare con sforzo","Quale combo si usa","Quante battaglie si fanno"],"correctIndex":1,"explanation":"Il growth mindset è la convinzione che si possa migliorare con sforzo e dedizione. Il fixed mindset crede che le abilità siano fisse. Questa singola differenza di pensiero ha un impatto enorme sulle performance a lungo termine."}
]',
'{"questions":[
  {"question":"Qual è la caratteristica più importante del campione?","options":["Talento naturale","Avere le combo migliori","Disciplina e mindset","Vincere ogni torneo"],"correctIndex":2,"explanation":"Disciplina e mindset di crescita sono ciò che separa i top dagli altri a lungo termine. Le altre cose sono importanti, ma queste sono fondamentali."},
  {"question":"Cosa significa SMART negli obiettivi?","options":["Smart, Active, Real, Tested, Timed","Specifico, Misurabile, Ambizioso, Realistico, Temporale","Solo per intelligenti","Una marca di prodotto"],"correctIndex":1,"explanation":"SMART = Specifico, Misurabile, Ambizioso, Realistico, Temporale. Un framework universale per definire obiettivi efficaci."},
  {"question":"Cosa caratterizza il growth mindset?","options":["Pensare di essere talentuoso","Convinzione che si possa migliorare con sforzo","Vincere sempre","Non ammettere sconfitte"],"correctIndex":1,"explanation":"Il growth mindset (Carol Dweck) è la convinzione che le abilità si sviluppino con sforzo e dedizione. È la base mentale di tutti i top performer."},
  {"question":"Hai completato 24 lezioni dell''X Academy. E adesso?","options":["Hai finito di imparare","Ora il vero allenamento inizia","Devi rifare tutto","Non puoi mai diventare un campione"],"correctIndex":1,"explanation":"Le lezioni ti hanno dato gli strumenti — ora la vera maestria si costruisce con allenamento, esperienza, e la giusta mentalità. Buona fortuna, blader!"}
]}'
) ON CONFLICT (id) DO NOTHING;


