import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface RecommendationRequest {
  type: 'quick-shot' | 'explanation' | 'brief' | 'smart-match'
  movieId?: string
  tmdbId?: number
  userPreferences?: {
    mood?: string
    time?: string
    genres?: string[]
    decade?: string // decade filter
    popularity?: string // NEW: popularity filter
    platforms?: string[]
    allowRental?: boolean
    showAll?: boolean
  }
  // NEW: Progress insight request
  categoryType?: 'decade' | 'year'
  categoryIdentifier?: string
  watchedCount?: number
  totalCount?: number
  toWatchMovies?: Array<{
    title: string
    thematic_tags?: Array<{tag: string, importance: number}>
    mood_tags?: string[]
    vote_average?: number
  }>
}

interface Movie {
  id: string
  tmdb_id: number
  title: string
  original_title?: string
  year: number
  release_date?: string
  runtime?: number
  genre_ids?: number[]
  genres?: string[]
  overview?: string
  poster_path?: string
  backdrop_path?: string
  vote_average?: number
  vote_count?: number
  popularity?: number
  is_best_picture_nominee: boolean
  is_best_picture_winner: boolean
  oscar_year?: number
  ai_recommendation_text?: string
  ai_brief_text?: string
  mood_tags?: string[]
  thematic_tags?: Array<{tag: string, importance: number}>
  classic_experience_level?: string
  created_at: string
  updated_at: string
}

