import React, { useState, useEffect } from 'react';
import { User, Film, Calendar, Trophy, Target, List, Plus, ArrowLeft, Star, Clock, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  total_watched: number;
  current_streak: number;
  longest_streak: number;
  favorite_genres: string[];
  favorite_decades: string[];
  bio: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface MovieList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  movie_count?: number;
}

interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  description: string | null;
  icon: string | null;
  earned_at: string;
  progress: number;
  max_progress: number;
  is_completed: boolean;
}

interface Challenge {
  id: string;
  user_id: string;
  challenge_type: string;
  challenge_name: string;
  description: string | null;
  target_count: number;
  current_count: number;
  deadline: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RecentWatch {
  id: string;
  movie_id: string;
  watched_at: string;
  rating: number | null;
  notes: string | null;
  rewatch_count: number;
  movie: {
    title: string;
    year: number;
    poster_path: string | null;
  };
}

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'lists' | 'achievements' | 'challenges' | 'history'>('overview');
  const [loading, setLoading] = useState(true);
  const [movieLists, setMovieLists] = useState<MovieList[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [recentWatches, setRecentWatches] = useState<RecentWatch[]>([]);
  const [listViewMode, setListViewMode] = useState<'overview' | 'create' | 'view'>('overview');
  const [selectedList, setSelectedList] = useState<MovieList | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await loadUserProfile(user.id);
        await loadUserData(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create default profile
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: userId,
            display_name: user?.email?.split('@')[0] || 'Użytkownik',
            level: 1,
            total_watched: 0,
            current_streak: 0,
            longest_streak: 0,
            favorite_genres: [],
            favorite_decades: [],
            is_public: false
          }])
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      // Load movie lists
      const { data: lists, error: listsError } = await supabase
        .from('user_movie_lists')
        .select(`
          *,
          user_list_movies(count)
        `)
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      if (listsError) throw listsError;
      
      const listsWithCount = lists?.map(list => ({
        ...list,
        movie_count: list.user_list_movies?.[0]?.count || 0
      })) || [];
      
      setMovieLists(listsWithCount);

      // Load achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

      // Load challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (challengesError) throw challengesError;
      setChallenges(challengesData || []);

      // Load recent watches
      const { data: watchesData, error: watchesError } = await supabase
        .from('user_movie_watches')
        .select(`
          *,
          movies(title, year, poster_path)
        `)
        .eq('user_id', userId)
        .order('watched_at', { ascending: false })
        .limit(10);

      if (watchesError) throw watchesError;
      setRecentWatches(watchesData || []);

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const createNewList = async () => {
    if (!user || !newListName.trim()) return;

    setIsCreatingList(true);
    try {
      const { data, error } = await supabase
        .from('user_movie_lists')
        .insert([{
          user_id: user.id,
          name: newListName.trim(),
          description: newListDescription.trim() || null,
          is_default: false,
          is_public: false,
          sort_order: movieLists.length
        }])
        .select()
        .single();

      if (error) throw error;

      setMovieLists([...movieLists, { ...data, movie_count: 0 }]);
      setNewListName('');
      setNewListDescription('');
      setListViewMode('overview');
    } catch (error) {
      console.error('Error creating list:', error);
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Ładowanie...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Musisz być zalogowany, aby zobaczyć dashboard.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#DFBD69] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {profile?.display_name || 'Użytkownik'}
                </h1>
                <p className="text-sm text-neutral-400">
                  Poziom {profile?.level || 1} • {profile?.total_watched || 0} obejrzanych filmów
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
            >
              Wyloguj się
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Przegląd', icon: User },
              { id: 'lists', label: 'Listy filmów', icon: List },
              { id: 'achievements', label: 'Osiągnięcia', icon: Trophy },
              { id: 'challenges', label: 'Wyzwania', icon: Target },
              { id: 'history', label: 'Historia', icon: Clock }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-[#DFBD69] text-[#DFBD69]'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-neutral-900 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Film className="w-6 h-6 text-[#DFBD69]" />
                  <h3 className="text-white font-semibold">Obejrzane filmy</h3>
                </div>
                <p className="text-3xl font-bold text-white">{profile?.total_watched || 0}</p>
              </div>

              <div className="bg-neutral-900 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-6 h-6 text-[#DFBD69]" />
                  <h3 className="text-white font-semibold">Obecna passa</h3>
                </div>
                <p className="text-3xl font-bold text-white">{profile?.current_streak || 0}</p>
                <p className="text-sm text-neutral-400">dni z rzędu</p>
              </div>

              <div className="bg-neutral-900 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-6 h-6 text-[#DFBD69]" />
                  <h3 className="text-white font-semibold">Osiągnięcia</h3>
                </div>
                <p className="text-3xl font-bold text-white">{achievements.filter(a => a.is_completed).length}</p>
                <p className="text-sm text-neutral-400">z {achievements.length}</p>
              </div>

              <div className="bg-neutral-900 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <List className="w-6 h-6 text-[#DFBD69]" />
                  <h3 className="text-white font-semibold">Listy filmów</h3>
                </div>
                <p className="text-3xl font-bold text-white">{movieLists.length}</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-neutral-900 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Ostatnio obejrzane</h3>
              {recentWatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentWatches.slice(0, 6).map((watch) => (
                    <div key={watch.id} className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
                      <div className="w-12 h-16 bg-neutral-700 rounded flex-shrink-0 flex items-center justify-center">
                        {watch.movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${watch.movie.poster_path}`}
                            alt={watch.movie.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Film className="w-6 h-6 text-neutral-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {watch.movie.title}
                        </h4>
                        <p className="text-sm text-neutral-400">
                          {watch.movie.year}
                        </p>
                        {watch.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-[#DFBD69] fill-current" />
                            <span className="text-xs text-neutral-400">{watch.rating}/10</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-400">Nie obejrzałeś jeszcze żadnych filmów.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'lists' && (
          <div className="space-y-6">
            {listViewMode === 'overview' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Twoje listy filmów</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {movieLists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => {
                        setSelectedList(list);
                        setListViewMode('view');
                      }}
                      className="p-6 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <List className="w-6 h-6 text-[#DFBD69]" />
                        <h3 className="text-white font-semibold">{list.name}</h3>
                      </div>
                      {list.description && (
                        <p className="text-neutral-400 text-sm mb-3 line-clamp-2">
                          {list.description}
                        </p>
                      )}
                      <p className="text-neutral-500 text-sm">
                        {list.movie_count || 0} {list.movie_count === 1 ? 'film' : 'filmów'}
                      </p>
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setListViewMode('create');
                      setSelectedList(null);
                    }}
                    className="p-6 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition-colors text-left"
                  >
                    <Plus className="w-8 h-8 text-[#DFBD69] mb-3" />
                    <h3 className="text-white font-semibold mb-2">Nowa lista</h3>
                    <p className="text-neutral-400 text-sm">
                      Stwórz nową listę filmów
                    </p>
                  </button>
                </div>
              </>
            )}

            {listViewMode === 'create' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setListViewMode('overview')}
                    className="p-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-white">Nowa lista filmów</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Nazwa listy
                    </label>
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                      placeholder="np. Ulubione dramaty"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Opis (opcjonalnie)
                    </label>
                    <textarea
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                      rows={3}
                      placeholder="Dodaj krótki opis swojej listy..."
                    />
                  </div>

                  <button
                    onClick={createNewList}
                    disabled={!newListName.trim() || isCreatingList}
                    className="w-full px-4 py-2 bg-[#DFBD69] text-black font-semibold rounded-lg hover:bg-[#E8C573] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingList ? 'Tworzenie...' : 'Utwórz listę'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Osiągnięcia</h2>
            
            {achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-6 rounded-xl border ${
                      achievement.is_completed
                        ? 'border-[#DFBD69] bg-[#DFBD69]/10'
                        : 'border-neutral-800 bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        achievement.is_completed ? 'bg-[#DFBD69]' : 'bg-neutral-700'
                      }`}>
                        <Trophy className={`w-5 h-5 ${
                          achievement.is_completed ? 'text-black' : 'text-neutral-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{achievement.achievement_name}</h3>
                        <p className="text-sm text-neutral-400">{achievement.achievement_type}</p>
                      </div>
                    </div>
                    
                    {achievement.description && (
                      <p className="text-neutral-400 text-sm mb-3">
                        {achievement.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500">
                        {achievement.progress}/{achievement.max_progress}
                      </span>
                      {achievement.is_completed && (
                        <span className="text-xs text-[#DFBD69]">Ukończone</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400">Nie masz jeszcze żadnych osiągnięć.</p>
            )}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Wyzwania</h2>
            
            {challenges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className={`p-6 rounded-xl border ${
                      challenge.is_completed
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-neutral-800 bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Target className={`w-6 h-6 ${
                        challenge.is_completed ? 'text-green-500' : 'text-[#DFBD69]'
                      }`} />
                      <h3 className="text-white font-semibold">{challenge.challenge_name}</h3>
                    </div>
                    
                    {challenge.description && (
                      <p className="text-neutral-400 text-sm mb-4">
                        {challenge.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">Postęp</span>
                        <span className="text-sm text-white">
                          {challenge.current_count}/{challenge.target_count}
                        </span>
                      </div>
                      
                      <div className="w-full bg-neutral-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            challenge.is_completed ? 'bg-green-500' : 'bg-[#DFBD69]'
                          }`}
                          style={{
                            width: `${Math.min((challenge.current_count / challenge.target_count) * 100, 100)}%`
                          }}
                        />
                      </div>
                      
                      {challenge.deadline && (
                        <p className="text-xs text-neutral-500">
                          Termin: {new Date(challenge.deadline).toLocaleDateString('pl-PL')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400">Nie masz aktywnych wyzwań.</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Historia oglądania</h2>
            
            {recentWatches.length > 0 ? (
              <div className="space-y-4">
                {recentWatches.map((watch) => (
                  <div key={watch.id} className="flex items-center gap-4 p-4 bg-neutral-900 rounded-xl">
                    <div className="w-16 h-24 bg-neutral-700 rounded flex-shrink-0 flex items-center justify-center">
                      {watch.movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${watch.movie.poster_path}`}
                          alt={watch.movie.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Film className="w-8 h-8 text-neutral-500" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{watch.movie.title}</h3>
                      <p className="text-neutral-400">{watch.movie.year}</p>
                      <p className="text-sm text-neutral-500">
                        Obejrzany: {new Date(watch.watched_at).toLocaleDateString('pl-PL')}
                      </p>
                      
                      {watch.rating && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-4 h-4 text-[#DFBD69] fill-current" />
                          <span className="text-sm text-neutral-400">{watch.rating}/10</span>
                        </div>
                      )}
                      
                      {watch.notes && (
                        <p className="text-sm text-neutral-400 mt-2 italic">
                          "{watch.notes}"
                        </p>
                      )}
                    </div>
                    
                    {watch.rewatch_count > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-neutral-400">Powtórki</p>
                        <p className="text-lg font-semibold text-[#DFBD69]">{watch.rewatch_count}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400">Nie masz jeszcze historii oglądania.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}