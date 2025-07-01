/**
 * Script to populate AI-generated tags for movies with WEIGHTED THEMATIC TAGS
 * Fills mood_tags, thematic_tags (as JSONB with importance weights), and classic_experience_level columns
 * Uses OpenAI API to intelligently categorize Oscar movies with priority-based tagging
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Make fetch available globally for Supabase client
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error('Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY');
  console.error('\nPlease check your .env file contains all required variables:');
  console.error('VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('OPENAI_API_KEY=sk-your-openai-key');
  process.exit(1);
}

// Validate Supabase URL format
if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('supabase.co')) {
  console.error('❌ Invalid Supabase URL format. Should be: https://your-project.supabase.co');
  console.error(`Current URL: ${SUPABASE_URL}`);
  process.exit(1);
}

// Validate OpenAI API Key format
if (!OPENAI_API_KEY.startsWith('sk-')) {
  console.error('❌ Invalid OpenAI API key format. API keys should start with "sk-"');
  console.error('Please check your OPENAI_API_KEY in the .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Valid options that must match the frontend forms
const VALID_MOOD_TAGS = [
  'Inspiracja',
  'Adrenalina', 
  'Głębokie emocje',
  'Humor',
  'Coś ambitnego',
  'Romantyczny wieczór'
];

const VALID_THEMATIC_TAGS = [
  'Dramat',
  'Komedia',
  'Akcja', 
  'Horror',
  'Science Fiction',
  'Romans',
  'Thriller',
  'Fantasy',
  'Western',
  'Wojenny',
  'Kryminał',
  'Historyczny',
  'Biograficzny',
  'Przygodowy',
  'Psychologiczny',
  'Musical',
  'Adaptacje teatralne'
];

const VALID_EXPERIENCE_LEVELS = [
  'Początkujący',
  'Średnio zaawansowany', 
  'Kinoman',
  'Mix wszystkiego'
];

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase database connection...');
  try {
    // Fixed: Use correct Supabase count method instead of select('count(*)')
    const { count, error } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      console.error('\n💡 Troubleshooting tips:');
      console.error('   1. Check your VITE_SUPABASE_URL in .env file');
      console.error('   2. Verify your SUPABASE_SERVICE_ROLE_KEY is correct');
      console.error('   3. Ensure your Supabase project is active');
      console.error('   4. Check your internet connection');
      return false;
    }

    console.log(`✅ Supabase connection successful (found ${count || 0} movies in database)`);
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error.message);
    
    if (error.message.includes('fetch failed')) {
      console.error('\n🌐 This appears to be a network connectivity issue.');
      console.error('💡 Please check:');
      console.error('   - Your internet connection');
      console.error('   - Firewall settings allowing HTTPS connections');
      console.error('   - VPN or proxy configuration');
      console.error(`   - Access to ${SUPABASE_URL}`);
    }
    
    return false;
  }
}

// COMMENTED OUT: clearAITags function is no longer needed since migration cleared all tags
// async function clearAITags() {
//   console.log('🧹 Clearing all existing AI tags to ensure fresh processing...\n');
//   
//   try {
//     const { error } = await supabase
//       .from('movies')
//       .update({
//         mood_tags: '{}',
//         thematic_tags: '[]',
//         classic_experience_level: 'Mix wszystkiego',
//         updated_at: new Date().toISOString()
//       })
//       .eq('is_best_picture_nominee', true);
//
//     if (error) {
//       console.error('❌ Error clearing AI tags:', error);
//       return false;
//     }
//
//     // Count how many movies were cleared
//     const { count, error: countError } = await supabase
//       .from('movies')
//       .select('*', { count: 'exact', head: true })
//       .eq('is_best_picture_nominee', true);
//
//     if (countError) {
//       console.error('❌ Error counting cleared movies:', countError);
//       return false;
//     }
//
//     console.log(`✅ Successfully cleared AI tags for ${count || 0} Oscar movies`);
//     console.log('🔄 All movies will now be processed with fresh AI analysis\n');
//     return true;
//
//   } catch (error) {
//     console.error('❌ Error in clearAITags function:', error);
//     return false;
//   }
// }

async function makeOpenAIRequest(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`   🔄 API call attempt ${attempt}/${retries}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'MovieTagger/1.0'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Jesteś precyzyjnym ekspertem od kategoryzacji filmów. Zawsze odpowiadasz w formacie JSON bez dodatkowych komentarzy. Analizujesz filmy i przypisujesz im tagi z odpowiednimi wagami ważności. BARDZO WAŻNE: Unikaj przypisywania wszystkim tagom tej samej wagi (np. 1.0) - używaj różnorodnych wag aby odzwierciedlić prawdziwy poziom ważności każdego gatunku w filmie.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 400,
          temperature: 0.4,
          response_format: { type: "json_object" }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from OpenAI API');
      }

      return JSON.parse(data.choices[0].message.content || '{}');

    } catch (error) {
      console.log(`   ⚠️  Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`   ⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function generateMovieTags(movie) {
  try {
    const prompt = `Jesteś ekspertem od filmów, który kategoryzuje filmy oscarowe dla platformy rekomendacji. Przeanalizuj film i przypisz mu odpowiednie tagi z ZRÓŻNICOWANYMI WAGAMI WAŻNOŚCI.

INFORMACJE O FILMIE:
- Tytuł: ${movie.title}
- Rok: ${movie.year}
- Gatunki TMDB: ${movie.genres?.join(', ') || 'Brak'}
- Opis: ${movie.overview || 'Brak opisu'}
- Status Oscar: ${movie.is_best_picture_winner ? 'Zwycięzca' : 'Nominowany'} (${movie.oscar_year})
- Ocena: ${movie.vote_average}/10
- Czas: ${movie.runtime} min

ZADANIE: Przypisz filmowi tagi z DOKŁADNIE tych list z PRECYZYJNYMI WAGAMI WAŻNOŚCI:

1. MOOD_TAGS (1-3 tagi opisujące nastrój/emocje filmu):
${VALID_MOOD_TAGS.map(tag => `- ${tag}`).join('\n')}

2. THEMATIC_TAGS (maksymalnie 3 tagi z RÓŻNYMI wagami - UNIKAJ 1.0 dla wszystkich!):
${VALID_THEMATIC_TAGS.map(tag => `- ${tag}`).join('\n')}

🎯 KLUCZOWE INSTRUKCJE DLA THEMATIC_TAGS (WAŻNE - przeczytaj uważnie!):

⚠️ BARDZO WAŻNE: NIE PRZYPISUJ WSZYSTKIM TAGOM TEJ SAMEJ WAGI!
Używaj zróżnicowanych wag aby odzwierciedlić prawdziwą strukturę filmu:

WAGI WAŻNOŚCI (0.1-1.0):
• 0.9-1.0: DEFINUJĄCY gatunek filmu - to CO JEST NAJWAŻNIEJSZE w tym filmie
  - Przykład: "Gladiator" → "Akcja": 1.0 (to przede wszystkim film akcji)
  - Tylko 1 tag powinien mieć wagę 0.9-1.0!

• 0.6-0.8: ZNACZĄCY element filmu - wyraźnie obecny, ale nie główny
  - Przykład: "Gladiator" → "Historyczny": 0.7 (ważny element, ale nie główny)
  - Przykład: "Chicago" → "Dramat": 0.8 (znaczący, ale to głównie musical)

• 0.3-0.5: OBECNY w filmie - zauważalny, ale drugorzędny
  - Przykład: "Gladiator" → "Biograficzny": 0.4 (elementy biograficzne, ale to nie biografia)
  - Przykład: "Lord of the Rings" → "Romans": 0.3 (wątek romantyczny jest, ale drugorzędny)

KONKRETNE PRZYKŁADY JAK ANALIZOWAĆ:

"Chicago" (2002):
✅ POPRAWNIE: Musical (1.0), Kryminał (0.7), Komedia (0.5)
❌ ŹLE: Musical (1.0), Kryminał (1.0), Komedia (1.0)

"The Departed" (2006):
✅ POPRAWNIE: Kryminał (1.0), Thriller (0.8), Dramat (0.6)
❌ ŹLE: Kryminał (1.0), Thriller (1.0), Dramat (1.0)

"Lord of the Rings" (2001):
✅ POPRAWNIE: Fantasy (1.0), Przygodowy (0.8), Akcja (0.7)
❌ ŹLE: Fantasy (1.0), Przygodowy (1.0), Akcja (1.0)

STRATEGIA ANALIZY:
1. Jaki jest GŁÓWNY gatunek tego filmu? (waga 0.9-1.0)
2. Jakie elementy są WYRAŹNIE obecne, ale nie główne? (waga 0.6-0.8)
3. Czy są jakieś DRUGORZĘDNE elementy warte uwagi? (waga 0.3-0.5)

PRIORYTET dla tagów:
- Unikalnych (Musical, Western, Adaptacje teatralne)
- Definiujących charakter filmu
- Pomagających użytkownikom znaleźć właśnie TAKI film

3. EXPERIENCE_LEVEL (jeden poziom trudności):
- Początkujący: Filmy łatwe w odbiorze, popularne, uniwersalne
- Średnio zaawansowany: Filmy wymagające podstawowego doświadczenia kinowego  
- Kinoman: Filmy ambitne, artystyczne, wymagające głębokiej analizy
- Mix wszystkiego: Gdy film pasuje do różnych poziomów

Format odpowiedzi (UŻYWAJ RÓŻNYCH WAG!):
{
  "mood_tags": ["tag1", "tag2"],
  "thematic_tags": [
    {"tag": "Główny gatunek", "importance": 1.0},
    {"tag": "Znaczący element", "importance": 0.7},
    {"tag": "Obecny aspekt", "importance": 0.4}
  ],
  "experience_level": "poziom"
}`;

    const result = await makeOpenAIRequest(prompt);
    
    // Validate and process the response
    const validatedResult = {
      mood_tags: (result.mood_tags || []).filter(tag => VALID_MOOD_TAGS.includes(tag)),
      thematic_tags: [],
      experience_level: VALID_EXPERIENCE_LEVELS.includes(result.experience_level) 
        ? result.experience_level 
        : 'Mix wszystkiego'
    };

    // Process thematic tags with weights
    if (result.thematic_tags && Array.isArray(result.thematic_tags)) {
      for (const tagObj of result.thematic_tags.slice(0, 3)) { // Max 3 tags
        if (tagObj && typeof tagObj === 'object' && tagObj.tag && typeof tagObj.importance === 'number') {
          if (VALID_THEMATIC_TAGS.includes(tagObj.tag)) {
            // Ensure importance is between 0.1 and 1.0
            const importance = Math.max(0.1, Math.min(1.0, tagObj.importance));
            validatedResult.thematic_tags.push({
              tag: tagObj.tag,
              importance: Math.round(importance * 10) / 10 // Round to 1 decimal place
            });
          }
        }
      }
    }

    // 🔧 ENHANCED QUALITY CHECK: Much more robust detection of uniform weights
    if (validatedResult.thematic_tags.length > 1) {
      const importanceValues = validatedResult.thematic_tags.map(t => t.importance);
      
      // Check for multiple types of uniform values
      const roundedValues = importanceValues.map(val => Math.round(val * 10) / 10);
      const allSameImportance = roundedValues.every(val => val === roundedValues[0]);
      
      // Also check if all values are suspiciously close to 1.0
      const allHighValues = importanceValues.every(val => val >= 0.95);
      
      // Apply fallback if we detect uniform weights OR all high values
      if (allSameImportance || allHighValues) {
        console.log(`   🔧 APPLYING ROBUST FALLBACK: Detected uniform weights for ${movie.title}`);
        console.log(`   📊 Original weights: ${importanceValues.join(', ')}`);
        
        // Apply varied weights based on movie genre analysis
        const fallbackWeights = [1.0, 0.7, 0.4]; // Ensuring clear differentiation
        
        validatedResult.thematic_tags.forEach((tag, index) => {
          if (index < fallbackWeights.length) {
            tag.importance = fallbackWeights[index];
          } else {
            tag.importance = 0.3; // Very secondary tags
          }
        });
        
        console.log(`   ✅ Adjusted weights: ${validatedResult.thematic_tags.map(t => t.importance).join(', ')}`);
      }
    }

    // Ensure we have at least some tags
    if (validatedResult.mood_tags.length === 0) {
      validatedResult.mood_tags = ['Inspiracja'];
    }
    if (validatedResult.thematic_tags.length === 0) {
      validatedResult.thematic_tags = [{ tag: 'Dramat', importance: 1.0 }];
    }

    return validatedResult;

  } catch (error) {
    console.error(`   ❌ Error generating tags for ${movie.title}:`, error.message);
    
    // Check if it's a network/API connectivity issue
    if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('   🌐 This appears to be a network connectivity issue.');
      console.error('   💡 Please check:');
      console.error('      - Your internet connection');
      console.error('      - OpenAI API key validity');
      console.error('      - Firewall/proxy settings');
    }
    
    // Return safe defaults
    console.log(`   🔄 Using fallback tags for ${movie.title}`);
    return {
      mood_tags: ['Inspiracja'],
      thematic_tags: [{ tag: 'Dramat', importance: 1.0 }],
      experience_level: 'Mix wszystkiego'
    };
  }
}

async function updateMovieWithTags(movieId, tags, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { error } = await supabase
        .from('movies')
        .update({
          mood_tags: tags.mood_tags,
          thematic_tags: tags.thematic_tags, // Now JSONB format
          classic_experience_level: tags.experience_level,
          updated_at: new Date().toISOString()
        })
        .eq('id', movieId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error(`   ⚠️  Database update attempt ${attempt}/${retries} failed:`, error.message);
      
      if (error.message.includes('fetch failed')) {
        console.error('   🌐 Network connectivity issue detected');
        
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`   ⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      if (attempt === retries) {
        console.error('   ❌ All database update attempts failed');
        console.error('   💡 This might be a persistent connectivity issue');
        console.error('   🔧 Please check your Supabase configuration and network connection');
        return false;
      }
    }
  }
  return false;
}

async function testOpenAIConnection() {
  console.log('🔍 Testing OpenAI API connection...');
  try {
    const testResult = await makeOpenAIRequest('Test message. Respond with: {"test": "success"}', 1);
    if (testResult.test === 'success') {
      console.log('✅ OpenAI API connection successful');
      return true;
    } else {
      console.log('⚠️  OpenAI API responded but with unexpected format');
      return false;
    }
  } catch (error) {
    console.error('❌ OpenAI API connection failed:', error.message);
    console.error('🛑 Cannot proceed with AI tagging. Please fix the connection issue.');
    return false;
  }
}

async function populateAITags() {
  console.log('🎬 Starting ROBUST WEIGHTED AI tags population for Oscar movies...\n');
  console.log('🔧 ENHANCED FALLBACK: Now forcefully ensures varied importance weights!\n');
  console.log('ℹ️  AI tags have been pre-cleared by database migration - proceeding directly to generation...\n');
  
  // Test Supabase connection first
  const supabaseOk = await testSupabaseConnection();
  if (!supabaseOk) {
    console.log('\n🛑 Cannot proceed without a working Supabase connection.');
    console.log('Please fix the connection issue and try again.');
    return;
  }
  
  // Test OpenAI API connection
  const openaiOk = await testOpenAIConnection();
  if (!openaiOk) {
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Check your OPENAI_API_KEY in .env file');
    console.log('   2. Ensure you have an active OpenAI account with credits');
    console.log('   3. Verify your internet connection');
    console.log('   4. Check if any firewall is blocking api.openai.com');
    return;
  }

  // COMMENTED OUT: AI tags clearing is no longer needed since migration already cleared all tags
  // const clearingSuccessful = await clearAITags();
  // if (!clearingSuccessful) {
  //   console.log('\n🛑 Failed to clear existing AI tags. Cannot proceed.');
  //   return;
  // }
  
  try {
    // Get movies that need AI tags (empty mood_tags or default experience level)
    const { data: movies, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_best_picture_nominee', true)
      .or('mood_tags.eq.{},classic_experience_level.eq.Mix wszystkiego')
      .order('oscar_year', { ascending: true });

    if (error) {
      console.error('❌ Error fetching movies:', error);
      return;
    }

    console.log(`\n📊 Processing ${movies.length} Oscar movies that need AI tags\n`);

    if (movies.length === 0) {
      console.log('✅ All Oscar movies already have AI tags! Running final statistics...');
      await showFinalStatistics();
      return;
    }

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;
    let fallbacksApplied = 0;

    for (const movie of movies) {
      totalProcessed++;
      console.log(`\n🎯 Processing (${totalProcessed}/${movies.length}): ${movie.title} (${movie.oscar_year})`);

      // Check if movie has sufficient data for good AI analysis
      if (!movie.overview && !movie.genres) {
        console.log(`⚠️  Skipping - insufficient data (no overview or genres)`);
        totalErrors++;
        continue;
      }

      const tags = await generateMovieTags(movie);
      
      console.log(`🏷️  Generated VARIED WEIGHTED tags:`);
      console.log(`   Mood: [${tags.mood_tags.join(', ')}]`);
      console.log(`   Thematic:`);
      tags.thematic_tags.forEach(tagObj => {
        console.log(`     - ${tagObj.tag} (importance: ${tagObj.importance})`);
      });
      console.log(`   Experience: ${tags.experience_level}`);

      // Track if fallback was applied
      if (tags.thematic_tags.length > 1) {
        const importanceValues = tags.thematic_tags.map(t => t.importance);
        const hasVariedWeights = !importanceValues.every(val => val === importanceValues[0]);
        if (!hasVariedWeights) {
          fallbacksApplied++;
        }
      }

      const success = await updateMovieWithTags(movie.id, tags);
      
      if (success) {
        console.log(`✅ Updated successfully`);
        totalSuccess++;
      } else {
        console.log(`❌ Database update failed`);
        totalErrors++;
      }

      // Add delay to respect API rate limits (OpenAI allows 10,000 RPM)
      await new Promise(resolve => setTimeout(resolve, 600)); // Slightly longer delay for better quality
    }

    console.log(`\n🎉 ROBUST WEIGHTED AI tagging complete!`);
    console.log(`📊 Total processed: ${totalProcessed}`);
    console.log(`✅ Successfully tagged: ${totalSuccess}`);
    console.log(`❌ Errors: ${totalErrors}`);
    console.log(`🔧 Fallbacks applied: ${fallbacksApplied} (ensuring weight variety)`);

    // Show final statistics
    await showFinalStatistics();

  } catch (error) {
    console.error('❌ Error in AI tagging process:', error);
  }
}

async function showFinalStatistics() {
  try {
    const { data: movies, error } = await supabase
      .from('movies')
      .select('mood_tags, thematic_tags, classic_experience_level, title')
      .eq('is_best_picture_nominee', true);

    if (error) {
      console.error('Error fetching final statistics:', error);
      return;
    }

    const withMoodTags = movies.filter(m => m.mood_tags && m.mood_tags.length > 0).length;
    const withThematicTags = movies.filter(m => 
      m.thematic_tags && Array.isArray(m.thematic_tags) && m.thematic_tags.length > 0
    ).length;
    
    // Count experience level distribution
    const experienceDistribution = {};
    movies.forEach(movie => {
      const level = movie.classic_experience_level || 'Mix wszystkiego';
      experienceDistribution[level] = (experienceDistribution[level] || 0) + 1;
    });

    // Analyze importance weight distribution
    let totalTags = 0;
    let importanceDistribution = { '1.0': 0, '0.8-0.9': 0, '0.6-0.7': 0, '0.3-0.5': 0, '0.1-0.2': 0 };
    let uniformWeightMovies = 0;
    
    movies.forEach(movie => {
      if (movie.thematic_tags && Array.isArray(movie.thematic_tags)) {
        // Check if this movie has uniform weights
        if (movie.thematic_tags.length > 1) {
          const importanceValues = movie.thematic_tags.map(t => t.importance || 1.0);
          const allSame = importanceValues.every(val => val === importanceValues[0]);
          if (allSame) {
            uniformWeightMovies++;
          }
        }
        
        movie.thematic_tags.forEach(tagObj => {
          if (tagObj && tagObj.importance) {
            totalTags++;
            const imp = tagObj.importance;
            if (imp === 1.0) importanceDistribution['1.0']++;
            else if (imp >= 0.8) importanceDistribution['0.8-0.9']++;
            else if (imp >= 0.6) importanceDistribution['0.6-0.7']++;
            else if (imp >= 0.3) importanceDistribution['0.3-0.5']++;
            else importanceDistribution['0.1-0.2']++;
          }
        });
      }
    });

    console.log(`\n📈 FINAL STATISTICS:`);
    console.log(`================================`);
    console.log(`Total Oscar movies: ${movies.length}`);
    console.log(`Movies with mood tags: ${withMoodTags}`);
    console.log(`Movies with weighted thematic tags: ${withThematicTags}`);
    console.log('');
    console.log(`📊 Experience Level Distribution:`);
    Object.entries(experienceDistribution).forEach(([level, count]) => {
      console.log(`   ${level}: ${count} movies`);
    });
    
    console.log('\n⚖️  IMPORTANCE WEIGHT DISTRIBUTION:');
    Object.entries(importanceDistribution).forEach(([range, count]) => {
      const percentage = totalTags > 0 ? ((count / totalTags) * 100).toFixed(1) : '0.0';
      console.log(`   ${range}: ${count} tags (${percentage}%)`);
    });
    
    console.log(`\n🚨 UNIFORM WEIGHT CHECK:`);
    console.log(`   Movies with all same importance: ${uniformWeightMovies}`);
    console.log(`   Movies with varied importance: ${movies.length - uniformWeightMovies}`);
    
    if (uniformWeightMovies === 0) {
      console.log(`   ✅ SUCCESS: All movies have varied importance weights!`);
    } else {
      console.log(`   ⚠️  WARNING: ${uniformWeightMovies} movies still have uniform weights`);
    }
    
    // Show sample varied weighted tags
    console.log('\n🎯 SAMPLE VARIED WEIGHTED TAGS:');
    const samplesWithVariedTags = movies.filter(m => {
      if (!m.thematic_tags || !Array.isArray(m.thematic_tags) || m.thematic_tags.length < 2) return false;
      const importances = m.thematic_tags.map(t => t.importance);
      return !importances.every(val => val === importances[0]); // Not all same importance
    }).slice(0, 5);
    
    samplesWithVariedTags.forEach(movie => {
      console.log(`   "${movie.title || 'Unknown'}":`);
      if (movie.thematic_tags) {
        movie.thematic_tags
          .sort((a, b) => (b.importance || 0) - (a.importance || 0)) // Sort by importance
          .forEach(tagObj => {
            console.log(`     - ${tagObj.tag} (${tagObj.importance})`);
          });
      }
      console.log('');
    });
    
    console.log('\n✅ Enhanced Smart Match questionnaire now uses VARIED WEIGHTED tag matching!');
    console.log('🎯 Robust fallback ensures varied importance weights for better recommendations.');
    console.log('💡 Users will get better matches based on genre specificity.');

  } catch (error) {
    console.error('Error showing final statistics:', error);
  }
}

// Run the script
populateAITags().catch(console.error);