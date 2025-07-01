# Oscar Cinema - Inteligentne rekomendacje Oscarowych klasyków

Aplikacja do odkrywania filmów nominowanych i nagrodzonych Oscarami z inteligentnym systemem rekomendacji opartym na AI.

## 🎬 Funkcjonalności

- **Szybki strzał** - Losowy wybór filmu oscarowego z AI rekomendacją
- **Dopasowany wybór** - Kwestionariusz AI dla spersonalizowanych sugestii
- **Przeszukiwanie według dekad** - Eksploracja filmów według okresów
- **Filtrowanie według nastroju** - Znajdź film dopasowany do Twojego stanu ducha
- **AI briefy** - 5-minutowe streszczenia filmów generowane przez AI

## 🛠 Technologie

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **API**: TMDB (The Movie Database)
- **AI**: OpenAI GPT dla rekomendacji i briefów

## 📊 Baza danych

Aplikacja zawiera filmy nominowane w kategorii "Najlepszy Film" z lat 2000-2009 (55 filmów).

### Struktura tabel:

- `movies` - Informacje o filmach z TMDB + status oscarowy

## 🚀 Uruchomienie

1. **Klonowanie i instalacja**:
```bash
git clone [repository-url]
cd oscar-cinema
npm install
```

2. **Konfiguracja zmiennych środowiskowych**:

### Zmienne lokalne (.env)
Utwórz plik `.env` w głównym katalogu projektu z następującymi zmiennymi:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TMDB_API_KEY=your_tmdb_api_key
OPENAI_API_KEY=your_openai_api_key
```

### Supabase Secrets (dla Edge Functions)
W panelu Supabase dodaj następujące sekrety:

1. Przejdź do panelu Supabase → Twój projekt
2. W menu po lewej wybierz **Edge Functions** → **Secrets**
3. Dodaj następujący sekret:

```
OPENAI_API_KEY=your_openai_api_key
```

> **💡 Dlaczego OPENAI_API_KEY w dwóch miejscach?**  
> Klucz API OpenAI jest potrzebny w dwóch miejscach:
> - **W pliku `.env`** - dla lokalnych skryptów Node.js (enrich-movies, populate-ai-tags)
> - **Jako sekret Supabase** - dla Edge Functions działających po stronie serwera
> 
> Edge Functions nie mają dostępu do lokalnego pliku `.env`, dlatego wymagają oddzielnej konfiguracji jako sekrety Supabase.

3. **Uruchomienie migracji bazy danych**:
```bash
# Migracje zostaną automatycznie zastosowane w Supabase
# Podstawowa lista 55 filmów oscarowych zostanie dodana automatycznie
```

4. **Wzbogacenie danych filmów**:
```bash
# Sprawdź, które filmy są w bazie
npm run check-movies

# Wzbogać filmy o szczegóły z TMDB (plakaty, opisy, oceny)
npm run enrich-movies

# Wygeneruj tagi AI dla filmów
npm run populate-ai-tags
```

5. **Uruchomienie aplikacji**:
```bash
npm run dev
```

## 📁 Struktura projektu

```
src/
├── components/          # Komponenty React
├── lib/                # Konfiguracja Supabase i typy
└── ...

supabase/
├── migrations/         # Migracje bazy danych
└── functions/          # Edge Functions

scripts/
├── enrich-movie-data.js     # Wzbogacenie filmów o dane TMDB
├── check-missing-movies.js  # Sprawdzenie brakujących filmów
├── populate-ai-tags.js      # Generowanie tagów AI dla filmów
└── populate-oscar-movies.js # Legacy skrypt (teraz używa upsert)
```

## 🔧 Edge Functions

- `movie-recommendations` - Generuje rekomendacje i briefy za pomocą AI

## 📋 Skrypty NPM

- `npm run dev` - Uruchom aplikację w trybie deweloperskim
- `npm run check-movies` - Sprawdź, które filmy są w bazie danych
- `npm run enrich-movies` - Wzbogać filmy o szczegóły z TMDB API
- `npm run populate-ai-tags` - Wygeneruj tagi AI dla filmów (nastrój, tematyka)
- `npm run populate-movies` - Legacy skrypt (używa teraz upsert)

## 🎯 Przepływ danych

1. **Migracja bazy** - Podstawowa lista 55 filmów oscarowych jest wstawiana automatycznie
2. **Wzbogacenie TMDB** - Skrypt `enrich-movies` dodaje plakaty, opisy, gatunki, oceny
3. **Tagi AI** - Skrypt `populate-ai-tags` generuje tagi nastroju i tematyczne
4. **AI Content** - Edge Functions generują rekomendacje i briefy na żądanie

## 🔐 Bezpieczeństwo API

### Środowisko lokalne vs. Produkcja

**Plik `.env` (lokalne środowisko)**:
- `VITE_SUPABASE_URL` - URL twojego projektu Supabase
- `VITE_SUPABASE_ANON_KEY` - Publiczny klucz Supabase (bezpieczny do ujawnienia)
- `SUPABASE_SERVICE_ROLE_KEY` - Klucz serwisowy (używany tylko przez skrypty)
- `TMDB_API_KEY` - Klucz do The Movie Database (używany przez skrypty)
- `OPENAI_API_KEY` - Klucz do OpenAI API (używany przez lokalne skrypty)

**Supabase Secrets (środowisko Edge Functions)**:
- `OPENAI_API_KEY` - Klucz do OpenAI API (używany przez Edge Functions)

### Dlaczego to ważne?

1. **Edge Functions** działają po stronie serwera i wymagają oddzielnej konfiguracji sekretów
2. **Frontend** nie ma dostępu do wrażliwych kluczy API
3. **Lokalne skrypty** używają zmiennych środowiskowych z pliku `.env`
4. **OPENAI_API_KEY** musi być skonfigurowany w obu miejscach dla pełnej funkcjonalności

## 🚨 Troubleshooting

### Brakujące plakaty filmów
Uruchom `npm run enrich-movies` aby pobrać szczegóły filmów z TMDB API.

### Brakujące tagi AI
Uruchom `npm run populate-ai-tags` aby wygenerować tagi nastroju i tematyczne.

### Problemy z Edge Functions
Sprawdź, czy wszystkie sekrety są poprawnie skonfigurowane w panelu Supabase.

### Błąd "Missing required environment variables"
Upewnij się, że wszystkie wymagane zmienne są skonfigurowane w pliku `.env`:
- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`  
- `OPENAI_API_KEY`

## 📝 Następne kroki

1. Rozszerzenie bazy o więcej dekad (1930-2024)
2. Implementacja systemu użytkowników i list filmowych
3. Rozbudowa algorytmu rekomendacji
4. Dodanie systemu ocen i recenzji

## 🤝 Wkład w projekt

Projekt jest w fazie rozwoju. Sugestie i pull requesty są mile widziane!

## 📄 Licencja

MIT License