import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, User, Film, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { getUserProfile, getUserStats, getOrCreateDefaultListId, getMoviesInList, UserProfile, UserStats, UserMovieList } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserDashboardProps {
  user: SupabaseUser;
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
  const [movieList, setMovieList] = useState<UserMovieList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  useEffect(() => {
    if (activeTab === 'lists') {
      loadMovieList();
    }
  }, [activeTab, user.id]);

  const loadUserData = async () => {
    try {
      const [profile, stats] = await Promise.all([
        getUserProfile(user.id),
        getUserStats(user.id)
      ]);
      
      setUserProfile(profile);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMovieList = async () => {
    setIsLoadingMovies(true);
    try {
      // Get the default "Do obejrzenia" list ID
      const listId = await getOrCreateDefaultListId(user.id, 'Do obejrzenia');
      if (listId) {
        // Get movies in the list
        const movies = await getMoviesInList(listId);
        setMovieList(movies);
      }
    } catch (error) {
      console.error('Error loading movie list:', error);
    } finally {
      setIsLoadingMovies(false);
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
    { id: 'overview', label: 'Przegląd', icon: User },
    { id: 'lists', label: 'Moje listy filmów', icon: Film },
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Powrót</span>
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-white">Panel użytkownika</h1>
                <p className="text-neutral-400">Witaj, {getUserDisplayName()}</p>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Wyloguj</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[#1a1c1e] border-b border-neutral-700">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#DFBD69] text-[#DFBD69]'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div 
                className="p-6 rounded-xl border border-neutral-700"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Film className="w-6 h-6 text-[#DFBD69]" />
                  <h3 className="text-white font-semibold">Obejrzane filmy</h3>
                </div>
                <p className="text-3xl font-bold text-[#DFBD69]">{userStats?.watched_movies || 0}</p>
              </div>

              <div 
                className="p-6 rounded-xl border border-neutral-700"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-6 h-6 text-[#DFBD69]" />
                  <h3 className="text-white font-semibold">Lista filmów</h3>
                </div>
                <p className="text-3xl font-bold text-[#DFBD69]">{userStats?.watchlist_movies || 0}</p>
              </div>

              <div 
                className="p-6 rounded-xl border border-neutral-700"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-[#DFBD69]" />
                  <h3 className="text-white font-semibold">Poziom</h3>
                </div>
                <p className="text-3xl font-bold text-[#DFBD69]">{userProfile?.level || 1}</p>
              </div>

              <div 
                className="p-6 rounded-xl border border-neutral-700"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-6 h-6 text-[#DFBD69]" />
                  <h3 className="text-white font-semibold">Zwycięzcy Oscarów</h3>
                </div>
                <p className="text-3xl font-bold text-[#DFBD69]">{userStats?.total_oscar_winners || 0}</p>
              </div>
            </div>

            {userStats?.favorite_genre && (
              <div 
                className="p-6 rounded-xl border border-neutral-700"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <h3 className="text-[#DFBD69] font-semibold text-lg mb-4">Twoje preferencje</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-neutral-400 text-sm">Ulubiony gatunek</p>
                    <p className="text-white font-medium">{userStats.favorite_genre}</p>
                  </div>
                  {userStats.favorite_decade && (
                    <div>
                      <p className="text-neutral-400 text-sm">Ulubiona dekada</p>
                      <p className="text-white font-medium">{userStats.favorite_decade}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Movie Lists Tab */}
        {activeTab === 'lists' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Moje listy filmów</h2>
              <p className="text-neutral-400">Filmy dodane do Twojej listy "Do obejrzenia"</p>
            </div>

            {isLoadingMovies ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
                  <p className="text-neutral-400">Ładowanie filmów...</p>
                </div>
              </div>
            ) : movieList.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {movieList.map((listMovie) => (
                  <div key={listMovie.id} className="group">
                    <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden bg-neutral-800">
                      <img 
                        src={formatPosterUrl(listMovie.movie?.poster_path)}
                        alt={`${listMovie.movie?.title} Poster`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="text-white font-medium text-sm leading-tight text-center">
                      {listMovie.movie?.title}
                    </h3>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="text-center py-12 rounded-xl border border-neutral-700"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <Film className="w-16 h-16 text-[#DFBD69] mx-auto mb-4" />
                <h3 className="text-white font-semibold text-xl mb-2">Brak filmów na liście</h3>
                <p className="text-neutral-400 mb-6">
                  Dodaj filmy do swojej listy używając przycisku "Dodaj do listy" w aplikacji
                </p>
                <button
                  onClick={onBack}
                  className="bg-[#DFBD69] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#E8C573] transition-colors"
                >
                  Odkryj filmy
                </button>
              </div>
            )}
          </div>
        )}

        {/* Journey Tab */}
        {activeTab === 'journey' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Moja Oscarowa podróż</h2>
              <p className="text-neutral-400">Śledź swój postęp w odkrywaniu filmów oscarowych</p>
            </div>

            <div 
              className="text-center py-12 rounded-xl border border-neutral-700"
              style={{
                background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
              }}
            >
              <TrendingUp className="w-16 h-16 text-[#DFBD69] mx-auto mb-4" />
              <h3 className="text-white font-semibold text-xl mb-2">Funkcja w przygotowaniu</h3>
              <p className="text-neutral-400">
                Wkrótce będziesz mógł śledzić swoją podróż przez historię kina oscarowego
              </p>
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Wyzwania filmowe</h2>
              <p className="text-neutral-400">Podejmij wyzwania i zdobywaj osiągnięcia</p>
            </div>

            <div 
              className="text-center py-12 rounded-xl border border-neutral-700"
              style={{
                background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
              }}
            >
              <Target className="w-16 h-16 text-[#DFBD69] mx-auto mb-4" />
              <h3 className="text-white font-semibold text-xl mb-2">Funkcja w przygotowaniu</h3>
              <p className="text-neutral-400">
                Wkrótce będziesz mógł podejmować wyzwania filmowe i zdobywać osiągnięcia
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;