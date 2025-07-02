import React, { useState, useEffect, Suspense } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import DiscoverySection from './components/DiscoverySection';
import MoodSection from './components/MoodSection';
import RegistrationSection from './components/RegistrationSection';
import Footer from './components/Footer';
import AuthPromptModal from './components/AuthPromptModal';
import LoadingSkeleton from './components/LoadingSkeleton';
import { supabase } from './lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Lazy loading komponentów dla code splitting
const QuickShotScreen = React.lazy(() => import('./components/QuickShotScreen'));
const SmartMatchScreen = React.lazy(() => import('./components/SmartMatchScreen'));
const BrowseByYearsScreen = React.lazy(() => import('./components/BrowseByYearsScreen'));
const MoodQuickShotScreen = React.lazy(() => import('./components/MoodQuickShotScreen'));
const UserDashboard = React.lazy(() => import('./components/UserDashboard'));

type ViewType = 'main' | 'quickShot' | 'smartMatch' | 'browseByYears' | 'moodQuickShot' | 'dashboard';
type DashboardTab = 'overview' | 'watchlist' | 'journey';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [dashboardInitialTab, setDashboardInitialTab] = useState<DashboardTab>('overview');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPromptFeature, setAuthPromptFeature] = useState<string>('tej funkcji');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Redirect to dashboard after successful registration/login
      if (event === 'SIGNED_IN' && session) {
        setCurrentView('dashboard');
        setDashboardInitialTab('overview');
        setShowAuthModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!user;

  const handleQuickShotClick = () => {
    setCurrentView('quickShot');
  };

  const handleSmartMatchClick = () => {
    setCurrentView('smartMatch');
  };

  const handleBrowseByYearsClick = () => {
    setCurrentView('browseByYears');
  };

  const handleMoodClick = (mood: string) => {
    setSelectedMood(mood);
    setCurrentView('moodQuickShot');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedMood(''); // Clear selected mood when going back
  };

  const handleGoToDashboard = (initialTab: DashboardTab = 'overview') => {
    if (isAuthenticated) {
      setDashboardInitialTab(initialTab);
      setCurrentView('dashboard');
    } else {
      openAuthModal('panelu użytkownika');
    }
  };

  const handleLoginSuccess = () => {
    setDashboardInitialTab('overview');
    setCurrentView('dashboard');
    setShowAuthModal(false);
  };

  const handleGoToJourney = () => {
    if (isAuthenticated) {
      setDashboardInitialTab('journey');
      setCurrentView('dashboard');
    } else {
      openAuthModal('śledzenia swojej Oscarowej podróży');
    }
  };

  const openAuthModal = (featureName: string = 'tej funkcji') => {
    setAuthPromptFeature(featureName);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('main');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070000] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
          <p className="text-white text-lg">Ładowanie...</p>
        </div>
      </div>
    );
  }

  // Lazy loaded screens z Suspense
  if (currentView === 'dashboard' && isAuthenticated) {
    return (
      <Suspense fallback={<LoadingSkeleton type="dashboard" />}>
        <UserDashboard 
          user={user!} 
          onBack={handleBackToMain}
          onLogout={handleLogout}
          initialTab={dashboardInitialTab}
          onQuickShot={handleQuickShotClick}
          onSmartMatch={handleSmartMatchClick}
          onBrowseByYears={handleBrowseByYearsClick}
        />
      </Suspense>
    );
  }

  if (currentView === 'quickShot') {
    return (
      <Suspense fallback={<LoadingSkeleton type="quickshot" />}>
        <QuickShotScreen 
          onBack={handleBackToMain} 
          isAuthenticated={isAuthenticated}
          onAuthPrompt={openAuthModal}
          onGoToJourney={handleGoToJourney}
        />
        <AuthPromptModal 
          isOpen={showAuthModal}
          onClose={closeAuthModal}
          featureName={authPromptFeature}
          onLoginSuccess={handleLoginSuccess}
        />
      </Suspense>
    );
  }

  if (currentView === 'smartMatch') {
    return (
      <Suspense fallback={<LoadingSkeleton type="smartmatch" />}>
        <SmartMatchScreen 
          onBack={handleBackToMain}
          isAuthenticated={isAuthenticated}
          onAuthPrompt={openAuthModal}
          onGoToJourney={handleGoToJourney}
        />
        <AuthPromptModal 
          isOpen={showAuthModal}
          onClose={closeAuthModal}
          featureName={authPromptFeature}
          onLoginSuccess={handleLoginSuccess}
        />
      </Suspense>
    );
  }

  if (currentView === 'browseByYears') {
    return (
      <Suspense fallback={<LoadingSkeleton type="browse" />}>
        <BrowseByYearsScreen 
          onBack={handleBackToMain}
          isAuthenticated={isAuthenticated}
          onAuthPrompt={openAuthModal}
          onGoToJourney={handleGoToJourney}
        />
        <AuthPromptModal 
          isOpen={showAuthModal}
          onClose={closeAuthModal}
          featureName={authPromptFeature}
          onLoginSuccess={handleLoginSuccess}
        />
      </Suspense>
    );
  }

  if (currentView === 'moodQuickShot') {
    return (
      <Suspense fallback={<LoadingSkeleton type="quickshot" />}>
        <MoodQuickShotScreen 
          selectedMood={selectedMood}
          onBack={handleBackToMain}
          isAuthenticated={isAuthenticated}
          onAuthPrompt={openAuthModal}
          onGoToJourney={handleGoToJourney}
        />
        <AuthPromptModal 
          isOpen={showAuthModal}
          onClose={closeAuthModal}
          featureName={authPromptFeature}
          onLoginSuccess={handleLoginSuccess}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#070000]">
      <Header 
        isAuthenticated={isAuthenticated}
        user={user}
        onGoToDashboard={() => handleGoToDashboard('overview')}
        onLogout={handleLogout}
      />
      <HeroSection />
      <DiscoverySection 
        onQuickShotClick={handleQuickShotClick} 
        onSmartMatchClick={handleSmartMatchClick}
        onBrowseByYearsClick={handleBrowseByYearsClick}
      />
      {/* Gradientowy separator */}
      <div className="py-8 bg-[#070000]">
        <div className="max-w-6xl mx-auto px-6">
          <div 
            className="h-px w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(223, 189, 105, 0.3), transparent)'
            }}
          ></div>
        </div>
      </div>
      <MoodSection onMoodClick={handleMoodClick} />
      {/* Gradientowy separator */}
      <div className="py-12 bg-[#070000]">
        <div className="max-w-6xl mx-auto px-6">
          <div 
            className="h-px w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(223, 189, 105, 0.3), transparent)'
            }}
          ></div>
        </div>
      </div>
      {/* Gradientowy separator */}
      <div className="py-8 bg-[#070000]">
        <div className="max-w-6xl mx-auto px-6">
          <div 
            className="h-px w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(223, 189, 105, 0.3), transparent)'
            }}
          ></div>
        </div>
      </div>
      <div className="bg-[#070000]">
        <RegistrationSection onRegistrationSuccess={handleLoginSuccess} />
      </div>
      <Footer />
      
      <AuthPromptModal 
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        featureName={authPromptFeature}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;