/*
  # Add Personalization Columns to Movies Table

  1. New Columns
    - `mood_tags` (text[]) - Array of mood tags like 'Inspiracja', 'Adrenalina', 'Głębokie emocje', etc.
    - `thematic_tags` (text[]) - Array of thematic categories like 'Wojna i historia', 'Kryminał i thriller', etc.
    - `classic_experience_level` (text) - Difficulty level: 'Początkujący', 'Średnio zaawansowany', 'Kinoman', 'Mix wszystkiego'

  2. Indexes
    - Add GIN indexes for array columns to enable efficient searching
    - Add index for experience level filtering

  3. Sample Data
    - Add some sample tags to existing movies for testing
    - This will allow the Smart Match feature to work immediately

  4. Constraints
    - Add check constraints to ensure valid values for experience level
*/

-- Add new columns to movies table
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS mood_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS thematic_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS classic_experience_level text DEFAULT 'Mix wszystkiego';

-- Add check constraint for experience level
ALTER TABLE movies 
ADD CONSTRAINT movies_experience_level_check 
CHECK (classic_experience_level IN ('Początkujący', 'Średnio zaawansowany', 'Kinoman', 'Mix wszystkiego'));

-- Create GIN indexes for efficient array searching
CREATE INDEX IF NOT EXISTS idx_movies_mood_tags ON movies USING GIN (mood_tags);
CREATE INDEX IF NOT EXISTS idx_movies_thematic_tags ON movies USING GIN (thematic_tags);
CREATE INDEX IF NOT EXISTS idx_movies_experience_level ON movies (classic_experience_level);

-- Add some sample data to existing movies for immediate testing
-- This will allow the Smart Match feature to work right away

-- Update some well-known movies with sample tags
UPDATE movies 
SET 
  mood_tags = CASE 
    WHEN title ILIKE '%gladiator%' THEN ARRAY['Inspiracja', 'Adrenalina']
    WHEN title ILIKE '%shawshank%' THEN ARRAY['Inspiracja', 'Głębokie emocje']
    WHEN title ILIKE '%beautiful mind%' THEN ARRAY['Inspiracja', 'Intelektualne wyzwanie']
    WHEN title ILIKE '%departed%' THEN ARRAY['Adrenalina', 'Głębokie emocje']
    WHEN title ILIKE '%chicago%' THEN ARRAY['Humor', 'Romantyczny wieczór']
    WHEN title ILIKE '%lord of the rings%' THEN ARRAY['Adrenalina', 'Inspiracja']
    WHEN title ILIKE '%no country%' THEN ARRAY['Adrenalina', 'Intelektualne wyzwanie']
    WHEN title ILIKE '%slumdog%' THEN ARRAY['Inspiracja', 'Głębokie emocje']
    WHEN title ILIKE '%crash%' THEN ARRAY['Głębokie emocje', 'Intelektualne wyzwanie']
    WHEN title ILIKE '%million dollar baby%' THEN ARRAY['Inspiracja', 'Głębokie emocje']
    ELSE ARRAY['Inspiracja'] -- Default for movies without specific tags
  END,
  thematic_tags = CASE 
    WHEN title ILIKE '%gladiator%' THEN ARRAY['Wojna i historia', 'Biografie i dramaty']
    WHEN title ILIKE '%departed%' THEN ARRAY['Kryminał i thriller']
    WHEN title ILIKE '%beautiful mind%' THEN ARRAY['Biografie i dramaty', 'Społeczne problemy']
    WHEN title ILIKE '%chicago%' THEN ARRAY['Muzyka i taniec', 'Teatralne adaptacje']
    WHEN title ILIKE '%lord of the rings%' THEN ARRAY['Sci-fi i fantasy']
    WHEN title ILIKE '%no country%' THEN ARRAY['Kryminał i thriller']
    WHEN title ILIKE '%slumdog%' THEN ARRAY['Filmy międzynarodowe', 'Społeczne problemy']
    WHEN title ILIKE '%crash%' THEN ARRAY['Społeczne problemy']
    WHEN title ILIKE '%million dollar baby%' THEN ARRAY['Biografie i dramaty']
    WHEN title ILIKE '%traffic%' THEN ARRAY['Kryminał i thriller', 'Społeczne problemy']
    WHEN title ILIKE '%pianist%' THEN ARRAY['Wojna i historia', 'Biografie i dramaty']
    WHEN title ILIKE '%crouching tiger%' THEN ARRAY['Filmy międzynarodowe']
    ELSE ARRAY['Biografie i dramaty'] -- Default for movies without specific tags
  END,
  classic_experience_level = CASE 
    WHEN title ILIKE '%lord of the rings%' OR title ILIKE '%chicago%' OR title ILIKE '%gladiator%' THEN 'Początkujący'
    WHEN title ILIKE '%beautiful mind%' OR title ILIKE '%slumdog%' OR title ILIKE '%departed%' THEN 'Średnio zaawansowany'
    WHEN title ILIKE '%no country%' OR title ILIKE '%there will be blood%' OR title ILIKE '%pianist%' THEN 'Kinoman'
    ELSE 'Mix wszystkiego'
  END,
  updated_at = now()
WHERE is_best_picture_nominee = true;

-- Show statistics after adding columns
DO $$
DECLARE
  total_movies INTEGER;
  movies_with_mood_tags INTEGER;
  movies_with_thematic_tags INTEGER;
  experience_distribution RECORD;
BEGIN
  -- Count total Oscar movies
  SELECT COUNT(*) INTO total_movies 
  FROM movies 
  WHERE is_best_picture_nominee = true;
  
  -- Count movies with mood tags
  SELECT COUNT(*) INTO movies_with_mood_tags 
  FROM movies 
  WHERE is_best_picture_nominee = true 
    AND array_length(mood_tags, 1) > 0;
  
  -- Count movies with thematic tags
  SELECT COUNT(*) INTO movies_with_thematic_tags 
  FROM movies 
  WHERE is_best_picture_nominee = true 
    AND array_length(thematic_tags, 1) > 0;
  
  -- Display results
  RAISE NOTICE '🎯 PERSONALIZATION COLUMNS ADDED SUCCESSFULLY:';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total Oscar movies: %', total_movies;
  RAISE NOTICE 'Movies with mood tags: %', movies_with_mood_tags;
  RAISE NOTICE 'Movies with thematic tags: %', movies_with_thematic_tags;
  RAISE NOTICE '';
  
  -- Show experience level distribution
  RAISE NOTICE '📊 EXPERIENCE LEVEL DISTRIBUTION:';
  FOR experience_distribution IN 
    SELECT classic_experience_level, COUNT(*) as count
    FROM movies 
    WHERE is_best_picture_nominee = true
    GROUP BY classic_experience_level
    ORDER BY count DESC
  LOOP
    RAISE NOTICE '   %: % movies', experience_distribution.classic_experience_level, experience_distribution.count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Smart Match feature is now ready to use!';
  RAISE NOTICE '💡 You can now test the questionnaire flow with real data.';
  RAISE NOTICE '🔧 To add more detailed tags, consider running a script to analyze movie descriptions and genres.';
END $$;