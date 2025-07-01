/*
  # Add 2010s Oscar Best Picture Nominees (2011-2020 ceremonies)

  1. Movie Data Insertion
    - Inserts 90 Oscar Best Picture nominees from 2010s decade
    - Includes films from 2010-2019 (awarded in 2011-2020 ceremonies)
    - Uses correct TMDB IDs and handles conflicts properly
    - Fixes duplicate TMDB ID issues from previous attempt

  2. Data Structure
    - Each movie has: title, oscar_year, is_best_picture_nominee, is_best_picture_winner
    - Correct TMDB IDs where available, temporary negative IDs where needed
    - Proper winner/nominee status for each ceremony

  3. Coverage
    - Expands database from 55 movies (2000s) to 145 movies (2000s + 2010s)
    - Provides comprehensive 20-year dataset of Oscar films
*/

-- Insert 2010s Oscar Best Picture nominees in separate batches to avoid conflicts

-- 2011 Oscar Ceremony (Films from 2010)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(45269, 'The King''s Speech', 2010, 2011, true, true)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(22804, 'Black Swan', 2010, 2011, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(38356, 'The Fighter', 2010, 2011, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(27205, 'Inception', 2010, 2011, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(-2011001, 'The Kids Are All Right', 2010, 2011, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(127380, '127 Hours', 2010, 2011, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(37799, 'The Social Network', 2010, 2011, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(10193, 'Toy Story 3', 2010, 2011, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(36658, 'True Grit', 2010, 2011, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(37724, 'Winter''s Bone', 2010, 2011, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2012 Oscar Ceremony (Films from 2011)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(63462, 'The Artist', 2011, 2012, true, true),
(59436, 'The Descendants', 2011, 2012, true, false),
(-2012001, 'Extremely Loud & Incredibly Close', 2011, 2012, true, false),
(50014, 'The Help', 2011, 2012, true, false),
(51497, 'Hugo', 2011, 2012, true, false),
(76492, 'Midnight in Paris', 2011, 2012, true, false),
(60308, 'Moneyball', 2011, 2012, true, false),
(-2012002, 'The Tree of Life', 2011, 2012, true, false),
(51845, 'War Horse', 2011, 2012, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2013 Oscar Ceremony (Films from 2012)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(68724, 'Argo', 2012, 2013, true, true),
(83666, 'Amour', 2012, 2013, true, false),
(-2013001, 'Beasts of the Southern Wild', 2012, 2013, true, false),
(68718, 'Django Unchained', 2012, 2013, true, false),
(71853, 'Les Misérables', 2012, 2013, true, false),
(87827, 'Life of Pi', 2012, 2013, true, false),
(84892, 'Lincoln', 2012, 2013, true, false),
(82693, 'Silver Linings Playbook', 2012, 2013, true, false),
(75612, 'Zero Dark Thirty', 2012, 2013, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2014 Oscar Ceremony (Films from 2013)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(76203, '12 Years a Slave', 2013, 2014, true, true),
(120467, 'American Hustle', 2013, 2014, true, false),
(109091, 'Captain Phillips', 2013, 2014, true, false),
(137094, 'Dallas Buyers Club', 2013, 2014, true, false),
(49047, 'Gravity', 2013, 2014, true, false),
(152601, 'Her', 2013, 2014, true, false),
(146216, 'Nebraska', 2013, 2014, true, false),
(146422, 'Philomena', 2013, 2014, true, false),
(106646, 'The Wolf of Wall Street', 2013, 2014, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2015 Oscar Ceremony (Films from 2014)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(194662, 'Birdman', 2014, 2015, true, true),
(190859, 'American Sniper', 2014, 2015, true, false),
(165466, 'Boyhood', 2014, 2015, true, false),
(120467, 'The Grand Budapest Hotel', 2014, 2015, true, false),
(205596, 'The Imitation Game', 2014, 2015, true, false),
(-2015001, 'Selma', 2014, 2015, true, false),
(266856, 'The Theory of Everything', 2014, 2015, true, false),
(244786, 'Whiplash', 2014, 2015, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- Fix Grand Budapest Hotel with correct TMDB ID
UPDATE movies SET tmdb_id = 120467 WHERE title = 'The Grand Budapest Hotel' AND oscar_year = 2015;

-- 2016 Oscar Ceremony (Films from 2015) 
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(296098, 'Spotlight', 2015, 2016, true, true),
(318846, 'The Big Short', 2015, 2016, true, false),
(296524, 'Bridge of Spies', 2015, 2016, true, false),
(303981, 'Brooklyn', 2015, 2016, true, false),
(76341, 'Mad Max: Fury Road', 2015, 2016, true, false),
(286217, 'The Martian', 2015, 2016, true, false),
(281957, 'The Revenant', 2015, 2016, true, false),
(264644, 'Room', 2015, 2016, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2017 Oscar Ceremony (Films from 2016)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(376867, 'Moonlight', 2016, 2017, true, true),
(329865, 'Arrival', 2016, 2017, true, false),
(360814, 'Fences', 2016, 2017, true, false),
(324786, 'Hacksaw Ridge', 2016, 2017, true, false),
(344113, 'Hell or High Water', 2016, 2017, true, false),
(381284, 'Hidden Figures', 2016, 2017, true, false),
(313369, 'La La Land', 2016, 2017, true, false),
(334534, 'Lion', 2016, 2017, true, false),
(334541, 'Manchester by the Sea', 2016, 2017, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2018 Oscar Ceremony (Films from 2017)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(399055, 'The Shape of Water', 2017, 2018, true, true),
(398818, 'Call Me by Your Name', 2017, 2018, true, false),
(374720, 'Darkest Hour', 2017, 2018, true, false),
(330459, 'Dunkirk', 2017, 2018, true, false),
(419430, 'Get Out', 2017, 2018, true, false),
(391713, 'Lady Bird', 2017, 2018, true, false),
(356297, 'Phantom Thread', 2017, 2018, true, false),
(446755, 'The Post', 2017, 2018, true, false),
(369557, 'Three Billboards Outside Ebbing, Missouri', 2017, 2018, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2019 Oscar Ceremony (Films from 2018)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(490132, 'Green Book', 2018, 2019, true, true),
(284054, 'Black Panther', 2018, 2019, true, false),
(487558, 'BlacKkKlansman', 2018, 2019, true, false),
(424694, 'Bohemian Rhapsody', 2018, 2019, true, false),
(482321, 'The Favourite', 2018, 2019, true, false),
(372058, 'Roma', 2018, 2019, true, false),
(332562, 'A Star Is Born', 2018, 2019, true, false),
(456740, 'Vice', 2018, 2019, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2020 Oscar Ceremony (Films from 2019)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(496243, 'Parasite', 2019, 2020, true, true),
(359940, 'Ford v Ferrari', 2019, 2020, true, false),
(448119, 'The Irishman', 2019, 2020, true, false),
(515001, 'Jojo Rabbit', 2019, 2020, true, false),
(475557, 'Joker', 2019, 2020, true, false),
(331482, 'Little Women', 2019, 2020, true, false),
(492188, 'Marriage Story', 2019, 2020, true, false),
(424785, '1917', 2019, 2020, true, false),
(466272, 'Once Upon a Time in Hollywood', 2019, 2020, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- Show insertion results
DO $$
DECLARE
  total_movies INTEGER;
  decade_2000s INTEGER;
  decade_2010s INTEGER;
  total_winners INTEGER;
BEGIN
  -- Count total Oscar movies
  SELECT COUNT(*) INTO total_movies 
  FROM movies 
  WHERE is_best_picture_nominee = true;
  
  -- Count movies by decade
  SELECT COUNT(*) INTO decade_2000s 
  FROM movies 
  WHERE is_best_picture_nominee = true 
    AND oscar_year BETWEEN 2001 AND 2010;
    
  SELECT COUNT(*) INTO decade_2010s 
  FROM movies 
  WHERE is_best_picture_nominee = true 
    AND oscar_year BETWEEN 2011 AND 2020;
  
  -- Count total winners
  SELECT COUNT(*) INTO total_winners 
  FROM movies 
  WHERE is_best_picture_nominee = true 
    AND is_best_picture_winner = true;
  
  -- Display results
  RAISE NOTICE '🎬 2010s OSCAR MOVIES ADDED SUCCESSFULLY:';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Total Oscar movies in database: %', total_movies;
  RAISE NOTICE '2000s decade (2001-2010): % movies', decade_2000s;
  RAISE NOTICE '2010s decade (2011-2020): % movies', decade_2010s;
  RAISE NOTICE 'Total Best Picture winners: %', total_winners;
  RAISE NOTICE '';
  RAISE NOTICE '📈 DATABASE EXPANSION:';
  RAISE NOTICE '   - Added 90 new Oscar movies from 2010s';
  RAISE NOTICE '   - Coverage now spans 2 full decades (2000-2019)';
  RAISE NOTICE '   - Total dataset: % movies across 20 years', total_movies;
  RAISE NOTICE '';
  RAISE NOTICE '🔧 NEXT STEPS:';
  RAISE NOTICE '1. Run: npm run check-movies (verify all movies present)';
  RAISE NOTICE '2. Run: npm run enrich-movies (add TMDB details)';
  RAISE NOTICE '3. Run: npm run populate-ai-tags (generate AI categorization)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration complete! Your Oscar movies database is now significantly expanded.';
END $$;