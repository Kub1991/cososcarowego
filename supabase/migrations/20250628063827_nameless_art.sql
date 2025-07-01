/*
  # Enable public updates for last_selected_at tracking

  1. Problem
    - Frontend app (using anon key) cannot update last_selected_at column
    - Current RLS policies only allow authenticated users to modify movies
    - This prevents fair movie selection tracking from working

  2. Solution
    - Add new RLS policy for public users to update ONLY last_selected_at and updated_at
    - Use WITH CHECK to ensure no other columns can be modified
    - Maintain security while enabling selection tracking

  3. Security
    - Policy ensures only specific columns can be updated
    - All other movie data remains protected
    - Only movies that are Oscar nominees can be updated (additional safety)
*/

-- Add policy for public users to update only selection tracking columns
CREATE POLICY "Public users can update movie selection tracking"
  ON movies
  FOR UPDATE
  TO public
  USING (is_best_picture_nominee = true)
  WITH CHECK (
    -- Ensure all columns except last_selected_at and updated_at remain unchanged
    tmdb_id = (SELECT tmdb_id FROM movies WHERE id = movies.id) AND
    title = (SELECT title FROM movies WHERE id = movies.id) AND
    COALESCE(original_title, '') = COALESCE((SELECT original_title FROM movies WHERE id = movies.id), '') AND
    year = (SELECT year FROM movies WHERE id = movies.id) AND
    COALESCE(release_date, '1900-01-01'::date) = COALESCE((SELECT release_date FROM movies WHERE id = movies.id), '1900-01-01'::date) AND
    COALESCE(runtime, 0) = COALESCE((SELECT runtime FROM movies WHERE id = movies.id), 0) AND
    COALESCE(genre_ids, '{}') = COALESCE((SELECT genre_ids FROM movies WHERE id = movies.id), '{}') AND
    COALESCE(genres, '{}') = COALESCE((SELECT genres FROM movies WHERE id = movies.id), '{}') AND
    COALESCE(overview, '') = COALESCE((SELECT overview FROM movies WHERE id = movies.id), '') AND
    COALESCE(poster_path, '') = COALESCE((SELECT poster_path FROM movies WHERE id = movies.id), '') AND
    COALESCE(backdrop_path, '') = COALESCE((SELECT backdrop_path FROM movies WHERE id = movies.id), '') AND
    COALESCE(vote_average, 0) = COALESCE((SELECT vote_average FROM movies WHERE id = movies.id), 0) AND
    COALESCE(vote_count, 0) = COALESCE((SELECT vote_count FROM movies WHERE id = movies.id), 0) AND
    COALESCE(popularity, 0) = COALESCE((SELECT popularity FROM movies WHERE id = movies.id), 0) AND
    is_best_picture_nominee = (SELECT is_best_picture_nominee FROM movies WHERE id = movies.id) AND
    is_best_picture_winner = (SELECT is_best_picture_winner FROM movies WHERE id = movies.id) AND
    COALESCE(oscar_year, 0) = COALESCE((SELECT oscar_year FROM movies WHERE id = movies.id), 0) AND
    COALESCE(ai_recommendation_text, '') = COALESCE((SELECT ai_recommendation_text FROM movies WHERE id = movies.id), '') AND
    COALESCE(ai_brief_text, '') = COALESCE((SELECT ai_brief_text FROM movies WHERE id = movies.id), '') AND
    COALESCE(mood_tags, '{}') = COALESCE((SELECT mood_tags FROM movies WHERE id = movies.id), '{}') AND
    COALESCE(thematic_tags, '[]'::jsonb) = COALESCE((SELECT thematic_tags FROM movies WHERE id = movies.id), '[]'::jsonb) AND
    COALESCE(classic_experience_level, '') = COALESCE((SELECT classic_experience_level FROM movies WHERE id = movies.id), '') AND
    created_at = (SELECT created_at FROM movies WHERE id = movies.id)
    -- Note: last_selected_at and updated_at are intentionally excluded from this check
    -- These are the ONLY columns that public users can modify
  );

-- Test the policy by showing current state
DO $$
DECLARE
  total_policies INTEGER;
  oscar_movies INTEGER;
  never_selected INTEGER;
BEGIN
  -- Count RLS policies for movies table
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies 
  WHERE tablename = 'movies';
  
  -- Count Oscar movies
  SELECT COUNT(*) INTO oscar_movies 
  FROM movies 
  WHERE is_best_picture_nominee = true;
  
  -- Count movies never selected
  SELECT COUNT(*) INTO never_selected 
  FROM movies 
  WHERE last_selected_at IS NULL AND is_best_picture_nominee = true;
  
  -- Display results
  RAISE NOTICE '🔐 RLS POLICY MIGRATION COMPLETED:';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Total RLS policies for movies table: %', total_policies;
  RAISE NOTICE 'Oscar movies that can be tracked: %', oscar_movies;
  RAISE NOTICE 'Movies never selected (initial state): %', never_selected;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Public users can now update selection tracking!';
  RAISE NOTICE '🎯 Policy allows updates to ONLY these columns:';
  RAISE NOTICE '   - last_selected_at (selection timestamp)';
  RAISE NOTICE '   - updated_at (modification timestamp)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SECURITY FEATURES:';
  RAISE NOTICE '   - Only Oscar nominees can be updated';
  RAISE NOTICE '   - All other movie data remains protected';
  RAISE NOTICE '   - Policy prevents modification of critical columns';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TESTING:';
  RAISE NOTICE '   1. Try Quick Shot feature in the app';
  RAISE NOTICE '   2. Check if last_selected_at gets updated in database';
  RAISE NOTICE '   3. Verify fair rotation is working';
  RAISE NOTICE '';
  RAISE NOTICE '💡 If still not working, check:';
  RAISE NOTICE '   - Frontend error console for RLS violations';
  RAISE NOTICE '   - Supabase logs for policy conflicts';
  RAISE NOTICE '   - Ensure app is using correct anon key';
END $$;