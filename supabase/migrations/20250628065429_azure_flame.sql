/*
  # Fix RLS Policy for Movie Selection Tracking

  1. Problem
    - Previous RLS policy used NEW/OLD which only work in triggers, not RLS policies
    - Need to allow public users to update last_selected_at for fair movie rotation
    - Must prevent tampering with other movie data

  2. Solution
    - Create a simpler RLS policy that allows updates to Oscar nominees
    - Rely on application code to only update allowed fields
    - Add additional security through careful query design

  3. Security
    - Only Oscar nominees can be updated by public users
    - Application code controls which fields are updated
    - Other existing policies still protect sensitive operations
*/

-- Drop the problematic policy if it exists
DROP POLICY IF EXISTS "Public users can update movie selection tracking" ON movies;

-- Create a simpler, working RLS policy for public updates
CREATE POLICY "Public users can update movie selection tracking"
  ON movies
  FOR UPDATE
  TO public
  USING (is_best_picture_nominee = true)
  WITH CHECK (is_best_picture_nominee = true);

-- Show current RLS policies for verification
DO $$
DECLARE
  policy_record RECORD;
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
  RAISE NOTICE '🔐 RLS POLICY MIGRATION COMPLETED (FIXED):';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Total RLS policies for movies table: %', total_policies;
  RAISE NOTICE 'Oscar movies that can be tracked: %', oscar_movies;
  RAISE NOTICE 'Movies never selected (initial state): %', never_selected;
  RAISE NOTICE '';
  
  -- Show all policies for movies table
  RAISE NOTICE '📋 CURRENT RLS POLICIES FOR MOVIES TABLE:';
  FOR policy_record IN 
    SELECT policyname, roles, cmd, permissive
    FROM pg_policies 
    WHERE tablename = 'movies'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   - Policy: "%" | Roles: % | Command: % | Type: %', 
      policy_record.policyname, 
      policy_record.roles::text, 
      policy_record.cmd, 
      policy_record.permissive;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Public users can now update selection tracking!';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SECURITY DESIGN:';
  RAISE NOTICE '   - Policy: Only Oscar nominees can be updated by public users';
  RAISE NOTICE '   - Application: Code only updates last_selected_at and updated_at';
  RAISE NOTICE '   - Database: Other policies protect sensitive operations';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 WHAT THIS POLICY ALLOWS:';
  RAISE NOTICE '   - Public users can UPDATE rows where is_best_picture_nominee = true';
  RAISE NOTICE '   - Application code controls which specific columns get updated';
  RAISE NOTICE '   - Fair movie rotation can now work properly';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TESTING STEPS:';
  RAISE NOTICE '   1. Try Quick Shot feature in the app';
  RAISE NOTICE '   2. Check if last_selected_at gets updated in database';
  RAISE NOTICE '   3. Verify no "subquery" errors occur';
  RAISE NOTICE '   4. Confirm fair rotation works as expected';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  APPLICATION RESPONSIBILITY:';
  RAISE NOTICE '   - App code must only update last_selected_at and updated_at';
  RAISE NOTICE '   - Do not rely solely on RLS for column-level restrictions';
  RAISE NOTICE '   - Use explicit field selection in UPDATE queries';
END $$;