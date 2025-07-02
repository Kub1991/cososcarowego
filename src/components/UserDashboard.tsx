import React, { useState, useEffect } from 'react';
import { User, Trophy, Calendar, Star, TrendingUp, Clock, Film, Target, Award, ChevronRight, X, Sparkles } from 'lucide-react';
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

interface OscarProgress {
  id: string;
  category_type: string;
  category_identifier: string;
  movies_watched_count: number;
  total_movies_in_category: number;
  progress_percentage: number;
  last_updated: string;
}

interface Achievement {
  id: string;
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

interface Movie {
  id: string;
  title: string;
  year: number;
  poster_path: string | null;
  vote_average: number | null;
  oscar_year: number | null;
}

interface ProgressDetails {
  categoryType: string;
  categoryIdentifier: string;
  progressPercentage: number;
  watchedCount: number;
  totalCount: number;
  watchedMovies: Movie[];
  remainingMovies: Movie[];
}

const UserDashboard: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [oscarProgress, setOscarProgress] = useState<OscarProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgress, setSelectedProgress] = useState<ProgressDetails | null>(null);
  const [progressRecommendation, setProgressRecommendation] = useState<string>('');
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      // Fetch Oscar progress
      const { data: progress } = await supabase
        .from('user_oscar_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('progress_percentage', { ascending: false });

      if (progress) {
        setOscarProgress(progress);
      }

      // Fetch achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (userAchievements) {
        setAchievements(userAchievements);
      }

      // Fetch challenges
      const { data: userChallenges } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userChallenges) {
        setChallenges(userChallenges);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressDetails = async (categoryType: string, categoryIdentifier: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get watched movies for this category
      let watchedQuery = supabase
        .from('user_movie_watches')
        .select(`
          movie_id,
          movies!inner (
            id,
            title,
            year,
            poster_path,
            vote_average,
            oscar_year,
            is_best_picture_nominee
          )
        `)
        .eq('user_id', user.id);

      // Get all movies for this category
      let allMoviesQuery = supabase
        .from('movies')
        .select('id, title, year, poster_path, vote_average, oscar_year')
        .eq('is_best_picture_nominee', true);

      if (categoryType === 'decade') {
        const decade = parseInt(categoryIdentifier);
        watchedQuery = watchedQuery.gte('movies.year', decade).lt('movies.year', decade + 10);
        allMoviesQuery = allMoviesQuery.gte('year', decade).lt('year', decade + 10);
      } else if (categoryType === 'oscar_year') {
        const year = parseInt(categoryIdentifier);
        watchedQuery = watchedQuery.eq('movies.oscar_year', year);
        allMoviesQuery = allMoviesQuery.eq('oscar_year', year);
      }

      const [watchedResult, allMoviesResult] = await Promise.all([
        watchedQuery,
        allMoviesQuery
      ]);

      const watchedMovies = watchedResult.data?.map(w => w.movies).filter(Boolean) || [];
      const allMovies = allMoviesResult.data || [];
      
      const watchedMovieIds = new Set(watchedMovies.map(m => m.id));
      const remainingMovies = allMovies.filter(m => !watchedMovieIds.has(m.id));

      const progressPercentage = allMovies.length > 0 
        ? Math.round((watchedMovies.length / allMovies.length) * 100) 
        : 0;

      const details: ProgressDetails = {
        categoryType,
        categoryIdentifier,
        progressPercentage,
        watchedCount: watchedMovies.length,
        totalCount: allMovies.length,
        watchedMovies: watchedMovies as Movie[],
        remainingMovies: remainingMovies as Movie[]
      };

      setSelectedProgress(details);

      // Generate AI recommendation if there are remaining movies
      if (remainingMovies.length > 0) {
        generateProgressRecommendation(details);
      }

    } catch (error) {
      console.error('Error fetching progress details:', error);
    }
  };

  const generateProgressRecommendation = async (details: ProgressDetails) => {
    setIsLoadingRecommendation(true);
    try {
      const categoryName = details.categoryType === 'decade' 
        ? `lata ${details.categoryIdentifier}-${parseInt(details.categoryIdentifier) + 9}`
        : `rok oscarowy ${details.categoryIdentifier}`;

      const prompt = `Użytkownik obejrzał ${details.watchedCount} z ${details.totalCount} filmów nominowanych do Oscara w kategorii "${categoryName}". 
      
Pozostałe filmy do obejrzenia: ${details.remainingMovies.slice(0, 10).map(m => `"${m.title}" (${m.year})`).join(', ')}${details.remainingMovies.length > 10 ? '...' : ''}

Napisz krótką, zachęcającą rekomendację (2-3 zdania) sugerującą, który film powinien obejrzeć następny i dlaczego. Uwzględnij różnorodność gatunków i okresy historyczne. Odpowiedz po polsku.`;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/movie-recommendations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (response.ok) {
        const data = await response.json();
        setProgressRecommendation(data.recommendation || 'Kontynuuj swoją kinową podróż!');
      } else {
        setProgressRecommendation('Kontynuuj swoją kinową podróż przez nominowane filmy!');
      }
    } catch (error) {
      console.error('Error generating recommendation:', error);
      setProgressRecommendation('Kontynuuj swoją kinową podróż przez nominowane filmy!');
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  const formatCategoryName = (categoryType: string, categoryIdentifier: string) => {
    if (categoryType === 'decade') {
      return `Lata ${categoryIdentifier}-${parseInt(categoryIdentifier) + 9}`;
    } else if (categoryType === 'oscar_year') {
      return `Oscary ${categoryIdentifier}`;
    }
    return categoryIdentifier;
  };

  const getAchievementIcon = (achievementType: string) => {
    switch (achievementType) {
      case 'streak': return <Target className="w-5 h-5" />;
      case 'milestone': return <Trophy className="w-5 h-5" />;
      case 'genre': return <Film className="w-5 h-5" />;
      case 'decade': return <Calendar className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#DFBD69] rounded-full animate-spin border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-300">Ładowanie danych użytkownika...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Profil nie został znaleziony</h2>
          <p className="text-neutral-400">Zaloguj się, aby zobaczyć swój dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#DFBD69] to-[#E8C573] rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-neutral-900" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {userProfile.display_name || 'Kinoman'}
              </h1>
              <p className="text-neutral-400">Poziom {userProfile.level}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
              <div className="flex items-center gap-3">
                <Film className="w-8 h-8 text-[#DFBD69]" />
                <div>
                  <p className="text-2xl font-bold text-white">{userProfile.total_watched}</p>
                  <p className="text-sm text-neutral-400">Obejrzane</p>
                </div>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{userProfile.current_streak}</p>
                  <p className="text-sm text-neutral-400">Aktualna passa</p>
                </div>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{userProfile.longest_streak}</p>
                  <p className="text-sm text-neutral-400">Najdłuższa passa</p>
                </div>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-[#DFBD69]" />
                <div>
                  <p className="text-2xl font-bold text-white">{achievements.filter(a => a.is_completed).length}</p>
                  <p className="text-sm text-neutral-400">Osiągnięcia</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Oscar Progress */}
          <div className="lg:col-span-2">
            <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-[#DFBD69]" />
                Postęp w Oscarach
              </h2>

              {oscarProgress.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400">Zacznij oglądać filmy, aby zobaczyć swój postęp!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {oscarProgress.map((progress) => (
                    <div 
                      key={progress.id}
                      className="bg-neutral-700 rounded-lg p-4 cursor-pointer hover:bg-neutral-650 transition-colors"
                      onClick={() => fetchProgressDetails(progress.category_type, progress.category_identifier)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">
                          {formatCategoryName(progress.category_type, progress.category_identifier)}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-neutral-300">
                            {progress.movies_watched_count}/{progress.total_movies_in_category}
                          </span>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </div>
                      </div>
                      <div className="w-full bg-neutral-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#DFBD69] to-[#E8C573] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress.progress_percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-neutral-400 mt-1">{progress.progress_percentage}% ukończone</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Achievements & Challenges */}
          <div className="space-y-6">
            {/* Recent Achievements */}
            <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-[#DFBD69]" />
                Osiągnięcia
              </h2>

              {achievements.length === 0 ? (
                <div className="text-center py-4">
                  <Award className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">Brak osiągnięć</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {achievements.slice(0, 5).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-neutral-700 rounded-lg">
                      <div className={`p-2 rounded-full ${achievement.is_completed ? 'bg-[#DFBD69] text-neutral-900' : 'bg-neutral-600 text-neutral-400'}`}>
                        {getAchievementIcon(achievement.achievement_type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white text-sm">{achievement.achievement_name}</h3>
                        {achievement.description && (
                          <p className="text-xs text-neutral-400">{achievement.description}</p>
                        )}
                        {!achievement.is_completed && (
                          <div className="mt-1">
                            <div className="w-full bg-neutral-600 rounded-full h-1">
                              <div 
                                className="bg-[#DFBD69] h-1 rounded-full"
                                style={{ width: `${(achievement.progress / achievement.max_progress) * 100}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                              {achievement.progress}/{achievement.max_progress}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Challenges */}
            <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-[#DFBD69]" />
                Wyzwania
              </h2>

              {challenges.length === 0 ? (
                <div className="text-center py-4">
                  <Target className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">Brak aktywnych wyzwań</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {challenges.slice(0, 3).map((challenge) => (
                    <div key={challenge.id} className="p-3 bg-neutral-700 rounded-lg">
                      <h3 className="font-medium text-white text-sm mb-1">{challenge.challenge_name}</h3>
                      {challenge.description && (
                        <p className="text-xs text-neutral-400 mb-2">{challenge.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-300">
                          {challenge.current_count}/{challenge.target_count}
                        </span>
                        <span className={`px-2 py-1 rounded-full ${challenge.is_completed ? 'bg-green-500 text-white' : 'bg-neutral-600 text-neutral-300'}`}>
                          {challenge.is_completed ? 'Ukończone' : 'W trakcie'}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-600 rounded-full h-1 mt-2">
                        <div 
                          className="bg-[#DFBD69] h-1 rounded-full"
                          style={{ width: `${Math.min((challenge.current_count / challenge.target_count) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Details Modal */}
        {selectedProgress && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {formatCategoryName(selectedProgress.categoryType, selectedProgress.categoryIdentifier)}
                </h2>
                <button
                  onClick={() => setSelectedProgress(null)}
                  className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-neutral-400" />
                </button>
              </div>

              <div className="p-6">
                {/* Progress Summary */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Postęp</h3>
                    <span className="text-2xl font-bold text-[#DFBD69]">
                      {selectedProgress.progressPercentage}%
                    </span>
                  </div>
                  
                  <p className="text-neutral-300 mb-4">
                    Obejrzałeś {selectedProgress.watchedCount} z {selectedProgress.totalCount} filmów
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-[#DFBD69] to-[#E8C573] h-3 rounded-full transition-all duration-500"
                      style={{ width: `${selectedProgress.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* AI Recommendation */}
                {selectedProgress.remainingMovies.length > 0 && (
                  <div 
                    className="p-6 rounded-lg border border-neutral-700 mb-8"
                    style={{
                      background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                    }}
                  >
                    <h3 className="text-[#DFBD69] font-bold text-lg mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Rekomendacja AI
                    </h3>
                    {isLoadingRecommendation ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
                        <span className="text-neutral-300">Analizuję pozostałe filmy...</span>
                      </div>
                    ) : (
                      <p className="text-neutral-200 leading-relaxed">
                        {progressRecommendation || 'Nie udało się wygenerować rekomendacji.'}
                      </p>
                    )}
                  </div>
                )}

                {/* Movies Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Watched Movies */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-green-500" />
                      Obejrzane ({selectedProgress.watchedCount})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedProgress.watchedMovies.map((movie) => (
                        <div key={movie.id} className="flex items-center gap-3 p-3 bg-neutral-700 rounded-lg">
                          <div className="w-12 h-16 bg-neutral-600 rounded flex-shrink-0 overflow-hidden">
                            {movie.poster_path && (
                              <img
                                src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm truncate">{movie.title}</h4>
                            <p className="text-xs text-neutral-400">{movie.year}</p>
                            {movie.vote_average && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs text-neutral-300">{movie.vote_average.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Remaining Movies */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#DFBD69]" />
                      Do obejrzenia ({selectedProgress.remainingMovies.length})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedProgress.remainingMovies.map((movie) => (
                        <div key={movie.id} className="flex items-center gap-3 p-3 bg-neutral-700 rounded-lg">
                          <div className="w-12 h-16 bg-neutral-600 rounded flex-shrink-0 overflow-hidden">
                            {movie.poster_path && (
                              <img
                                src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm truncate">{movie.title}</h4>
                            <p className="text-xs text-neutral-400">{movie.year}</p>
                            {movie.vote_average && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs text-neutral-300">{movie.vote_average.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;