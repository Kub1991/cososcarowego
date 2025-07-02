import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Movie {
  id: string;
  tmdb_id: number;
  title: string;
  original_title?: string;
  year: number;
  release_date?: string;
  runtime?: number;
  genre_ids?: number[];
  genres?: string[];
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  is_best_picture_nominee: boolean;
  is_best_picture_winner: boolean;
  oscar_year?: number;
  ai_recommendation_text?: string;
  ai_brief_text?: string;
  mood_tags?: string[];
  thematic_tags?: Array<{tag: string, importance: number}>;
  classic_experience_level?: string;
  last_selected_at?: string; // Track when movie was last selected
  created_at: string;
  updated_at: string;
}

// User Management Types
export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  level: number;
  total_watched: number;
  current_streak: number;
  longest_streak: number;
  favorite_genres?: string[];
  favorite_decades?: string[];
  bio?: string;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

// NEW: User Watchlist Item Type
export interface UserWatchlistItem {
  id: string;
  user_id: string;
  movie_id: string;
  added_at: string;
  movie?: Movie;
}

export interface UserMovieWatch {
  id: string;
  user_id: string;
  movie_id: string;
  watched_at: string;
  rating?: number;
  notes?: string;
  movie?: Movie;
}

export interface UserStats {
  watched_movies: number;
  watchlist_movies: number;
  current_streak: number;
  achievements_count: number;
  favorite_genre?: string;
  favorite_decade?: string;
  total_watch_time: number;
  average_rating?: number;
  total_oscar_winners: number;
  total_nominees: number;
}

// NEW: Enhanced Kino DNA Analysis Types with Weighted Support
export interface GenreAnalysis {
  genre: string;
  weight: number; // NEW: Total weighted score instead of just count
  count: number; // Keep count for compatibility but weight is more important
  percentage: number; // Based on weighted score
}

export interface DecadeAnalysis {
  decade: string;
  count: number;
  percentage: number;
  years: number[];
}

export interface KinoDNA {
  favorite_genres: string[];
  favorite_decades: string[];
  genre_analysis: GenreAnalysis[];
  decade_analysis: DecadeAnalysis[];
  total_movies_analyzed: number;
  total_weighted_score: number; // NEW: Total weighted score across all genres
  last_updated: string;
}

// Smart Match types - UPDATED: Added popularity field
export interface UserPreferences {
  mood: string;
  time: string;
  genres: string[];
  decade: string; // decade preference
  popularity: string; // NEW: popularity preference
  platforms?: string[];
  allowRental?: boolean;
  showAll?: boolean;
}

export interface MovieRecommendation {
  movie: Movie;
  matchScore: number;
  reason: string;
  rank: number;
}

export interface SmartMatchResponse {
  recommendations: MovieRecommendation[];
  totalAnalyzed: number;
  success: boolean;
}

// Browse by Years types
export interface OscarYear {
  oscar_year: number;
  winner?: Movie;
  nominees: Movie[];
  totalNominees: number;
}

// Decade stats interface
export interface DecadeStats {
  id: string;
  label: string;
  description: string;
  startOscarYear: number;
  endOscarYear: number;
  movieCount: number;
  isAvailable: boolean;
}

