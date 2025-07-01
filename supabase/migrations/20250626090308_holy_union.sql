/*
  # Create Oscar Movies Database Schema

  1. New Tables
    - `movies`
      - `id` (uuid, primary key)
      - `tmdb_id` (integer, unique) - ID z The Movie Database
      - `title` (text) - tytuł filmu
      - `original_title` (text) - oryginalny tytuł
      - `year` (integer) - rok produkcji
      - `release_date` (date) - data premiery
      - `runtime` (integer) - długość w minutach
      - `genre_ids` (integer array) - ID gatunków z TMDB
      - `genres` (text array) - nazwy gatunków
      - `overview` (text) - opis filmu z TMDB
      - `poster_path` (text) - ścieżka do plakatu z TMDB
      - `backdrop_path` (text) - ścieżka do tła z TMDB
      - `vote_average` (decimal) - średnia ocena z TMDB
      - `vote_count` (integer) - liczba głosów z TMDB
      - `popularity` (decimal) - popularność z TMDB
      - `is_best_picture_nominee` (boolean) - czy nominowany w kategorii Najlepszy Film
      - `is_best_picture_winner` (boolean) - czy wygrał w kategorii Najlepszy Film
      - `oscar_year` (integer) - rok ceremonii Oscarów
      - `ai_recommendation_text` (text) - wygenerowany przez LLM opis rekomendacji
      - `ai_brief_text` (text) - wygenerowany przez LLM 5-minutowy brief
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `streaming_availability`
      - `id` (uuid, primary key)
      - `movie_id` (uuid, foreign key) - odniesienie do tabeli movies
      - `country` (text) - kod kraju (np. 'PL', 'US')
      - `service_name` (text) - nazwa serwisu (np. 'Netflix', 'HBO Max')
      - `service_id` (text) - ID serwisu z API
      - `availability_type` (text) - typ dostępności ('subscription', 'rent', 'buy')
      - `price` (decimal) - cena (jeśli płatne)
      - `currency` (text) - waluta
      - `quality` (text) - jakość ('HD', '4K', etc.)
      - `last_updated` (timestamp) - kiedy ostatnio aktualizowane
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access (movies are public data)
    - Add policies for authenticated users to manage streaming data
*/

-- Create movies table
CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id integer UNIQUE NOT NULL,
  title text NOT NULL,
  original_title text,
  year integer NOT NULL,
  release_date date,
  runtime integer,
  genre_ids integer[],
  genres text[],
  overview text,
  poster_path text,
  backdrop_path text,
  vote_average decimal(3,1),
  vote_count integer DEFAULT 0,
  popularity decimal(8,3),
  is_best_picture_nominee boolean DEFAULT false,
  is_best_picture_winner boolean DEFAULT false,
  oscar_year integer,
  ai_recommendation_text text,
  ai_brief_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create streaming availability table
CREATE TABLE IF NOT EXISTS streaming_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid REFERENCES movies(id) ON DELETE CASCADE,
  country text NOT NULL DEFAULT 'PL',
  service_name text NOT NULL,
  service_id text,
  availability_type text NOT NULL CHECK (availability_type IN ('subscription', 'rent', 'buy', 'free')),
  price decimal(10,2),
  currency text DEFAULT 'PLN',
  quality text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(movie_id, country, service_name, availability_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);
CREATE INDEX IF NOT EXISTS idx_movies_oscar_year ON movies(oscar_year);
CREATE INDEX IF NOT EXISTS idx_movies_best_picture_nominee ON movies(is_best_picture_nominee);
CREATE INDEX IF NOT EXISTS idx_movies_best_picture_winner ON movies(is_best_picture_winner);
CREATE INDEX IF NOT EXISTS idx_streaming_movie_id ON streaming_availability(movie_id);
CREATE INDEX IF NOT EXISTS idx_streaming_country ON streaming_availability(country);
CREATE INDEX IF NOT EXISTS idx_streaming_service ON streaming_availability(service_name);

-- Enable Row Level Security
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaming_availability ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Movies are publicly readable" ON movies;
DROP POLICY IF EXISTS "Authenticated users can insert movies" ON movies;
DROP POLICY IF EXISTS "Authenticated users can update movies" ON movies;
DROP POLICY IF EXISTS "Streaming availability is publicly readable" ON streaming_availability;
DROP POLICY IF EXISTS "Authenticated users can manage streaming availability" ON streaming_availability;

-- Create policies for movies (public read access)
CREATE POLICY "Movies are publicly readable"
  ON movies
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert movies"
  ON movies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update movies"
  ON movies
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for streaming availability
CREATE POLICY "Streaming availability is publicly readable"
  ON streaming_availability
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage streaming availability"
  ON streaming_availability
  FOR ALL
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_movies_updated_at ON movies;

-- Create trigger for movies table
CREATE TRIGGER update_movies_updated_at
  BEFORE UPDATE ON movies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();