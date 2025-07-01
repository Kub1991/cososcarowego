/**
 * Script to enrich existing movies in the database with TMDB data
 * This script works with movies already inserted by migration
 * It adds detailed information: poster, overview, genres, runtime, etc.
 * ENHANCED: Now specifically targets movies with missing runtime data
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !TMDB_API_KEY) {
  console.error('Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TMDB_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Function to normalize title for better matching
function normalizeTitle(title) {
  return title.toLowerCase()
    // Remove articles (the, a, an) from beginning
    .replace(/^(the|a|an)\s+/, '')
    // Remove special characters and punctuation
    .replace(/[^\w\s]/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
}

// Function to calculate title similarity score
function calculateTitleSimilarity(title1, title2) {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);
  
  // Exact match gets highest score
  if (norm1 === norm2) return 100;
  
  // Check if one title contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 90;
  
  // Calculate Levenshtein distance for similarity
  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.max(0, similarity);
}

// Simple Levenshtein distance calculation
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Function to fetch movie details from TMDB
async function fetchMovieFromTMDB(tmdbId) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`
    );
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const movie = await response.json();
    return movie;
  } catch (error) {
    console.error(`Error fetching movie ${tmdbId} from TMDB:`, error);
    return null;
  }
}

// Enhanced function to search for movie by title and year with intelligent matching
async function searchMovieByTitle(title, year) {
  try {
    // FIXED: Always include year in the primary search for better accuracy
    console.log(`🔍 Searching TMDB for "${title}" (${year}) with year parameter...`);
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}&language=en-US`
    );
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log(`❌ No results found for "${title}" (${year}) with year parameter`);
      
      // Fallback: try without year parameter if no results with year
      console.log(`🔄 Trying fallback search without year parameter...`);
      const fallbackResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US`
      );
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.results && fallbackData.results.length > 0) {
          console.log(`📋 Found ${fallbackData.results.length} fallback results without year parameter`);
          // Continue with fallback results
          data.results = fallbackData.results;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }

    console.log(`🔍 Found ${data.results.length} potential matches for "${title}" (${year})`);
    
    // Score each result based on multiple criteria
    const scoredResults = data.results.map(movie => {
      const releaseYear = movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : null;
      
      // Calculate scores
      const titleSimilarity = calculateTitleSimilarity(title, movie.title);
      const originalTitleSimilarity = movie.original_title ? 
        calculateTitleSimilarity(title, movie.original_title) : 0;
      
      // Use the higher of the two title similarities
      const bestTitleScore = Math.max(titleSimilarity, originalTitleSimilarity);
      
      // Year difference score (closer years get higher scores)
      let yearScore = 0;
      if (releaseYear) {
        const yearDiff = Math.abs(year - releaseYear);
        if (yearDiff === 0) yearScore = 100;
        else if (yearDiff === 1) yearScore = 90;
        else if (yearDiff === 2) yearScore = 70;
        else if (yearDiff <= 5) yearScore = 50;
        else yearScore = 0;
      }
      
      // Popularity score (normalized to 0-100)
      const popularityScore = Math.min(100, (movie.popularity || 0) * 2);
      
      // Vote count score (normalized to 0-100)
      const voteScore = Math.min(100, (movie.vote_count || 0) / 50);
      
      // Combined score with weighted factors
      const totalScore = 
        (bestTitleScore * 0.5) +     // Title similarity is most important (50%)
        (yearScore * 0.3) +          // Year match is very important (30%)
        (popularityScore * 0.1) +    // Popularity helps (10%)
        (voteScore * 0.1);           // Vote count helps (10%)
      
      return {
        ...movie,
        scores: {
          title: bestTitleScore,
          year: yearScore,
          popularity: popularityScore,
          votes: voteScore,
          total: totalScore
        },
        releaseYear
      };
    });

    // Sort by total score (highest first)
    scoredResults.sort((a, b) => b.scores.total - a.scores.total);
    
    const bestMatch = scoredResults[0];
    
    // Log the matching process for debugging
    console.log(`📊 Top 3 matches for "${title}" (${year}):`);
    scoredResults.slice(0, 3).forEach((movie, index) => {
      console.log(`   ${index + 1}. "${movie.title}" (${movie.releaseYear})`);
      console.log(`      Score: ${movie.scores.total.toFixed(1)} (title: ${movie.scores.title.toFixed(1)}, year: ${movie.scores.year.toFixed(1)})`);
    });
    
    // Only accept matches with reasonable title similarity and year proximity
    if (bestMatch.scores.title >= 70 && bestMatch.scores.year >= 50) {
      console.log(`✅ Selected: "${bestMatch.title}" (${bestMatch.releaseYear}) with score ${bestMatch.scores.total.toFixed(1)}`);
      return bestMatch;
    } else if (bestMatch.scores.title >= 90) {
      // Accept very high title similarity even with year mismatch
      console.log(`⚠️  Accepting "${bestMatch.title}" due to excellent title match (${bestMatch.scores.title.toFixed(1)}) despite year mismatch`);
      return bestMatch;
    } else {
      console.log(`❌ Best match "${bestMatch.title}" has insufficient score (${bestMatch.scores.total.toFixed(1)})`);
      return null;
    }
    
  } catch (error) {
    console.error(`Error searching for movie "${title}" (${year}):`, error);
    return null;
  }
}

// Function to update movie with TMDB data
async function enrichMovieWithTMDBData(dbMovie, tmdbData) {
  try {
    const updateData = {
      tmdb_id: tmdbData.id, // Update with real TMDB ID
      original_title: tmdbData.original_title,
      release_date: tmdbData.release_date,
      runtime: tmdbData.runtime,
      genre_ids: tmdbData.genres?.map(g => g.id) || [],
      genres: tmdbData.genres?.map(g => g.name) || [],
      overview: tmdbData.overview,
      poster_path: tmdbData.poster_path,
      backdrop_path: tmdbData.backdrop_path,
      vote_average: tmdbData.vote_average,
      vote_count: tmdbData.vote_count,
      popularity: tmdbData.popularity,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('movies')
      .update(updateData)
      .eq('id', dbMovie.id)
      .select();

    if (error) {
      console.error('Error updating movie:', error);
      return false;
    }

    console.log(`✅ Enriched: ${dbMovie.title} (${dbMovie.oscar_year}) → TMDB ID: ${tmdbData.id}`);
    if (tmdbData.runtime) {
      console.log(`   🕒 Runtime: ${Math.floor(tmdbData.runtime / 60)}h ${tmdbData.runtime % 60}min`);
    }
    return true;
  } catch (error) {
    console.error('Error enriching movie:', error);
    return false;
  }
}

// Function to check missing runtime status
async function checkMissingRuntimes() {
  try {
    console.log('🔍 Checking runtime status for Oscar movies...\n');
    
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title, oscar_year, runtime, tmdb_id, overview, poster_path')
      .eq('is_best_picture_nominee', true)
      .order('oscar_year', { ascending: true });

    if (error) {
      console.error('❌ Error fetching movies:', error);
      return;
    }

    const moviesWithRuntime = movies.filter(m => m.runtime !== null);
    const moviesWithoutRuntime = movies.filter(m => m.runtime === null);
    
    console.log(`📊 RUNTIME STATUS REPORT:`);
    console.log(`========================`);
    console.log(`Total Oscar movies: ${movies.length}`);
    console.log(`✅ Movies with runtime: ${moviesWithRuntime.length}`);
    console.log(`❌ Movies missing runtime: ${moviesWithoutRuntime.length}\n`);
    
    if (moviesWithoutRuntime.length > 0) {
      console.log(`🚨 MOVIES MISSING RUNTIME DATA:`);
      console.log(`==============================`);
      moviesWithoutRuntime.forEach((movie, index) => {
        const hasOtherData = movie.overview && movie.poster_path;
        const status = hasOtherData ? '📽️ (has other TMDB data)' : '📋 (needs full enrichment)';
        console.log(`${index + 1}. "${movie.title}" (${movie.oscar_year}) ${status}`);
        console.log(`   TMDB ID: ${movie.tmdb_id}`);
      });
      console.log('');
    }

    return moviesWithoutRuntime;
  } catch (error) {
    console.error('❌ Error checking missing runtimes:', error);
    return [];
  }
}

// Main function to enrich movies
async function enrichMovies() {
  console.log('🎬 Starting to enrich Oscar movies with TMDB data...\n');
  console.log('🎯 ENHANCED: Now specifically targets movies missing runtime data!\n');
  
  // First, check and report on missing runtimes
  const moviesWithoutRuntime = await checkMissingRuntimes();
  
  try {
    // Get all movies that need enrichment - UPDATED QUERY
    // Now includes movies without runtime in addition to other criteria
    const { data: movies, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_best_picture_nominee', true)
      .or('overview.is.null,tmdb_id.lt.0,runtime.is.null') // ADDED: runtime.is.null
      .order('oscar_year', { ascending: true });

    if (error) {
      console.error('❌ Error fetching movies:', error);
      return;
    }

    console.log(`📊 Found ${movies.length} movies that need enrichment\n`);

    // Categorize movies by what they're missing
    const needsRuntime = movies.filter(m => m.runtime === null);
    const needsOverview = movies.filter(m => m.overview === null);
    const needsTmdbId = movies.filter(m => m.tmdb_id < 0);
    
    console.log(`📋 ENRICHMENT BREAKDOWN:`);
    console.log(`   Missing runtime: ${needsRuntime.length} movies`);
    console.log(`   Missing overview: ${needsOverview.length} movies`);
    console.log(`   Need TMDB ID fix: ${needsTmdbId.length} movies\n`);

    let totalProcessed = 0;
    let totalEnriched = 0;
    let totalErrors = 0;
    let runtimesFixed = 0;

    for (const movie of movies) {
      totalProcessed++;
      console.log(`\n🎯 Processing: ${movie.title} (${movie.oscar_year})`);
      
      // Track if this movie was missing runtime
      const wasMissingRuntime = movie.runtime === null;

      let tmdbData = null;

      // If TMDB ID is negative (temporary placeholder), search by title
      if (movie.tmdb_id < 0) {
        console.log(`🔍 Searching by title and year: "${movie.title}" (${movie.year})`);
        tmdbData = await searchMovieByTitle(movie.title, movie.year);
      } else {
        // Try to fetch by existing TMDB ID first
        console.log(`🔍 Fetching by TMDB ID: ${movie.tmdb_id}`);
        tmdbData = await fetchMovieFromTMDB(movie.tmdb_id);
        
        // If that fails, search by title as backup
        if (!tmdbData) {
          console.log(`🔄 TMDB ID failed, searching by title: "${movie.title}" (${movie.year})`);
          tmdbData = await searchMovieByTitle(movie.title, movie.year);
        }
      }

      if (tmdbData) {
        const success = await enrichMovieWithTMDBData(movie, tmdbData);
        if (success) {
          totalEnriched++;
          // Check if we fixed a missing runtime
          if (wasMissingRuntime && tmdbData.runtime) {
            runtimesFixed++;
            console.log(`   🎯 RUNTIME FIXED! ${Math.floor(tmdbData.runtime / 60)}h ${tmdbData.runtime % 60}min`);
          }
        } else {
          totalErrors++;
        }
      } else {
        console.log(`❌ Could not find TMDB data for: ${movie.title}`);
        totalErrors++;
      }

      // Add delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    console.log(`\n🎉 Movie enrichment complete!`);
    console.log(`📊 Total processed: ${totalProcessed}`);
    console.log(`✅ Successfully enriched: ${totalEnriched}`);
    console.log(`🕒 Runtimes fixed: ${runtimesFixed}`);
    console.log(`❌ Errors/Not found: ${totalErrors}`);

    // Check final status
    await showFinalStatus();

  } catch (error) {
    console.error('❌ Error in enrichment process:', error);
  }
}

async function showFinalStatus() {
  const { data: finalMovies, error: finalError } = await supabase
    .from('movies')
    .select('title, overview, poster_path, tmdb_id, original_title, runtime, oscar_year')
    .eq('is_best_picture_nominee', true)
    .order('oscar_year', { ascending: true });

  if (!finalError) {
    const enrichedCount = finalMovies.filter(m => m.overview && m.poster_path).length;
    const needsEnrichment = finalMovies.filter(m => !m.overview || !m.poster_path).length;
    const withRuntime = finalMovies.filter(m => m.runtime !== null).length;
    const missingRuntime = finalMovies.filter(m => m.runtime === null).length;
    
    console.log(`\n📈 FINAL STATUS:`);
    console.log(`===============`);
    console.log(`✅ Fully enriched movies: ${enrichedCount}`);
    console.log(`⚠️  Still need enrichment: ${needsEnrichment}`);
    console.log(`🕒 Movies with runtime: ${withRuntime}`);
    console.log(`❌ Missing runtime: ${missingRuntime}`);
    
    if (missingRuntime > 0) {
      console.log(`\n🚨 MOVIES STILL MISSING RUNTIME:`);
      finalMovies
        .filter(m => m.runtime === null)
        .forEach(m => console.log(`   - ${m.title} (${m.oscar_year})`));
      
      console.log(`\n💡 TIP: If movies still missing runtime after enrichment:`);
      console.log(`   1. Check if TMDB has runtime data for these specific movies`);
      console.log(`   2. Some very old movies may not have runtime data in TMDB`);
      console.log(`   3. Consider manual data entry for critical missing data`);
    }

    if (needsEnrichment > 0) {
      console.log(`\n💡 Movies still needing enrichment:`);
      finalMovies
        .filter(m => !m.overview || !m.poster_path)
        .forEach(m => console.log(`   - ${m.title} (TMDB ID: ${m.tmdb_id})`));
    }

    // Check for potential poster issues
    console.log(`\n🖼️  POSTER STATUS CHECK:`);
    const postersNeedCheck = finalMovies.filter(m => 
      m.title && m.original_title && 
      normalizeTitle(m.title) !== normalizeTitle(m.original_title)
    );
    
    if (postersNeedCheck.length > 0) {
      console.log(`📋 Movies with different title vs original_title (check posters):`);
      postersNeedCheck.forEach(m => {
        console.log(`   - "${m.title}" vs "${m.original_title}" (TMDB ID: ${m.tmdb_id})`);
      });
    } else {
      console.log(`✅ No title/original_title mismatches detected`);
    }
  }
}

// Run the script
enrichMovies().catch(console.error);