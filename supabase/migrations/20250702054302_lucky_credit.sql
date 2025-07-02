/*
  # Simplify Movie Lists System

  1. Problem
    - Current system with user_movie_lists and user_list_movies is too complex
    - Users only need a simple "watchlist" functionality
    - Current implementation causes confusion with movie selection

  2. Solution
    - Remove existing tables: user_movie_lists and user_list_movies
    - Create a new, simplified user_watchlist table
    - Streamline the "Add to list" functionality to "Do obejrzenia"

  3. Changes
    - Drop user_list_movies and user_movie_lists tables
    - Create user_watchlist table with user_id, movie_id, added_at
    - Add appropriate RLS policies for security
    - Simplify database schema for better performance and clarity
*/

-- Drop existing policies for user_list_movies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own list movies" ON user_list_movies;
DROP POLICY IF EXISTS "Users can view list movies for public lists" ON user_list_movies;

-- Drop user_list_movies table first as it has foreign key dependencies
DROP TABLE IF EXISTS user_list_movies;

-- Drop existing policies for user_movie_lists to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own lists" ON user_movie_lists;
DROP POLICY IF EXISTS "Users can view public lists" ON user_movie_lists;

-- Drop user_movie_lists table
DROP TABLE IF EXISTS user_movie_lists;

-- Create user_watchlist table for "Do obejrzenia" functionality
CREATE TABLE IF NOT EXISTS user_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id uuid REFERENCES movies(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id) -- Ensure a user can only add a movie to their watchlist once
);

-- Create indexes for efficient lookups on the new user_watchlist table
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_movie_id ON user_watchlist(movie_id);

-- Enable Row Level Security for the new user_watchlist table
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_watchlist
-- Policy for authenticated users to manage (insert, select, update, delete) their own watchlist items
CREATE POLICY "Users can manage their own watchlist"
  ON user_watchlist
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to view public watchlists (if user_profiles.is_public is true)
CREATE POLICY "Users can view public watchlists"
  ON user_watchlist
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT user_id FROM user_profiles WHERE is_public = true
    )
  );

-- Display migration results
DO $$
DECLARE
  watchlist_table_exists BOOLEAN;
  watchlist_policies_count INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'user_watchlist'
  ) INTO watchlist_table_exists;

  SELECT COUNT(*) INTO watchlist_policies_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'user_watchlist';

  RAISE NOTICE '🎬 MOVIE LIST SIMPLIFICATION MIGRATION COMPLETED:';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'user_movie_lists and user_list_movies tables dropped.';
  RAISE NOTICE 'user_watchlist table created: %', watchlist_table_exists;
  RAISE NOTICE 'RLS policies for user_watchlist created: %', watchlist_policies_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Database schema updated for simplified movie lists.';
  RAISE NOTICE '💡 Next steps: Update application code to use the new user_watchlist table.';
END $$;