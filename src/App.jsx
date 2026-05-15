import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Layout from './components/Layout';
import { SplashScreen } from './components/SplashScreen';
import { useAuthStore } from './store/useAuthStore';
import ScrollToTop from './components/ScrollToTop';

// Lazy loading delle pagine per velocizzare l'avvio iniziale
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const WelcomeTourPage = lazy(() => import('./pages/WelcomeTourPage').then(m => ({ default: m.WelcomeTourPage })));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Collection = lazy(() => import('./pages/Collection'));
const Builder = lazy(() => import('./pages/Builder'));
const Guide = lazy(() => import('./pages/Guide'));
const Battle = lazy(() => import('./pages/Battle'));
const New1v1Page = lazy(() => import('./pages/battle/New1v1Page'));
const BattleHistoryPage = lazy(() => import('./pages/battle/BattleHistoryPage'));
const New3v3Page = lazy(() => import('./pages/battle/New3v3Page'));
const NewTournamentPage = lazy(() => import('./pages/battle/NewTournamentPage'));
const TournamentJoinPage = lazy(() => import('./pages/battle/TournamentJoinPage'));
const TournamentDisplayView = lazy(() => import('./pages/battle/TournamentDisplayView'));
const Account = lazy(() => import('./pages/Account'));
const Admin = lazy(() => import('./pages/Admin'));
const ComboDetailPage = lazy(() => import('./pages/ComboDetailPage'));
const AcademyPage = lazy(() => import('./pages/AcademyPage').then(m => ({ default: m.AcademyPage })));
const AcademyLevelPage = lazy(() => import('./pages/AcademyLevelPage').then(m => ({ default: m.AcademyLevelPage })));
const AcademyLessonPage = lazy(() => import('./pages/AcademyLessonPage').then(m => ({ default: m.AcademyLessonPage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const NewMatchPage = lazy(() => import('./pages/battle/NewMatchPage').then(m => ({ default: m.NewMatchPage })));
const LiveMatchPage = lazy(() => import('./pages/battle/LiveMatchPage').then(m => ({ default: m.LiveMatchPage })));
const AcceptChallengePage = lazy(() => import('./pages/battle/AcceptChallengePage').then(m => ({ default: m.AcceptChallengePage })));

function App() {
  const { user, profile, setUser, fetchProfile, setLoading, loading } = useAuthStore();
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem('splashDone') === 'true'
  );

  useEffect(() => {
    // Rimuove lo splash statico dell'HTML una volta che React è pronto
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 500);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
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
      <ScrollToTop />
      <Suspense fallback={
        <div className="min-h-screen bg-[#0A0A1A] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <Routes>
          {/* Auth routes — solo se NON loggato */}
          {!user ? (
            <>
              <Route path="/register" element={<OnboardingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <>
              {/* Welcome tour — solo se profilo appena creato */}
              {profile && !profile.onboarding_done ? (
                <>
                  <Route path="/welcome" element={<WelcomeTourPage />} />
                  <Route path="*" element={<Navigate to="/welcome" replace />} />
                </>
              ) : (
                <>
                  {/* App normale — tutte le route esistenti */}
                  <Route path="/battle/tournament/:id/display" element={<TournamentDisplayView />} />
                  <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/collection" element={<Collection />} />
                    <Route path="/builder" element={<Builder />} />
                    <Route path="/guide" element={<Guide />} />
                    <Route path="/battle" element={<Battle />} />
                    <Route path="/battle/new/1v1" element={<New1v1Page />} />
                    <Route path="/battle/new/3v3" element={<New3v3Page />} />
                    <Route path="/battle/new/tournament" element={<NewTournamentPage />} />
                    <Route path="/battle/tournament/:tournamentId" element={<NewTournamentPage />} />
                    <Route path="/battle/tournament/:id/join" element={<TournamentJoinPage />} />
                    <Route path="/battle/new" element={<NewMatchPage />} />
                    <Route path="/battle/accept/:battleId" element={<AcceptChallengePage />} />
                    <Route path="/battle/live/:battleId" element={<LiveMatchPage />} />
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
                </>
              )}
            </>
          )}
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;

