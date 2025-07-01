/**
 * Script to check which movies are missing from the database
 * Compares the expected 145 Oscar nominees with what's actually in the database
 * UPDATED: Now includes 2010s decade (2011-2020 ceremonies)
 * Also identifies unexpected movies that shouldn't be in the database
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

async function getMovieVoteCounts() {
  console.log('🔍 Fetching vote counts for Oscar movies...');
  try {
    const { data: movies, error } = await supabase
      .from('movies')
      .select('title, vote_count, oscar_year, popularity, vote_average')
      .eq('is_best_picture_nominee', true)
      .order('vote_count', { ascending: false, nullsFirst: false }); // Sort by vote_count descending

    if (error) {
      console.error('❌ Error fetching movies:', error);
      return;
    }

    if (movies.length === 0) {
      console.log('No Oscar movies found in the database.');
      return;
    }

    console.log(`\n📊 Found ${movies.length} Oscar movies. Sorted by vote_count (highest first):\n`);
    console.log('-------------------------------------------------------------------------------------');
    console.log('Title                                | Vote Count | Oscar Year | Rating | Popularity');
    console.log('-------------------------------------------------------------------------------------');
    
    movies.forEach(movie => {
      const title = movie.title.padEnd(35).substring(0, 35);
      const voteCount = (movie.vote_count || 0).toString().padEnd(10);
      const oscarYear = (movie.oscar_year || 'N/A').toString().padEnd(10);
      const rating = (movie.vote_average || 'N/A').toString().padEnd(6);
      const popularity = (movie.popularity ? movie.popularity.toFixed(1) : 'N/A').toString().padEnd(10);
      
      console.log(`${title} | ${voteCount} | ${oscarYear} | ${rating} | ${popularity}`);
    });
    
    console.log('-------------------------------------------------------------------------------------');

    // Calculate statistics
    const voteCounts = movies
      .map(m => m.vote_count || 0)
      .filter(count => count > 0)
      .sort((a, b) => b - a);

    if (voteCounts.length > 0) {
      const max = voteCounts[0];
      const min = voteCounts[voteCounts.length - 1];
      const median = voteCounts[Math.floor(voteCounts.length / 2)];
      const q75 = voteCounts[Math.floor(voteCounts.length * 0.25)];
      const q25 = voteCounts[Math.floor(voteCounts.length * 0.75)];
      const average = Math.round(voteCounts.reduce((sum, count) => sum + count, 0) / voteCounts.length);

      console.log(`\n📈 VOTE COUNT STATISTICS:`);
      console.log(`=========================`);
      console.log(`Total movies with vote data: ${voteCounts.length}`);
      console.log(`Highest vote count: ${max.toLocaleString()}`);
      console.log(`Lowest vote count: ${min.toLocaleString()}`);
      console.log(`Average: ${average.toLocaleString()}`);
      console.log(`Median (50th percentile): ${median.toLocaleString()}`);
      console.log(`75th percentile: ${q75.toLocaleString()}`);
      console.log(`25th percentile: ${q25.toLocaleString()}`);

      console.log(`\n🎯 SUGGESTED THRESHOLDS FOR "POPULARITY" STEP:`);
      console.log(`==============================================`);
      console.log(`📊 Based on your actual data distribution:`);
      console.log(`   🔥 "Bardzo znany film" (top 25%): ${q75.toLocaleString()}+ głosów`);
      console.log(`   ⭐ "Popularny klasyk" (25-75%): ${q25.toLocaleString()}-${q75.toLocaleString()} głosów`);
      console.log(`   💎 "Mniej znana perełka" (bottom 25%): <${q25.toLocaleString()} głosów`);

      console.log(`\n🎬 TOP 10 MOST VOTED MOVIES:`);
      console.log(`============================`);
      movies.slice(0, 10).forEach((movie, index) => {
        console.log(`${index + 1}. ${movie.title} (${movie.oscar_year}) - ${(movie.vote_count || 0).toLocaleString()} głosów`);
      });

      console.log(`\n💎 BOTTOM 10 LEAST VOTED MOVIES:`);
      console.log(`================================`);
      const bottomMovies = movies
        .filter(m => m.vote_count && m.vote_count > 0)
        .slice(-10)
        .reverse();
      
      bottomMovies.forEach((movie, index) => {
        console.log(`${index + 1}. ${movie.title} (${movie.oscar_year}) - ${(movie.vote_count || 0).toLocaleString()} głosów`);
      });

      // Check for movies without vote data
      const moviesWithoutVotes = movies.filter(m => !m.vote_count || m.vote_count === 0);
      if (moviesWithoutVotes.length > 0) {
        console.log(`\n⚠️  MOVIES WITHOUT VOTE DATA (${moviesWithoutVotes.length}):`);
        console.log(`==========================================`);
        moviesWithoutVotes.forEach(movie => {
          console.log(`   - ${movie.title} (${movie.oscar_year})`);
        });
        console.log(`💡 These movies may need re-enrichment with TMDB data`);
      }
    }

  } catch (error) {
    console.error('❌ Error in getMovieVoteCounts:', error);
  }
}

// Run the script
getMovieVoteCounts();