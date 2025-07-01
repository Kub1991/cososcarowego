import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Film, Trophy, LogOut, Play } from 'lucide-react';
import { getUserProfile, getUserStats, getUserMovieLists, getMoviesInList, getOrCreateDefaultListId, UserProfile, UserStats, UserMovieList } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import OptimizedImage from './OptimizedImage';

interface UserDashboardProps {
  user: SupabaseUser;
  onBack: () => void;
  onLogout: () => void;
  initialTab?: 'overview' | 'lists' | 'journey' | 'challenges';
}

type DashboardTab = 'overview' | 'lists' | 'journey' | 'challenges';

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onBack, onLogout, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [toWatchMovies, setToWatchMovies] = useState<UserMovieList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  useEffect(() => {
    if (activeTab === 'lists') {
      loadToWatchMovies();
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

  const loadToWatchMovies = async () => {
    setIsLoadingMovies(true);
    try {
      // Get or create the default "Do obejrzenia" list
      const listId = await getOrCreateDefaultListId(user.id, 'Do obejrzenia');
      if (listId) {
        // Get movies from the list
        const movies = await getMoviesInList(listId);
        setToWatchMovies(movies);
      }
    } catch (error) {
      console.error('Error loading to-watch movies:', error);
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
    { id: 'journey', label: 'Moja podróż', icon: Trophy },
    { id: 'challenges', label: 'Wyzwania', icon: Play }
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

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
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
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Przegląd konta</h2>
                  
                  {/* Stats Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <div className="text-2xl font-bold text-[#DFBD69] mb-2">
                        {userStats?.watched_movies || 0}
                      </div>
                      <div className="text-neutral-400 text-sm">Obejrzane filmy</div>
                    </div>
                    
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <div className="text-2xl font-bold text-[#DFBD69] mb-2">
                        {userStats?.watchlist_movies || 0}
                      </div>
                      <div className="text-neutral-400 text-sm">Na liście do obejrzenia</div>
                    </div>
                    
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <div className="text-2xl font-bold text-[#DFBD69] mb-2">
                        {userStats?.total_oscar_winners || 0}
                      </div>
                      <div className="text-neutral-400 text-sm">Zwycięzcy Oscarów</div>
                    </div>
                    
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <div className="text-2xl font-bold text-[#DFBD69] mb-2">
                        {userStats?.average_rating ? `${userStats.average_rating}/10` : 'N/A'}
                      </div>
                      <div className="text-neutral-400 text-sm">Średnia ocena</div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                    <h3 className="text-white font-semibold mb-4">Informacje o profilu</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Email:</span>
                        <span className="text-white">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Poziom:</span>
                        <span className="text-white">{userProfile?.level || 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Data dołączenia:</span>
                        <span className="text-white">
                          {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('pl-PL') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lists' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Moje listy filmów</h2>
                  
                  {isLoadingMovies ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <div className="w-8 h-8 mx-auto border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
                        <p className="text-neutral-400">Ładowanie filmów...</p>
                      </div>
                    </div>
                  ) : toWatchMovies.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {toWatchMovies.map((movieItem) => (
                        <div key={movieItem.id} className="group">
                          <div className="bg-[#1a1c1e] rounded-lg overflow-hidden border border-neutral-700 hover:border-[#DFBD69] transition-colors">
                            <div className="aspect-[2/3] relative">
                              <OptimizedImage
                                src={formatPosterUrl(movieItem.movie?.poster_path)}
                                alt={`${movieItem.movie?.title} Poster`}
                                className="w-full h-full object-cover"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="text-white font-medium text-sm leading-tight line-clamp-2">
                                {movieItem.movie?.title}
                              </h3>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Film className="w-16 h-16 mx-auto text-neutral-600 mb-4" />
                      <h3 className="text-white font-semibold mb-2">Brak filmów na liście</h3>
                      <p className="text-neutral-400 mb-6">
                        Dodaj filmy do swojej listy używając przycisku "Dodaj do listy" podczas przeglądania filmów.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'journey' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Moja podróż</h2>
                  <div className="bg-[#1a1c1e] p-8 rounded-lg border border-neutral-700 text-center">
                    <Trophy className="w-16 h-16 mx-auto text-neutral-600 mb-4" />
                    <h3 className="text-white font-semibold mb-2">Funkcja w przygotowaniu</h3>
                    <p className="text-neutral-400">
                      Wkrótce będziesz mógł śledzić swoją podróż przez świat filmów oscarowych.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'challenges' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Wyzwania</h2>
                  <div className="bg-[#1a1c1e] p-8 rounded-lg border border-neutral-700 text-center">
                    <Play className="w-16 h-16 mx-auto text-neutral-600 mb-4" />
                    <h3 className="text-white font-semibold mb-2">Funkcja w przygotowaniu</h3>
                    <p className="text-neutral-400">
                      Wkrótce będziesz mógł podejmować wyzwania filmowe i zdobywać osiągnięcia.
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