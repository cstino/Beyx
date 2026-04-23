import React from 'react';
import { motion } from 'framer-motion';
import { Info, BookOpen, Layers, Zap, Shield, Star, Target, FastForward, Info as InfoIcon, ChevronRight } from 'lucide-react';

const sections = [
  {
    title: "Le Linee di Prodotto",
    icon: Layers,
    items: [
      { 
        label: "BX (Basic Line)", 
        desc: "La serie standard. Beyblade solidi e bilanciati, perfetti per iniziare. Design classico in metallo e plastica." 
      },
      { 
        label: "UX (Unique Line)", 
        desc: "Parti con distribuzione del peso unica. Spesso caricate verso l'esterno per massimizzare l'inerzia o l'impatto." 
      },
      { 
        label: "CX (Custom Line)", 
        desc: "La massima modularità. Design avanzati che permettono personalizzazioni tecniche ancora più profonde." 
      }
    ]
  },
  {
    title: "Le Statistichen (Le 5 Chiavi)",
    icon: Zap,
    items: [
      { label: "Attack (ATT)", icon: Zap, color: "text-red-500", desc: "La forza d'impatto. Più è alta, più è probabile buttare l'avversario fuori dall'arena." },
      { label: "Defense (DEF)", icon: Shield, color: "text-blue-500", desc: "Capacità di incassare colpi senza spostarsi dal centro." },
      { label: "Stamina (STA)", icon: Star, color: "text-green-500", desc: "La durata della rotazione (tempo di spinning)." },
      { label: "Burst (BUR)", icon: Target, color: "text-yellow-500", desc: "Resistenza all'esplosione. Fondamentale per non perdere per smontaggio improvviso." },
      { label: "Mobility (MOB)", icon: FastForward, color: "text-purple-500", desc: "Rapidità di movimento e interazione con la X-Line estrema." }
    ]
  },
  {
    title: "Anatomia del Beyblade X",
    icon: BookOpen,
    items: [
      { label: "Blade", desc: "La parte superiore in metallo. Definisce il peso e lo stile di combattimento." },
      { label: "Ratchet", desc: "La parte centrale. Determina l'altezza e la resistenza strutturale (Burst)." },
      { label: "Bit", desc: "La punta. Decide il movimento nell'arena e come il Bey interagisce con la guida X." }
    ]
  }
];

export default function Guide() {
  return (
    <div className="max-w-4xl mx-auto pb-32 px-4 pt-6">
      <header className="mb-10 text-center">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
          <BookOpen className="text-primary" size={32} />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">X-Academy</h1>
        <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Tutto quello che devi sapere su Beyblade X</p>
      </header>

      <div className="space-y-12">
        {sections.map((section, idx) => (
          <motion.section 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <section.icon size={24} className="text-primary" />
              <h2 className="text-xl font-black uppercase tracking-tight">{section.title}</h2>
            </div>

            <div className="grid gap-4">
              {section.items.map((item, i) => (
                <div key={i} className="glass-card p-5 border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-start gap-4">
                    {item.icon && (
                      <div className={`p-2 bg-white/5 rounded-lg ${item.color}`}>
                        <item.icon size={20} />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-black uppercase tracking-wider text-sm mb-1">{item.label}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      <div className="mt-12 p-6 bg-primary/10 rounded-[32px] border border-primary/20 text-center">
        <InfoIcon className="text-primary mx-auto mb-3" size={24} />
        <h3 className="font-black uppercase text-sm mb-1 tracking-widest">Pro Tip</h3>
        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
          Ricorda che una combo vincente non è solo quella con le stats più alte, ma quella che meglio si adatta allo stadio e al launcher che usi!
        </p>
      </div>
    </div>
  );
}
