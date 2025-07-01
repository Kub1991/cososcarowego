/*
  # Clear AI Tags for Re-processing

  1. Problem
    - AI tagging script generated tags but failed to save them due to database connection issues
    - Movies now have default values that prevent the script from recognizing them as needing tagging
    - Need to reset all AI-generated content to allow fresh regeneration

  2. Solution
    - Reset mood_tags to empty array for all Oscar movies
    - Reset thematic_tags to empty array for all Oscar movies
    - Reset classic_experience_level to default value for all Oscar movies
    - This will trigger the populate-ai-tags script to process all movies again

  3. Impact
    - All AI tags will be cleared and regenerated on next script run
    - Ensures fresh, properly generated tags with working database connection
*/

-- Clear all AI-generated tags for Oscar movies to enable re-processing
UPDATE movies 
SET 
  mood_tags = '{}',
  thematic_tags = '{}', 
  classic_experience_level = 'Mix wszystkiego',
  updated_at = now()
WHERE is_best_picture_nominee = true;

-- Show statistics after clearing
DO $$
DECLARE
  total_movies INTEGER;
  cleared_mood INTEGER;
  cleared_thematic INTEGER;
  cleared_experience INTEGER;
BEGIN
  -- Count total Oscar movies
  SELECT COUNT(*) INTO total_movies 
  FROM movies 
  WHERE is_best_picture_nominee = true;
  
  -- Count movies with cleared mood tags (should be all)
  SELECT COUNT(*) INTO cleared_mood 
  FROM movies 
  WHERE is_best_picture_nominee = true 
    AND array_length(mood_tags, 1) IS NULL;
  
  -- Count movies with cleared thematic tags (should be all)
  SELECT COUNT(*) INTO cleared_thematic 
  FROM movies 
  WHERE is_best_picture_nominee = true 
    AND array_length(thematic_tags, 1) IS NULL;
    
  -- Count movies with default experience level (should be all)
  SELECT COUNT(*) INTO cleared_experience 
  FROM movies 
  WHERE is_best_picture_nominee = true 
    AND classic_experience_level = 'Mix wszystkiego';
  
  -- Display results
  RAISE NOTICE '🧹 AI TAGS CLEARING COMPLETED:';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total Oscar movies: %', total_movies;
  RAISE NOTICE 'Movies with cleared mood tags: %', cleared_mood;
  RAISE NOTICE 'Movies with cleared thematic tags: %', cleared_thematic;
  RAISE NOTICE 'Movies with default experience level: %', cleared_experience;
  RAISE NOTICE '';
  RAISE NOTICE '✅ All AI tags have been cleared successfully!';
  RAISE NOTICE '🔄 Now you can run: npm run populate-ai-tags';
  RAISE NOTICE '💡 Make sure your OPENAI_API_KEY and Supabase credentials are correct in .env';
  RAISE NOTICE '🌐 Ensure you have a stable internet connection for the AI tagging process';
END $$;