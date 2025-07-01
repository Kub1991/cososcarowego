/*
  # Add Last Selected Tracking for Fair Movie Selection

  1. New Column
    - `last_selected_at` (timestamptz) - Tracks when movie was last selected in Quick Shot
    - Default value: NULL (movies never selected before)
    - Allows for fair rotation of movies in random selection

  2. Index
    - Add index on `last_selected_at` for efficient sorting
    - Optimizes queries for finding least recently selected movies

  3. Benefits
    - Ensures all movies get equal exposure over time
    - Prevents some movies from being shown too frequently
    - Better user experience with more diverse recommendations
*/

-- Add last_selected_at column to movies table
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS last_selected_at timestamptz DEFAULT NULL;

-- Create index for efficient sorting by last selection time
CREATE INDEX IF NOT EXISTS idx_movies_last_selected_at 
ON movies(last_selected_at NULLS FIRST);

-- Add index specifically for Oscar movies + last selection time
CREATE INDEX IF NOT EXISTS idx_movies_oscar_last_selected 
ON movies(is_best_picture_nominee, last_selected_at) 
WHERE is_best_picture_nominee = true;

-- Show migration results
DO $$
DECLARE
  total_movies INTEGER;
  oscar_movies INTEGER;
  never_selected INTEGER;
BEGIN
  -- Count total movies
  SELECT COUNT(*) INTO total_movies 
  FROM movies;
  
  -- Count Oscar movies
  SELECT COUNT(*) INTO oscar_movies 
  FROM movies 
  WHERE is_best_picture_nominee = true;
  
  -- Count movies never selected (should be all of them initially)
  SELECT COUNT(*) INTO never_selected 
  FROM movies 
  WHERE last_selected_at IS NULL AND is_best_picture_nominee = true;
  
  -- Display results
  RAISE NOTICE '📊 FAIR SELECTION SYSTEM MIGRATION COMPLETED:';
  RAISE NOTICE '=============================================';
  RAISE NOTICE 'Total movies in database: %', total_movies;
  RAISE NOTICE 'Oscar nominees: %', oscar_movies;
  RAISE NOTICE 'Movies never selected (should equal Oscar count): %', never_selected;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Added last_selected_at column successfully!';
  RAISE NOTICE '🎯 Quick Shot will now ensure fair rotation of all movies';
  RAISE NOTICE '📈 Movies not shown recently will have higher priority';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 INDEXES CREATED:';
  RAISE NOTICE '   - idx_movies_last_selected_at (general sorting)';
  RAISE NOTICE '   - idx_movies_oscar_last_selected (Oscar-specific queries)';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Next: Updated code will prefer least recently selected movies';
END $$;