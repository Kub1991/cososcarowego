import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, LogOut, List, BarChart3, Trophy, Target, Clock, Heart, TrendingUp, Star, Film, Calendar, Award } from 'lucide-react';
import { 
  getUserProfile, 
  getUserMovieLists, 
  getUserWatchedMovies, 
  getUserStats, 
  getUserDetailedAnalytics,
  calculateKinoDNA,
  UserProfile, 
  MovieList, 
  UserMovieWatch, 
  UserStats,
  KinoDNA
} from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
  const [movieLists, setMovieLists] = useState<MovieList[]>([]);
  const [watchedMovies, setWatchedMovies] = useState<UserMovieWatch[]>([]);
  const [kinoDNA, setKinoDNA] = useState<KinoDNA | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const [profile, stats, lists, watched, dna] = await Promise.all([
          getUserProfile(user.id),
          getUserStats(user.id),
          getUserMovieLists(user.id),
          getUserWatchedMovies(user.id),
          calculateKinoDNA(user.id)
        ]);

        setUserProfile(profile);
        setUserStats(stats);
        setMovieLists(lists);
        setWatchedMovies(watched);
        setKinoDNA(dna);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user.id]);

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

  const formatWatchTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) return `${hours}h ${remainingMinutes}min`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const tabs = [
    { id: 'overview', label: 'Przegląd', icon: BarChart3 },
    { id: 'lists', label: 'Listy', icon: List },
    { id: 'journey', label: 'Podróż', icon: Trophy },
    { id: 'challenges', label: 'Wyzwania', icon: Target }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070000] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
          <p className="text-white text-lg">Ładowanie panelu...</p>
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
              className="flex items-center gap-2 px-4 py-2 text-neutral-400 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Wyloguj</span>
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
                  <h2 className="text-2xl font-bold text-white mb-6">Przegląd</h2>
                  
                  {/* Stats Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <div className="flex items-center gap-3 mb-2">
                        <Film className="w-6 h-6 text-[#DFBD69]" />
                        <span className="text-neutral-400 text-sm">Obejrzane filmy</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{userStats?.watched_movies || 0}</p>
                    </div>

                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <div className="flex items-center gap-3 mb-2">
                        <Heart className="w-6 h-6 text-[#DFBD69]" />
                        <span className="text-neutral-400 text-sm">Lista do obejrzenia</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{userStats?.watchlist_movies || 0}</p>
                    </div>

                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-6 h-6 text-[#DFBD69]" />
                        <span className="text-neutral-400 text-sm">Łączny czas oglądania</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {userStats?.total_watch_time ? formatWatchTime(userStats.total_watch_time) : '0min'}
                      </p>
                    </div>

                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <div className="flex items-center gap-3 mb-2">
                        <Award className="w-6 h-6 text-[#DFBD69]" />
                        <span className="text-neutral-400 text-sm">Zwycięzcy Oscarów</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{userStats?.total_oscar_winners || 0}</p>
                    </div>
                  </div>

                  {/* Kino DNA Section */}
                  {kinoDNA && (
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Star className="w-6 h-6 text-[#DFBD69]" />
                        Twoje Kino DNA
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Favorite Genres */}
                        <div>
                          <h4 className="text-white font-semibold mb-3">Ulubione gatunki</h4>
                          {kinoDNA.genre_analysis.length > 0 ? (
                            <div className="space-y-2">
                              {kinoDNA.genre_analysis.slice(0, 5).map((genre, index) => (
                                <div key={genre.genre} className="flex items-center justify-between">
                                  <span className="text-neutral-300 text-sm">{genre.genre}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-neutral-700 rounded-full h-2">
                                      <div 
                                        className="bg-[#DFBD69] h-2 rounded-full" 
                                        style={{ width: `${genre.percentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-neutral-400 text-xs w-8">{genre.percentage}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-neutral-400 text-sm">Obejrzyj więcej filmów, aby odkryć swoje preferencje</p>
                          )}
                        </div>

                        {/* Favorite Decades */}
                        <div>
                          <h4 className="text-white font-semibold mb-3">Ulubione dekady</h4>
                          {kinoDNA.decade_analysis.length > 0 ? (
                            <div className="space-y-2">
                              {kinoDNA.decade_analysis.slice(0, 3).map((decade, index) => (
                                <div key={decade.decade} className="flex items-center justify-between">
                                  <span className="text-neutral-300 text-sm">{decade.decade}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-neutral-700 rounded-full h-2">
                                      <div 
                                        className="bg-[#DFBD69] h-2 rounded-full" 
                                        style={{ width: `${decade.percentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-neutral-400 text-xs w-8">{decade.percentage}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-neutral-400 text-sm">Obejrzyj więcej filmów z różnych dekad</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'lists' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Moje listy filmów</h2>
                  
                  {movieLists.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {movieLists.map((list) => (
                        <div key={list.id} className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold">{list.name}</h3>
                            <span className="text-[#DFBD69] text-sm font-medium">{list.movie_count} filmów</span>
                          </div>
                          {list.description && (
                            <p className="text-neutral-400 text-sm mb-4">{list.description}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <List className="w-4 h-4 text-neutral-400" />
                            <span className="text-neutral-400 text-xs">
                              {list.is_public ? 'Lista publiczna' : 'Lista prywatna'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#1a1c1e] p-8 rounded-lg border border-neutral-700 text-center">
                      <List className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                      <h3 className="text-white font-semibold mb-2">Brak list filmów</h3>
                      <p className="text-neutral-400 text-sm">
                        Zacznij dodawać filmy do swoich list, aby śledzić co chcesz obejrzeć.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'journey' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Moja Oscarowa podróż</h2>
                  
                  {watchedMovies.length > 0 ? (
                    <div className="space-y-6">
                      <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                        <h3 className="text-white font-semibold mb-4">Ostatnio obejrzane</h3>
                        <div className="space-y-4">
                          {watchedMovies.slice(0, 5).map((watch) => (
                            <div key={watch.id} className="flex items-center gap-4">
                              <img 
                                src={watch.movie?.poster_path ? `https://image.tmdb.org/t/p/w92${watch.movie.poster_path}` : '/jpiDCxkCbo0.movieposter_maxres.jpg'}
                                alt={watch.movie?.title || 'Movie poster'}
                                className="w-12 h-16 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="text-white font-medium">{watch.movie?.title}</h4>
                                <p className="text-neutral-400 text-sm">
                                  {new Date(watch.watched_at).toLocaleDateString('pl-PL')}
                                </p>
                                {watch.rating && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-4 h-4 text-[#DFBD69]" />
                                    <span className="text-[#DFBD69] text-sm">{watch.rating}/10</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1a1c1e] p-8 rounded-lg border border-neutral-700 text-center">
                      <Trophy className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                      <h3 className="text-white font-semibold mb-2">Rozpocznij swoją podróż</h3>
                      <p className="text-neutral-400 text-sm">
                        Zacznij oglądać filmy oscarowe, aby śledzić swój postęp i odkrywać preferencje.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'challenges' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Wyzwania</h2>
                  
                  <div className="bg-[#1a1c1e] p-8 rounded-lg border border-neutral-700 text-center">
                    <Target className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">Wyzwania wkrótce</h3>
                    <p className="text-neutral-400 text-sm">
                      Pracujemy nad systemem wyzwań, który pozwoli Ci stawiać sobie cele filmowe.
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