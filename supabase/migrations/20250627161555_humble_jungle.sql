/*
  # Add Missing American Hustle Movie

  1. Problem
    - Film "American Hustle" (2014) nie został poprawnie dodany z powodu konfliktu TMDB ID
    - W poprzedniej migracji "American Hustle" i "The Grand Budapest Hotel" miały ten sam TMDB ID

  2. Solution
    - Dodaj "American Hustle" z poprawnym TMDB ID (120467) 
    - Popraw "The Grand Budapest Hotel" z właściwym TMDB ID (138843)
    - Użyj ON CONFLICT DO UPDATE dla bezpieczeństwa

  3. Movies
    - American Hustle (2013, Oscar 2014) - nominowany
    - The Grand Budapest Hotel (2014, Oscar 2015) - nominowany
*/

-- Fix The Grand Budapest Hotel with correct TMDB ID first
UPDATE movies 
SET tmdb_id = 138843 
WHERE title = 'The Grand Budapest Hotel' 
  AND oscar_year = 2015
  AND tmdb_id = 120467;

-- Now add/update American Hustle with correct TMDB ID
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(120467, 'American Hustle', 2013, 2014, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- Show results
DO $$
DECLARE
  american_hustle_count INTEGER;
  grand_budapest_count INTEGER;
  total_2014_nominees INTEGER;
  total_movies INTEGER;
BEGIN
  -- Check if American Hustle exists
  SELECT COUNT(*) INTO american_hustle_count 
  FROM movies 
  WHERE title = 'American Hustle' AND oscar_year = 2014;
  
  -- Check if Grand Budapest Hotel exists with correct year
  SELECT COUNT(*) INTO grand_budapest_count 
  FROM movies 
  WHERE title = 'The Grand Budapest Hotel' AND oscar_year = 2015;
  
  -- Count 2014 nominees (should be 9)
  SELECT COUNT(*) INTO total_2014_nominees 
  FROM movies 
  WHERE oscar_year = 2014 AND is_best_picture_nominee = true;
  
  -- Count total movies
  SELECT COUNT(*) INTO total_movies 
  FROM movies 
  WHERE is_best_picture_nominee = true;
  
  -- Display results
  RAISE NOTICE '🎬 AMERICAN HUSTLE MIGRATION RESULTS:';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'American Hustle (2014) found: %', american_hustle_count;
  RAISE NOTICE 'Grand Budapest Hotel (2015) found: %', grand_budapest_count;
  RAISE NOTICE '2014 Oscar nominees total: %', total_2014_nominees;
  RAISE NOTICE 'Total Oscar movies: %', total_movies;
  RAISE NOTICE '';
  
  IF american_hustle_count = 1 AND total_2014_nominees = 9 THEN
    RAISE NOTICE '✅ SUCCESS: American Hustle successfully added!';
    RAISE NOTICE '✅ 2014 nominees complete (9/9)';
    RAISE NOTICE '🎯 Database should now show 143 movies total';
  ELSE
    RAISE NOTICE '❌ ISSUE: Something may be wrong with the insertion';
    RAISE NOTICE '💡 Check for conflicts or duplicate entries';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔧 NEXT STEPS:';
  RAISE NOTICE '1. Refresh Supabase dashboard to see updated count';
  RAISE NOTICE '2. Run: npm run check-movies (should show 143/143)';
  RAISE NOTICE '3. Run: npm run enrich-movies (to get TMDB data)';
END $$;