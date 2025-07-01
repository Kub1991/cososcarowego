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

  2. Security
    - Enable RLS on movies table
    - Add policies for public read access (movies are public data)
    - Add policies for authenticated users to manage movies
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);
CREATE INDEX IF NOT EXISTS idx_movies_oscar_year ON movies(oscar_year);
CREATE INDEX IF NOT EXISTS idx_movies_best_picture_nominee ON movies(is_best_picture_nominee);
CREATE INDEX IF NOT EXISTS idx_movies_best_picture_winner ON movies(is_best_picture_winner);

-- Enable Row Level Security
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Movies are publicly readable" ON movies;
DROP POLICY IF EXISTS "Authenticated users can insert movies" ON movies;
DROP POLICY IF EXISTS "Authenticated users can update movies" ON movies;

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