// All Oscar decades definition
export const ALL_OSCAR_DECADES = [
  {
    id: '1920s',
    label: 'Lata 20. (1929-1930)',
    description: 'Narodziny Hollywood i pierwsze Oscary',
    startOscarYear: 1929,
    endOscarYear: 1930
  },
  {
    id: '1930s',
    label: 'Lata 30. (1931-1940)',
    description: 'Złota era klasycznego Hollywood',
    startOscarYear: 1931,
    endOscarYear: 1940
  },
  {
    id: '1940s',
    label: 'Lata 40. (1941-1950)',
    description: 'Wojna, film noir i wielkie dramaty',
    startOscarYear: 1941,
    endOscarYear: 1950
  },
  {
    id: '1950s',
    label: 'Lata 50. (1951-1960)',
    description: 'CinemaScope, musicale i epoki',
    startOscarYear: 1951,
    endOscarYear: 1960
  },
  {
    id: '1960s',
    label: 'Lata 60. (1961-1970)',
    description: 'Nowa Fala i rewolucja kulturowa',
    startOscarYear: 1961,
    endOscarYear: 1970
  },
  {
    id: '1970s',
    label: 'Lata 70. (1971-1980)',
    description: 'Nowy Hollywood i autorskie kino',
    startOscarYear: 1971,
    endOscarYear: 1980
  },
  {
    id: '1980s',
    label: 'Lata 80. (1981-1990)',
    description: 'Blockbustery i kino komercyjne',
    startOscarYear: 1981,
    endOscarYear: 1990
  },
  {
    id: '1990s',
    label: 'Lata 90. (1991-2000)',
    description: 'Niezależne kino i cyfrowa rewolucja',
    startOscarYear: 1991,
    endOscarYear: 2000
  },
  {
    id: '2000s',
    label: 'Lata 2000-2009',
    description: 'Klasyczne blockbustery i przełomowe dramaty',
    startOscarYear: 2001,
    endOscarYear: 2010
  },
  {
    id: '2010s',
    label: 'Lata 2010-2019',
    description: 'Współczesne arcydzieła i różnorodność gatunków',
    startOscarYear: 2011,
    endOscarYear: 2020
  },
  {
    id: '2020s',
    label: 'Lata 20. XXI w. (2021-)',
    description: 'Streaming, pandemia i nowe formy kina',
    startOscarYear: 2021,
    endOscarYear: 2030
  }
];

