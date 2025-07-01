/*
  # Wyczyść problematyczne opisy AI

  1. Problem
    - Niektóre filmy mają opisy AI wygenerowane przed wzbogaceniem danych TMDB
    - Opisy zawierają "null minut rozrywki" lub inne niepoprawne informacje
    - Powoduje to złe doświadczenie użytkownika

  2. Rozwiązanie
    - Znajdź wszystkie filmy z problematycznymi opisami AI
    - Wyczyść kolumny ai_recommendation_text i ai_brief_text
    - Pozwól systemowi na ponowne wygenerowanie poprawnych opisów

  3. Warunki czyszczenia
    - Opisy zawierające "null minut"
    - Opisy zawierające "oferuje null"
    - Opisy zawierające "Nieznany" w kontekście runtime
    - Opisy generyczne, które mogą być niepoprawne
    - Wszystkie opisy dla filmów, które nie mają runtime (niepełne dane)

  4. Rezultat
    - Przy następnym użyciu "Szybki strzał" system wygeneruje nowe, poprawne opisy
    - Opisy będą używać aktualnych, wzbogaconych danych z TMDB
*/

-- Wyczyść problematyczne opisy AI zawierające "null" lub inne oznaki błędnych danych
UPDATE movies 
SET 
  ai_recommendation_text = NULL,
  ai_brief_text = NULL,
  updated_at = now()
WHERE 
  is_best_picture_nominee = true 
  AND (
    -- Opisy zawierające "null" w kontekście czasu
    ai_recommendation_text ILIKE '%null minut%' OR
    ai_recommendation_text ILIKE '%oferuje null%' OR
    ai_recommendation_text ILIKE '%oferuje  minut%' OR
    
    -- Opisy zawierające inne oznaki niepoprawnych danych
    ai_recommendation_text ILIKE '%nieznany czas%' OR
    ai_recommendation_text ILIKE '%brak czasu%' OR
    ai_recommendation_text ILIKE '%undefined%' OR
    ai_recommendation_text ILIKE '%NaN%' OR
    
    -- Opisy generyczne, które mogą być niepoprawne
    ai_recommendation_text ILIKE '%doskonały wybór na dziś. Ten%Oscara z%roku oferuje%minut%' OR
    
    -- Filmy bez runtime - prawdopodobnie niepełne dane podczas generowania opisu
    runtime IS NULL OR
    
    -- Filmy z bardzo krótkim lub podejrzanym opisem AI
    LENGTH(ai_recommendation_text) < 20 OR
    
    -- Briefy z podobnymi problemami
    ai_brief_text ILIKE '%null%' OR
    ai_brief_text ILIKE '%undefined%' OR
    ai_brief_text ILIKE '%NaN%'
  );

-- Dodatkowe czyszczenie dla filmów z pustymi lub niepełnymi danymi TMDB
UPDATE movies 
SET 
  ai_recommendation_text = NULL,
  ai_brief_text = NULL,
  updated_at = now()
WHERE 
  is_best_picture_nominee = true 
  AND ai_recommendation_text IS NOT NULL
  AND (
    -- Filmy bez podstawowych danych TMDB
    overview IS NULL OR
    poster_path IS NULL OR
    vote_average IS NULL OR
    
    -- Filmy z podejrzanie niskimi ocenami (może błędne dane)
    vote_average < 3.0 OR
    
    -- Filmy bez gatunków
    genres IS NULL OR
    array_length(genres, 1) = 0
  );

-- Pokaż statystyki po oczyszczeniu
DO $$
DECLARE
  total_movies INTEGER;
  movies_with_ai INTEGER;
  movies_without_ai INTEGER;
BEGIN
  -- Policz wszystkie filmy oscarowe
  SELECT COUNT(*) INTO total_movies 
  FROM movies 
  WHERE is_best_picture_nominee = true;
  
  -- Policz filmy z opisami AI
  SELECT COUNT(*) INTO movies_with_ai 
  FROM movies 
  WHERE is_best_picture_nominee = true 
    AND ai_recommendation_text IS NOT NULL;
  
  -- Policz filmy bez opisów AI
  SELECT COUNT(*) INTO movies_without_ai 
  FROM movies 
  WHERE is_best_picture_nominee = true 
    AND ai_recommendation_text IS NULL;
  
  -- Wyświetl rezultaty
  RAISE NOTICE '📊 STATYSTYKI PO OCZYSZCZENIU OPISÓW AI:';
  RAISE NOTICE '   Wszystkie filmy oscarowe: %', total_movies;
  RAISE NOTICE '   Filmy z opisami AI: %', movies_with_ai;
  RAISE NOTICE '   Filmy bez opisów AI (zostaną wygenerowane): %', movies_without_ai;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Problematyczne opisy AI zostały wyczyszczone!';
  RAISE NOTICE '💡 Przy następnym użyciu "Szybki strzał" system wygeneruje nowe, poprawne opisy.';
END $$;