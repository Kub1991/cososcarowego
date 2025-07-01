import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, Eye, List, Clock, Star, Trophy, TrendingUp, Film, Bookmark, Award, Calendar, BarChart3, Target, Users, Settings, User } from 'lucide-react';
import { getUserProfile, getUserStats, getUserMovieLists, getMoviesInList, getUserWatchedMovies, getUserDetailedAnalytics, UserProfile, UserStats, MovieList, UserMovieList, UserMovieWatch, GenreAnalysis, DecadeAnalysis } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserDashboardProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
  initialTab?: 'overview' | 'lists' | 'journey' | 'challenges' | 'analytics';
}

type Tab = 'overview' | 'lists' | 'journey' | 'challenges' | 'analytics';

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onBack, onLogout, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [movieLists, setMovieLists] = useState<MovieList[]>([]);
  const [watchedMovies, setWatchedMovies] = useState<UserMovieWatch[]>([]);
  const [detailedAnalytics, setDetailedAnalytics] = useState<{
    genreBreakdown: GenreAnalysis[];
    decadeProgress: DecadeAnalysis[];
    watchingTrends: any[];
    topRatedMovies: UserMovieWatch[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const [profile, stats, lists, watched, analytics] = await Promise.all([
          getUserProfile(user.id),
          getUserStats(user.id),
          getUserMovieLists(user.id),
          getUserWatchedMovies(user.id),
          getUserDetailedAnalytics(user.id)
        ]);

        setUserProfile(profile);
        setUserStats(stats);
        setMovieLists(lists);
        setWatchedMovies(watched);
        setDetailedAnalytics(analytics);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user.id]);

  const formatWatchTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (remainingHours > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${days}d`;
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
    { id: 'overview', label: 'Insighty', icon: BarChart3 },
    { id: 'lists', label: 'Listy', icon: List },
    { id: 'journey', label: 'Podróż', icon: Target },
    { id: 'challenges', label: 'Wyzwania', icon: Trophy },
    { id: 'analytics', label: 'Analityka', icon: TrendingUp }
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
                <p className="text-neutral-400">Witaj, {getUserDisplayName()}!</p>
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
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#DFBD69] text-black font-semibold'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Twoje Insighty</h2>
                  <p className="text-neutral-400">Przegląd Twojej kinowej podróży i postępów</p>
                </div>

                {/* Level Progress Card */}
                <div 
                  className="p-6 rounded-xl border border-[#DFBD69]/30"
                  style={{
                    background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-[#DFBD69] mb-1">
                        Poziom {userProfile?.level || 1}
                      </h3>
                      <p className="text-neutral-300 text-sm">
                        Kinoman w rozwoju
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-16 rounded-full bg-[#DFBD69]/20 flex items-center justify-center">
                        <Award className="w-8 h-8 text-[#DFBD69]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Obejrzane filmy */}
                  <div className="bg-[#1a1c1e] p-6 rounded-xl border border-neutral-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Eye className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {userStats?.watched_movies || 0}
                        </p>
                        <p className="text-neutral-400 text-sm">Obejrzane filmy</p>
                      </div>
                    </div>
                  </div>

                  {/* Do obejrzenia */}
                  <div className="bg-[#1a1c1e] p-6 rounded-xl border border-neutral-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Bookmark className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {userStats?.watchlist_movies || 0}
                        </p>
                        <p className="text-neutral-400 text-sm">Do obejrzenia</p>
                      </div>
                    </div>
                  </div>

                  {/* Czas oglądania */}
                  <div className="bg-[#1a1c1e] p-6 rounded-xl border border-neutral-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {userStats?.total_watch_time ? formatWatchTime(userStats.total_watch_time) : '0min'}
                        </p>
                        <p className="text-neutral-400 text-sm">Czas oglądania</p>
                      </div>
                    </div>
                  </div>

                  {/* Średnia ocen */}
                  <div className="bg-[#1a1c1e] p-6 rounded-xl border border-neutral-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <Star className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {userStats?.average_rating ? `${userStats.average_rating}/10` : 'N/A'}
                        </p>
                        <p className="text-neutral-400 text-sm">Średnia ocen</p>
                      </div>
                    </div>
                  </div>

                  {/* Obejrzani zwycięzcy Oscarowi */}
                  <div className="bg-[#1a1c1e] p-6 rounded-xl border border-neutral-700 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#DFBD69]/20 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-[#DFBD69]" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {userStats?.total_oscar_winners || 0}
                        </p>
                        <p className="text-neutral-400 text-sm">Obejrzani zwycięzcy Oscarowi</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-neutral-700">
                      <p className="text-neutral-500 text-xs">
                        Nominowani: {userStats?.total_nominees || 0} • 
                        Łącznie filmów oscarowych: {(userStats?.total_oscar_winners || 0) + (userStats?.total_nominees || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lists' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Twoje listy filmów</h2>
                  <p className="text-neutral-400">Zarządzaj swoimi kolekcjami filmów</p>
                </div>

                <div className="grid gap-6">
                  {movieLists.map((list) => (
                    <div key={list.id} className="bg-[#1a1c1e] p-6 rounded-xl border border-neutral-700">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white">{list.name}</h3>
                          {list.description && (
                            <p className="text-neutral-400 text-sm mt-1">{list.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#DFBD69]">{list.movie_count}</p>
                          <p className="text-neutral-400 text-sm">filmów</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {list.is_default && (
                          <span className="px-2 py-1 bg-[#DFBD69]/20 text-[#DFBD69] text-xs rounded-md">
                            Domyślna
                          </span>
                        )}
                        {list.is_public && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md">
                            Publiczna
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'journey' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Twoja kinowa podróż</h2>
                  <p className="text-neutral-400">Historia Twoich filmowych odkryć</p>
                </div>

                {watchedMovies.length > 0 ? (
                  <div className="space-y-4">
                    {watchedMovies.slice(0, 10).map((watch) => (
                      <div key={watch.id} className="bg-[#1a1c1e] p-4 rounded-lg border border-neutral-700">
                        <div className="flex items-center gap-4">
                          {watch.movie?.poster_path && (
                            <img 
                              src={`https://image.tmdb.org/t/p/w92${watch.movie.poster_path}`}
                              alt={`${watch.movie.title} Poster`}
                              className="w-12 h-18 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">{watch.movie?.title}</h4>
                            <p className="text-neutral-400 text-sm">
                              Obejrzany: {new Date(watch.watched_at).toLocaleDateString('pl-PL')}
                            </p>
                            {watch.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span className="text-yellow-400 text-sm">{watch.rating}/10</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Film className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Brak obejrzanych filmów</h3>
                    <p className="text-neutral-400">Zacznij oglądać filmy, aby zobaczyć swoją podróż!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'challenges' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Wyzwania filmowe</h2>
                  <p className="text-neutral-400">Podejmij wyzwania i zdobywaj osiągnięcia</p>
                </div>

                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Wyzwania wkrótce!</h3>
                  <p className="text-neutral-400">Pracujemy nad systemem wyzwań filmowych</p>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Szczegółowa analityka</h2>
                  <p className="text-neutral-400">Głębsze spojrzenie na Twoje preferencje filmowe</p>
                </div>

                {detailedAnalytics && detailedAnalytics.genreBreakdown.length > 0 ? (
                  <div className="space-y-6">
                    {/* Genre Breakdown */}
                    <div className="bg-[#1a1c1e] p-6 rounded-xl border border-neutral-700">
                      <h3 className="text-xl font-semibold text-white mb-4">Ulubione gatunki</h3>
                      <div className="space-y-3">
                        {detailedAnalytics.genreBreakdown.slice(0, 5).map((genre, index) => (
                          <div key={genre.genre} className="flex items-center justify-between">
                            <span className="text-neutral-300">{genre.genre}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-32 bg-neutral-700 rounded-full h-2">
                                <div 
                                  className="bg-[#DFBD69] h-2 rounded-full"
                                  style={{ width: `${genre.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-white font-semibold w-12 text-right">
                                {genre.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Decade Progress */}
                    <div className="bg-[#1a1c1e] p-6 rounded-xl border border-neutral-700">
                      <h3 className="text-xl font-semibold text-white mb-4">Eksploracja dekad</h3>
                      <div className="space-y-3">
                        {detailedAnalytics.decadeProgress.map((decade) => (
                          <div key={decade.decade} className="flex items-center justify-between">
                            <span className="text-neutral-300">{decade.decade}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-32 bg-neutral-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-400 h-2 rounded-full"
                                  style={{ width: `${decade.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-white font-semibold w-12 text-right">
                                {decade.count}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Brak danych analitycznych</h3>
                    <p className="text-neutral-400">Obejrzyj więcej filmów, aby zobaczyć szczegółową analitykę!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;