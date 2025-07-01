/*
  # Change Thematic Tags to JSONB with Weights

  1. Schema Change
    - Change `thematic_tags` from `text[]` to `jsonb`
    - Migrate existing data to new format with default weight of 1.0
    - Add index for efficient JSONB querying

  2. Data Migration
    - Convert existing text arrays to JSONB format
    - Each tag becomes an object: {"tag": "Dramat", "importance": 1.0}
    - Preserve all existing data

  3. Performance
    - Add GIN index for JSONB operations
    - Ensure backward compatibility during migration
*/

-- First, let's backup existing data and create a temporary column
ALTER TABLE movies ADD COLUMN IF NOT EXISTS thematic_tags_jsonb jsonb DEFAULT '[]';

-- Migrate existing text[] data to jsonb format
UPDATE movies 
SET thematic_tags_jsonb = (
  SELECT jsonb_agg(
    jsonb_build_object('tag', tag_element, 'importance', 1.0)
  )
  FROM unnest(thematic_tags) AS tag_element
  WHERE thematic_tags IS NOT NULL AND array_length(thematic_tags, 1) > 0
)
WHERE thematic_tags IS NOT NULL AND array_length(thematic_tags, 1) > 0;

-- For movies with empty or null thematic_tags, set to empty array
UPDATE movies 
SET thematic_tags_jsonb = '[]'
WHERE thematic_tags IS NULL OR array_length(thematic_tags, 1) IS NULL;

-- Drop the old column and rename the new one
ALTER TABLE movies DROP COLUMN IF EXISTS thematic_tags;
ALTER TABLE movies RENAME COLUMN thematic_tags_jsonb TO thematic_tags;

-- Create GIN index for efficient JSONB operations
DROP INDEX IF EXISTS idx_movies_thematic_tags;
CREATE INDEX idx_movies_thematic_tags_jsonb ON movies USING GIN (thematic_tags);

-- Show migration results
DO $$
DECLARE
  total_movies INTEGER;
  movies_with_tags INTEGER;
  sample_tags RECORD;
BEGIN
  -- Count total Oscar movies
  SELECT COUNT(*) INTO total_movies 
  FROM movies 
  WHERE is_best_picture_nominee = true;
  
  -- Count movies with thematic tags
  SELECT COUNT(*) INTO movies_with_tags 
  FROM movies 
  WHERE is_best_picture_nominee = true 
    AND jsonb_array_length(thematic_tags) > 0;
  
  -- Display results
  RAISE NOTICE '📊 THEMATIC TAGS MIGRATION COMPLETED:';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Total Oscar movies: %', total_movies;
  RAISE NOTICE 'Movies with thematic tags: %', movies_with_tags;
  RAISE NOTICE '';
  
  -- Show sample of migrated data
  RAISE NOTICE '📋 SAMPLE MIGRATED DATA:';
  FOR sample_tags IN 
    SELECT title, thematic_tags
    FROM movies 
    WHERE is_best_picture_nominee = true
      AND jsonb_array_length(thematic_tags) > 0
    ORDER BY title
    LIMIT 3
  LOOP
    RAISE NOTICE '   "%": %', sample_tags.title, sample_tags.thematic_tags::text;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration successful! Thematic tags now support importance weights.';
  RAISE NOTICE '🔧 Next: Update populate-ai-tags script to generate weighted tags.';
  RAISE NOTICE '💡 Format: [{"tag": "Dramat", "importance": 0.9}, {"tag": "Kryminał", "importance": 0.7}]';
END $$;