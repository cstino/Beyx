import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Collection from './pages/Collection';
import Builder from './pages/Builder';
import Guide from './pages/Guide';
import Battle from './pages/Battle';
import New1v1Page from './pages/battle/New1v1Page';
import BattleHistoryPage from './pages/battle/BattleHistoryPage';
import New3v3Page from './pages/battle/New3v3Page';
import NewTournamentPage from './pages/battle/NewTournamentPage';
import TournamentJoinPage from './pages/battle/TournamentJoinPage';
import Account from './pages/Account';
import Admin from './pages/Admin';
import ComboDetailPage from './pages/ComboDetailPage';
import { AcademyPage } from './pages/AcademyPage';
import { AcademyLevelPage } from './pages/AcademyLevelPage';
import { AcademyLessonPage } from './pages/AcademyLessonPage';
import LeaderboardPage from './pages/LeaderboardPage';
import { SplashScreen } from './components/SplashScreen';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const { user, profile, setUser, fetchProfile, setLoading, loading } = useAuthStore();
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem('splashDone') === 'true'
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashDone', 'true');
    setSplashDone(true);
  };

  if (!splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-primary font-display font-bold animate-pulse uppercase tracking-[0.2em]">Sincronizzazione...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/auth" 
          element={!user ? <Auth /> : <Navigate to="/" replace />} 
        />
        
        <Route element={user ? <Layout /> : <Navigate to="/auth" replace />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/battle/new/1v1" element={<New1v1Page />} />
          <Route path="/battle/new/3v3" element={<New3v3Page />} />
          <Route path="/battle/new/tournament" element={<NewTournamentPage />} />
          <Route path="/battle/tournament/:id/join" element={<TournamentJoinPage />} />
          <Route path="/battle/history" element={<BattleHistoryPage />} />
          <Route path="/account" element={<Account />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/combo/:id" element={<ComboDetailPage />} />
          <Route path="/academy" element={<AcademyPage />} />
          <Route path="/academy/:levelId" element={<AcademyLevelPage />} />
          <Route path="/academy/:levelId/:lessonId" element={<AcademyLessonPage />} />
          <Route 
            path="/admin" 
            element={profile?.is_admin ? <Admin /> : <Navigate to="/" replace />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

