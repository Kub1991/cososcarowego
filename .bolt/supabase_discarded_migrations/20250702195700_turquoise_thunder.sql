/*
  # Automatyczne generowanie osiągnięć na podstawie postępu Oscarów

  1. Nowa funkcja
    - `update_achievements_from_oscar_progress` - Sprawdza ukończony postęp i tworzy osiągnięcia

  2. Nowy wyzwalacz
    - `on_oscar_progress_update_achievements` - Uruchamia funkcję po aktualizacji `user_oscar_progress`

  3. Cel
    - Automatyczne dodawanie osiągnięć, gdy użytkownik ukończy 100% filmów w danej kategorii Oscarów (rok lub dekada)
*/

-- Funkcja do aktualizacji osiągnięć na podstawie postępu Oscarów
CREATE OR REPLACE FUNCTION update_achievements_from_oscar_progress()
RETURNS TRIGGER AS $$
DECLARE
  achievement_name_text text;
  achievement_description_text text;
  category_display_name text;
  icon_text text;
BEGIN
  -- Sprawdź, czy postęp osiągnął 100%
  IF NEW.progress_percentage = 100 THEN
    -- Określ nazwę wyświetlaną dla kategorii
    IF NEW.category_type = 'decade' THEN
      CASE NEW.category_identifier
        WHEN '2000s' THEN category_display_name := 'Lata 2000-2009';
        WHEN '2010s' THEN category_display_name := 'Lata 2010-2019';
        WHEN '1990s' THEN category_display_name := 'Lata 1990-1999';
        WHEN '1980s' THEN category_display_name := 'Lata 1980-1989';
        WHEN '1970s' THEN category_display_name := 'Lata 1970-1979';
        WHEN '1960s' THEN category_display_name := 'Lata 1960-1969';
        WHEN '1950s' THEN category_display_name := 'Lata 1950-1959';
        WHEN '1940s' THEN category_display_name := 'Lata 1940-1949';
        WHEN '1930s' THEN category_display_name := 'Lata 1930-1939';
        WHEN '1920s' THEN category_display_name := 'Lata 1920-1929';
        ELSE category_display_name := NEW.category_identifier;
      END CASE;
      
      achievement_name_text := 'Ukończono dekadę ' || category_display_name;
      achievement_description_text := 'Obejrzałeś wszystkie filmy oscarowe z ' || category_display_name;
      icon_text := 'decade_' || NEW.category_identifier;
    ELSE -- oscar_year
      category_display_name := 'Oscary ' || NEW.category_identifier;
      achievement_name_text := 'Ukończono ' || category_display_name;
      achievement_description_text := 'Obejrzałeś wszystkie filmy nominowane do Oscara w ' || category_display_name;
      icon_text := 'year_' || NEW.category_identifier;
    END IF;
    
    -- Dodaj lub zaktualizuj osiągnięcie
    INSERT INTO user_achievements (
      user_id,
      achievement_type,
      achievement_name,
      description,
      icon,
      earned_at,
      progress,
      max_progress,
      is_completed
    ) VALUES (
      NEW.user_id,
      'oscar_progress',
      achievement_name_text,
      achievement_description_text,
      icon_text,
      now(),
      1,
      1,
      true
    )
    ON CONFLICT (user_id, achievement_type, achievement_name) 
    DO UPDATE SET
      earned_at = now(),
      progress = 1,
      max_progress = 1,
      is_completed = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Wyzwalacz do automatycznego aktualizowania osiągnięć po aktualizacji postępu
DROP TRIGGER IF EXISTS on_oscar_progress_update_achievements ON user_oscar_progress;
CREATE TRIGGER on_oscar_progress_update_achievements
  AFTER INSERT OR UPDATE OF progress_percentage ON user_oscar_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_achievements_from_oscar_progress();

-- Pokaż wyniki migracji
DO $$
DECLARE
  trigger_exists BOOLEAN;
  function_exists BOOLEAN;
  achievement_count INTEGER;
BEGIN
  -- Sprawdź, czy wyzwalacz istnieje
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_oscar_progress_update_achievements'
  ) INTO trigger_exists;
  
  -- Sprawdź, czy funkcja istnieje
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_achievements_from_oscar_progress'
  ) INTO function_exists;
  
  -- Policz istniejące osiągnięcia typu oscar_progress
  SELECT COUNT(*) INTO achievement_count
  FROM user_achievements
  WHERE achievement_type = 'oscar_progress';
  
  -- Wyświetl wyniki
  RAISE NOTICE '🏆 SYSTEM OSIĄGNIĘĆ OSCAROWYCH - MIGRACJA ZAKOŃCZONA:';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Funkcja update_achievements_from_oscar_progress: %', 
    CASE WHEN function_exists THEN 'UTWORZONA' ELSE 'BŁĄD' END;
  RAISE NOTICE 'Wyzwalacz on_oscar_progress_update_achievements: %', 
    CASE WHEN trigger_exists THEN 'UTWORZONY' ELSE 'BŁĄD' END;
  RAISE NOTICE 'Istniejące osiągnięcia oscar_progress: %', achievement_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ FUNKCJONALNOŚĆ:';
  RAISE NOTICE '   - Automatyczne tworzenie osiągnięć przy 100% ukończeniu kategorii';
  RAISE NOTICE '   - Obsługa osiągnięć dla dekad (np. "Ukończono dekadę Lata 2010-2019")';
  RAISE NOTICE '   - Obsługa osiągnięć dla lat (np. "Ukończono Oscary 2019")';
  RAISE NOTICE '   - Aktualizacja istniejących osiągnięć przy ponownym ukończeniu';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 PROCES:';
  RAISE NOTICE '   1. Użytkownik ogląda filmy → aktualizacja postępu';
  RAISE NOTICE '   2. Gdy postęp osiąga 100% → wyzwalacz uruchamia funkcję';
  RAISE NOTICE '   3. Funkcja tworzy osiągnięcie → pojawia się w panelu użytkownika';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 NASTĘPNE KROKI:';
  RAISE NOTICE '   1. Obejrzyj wszystkie filmy z wybranej kategorii';
  RAISE NOTICE '   2. Sprawdź, czy osiągnięcie pojawia się automatycznie';
  RAISE NOTICE '   3. Osiągnięcia będą widoczne w sekcji "Osiągnięcia" w "Moja podróż"';
END $$;

-- Aktualizuj istniejące 100% ukończone postępy, aby utworzyć osiągnięcia
DO $$
DECLARE
  progress_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Znajdź wszystkie 100% ukończone postępy
  FOR progress_record IN 
    SELECT * FROM user_oscar_progress 
    WHERE progress_percentage = 100
  LOOP
    -- Wywołaj funkcję ręcznie dla każdego rekordu
    PERFORM update_achievements_from_oscar_progress()
    FROM user_oscar_progress
    WHERE id = progress_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RAISE NOTICE '🔄 Zaktualizowano % istniejących 100%% postępów', updated_count;
  RAISE NOTICE '💡 Osiągnięcia powinny teraz pojawić się w panelu użytkownika';
END $$;