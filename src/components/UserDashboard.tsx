import React, { useState, useEffect } from 'react';
import { User, Film, List, Trophy, Target, Plus, ArrowLeft, Calendar, Star, Clock, Eye } from 'lucide-react';
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

interface UserDashboardProps {
  user: any;
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'lists' | 'achievements' | 'challenges'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lists, setLists] = useState<MovieList[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [listViewMode, setListViewMode] = useState<'overview' | 'create' | 'edit'>('overview');
  const [selectedList, setSelectedList] = useState<MovieList | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }

      // Load user lists with movie counts
      const { data: listsData } = await supabase
        .from('user_movie_lists')
        .select(`
          *,
          user_list_movies(count)
        `)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (listsData) {
        const listsWithCounts = listsData.map(list => ({
          ...list,
          movie_count: list.user_list_movies?.[0]?.count || 0
        }));
        setLists(listsWithCounts);
      }

      // Load achievements
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (achievementsData) {
        setAchievements(achievementsData);
      }

      // Load challenges
      const { data: challengesData } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (challengesData) {
        setChallenges(challengesData);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewList = async () => {
    if (!newListName.trim()) return;

    try {
      setIsCreatingList(true);
      
      const { data, error } = await supabase
        .from('user_movie_lists')
        .insert({
          user_id: user.id,
          name: newListName.trim(),
          description: newListDescription.trim() || null,
          is_public: false,
          sort_order: lists.length
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setLists(prev => [...prev, { ...data, movie_count: 0 }]);
        setNewListName('');
        setNewListDescription('');
        setListViewMode('overview');
      }
    } catch (error) {
      console.error('Error creating list:', error);
    } finally {
      setIsCreatingList(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mój profil</h1>
          <p className="text-neutral-400">Zarządzaj swoim profilem i listami filmów</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-neutral-900 p-1 rounded-lg">
          {[
            { id: 'profile', label: 'Profil', icon: User },
            { id: 'lists', label: 'Listy', icon: List },
            { id: 'achievements', label: 'Osiągnięcia', icon: Trophy },
            { id: 'challenges', label: 'Wyzwania', icon: Target }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === id
                  ? 'bg-[#DFBD69] text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Informacje o profilu</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nazwa wyświetlana</label>
                  <input
                    type="text"
                    value={profile?.display_name || ''}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg"
                    placeholder="Twoja nazwa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-900 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Film className="w-6 h-6 text-[#DFBD69]" />
                  <h3 className="font-semibold">Obejrzane filmy</h3>
                </div>
                <p className="text-2xl font-bold">{profile?.total_watched || 0}</p>
              </div>

              <div className="bg-neutral-900 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-6 h-6 text-[#DFBD69]" />
                  <h3 className="font-semibold">Obecna passa</h3>
                </div>
                <p className="text-2xl font-bold">{profile?.current_streak || 0} dni</p>
              </div>

              <div className="bg-neutral-900 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="w-6 h-6 text-[#DFBD69]" />
                  <h3 className="font-semibold">Poziom</h3>
                </div>
                <p className="text-2xl font-bold">{profile?.level || 1}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lists' && (
          <div className="space-y-6">
            {listViewMode === 'overview' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Moje listy filmów</h2>
                  <button
                    onClick={() => {
                      setListViewMode('create');
                      setSelectedList(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#DFBD69] text-black font-semibold rounded-lg hover:bg-[#E8C573] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Nowa lista
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      className="p-6 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <List className="w-6 h-6 text-[#DFBD69]" />
                        <h3 className="font-semibold">{list.name}</h3>
                      </div>
                      {list.description && (
                        <p className="text-neutral-400 text-sm mb-3">{list.description}</p>
                      )}
                      <p className="text-neutral-500 text-sm">
                        {list.movie_count} {list.movie_count === 1 ? 'film' : 'filmów'}
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
            <h2 className="text-2xl font-bold">Osiągnięcia</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-6 rounded-xl border border-neutral-800 bg-neutral-900"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Trophy className="w-6 h-6 text-[#DFBD69]" />
                    <h3 className="font-semibold">{achievement.achievement_name}</h3>
                  </div>
                  {achievement.description && (
                    <p className="text-neutral-400 text-sm mb-3">{achievement.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">
                      {achievement.progress}/{achievement.max_progress}
                    </span>
                    {achievement.is_completed && (
                      <span className="text-green-400 text-sm">Ukończone</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Wyzwania</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="p-6 rounded-xl border border-neutral-800 bg-neutral-900"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-6 h-6 text-[#DFBD69]" />
                    <h3 className="font-semibold">{challenge.challenge_name}</h3>
                  </div>
                  {challenge.description && (
                    <p className="text-neutral-400 text-sm mb-3">{challenge.description}</p>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Postęp</span>
                      <span className="text-sm">
                        {challenge.current_count}/{challenge.target_count}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2">
                      <div
                        className="bg-[#DFBD69] h-2 rounded-full"
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
          </div>
        )}
      </div>
    </div>
  );
}