interface MovieRecommendation {
  movie: Movie
  matchScore: number
  reason: string
  rank: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData: RecommendationRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (requestData.type === 'quick-shot') {
      let targetMovie = null;

      // If movieId is provided, get that specific movie
      if (requestData.movieId) {
        const { data: movie, error } = await supabaseClient
          .from('movies')
          .select('*')
          .eq('id', requestData.movieId)
          .eq('is_best_picture_nominee', true)
          .single()

        if (error) {
          console.error('Error fetching specific movie:', error)
          // Fallback to random movie if specific movie not found
        } else {
          targetMovie = movie;
        }
      }

      // If no specific movie found or no movieId provided, get a random one
      if (!targetMovie) {
        const { data: movies, error } = await supabaseClient
          .from('movies')
          .select('*')
          .eq('is_best_picture_nominee', true)
          .limit(50)

        if (error || !movies || movies.length === 0) {
          return new Response(
            JSON.stringify({ error: 'No movies found' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        targetMovie = movies[Math.floor(Math.random() * movies.length)]
      }

      // Generate AI expectation text if not exists
      let expectationText = targetMovie.ai_recommendation_text
      if (!expectationText) {
        console.log(`🔍 Generating AI recommendation for "${targetMovie.title}" (${targetMovie.id})`)
        expectationText = await generateExpectationText(targetMovie)
        
        // Update the movie with the generated expectation text
        const { error: updateError } = await supabaseClient
          .from('movies')
          .update({ ai_recommendation_text: expectationText })
          .eq('id', targetMovie.id)
        
        if (updateError) {
          console.error(`❌ Error updating AI recommendation for "${targetMovie.title}":`, updateError)
        } else {
          console.log(`✅ Successfully saved AI recommendation for "${targetMovie.title}"`)
        }
      }

      return new Response(
        JSON.stringify({ 
          movie: targetMovie,
          recommendation: expectationText
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (requestData.type === 'smart-match') {
      if (!requestData.userPreferences) {
        return new Response(
          JSON.stringify({ error: 'User preferences are required for smart match' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Build decade filter for database query
      let query = supabaseClient
        .from('movies')
        .select('*')
        .eq('is_best_picture_nominee', true)
        .not('mood_tags', 'is', null)
        .not('thematic_tags', 'is', null);

      // Apply decade filter if specified
      if (requestData.userPreferences.decade) {
        if (requestData.userPreferences.decade === '2000s') {
          query = query.gte('oscar_year', 2001).lte('oscar_year', 2010);
        } else if (requestData.userPreferences.decade === '2010s') {
          query = query.gte('oscar_year', 2011).lte('oscar_year', 2020);
        }
        // 'both' doesn't add any filter
      }

      // NEW: Apply popularity filter based on vote_count
      if (requestData.userPreferences.popularity && requestData.userPreferences.popularity !== 'any') {
        // First get vote count thresholds from the database
        const { data: allMovies, error: thresholdError } = await supabaseClient
          .from('movies')
          .select('vote_count')
          .eq('is_best_picture_nominee', true)
          .not('vote_count', 'is', null)
          .gt('vote_count', 0)
          .order('vote_count', { ascending: false });

        if (!thresholdError && allMovies && allMovies.length > 0) {
          const voteCounts = allMovies.map(m => m.vote_count).sort((a, b) => b - a);
          const q75Index = Math.floor(voteCounts.length * 0.25); // Top 25%
          const q25Index = Math.floor(voteCounts.length * 0.75); // Bottom 25%
          
          const highThreshold = voteCounts[q75Index] || 100000; // Fallback
          const lowThreshold = voteCounts[q25Index] || 10000; // Fallback

          console.log(`🎯 Popularity thresholds: High=${highThreshold}, Low=${lowThreshold}`);

          // Apply popularity filter
          switch (requestData.userPreferences.popularity) {
            case 'blockbuster':
              query = query.gte('vote_count', highThreshold);
              break;
            case 'classic':
              query = query.gte('vote_count', lowThreshold).lt('vote_count', highThreshold);
              break;
            case 'hidden-gem':
              query = query.lt('vote_count', lowThreshold);
              break;
            // 'any' doesn't add filter
          }
        }
      }

      const { data: movies, error } = await query;

      if (error || !movies || movies.length === 0) {
        console.error('No movies found for smart matching:', error);
        return new Response(
          JSON.stringify({ error: 'No movies found for smart matching with these criteria' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Calculate match scores first WITHOUT generating AI reasons
      console.log(`🎯 Smart Match: Scoring ${movies.length} movies (decade: ${requestData.userPreferences.decade || 'all'}, popularity: ${requestData.userPreferences.popularity || 'any'})...`)
      
      const scoredMovies: Array<{movie: Movie, matchScore: number}> = []
      
      for (const movie of movies) {
        const matchScore = calculateMatchScore(movie, requestData.userPreferences!)
        scoredMovies.push({ movie, matchScore })
      }

      // Sort by match score (highest first) and take top 3
      scoredMovies.sort((a, b) => b.matchScore - a.matchScore)
      const topMovies = scoredMovies.slice(0, 3)
      
      console.log(`🏆 Top 3 selected, now generating CACHED AI reasons...`)

      // Generate CACHED AI reasons for the top 3 movies
      const topRecommendations: MovieRecommendation[] = []
      
      for (let i = 0; i < topMovies.length; i++) {
        const { movie, matchScore } = topMovies[i]
        console.log(`💾 Getting cached/generating reason for #${i + 1}: ${movie.title} (${movie.oscar_year})`)
        
        const reason = await getCachedOrGenerateShortReason(supabaseClient, movie, requestData.userPreferences!, matchScore)
        
        topRecommendations.push({
          movie,
          matchScore,
          reason,
          rank: i + 1
        })
      }

      console.log(`✅ Smart Match complete: Generated ${topRecommendations.length} AI recommendations`)

      return new Response(
        JSON.stringify({
          recommendations: topRecommendations,
          totalAnalyzed: movies.length,
          success: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (requestData.type === 'explanation' && requestData.movieId) {
      // Get specific movie and generate explanation
      const { data: movie, error } = await supabaseClient
        .from('movies')
        .select('*')
        .eq('id', requestData.movieId)
        .single()

      if (error || !movie) {
        return new Response(
          JSON.stringify({ error: 'Movie not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const explanation = await generateExplanation(movie, requestData.userPreferences)

      return new Response(
        JSON.stringify({ 
          explanation,
          movie: movie
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (requestData.type === 'brief' && requestData.movieId) {
      // Get specific movie and generate 5-minute brief
      const { data: movie, error } = await supabaseClient
        .from('movies')
        .select('*')
        .eq('id', requestData.movieId)
        .single()

      if (error || !movie) {
        return new Response(
          JSON.stringify({ error: 'Movie not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      let briefText = movie.ai_brief_text
      if (!briefText) {
        console.log(`🔍 Generating AI brief for "${movie.title}" (${movie.id})`)
        briefText = await generateBrief(movie)
        
        // Update the movie with the generated brief
        const { error: updateError } = await supabaseClient
          .from('movies')
          .update({ ai_brief_text: briefText })
          .eq('id', movie.id)
        
        if (updateError) {
          console.error(`❌ Error updating AI brief for "${movie.title}":`, updateError)
        } else {
          console.log(`✅ Successfully saved AI brief for "${movie.title}"`)
        }
      }

      return new Response(
        JSON.stringify({ 
          brief: briefText,
          movie: movie
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (requestData.type === 'progress-insight') {
      if (!requestData.categoryType || !requestData.categoryIdentifier) {
        return new Response(
          JSON.stringify({ error: 'Category type and identifier are required for progress insight' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const insight = await generateProgressInsight(
        requestData.categoryType,
        requestData.categoryIdentifier,
        requestData.watchedCount || 0,
        requestData.totalCount || 0,
        requestData.toWatchMovies || []
      )

      return new Response(
        JSON.stringify({ insight }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request type' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in movie-recommendations function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Enhanced Smart Match scoring algorithm with POPULARITY FILTERING SUPPORT
function calculateMatchScore(movie: Movie, preferences: any): number {
  let totalScore = 0
  let maxPossibleScore = 0

  // Base weights
  let moodWeight = 35
  let genreWeight = 30
  let runtimeWeight = 10
  let bonusWeight = 25 // Increased for popularity and Oscar status

  // Genre specificity bonus
  if (preferences.genres && preferences.genres.length === 1 && !preferences.genres.includes('surprise')) {
    genreWeight = 45
    moodWeight = 25
    bonusWeight = 20
  } else if (preferences.genres && preferences.genres.length === 2 && !preferences.genres.includes('surprise')) {
    genreWeight = 38
    moodWeight = 30
    bonusWeight = 22
  }

  // 1. MOOD MATCHING
  maxPossibleScore += moodWeight
  
  if (movie.mood_tags && movie.mood_tags.length > 0 && preferences.mood) {
    const moodMapping: { [key: string]: string } = {
      'inspiration': 'Inspiracja',
      'adrenaline': 'Adrenalina', 
      'emotions': 'Głębokie emocje',
      'humor': 'Humor',
      'ambitious': 'Coś ambitnego',
      'romance': 'Romantyczny wieczór'
    }
    
    const selectedMood = moodMapping[preferences.mood] || preferences.mood
    if (movie.mood_tags.includes(selectedMood)) {
      totalScore += moodWeight
    }
  }

  // 2. WEIGHTED GENRE/THEMATIC MATCHING
  maxPossibleScore += genreWeight
  
  if (movie.thematic_tags && movie.thematic_tags.length > 0 && preferences.genres && preferences.genres.length > 0) {
    if (preferences.genres.includes('surprise')) {
      totalScore += genreWeight
    } else {
      let totalMatchScore = 0
      let maxPossibleMatchScore = 0
      
      for (const selectedGenre of preferences.genres) {
        const matchingTag = movie.thematic_tags.find(tagObj => 
          tagObj && tagObj.tag === selectedGenre
        )
        
        if (matchingTag) {
          totalMatchScore += matchingTag.importance || 1.0
        }
        maxPossibleMatchScore += 1.0
      }
      
      if (maxPossibleMatchScore > 0) {
        const weightedMatchPercentage = Math.min(1.0, totalMatchScore / maxPossibleMatchScore)
        let genreScore = weightedMatchPercentage * genreWeight
        
        if (preferences.genres.length === 1) {
          const matchingTag = movie.thematic_tags.find(tagObj => 
            tagObj && tagObj.tag === preferences.genres[0]
          )
          if (matchingTag && matchingTag.importance >= 0.8) {
            genreScore = genreWeight * 1.15
          }
        }
        
        totalScore += Math.min(genreScore, genreWeight * 1.15)
      }
    }
  }

  // 3. RUNTIME MATCHING
  maxPossibleScore += runtimeWeight
  
  if (movie.runtime && preferences.time) {
    const runtime = movie.runtime
    let timeMatch = false
    
    switch (preferences.time) {
      case 'short':
        timeMatch = runtime <= 120
        break
      case 'normal':
        timeMatch = runtime > 90 && runtime <= 180
        break
      case 'long':
        timeMatch = runtime > 150
        break
      case 'any':
        timeMatch = true
        break
    }
    
    if (timeMatch) {
      totalScore += runtimeWeight
    }
  }

  // 4. ENHANCED BONUSES (Oscar, Rating, Popularity, Decade)
  maxPossibleScore += bonusWeight
  let qualityBonus = 0

  // Oscar Winner Bonus
  if (movie.is_best_picture_winner) {
    qualityBonus += 8 // Increased
  } else if (movie.is_best_picture_nominee) {
    qualityBonus += 4
  }

  // High Rating Bonus
  if (movie.vote_average) {
    if (movie.vote_average >= 8.5) {
      qualityBonus += 6
    } else if (movie.vote_average >= 8.0) {
      qualityBonus += 4
    } else if (movie.vote_average >= 7.5) {
      qualityBonus += 2
    }
  }

  // NEW: Popularity Bonus (since we've pre-filtered, give bonus for being in selected category)
  if (preferences.popularity && preferences.popularity !== 'any' && movie.vote_count) {
    qualityBonus += 3 // Bonus for being in the desired popularity range
  }

  // Decade preference bonus
  if (preferences.decade && preferences.decade !== 'both') {
    const isPreferredDecade = 
      (preferences.decade === '2000s' && movie.oscar_year >= 2001 && movie.oscar_year <= 2010) ||
      (preferences.decade === '2010s' && movie.oscar_year >= 2011 && movie.oscar_year <= 2020);
    
    if (isPreferredDecade) {
      qualityBonus += 2
    }
  }

  // Cap bonus at bonusWeight
  totalScore += Math.min(qualityBonus, bonusWeight)

  // Convert to percentage
  const rawPercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0
  
  return Math.round(Math.min(rawPercentage, 98))
}

// CACHED SHORT REASON GENERATION
async function getCachedOrGenerateShortReason(supabaseClient: any, movie: Movie, preferences: any, matchScore: number): Promise<string> {
  try {
    // Create preferences hash for cache key (now includes popularity)
    const preferencesHash = createPreferencesHash(preferences)
    
    // Try to get cached reason first
    const { data: cachedData, error: cacheError } = await supabaseClient
      .from('smart_match_cache')
      .select('cached_reason')
      .eq('movie_id', movie.id)
      .eq('preferences_hash', preferencesHash)
      .single()

    if (!cacheError && cachedData) {
      console.log(`✅ Cache HIT for ${movie.title}`)
      
      // Update last_used timestamp
      await supabaseClient
        .from('smart_match_cache')
        .update({ last_used: new Date().toISOString() })
        .eq('movie_id', movie.id)
        .eq('preferences_hash', preferencesHash)
      
      return cachedData.cached_reason
    }

    console.log(`❌ Cache MISS for ${movie.title} - generating new reason...`)
    
    // Generate new SHORT reason using AI
    const newReason = await generateShortSmartReason(movie, preferences, matchScore)
    
    // Cache the new reason
    await supabaseClient
      .from('smart_match_cache')
      .upsert({
        movie_id: movie.id,
        preferences_hash: preferencesHash,
        cached_reason: newReason,
        match_score: matchScore,
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString()
      })
    
    return newReason

  } catch (error) {
    console.error('Error in cache system:', error)
    return await generateShortSmartReason(movie, preferences, matchScore)
  }
}

// Helper function to create consistent hash from preferences (UPDATED: includes popularity)
function createPreferencesHash(preferences: any): string {
  const normalized = {
    mood: preferences.mood || '',
    time: preferences.time || '',
    genres: (preferences.genres || []).sort().join(','),
    decade: preferences.decade || 'both',
    popularity: preferences.popularity || 'any' // NEW: include popularity in hash
  }
  
  const str = JSON.stringify(normalized)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

// ENHANCED SHORT AI REASON GENERATION (now includes popularity context)
async function generateShortSmartReason(movie: Movie, preferences: any, matchScore: number): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    return generateShortStructuredFallback(movie, preferences, matchScore)
  }

  try {
    const userChoicesContext = createUserChoicesContext(preferences)
    const movieContext = createMovieContext(movie)
    
    const prompt = `Jesteś ekspertem od filmów, który tłumaczy użytkownikom dlaczego konkretny film idealnie pasuje do ich wyborów w formularzu. Napisz BARDZO KRÓTKIE uzasadnienie (MAX 1-2 zdania) dlaczego "${movie.title}" to dobry wybór.

WYBORY UŻYTKOWNIKA W FORMULARZU:
${userChoicesContext}

INFORMACJE O FILMIE:
${movieContext}

ZADANIE: Napisz BARDZO KRÓTKIE uzasadnienie (MAKSYMALNIE 1-2 zdania) dlaczego ten film pasuje do wyborów użytkownika, uwzględniając szczególnie preferencje popularności.

WAŻNE ZASADY:
1. 🎯 MAKSYMALNIE 1-2 zdania - to MUSI BYĆ KRÓTKIE!
2. 📝 Pisz naturalnie i płynnie, ale zwięźle
3. 🔗 Skup się na NAJWAŻNIEJSZYM argumencie
4. 📊 Uwzględnij preferencje popularności jeśli określone
5. ⭐ Oceny opisuj jako "ocena widzów" z "aż" dla dobrych ocen
6. 🎭 Gatunki opisuj naturalnie

Napisz KRÓTKIE uzasadnienie (MAX 2 zdania) dla "${movie.title}":
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Jesteś ekspertem od filmów, który tworzy BARDZO KRÓTKIE (1-2 zdania), naturalne uzasadnienia dlaczego konkretny film pasuje do wyborów użytkownika, uwzględniając preferencje popularności.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API error')
    }

    const data = await response.json()
    const aiReason = data.choices[0]?.message?.content?.trim()
    
    if (aiReason && aiReason.length > 10) {
      return aiReason
    } else {
      return generateShortStructuredFallback(movie, preferences, matchScore)
    }

  } catch (error) {
    console.error('Error generating short AI reason:', error)
    return generateShortStructuredFallback(movie, preferences, matchScore)
  }
}

// SHORT Fallback for when AI is not available (enhanced with popularity context)
function generateShortStructuredFallback(movie: Movie, preferences: any, matchScore: number): string {
  // Popularity context
  let popularityContext = '';
  if (preferences.popularity === 'blockbuster') {
    popularityContext = ' - jeden z najpopularniejszych oscarowych hitów';
  } else if (preferences.popularity === 'hidden-gem') {
    popularityContext = ' - mniej znana, ale wysoko ceniona perełka';
  } else if (preferences.popularity === 'classic') {
    popularityContext = ' - uznany klasyk o średniej popularności';
  }

  // Decade context
  const decadeContext = preferences.decade === '2000s' ? 'z lat 2000-2009' : 
                       preferences.decade === '2010s' ? 'z lat 2010-2019' : '';
  
  // Main genre match
  if (preferences.genres && preferences.genres.length > 0 && !preferences.genres.includes('surprise') && movie.thematic_tags) {
    const matchingTags = movie.thematic_tags.filter(tagObj => 
      tagObj && preferences.genres.includes(tagObj.tag)
    ).sort((a, b) => (b.importance || 0) - (a.importance || 0))
    
    if (matchingTags.length > 0 && movie.vote_average && movie.vote_average >= 8.0) {
      const topTag = matchingTags[0]
      return `Świetny przykład kina ${topTag.tag.toLowerCase()} ${decadeContext} z wysoką oceną widzów – aż ${movie.vote_average}/10${popularityContext}.`
    }
    
    if (matchingTags.length > 0) {
      const topTag = matchingTags[0]
      return `Ten film to dobry przykład kina ${topTag.tag.toLowerCase()} ${decadeContext}${popularityContext}.`
    }
  }
  
  // General fallback with popularity and decade context
  if (movie.vote_average && movie.vote_average >= 8.0) {
    return `Ten ${movie.is_best_picture_winner ? 'nagrodzony Oscarem' : 'nominowany do Oscara'} film ${decadeContext} ma wysoką ocenę ${movie.vote_average}/10${popularityContext}.`
  }
  
  return `Ten ${movie.is_best_picture_winner ? 'nagrodzony Oscarem' : 'nominowany do Oscara'} film ${decadeContext} doskonale pasuje do Twoich preferencji${popularityContext}.`
}

// Helper function to create user choices context for AI (UPDATED: includes popularity)
function createUserChoicesContext(preferences: any): string {
  const context = []
  
  // Mood choice
  if (preferences.mood) {
    const moodMapping: { [key: string]: string } = {
      'inspiration': 'inspiracji',
      'adrenaline': 'adrenaliny',
      'emotions': 'głębokich emocji',
      'humor': 'humoru',
      'ambitious': 'intelektualnego wyzwania',
      'romance': 'romantycznego nastroju'
    }
    const moodDesc = moodMapping[preferences.mood] || preferences.mood
    context.push(`- Nastrój: szuka ${moodDesc}`)
  }
  
  // Genre choices
  if (preferences.genres && preferences.genres.length > 0) {
    if (preferences.genres.includes('surprise')) {
      context.push(`- Gatunki: "Zaskocz mnie" - brak preferencji gatunkowych`)
    } else {
      context.push(`- Gatunki: ${preferences.genres.join(', ')} (wybrane przez użytkownika)`)
    }
  }
  
  // Decade preference
  if (preferences.decade) {
    const decadeMapping: { [key: string]: string } = {
      '2000s': 'lata 2000-2009',
      '2010s': 'lata 2010-2019',
      'both': 'obie dekady (2000-2019)'
    }
    const decadeDesc = decadeMapping[preferences.decade] || preferences.decade
    context.push(`- Dekada: wybiera filmy z ${decadeDesc}`)
  }
  
  // NEW: Popularity preference
  if (preferences.popularity) {
    const popularityMapping: { [key: string]: string } = {
      'blockbuster': 'bardzo znane filmy (najpopularniejsze)',
      'classic': 'popularne klasyki (średnia popularność)',
      'hidden-gem': 'mniej znane perełki (niszowe)',
      'any': 'dowolna popularność'
    }
    const popularityDesc = popularityMapping[preferences.popularity] || preferences.popularity
    context.push(`- Popularność: preferuje ${popularityDesc}`)
  }
  
  // Time preference
  if (preferences.time) {
    const timeMapping: { [key: string]: string } = {
      'short': 'szybką sesję (60-90 minut)',
      'normal': 'standardowy seans (90-150 minut)',
      'long': 'długi wieczór (150+ minut)',
      'any': 'dowolny czas'
    }
    const timeDesc = timeMapping[preferences.time] || preferences.time
    context.push(`- Czas: ma ochotę na ${timeDesc}`)
  }
  
  return context.join('\n')
}

// Helper function to create movie context for AI (updated with popularity info)
function createMovieContext(movie: Movie): string {
  const context = []
  
  context.push(`- Tytuł: ${movie.title} (${movie.year})`)
  
  if (movie.thematic_tags && movie.thematic_tags.length > 0) {
    const genres = movie.thematic_tags
      .sort((a, b) => (b.importance || 0) - (a.importance || 0))
      .map(t => `${t.tag} (ważność: ${t.importance})`)
    context.push(`- Gatunki: ${genres.join(', ')}`)
  }
  
  if (movie.mood_tags && movie.mood_tags.length > 0) {
    context.push(`- Nastrój: ${movie.mood_tags.join(', ')}`)
  }
  
  if (movie.runtime) {
    const hours = Math.floor(movie.runtime / 60)
    const minutes = movie.runtime % 60
    context.push(`- Czas trwania: ${hours} godzin i ${minutes} minut`)
  }
  
  if (movie.vote_average) {
    context.push(`- Ocena TMDB: ${movie.vote_average}/10`)
  }
  
  // NEW: Include popularity context based on vote count
  if (movie.vote_count) {
    let popularityLevel = 'średnia';
    if (movie.vote_count > 100000) popularityLevel = 'bardzo wysoka';
    else if (movie.vote_count < 20000) popularityLevel = 'niska';
    
    context.push(`- Popularność: ${popularityLevel} (${movie.vote_count.toLocaleString()} głosów)`)
  }
  
  // Include decade context
  if (movie.oscar_year) {
    const decade = movie.oscar_year >= 2001 && movie.oscar_year <= 2010 ? '2000s' : 
                   movie.oscar_year >= 2011 && movie.oscar_year <= 2020 ? '2010s' : 'unknown';
    context.push(`- Dekada: ${decade} (ceremonia ${movie.oscar_year})`)
  }
  
  context.push(`- Status Oscar: ${movie.is_best_picture_winner ? 'Zwycięzca' : 'Nominowany'} (${movie.oscar_year})`)
  
  return context.join('\n')
}

async function generateExpectationText(movie: any): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey || openaiApiKey.trim() === '') {
    console.error('❌ Missing OpenAI API key for generating expectation text')
    // Return a fallback expectation text
    return `Ten ${movie.is_best_picture_winner ? 'nagrodzony Oscarem' : 'nominowany do Oscara'} film z ${movie.year} roku oferuje niezapomniane doświadczenie kinowe pełne emocji i mistrzowskiego rzemiosła filmowego.`
  }

  try {
    const prompt = `Jesteś ekspertem od filmów, który pomaga widzom zrozumieć czego mogą się spodziewać po filmie. Napisz krótki opis (maksymalnie 2-3 zdania) tego, czego widz może się spodziewać po obejrzeniu filmu "${movie.title}" (${movie.year}).

Informacje o filmie:
- Tytuł: ${movie.title}
- Rok: ${movie.year}
- Gatunki: ${movie.thematic_tags?.map(t => t.tag).join(', ') || 'Nieznane'}
- Opis: ${movie.overview || 'Brak opisu'}
- Status Oscar: ${movie.is_best_picture_winner ? 'Zwycięzca' : 'Nominowany'} w kategorii Najlepszy Film (${movie.oscar_year})
- Ocena: ${movie.vote_average}/10

WAŻNE ZASADY:
- NIE ujawniaj spoilerów ani szczegółów fabuły
- Skup się na rodzaju emocji i doświadczenia, które film oferuje
- Opisz klimat i nastrój filmu w lekki, zachęcający sposób
- Użyj słów opisujących uczucia: "poruszający", "ekscytujący", "zabawny", "refleksyjny", "napięty" itp.
- Napisz w sposób naturalny, jakbyś polecał film przyjacielowi

Przykład dobrej odpowiedzi: "To poruszająca opowieść o ludzkich relacjach, która łączy romantyczne momenty z głębokimi emocjami i pozostawi Cię z uśmiechem na twarzy. Spodziewaj się pięknych obrazów i niezapomnianych dialogów, które długo pozostaną w pamięci."

Napisz podobny opis dla "${movie.title}":
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Keep 3.5 for Quick Shot for speed
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API error')
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || `Ten ${movie.is_best_picture_winner ? 'nagrodzony Oscarem' : 'nominowany do Oscara'} film oferuje niezapomniane doświadczenie kinowe pełne emocji.`

  } catch (error) {
    console.error(`❌ Error generating expectation text for "${movie.title}":`, error)
    if (error.message && error.message.includes('API key')) {
      console.error('🔑 This appears to be an OpenAI API key issue. Check your OPENAI_API_KEY in Supabase Secrets.')
    }
    return `Ten ${movie.is_best_picture_winner ? 'nagrodzony Oscarem' : 'nominowany do Oscara'} film z ${movie.year} roku oferuje niezapomniane doświadczenie kinowe pełne emocji i mistrzowskiego rzemiosła filmowego.`
  }
}

async function generateExplanation(movie: any, userPreferences?: any): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    return `AI wybrało "${movie.title}" na podstawie jego statusu jako ${movie.is_best_picture_winner ? 'zwycięzcy' : 'nominowanego'} Oscara oraz wysokiej oceny ${movie.vote_average}/10. Ten film z ${movie.year} roku doskonale pasuje do Twoich preferencji filmowych.`
  }

  try {
    const prompt = `Wytłumacz dlaczego AI wybrało film "${movie.title}" dla użytkownika. Napisz w stylu analizy AI - konkretnie i rzeczowo.

    Informacje o filmie:
    - Tytuł: ${movie.title}
    - Rok: ${movie.year}
    - Gatunki: ${movie.thematic_tags?.map(t => t.tag).join(', ') || 'Nieznane'}
    - Status Oscar: ${movie.is_best_picture_winner ? 'Zwycięzca' : 'Nominowany'} (${movie.oscar_year})
    - Ocena: ${movie.vote_average}/10
    - Długość: ${movie.runtime} min
    
    Napisz 4-5 konkretnych punktów dlaczego AI wybrało ten film, używając formatu:
    "✓ [Czynnik] - [wyjaśnienie]"
    
    Skup się na: gatunku, długości, ocenach, dostępności, statusie oscarowym.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Keep 3.5 for explanations for speed
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.5
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API error')
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || `AI wybrało "${movie.title}" na podstawie jego wysokiej oceny i statusu oscarowego.`

  } catch (error) {
    console.error('Error generating explanation:', error)
    return `AI wybrało "${movie.title}" na podstawie jego statusu jako ${movie.is_best_picture_winner ? 'zwycięzcy' : 'nominowanego'} Oscara oraz wysokiej oceny ${movie.vote_average}/10.`
  }
}

async function generateBrief(movie: any): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey || openaiApiKey.trim() === '') {
    console.error('❌ Missing OpenAI API key for generating brief')
    return `"${movie.title}" (${movie.year}) - ${movie.overview || 'Klasyczny film oscarowy, który warto obejrzeć.'}`
  }

  try {
    const prompt = `Napisz 5-minutowy brief przed obejrzeniem filmu "${movie.title}" (${movie.year}). Brief ma przygotować widza do seansu, ale BEZ SPOILERÓW!

Informacje o filmie:
- Tytuł: ${movie.title}
- Oryginalny tytuł: ${movie.original_title || movie.title}
- Rok: ${movie.year}
- Gatunki: ${movie.thematic_tags?.map(t => t.tag).join(', ') || 'Drama'}
- Podstawowy opis: ${movie.overview || 'Brak opisu'}
- Status Oscar: ${movie.is_best_picture_winner ? 'Zwycięzca Najlepszy Film' : 'Nominowany Najlepszy Film'} (ceremonii ${movie.oscar_year})
- Ocena: ${movie.vote_average || 'N/A'}/10
- Czas trwania: ${movie.runtime || 'ok. 120'} minut

STRUKTURA BRIEFU (każda sekcja 2-3 zdania):

🎬 **CO CZYNI TEN FILM WYJĄTKOWYM**
- Dlaczego ten film wyróżnia się spośród innych
- Jakie elementy sprawiły, że został doceniony przez Akademię
- Unikalne cechy produkcji

🎭 **WIZJA REŻYSERA** 
- Styl reżyserski i podejście do tematu
- Charakterystyczne elementy wizualne lub narracyjne
- Jak reżyser podchodzi do gatunku

👥 **KLUCZOWE ROLE**
- Główni aktorzy i ich role (BEZ spoilerów fabularnych)
- Znaczące występy, które warto docenić
- Chemię między postaciami (ogólnie)

📚 **KONTEKST HISTORYCZNY**
- Tło czasowe akcji filmu lub jego produkcji
- Ważne wydarzenia historyczne/społeczne związane z filmem
- Dlaczego film był istotny w momencie premiery

💭 **PUNKTY DYSKUSJI**
- Tematy, które film porusza (bez spoilerów)
- Na co zwrócić uwagę podczas oglądania
- Dlaczego film pozostaje aktualny

WAŻNE ZASADY:
- NIE ujawniaj żadnych szczegółów fabularnych, zwrotów akcji czy zakończeń
- Opieraj się TYLKO na faktach, nie wymyślaj informacji
- Jeśli nie masz pewnych informacji, napisz "szczegóły produkcji nie są dostępne"
- Pisz entuzjastycznie ale rzeczowo
- Maksymalnie 300 słów
- Każda sekcja powinna mieć wyraźny nagłówek

Rozpocznij od: "🎬 **CO CZYNI TEN FILM WYJĄTKOWYM**"`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Keep GPT-4 for detailed briefs since they're generated once and cached
        messages: [
          {
            role: 'system',
            content: 'Jesteś ekspertem od filmów, który tworzy briefy filmowe bez spoilerów. Zawsze opierasz się tylko na faktach i nie wymyślasz informacji.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API error')
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || `"${movie.title}" to klasyczny film oscarowy z ${movie.year} roku, który warto obejrzeć.`

  } catch (error) {
    console.error(`❌ Error generating brief for "${movie.title}":`, error)
    if (error.message && error.message.includes('API key')) {
      console.error('🔑 This appears to be an OpenAI API key issue. Check your OPENAI_API_KEY in Supabase Secrets.')
    }
    return `"${movie.title}" (${movie.year}) - ${movie.overview || 'Klasyczny film oscarowy, który warto obejrzeć.'}`
  }
}

// NEW: Generate AI insight for progress tracking
async function generateProgressInsight(
  categoryType: 'decade' | 'year',
  categoryIdentifier: string,
  watchedCount: number,
  totalCount: number,
  toWatchMovies: Array<{
    title: string
    thematic_tags?: Array<{tag: string, importance: number}>
    mood_tags?: string[]
    vote_average?: number
  }>
): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    return generateProgressInsightFallback(categoryType, categoryIdentifier, watchedCount, totalCount, toWatchMovies)
  }

  try {
    const categoryName = categoryType === 'decade' ? 
      (categoryIdentifier === '2000s' ? 'lata 2000-2009' : 
       categoryIdentifier === '2010s' ? 'lata 2010-2019' : categoryIdentifier) :
      `rok ${categoryIdentifier}`
    
    const remainingCount = totalCount - watchedCount
    const progressPercentage = totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0
    
    // Analyze remaining movies for recommendations
    const movieAnalysis = toWatchMovies.slice(0, 5).map(movie => {
      const genres = movie.thematic_tags?.map(t => t.tag).join(', ') || 'Dramat'
      const moods = movie.mood_tags?.join(', ') || 'Inspiracja'
      const rating = movie.vote_average ? `${movie.vote_average}/10` : 'brak oceny'
      return `"${movie.title}" (${genres}, nastrój: ${moods}, ocena: ${rating})`
    }).join('\n')

    const prompt = `Jesteś ekspertem od filmów oscarowych, który motywuje użytkowników do kontynuowania ich kinowej podróży. Napisz krótki, zachęcający insight (2-3 zdania) dla użytkownika na podstawie jego postępu.

POSTĘP UŻYTKOWNIKA:
- Kategoria: ${categoryName}
- Obejrzane filmy: ${watchedCount} z ${totalCount} (${progressPercentage}%)
- Pozostało do obejrzenia: ${remainingCount} filmów

FILMY DO OBEJRZENIA (próbka):
${movieAnalysis || 'Brak szczegółów o filmach'}

ZADANIE: Napisz motywujący insight (2-3 zdania) który:
1. Docenia dotychczasowy postęp użytkownika
2. Zachęca do kontynuowania
3. Jeśli są filmy do obejrzenia, zasugeruj 1-2 konkretne tytuły z krótkimi uzasadnieniami (np. "dla lekkiej rozrywki" lub "dla mocnych emocji")
4. Używa naturalnego, przyjaznego tonu

PRZYKŁAD DOBREJ ODPOWIEDZI:
"Świetnie! Masz już za sobą 65% filmów z lat 2010-2019 - to imponujący postęp! Zostały Ci jeszcze 4 filmy do zakończenia tej dekady. Jeśli masz ochotę na coś lekkiego, polecam 'La La Land', ale jeśli wolisz mocne emocje, 'Moonlight' będzie idealny."

Napisz insight dla tego użytkownika:`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Jesteś ekspertem od filmów oscarowych, który tworzy motywujące, krótkie insights dla użytkowników śledzących swój postęp w oglądaniu filmów. Zawsze jesteś pozytywny i zachęcający.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API error')
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || generateProgressInsightFallback(categoryType, categoryIdentifier, watchedCount, totalCount, toWatchMovies)

  } catch (error) {
    console.error('Error generating progress insight:', error)
    return generateProgressInsightFallback(categoryType, categoryIdentifier, watchedCount, totalCount, toWatchMovies)
  }
}

// Fallback insight generation when AI is not available
function generateProgressInsightFallback(
  categoryType: 'decade' | 'year',
  categoryIdentifier: string,
  watchedCount: number,
  totalCount: number,
  toWatchMovies: Array<{title: string}>
): string {
  const categoryName = categoryType === 'decade' ? 
    (categoryIdentifier === '2000s' ? 'lata 2000-2009' : 
     categoryIdentifier === '2010s' ? 'lata 2010-2019' : categoryIdentifier) :
    `rok ${categoryIdentifier}`
  
  const remainingCount = totalCount - watchedCount
  const progressPercentage = totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0
  
  if (remainingCount === 0) {
    return `Gratulacje! Ukończyłeś wszystkie filmy z kategorii ${categoryName}. To wspaniałe osiągnięcie w Twojej oscarowej podróży!`
  }
  
  if (progressPercentage >= 75) {
    const suggestion = toWatchMovies[0]?.title || 'pozostałe filmy'
    return `Świetnie! Masz już ${progressPercentage}% filmów z kategorii ${categoryName} za sobą. Zostało tylko ${remainingCount} filmów do ukończenia. Polecam zacząć od "${suggestion}".`
  }
  
  if (progressPercentage >= 50) {
    return `Dobra robota! Jesteś w połowie drogi przez ${categoryName} (${progressPercentage}%). Kontynuuj swoją podróż - zostało ${remainingCount} filmów do obejrzenia.`
  }
  
  return `Rozpocząłeś swoją podróż przez ${categoryName} (${progressPercentage}% ukończone). Przed Tobą ${remainingCount} wspaniałych filmów oscarowych do odkrycia!`
}