import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useHomeData } from '../hooks/useHomeData';
import { PageContainer } from '../components/PageContainer';

// Modular Components
import { BladerHeroCard } from '../components/BladerHeroCard';
import { StatCard } from '../components/StatCard';
import { AcademyBanner } from '../components/AcademyBanner';
import { SectionHeader } from '../components/SectionHeader';
import { LeaderboardRow } from '../components/LeaderboardRow';

export default function Dashboard() {
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { blader, parts, combos, topBladers, loading } = useHomeData(userId);

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#E94560] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <PageContainer>
      {/* 1. Hero Card - Top element now that logo is global */}
      <div className="pt-6">
        <BladerHeroCard blader={blader} />
      </div>

      {/* 2. Stats Row */}
      <div className="grid grid-cols-2 gap-3 mx-4 mt-5 mb-5">
        <StatCard
          label="Parti" 
          value={parts.owned} 
          total={parts.total}
          subtitle="In collezione" 
          accentColor="#4361EE"
          onClick={() => navigate('/collection')}
        />
        <StatCard
          label="Combo" 
          value={combos.count}
          subtitle="Creati da te" 
          accentColor="#E94560"
          onClick={() => navigate('/builder?view=saved')}
        />
      </div>

      {/* 3. Academy Banner */}
      <div className="mx-4 mb-8">
        <AcademyBanner onClick={() => navigate('/guide')} />
      </div>

      {/* 4. Top Bladers Section */}
      <div className="mx-4 mb-8">
        <SectionHeader
          title="Top Bladers" 
          accentColor="#F5A623"
          onSeeAll={() => navigate('/leaderboard')}
        />
        <div className="space-y-3 mt-4">
          {topBladers.map((b, i) => (
            <LeaderboardRow key={b.id} rank={i + 1} blader={b} />
          ))}
        </div>
      </div>

    </PageContainer>
  );
}
