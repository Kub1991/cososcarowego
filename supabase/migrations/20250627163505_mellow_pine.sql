/*
  # Reset Phantom Thread Movie Data

  1. Problem
    - Film "Phantom Thread" ma nieprawidłowe dane z TMDB
    - Błędny oryginalny tytuł, brak poprawnego plakatu, nieprawidłowe oceny
    - Dane zostały pobrane z niewłaściwego filmu w TMDB

  2. Solution
    - Zresetuj wszystkie dane TMDB dla filmu "Phantom Thread"
    - Ustaw tmdb_id na wartość ujemną (wymusi ponowne wyszukanie)
    - Wyczyść wszystkie pola pochodzące z TMDB
    - Zachowaj podstawowe informacje (tytuł, rok, status oscarowy)

  3. Impact
    - Film będzie ponownie wyszukany i wzbogacony przy następnym uruchomieniu enrichment script
    - Poprawne dane zostaną pobrane z TMDB
*/

-- Reset Phantom Thread data for re-enrichment
UPDATE movies 
SET 
  tmdb_id = -2018001, -- Negative ID forces re-enrichment
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
WHERE title = 'Phantom Thread' 
  AND oscar_year = 2018
  AND is_best_picture_nominee = true;

-- Show migration results
DO $$
DECLARE
  reset_count INTEGER;
  movie_details RECORD;
BEGIN
  -- Check if movie was reset
  SELECT COUNT(*) INTO reset_count 
  FROM movies 
  WHERE title = 'Phantom Thread' 
    AND oscar_year = 2018
    AND tmdb_id = -2018001;
  
  -- Get movie details for verification
  SELECT id, title, oscar_year, tmdb_id, original_title, poster_path
  INTO movie_details
  FROM movies 
  WHERE title = 'Phantom Thread' 
    AND oscar_year = 2018
  LIMIT 1;
  
  -- Display results
  RAISE NOTICE '🎬 PHANTOM THREAD RESET MIGRATION COMPLETED:';
  RAISE NOTICE '==========================================';
  
  IF reset_count = 1 THEN
    RAISE NOTICE '✅ Successfully reset "Phantom Thread" data';
    RAISE NOTICE '🆔 Movie ID: %', movie_details.id;
    RAISE NOTICE '📅 Oscar Year: %', movie_details.oscar_year;
    RAISE NOTICE '🔢 TMDB ID: % (negative = needs enrichment)', movie_details.tmdb_id;
    RAISE NOTICE '📝 Original Title: % (should be NULL)', COALESCE(movie_details.original_title, 'NULL');
    RAISE NOTICE '🖼️  Poster Path: % (should be NULL)', COALESCE(movie_details.poster_path, 'NULL');
    RAISE NOTICE '';
    RAISE NOTICE '🔧 NEXT STEPS:';
    RAISE NOTICE '1. Run: npm run enrich-movies';
    RAISE NOTICE '2. Script will search for "Phantom Thread" (2017) in TMDB';
    RAISE NOTICE '3. Correct data will be fetched and stored';
    RAISE NOTICE '4. Movie should display properly with correct poster';
    RAISE NOTICE '';
    RAISE NOTICE '💡 The enrichment script will use title and year to find the correct TMDB entry';
    RAISE NOTICE '   for this Paul Thomas Anderson film starring Daniel Day-Lewis';
  ELSE
    RAISE NOTICE '❌ Movie not found or not reset';
    RAISE NOTICE '💡 Check if "Phantom Thread" exists with oscar_year = 2018';
    RAISE NOTICE '💡 Verify the title spelling exactly matches database entry';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎭 ABOUT PHANTOM THREAD:';
  RAISE NOTICE '   - Directed by Paul Thomas Anderson';
  RAISE NOTICE '   - Starring Daniel Day-Lewis';
  RAISE NOTICE '   - Nominated for Best Picture (2018 ceremony, 2017 film)';
  RAISE NOTICE '   - Should have high TMDB ratings when correctly matched';
END $$;

-- Ensure the needs_enrichment index is present
CREATE INDEX IF NOT EXISTS idx_movies_needs_enrichment 
ON movies(tmdb_id) 
WHERE tmdb_id < 0;