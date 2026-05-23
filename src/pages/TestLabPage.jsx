import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, Trophy, History, FlaskConical } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';

export default function TestLabPage() {
  const navigate = useNavigate();
  const { setHeader, clearHeader } = useUIStore();
  const isAdmin = useAuthStore(s =>
    s.user?.email === 'cr.96bc@gmail.com'
    || s.user?.email === 'hcskso96@gmail.com'
    || s.profile?.is_admin
  );

  useEffect(() => {
    setHeader('LAB', '/');
    return () => clearHeader();
  }, [setHeader, clearHeader]);

  useEffect(() => {
    if (!isAdmin) navigate('/', { replace: true });
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  const cards = [
    {
      icon: Swords,
      label: 'Scontro Singolo',
      desc: '1v1 tra due blade con round multipli',
      color: '#F43F5E',
      path: '/test-lab/scontro',
    },
    {
      icon: Trophy,
      label: 'Torneo Test',
      desc: 'Bracket o Round Robin tra blade selezionate',
      color: '#F5A623',
      path: '/test-lab/torneo',
    },
    {
      icon: History,
      label: 'Storico Test',
      desc: 'Leaderboard e statistiche dei match test',
      color: '#3B82F6',
      path: '/test-lab/storico',
    },
  ];

  return (
    <PageContainer>
      <div className="px-4 mb-6 pt-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <FlaskConical size={28} className="text-[#9b59b6]" />
            <h1 className="text-xl font-black text-white uppercase font-createfuture">Lab</h1>
          </div>
          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">
            Ambiente di test riservato all'admin
          </p>
        </div>

        <div className="space-y-3">
          {cards.map((card, i) => (
            <motion.button
              key={card.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(card.path)}
              className="w-full text-left p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: card.color + '15' }}
              >
                <card.icon size={22} style={{ color: card.color }} />
              </div>
              <div>
                <div className="text-white font-black text-sm font-createfuture uppercase">{card.label}</div>
                <div className="text-[10px] text-white/40 font-medium">{card.desc}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
