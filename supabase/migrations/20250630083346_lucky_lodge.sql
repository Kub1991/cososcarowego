/*
  # User Management System

  1. New Tables
    - `user_profiles` - Extended user profile information
    - `user_movie_lists` - User's custom movie lists (watchlist, watched, custom lists)
    - `user_list_movies` - Movies in user lists (many-to-many relationship)
    - `user_movie_watches` - Track watched movies with ratings and notes
    - `user_achievements` - User achievements and badges
    - `user_challenges` - User challenges and progress

  2. Security
    - Enable RLS on all user tables
    - Users can only access their own data
    - Public read access where appropriate

  3. Features
    - User profiles with level progression
    - Multiple custom lists per user
    - Watch history with ratings
    - Achievement system
    - Challenge tracking
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  level integer DEFAULT 1,
  total_watched integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  favorite_genres text[] DEFAULT '{}',
  favorite_decades text[] DEFAULT '{}',
  bio text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_movie_lists table
CREATE TABLE IF NOT EXISTS user_movie_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  is_public boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_list_movies table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_list_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid REFERENCES user_movie_lists(id) ON DELETE CASCADE NOT NULL,
  movie_id uuid REFERENCES movies(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz DEFAULT now(),
  notes text,
  priority integer DEFAULT 0,
  UNIQUE(list_id, movie_id)
);

-- Create user_movie_watches table
CREATE TABLE IF NOT EXISTS user_movie_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id uuid REFERENCES movies(id) ON DELETE CASCADE NOT NULL,
  watched_at timestamptz DEFAULT now(),
  rating integer CHECK (rating >= 1 AND rating <= 10),
  notes text,
  rewatch_count integer DEFAULT 0,
  UNIQUE(user_id, movie_id, watched_at)
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type text NOT NULL,
  achievement_name text NOT NULL,
  description text,
  icon text,
  earned_at timestamptz DEFAULT now(),
  progress integer DEFAULT 0,
  max_progress integer DEFAULT 1,
  is_completed boolean DEFAULT false,
  UNIQUE(user_id, achievement_type, achievement_name)
);

-- Create user_challenges table
CREATE TABLE IF NOT EXISTS user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_type text NOT NULL,
  challenge_name text NOT NULL,
  description text,
  target_count integer NOT NULL,
  current_count integer DEFAULT 0,
  deadline timestamptz,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, challenge_type, challenge_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_movie_lists_user_id ON user_movie_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_list_movies_list_id ON user_list_movies(list_id);
CREATE INDEX IF NOT EXISTS idx_user_list_movies_movie_id ON user_list_movies(movie_id);
CREATE INDEX IF NOT EXISTS idx_user_movie_watches_user_id ON user_movie_watches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_movie_watches_movie_id ON user_movie_watches(movie_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_movie_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_list_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_movie_watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON user_profiles;

DROP POLICY IF EXISTS "Users can manage their own lists" ON user_movie_lists;
DROP POLICY IF EXISTS "Users can view public lists" ON user_movie_lists;

DROP POLICY IF EXISTS "Users can manage their own list movies" ON user_list_movies;
DROP POLICY IF EXISTS "Users can view list movies for public lists" ON user_list_movies;

DROP POLICY IF EXISTS "Users can manage their own watch history" ON user_movie_watches;
DROP POLICY IF EXISTS "Users can view public watch history" ON user_movie_watches;

DROP POLICY IF EXISTS "Users can manage their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view public achievements" ON user_achievements;

DROP POLICY IF EXISTS "Users can manage their own challenges" ON user_challenges;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Create RLS policies for user_movie_lists
CREATE POLICY "Users can manage their own lists"
  ON user_movie_lists
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public lists"
  ON user_movie_lists
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Create RLS policies for user_list_movies
CREATE POLICY "Users can manage their own list movies"
  ON user_list_movies
  FOR ALL
  TO authenticated
  USING (
    list_id IN (
      SELECT id FROM user_movie_lists WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    list_id IN (
      SELECT id FROM user_movie_lists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view list movies for public lists"
  ON user_list_movies
  FOR SELECT
  TO authenticated
  USING (
    list_id IN (
      SELECT id FROM user_movie_lists WHERE is_public = true
    )
  );

-- Create RLS policies for user_movie_watches
CREATE POLICY "Users can manage their own watch history"
  ON user_movie_watches
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public watch history"
  ON user_movie_watches
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT user_id FROM user_profiles WHERE is_public = true
    )
  );

-- Create RLS policies for user_achievements
CREATE POLICY "Users can manage their own achievements"
  ON user_achievements
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT user_id FROM user_profiles WHERE is_public = true
    )
  );

-- Create RLS policies for user_challenges
CREATE POLICY "Users can manage their own challenges"
  ON user_challenges
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_user_movie_lists_updated_at ON user_movie_lists;
DROP TRIGGER IF EXISTS update_user_challenges_updated_at ON user_challenges;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_movie_lists_updated_at
  BEFORE UPDATE ON user_movie_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_challenges_updated_at
  BEFORE UPDATE ON user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Show migration results
DO $$
DECLARE
  user_table_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Count user-related tables
  SELECT COUNT(*) INTO user_table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name LIKE 'user_%';
  
  -- Count RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename LIKE 'user_%';
  
  -- Display results
  RAISE NOTICE '🔐 USER MANAGEMENT SYSTEM MIGRATION COMPLETED:';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'User-related tables created: %', user_table_count;
  RAISE NOTICE 'RLS policies created: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE '📊 NEW TABLES:';
  RAISE NOTICE '   - user_profiles (extended user information)';
  RAISE NOTICE '   - user_movie_lists (custom movie lists)';
  RAISE NOTICE '   - user_list_movies (movies in lists)';
  RAISE NOTICE '   - user_movie_watches (watch history)';
  RAISE NOTICE '   - user_achievements (badges and achievements)';
  RAISE NOTICE '   - user_challenges (challenges and progress)';
  RAISE NOTICE '';
  RAISE NOTICE '🛡️  SECURITY FEATURES:';
  RAISE NOTICE '   - RLS enabled on all user tables';
  RAISE NOTICE '   - Users can only access their own data';
  RAISE NOTICE '   - Public profiles and lists support';
  RAISE NOTICE '   - Comprehensive permission system';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 FEATURES ENABLED:';
  RAISE NOTICE '   - User registration and profiles';
  RAISE NOTICE '   - Custom movie lists and watchlists';
  RAISE NOTICE '   - Watch history with ratings';
  RAISE NOTICE '   - Achievement and leveling system';
  RAISE NOTICE '   - Challenge tracking and progress';
  RAISE NOTICE '   - Social features (public profiles)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ User management system is ready for production use!';
  RAISE NOTICE '🎯 Next: Test user registration and dashboard functionality';
END $$;