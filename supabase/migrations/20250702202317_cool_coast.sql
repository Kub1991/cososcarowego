/*
  # User Level Calculation System

  1. New Function
    - `calculate_user_level` - Calculates user level based on total_watched count
    - Implements progressive level thresholds with themed titles
    - Returns appropriate level number (1-10)

  2. Trigger
    - `on_user_profile_update_level` - Automatically updates level when total_watched changes
    - Ensures level is always in sync with watch count
    - Maintains data consistency

  3. Level Thresholds
    - Level 1 (Nowicjusz Filmowy): 0-4 watched movies
    - Level 2 (Odkrywca Klasyków): 5-9 watched movies
    - Level 3 (Koneser Kina): 10-19 watched movies
    - Level 4 (Mistrz Oscarów): 20-34 watched movies
    - Level 5 (Legenda Srebrnego Ekranu): 35-54 watched movies
    - Level 6 (Filmowy Erudyta): 55-79 watched movies
    - Level 7 (Oscarowy Wizjoner): 80-109 watched movies
    - Level 8 (Strażnik Dziedzictwa Filmu): 110-144 watched movies
    - Level 9 (Filmowy Autorytet): 145-199 watched movies
    - Level 10 (Nieśmiertelna Ikona Kina): 200+ watched movies
*/

-- Function to calculate user level based on total_watched count
CREATE OR REPLACE FUNCTION calculate_user_level(total_watched integer)
RETURNS integer AS $$
BEGIN
  RETURN CASE
    WHEN total_watched < 5 THEN 1    -- Nowicjusz Filmowy
    WHEN total_watched < 10 THEN 2   -- Odkrywca Klasyków
    WHEN total_watched < 20 THEN 3   -- Koneser Kina
    WHEN total_watched < 35 THEN 4   -- Mistrz Oscarów
    WHEN total_watched < 55 THEN 5   -- Legenda Srebrnego Ekranu
    WHEN total_watched < 80 THEN 6   -- Filmowy Erudyta
    WHEN total_watched < 110 THEN 7  -- Oscarowy Wizjoner
    WHEN total_watched < 145 THEN 8  -- Strażnik Dziedzictwa Filmu
    WHEN total_watched < 200 THEN 9  -- Filmowy Autorytet
    ELSE 10                          -- Nieśmiertelna Ikona Kina
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update level when total_watched changes
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update level if total_watched has changed
  IF NEW.total_watched IS DISTINCT FROM OLD.total_watched THEN
    NEW.level := calculate_user_level(NEW.total_watched);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_profile_update_level ON user_profiles;

-- Create trigger for user_profiles table
CREATE TRIGGER on_user_profile_update_level
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();

-- Update existing user profiles to ensure levels are correct
UPDATE user_profiles
SET level = calculate_user_level(total_watched)
WHERE level != calculate_user_level(total_watched);

-- Show migration results
DO $$
DECLARE
  function_exists BOOLEAN;
  trigger_exists BOOLEAN;
  updated_profiles INTEGER;
  level_counts RECORD;
BEGIN
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'calculate_user_level'
  ) INTO function_exists;
  
  -- Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_user_profile_update_level'
  ) INTO trigger_exists;
  
  -- Count updated profiles
  WITH updated AS (
    SELECT id, total_watched, level, calculate_user_level(total_watched) as calculated_level
    FROM user_profiles
    WHERE level != calculate_user_level(total_watched)
  )
  SELECT COUNT(*) INTO updated_profiles FROM updated;
  
  -- Display results
  RAISE NOTICE '🏆 USER LEVEL CALCULATION SYSTEM MIGRATION COMPLETED:';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'calculate_user_level function: %', CASE WHEN function_exists THEN 'CREATED' ELSE 'FAILED' END;
  RAISE NOTICE 'on_user_profile_update_level trigger: %', CASE WHEN trigger_exists THEN 'CREATED' ELSE 'FAILED' END;
  RAISE NOTICE 'Profiles with updated levels: %', updated_profiles;
  RAISE NOTICE '';
  RAISE NOTICE '📊 LEVEL THRESHOLDS:';
  RAISE NOTICE '   Level 1 (Nowicjusz Filmowy): 0-4 filmów';
  RAISE NOTICE '   Level 2 (Odkrywca Klasyków): 5-9 filmów';
  RAISE NOTICE '   Level 3 (Koneser Kina): 10-19 filmów';
  RAISE NOTICE '   Level 4 (Mistrz Oscarów): 20-34 filmów';
  RAISE NOTICE '   Level 5 (Legenda Srebrnego Ekranu): 35-54 filmów';
  RAISE NOTICE '   Level 6 (Filmowy Erudyta): 55-79 filmów';
  RAISE NOTICE '   Level 7 (Oscarowy Wizjoner): 80-109 filmów';
  RAISE NOTICE '   Level 8 (Strażnik Dziedzictwa Filmu): 110-144 filmów';
  RAISE NOTICE '   Level 9 (Filmowy Autorytet): 145-199 filmów';
  RAISE NOTICE '   Level 10 (Nieśmiertelna Ikona Kina): 200+ filmów';
  RAISE NOTICE '';
  RAISE NOTICE '✅ FEATURES ENABLED:';
  RAISE NOTICE '   - Automatic level calculation based on watched movies';
  RAISE NOTICE '   - Level updates whenever total_watched changes';
  RAISE NOTICE '   - Consistent level progression across the application';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 NEXT STEPS:';
  RAISE NOTICE '   1. Mark more movies as watched to see level progression';
  RAISE NOTICE '   2. Check your profile to see your current level';
  RAISE NOTICE '   3. Aim for higher levels by watching more Oscar movies';
  
  -- Show current level distribution
  RAISE NOTICE '';
  RAISE NOTICE '📈 CURRENT LEVEL DISTRIBUTION:';
  FOR level_counts IN 
    SELECT level, COUNT(*) as count
    FROM user_profiles
    GROUP BY level
    ORDER BY level
  LOOP
    RAISE NOTICE '   Level %: % users', level_counts.level, level_counts.count;
  END LOOP;
END $$;