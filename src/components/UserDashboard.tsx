import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, User as UserIcon, Heart, TrendingUp, Target, Film, Check, Shuffle, FileText, Clock, X } from 'lucide-react';
import { getUserProfile, getUserStats, getWatchlistMovies, getUserOscarProgress, getUserAchievements, markMovieAsWatched, UserProfile, UserStats, UserWatchlistItem, UserOscarProgress, OscarProgressSummary, UserAchievement } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

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
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<{
    type: 'decade' | 'year';
    identifier: string;
    title: string;
    progress: UserOscarProgress;
  } | null>(null);
  const [progressMovies, setProgressMovies] = useState<{
    watched: UserWatchlistItem[];
    toWatch: UserWatchlistItem[];
  }>({ watched: [], toWatch: [] });
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // Tematyczne opisy dla poziomów użytkownika
  const levelDescriptions: { [key: number]: { title: string; description: string } } = {
    1: { title: 'Nowicjusz Filmowy', description: 'Pierwsze kroki w świecie Oscarów' },
    2: { title: 'Odkrywca Klasyków', description: 'Zaczynasz poznawać historię kina' },
    3: { title: 'Koneser Kina', description: 'Doceniasz niuanse i arcydzieła' },
    4: { title: 'Mistrz Oscarów', description: 'Prawdziwy ekspert w dziedzinie nagród' },
    5: { title: 'Legenda Srebrnego Ekranu', description: 'Twoja wiedza jest bezcenna' },
    6: { title: 'Filmowy Erudyta', description: 'Encyklopedyczna znajomość kinematografii' },
    7: { title: 'Oscarowy Wizjoner', description: 'Widzisz to, co inni przeoczają' },
    8: { title: 'Strażnik Dziedzictwa Filmu', description: 'Chronisz historię kina' },
    9: { title: 'Filmowy Autorytet', description: 'Twoja opinia ma ogromną wartość' },
    10: { title: 'Nieśmiertelna Ikona Kina', description: 'Osiągnąłeś filmowe oświecenie' }
  };

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

      const [profile, stats, watchlist, progress, achievements] = await Promise.all([
        getUserProfile(user.id),
        getUserStats(user.id),
        getWatchlistMovies(user.id),
        getUserOscarProgress(user.id),
        getUserAchievements(user.id)
      ]);

      setUserProfile(profile);
      setUserStats(stats);
      setWatchlistMovies(watchlist);
      setOscarProgress(progress);
      setUserAchievements(achievements);

    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Nie udało się załadować danych użytkownika');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsWatched = async (movieId: string, movieTitle: string, listMovie?: UserWatchlistItem) => {
    try {
      setIsUpdatingProgress(true);
      console.log('✅ Dashboard: Marking movie as watched:', movieTitle);
      
      const success = await markMovieAsWatched(user.id, movieId);
      if (success) {
        console.log('✅ Dashboard: Successfully marked movie as watched');
        setActionFeedback({ type: 'success', message: `"${movieTitle}" oznaczono jako obejrzany!` });
        
        // If we're in progress detail view, update the lists immediately
        if (selectedProgress && listMovie) {
          // Move the movie from toWatch to watched
          setProgressMovies(prev => {
            // Remove from toWatch
            const newToWatch = prev.toWatch.filter(m => m.movie_id !== movieId);
            
            // Add to watched (only if not already there)
            const alreadyInWatched = prev.watched.some(m => m.movie_id === movieId);
            const newWatched = alreadyInWatched 
              ? prev.watched 
              : [...prev.watched, listMovie];
            
            return {
              toWatch: newToWatch,
              watched: newWatched
            };
          });
          
          // Update the progress counts and percentage
          setSelectedProgress(prev => {
            if (!prev) return null;
            
            const newWatchedCount = prev.progress.movies_watched_count + 1;
            const newPercentage = Math.round((newWatchedCount / prev.progress.total_movies_in_category) * 100);
            
            return {
              ...prev,
              progress: {
                ...prev.progress,
                movies_watched_count: newWatchedCount,
                progress_percentage: newPercentage
              }
            };
          });
        }
        
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
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleProgressClick = async (type: 'decade' | 'year', identifier: string, progress: UserOscarProgress) => {
    const title = type === 'decade' ? getDecadeDisplayName(identifier) : `Oscary ${identifier}`;
    setSelectedProgress({ type, identifier, title, progress });
    setIsLoadingInsight(true);
    setAiInsight('');
    
    try {
      // Get movies for this category
      let moviesQuery = supabase
        .from('movies')
        .select('*')
        .eq('is_best_picture_nominee', true);

      if (type === 'decade') {
        const yearRanges: { [key: string]: number[] } = {
          '2000s': [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010],
          '2010s': [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
          '1990s': [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000],
          '1980s': [1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990],
          '1970s': [1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980],
          '1960s': [1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969, 1970],
          '1950s': [1951, 1952, 1953, 1954, 1955, 1956, 1957, 1958, 1959, 1960],
          '1940s': [1941, 1942, 1943, 1944, 1945, 1946, 1947, 1948, 1949, 1950],
          '1930s': [1931, 1932, 1933, 1934, 1935, 1936, 1937, 1938, 1939, 1940],
          '1920s': [1921, 1922, 1923, 1924, 1925, 1926, 1927, 1928, 1929, 1930]
        };
        
        const years = yearRanges[identifier] || [];
        moviesQuery = moviesQuery.in('oscar_year', years);
      } else {
        moviesQuery = moviesQuery.eq('oscar_year', parseInt(identifier));
      }

      const { data: allMovies, error: moviesError } = await moviesQuery;

      if (moviesError) throw moviesError;

      // Movies are already filtered by the query
      const filteredMovies = allMovies;

      // Get user's watched movies
      const { data: watchedMovies, error: watchedError } = await supabase
        .from('user_movie_watches')
        .select(`
          movie_id,
          movies (*)
        `)
        .eq('user_id', user.id);

      if (watchedError) throw watchedError;

      const watchedMovieIds = new Set(watchedMovies?.map(w => w.movie_id) || []);
      
      const watched = filteredMovies?.filter(movie => watchedMovieIds.has(movie.id))
        .map(movie => ({ id: movie.id, movie_id: movie.id, user_id: user.id, added_at: '', movies: movie })) || [];
      
      const toWatch = filteredMovies?.filter(movie => !watchedMovieIds.has(movie.id))
        .map(movie => ({ id: movie.id, movie_id: movie.id, user_id: user.id, added_at: '', movies: movie })) || [];

      setProgressMovies({ watched, toWatch });

      // Generate AI insight
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/movie-recommendations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'progress-insight',
          categoryType: type,
          categoryIdentifier: identifier,
          watchedCount: watched.length,
          totalCount: filteredMovies?.length || 0,
          toWatchMovies: toWatch.map(m => ({
            title: m.movies?.title,
            thematic_tags: m.movies?.thematic_tags,
            mood_tags: m.movies?.mood_tags,
            vote_average: m.movies?.vote_average
          }))
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAiInsight(result.insight || 'Kontynuuj swoją podróż przez kino oscarowe!');
      }
    } catch (error) {
      console.error('Error loading progress details:', error);
    } finally {
      setIsLoadingInsight(false);
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
                      <p className="text-neutral-400 text-sm">
                        {levelDescriptions[userProfile?.level || 1]?.title || 'Nowicjusz Filmowy'}
                      </p>
                      <p className="text-neutral-500 text-xs mt-1">
                        {levelDescriptions[userProfile?.level || 1]?.description || 'Pierwsze kroki w świecie Oscarów'}
                      </p>
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
                        {userAchievements?.length || 0}
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
                                onClick={() => handleMarkAsWatched(listMovie.movie_id, listMovie.movies?.title || 'Film', listMovie)}
                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors duration-200 shadow-lg disabled:opacity-50"
                                disabled={isUpdatingProgress}
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
                              <div 
                                key={decade.id}
                                className="p-4 rounded-lg border border-neutral-700 bg-neutral-800/50 cursor-pointer hover:bg-neutral-700/50 transition-colors"
                                onClick={() => handleProgressClick('decade', decade.category_identifier, decade)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white font-medium">
                                    {getDecadeDisplayName(decade.category_identifier)}
                                  </span>
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
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Years Progress */}
                      {oscarProgress.years.length > 0 && (
                        <div>
                          <h3 className="text-white font-semibold text-lg mb-4">Postęp według lat</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            {oscarProgress.years
                              // Filter out years that have 100% progress and already have an achievement
                              .filter(year => {
                                if (year.progress_percentage < 100) return true;
                                // Check if there's already an achievement for this year
                                const achievementExists = userAchievements.some(
                                  achievement => 
                                    achievement.achievement_type === 'oscar_progress' && 
                                    achievement.achievement_name === `Ukończono Oscary ${year.category_identifier}`
                                );
                                return !achievementExists;
                              })
                              .map((year) => (
                              <div 
                                key={year.id}
                                className="p-4 rounded-lg border border-neutral-700 bg-neutral-800/50 cursor-pointer hover:bg-neutral-700/50 transition-colors"
                                onClick={() => handleProgressClick('year', year.category_identifier, year)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white font-medium">
                                    Oscary {year.category_identifier}
                                  </span>
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
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Achievements Section */}
                      <div>
                        <h3 className="text-white font-semibold text-lg mb-4">Osiągnięcia</h3>
                        {userAchievements.length > 0 ? (
                          <div className="grid md:grid-cols-2 gap-4">
                            {userAchievements.map((achievement) => (
                              <div 
                                key={achievement.id}
                                className="p-4 rounded-lg border border-neutral-700 bg-neutral-800/50"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white font-medium">
                                    {achievement.achievement_name}
                                  </span>
                                </div>
                                <div className="w-full bg-neutral-700 rounded-full h-2 mb-2">
                                  <div 
                                    className={`${achievement.is_completed ? 'bg-green-500' : 'bg-[#DFBD69]'} h-2 rounded-full transition-all duration-500`}
                                    style={{ width: `${(achievement.progress / achievement.max_progress) * 100}%` }}
                                  ></div>
                                </div>
                                <p className="text-neutral-400 text-xs">
                                  {achievement.description.replace('Obejrzałeś wszystkie filmy nominowane do Oscara w', 'Obejrzałeś wszystkie filmy nominowane w Best Picture w')}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div 
                            className="p-4 rounded-lg border border-neutral-700 bg-neutral-800/50 text-center"
                          >
                            <Target className="w-8 h-8 text-[#DFBD69] mx-auto mb-2" />
                            <p className="text-neutral-400 text-sm">
                              Brak osiągnięć. Oglądaj filmy oscarowe, aby zdobywać osiągnięcia!
                            </p>
                          </div>
                        )}
                      </div>
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

        {/* Progress Detail Modal */}
        {selectedProgress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1c1e] rounded-2xl border border-neutral-700">
              {/* Close Button */}
              <button
                onClick={() => setSelectedProgress(null)}
                className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Header */}
              <div className="p-6 border-b border-neutral-700">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedProgress.title}</h2>
                <div className="flex items-center gap-4 text-sm text-neutral-300">
                  <span>Obejrzane: {selectedProgress.progress.movies_watched_count}</span>
                  <span>Pozostało: {selectedProgress.progress.total_movies_in_category - selectedProgress.progress.movies_watched_count}</span>
                  <span className="text-[#DFBD69] font-semibold">{selectedProgress.progress.progress_percentage}% ukończone</span>
                </div>
              </div>

              {/* AI Insight */}
              <div className="p-6 border-b border-neutral-700">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#DFBD69]" />
                  AI Insight
                </h3>
                <div 
                  className="p-4 rounded-lg border border-neutral-700"
                  style={{
                    background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                  }}
                >
                  {isLoadingInsight ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
                      <span className="text-neutral-300">Analizuję Twój postęp...</span>
                    </div>
                  ) : (
                    <p className="text-neutral-200 leading-relaxed">{aiInsight}</p>
                  )}
                </div>
              </div>

              {/* Movies Lists */}
              <div className="p-6">
                {/* Watched Movies */}
                {progressMovies.watched.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-white font-semibold text-lg mb-4">
                      ✅ Obejrzane ({progressMovies.watched.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {progressMovies.watched.map((listMovie) => (
                        <div key={listMovie.id} className="group relative">
                          <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden bg-neutral-800 relative">
                            <img 
                              src={formatPosterUrl(listMovie.movies?.poster_path)}
                              alt={`${listMovie.movies?.title} Poster`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <div className="bg-green-600 text-white p-1 rounded-full">
                                <Check className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                          <h3 className="text-white font-medium text-sm leading-tight">
                            {listMovie.movies?.title}
                          </h3>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* To Watch Movies */}
                {progressMovies.toWatch.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-4">
                      📋 Do obejrzenia ({progressMovies.toWatch.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {progressMovies.toWatch.map((listMovie) => (
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
                                onClick={() => handleMarkAsWatched(listMovie.movie_id, listMovie.movies?.title || 'Film', listMovie)}
                                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full transition-colors duration-200 shadow-lg disabled:opacity-50"
                                disabled={isUpdatingProgress}
                                title="Oznacz jako obejrzany"
                              >
                                <Check className="w-6 h-6" />
                              </button>
                            </div>
                            
                            {/* Mobile: Always visible watched button in top-right corner */}
                            <div className="md:hidden absolute top-2 right-2">
                              <button
                                onClick={() => handleMarkAsWatched(listMovie.movie_id, listMovie.movies?.title || 'Film', listMovie)}
                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors duration-200 shadow-lg disabled:opacity-50"
                                disabled={isUpdatingProgress}
                                title="Oznacz jako obejrzany"
                                aria-label="Oznacz jako obejrzany"
                              >
                                <Check className="w-6 h-6" />
                              </button>
                            </div>
                          </div>
                          
                          <h3 className="text-white font-medium text-sm leading-tight">
                            {listMovie.movies?.title}
                          </h3>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {progressMovies.watched.length === 0 && progressMovies.toWatch.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-neutral-400">Brak filmów w tej kategorii</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;