/*
  # Clear All AI Descriptions

  1. Purpose
    - Completely clear all AI-generated content from movies table
    - Reset ai_recommendation_text and ai_brief_text to NULL
    - Force regeneration of all AI descriptions with improved prompts

  2. Changes
    - Set ai_recommendation_text = NULL for all Oscar movies
    - Set ai_brief_text = NULL for all Oscar movies
    - Update updated_at timestamp

  3. Impact
    - All AI descriptions will be regenerated on next use
    - Ensures fresh, improved descriptions with new AI prompts
*/

-- Clear all AI-generated descriptions for Oscar movies
UPDATE movies 
SET 
  ai_recommendation_text = NULL,
  ai_brief_text = NULL,
  updated_at = now()
WHERE is_best_picture_nominee = true;

-- Show statistics after clearing
DO $$
DECLARE
  total_movies INTEGER;
  cleared_recommendations INTEGER;
  cleared_briefs INTEGER;
BEGIN
  -- Count total Oscar movies
  SELECT COUNT(*) INTO total_movies 
  FROM movies 
  WHERE is_best_picture_nominee = true;
  
  -- Count movies with cleared recommendations (should be 0)
  SELECT COUNT(*) INTO cleared_recommendations 
  FROM movies 
  WHERE is_best_picture_nominee = true 
    AND ai_recommendation_text IS NULL;
  
  -- Count movies with cleared briefs (should be 0)
  SELECT COUNT(*) INTO cleared_briefs 
  FROM movies 
  WHERE is_best_picture_nominee = true 
    AND ai_brief_text IS NULL;
  
  -- Display results
  RAISE NOTICE '🧹 CZYSZCZENIE OPISÓW AI ZAKOŃCZONE:';
  RAISE NOTICE '   Wszystkie filmy oscarowe: %', total_movies;
  RAISE NOTICE '   Filmy z wyczyszczonymi rekomendacjami: %', cleared_recommendations;
  RAISE NOTICE '   Filmy z wyczyszczonymi briefami: %', cleared_briefs;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Wszystkie opisy AI zostały wyczyszczone!';
  RAISE NOTICE '🔄 Przy następnym użyciu funkcji AI system wygeneruje nowe, ulepszone opisy.';
  RAISE NOTICE '💡 Upewnij się, że klucz OPENAI_API_KEY jest poprawnie skonfigurowany w Supabase Secrets.';
END $$;