// User Authentication Functions
export async function signUpUser(email: string, password: string, fullName: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      return { user: null, error };
    }

    // Create user profile after successful signup
    if (data.user) {
      await createUserProfile(data.user.id, fullName);
    }

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signInUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data.user, error };
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// User Profile Functions
export async function createUserProfile(userId: string, displayName: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        display_name: displayName,
        level: 1,
        total_watched: 0,
        current_streak: 0,
        longest_streak: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return null;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

// NEW: User Watchlist Functions
export async function addMovieToWatchlist(userId: string, movieId: string): Promise<boolean> {
  try {
    // Check if movie is already in the watchlist
    const { data: existing } = await supabase
      .from('user_watchlist')
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (existing) {
      console.log('📝 Supabase: Movie already in watchlist.');
      return true; // Movie already exists, consider it a success
    }

    const { error } = await supabase
      .from('user_watchlist')
      .insert({
        user_id: userId,
        movie_id: movieId,
      });

    if (error) {
      console.error('Error adding movie to watchlist:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addMovieToWatchlist:', error);
    return false;
  }
}

export async function getWatchlistMovies(userId: string): Promise<UserWatchlistItem[]> {
  try {
    const { data, error } = await supabase
      .from('user_watchlist')
      .select(`
        *,
        movies (*)
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlist movies:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getWatchlistMovies:', error);
    return [];
  }
}

// NEW: Function to remove movie from watchlist
export async function removeMovieFromWatchlist(userId: string, movieId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId);

    if (error) {
      console.error('Error removing movie from watchlist:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeMovieFromWatchlist:', error);
    return false;
  }
}

// ENHANCED: Weighted Kino DNA Analysis Functions
export async function calculateKinoDNA(userId: string): Promise<KinoDNA | null> {
  try {
    // Get all watched movies for the user with their movie details
    // UPDATED: Changed from 'genres' to 'thematic_tags' for weighted analysis
    const { data: watchedMovies, error } = await supabase
      .from('user_movie_watches')
      .select(`
        *,
        movies (
          id,
          title,
          thematic_tags,
          oscar_year,
          is_best_picture_winner
        )
      `)
      .eq('user_id', userId);

    if (error || !watchedMovies || watchedMovies.length === 0) {
      return null;
    }

    // Analyze weighted thematic tags and decades
    const genreWeights: { [key: string]: number } = {}; // Track total weighted scores
    const genreCounts: { [key: string]: number } = {}; // Track raw counts for reference
    const decadeCount: { [key: string]: { count: number; years: number[] } } = {};
    let totalWeightedScore = 0;

    watchedMovies.forEach(watch => {
      const movie = watch.movies;
      if (!movie) return;

      // UPDATED: Count thematic tags with importance weights
      if (movie.thematic_tags && Array.isArray(movie.thematic_tags)) {
        movie.thematic_tags.forEach(tagObj => {
          if (tagObj && tagObj.tag && typeof tagObj.importance === 'number') {
            const tag = tagObj.tag;
            const importance = tagObj.importance;
            
            // Add weighted score
            genreWeights[tag] = (genreWeights[tag] || 0) + importance;
            // Track raw count for reference
            genreCounts[tag] = (genreCounts[tag] || 0) + 1;
            // Add to total weighted score
            totalWeightedScore += importance;
          }
        });
      }

      // Count decades based on oscar_year (unchanged logic)
      if (movie.oscar_year) {
        let decade: string;
        if (movie.oscar_year >= 2001 && movie.oscar_year <= 2010) {
          decade = '2000s';
        } else if (movie.oscar_year >= 2011 && movie.oscar_year <= 2020) {
          decade = '2010s';
        } else if (movie.oscar_year >= 1991 && movie.oscar_year <= 2000) {
          decade = '1990s';
        } else if (movie.oscar_year >= 1981 && movie.oscar_year <= 1990) {
          decade = '1980s';
        } else if (movie.oscar_year >= 1971 && movie.oscar_year <= 1980) {
          decade = '1970s';
        } else if (movie.oscar_year >= 1961 && movie.oscar_year <= 1970) {
          decade = '1960s';
        } else if (movie.oscar_year >= 1951 && movie.oscar_year <= 1960) {
          decade = '1950s';
        } else if (movie.oscar_year >= 1941 && movie.oscar_year <= 1950) {
          decade = '1940s';
        } else if (movie.oscar_year >= 1931 && movie.oscar_year <= 1940) {
          decade = '1930s';
        } else {
          decade = 'Other';
        }

        if (!decadeCount[decade]) {
          decadeCount[decade] = { count: 0, years: [] };
        }
        decadeCount[decade].count += 1;
        if (!decadeCount[decade].years.includes(movie.oscar_year)) {
          decadeCount[decade].years.push(movie.oscar_year);
        }
      }
    });

    const totalMovies = watchedMovies.length;

    // UPDATED: Create enhanced genre analysis with weighted scores
    const genreAnalysis: GenreAnalysis[] = Object.entries(genreWeights)
      .map(([genre, weight]) => ({
        genre,
        weight: Math.round(weight * 100) / 100, // Round to 2 decimal places
        count: genreCounts[genre] || 0,
        percentage: totalWeightedScore > 0 ? Math.round((weight / totalWeightedScore) * 100) : 0
      }))
      .sort((a, b) => b.weight - a.weight); // Sort by weighted score, not count

    // Create decade analysis (unchanged logic)
    const decadeAnalysis: DecadeAnalysis[] = Object.entries(decadeCount)
      .map(([decade, data]) => ({
        decade,
        count: data.count,
        percentage: Math.round((data.count / totalMovies) * 100),
        years: data.years.sort((a, b) => a - b)
      }))
      .sort((a, b) => b.count - a.count);

    // UPDATED: Determine favorite genres based on weighted scores (top 3)
    const favorite_genres = genreAnalysis.slice(0, 3).map(g => g.genre);
    const favorite_decades = decadeAnalysis.slice(0, 2).map(d => d.decade);

    return {
      favorite_genres,
      favorite_decades,
      genre_analysis: genreAnalysis,
      decade_analysis: decadeAnalysis,
      total_movies_analyzed: totalMovies,
      total_weighted_score: Math.round(totalWeightedScore * 100) / 100,
      last_updated: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error calculating weighted Kino DNA:', error);
    return null;
  }
}

export async function updateUserKinoDNA(userId: string): Promise<boolean> {
  try {
    const kinoDNA = await calculateKinoDNA(userId);
    if (!kinoDNA) {
      // Clear favorite genres and decades if no data
      await supabase
        .from('user_profiles')
        .update({
          favorite_genres: [],
          favorite_decades: [],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      return true;
    }

    // Update user profile with calculated Kino DNA
    const { error } = await supabase
      .from('user_profiles')
      .update({
        favorite_genres: kinoDNA.favorite_genres,
        favorite_decades: kinoDNA.favorite_decades,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating user Kino DNA:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserKinoDNA:', error);
    return false;
  }
}

// User Watch History Functions
export async function markMovieAsWatched(userId: string, movieId: string, rating?: number, notes?: string): Promise<boolean> {
  try {
    console.log('📝 Supabase: Marking movie as watched for user:', userId, 'movie:', movieId);
    
    // Check if movie is already watched
    const { data: existing } = await supabase
      .from('user_movie_watches')
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (existing) {
      // Movie already watched, update it
      console.log('📝 Supabase: Movie already watched, updating record');
      const { error } = await supabase
        .from('user_movie_watches')
        .update({
          rating,
          notes,
          watched_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating watched movie:', error);
        console.error('❌ Supabase: Failed to update watched movie');
        return false;
      }
    } else {
      // Add new watch record
      console.log('📝 Supabase: Adding new watch record');
      const { error } = await supabase
        .from('user_movie_watches')
        .insert({
          user_id: userId,
          movie_id: movieId,
          rating,
          notes,
          watched_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error marking movie as watched:', error);
        console.error('❌ Supabase: Failed to add new watch record');
        return false;
      }
    }

    console.log('✅ Supabase: Successfully marked movie as watched');
    
    // Update user stats and Kino DNA (now with weighted analysis)
    await Promise.all([
      updateUserStats(userId),
      removeMovieFromWatchlist(userId, movieId), // Remove from watchlist when marked as watched
      updateUserKinoDNA(userId)
    ]);

    return true;
  } catch (error) {
    console.error('Error in markMovieAsWatched:', error);
    console.error('❌ Supabase: Exception in markMovieAsWatched:', error);
    return false;
  }
}

export async function getUserWatchedMovies(userId: string): Promise<UserMovieWatch[]> {
  try {
    const { data, error } = await supabase
      .from('user_movie_watches')
      .select(`
        *,
        movies (*)
      `)
      .eq('user_id', userId)
      .order('watched_at', { ascending: false });

    if (error) {
      console.error('Error fetching watched movies:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error in getUserWatchedMovies:', error);
    return [];
  }
}

// Enhanced User Statistics Functions
export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const [watchedResponse, watchlistResponse, watchedMoviesData] = await Promise.all([
      supabase
        .from('user_movie_watches')
        .select('*', { count: 'exact' })
        .eq('user_id', userId),
      supabase
        .from('user_watchlist') // UPDATED: Count from new user_watchlist table
        .select('*', { count: 'exact' })
        .eq('user_id', userId),
      supabase
        .from('user_movie_watches')
        .select(`
          rating,
          movies (
            runtime,
            is_best_picture_winner,
            oscar_year
          )
        `)
        .eq('user_id', userId)
    ]);

    const watchedCount = watchedResponse.count || 0;
    const watchlistCount = watchlistResponse.count || 0;
    const watchedMovies = watchedMoviesData.data || [];

    // Calculate additional stats
    let totalWatchTime = 0;
    let ratingSum = 0;
    let ratingCount = 0;
    let oscarWinners = 0;
    let oscarNominees = 0;

    watchedMovies.forEach(watch => {
      // Calculate watch time
      if (watch.movies?.runtime) {
        totalWatchTime += watch.movies.runtime;
      }

      // Calculate average rating
      if (watch.rating) {
        ratingSum += watch.rating;
        ratingCount++;
      }

      // Count Oscar winners vs nominees
      if (watch.movies?.is_best_picture_winner) {
        oscarWinners++;
      } else {
        oscarNominees++;
      }
    });

    const averageRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : undefined;

    // Get user profile for favorite genre/decade (now based on weighted analysis)
    const userProfile = await getUserProfile(userId);
    const favoriteGenre = userProfile?.favorite_genres?.[0];
    const favoriteDecade = userProfile?.favorite_decades?.[0];

    return {
      watched_movies: watchedCount,
      watchlist_movies: watchlistCount,
      current_streak: 0, // TODO: Calculate actual streak
      achievements_count: 0, // TODO: Calculate achievements
      favorite_genre: favoriteGenre,
      favorite_decade: favoriteDecade,
      total_watch_time: totalWatchTime,
      average_rating: averageRating,
      total_oscar_winners: oscarWinners,
      total_nominees: oscarNominees
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return null;
  }
}

export async function updateUserStats(userId: string): Promise<void> {
  try {
    const stats = await getUserStats(userId);
    if (!stats) return;

    await supabase
      .from('user_profiles')
      .update({
        total_watched: stats.watched_movies,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

// ENHANCED: Detailed analytics with weighted genre analysis
export async function getUserDetailedAnalytics(userId: string): Promise<{
  genreBreakdown: GenreAnalysis[];
  decadeProgress: DecadeAnalysis[];
  watchingTrends: any[];
  topRatedMovies: UserMovieWatch[];
} | null> {
  try {
    const kinoDNA = await calculateKinoDNA(userId);
    if (!kinoDNA) {
      return {
        genreBreakdown: [],
        decadeProgress: [],
        watchingTrends: [],
        topRatedMovies: []
      };
    }

    // Get top rated movies
    const { data: topRated } = await supabase
      .from('user_movie_watches')
      .select(`
        *,
        movies (*)
      `)
      .eq('user_id', userId)
      .not('rating', 'is', null)
      .order('rating', { ascending: false })
      .order('watched_at', { ascending: false })
      .limit(5);

    // TODO: Calculate watching trends over time
    const watchingTrends = []; // Placeholder for future implementation

    return {
      genreBreakdown: kinoDNA.genre_analysis, // Now contains weighted analysis
      decadeProgress: kinoDNA.decade_analysis,
      watchingTrends,
      topRatedMovies: topRated || []
    };
  } catch (error) {
    console.error('Error getting detailed analytics:', error);
    return null;
  }
}

// ENHANCED: Fair Movie Selection with Last Selected Tracking
export async function getRandomOscarMovie(): Promise<Movie | null> {
  try {
    console.log('🎲 Supabase: Starting fair movie selection...');
    
    // Step 1: Get movies that were least recently selected (or never selected)
    // NULLS FIRST ensures movies never selected have highest priority
    // UPDATED: Increased from 15 to 50 for much better variety
    const { data: leastRecentMovies, error: queryError } = await supabase
      .from('movies')
      .select('*')
      .eq('is_best_picture_nominee', true)
      .order('last_selected_at', { ascending: true }) // Oldest selections first, NULL comes first
      .limit(50); // UPDATED: Increased from 15 to 50 movies for better variety

    if (queryError || !leastRecentMovies || leastRecentMovies.length === 0) {
      console.error('Error fetching least recent movies:', queryError);
      console.error('❌ Supabase: Failed to fetch least recent movies, trying fallback...');
      
      // Fallback: Get any random movies if the fair selection fails
      const { data: fallbackMovies, error: fallbackError } = await supabase
        .from('movies')
        .select('*')
        .eq('is_best_picture_nominee', true)
        .limit(20); // Also increased fallback limit

      if (fallbackError || !fallbackMovies || fallbackMovies.length === 0) {
        console.error('Fallback query also failed:', fallbackError);
        console.error('❌ Supabase: Both main and fallback queries failed');
        return null;
      }

      console.log('🔄 Supabase: Using fallback selection from', fallbackMovies.length, 'movies');
      return fallbackMovies[Math.floor(Math.random() * fallbackMovies.length)];
    }

    console.log('📊 Supabase: Found', leastRecentMovies.length, 'least recently selected movies');
    
    // Step 2: Randomly select one movie from the least recently selected pool
    const selectedMovie = leastRecentMovies[Math.floor(Math.random() * leastRecentMovies.length)];

    // 🔍 DEBUG: Log the selected movie details
    console.log('🎯 Supabase: Selected movie from pool:', {
      id: selectedMovie.id,
      title: selectedMovie.title,
      oscar_year: selectedMovie.oscar_year,
      tmdb_id: selectedMovie.tmdb_id,
      last_selected_at: selectedMovie.last_selected_at || 'Never selected before'
    });

    // Step 3: Update the selected movie's last_selected_at timestamp
    const { error: updateError } = await supabase
      .from('movies')
      .update({ 
        last_selected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedMovie.id);

    if (updateError) {
      console.error('Error updating last_selected_at:', updateError);
      console.error('❌ Supabase: Failed to update last_selected_at for movie:', selectedMovie.title);
      // Don't fail the whole operation if timestamp update fails
      // User will still get their movie, just without tracking
    } else {
      console.log('✅ Supabase: Successfully updated last_selected_at for:', selectedMovie.title);
    }

    console.log(`🎯 Fair Selection (Pool: 50): Chose "${selectedMovie.title}" (last selected: ${selectedMovie.last_selected_at || 'Never'})`);
    
    return selectedMovie;

  } catch (error) {
    console.error('Error in getRandomOscarMovie:', error);
    console.error('❌ Supabase: Exception in getRandomOscarMovie:', error);
    return null;
  }
}

export async function getOscarNominees(oscarYear: number): Promise<Movie[]> {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_best_picture_nominee', true)
      .eq('oscar_year', oscarYear)
      .order('title', { ascending: true });

    if (error || !data) {
      console.error('Error fetching Oscar nominees:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error in getOscarNominees:', error);
    return [];
  }
}

export async function getMovieRecommendation(type: 'quick-shot' | 'explanation' | 'brief', movieId?: string, userPreferences?: any) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/movie-recommendations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, movieId, userPreferences }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch movie recommendation');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching movie recommendation:', error);
    return null;
  }
}

export async function getSmartMatchRecommendations(userPreferences: UserPreferences): Promise<SmartMatchResponse | null> {
  try {
    console.log('Sending Smart Match request with preferences:', userPreferences);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/movie-recommendations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        type: 'smart-match', 
        userPreferences 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Smart Match API error:', response.status, errorText);
      throw new Error(`Smart Match API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Smart Match API response:', result);
    
    return result;
  } catch (error) {
    console.error('Error fetching smart match recommendations:', error);
    return null;
  }
}

// Get statistics about movie selection fairness
export async function getSelectionStats(): Promise<{
  totalMovies: number;
  neverSelected: number;
  recentlySelected: number;
  oldestSelection: string | null;
  newestSelection: string | null;
} | null> {
  try {
    const { data: movies, error } = await supabase
      .from('movies')
      .select('last_selected_at')
      .eq('is_best_picture_nominee', true);

    if (error || !movies) {
      console.error('Error fetching selection stats:', error);
      return null;
    }

    const totalMovies = movies.length;
    const neverSelected = movies.filter(m => m.last_selected_at === null).length;
    const recentlySelected = movies.filter(m => {
      if (!m.last_selected_at) return false;
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return new Date(m.last_selected_at) > dayAgo;
    }).length;

    const selectedMovies = movies
      .filter(m => m.last_selected_at !== null)
      .map(m => new Date(m.last_selected_at!));

    const oldestSelection = selectedMovies.length > 0 
      ? new Date(Math.min(...selectedMovies.map(d => d.getTime()))).toISOString()

      : null;
    
    const newestSelection = selectedMovies.length > 0
      ? new Date(Math.max(...selectedMovies.map(d => d.getTime()))).toISOString()
      : null;

    return {
      totalMovies,
      neverSelected,
      recentlySelected,
      oldestSelection,
      newestSelection
    };
  } catch (error) {
    console.error('Error in getSelectionStats:', error);
    return null;
  }
}

// Browse by Years functions

// Get all available Oscar years
export async function getAvailableOscarYears(): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('oscar_year')
      .eq('is_best_picture_nominee', true)
      .not('oscar_year', 'is', null)
      .order('oscar_year', { ascending: true });

    if (error || !data) {
      console.error('Error fetching Oscar years:', error);
      return [];
    }

    // Get unique years
    const uniqueYears = [...new Set(data.map(movie => movie.oscar_year))].filter(year => year !== null) as number[];
    return uniqueYears.sort((a, b) => a - b);
  } catch (error) {
    console.error('Error in getAvailableOscarYears:', error);

    return [];
  }
}

// Get Best Picture winner for a specific Oscar year
export async function getBestPictureWinner(oscarYear: number): Promise<Movie | null> {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_best_picture_nominee', true)
      .eq('is_best_picture_winner', true)
      .eq('oscar_year', oscarYear)
      .single();

    if (error || !data) {
      console.error('Error fetching Best Picture winner:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getBestPictureWinner:', error);
    return null;
  }
}

// Get all nominees for a specific Oscar year
export async function getAllNomineesForYear(oscarYear: number): Promise<Movie[]> {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_best_picture_nominee', true)
      .eq('oscar_year', oscarYear)
      .order('is_best_picture_winner', { ascending: false }) // Winner first
      .order('title', { ascending: true });

    if (error || !data) {
      console.error('Error fetching nominees for year:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error in getAllNomineesForYear:', error);
    return [];
  }
}

// Get Oscar data for multiple years (for timeline view)
export async function getOscarYearsData(startYear?: number, endYear?: number): Promise<OscarYear[]> {
  try {
    let query = supabase
      .from('movies')
      .select('*')
      .eq('is_best_picture_nominee', true)
      .not('oscar_year', 'is', null);

    if (startYear) {
      query = query.gte('oscar_year', startYear);
    }
    if (endYear) {
      query = query.lte('oscar_year', endYear);
    }

    const { data, error } = await query.order('oscar_year', { ascending: true });

    if (error || !data) {
      console.error('Error fetching Oscar years data:', error);
      return [];
    }

    // Group movies by oscar_year
    const yearGroups = data.reduce((acc, movie) => {
      const year = movie.oscar_year!;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(movie);
      return acc;
    }, {} as Record<number, Movie[]>);

    // Convert to OscarYear objects
    const oscarYears: OscarYear[] = Object.entries(yearGroups).map(([year, movies]) => {
      const winner = movies.find(movie => movie.is_best_picture_winner);
      return {
        oscar_year: parseInt(year),
        winner,
        nominees: movies,
        totalNominees: movies.length
      };
    });

    return oscarYears.sort((a, b) => a.oscar_year - b.oscar_year);
  } catch (error) {
    console.error('Error in getOscarYearsData:', error);
    return [];
  }
}

// Get decade statistics for ALL decades
export async function getDecadeStats(): Promise<DecadeStats[]> {
  try {
    // Get all available Oscar years from database
    const availableYears = await getAvailableOscarYears();
    
    // Map each decade to its stats
    const decadeStats: DecadeStats[] = ALL_OSCAR_DECADES.map(decade => {
      // Count how many years we have for this decade
      const decadeYears = availableYears.filter(year => 
        year >= decade.startOscarYear && year <= decade.endOscarYear
      );
      
      return {
        id: decade.id,
        label: decade.label,
        description: decade.description,
        startOscarYear: decade.startOscarYear,
        endOscarYear: decade.endOscarYear,
        movieCount: decadeYears.length,
        isAvailable: decadeYears.length > 0
      };
    });

    return decadeStats;
  } catch (error) {
    console.error('Error in getDecadeStats:', error);
    return [];
  }
}