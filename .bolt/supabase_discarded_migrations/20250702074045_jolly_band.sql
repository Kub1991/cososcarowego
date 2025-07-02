/*
  # Oscar Progress Tracking System

  1. New Table
    - `user_oscar_progress` - Tracks user progress through Oscar movies by decade and year
    - Automatically updated when users mark movies as watched
    - Stores progress percentages for beautiful visualizations

  2. Functions
    - `get_decade_from_oscar_year()` - Maps Oscar years to decades
    - `update_user_oscar_progress()` - Calculates and updates progress automatically

  3. Trigger
    - Automatically fires when user marks movie as watched
    - Updates both decade and Oscar year progress in real-time

  4. Security
    - RLS enabled - users can only see their own progress
    - Proper indexes for performance
*/

-- Create user_oscar_progress table
CREATE TABLE IF NOT EXISTS user_oscar_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_type text NOT NULL CHECK (category_type IN ('decade', 'oscar_year')),
  category_identifier text NOT NULL, -- e.g., '2010s' or '2017'
  movies_watched_count integer DEFAULT 0,
  total_movies_in_category integer DEFAULT 0,
  progress_percentage integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category_type, category_identifier)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_oscar_progress_user_id ON user_oscar_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_oscar_progress_category ON user_oscar_progress(category_type, category_identifier);

-- Enable Row Level Security
ALTER TABLE user_oscar_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own Oscar progress"
  ON user_oscar_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate decade from Oscar year
CREATE OR REPLACE FUNCTION get_decade_from_oscar_year(oscar_year integer)
RETURNS text AS $$
BEGIN
  CASE 
    WHEN oscar_year >= 2001 AND oscar_year <= 2010 THEN RETURN '2000s';
    WHEN oscar_year >= 2011 AND oscar_year <= 2020 THEN RETURN '2010s';
    WHEN oscar_year >= 1991 AND oscar_year <= 2000 THEN RETURN '1990s';
    WHEN oscar_year >= 1981 AND oscar_year <= 1990 THEN RETURN '1980s';
    WHEN oscar_year >= 1971 AND oscar_year <= 1980 THEN RETURN '1970s';
    WHEN oscar_year >= 1961 AND oscar_year <= 1970 THEN RETURN '1960s';
    WHEN oscar_year >= 1951 AND oscar_year <= 1960 THEN RETURN '1950s';
    WHEN oscar_year >= 1941 AND oscar_year <= 1950 THEN RETURN '1940s';
    WHEN oscar_year >= 1931 AND oscar_year <= 1940 THEN RETURN '1930s';
    WHEN oscar_year >= 1929 AND oscar_year <= 1930 THEN RETURN '1920s';
    ELSE RETURN 'Other';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to update user Oscar progress
CREATE OR REPLACE FUNCTION update_user_oscar_progress()
RETURNS TRIGGER AS $$
DECLARE
  movie_oscar_year integer;
  movie_decade text;
  decade_watched_count integer;
  decade_total_count integer;
  year_watched_count integer;
  year_total_count integer;
