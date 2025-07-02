import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, User as UserIcon, Heart, TrendingUp, Target, Film, Check, Shuffle, FileText, Clock, ChevronRight, X } from 'lucide-react';
  UserOscarProgress, 
  OscarProgressSummary,
  ProgressDetails

interface UserDashboardProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
  initialTab?: 'overview' | 'watchlist' | 'journey';
  onQuickShot?: () => void;
  onSmartMatch?: () => void;
  onBrowseByYears?: () => void;
}

type DashboardTab = 'overview' | 'watchlist' | 'journey';

const UserDashboard: React.FC<UserDashboardProps> = ({ 
  user, 
  onBack, 
  onLogout, 
  initialTab = 'overview',
  onQuickShot,
  onSmartMatch,
  onBrowseByYears
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [watchlistMovies, setWatchlistMovies] = useState<UserWatchlistItem[]>([]);
  const [oscarProgress, setOscarProgress] = useState<OscarProgressSummary | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<ProgressDetails | null>(null);
  const [progressRecommendation, setProgressRecommendation] = useState<string>('');
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  // Clear feedback after 3 seconds
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => {
        setActionFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [profile, stats, watchlist, progress] = await Promise.all([
        getUserProfile(user.id),
        getUserStats(user.id),
        getWatchlistMovies(user.id),
        getUserOscarProgress(user.id)
      ]);

      setUserProfile(profile);
      setUserStats(stats);
      setWatchlistMovies(watchlist);
      setOscarProgress(progress);

    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Nie udało się załadować danych użytkownika');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsWatched = async (movieId: string, movieTitle: string) => {
    try {
      console.log('✅ Dashboard: Marking movie as watched:', movieTitle);
      
      const success = await markMovieAsWatched(user.id, movieId);
      if (success) {
        console.log('✅ Dashboard: Successfully marked movie as watched');
        setActionFeedback({ type: 'success', message: `"${movieTitle}" oznaczono jako obejrzany!` });
        
        // Refresh the data to show updated progress
        await loadUserData();
      } else {
        console.error('❌ Dashboard: Failed to mark movie as watched');
        setActionFeedback({ type: 'error', message: 'Nie udało się oznaczyć filmu jako obejrzany' });
      }
    } catch (error) {
      console.error('Error marking movie as watched:', error);
      console.error('❌ Dashboard: Exception in handleMarkAsWatched:', error);
      setActionFeedback({ type: 'error', message: 'Wystąpił błąd podczas oznaczania filmu' });
    }
  };

  const formatPosterUrl = (posterPath: string | null | undefined) => {
    if (!posterPath) return '/jpiDCxkCbo0.movieposter_maxres.jpg';
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  const getUserDisplayName = () => {
    if (userProfile?.display_name) {
      return userProfile.display_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Użytkownik';
  };

  const getDecadeDisplayName = (decadeId: string) => {
    const decadeNames: { [key: string]: string } = {
      '2000s': 'Lata 2000-2009',
      '2010s': 'Lata 2010-2019',
      '1990s': 'Lata 1990-1999',
      '1980s': 'Lata 1980-1989',
      '1970s': 'Lata 1970-1979',
      '1960s': 'Lata 1960-1969',
      '1950s': 'Lata 1950-1959',
      '1940s': 'Lata 1940-1949',
      '1930s': 'Lata 1930-1939',
      '1920s': 'Lata 1920-1929'
    };
    return decadeNames[decadeId] || decadeId;
  };

  const tabs = [
    { id: 'overview', label: 'Przegląd', icon: UserIcon },
    { id: 'watchlist', label: 'Do obejrzenia', icon: Heart },
    { id: 'journey', label: 'Moja podróż', icon: TrendingUp }
  ];

  const handleProgressClick = async (categoryType: 'decade' | 'oscar_year', categoryId: string) => {
    setIsLoadingProgress(true);
    setIsLoadingRecommendation(true);
    
    try {
      // Get detailed progress data
      const details = await getProgressDetails(user.id, categoryType, categoryId);
      setSelectedProgress(details);
      
      // Get AI recommendation for remaining movies
      if (details && details.remainingMovies.length > 0) {
        const recommendation = await getProgressRecommendation(user.id, categoryType, categoryId, details.remainingMovies);
        setProgressRecommendation(recommendation);
      }
    } catch (error) {
      console.error('Error loading progress details:', error);
      setActionFeedback({ type: 'error', message: 'Nie udało się załadować szczegółów postępu' });
    } finally {
      setIsLoadingProgress(false);
      setIsLoadingRecommendation(false);
    }
  };

  const closeProgressModal = () => {
    setSelectedProgress(null);
    setProgressRecommendation('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070000] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
          <p className="text-white text-lg">Ładowanie panelu użytkownika...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070000]">
      {/* Action Feedback */}
      {actionFeedback && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          actionFeedback.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{actionFeedback.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#1a1c1e] border-b border-neutral-700">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-2">
                {/* Mobile: Icon-only buttons */}
                <button
                  onClick={onBack}
                  className="flex md:hidden items-center justify-center w-10 h-10 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                  title="Powrót"
                  aria-label="Powrót"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <button
                  onClick={onLogout}
                  className="flex md:hidden items-center justify-center w-10 h-10 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                  title="Wyloguj"
                  aria-label="Wyloguj"
                >
                  <LogOut className="w-5 h-5" />
                </button>
                
                {/* Desktop: Full buttons with text */}
                <button
                  onClick={onBack}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Powrót</span>
                </button>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-white">Panel użytkownika</h1>
                <p className="text-neutral-400">Witaj, {getUserDisplayName()}!</p>
              </div>
            </div>
            
            {/* Desktop logout button - shown on the right */}
            <button
              onClick={onLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Wyloguj</span>
            </button>
          </div>
          
          {/* Discovery Buttons - Always visible at top */}
          <div className="mt-6 pt-6 border-t border-neutral-600">
            <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
              <button
                onClick={onQuickShot}
                disabled={!onQuickShot}
                className="flex-shrink-0 px-3 md:px-4 py-2 text-black font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap bg-[#DFBD69] hover:bg-[#E8C573]"
              >
                Szybki strzał
              </button>
              <button
                onClick={onSmartMatch}
                disabled={!onSmartMatch}
                className="flex-shrink-0 px-3 md:px-4 py-2 text-black font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap bg-[#DFBD69] hover:bg-[#E8C573]"
              >
                Dopasowany wybór
              </button>
              <button
                onClick={onBrowseByYears}
                disabled={!onBrowseByYears}
                className="flex-shrink-0 px-3 md:px-4 py-2 text-black font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap bg-[#DFBD69] hover:bg-[#E8C573]"
              >
                Przeszukaj latami
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as DashboardTab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#DFBD69] text-black font-semibold'
                        : 'text-white hover:bg-neutral-800'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {error && (
              <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Przegląd konta</h2>
                  
                  {/* Stats Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div 
                      className="p-6 rounded-xl border border-neutral-700"
                      style={{
                        background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Film className="w-6 h-6 text-[#DFBD69]" />
                        <span className="text-white font-semibold whitespace-nowrap overflow-hidden text-ellipsis">Obejrzane</span>
                      </div>
                      <p className="text-2xl font-bold text-[#DFBD69]">
                        {userStats?.watched_movies || 0}
                      </p>
                      <p className="text-neutral-400 text-sm">filmów</p>
                    </div>

                    <div 
                      className="p-6 rounded-xl border border-neutral-700"
                      style={{
                        background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                      }}
                    >
                      <button 
                        onClick={() => setActiveTab('watchlist')}
                        className="flex items-center gap-3 mb-2 w-full text-left hover:opacity-80 transition-opacity"
                      >
                        <Heart className="w-6 h-6 text-[#DFBD69]" />
                        <span className="text-white font-semibold whitespace-nowrap overflow-hidden text-ellipsis">Do obejrzenia</span>
                      </button>
                      <p className="text-2xl font-bold text-[#DFBD69]">
                        {userStats?.watchlist_movies || 0}
                      </p>
                      <p className="text-neutral-400 text-sm">filmów</p>
                    </div>

                    <div 
                      className="p-6 rounded-xl border border-neutral-700"
                      style={{
                        background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-6 h-6 text-[#DFBD69]" />
                        <span className="text-white font-semibold whitespace-nowrap overflow-hidden text-ellipsis">Poziom</span>
                      </div>
                      <p className="text-2xl font-bold text-[#DFBD69]">
                        {userProfile?.level || 1}
                      </p>
                      <p className="text-neutral-400 text-sm">poziom</p>
                    </div>

                    <div 
                      className="p-6 rounded-xl border border-neutral-700"
                      style={{
                        background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-6 h-6 text-[#DFBD69]" />
                        <span className="text-white font-semibold whitespace-nowrap overflow-hidden text-ellipsis">Osiągnięcia</span>
                      </div>
                      <p className="text-2xl font-bold text-[#DFBD69]">
                        {userStats?.achievements_count || 0}
                      </p>
                      <p className="text-neutral-400 text-sm">zdobytych</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Movie Lists Tab */}
            {activeTab === 'watchlist' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Do obejrzenia</h2>
                  
                  {watchlistMovies.length === 0 ? (
                    <div 
                      className="p-8 rounded-xl border border-neutral-700 text-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                      }}
                    >
                      <Heart className="w-12 h-12 text-[#DFBD69] mx-auto mb-4" />
                      <h3 className="text-white font-semibold text-lg mb-2">Brak filmów do obejrzenia</h3>
                      <p className="text-neutral-400">
                        Dodaj filmy do obejrzenia używając przycisku "Do obejrzenia" w aplikacji
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {watchlistMovies.map((listMovie) => (
                        <div key={listMovie.id} className="group relative">
                          <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden bg-neutral-800 relative">
                            <img 
                              src={formatPosterUrl(listMovie.movies?.poster_path)}
                              alt={`${listMovie.movies?.title} Poster`}
                              className="w-full h-full object-cover"
                            />
                            
                            {/* Desktop: Watched Button - appears on hover */}
                            <div className="hidden md:flex absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center">
                              <button
                                onClick={() => handleMarkAsWatched(listMovie.movie_id, listMovie.movies?.title || 'Film')}
                                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full transition-colors duration-200 shadow-lg"
                                title="Oznacz jako obejrzany"
                              >
                                <Check className="w-6 h-6" />
                              </button>
                            </div>
                            
                            {/* Mobile: Always visible watched button in top-right corner */}
                            <div className="md:hidden absolute top-2 right-2">
                              <button
                                onClick={() => handleMarkAsWatched(listMovie.movie_id, listMovie.movies?.title || 'Film')}
                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors duration-200 shadow-lg"
                                title="Oznacz jako obejrzany"
                                aria-label="Oznacz jako obejrzany"
                              >
                                <Check className="w-6 h-6" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Movie title with mobile checkmark button */}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="md:hidden text-white font-medium text-sm leading-tight flex-1">
                              {listMovie.movies?.title}
                            </h3>
                          </div>
                          
                          {/* Keep original title for desktop (hidden on mobile) */}
                          <h3 className="hidden md:block text-white font-medium text-sm leading-tight">
                            {listMovie.movies?.title}
                          </h3>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Journey Tab - NEW: Oscar Progress Tracking */}
            {activeTab === 'journey' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Moja podróż</h2>
                  
                  {oscarProgress && (oscarProgress.decades.length > 0 || oscarProgress.years.length > 0) ? (
                    <div className="space-y-8">
                      {/* Overall Progress */}
                      <div 
                        className="p-6 rounded-xl border border-neutral-700"
                        style={{
                          background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-white font-semibold text-lg">Oscarowa Bucket Lista</h3>
                          <span className="text-[#DFBD69] font-bold text-2xl">
                            {oscarProgress.overallProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-neutral-700 rounded-full h-3 mb-2">
                          <div 
                            className="bg-gradient-to-r from-[#DFBD69] to-[#E8C573] h-3 rounded-full transition-all duration-500"
                            style={{ width: `${oscarProgress.overallProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-neutral-300 text-sm">
                          {oscarProgress.totalWatchedMovies} z {oscarProgress.totalOscarMovies} filmów oscarowych obejrzanych
                        </p>
                      </div>

                      {/* Decade Progress */}
                      {oscarProgress.decades.length > 0 && (
                        <div>
                          <h3 className="text-white font-semibold text-lg mb-4">Postęp według dekad</h3>
                          <div className="space-y-4">
                            {oscarProgress.decades.map((decade) => (
                              <button 
                                key={decade.id}
                                onClick={() => handleProgressClick('decade', decade.category_identifier)}
                                className="w-full p-4 rounded-lg border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors group"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">
                                    {getDecadeDisplayName(decade.category_identifier)}
                                  </span>
                                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#DFBD69] transition-colors" />
                                  </div>
                                  <span className="text-[#DFBD69] font-semibold">
                                    {decade.progress_percentage}%
                                  </span>
                                </div>
                                <div className="w-full bg-neutral-700 rounded-full h-2 mb-2">
                                  <div 
                                    className="bg-[#DFBD69] h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${decade.progress_percentage}%` }}
                                  ></div>
                                </div>
                                <p className="text-neutral-400 text-xs">
                                  {decade.movies_watched_count} z {decade.total_movies_in_category} filmów ukończonych
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Years Progress */}
                      {oscarProgress.years.length > 0 && (
                        <div>
                          <h3 className="text-white font-semibold text-lg mb-4">Postęp według lat</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            {oscarProgress.years.map((year) => (
                              <button 
                                key={year.id}
                                onClick={() => handleProgressClick('oscar_year', year.category_identifier)}
                                className="w-full p-4 rounded-lg border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors group text-left"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">
                                    Oscary {year.category_identifier}
                                  </span>
                                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#DFBD69] transition-colors" />
                                  </div>
                                  <span className="text-[#DFBD69] font-semibold">
                                    {year.progress_percentage}%
                                  </span>
                                </div>
                                <div className="w-full bg-neutral-700 rounded-full h-2 mb-2">
                                  <div 
                                    className="bg-[#DFBD69] h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${year.progress_percentage}%` }}
                                  ></div>
                                </div>
                                <p className="text-neutral-400 text-xs">
                                  {year.movies_watched_count} z {year.total_movies_in_category} nominowanych obejrzanych
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div 
                      className="p-8 rounded-xl border border-neutral-700 text-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                      }}
                    >
                      <TrendingUp className="w-12 h-12 text-[#DFBD69] mx-auto mb-4" />
                      <h3 className="text-white font-semibold text-lg mb-2">Rozpocznij swoją podróż</h3>
                      <p className="text-neutral-400 mb-4">
                        Oznacz swój pierwszy film jako obejrzany, aby zobaczyć postęp w odkrywaniu filmów oscarowych.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          onClick={onQuickShot}
                          className="px-4 py-2 bg-[#DFBD69] text-black font-semibold rounded-lg hover:bg-[#E8C573] transition-colors text-sm"
                        >
                          Szybki strzał
                        </button>
                        <button
                          onClick={onSmartMatch}
                          className="px-4 py-2 bg-neutral-700 text-white font-semibold rounded-lg hover:bg-neutral-600 transition-colors text-sm"
                        >
                          Dopasowany wybór
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Progress Details Modal */}
        {selectedProgress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1c1e] rounded-2xl border border-neutral-700">
              {/* Close Button */}
              <button
                onClick={closeProgressModal}
                className="absolute top-6 right-6 z-10 p-2 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {selectedProgress.categoryType === 'decade' 
                      ? getDecadeDisplayName(selectedProgress.categoryId)
                      : `Oscary ${selectedProgress.categoryId}`
                    }
                  </h2>
                  <div className="flex items-center justify-center gap-4 text-neutral-400">
                    <span>{selectedProgress.watchedMovies.length} obejrzanych</span>
                    <span>•</span>
                    <span>{selectedProgress.remainingMovies.length} pozostałych</span>
                    <span>•</span>
                    <span className="text-[#DFBD69] font-semibold">{selectedProgress.progressPercentage}% ukończone</span>
                  </div>
                </div>
      </div>
    </div>
  );
  getProgressDetails,
};
  getProgressRecommendation,

                {/* Progress Bar */}
                {/* AI Recommendation */}
                {selectedProgress.remainingMovies.length > 0 && (
                  <div 
                    className="p-6 rounded-lg border border-neutral-700 mb-8"
                    style={{
                      background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                    }}
                  >
                    <h3 className="text-[#DFBD69] font-bold text-lg mb-4 flex items-center gap-2">
                      🤖 Rekomendacja AI
                    </h3>
                    {isLoadingRecommendation ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
                        <span className="text-neutral-300">Analizuję pozostałe filmy...</span>
                      </div>
                    ) : (
                      <p className="text-neutral-200 leading-relaxed">
                        {progressRecommendation || 'Nie udało się wygenerować rekomendacji.'}
                      </p>
                    )}
                  </div>
                )}
                <div className="mb-8">
                {/* Movies Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Watched Movies */}
                  {selectedProgress.watchedMovies.length > 0 && (
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                        ✅ Obejrzane ({selectedProgress.watchedMovies.length})
                      </h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedProgress.watchedMovies.map((movie) => (
                          <div 
                            key={movie.id}
                            className="flex gap-3 p-3 rounded-lg bg-green-600/20 border border-green-600/30"
                          >
                            <img 
                              src={formatPosterUrl(movie.poster_path)}
                              alt={`${movie.title} Poster`}
                              className="w-12 h-16 object-cover rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium text-sm leading-tight mb-1">
                                {movie.title}
                              </h4>
                              <p className="text-green-400 text-xs">
                                {movie.year} • {movie.is_best_picture_winner ? 'Zwycięzca' : 'Nominowany'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="w-full bg-neutral-700 rounded-full h-3">
                  {/* Remaining Movies */}
                  {selectedProgress.remainingMovies.length > 0 && (
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                        📋 Do obejrzenia ({selectedProgress.remainingMovies.length})
                      </h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedProgress.remainingMovies.map((movie) => (
                          <div 
                            key={movie.id}
                            className="flex gap-3 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-700/50 transition-colors group"
                          >
                            <img 
                              src={formatPosterUrl(movie.poster_path)}
                              alt={`${movie.title} Poster`}
                              className="w-12 h-16 object-cover rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium text-sm leading-tight mb-1">
                                {movie.title}
                              </h4>
                              <p className="text-neutral-400 text-xs mb-2">
                                {movie.year} • {movie.is_best_picture_winner ? 'Zwycięzca' : 'Nominowany'}
                              </p>
                              <button
                                onClick={() => handleMarkAsWatched(movie.id, movie.title)}
                                className="text-xs bg-[#DFBD69] text-black px-2 py-1 rounded hover:bg-[#E8C573] transition-colors opacity-0 group-hover:opacity-100"
                              >
                                Oznacz jako obejrzany
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                    <div 
                  {/* Completed State */}
                  {selectedProgress.remainingMovies.length === 0 && (
                    <div className="md:col-span-2 text-center py-8">
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="text-white font-bold text-xl mb-2">Gratulacje!</h3>
                      <p className="text-neutral-400">
                        Ukończyłeś wszystkie filmy z tej kategorii!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
                      className="bg-gradient-to-r from-[#DFBD69] to-[#E8C573] h-3 rounded-full transition-all duration-500"
                      style={{ width: `${selectedProgress.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
export default UserDashboard;