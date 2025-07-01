import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, List, BarChart3, Target, LogOut, Trophy, Calendar, TrendingUp, Star, Clock, Award } from 'lucide-react';
import { 
  getUserProfile, 
  getUserMovieLists, 
  getUserWatchedMovies, 
  getUserStats,
  getUserDetailedAnalytics,
  signOutUser,
  type UserProfile,
  type MovieList,
  type UserMovieWatch,
  type UserStats,
  type GenreAnalysis,
  type DecadeAnalysis
} from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserDashboardProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
  initialTab?: 'insights' | 'lists' | 'journey' | 'challenges';
}

type DashboardTab = 'insights' | 'lists' | 'journey' | 'challenges';

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onBack, onLogout, initialTab = 'insights' }) => {
  const [currentTab, setCurrentTab] = useState<DashboardTab>(initialTab);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [movieLists, setMovieLists] = useState<MovieList[]>([]);
  const [watchedMovies, setWatchedMovies] = useState<UserMovieWatch[]>([]);
  const [analytics, setAnalytics] = useState<{
    genreBreakdown: GenreAnalysis[];
    decadeProgress: DecadeAnalysis[];
    watchingTrends: any[];
    topRatedMovies: UserMovieWatch[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const [profile, stats, lists, watched, detailedAnalytics] = await Promise.all([
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
      setAnalytics(detailedAnalytics);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    onLogout();
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

  const formatRuntime = (runtime: number) => {
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return `${hours}h ${minutes}min`;
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
              onClick={handleLogout}
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
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              <button
                onClick={() => setCurrentTab('insights')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  currentTab === 'insights'
                    ? 'bg-[#DFBD69] text-black font-semibold'
                    : 'text-white hover:bg-neutral-800'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Insighty
              </button>
              <button
                onClick={() => setCurrentTab('lists')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  currentTab === 'lists'
                    ? 'bg-[#DFBD69] text-black font-semibold'
                    : 'text-white hover:bg-neutral-800'
                }`}
              >
                <List className="w-5 h-5" />
                Moje listy
              </button>
              <button
                onClick={() => setCurrentTab('journey')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  currentTab === 'journey'
                    ? 'bg-[#DFBD69] text-black font-semibold'
                    : 'text-white hover:bg-neutral-800'
                }`}
              >
                <Trophy className="w-5 h-5" />
                Moja podróż
              </button>
              <button
                onClick={() => setCurrentTab('challenges')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  currentTab === 'challenges'
                    ? 'bg-[#DFBD69] text-black font-semibold'
                    : 'text-white hover:bg-neutral-800'
                }`}
              >
                <Target className="w-5 h-5" />
                Wyzwania
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Insights Tab */}
            {currentTab === 'insights' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">📊 Twoje Insighty</h2>
                  
                  {/* Quick Stats */}
                  {userStats && (
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                        <div className="flex items-center gap-3 mb-2">
                          <Trophy className="w-6 h-6 text-[#DFBD69]" />
                          <span className="text-neutral-400 text-sm">Obejrzane</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{userStats.watched_movies}</p>
                      </div>
                      <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                        <div className="flex items-center gap-3 mb-2">
                          <List className="w-6 h-6 text-[#DFBD69]" />
                          <span className="text-neutral-400 text-sm">Do obejrzenia</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{userStats.watchlist_movies}</p>
                      </div>
                      <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="w-6 h-6 text-[#DFBD69]" />
                          <span className="text-neutral-400 text-sm">Czas oglądania</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatRuntime(userStats.total_watch_time)}</p>
                      </div>
                      <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                        <div className="flex items-center gap-3 mb-2">
                          <Star className="w-6 h-6 text-[#DFBD69]" />
                          <span className="text-neutral-400 text-sm">Średnia ocena</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {userStats.average_rating ? `${userStats.average_rating}/10` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Genre Breakdown */}
                  {analytics?.genreBreakdown && analytics.genreBreakdown.length > 0 && (
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700 mb-8">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#DFBD69]" />
                        Twoje ulubione gatunki
                      </h3>
                      <div className="space-y-3">
                        {analytics.genreBreakdown.slice(0, 5).map((genre, index) => (
                          <div key={genre.genre} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-[#DFBD69] font-bold text-sm">#{index + 1}</span>
                              <span className="text-white font-medium">{genre.genre}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-32 bg-neutral-700 rounded-full h-2">
                                <div 
                                  className="bg-[#DFBD69] h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${genre.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-neutral-400 text-sm w-12 text-right">
                                {genre.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Decade Progress */}
                  {analytics?.decadeProgress && analytics.decadeProgress.length > 0 && (
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700 mb-8">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#DFBD69]" />
                        Eksploracja dekad
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {analytics.decadeProgress.map((decade) => (
                          <div key={decade.decade} className="bg-neutral-800 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">{decade.decade}</span>
                              <span className="text-[#DFBD69] font-bold">{decade.count} filmów</span>
                            </div>
                            <div className="w-full bg-neutral-700 rounded-full h-2">
                              <div 
                                className="bg-[#DFBD69] h-2 rounded-full transition-all duration-500"
                                style={{ width: `${decade.percentage}%` }}
                              ></div>
                            </div>
                            <p className="text-neutral-400 text-xs mt-1">{decade.percentage}% Twoich filmów</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Rated Movies */}
                  {analytics?.topRatedMovies && analytics.topRatedMovies.length > 0 && (
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#DFBD69]" />
                        Twoje najwyżej ocenione filmy
                      </h3>
                      <div className="space-y-3">
                        {analytics.topRatedMovies.map((watch, index) => (
                          <div key={watch.id} className="flex items-center gap-4 p-3 bg-neutral-800 rounded-lg">
                            <span className="text-[#DFBD69] font-bold text-lg w-8">#{index + 1}</span>
                            <div className="flex-1">
                              <h4 className="text-white font-medium">{watch.movie?.title}</h4>
                              <p className="text-neutral-400 text-sm">
                                {watch.movie?.year} • {watch.movie?.oscar_year ? `Oscar ${watch.movie.oscar_year}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-[#DFBD69]" />
                              <span className="text-white font-bold">{watch.rating}/10</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Data State */}
                  {(!analytics || (analytics.genreBreakdown.length === 0 && analytics.topRatedMovies.length === 0)) && (
                    <div className="bg-[#1a1c1e] p-8 rounded-lg border border-neutral-700 text-center">
                      <BarChart3 className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Brak danych do analizy</h3>
                      <p className="text-neutral-400 mb-6">
                        Obejrzyj kilka filmów i oceń je, aby zobaczyć swoje personalne insighty!
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
              </div>
            )}

            {/* Lists Tab */}
            {currentTab === 'lists' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">📝 Moje listy filmów</h2>
                
                {movieLists.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {movieLists.map((list) => (
                      <div key={list.id} className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-white">{list.name}</h3>
                          <span className="bg-[#DFBD69] text-black px-3 py-1 rounded-full text-sm font-medium">
                            {list.movie_count} filmów
                          </span>
                        </div>
                        {list.description && (
                          <p className="text-neutral-400 text-sm mb-4">{list.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <span>{list.is_public ? '🌍 Publiczna' : '🔒 Prywatna'}</span>
                          <span>•</span>
                          <span>Utworzona {new Date(list.created_at).toLocaleDateString('pl-PL')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#1a1c1e] p-8 rounded-lg border border-neutral-700 text-center">
                    <List className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Brak list filmów</h3>
                    <p className="text-neutral-400 mb-6">
                      Twoje listy filmów pojawią się tutaj automatycznie gdy zaczniesz dodawać filmy.
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
            {currentTab === 'journey' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">🏆 Moja Oscarowa podróż</h2>
                
                {watchedMovies.length > 0 ? (
                  <div className="space-y-4">
                    {watchedMovies.slice(0, 10).map((watch) => (
                      <div key={watch.id} className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">{watch.movie?.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-neutral-400 mb-3">
                              <span>{watch.movie?.year}</span>
                              <span>•</span>
                              <span>{watch.movie?.is_best_picture_winner ? '🏆 Zwycięzca' : '🎬 Nominowany'}</span>
                              <span>•</span>
                              <span>Oscar {watch.movie?.oscar_year}</span>
                            </div>
                            {watch.notes && (
                              <p className="text-neutral-300 text-sm mb-3">"{watch.notes}"</p>
                            )}
                            <p className="text-neutral-500 text-xs">
                              Obejrzany {new Date(watch.watched_at).toLocaleDateString('pl-PL')}
                            </p>
                          </div>
                          {watch.rating && (
                            <div className="flex items-center gap-2 bg-neutral-800 px-3 py-2 rounded-lg">
                              <Star className="w-4 h-4 text-[#DFBD69]" />
                              <span className="text-white font-bold">{watch.rating}/10</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#1a1c1e] p-8 rounded-lg border border-neutral-700 text-center">
                    <Trophy className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Rozpocznij swoją podróż</h3>
                    <p className="text-neutral-400 mb-6">
                      Twoja historia oglądania filmów oscarowych pojawi się tutaj.
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

            {/* Challenges Tab */}
            {currentTab === 'challenges' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">🎯 Wyzwania filmowe</h2>
                
                <div className="bg-[#1a1c1e] p-8 rounded-lg border border-neutral-700 text-center">
                  <Target className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Wyzwania wkrótce!</h3>
                  <p className="text-neutral-400 mb-6">
                    Pracujemy nad systemem wyzwań filmowych. Wkrótce będziesz mógł podejmować 
                    różne challenge'e związane z filmami oscarowymi.
                  </p>
                  <div className="space-y-3 text-left max-w-md mx-auto">
                    <div className="flex items-center gap-3 text-neutral-300">
                      <div className="w-2 h-2 bg-[#DFBD69] rounded-full"></div>
                      <span className="text-sm">Challenge dekad (obejrzyj filmy z każdej dekady)</span>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-300">
                      <div className="w-2 h-2 bg-[#DFBD69] rounded-full"></div>
                      <span className="text-sm">Maraton gatunków (eksploruj różne gatunki)</span>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-300">
                      <div className="w-2 h-2 bg-[#DFBD69] rounded-full"></div>
                      <span className="text-sm">Kolekcjoner Oscarów (obejrzyj wszystkich zwycięzców)</span>
                    </div>
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