BEGIN
  -- Get the Oscar year for the watched movie
  SELECT oscar_year INTO movie_oscar_year
  FROM movies 
  WHERE id = NEW.movie_id AND is_best_picture_nominee = true;
  
  -- Skip if movie is not an Oscar nominee or has no Oscar year
  IF movie_oscar_year IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate decade
  movie_decade := get_decade_from_oscar_year(movie_oscar_year);
  
  -- Calculate decade progress
  -- Count watched movies in this decade for this user
  SELECT COUNT(DISTINCT umw.movie_id) INTO decade_watched_count
  FROM user_movie_watches umw
  JOIN movies m ON umw.movie_id = m.id
  WHERE umw.user_id = NEW.user_id 
    AND m.is_best_picture_nominee = true
    AND get_decade_from_oscar_year(m.oscar_year) = movie_decade;
  
  -- Count total movies in this decade
  SELECT COUNT(*) INTO decade_total_count
  FROM movies 
  WHERE is_best_picture_nominee = true
    AND get_decade_from_oscar_year(oscar_year) = movie_decade;
  
  -- Update or insert decade progress
  INSERT INTO user_oscar_progress (
    user_id, 
    category_type, 
    category_identifier, 
    movies_watched_count, 
    total_movies_in_category, 
    progress_percentage,
    last_updated
  ) VALUES (
    NEW.user_id,
    'decade',
    movie_decade,
    decade_watched_count,
    decade_total_count,
    CASE WHEN decade_total_count > 0 THEN ROUND((decade_watched_count::float / decade_total_count::float) * 100) ELSE 0 END,
    now()
  )
  ON CONFLICT (user_id, category_type, category_identifier) 
  DO UPDATE SET
    movies_watched_count = EXCLUDED.movies_watched_count,
    total_movies_in_category = EXCLUDED.total_movies_in_category,
    progress_percentage = EXCLUDED.progress_percentage,
    last_updated = EXCLUDED.last_updated;
  
  -- Calculate Oscar year progress
  -- Count watched movies in this Oscar year for this user
  SELECT COUNT(DISTINCT umw.movie_id) INTO year_watched_count
  FROM user_movie_watches umw
  JOIN movies m ON umw.movie_id = m.id
  WHERE umw.user_id = NEW.user_id 
    AND m.is_best_picture_nominee = true
    AND m.oscar_year = movie_oscar_year;
  
  -- Count total movies in this Oscar year
  SELECT COUNT(*) INTO year_total_count
  FROM movies 
  WHERE is_best_picture_nominee = true
    AND oscar_year = movie_oscar_year;
  
  -- Update or insert Oscar year progress
  INSERT INTO user_oscar_progress (
    user_id, 
    category_type, 
    category_identifier, 
    movies_watched_count, 
    total_movies_in_category, 
    progress_percentage,
    last_updated
  ) VALUES (
    NEW.user_id,
    'oscar_year',
    movie_oscar_year::text,
    year_watched_count,
    year_total_count,
    CASE WHEN year_total_count > 0 THEN ROUND((year_watched_count::float / year_total_count::float) * 100) ELSE 0 END,
    now()
  )
  ON CONFLICT (user_id, category_type, category_identifier) 
  DO UPDATE SET
    movies_watched_count = EXCLUDED.movies_watched_count,
    total_movies_in_category = EXCLUDED.total_movies_in_category,
    progress_percentage = EXCLUDED.progress_percentage,
    last_updated = EXCLUDED.last_updated;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update progress when movie is watched
DROP TRIGGER IF EXISTS on_movie_watched_update_progress ON user_movie_watches;
CREATE TRIGGER on_movie_watched_update_progress
  AFTER INSERT ON user_movie_watches
  FOR EACH ROW
  EXECUTE FUNCTION update_user_oscar_progress();

-- Show migration results
DO $$
DECLARE
  progress_table_exists BOOLEAN;
  trigger_exists BOOLEAN;
  function_exists BOOLEAN;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_oscar_progress'
  ) INTO progress_table_exists;
  
  -- Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_movie_watched_update_progress'
  ) INTO trigger_exists;
  
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'update_user_oscar_progress'
  ) INTO function_exists;
  
  -- Display results with proper RAISE syntax
  RAISE NOTICE 'OSCAR PROGRESS TRACKING SYSTEM MIGRATION COMPLETED';
  RAISE NOTICE '======================================================';
  
  IF progress_table_exists THEN
    RAISE NOTICE 'user_oscar_progress table: CREATED';
  ELSE
    RAISE NOTICE 'user_oscar_progress table: FAILED';
  END IF;
  
  IF function_exists THEN
    RAISE NOTICE 'update_user_oscar_progress function: CREATED';
  ELSE
    RAISE NOTICE 'update_user_oscar_progress function: FAILED';
  END IF;
  
  IF trigger_exists THEN
    RAISE NOTICE 'on_movie_watched_update_progress trigger: CREATED';
  ELSE
    RAISE NOTICE 'on_movie_watched_update_progress trigger: FAILED';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'FEATURES ENABLED:';
  RAISE NOTICE '- Automatic decade progress tracking (e.g. 2010s: 15%)';
  RAISE NOTICE '- Automatic Oscar year progress tracking (e.g. 2017: 65%)';
  RAISE NOTICE '- Real-time updates when movies are marked as watched';
  RAISE NOTICE '- Responsive progress visualization in Moja podroz';
  RAISE NOTICE '';
  RAISE NOTICE 'HOW IT WORKS:';
  RAISE NOTICE '1. User marks movie as watched -> trigger fires';
  RAISE NOTICE '2. System calculates decade and Oscar year';
  RAISE NOTICE '3. Updates progress counts and percentages';
  RAISE NOTICE '4. Frontend displays beautiful progress bars';
  RAISE NOTICE '';
  RAISE NOTICE 'PROGRESS CATEGORIES:';
  RAISE NOTICE '- Decades: 2000s, 2010s, 1990s, etc.';
  RAISE NOTICE '- Oscar Years: 2017, 2018, 2019, etc.';
  RAISE NOTICE '- Automatic percentage calculation';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Update frontend to display progress data!';
END $$;