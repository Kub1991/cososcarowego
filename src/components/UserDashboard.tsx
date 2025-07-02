import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, User as UserIcon, Heart, TrendingUp, Target, Film } from 'lucide-react';
import { getUserProfile, getUserStats, getUserMovieLists, getMoviesInList, UserProfile, UserStats, UserMovieList } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserDashboardProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
  initialTab?: 'overview' | 'lists' | 'journey' | 'challenges';
}

type DashboardTab = 'overview' | 'lists' | 'journey' | 'challenges';

const UserDashboard: React.FC<UserDashboardProps> = ({ 
  user, 
  onBack, 
  onLogout, 
  initialTab = 'overview' 
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [movieLists, setMovieLists] = useState<UserMovieList[]>([]);
  const [watchlistMovies, setWatchlistMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [profile, stats, lists] = await Promise.all([
        getUserProfile(user.id),
        getUserStats(user.id),
        getUserMovieLists(user.id)
      ]);

      setUserProfile(profile);
      setUserStats(stats);
      setMovieLists(lists);

      // Load movies from "Do obejrzenia" list
      const watchlist = lists.find(list => list.name === 'Do obejrzenia');
      if (watchlist) {
        const movies = await getMoviesInList(watchlist.id);
        setWatchlistMovies(movies);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Nie udało się załadować danych użytkownika');
    } finally {
      setIsLoading(false);
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

  const tabs = [
    { id: 'overview', label: 'Przegląd', icon: UserIcon },
    { id: 'lists', label: 'Moje listy filmów', icon: Heart },
    { id: 'journey', label: 'Moja podróż', icon: TrendingUp },
    { id: 'challenges', label: 'Wyzwania', icon: Target }
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
      {/* Header */}
      <div className="bg-[#1a1c1e] border-b border-neutral-700">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Powrót</span>
              </button>
              
              {/* Mobile logout button - shown below back button */}
              <button
                onClick={onLogout}
                className="flex md:hidden items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Wyloguj</span>
              </button>
              
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
                      <div className="flex items-center gap-3 mb-2">
                        <Heart className="w-6 h-6 text-[#DFBD69]" />
                        <span className="text-white font-semibold whitespace-nowrap overflow-hidden text-ellipsis">Do obejrzenia</span>
                      </div>
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
            {activeTab === 'lists' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Moje listy filmów</h2>
                  
                  {watchlistMovies.length === 0 ? (
                    <div 
                      className="p-8 rounded-xl border border-neutral-700 text-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                      }}
                    >
                      <Heart className="w-12 h-12 text-[#DFBD69] mx-auto mb-4" />
                      <h3 className="text-white font-semibold text-lg mb-2">Brak filmów na liście</h3>
                      <p className="text-neutral-400">
                        Dodaj filmy do swojej listy używając przycisku "Dodaj do listy" w aplikacji
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {watchlistMovies.map((listMovie) => (
                        <div key={listMovie.id} className="group">
                          <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden bg-neutral-800">
                            <img 
                              src={formatPosterUrl(listMovie.movie?.poster_path)}
                              alt={`${listMovie.movie?.title} Poster`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <h3 className="text-white font-medium text-sm leading-tight">
                            {listMovie.movie?.title}
                          </h3>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Journey Tab */}
            {activeTab === 'journey' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Moja podróż</h2>
                  <div 
                    className="p-8 rounded-xl border border-neutral-700 text-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                    }}
                  >
                    <TrendingUp className="w-12 h-12 text-[#DFBD69] mx-auto mb-4" />
                    <h3 className="text-white font-semibold text-lg mb-2">Śledź swoją podróż</h3>
                    <p className="text-neutral-400">
                      Ta sekcja będzie dostępna wkrótce. Tutaj będziesz mógł śledzić swój postęp w odkrywaniu filmów oscarowych.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Challenges Tab */}
            {activeTab === 'challenges' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Wyzwania</h2>
                  <div 
                    className="p-8 rounded-xl border border-neutral-700 text-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                    }}
                  >
                    <Target className="w-12 h-12 text-[#DFBD69] mx-auto mb-4" />
                    <h3 className="text-white font-semibold text-lg mb-2">Podejmij wyzwania</h3>
                    <p className="text-neutral-400">
                      Ta sekcja będzie dostępna wkrótce. Tutaj będziesz mógł podejmować różne wyzwania filmowe.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;