import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, User, List, Trophy, Target, Heart, Check, Plus, X, Edit3, Trash2 } from 'lucide-react';
import { 
  getUserProfile, 
  getUserMovieLists, 
  getUserWatchedMovies, 
  getUserStats,
  getMoviesInList,
  calculateKinoDNA,
  createUserProfile,
  Movie,
  UserProfile,
  MovieList,
  UserMovieWatch,
  UserStats,
  KinoDNA,
  UserMovieList
} from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserDashboardProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
  initialTab?: 'overview' | 'lists' | 'journey' | 'challenges';
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onBack, onLogout, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'lists' | 'journey' | 'challenges'>(initialTab);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [movieLists, setMovieLists] = useState<MovieList[]>([]);
  const [watchedMovies, setWatchedMovies] = useState<UserMovieWatch[]>([]);
  const [kinoDNA, setKinoDNA] = useState<KinoDNA | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<MovieList | null>(null);
  const [listMovies, setListMovies] = useState<UserMovieList[]>([]);
  const [isLoadingListMovies, setIsLoadingListMovies] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // Get or create user profile
      let profile = await getUserProfile(user.id);
      if (!profile) {
        const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Użytkownik';
        profile = await createUserProfile(user.id, displayName);
      }
      setUserProfile(profile);

      // Load other data in parallel
      const [stats, lists, watched, dna] = await Promise.all([
        getUserStats(user.id),
        getUserMovieLists(user.id),
        getUserWatchedMovies(user.id),
        calculateKinoDNA(user.id)
      ]);

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

  const loadListMovies = async (list: MovieList) => {
    setIsLoadingListMovies(true);
    setSelectedList(list);
    try {
      const movies = await getMoviesInList(list.id);
      setListMovies(movies);
    } catch (error) {
      console.error('Error loading list movies:', error);
      setListMovies([]);
    } finally {
      setIsLoadingListMovies(false);
    }
  };

  const formatPosterUrl = (posterPath: string | null | undefined) => {
    if (!posterPath) return '/jpiDCxkCbo0.movieposter_maxres.jpg';
    return `https://image.tmdb.org/t/p/w300${posterPath}`;
  };

  const formatRuntime = (runtime: number | null | undefined) => {
    if (!runtime) return 'Nieznany czas';
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return `${hours}h ${minutes}min`;
  };

  const getUserDisplayName = () => {
    return userProfile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Użytkownik';
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
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-[#DFBD69] text-black font-semibold'
                    : 'text-white hover:bg-neutral-800'
                }`}
              >
                <User className="w-5 h-5" />
                Przegląd
              </button>
              <button
                onClick={() => setActiveTab('lists')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'lists'
                    ? 'bg-[#DFBD69] text-black font-semibold'
                    : 'text-white hover:bg-neutral-800'
                }`}
              >
                <List className="w-5 h-5" />
                Moje listy
              </button>
              <button
                onClick={() => setActiveTab('journey')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'journey'
                    ? 'bg-[#DFBD69] text-black font-semibold'
                    : 'text-white hover:bg-neutral-800'
                }`}
              >
                <Trophy className="w-5 h-5" />
                Moja podróż
              </button>
              <button
                onClick={() => setActiveTab('challenges')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'challenges'
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
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Przegląd konta</h2>
                  
                  {/* Stats Cards */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <div className="flex items-center gap-3 mb-2">
                        <Check className="w-5 h-5 text-[#DFBD69]" />
                        <span className="text-neutral-400 text-sm">Obejrzane</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{userStats?.watched_movies || 0}</p>
                    </div>
                    
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <div className="flex items-center gap-3 mb-2">
                        <Heart className="w-5 h-5 text-[#DFBD69]" />
                        <span className="text-neutral-400 text-sm">Na liście</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{userStats?.watchlist_movies || 0}</p>
                    </div>
                    
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-5 h-5 text-[#DFBD69]" />
                        <span className="text-neutral-400 text-sm">Zwycięzcy</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{userStats?.total_oscar_winners || 0}</p>
                    </div>
                    
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-5 h-5 text-[#DFBD69]" />
                        <span className="text-neutral-400 text-sm">Poziom</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{userProfile?.level || 1}</p>
                    </div>
                  </div>

                  {/* Kino DNA */}
                  {kinoDNA && (
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700 mb-8">
                      <h3 className="text-xl font-bold text-white mb-4">🧬 Twoje Kino DNA</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-[#DFBD69] font-semibold mb-3">Ulubione gatunki</h4>
                          <div className="space-y-2">
                            {kinoDNA.genre_analysis.slice(0, 5).map((genre, index) => (
                              <div key={genre.genre} className="flex items-center justify-between">
                                <span className="text-white text-sm">{genre.genre}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-2 bg-neutral-700 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-[#DFBD69] rounded-full"
                                      style={{ width: `${genre.percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-neutral-400 text-xs w-8">{genre.percentage}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[#DFBD69] font-semibold mb-3">Ulubione dekady</h4>
                          <div className="space-y-2">
                            {kinoDNA.decade_analysis.slice(0, 3).map((decade, index) => (
                              <div key={decade.decade} className="flex items-center justify-between">
                                <span className="text-white text-sm">{decade.decade}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-2 bg-neutral-700 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-[#DFBD69] rounded-full"
                                      style={{ width: `${decade.percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-neutral-400 text-xs w-8">{decade.percentage}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  {watchedMovies.length > 0 && (
                    <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                      <h3 className="text-xl font-bold text-white mb-4">Ostatnio obejrzane</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {watchedMovies.slice(0, 6).map((watch) => (
                          <div key={watch.id} className="flex gap-3 p-3 bg-neutral-800 rounded-lg">
                            <img 
                              src={formatPosterUrl(watch.movie?.poster_path)}
                              alt={watch.movie?.title}
                              className="w-12 h-16 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium text-sm truncate">
                                {watch.movie?.title}
                              </h4>
                              <p className="text-neutral-400 text-xs">
                                {watch.movie?.year}
                              </p>
                              {watch.rating && (
                                <p className="text-[#DFBD69] text-xs">
                                  ⭐ {watch.rating}/10
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lists Tab */}
            {activeTab === 'lists' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Moje listy filmów</h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#DFBD69] text-black rounded-lg hover:bg-[#E8C573] transition-colors">
                    <Plus className="w-5 h-5" />
                    Nowa lista
                  </button>
                </div>

                {selectedList ? (
                  // List Detail View
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedList(null)}
                        className="p-2 text-neutral-400 hover:text-white transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h3 className="text-xl font-bold text-white">{selectedList.name}</h3>
                        <p className="text-neutral-400">{listMovies.length} filmów</p>
                      </div>
                    </div>

                    {isLoadingListMovies ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listMovies.map((listMovie) => (
                          <div key={listMovie.id} className="bg-[#1a1c1e] rounded-lg border border-neutral-700 overflow-hidden">
                            <img 
                              src={formatPosterUrl(listMovie.movie?.poster_path)}
                              alt={listMovie.movie?.title}
                              className="w-full h-64 object-cover"
                            />
                            <div className="p-4">
                              <h4 className="text-white font-semibold mb-2 truncate">
                                {listMovie.movie?.title}
                              </h4>
                              <div className="flex items-center justify-between text-sm text-neutral-400 mb-3">
                                <span>{listMovie.movie?.year}</span>
                                <span>{formatRuntime(listMovie.movie?.runtime)}</span>
                              </div>
                              <div className="flex gap-2">
                                <button className="flex-1 px-3 py-2 bg-neutral-700 text-white rounded text-xs hover:bg-neutral-600 transition-colors">
                                  <Edit3 className="w-3 h-3 inline mr-1" />
                                  Edytuj
                                </button>
                                <button className="px-3 py-2 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Lists Overview
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {movieLists.map((list) => (
                      <div 
                        key={list.id}
                        onClick={() => loadListMovies(list)}
                        className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700 cursor-pointer hover:border-[#DFBD69] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-white font-semibold">{list.name}</h3>
                          {list.is_default && (
                            <span className="px-2 py-1 bg-[#DFBD69] text-black text-xs rounded">
                              Domyślna
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-400 text-sm mb-4">
                          {list.description || 'Brak opisu'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400 text-sm">
                            {list.movie_count} filmów
                          </span>
                          <span className="text-[#DFBD69] text-sm">
                            Zobacz →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Journey Tab */}
            {activeTab === 'journey' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-white">Moja Oscarowa podróż</h2>
                
                <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                  <h3 className="text-xl font-bold text-white mb-4">Postęp w dekadach</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white">Lata 2000-2009</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-neutral-700 rounded-full overflow-hidden">
                          <div className="w-1/3 h-full bg-[#DFBD69] rounded-full"></div>
                        </div>
                        <span className="text-neutral-400 text-sm">18/55</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white">Lata 2010-2019</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-neutral-700 rounded-full overflow-hidden">
                          <div className="w-1/4 h-full bg-[#DFBD69] rounded-full"></div>
                        </div>
                        <span className="text-neutral-400 text-sm">22/90</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                  <h3 className="text-xl font-bold text-white mb-4">Osiągnięcia</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
                      <div className="w-10 h-10 bg-[#DFBD69] rounded-full flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Pierwszy krok</h4>
                        <p className="text-neutral-400 text-sm">Obejrzyj pierwszy film</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg opacity-50">
                      <div className="w-10 h-10 bg-neutral-600 rounded-full flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-neutral-400" />
                      </div>
                      <div>
                        <h4 className="text-neutral-400 font-medium">Kinoman</h4>
                        <p className="text-neutral-500 text-sm">Obejrzyj 50 filmów</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Challenges Tab */}
            {activeTab === 'challenges' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Wyzwania</h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#DFBD69] text-black rounded-lg hover:bg-[#E8C573] transition-colors">
                    <Plus className="w-5 h-5" />
                    Nowe wyzwanie
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">Dekada 2000s</h3>
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                        Aktywne
                      </span>
                    </div>
                    <p className="text-neutral-400 text-sm mb-4">
                      Obejrzyj wszystkie filmy z lat 2000-2009
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-400 text-sm">Postęp</span>
                      <span className="text-white text-sm">18/55</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-[#DFBD69] rounded-full"></div>
                    </div>
                  </div>

                  <div className="bg-[#1a1c1e] p-6 rounded-lg border border-neutral-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">Mistrz gatunków</h3>
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                        Ukończone
                      </span>
                    </div>
                    <p className="text-neutral-400 text-sm mb-4">
                      Obejrzyj filmy z 5 różnych gatunków
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-400 text-sm">Postęp</span>
                      <span className="text-white text-sm">5/5</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-green-500 rounded-full"></div>
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