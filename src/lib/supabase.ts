import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Movie {
  id: string
  tmdb_id: number
  title: string
  original_title?: string
  year: number
  release_date?: string
  runtime?: number
  genre_ids?: number[]
  genres?: string[]
  overview?: string
  poster_path?: string
  backdrop_path?: string
  vote_average?: number
  vote_count?: number
  popularity?: number
  is_best_picture_nominee?: boolean
  is_best_picture_winner?: boolean
  oscar_year?: number
  ai_recommendation_text?: string
  ai_brief_text?: string
  mood_tags?: string[]
  classic_experience_level?: string
  thematic_tags?: any
  last_selected_at?: string
  created_at?: string
  updated_at?: string
}

export interface UserProfile {
  id: string
  user_id: string
  display_name?: string
  avatar_url?: string
  level?: number
  total_watched?: number
  current_streak?: number
  longest_streak?: number
  favorite_genres?: string[]
  favorite_decades?: string[]
  bio?: string
  is_public?: boolean
  created_at?: string
  updated_at?: string
}

export interface UserStats {
  watched_movies: number
  watchlist_movies: number
  achievements_count: number
  current_streak: number
  longest_streak: number
  level: number
}

export interface UserWatchlistItem {
  id: string
  user_id: string
  movie_id: string
  added_at?: string
  movies?: Movie
}

export interface StreamingAvailability {
  id: string
  movie_id: string
  country: string
  service_name: string
  service_id?: string
  availability_type: 'subscription' | 'rent' | 'buy' | 'free'
  price?: number
  currency?: string
  quality?: string
  last_updated?: string
  created_at?: string
}

// Auth functions
export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUpUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Movie functions
export const getMoviesByMood = async (mood: string, limit: number = 20): Promise<Movie[]> => {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .contains('mood_tags', [mood])
    .eq('is_best_picture_nominee', true)
    .order('last_selected_at', { ascending: true, nullsFirst: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching movies by mood:', error)
    throw error
  }

  return data || []
}

export const getMoviesByExperienceLevel = async (level: string, limit: number = 20): Promise<Movie[]> => {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('classic_experience_level', level)
    .eq('is_best_picture_nominee', true)
    .order('last_selected_at', { ascending: true, nullsFirst: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching movies by experience level:', error)
    throw error
  }

  return data || []
}

export const getMoviesByDecade = async (startYear: number, endYear: number, limit: number = 50): Promise<Movie[]> => {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .gte('year', startYear)
    .lte('year', endYear)
    .eq('is_best_picture_nominee', true)
    .order('year', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching movies by decade:', error)
    throw error
  }

  return data || []
}

export const getRandomMovie = async (): Promise<Movie | null> => {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('is_best_picture_nominee', true)
    .order('last_selected_at', { ascending: true, nullsFirst: true })
    .limit(1)

  if (error) {
    console.error('Error fetching random movie:', error)
    throw error
  }

  return data?.[0] || null
}

export const updateMovieLastSelected = async (movieId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('movies')
    .update({ last_selected_at: new Date().toISOString() })
    .eq('id', movieId)

  if (error) {
    console.error('Error updating movie last selected:', error)
    return false
  }

  return true
}

// User profile functions
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found, create one
      return await createUserProfile(userId)
    }
    console.error('Error fetching user profile:', error)
    throw error
  }

  return data
}

export const createUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([{ user_id: userId }])
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    throw error
  }

  return data
}

export const getUserStats = async (userId: string): Promise<UserStats> => {
  // Get watched movies count
  const { count: watchedCount } = await supabase
    .from('user_movie_watches')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Get watchlist count
  const { count: watchlistCount } = await supabase
    .from('user_watchlist')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Get achievements count
  const { count: achievementsCount } = await supabase
    .from('user_achievements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_completed', true)

  // Get user profile for level and streaks
  const profile = await getUserProfile(userId)

  return {
    watched_movies: watchedCount || 0,
    watchlist_movies: watchlistCount || 0,
    achievements_count: achievementsCount || 0,
    current_streak: profile?.current_streak || 0,
    longest_streak: profile?.longest_streak || 0,
    level: profile?.level || 1
  }
}

// Watchlist functions
export const getWatchlistMovies = async (userId: string): Promise<UserWatchlistItem[]> => {
  const { data, error } = await supabase
    .from('user_watchlist')
    .select(`
      *,
      movies (*)
    `)
    .eq('user_id', userId)
    .order('added_at', { ascending: false })

  if (error) {
    console.error('Error fetching watchlist movies:', error)
    throw error
  }

  return data || []
}

export const addToWatchlist = async (userId: string, movieId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('user_watchlist')
    .insert([{ user_id: userId, movie_id: movieId }])

  if (error) {
    console.error('Error adding to watchlist:', error)
    return false
  }

  return true
}

export const removeFromWatchlist = async (userId: string, movieId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('user_watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('movie_id', movieId)

  if (error) {
    console.error('Error removing from watchlist:', error)
    return false
  }

  return true
}

export const isInWatchlist = async (userId: string, movieId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_watchlist')
    .select('id')
    .eq('user_id', userId)
    .eq('movie_id', movieId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking watchlist:', error)
    return false
  }

  return !!data
}

// Watch history functions
export const markMovieAsWatched = async (userId: string, movieId: string): Promise<boolean> => {
  try {
    console.log('🎬 Supabase: Starting markMovieAsWatched for user:', userId, 'movie:', movieId)
    
    // First, remove from watchlist if it exists
    const { error: removeError } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)

    if (removeError) {
      console.log('⚠️ Supabase: Note - could not remove from watchlist (might not be in watchlist):', removeError.message)
    } else {
      console.log('✅ Supabase: Successfully removed from watchlist')
    }

    // Then add to watch history
    const { error: watchError } = await supabase
      .from('user_movie_watches')
      .insert([{ 
        user_id: userId, 
        movie_id: movieId,
        watched_at: new Date().toISOString()
      }])

    if (watchError) {
      console.error('❌ Supabase: Error adding to watch history:', watchError)
      return false
    }

    console.log('✅ Supabase: Successfully marked movie as watched')
    return true
  } catch (error) {
    console.error('❌ Supabase: Exception in markMovieAsWatched:', error)
    return false
  }
}

export const getWatchHistory = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('user_movie_watches')
    .select(`
      *,
      movies (*)
    `)
    .eq('user_id', userId)
    .order('watched_at', { ascending: false })

  if (error) {
    console.error('Error fetching watch history:', error)
    throw error
  }

  return data || []
}

// Streaming availability functions
export const getStreamingAvailability = async (movieId: string, country: string = 'PL'): Promise<StreamingAvailability[]> => {
  const { data, error } = await supabase
    .from('streaming_availability')
    .select('*')
    .eq('movie_id', movieId)
    .eq('country', country)
    .order('availability_type', { ascending: true })

  if (error) {
    console.error('Error fetching streaming availability:', error)
    throw error
  }

  return data || []
}

// Smart match functions
export const getSmartMatchRecommendations = async (preferences: any): Promise<Movie[]> => {
  try {
    const response = await supabase.functions.invoke('movie-recommendations', {
      body: { preferences }
    })

    if (response.error) {
      console.error('Error getting smart match recommendations:', response.error)
      throw response.error
    }

    return response.data?.recommendations || []
  } catch (error) {
    console.error('Error calling smart match function:', error)
    throw error
  }
}