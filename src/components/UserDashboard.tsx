import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Star, 
  Trophy, 
  Target, 
  TrendingUp, 
  Play, 
  Plus,
  CheckCircle,
  Clock,
  BarChart3,
  Award,
  Users,
  Calendar,
  Eye,
  Heart,
  BookOpen,
  Zap,
  X,
  Edit,
  Trash2,
  ChevronRight,
  Brain,
  Timer,
  ThumbsUp,
  Film,
  Medal
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { 
  getUserProfile, 
  getUserMovieLists, 
  getUserWatchedMovies, 
  getUserStats,
  getUserDetailedAnalytics,
  calculateKinoDNA,
  addMovieToList,
  markMovieAsWatched,
  getOrCreateDefaultListId,
  type UserProfile,
  type MovieList,
  type UserStats,
  type UserMovieWatch,
  type UserMovieList,
  type KinoDNA,
  supabase
} from '../lib/supabase';

interface UserDashboardProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
  initialTab?: DashboardTab;
}

type DashboardTab = 'overview' | 'lists' | 'journey' | 'challenges' | 'analytics';
type ListViewMode = 'overview' | 'detail' | 'create';

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onBack, onLogout, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [movieLists, setMovieLists] = useState<MovieList[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [watchedMovies, setWatchedMovies] = useState<UserMovieWatch[]>([]);
  const [kinoDNA, setKinoDNA] = useState<KinoDNA | null>(null);
  const [detailedAnalytics, setDetailedAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // New states for list management
  const [listViewMode, setListViewMode] = useState<ListViewMode>('overview');
  const [selectedList, setSelectedList] = useState<MovieList | null>(null);
  const [listMovies, setListMovies] = useState<UserMovieList[]>([]);
  const [isLoadingListMovies, setIsLoadingListMovies] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const [profile, lists, stats, watched, kino, analytics] = await Promise.all([
        getUserProfile(user.id),
        getUserMovieLists(user.id),
        getUserStats(user.id),
        getUserWatchedMovies(user.id),
        calculateKinoDNA(user.id),
        getUserDetailedAnalytics(user.id)
      ]);

      setUserProfile(profile);
      setMovieLists(lists);
      setUserStats(stats);
      setWatchedMovies(watched);
      setKinoDNA(kino);
      setDetailedAnalytics(analytics);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadListMovies = async (listId: string) => {
    setIsLoadingListMovies(true);
    try {
      const { data, error } = await supabase
        .from('user_list_movies')
        .select(`
          *,
          movies (*)
        `)
        .eq('list_id', listId)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error loading list movies:', error);
        return;
      }

      setListMovies(data || []);
    } catch (error) {
      console.error('Error in loadListMovies:', error);
    } finally {
      setIsLoadingListMovies(false);
    }
  };

  const handleListClick = async (list: MovieList) => {
    setSelectedList(list);
    setListViewMode('detail');
    await loadListMovies(list.id);
  };

  const createNewList = async () => {
    if (!newListName.trim()) return;
    
    setIsCreatingList(true);
    try {
      const { data, error } = await supabase
        .from('user_movie_lists')
        .insert({
          user_id: user.id,
          name: newListName.trim(),
          description: newListDescription.trim() || null,
          is_default: false,
          is_public: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating list:', error);
        return;
      }

      // Refresh lists
      await loadUserData();
      
      // Reset form
      setNewListName('');
      setNewListDescription('');
      setListViewMode('overview');
    } catch (error) {
      console.error('Error in createNewList:', error);
    } finally {
      setIsCreatingList(false);
    }
  };

  const removeFromList = async (listMovieId: string) => {
    try {
      const { error } = await supabase
        .from('user_list_movies')
        .delete()
        .eq('id', listMovieId);

      if (error) {
        console.error('Error removing from list:', error);
        return;
      }

      // Refresh list movies and stats
      if (selectedList) {
        await loadListMovies(selectedList.id);
        await loadUserData(); // Refresh stats
      }
    } catch (error) {
      console.error('Error in removeFromList:', error);
    }
  };

  const getUserDisplayName = () => {
    if (userProfile?.display_name) return userProfile.display_name;
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.email) return user.email.split('@')[0];
    return 'Kinoman';
  };

  const getUserLevel = () => {
    if (!userStats) return 1;
    const watchedCount = userStats.watched_movies;
    if (watchedCount >= 50) return 5;
    if (watchedCount >= 30) return 4;
    if (watchedCount >= 15) return 3;
    if (watchedCount >= 5) return 2;
    return 1;
  };

  const getLevelName = (level: number) => {
    const levels = {
      1: 'Początkujący kinoman',
      2: 'Entuzjasta kina',
      3: 'Doświadczony widz',
      4: 'Ekspert filmowy',
      5: 'Mistrz Oscarów'
    };
    return levels[level as keyof typeof levels] || 'Kinoman';
  };

  const getProgressToNextLevel = () => {
    if (!userStats) return 0;
    const watchedCount = userStats.watched_movies;
    const currentLevel = getUserLevel();
    const thresholds = [0, 5, 15, 30, 50];
    
    if (currentLevel >= 5) return 100;
    
    const currentThreshold = thresholds[currentLevel - 1];
    const nextThreshold = thresholds[currentLevel];
    const progress = ((watchedCount - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    
    return Math.min(Math.max(progress, 0), 100);
  };

  const formatPosterUrl = (posterPath: string | null | undefined) => {
    if (!posterPath) return '/jpiDCxkCbo0.movieposter_maxres.jpg';
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  const formatRuntime = (runtime: number | null | undefined) => {
    if (!runtime) return 'Nieznany czas';
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return `${hours}h ${minutes}min`;
  };

  const formatOscarStatus = (movie: any) => {
    if (!movie) return 'Film oscarowy';
    
    const year = movie.oscar_year || 'nieznany rok';
    
    if (movie.is_best_picture_winner) {
      return `Zwycięzca Oscara ${year}`;
    } else {
      return `Nominowany do Oscara ${year}`;
    }
  };

  const formatWatchTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
  };

  const getDecadeDisplayName = (decade: string) => {
    const decadeNames: { [key: string]: string } = {
      '2000s': 'Lata 2000-2009',
      '2010s': 'Lata 2010-2019',
      '1990s': 'Lata 1990-1999',
      '1980s': 'Lata 1980-1989',
      '1970s': 'Lata 1970-1979',
      '1960s': 'Lata 1960-1969',
      '1950s': 'Lata 1950-1959',
      '1940s': 'Lata 1940-1949',
      '1930s': 'Lata 1930-1939'
    };
    return decadeNames[decade] || decade;
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
      <div className="bg-[#0a0a0a] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Powrót</span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#DFBD69] to-[#E8C573] flex items-center justify-center">
                  <span className="text-black font-bold text-lg">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl">{getUserDisplayName()}</h1>
                  <p className="text-[#DFBD69] text-sm">
                    {getLevelName(getUserLevel())} • Level {getUserLevel()}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
            >
              Wyloguj się
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[#0a0a0a] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Przegląd', icon: BarChart3 },
              { id: 'lists', label: 'Moje listy', icon: Heart },
              { id: 'journey', label: 'Moja podróż', icon: TrendingUp },
              { id: 'challenges', label: 'Wyzwania', icon: Trophy }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as DashboardTab);
                    if (tab.id === 'lists') {
                      setListViewMode('overview');
                      setSelectedList(null);
                    }
                  }}
                  className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#DFBD69] text-[#DFBD69]'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div 
                className="p-6 rounded-xl border border-neutral-800"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-8 h-8 text-[#DFBD69]" />
                  <div>
                    <p className="text-[#DFBD69] font-semibold text-2xl">
                      {userStats?.watched_movies || 0}
                    </p>
                    <p className="text-neutral-300 text-sm">Obejrzane filmy</p>
                  </div>
                </div>
              </div>

              <div 
                className="p-6 rounded-xl border border-neutral-800"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-8 h-8 text-[#DFBD69]" />
                  <div>
                    <p className="text-[#DFBD69] font-semibold text-2xl">
                      {userStats?.watchlist_movies || 0}
                    </p>
                    <p className="text-neutral-300 text-sm">Lista do obejrzenia</p>
                  </div>
                </div>
              </div>

              <div 
                className="p-6 rounded-xl border border-neutral-800"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Timer className="w-8 h-8 text-[#DFBD69]" />
                  <div>
                    <p className="text-[#DFBD69] font-semibold text-2xl">
                      {formatWatchTime(userStats?.total_watch_time || 0)}
                    </p>
                    <p className="text-neutral-300 text-sm">Czas oglądania</p>
                  </div>
                </div>
              </div>

              <div 
                className="p-6 rounded-xl border border-neutral-800"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8 text-[#DFBD69]" />
                  <div>
                    <p className="text-[#DFBD69] font-semibold text-2xl">
                      {userStats?.total_oscar_winners || 0}
                    </p>
                    <p className="text-neutral-300 text-sm">Zwycięzcy Oscarów</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Level Progress */}
            <div 
              className="p-6 rounded-xl border border-neutral-800"
              style={{
                background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-[#DFBD69]" />
                  <div>
                    <h3 className="text-white font-semibold">Postęp poziomu</h3>
                    <p className="text-neutral-300 text-sm">{getLevelName(getUserLevel())}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[#DFBD69] font-bold text-lg">Level {getUserLevel()}</p>
                  {getUserLevel() < 5 && (
                    <p className="text-neutral-400 text-sm">
                      {Math.ceil(getProgressToNextLevel())}% do Level {getUserLevel() + 1}
                    </p>
                  )}
                </div>
              </div>
              
              {getUserLevel() < 5 && (
                <div className="w-full bg-neutral-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-[#DFBD69] to-[#E8C573] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressToNextLevel()}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button className="p-6 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition-colors text-left">
                <Play className="w-8 h-8 text-[#DFBD69] mb-3" />
                <h3 className="text-white font-semibold mb-2">Szybki strzał</h3>
                <p className="text-neutral-400 text-sm">Znajdź losowy film do obejrzenia</p>
              </button>

              <button className="p-6 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition-colors text-left">
                <Target className="w-8 h-8 text-[#DFBD69] mb-3" />
                <h3 className="text-white font-semibold mb-2">Smart Match</h3>
                <p className="text-neutral-400 text-sm">Dopasowane rekomendacje AI</p>
              </button>

              <button 
                onClick={() => {
                  setActiveTab('lists');
                  setListViewMode('create');
                }}
                className="p-6 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition-colors text-left"
              >
                <Plus className="w-8 h-8 text-[#DFBD69] mb-3" />
                <h3 className="text-white font-semibold mb-2">Nowa lista</h3>
                <p className="text-neutral-400 text-sm">Stwórz tematyczną playlistę</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'lists' && (
          <div className="space-y-6">
            {listViewMode === 'overview' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Moje listy filmów</h2>
                  <button 
                    onClick={() => setListViewMode('create')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#DFBD69] text-black rounded-lg hover:bg-[#E8C573] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Nowa lista
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Show user's actual lists */}
                  {movieLists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => handleListClick(list)}
                      className={`p-6 rounded-xl border border-neutral-800 hover:bg-neutral-800 transition-colors text-left ${
                        list.is_default 
                          ? 'bg-gradient-to-br from-[#DFBD69]/20 to-transparent border-[#DFBD69]/30' 
                          : 'bg-neutral-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        {list.name === 'Do obejrzenia' ? (
                          <Heart className="w-8 h-8 text-[#DFBD69]" />
                        ) : list.name === 'Obejrzane' ? (
                          <CheckCircle className="w-8 h-8 text-[#DFBD69]" />
                        ) : (
                          <BookOpen className="w-8 h-8 text-[#DFBD69]" />
                        )}
                        <ChevronRight className="w-5 h-5 text-neutral-400" />
                      </div>
                      
                      <h3 className="text-white font-semibold mb-2">{list.name}</h3>
                      <p className="text-neutral-300 text-sm mb-2">
                        {list.movie_count || 0} filmów
                      </p>
                      {list.description && (
                        <p className="text-neutral-400 text-xs line-clamp-2">
                          {list.description}
                        </p>
                      )}
                    </button>
                  ))}

                  {/* Create new list tile */}
                  <button 
                    onClick={() => setListViewMode('create')}
                    className="p-6 rounded-xl border border-neutral-800 border-dashed bg-transparent hover:bg-neutral-900 transition-colors text-left"
                  >
                    <Plus className="w-8 h-8 text-neutral-400 mb-4" />
                    <h3 className="text-white font-semibold mb-2">Nowa lista</h3>
                    <p className="text-neutral-400 text-sm">
                      Stwórz tematyczną playlistę
                    </p>
                  </button>
                </div>
              </>
            )}

            {listViewMode === 'create' && (
              <div className="max-w-md mx-auto">
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => setListViewMode('overview')}
                    className="p-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-white">Nowa lista</h2>
                </div>

                <div 
                  className="p-6 rounded-xl border border-neutral-800 space-y-6"
                  style={{
                    background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                  }}
                >
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Nazwa listy
                    </label>
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="np. Filmy na zimowy wieczór"
                      className="w-full px-4 py-3 bg-[#070000] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-[#DFBD69] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Opis (opcjonalny)
                    </label>
                    <textarea
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      placeholder="Krótki opis twojej listy..."
                      rows={3}
                      className="w-full px-4 py-3 bg-[#070000] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-[#DFBD69] focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={createNewList}
                      disabled={!newListName.trim() || isCreatingList}
                      className="flex-1 bg-[#DFBD69] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#E8C573] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingList ? 'Tworzenie...' : 'Utwórz listę'}
                    </button>
                    <button
                      onClick={() => setListViewMode('overview')}
                      className="px-6 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              </div>
            )}

            {listViewMode === 'detail' && selectedList && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => setListViewMode('overview')}
                    className="p-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedList.name}</h2>
                    {selectedList.description && (
                      <p className="text-neutral-400 text-sm">{selectedList.description}</p>
                    )}
                  </div>
                </div>

                {isLoadingListMovies ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 mx-auto border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent mb-4"></div>
                    <p className="text-neutral-400">Ładowanie filmów...</p>
                  </div>
                ) : listMovies.length === 0 ? (
                  <div 
                    className="text-center py-12 rounded-xl border border-neutral-800"
                    style={{
                      background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                    }}
                  >
                    <Heart className="w-16 h-16 text-[#DFBD69] mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">Lista jest pusta</h3>
                    <p className="text-neutral-300 text-sm">
                      Dodaj filmy do tej listy używając przycisków "Dodaj do listy" w aplikacji
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listMovies.map((listMovie) => (
                      <div 
                        key={listMovie.id}
                        className="p-4 rounded-xl border border-neutral-800 bg-neutral-900"
                      >
                        <div className="flex gap-4">
                          <img 
                            src={formatPosterUrl(listMovie.movie?.poster_path)}
                            alt={`${listMovie.movie?.title || 'Film'} Poster`}
                            className="w-16 h-24 object-cover rounded flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-white font-semibold text-sm leading-tight">
                                {listMovie.movie?.title || 'Nieznany tytuł'}
                              </h4>
                              <button
                                onClick={() => removeFromList(listMovie.id)}
                                className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-neutral-400 text-xs mb-1">
                              {formatOscarStatus(listMovie.movie)} • {formatRuntime(listMovie.movie?.runtime)}
                            </p>
                            {listMovie.movie?.vote_average && (
                              <p className="text-neutral-500 text-xs mb-2">
                                ⭐ {listMovie.movie.vote_average}/10
                              </p>
                            )}
                            <p className="text-neutral-500 text-xs">
                              Dodano: {new Date(listMovie.added_at).toLocaleDateString('pl-PL')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'journey' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Moja Oscarowa podróż</h2>
            
            {/* Enhanced Kino DNA Section */}
            {kinoDNA && kinoDNA.total_movies_analyzed > 0 && (
              <div 
                className="p-6 rounded-xl border border-neutral-800"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Brain className="w-8 h-8 text-[#DFBD69]" />
                  <div>
                    <h3 className="text-white font-semibold text-lg">Twoje Kino DNA</h3>
                    <p className="text-neutral-300 text-sm">
                      Analiza na podstawie {kinoDNA.total_movies_analyzed} obejrzanych filmów
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Favorite Genres */}
                  <div>
                    <h4 className="text-[#DFBD69] font-semibold mb-4">Ulubione gatunki</h4>
                    <div className="space-y-3">
                      {kinoDNA.genre_analysis.slice(0, 5).map((genre, index) => (
                        <div key={genre.genre} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#DFBD69] text-black text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="text-white text-sm">{genre.genre}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-neutral-700 rounded-full h-2">
                              <div 
                                className="bg-[#DFBD69] h-2 rounded-full transition-all duration-500"
                                style={{ width: `${genre.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-[#DFBD69] text-sm font-medium w-8">
                              {genre.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Favorite Decades */}
                  <div>
                    <h4 className="text-[#DFBD69] font-semibold mb-4">Ulubione dekady</h4>
                    <div className="space-y-3">
                      {kinoDNA.decade_analysis.slice(0, 4).map((decade, index) => (
                        <div key={decade.decade} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#DFBD69] text-black text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="text-white text-sm">{getDecadeDisplayName(decade.decade)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-neutral-700 rounded-full h-2">
                              <div 
                                className="bg-[#DFBD69] h-2 rounded-full transition-all duration-500"
                                style={{ width: `${decade.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-[#DFBD69] text-sm font-medium w-8">
                              {decade.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Progress by Decades */}
            <div 
              className="p-6 rounded-xl border border-neutral-800"
              style={{
                background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
              }}
            >
              <h3 className="text-white font-semibold mb-4">Postęp według dekad</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Lata 2000-2009</span>
                  <span className="text-[#DFBD69]">
                    {watchedMovies.filter(w => w.movie?.oscar_year && w.movie.oscar_year >= 2001 && w.movie.oscar_year <= 2010).length}/55 filmów
                  </span>
                </div>
                <div className="w-full bg-neutral-700 rounded-full h-2">
                  <div 
                    className="bg-[#DFBD69] h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (watchedMovies.filter(w => w.movie?.oscar_year && w.movie.oscar_year >= 2001 && w.movie.oscar_year <= 2010).length / 55) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Lata 2010-2019</span>
                  <span className="text-[#DFBD69]">
                    {watchedMovies.filter(w => w.movie?.oscar_year && w.movie.oscar_year >= 2011 && w.movie.oscar_year <= 2020).length}/90 filmów
                  </span>
                </div>
                <div className="w-full bg-neutral-700 rounded-full h-2">
                  <div 
                    className="bg-[#DFBD69] h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (watchedMovies.filter(w => w.movie?.oscar_year && w.movie.oscar_year >= 2011 && w.movie.oscar_year <= 2020).length / 90) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Recently Watched Movies */}
            {watchedMovies.length > 0 && (
              <div 
                className="p-6 rounded-xl border border-neutral-800"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <h3 className="text-white font-semibold mb-4">Ostatnio obejrzane filmy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {watchedMovies.slice(0, 6).map((watch) => (
                    <div key={watch.id} className="flex gap-3 p-3 rounded-lg bg-neutral-800/50">
                      <img 
                        src={formatPosterUrl(watch.movie?.poster_path)}
                        alt={`${watch.movie?.title || 'Film'} Poster`}
                        className="w-12 h-16 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm leading-tight mb-1">
                          {watch.movie?.title || 'Nieznany tytuł'}
                        </h4>
                        <p className="text-neutral-400 text-xs mb-1">
                          {watch.movie?.oscar_year || 'Nieznany rok'} • {formatRuntime(watch.movie?.runtime)}
                        </p>
                        {watch.rating && (
                          <p className="text-[#DFBD69] text-xs mb-1">
                            ⭐ {watch.rating}/10
                          </p>
                        )}
                        <p className="text-neutral-500 text-xs">
                          {new Date(watch.watched_at).toLocaleDateString('pl-PL')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {watchedMovies.length > 6 && (
                  <div className="text-center mt-4">
                    <button className="text-[#DFBD69] hover:text-white transition-colors text-sm">
                      Zobacz wszystkie ({watchedMovies.length}) →
                    </button>
                  </div>
                )}
              </div>
            )}

            {watchedMovies.length === 0 && (
              <div 
                className="p-8 rounded-xl border border-neutral-800 text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <Eye className="w-16 h-16 text-[#DFBD69] mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Rozpocznij swoją podróż</h3>
                <p className="text-neutral-300 text-sm mb-4">
                  Zacznij oglądać filmy oscarowe, aby śledzić swój postęp
                </p>
                <button className="bg-[#DFBD69] text-black font-semibold py-2 px-6 rounded-lg hover:bg-[#E8C573] transition-colors">
                  Znajdź pierwszy film
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Wyzwania i osiągnięcia</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className="p-6 rounded-xl border border-neutral-800"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <Trophy className="w-8 h-8 text-[#DFBD69] mb-4" />
                <h3 className="text-white font-semibold mb-2">Challenge Dekady 2000s</h3>
                <p className="text-neutral-300 text-sm mb-4">
                  Obejrzyj wszystkie 55 filmów z lat 2000-2009
                </p>
                <div className="w-full bg-neutral-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-[#DFBD69] h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (watchedMovies.filter(w => w.movie?.oscar_year && w.movie.oscar_year >= 2001 && w.movie.oscar_year <= 2010).length / 55) * 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-[#DFBD69] text-sm">
                  {watchedMovies.filter(w => w.movie?.oscar_year && w.movie.oscar_year >= 2001 && w.movie.oscar_year <= 2010).length}/55 ukończone
                </p>
              </div>

              <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900">
                <Award className="w-8 h-8 text-neutral-400 mb-4" />
                <h3 className="text-white font-semibold mb-2">Pierwsze kroki</h3>
                <p className="text-neutral-300 text-sm mb-4">
                  Obejrzyj swój pierwszy film oscarowy
                </p>
                <div className="w-full bg-neutral-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-[#DFBD69] h-2 rounded-full" 
                    style={{ width: watchedMovies.length > 0 ? '100%' : '0%' }}
                  ></div>
                </div>
                <p className="text-[#DFBD69] text-sm">
                  {watchedMovies.length > 0 ? '✓ Ukończone!' : '0/1 ukończone'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Zaawansowana analityka</h2>
            
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div 
                className="p-6 rounded-xl border border-neutral-800"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <Timer className="w-8 h-8 text-[#DFBD69] mb-3" />
                <p className="text-[#DFBD69] font-bold text-2xl">
                  {formatWatchTime(userStats?.total_watch_time || 0)}
                </p>
                <p className="text-neutral-300 text-sm">Łączny czas oglądania</p>
              </div>

              <div 
                className="p-6 rounded-xl border border-neutral-800"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <ThumbsUp className="w-8 h-8 text-[#DFBD69] mb-3" />
                <p className="text-[#DFBD69] font-bold text-2xl">
                  {userStats?.average_rating ? `${userStats.average_rating}/10` : 'N/A'}
                </p>
                <p className="text-neutral-300 text-sm">Średnia ocena</p>
              </div>

              <div 
                className="p-6 rounded-xl border border-neutral-800"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <Medal className="w-8 h-8 text-[#DFBD69] mb-3" />
                <p className="text-[#DFBD69] font-bold text-2xl">
                  {userStats?.total_oscar_winners || 0}
                </p>
                <p className="text-neutral-300 text-sm">Zwycięzcy Oscarów</p>
              </div>

              <div 
                className="p-6 rounded-xl border border-neutral-800"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <Film className="w-8 h-8 text-[#DFBD69] mb-3" />
                <p className="text-[#DFBD69] font-bold text-2xl">
                  {userStats?.total_nominees || 0}
                </p>
                <p className="text-neutral-300 text-sm">Nominowani</p>
              </div>
            </div>

            {/* Detailed Kino DNA */}
            {kinoDNA && kinoDNA.total_movies_analyzed > 0 && (
              <div 
                className="p-6 rounded-xl border border-neutral-800"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Brain className="w-8 h-8 text-[#DFBD69]" />
                  <div>
                    <h3 className="text-white font-semibold text-lg">Szczegółowa analiza Kino DNA</h3>
                    <p className="text-neutral-300 text-sm">
                      Ostatnia aktualizacja: {new Date(kinoDNA.last_updated).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* All Genres */}
                  <div>
                    <h4 className="text-[#DFBD69] font-semibold mb-4">
                      Rozkład gatunków ({kinoDNA.genre_analysis.length} gatunków)
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {kinoDNA.genre_analysis.map((genre, index) => (
                        <div key={genre.genre} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-neutral-400 w-6">#{index + 1}</span>
                            <span className="text-white">{genre.genre}</span>
                            <span className="text-neutral-500">({genre.count} filmów)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-neutral-700 rounded-full h-1.5">
                              <div 
                                className="bg-[#DFBD69] h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${genre.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-[#DFBD69] font-medium w-8">
                              {genre.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* All Decades */}
                  <div>
                    <h4 className="text-[#DFBD69] font-semibold mb-4">
                      Rozkład dekad ({kinoDNA.decade_analysis.length} dekad)
                    </h4>
                    <div className="space-y-3">
                      {kinoDNA.decade_analysis.map((decade, index) => (
                        <div key={decade.decade} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-neutral-400 w-6">#{index + 1}</span>
                            <span className="text-white">{getDecadeDisplayName(decade.decade)}</span>
                            <span className="text-neutral-500">({decade.count} filmów)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-neutral-700 rounded-full h-1.5">
                              <div 
                                className="bg-[#DFBD69] h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${decade.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-[#DFBD69] font-medium w-8">
                              {decade.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Rated Movies */}
            {detailedAnalytics?.topRatedMovies && detailedAnalytics.topRatedMovies.length > 0 && (
              <div 
                className="p-6 rounded-xl border border-neutral-800"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <h3 className="text-white font-semibold mb-4">Twoje najwyżej ocenione filmy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {detailedAnalytics.topRatedMovies.map((watch) => (
                    <div key={watch.id} className="flex gap-3 p-3 rounded-lg bg-neutral-800/50">
                      <img 
                        src={formatPosterUrl(watch.movie?.poster_path)}
                        alt={`${watch.movie?.title || 'Film'} Poster`}
                        className="w-12 h-16 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm leading-tight mb-1">
                          {watch.movie?.title || 'Nieznany tytuł'}
                        </h4>
                        <p className="text-neutral-400 text-xs mb-1">
                          {watch.movie?.oscar_year || 'Nieznany rok'}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="text-[#DFBD69] text-sm font-bold">
                            ⭐ {watch.rating}/10
                          </div>
                          {watch.movie?.is_best_picture_winner && (
                            <div className="text-xs bg-[#DFBD69] text-black px-1 rounded">
                              🏆
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!kinoDNA || kinoDNA.total_movies_analyzed === 0) && (
              <div 
                className="p-8 rounded-xl border border-neutral-800 text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                }}
              >
                <Brain className="w-16 h-16 text-[#DFBD69] mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Rozpocznij swoją analizę</h3>
                <p className="text-neutral-300 text-sm mb-4">
                  Obejrzyj więcej filmów, aby zobaczyć szczegółową analizę swoich preferencji
                </p>
                <button className="bg-[#DFBD69] text-black font-semibold py-2 px-6 rounded-lg hover:bg-[#E8C573] transition-colors">
                  Znajdź film do obejrzenia
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;