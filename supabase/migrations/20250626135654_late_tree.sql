/*
  # Fix Movie Poster Issues - Correct Wrong Original Titles

  1. Problem Analysis
    - Many movies have incorrect original_title values that don't match the actual movie
    - This causes wrong posters to be displayed
    - Examples: "A Serious Man" shows as "Casino Royale", "The Reader" as "The Hurt Locker"

  2. Solution
    - Reset tmdb_id to negative values for movies with mismatched titles
    - Clear problematic original_title values
    - This will trigger the enrichment script to re-fetch correct data

  3. Movies to Fix
    - All movies where title and original_title are completely different
    - Force re-enrichment for these specific problematic cases
*/

-- First, let's identify and fix the most obvious mismatches
-- These are cases where the original_title is completely unrelated to the title

DO $$
DECLARE
  movie_record RECORD;
  fixed_count INTEGER := 0;
BEGIN
  -- List of problematic movies that need fixing based on the output
  FOR movie_record IN 
    SELECT id, title, original_title, tmdb_id
    FROM movies 
    WHERE is_best_picture_nominee = true
    AND title IS NOT NULL 
    AND original_title IS NOT NULL
    AND (
      -- Specific problematic cases from the output
      (title = 'A Serious Man' AND original_title = 'Casino Royale') OR
      (title = 'The Reader' AND original_title = 'The Hurt Locker') OR
      (title = 'Up in the Air' AND original_title = 'Incendies') OR
      (title = 'Erin Brockovich' AND original_title = 'Bill & Ted''s Bogus Journey') OR
      (title = 'An Education' AND original_title = 'Le Trou') OR
      (title = 'Frost/Nixon' AND original_title = 'Fast & Furious') OR
      (title = 'Chocolat' AND original_title = 'Fantastic Four: Rise of the Silver Surfer') OR
      (title = 'Precious' AND original_title = 'The Twilight Saga: Eclipse') OR
      (title = 'Gosford Park' AND original_title = 'Drop Dead Fred') OR
      (title = 'Milk' AND original_title = 'Mad Max 2') OR
      (title = 'The Blind Side' AND original_title = 'Robin Hood') OR
      (title = 'Traffic' AND original_title = 'The Departed') OR
      (title = 'In the Bedroom' AND original_title = 'Children of Men') OR
      (title = 'Chicago' AND original_title = 'It''s a Wonderful Life') OR
      (title = 'Sideways' AND original_title = 'While You Were Sleeping') OR
      (title = 'Seabiscuit' AND original_title = 'Wild Wild West') OR
      
      -- General case: original_title is completely different from title
      -- (not just language differences like "Crouching Tiger" vs "卧虎藏龍")
      (
        LOWER(title) != LOWER(original_title) AND
        -- Exclude the Chinese title case which is actually correct
        NOT (title = 'Crouching Tiger, Hidden Dragon' AND original_title = '卧虎藏龍') AND
        -- Exclude reasonable variations
        original_title NOT ILIKE '%' || SPLIT_PART(title, ' ', 1) || '%' AND
        title NOT ILIKE '%' || SPLIT_PART(original_title, ' ', 1) || '%'
      )
    )
  LOOP
    -- Reset the problematic movie data to force re-enrichment
    UPDATE movies 
    SET 
      tmdb_id = -999000 - fixed_count, -- Use unique negative ID
      original_title = NULL,
      poster_path = NULL,
      backdrop_path = NULL,
      overview = NULL,
      genres = NULL,
      genre_ids = NULL,
      vote_average = NULL,
      vote_count = NULL,
      popularity = NULL,
      release_date = NULL,
      runtime = NULL,
      ai_recommendation_text = NULL,
      ai_brief_text = NULL,
      updated_at = now()
    WHERE id = movie_record.id;
    
    fixed_count := fixed_count + 1;
    
    RAISE NOTICE 'Fixed: "%" (was: "%") - Reset for re-enrichment', 
      movie_record.title, movie_record.original_title;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎬 POSTER FIX MIGRATION COMPLETED';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'Fixed movies: %', fixed_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 NEXT STEPS:';
  RAISE NOTICE '1. Run: npm run enrich-movies';
  RAISE NOTICE '2. This will re-fetch correct data from TMDB for fixed movies';
  RAISE NOTICE '3. Posters should now display correctly';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Movies with negative TMDB IDs need re-enrichment';
END $$;

-- Create an index to help track movies that need re-enrichment
CREATE INDEX IF NOT EXISTS idx_movies_needs_enrichment 
ON movies(tmdb_id) 
WHERE tmdb_id < 0;

-- Update the updated_at timestamp for all fixed movies
UPDATE movies 
SET updated_at = now() 
WHERE is_best_picture_nominee = true 
AND tmdb_id < -999000;