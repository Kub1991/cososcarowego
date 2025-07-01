/**
 * Script to remove duplicate movies from the database
 * Keeps the record with the most complete data (has overview, poster, etc.)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function normalizeTitle(title) {
  return title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreMovieCompleteness(movie) {
  let score = 0;
  
  // Higher score for more complete data
  if (movie.overview) score += 10;
  if (movie.poster_path) score += 10; 
  if (movie.backdrop_path) score += 5;
  if (movie.runtime) score += 5;
  if (movie.genres && movie.genres.length > 0) score += 5;
  if (movie.vote_average) score += 5;
  if (movie.vote_count && movie.vote_count > 0) score += 3;
  if (movie.release_date) score += 3;
  if (movie.original_title) score += 2;
  if (movie.popularity) score += 2;
  
  // Prefer positive TMDB IDs over negative placeholders
  if (movie.tmdb_id > 0) score += 20;
  
  return score;
}

async function removeDuplicates() {
  console.log('🧹 Starting duplicate removal process...\n');
  
  try {
    // Get all Oscar movies
    const { data: movies, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_best_picture_nominee', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching movies:', error);
      return;
    }

    console.log(`📊 Found ${movies.length} Oscar movies in database\n`);

    // Group movies by normalized title and oscar year
    const movieGroups = {};
    
    movies.forEach(movie => {
      const normalizedTitle = normalizeTitle(movie.title);
      const key = `${normalizedTitle}_${movie.oscar_year}`;
      
      if (!movieGroups[key]) {
        movieGroups[key] = [];
      }
      movieGroups[key].push(movie);
    });

    // Find duplicates
    const duplicateGroups = Object.entries(movieGroups)
      .filter(([key, group]) => group.length > 1);

    console.log(`🔍 Found ${duplicateGroups.length} groups with duplicates:`);
    
    let totalDuplicatesRemoved = 0;

    for (const [key, duplicates] of duplicateGroups) {
      console.log(`\n📽️  "${duplicates[0].title}" (${duplicates[0].oscar_year}) - ${duplicates.length} copies`);
      
      // Score each duplicate by data completeness
      const scoredDuplicates = duplicates.map(movie => ({
        ...movie,
        completenessScore: scoreMovieCompleteness(movie)
      })).sort((a, b) => b.completenessScore - a.completenessScore);

      // Keep the best one (highest score)
      const keepMovie = scoredDuplicates[0];
      const removeMovies = scoredDuplicates.slice(1);

      console.log(`   ✅ Keeping: ID ${keepMovie.id} (score: ${keepMovie.completenessScore})`);
      console.log(`      - TMDB ID: ${keepMovie.tmdb_id}`);
      console.log(`      - Has overview: ${!!keepMovie.overview}`);
      console.log(`      - Has poster: ${!!keepMovie.poster_path}`);
      
      // Remove duplicates
      for (const removeMovie of removeMovies) {
        console.log(`   ❌ Removing: ID ${removeMovie.id} (score: ${removeMovie.completenessScore})`);
        
        const { error: deleteError } = await supabase
          .from('movies')
          .delete()
          .eq('id', removeMovie.id);

        if (deleteError) {
          console.error(`      Error removing movie ${removeMovie.id}:`, deleteError);
        } else {
          totalDuplicatesRemoved++;
        }
      }
    }

    console.log(`\n🎉 Duplicate removal complete!`);
    console.log(`📊 Total duplicates removed: ${totalDuplicatesRemoved}`);

    // Check final status
    const { data: finalMovies, error: finalError } = await supabase
      .from('movies')
      .select('id, title, oscar_year')
      .eq('is_best_picture_nominee', true);

    if (!finalError) {
      console.log(`✅ Final count: ${finalMovies.length} movies in database`);
      
      // Check if we still have duplicates
      const finalGroups = {};
      finalMovies.forEach(movie => {
        const normalizedTitle = normalizeTitle(movie.title);
        const key = `${normalizedTitle}_${movie.oscar_year}`;
        finalGroups[key] = (finalGroups[key] || 0) + 1;
      });

      const remainingDuplicates = Object.entries(finalGroups)
        .filter(([key, count]) => count > 1);

      if (remainingDuplicates.length > 0) {
        console.log(`⚠️  Still have ${remainingDuplicates.length} duplicate groups:`);
        remainingDuplicates.forEach(([key, count]) => {
          console.log(`   - ${key}: ${count} copies`);
        });
      } else {
        console.log(`✅ No remaining duplicates found!`);
      }
      
      if (finalMovies.length === 55) {
        console.log(`🎯 Perfect! We now have exactly 55 Oscar movies as expected.`);
      } else {
        console.log(`⚠️  Expected 55 movies, but have ${finalMovies.length}`);
      }
    }

  } catch (error) {
    console.error('❌ Error in duplicate removal process:', error);
  }
}

// Run the script
removeDuplicates().catch(console.error);