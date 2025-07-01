/*
  # Fix remaining incorrect original_title values and force re-enrichment

  1. Problem
    - Some movies still have incorrect original_title values that don't match the actual movie
    - This causes wrong posters to be displayed
    - Need to reset these movies to force re-enrichment with correct TMDB data

  2. Solution
    - Identify movies where original_title clearly doesn't match title
    - Reset their TMDB data to force re-enrichment
    - Use negative TMDB IDs to trigger enrichment script

  3. Impact
    - Movies with mismatched titles will be re-processed
    - Correct posters and data will be fetched from TMDB
*/

DO $$
DECLARE
  movie_record RECORD;
  fixed_count INTEGER := 0;
BEGIN
  -- Identify movies where original_title is present but does not match the title (case-insensitive)
  -- and is not the known foreign language exception, and has a positive TMDB ID (meaning it was enriched)
  -- and has a non-null poster_path (to avoid re-processing already cleared entries)
  FOR movie_record IN 
    SELECT id, title, original_title, tmdb_id, poster_path
    FROM movies 
    WHERE is_best_picture_nominee = true
    AND original_title IS NOT NULL
    AND LOWER(title) <> LOWER(original_title)
    AND NOT (title = 'Crouching Tiger, Hidden Dragon' AND original_title = '卧虎藏龍')
    AND tmdb_id > 0 -- Only target movies that have been enriched
    AND poster_path IS NOT NULL -- Only target movies that have a poster (i.e., were enriched)
    AND poster_path NOT ILIKE '%jpiDCxkCbo0.movieposter_maxres.jpg%' -- Exclude default fallback poster
  LOOP
    -- Reset the problematic movie data to force re-enrichment
    UPDATE movies 
    SET 
      tmdb_id = -1 * (ABS(movie_record.tmdb_id) + 1000000 + fixed_count), -- Assign a new unique negative ID
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
    
    RAISE NOTICE 'Fixed: "%" (original_title was: "%") - Reset for re-enrichment', 
      movie_record.title, movie_record.original_title;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎬 ORIGINAL_TITLE FIX MIGRATION COMPLETED';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'Movies reset for re-enrichment: %', fixed_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 NEXT STEPS:';
  RAISE NOTICE '1. Run: npm run enrich-movies';
  RAISE NOTICE '2. This will re-fetch correct data from TMDB for fixed movies';
  RAISE NOTICE '3. Posters should now display correctly';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Movies with negative TMDB IDs need re-enrichment';
END $$;

-- Ensure the index for needs_enrichment is up-to-date
CREATE INDEX IF NOT EXISTS idx_movies_needs_enrichment 
ON movies(tmdb_id) 
WHERE tmdb_id < 0;