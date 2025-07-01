/*
  # Insert Oscar Best Picture Nominees (2000-2009)

  1. Movie Data Insertion
    - Inserts 55 Oscar Best Picture nominees from 2000-2009
    - Includes basic information: title, year, Oscar status, TMDB ID (where available)
    - Uses UPSERT logic to avoid conflicts with existing data

  2. Data Structure
    - Each movie has: title, oscar_year, is_best_picture_nominee, is_best_picture_winner
    - TMDB IDs included where reliable, null where needs search-by-title
    - Year represents the Oscar ceremony year (film year + 1)

  3. Missing Details
    - TMDB details (poster, overview, runtime, etc.) will be filled by enrichment script
    - AI-generated content (recommendations, briefs) will be added later
*/

-- Insert Oscar Best Picture nominees (2000-2009)
-- Using ON CONFLICT DO UPDATE to handle existing data gracefully

-- 2001 Oscar Ceremony (Films from 2000)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(98, 'Gladiator', 2000, 2001, true, true),
(1979, 'Chocolat', 2000, 2001, true, false),
(146, 'Crouching Tiger, Hidden Dragon', 2000, 2001, true, false),
(1649, 'Erin Brockovich', 2000, 2001, true, false),
(1422, 'Traffic', 2000, 2001, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2002 Oscar Ceremony (Films from 2001)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(453, 'A Beautiful Mind', 2001, 2002, true, true),
(10379, 'Gosford Park', 2001, 2002, true, false),
(9693, 'In the Bedroom', 2001, 2002, true, false),
(120, 'The Lord of the Rings: The Fellowship of the Ring', 2001, 2002, true, false),
(824, 'Moulin Rouge!', 2001, 2002, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2003 Oscar Ceremony (Films from 2002)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(1585, 'Chicago', 2002, 2003, true, true),
(3131, 'Gangs of New York', 2002, 2003, true, false),
(3212, 'The Hours', 2002, 2003, true, false),
(121, 'The Lord of the Rings: The Two Towers', 2002, 2003, true, false),
(423, 'The Pianist', 2002, 2003, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- Movies without reliable TMDB IDs - will be enriched by script using title search
-- Using negative IDs as temporary placeholders to avoid conflicts

-- 2004 Oscar Ceremony (Films from 2003)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(122, 'The Lord of the Rings: The Return of the King', 2003, 2004, true, true),
(153, 'Lost in Translation', 2003, 2004, true, false),
(8619, 'Master and Commander: The Far Side of the World', 2003, 2004, true, false),
(-2004001, 'Mystic River', 2003, 2004, true, false), -- Temporary ID, will be updated by script
(8487, 'Seabiscuit', 2003, 2004, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2005 Oscar Ceremony (Films from 2004)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(70, 'Million Dollar Baby', 2004, 2005, true, true),
(-2005001, 'The Aviator', 2004, 2005, true, false), -- Temporary ID
(-2005002, 'Finding Neverland', 2004, 2005, true, false), -- Temporary ID
(-2005003, 'Ray', 2004, 2005, true, false), -- Temporary ID
(2064, 'Sideways', 2004, 2005, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2006 Oscar Ceremony (Films from 2005)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(-2006001, 'Crash', 2005, 2006, true, true), -- Temporary ID
(-2006002, 'Brokeback Mountain', 2005, 2006, true, false), -- Temporary ID
(-2006003, 'Capote', 2005, 2006, true, false), -- Temporary ID
(-2006004, 'Good Night, and Good Luck', 2005, 2006, true, false), -- Temporary ID
(-2006005, 'Munich', 2005, 2006, true, false) -- Temporary ID
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2007 Oscar Ceremony (Films from 2006)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(-2007001, 'The Departed', 2006, 2007, true, true), -- Temporary ID
(-2007002, 'Babel', 2006, 2007, true, false), -- Temporary ID
(-2007003, 'Letters from Iwo Jima', 2006, 2007, true, false), -- Temporary ID
(-2007004, 'Little Miss Sunshine', 2006, 2007, true, false), -- Temporary ID
(-2007005, 'The Queen', 2006, 2007, true, false) -- Temporary ID
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2008 Oscar Ceremony (Films from 2007)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(6977, 'No Country for Old Men', 2007, 2008, true, true),
(-2008001, 'Atonement', 2007, 2008, true, false), -- Temporary ID
(-2008002, 'Juno', 2007, 2008, true, false), -- Temporary ID
(-2008003, 'Michael Clayton', 2007, 2008, true, false), -- Temporary ID
(7345, 'There Will Be Blood', 2007, 2008, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2009 Oscar Ceremony (Films from 2008)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(12405, 'Slumdog Millionaire', 2008, 2009, true, true),
(4922, 'The Curious Case of Benjamin Button', 2008, 2009, true, false),
(13804, 'Frost/Nixon', 2008, 2009, true, false),
(8810, 'Milk', 2008, 2009, true, false),
(12162, 'The Reader', 2008, 2009, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();

-- 2010 Oscar Ceremony (Films from 2009)
INSERT INTO movies (tmdb_id, title, year, oscar_year, is_best_picture_nominee, is_best_picture_winner) VALUES
(-2010001, 'The Hurt Locker', 2009, 2010, true, true), -- Temporary ID
(19995, 'Avatar', 2009, 2010, true, false),
(20662, 'The Blind Side', 2009, 2010, true, false),
(17654, 'District 9', 2009, 2010, true, false),
(29259, 'An Education', 2009, 2010, true, false),
(16869, 'Inglourious Basterds', 2009, 2010, true, false),
(24021, 'Precious', 2009, 2010, true, false),
(36557, 'A Serious Man', 2009, 2010, true, false),
(14160, 'Up', 2009, 2010, true, false),
(46738, 'Up in the Air', 2009, 2010, true, false)
ON CONFLICT (tmdb_id) DO UPDATE SET
  title = EXCLUDED.title,
  year = EXCLUDED.year,
  oscar_year = EXCLUDED.oscar_year,
  is_best_picture_nominee = EXCLUDED.is_best_picture_nominee,
  is_best_picture_winner = EXCLUDED.is_best_picture_winner,
  updated_at = now();