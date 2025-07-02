import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, BookOpen, Check, ExternalLink, X } from 'lucide-react';
import { getRandomOscarMovie, getMovieRecommendation, getOscarNominees, addMovieToWatchlist, markMovieAsWatched, Movie } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import OptimizedImage from './OptimizedImage';
import { formatThematicTags } from '../lib/utils';

interface QuickShotScreenProps {
  onBack: () => void;
  isAuthenticated: boolean;
  onAuthPrompt: (featureName: string) => void;
  onGoToJourney: () => void;
}

type LoadingStep = 'initial' | 'searching' | 'ready' | 'result' | 'explanation' | 'generatingBrief' | 'brief';

const QuickShotScreen: React.FC<QuickShotScreenProps> = ({ onBack, isAuthenticated, onAuthPrompt, onGoToJourney }) => {
  const [currentStep, setCurrentStep] = useState<LoadingStep>('initial');
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [recommendationText, setRecommendationText] = useState<string>('');
  const [briefText, setBriefText] = useState<string>('');
  const [otherNominees, setOtherNominees] = useState<Movie[]>([]);
  const [actionFeedback, setActionFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const loadingSequence = [
    { step: 'initial', text: '30 sekund do odkrycia klasyki', duration: 1000 },
    { step: 'searching', text: 'Szukamy idealnego filmu...', duration: 2000 },
    { step: 'ready', text: 'Gotowe!', duration: 800 }
  ];

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const runSequence = async () => {
      for (const item of loadingSequence) {
        setCurrentStep(item.step as LoadingStep);
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, item.duration);
        });
      }
      
      // Fetch real movie data
      await fetchMovieData();
      setCurrentStep('result');
    };

    runSequence();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Clear feedback after 3 seconds
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => {
        setActionFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  const fetchMovieData = async () => {
    try {
      // Get random Oscar movie
      const movie = await getRandomOscarMovie();
      if (!movie) {
        console.error('No movie found');
        return;
      }
      
      // 🔍 DEBUG: Log the movie that was fetched
      console.log('🎬 QuickShot: Fetched movie:', {
        id: movie.id,
        title: movie.title,
        oscar_year: movie.oscar_year,
        tmdb_id: movie.tmdb_id
      });
      
      setCurrentMovie(movie);
      
      // Get AI recommendation for this specific movie
      const recommendation = await getMovieRecommendation('quick-shot', movie.id);
      if (recommendation) {
        setRecommendationText(recommendation.recommendation || '');
      }
      
      // Get other nominees from the same year
      if (movie.oscar_year) {
        const nominees = await getOscarNominees(movie.oscar_year);
        const filteredNominees = nominees.filter(nominee => nominee.id !== movie.id);
        setOtherNominees(filteredNominees);
      }
      
    } catch (error) {
      console.error('Error fetching movie data:', error);
    }
  };

  const handleShuffle = () => {
    setCurrentStep('initial');
    setShowExplanation(false);
    setCurrentMovie(null);
    setRecommendationText('');
    setBriefText('');
    setOtherNominees([]);
    setActionFeedback(null);
    
    const runSequence = async () => {
      for (const item of loadingSequence) {
        setCurrentStep(item.step as LoadingStep);
        await new Promise(resolve => setTimeout(resolve, item.duration));
      }
      await fetchMovieData();
      setCurrentStep('result');
    };

    runSequence();
  };

  const handleBriefClick = async () => {
    if (!currentMovie) return;
    
    // Set loading state immediately for visual feedback
    setCurrentStep('generatingBrief');
    
    try {
      const response = await getMovieRecommendation('brief', currentMovie.id);
      if (response && response.brief) {
        setBriefText(response.brief);
        setCurrentStep('brief');
      } else {
        // If failed, go back to result view
        setCurrentStep('result');
      }
    } catch (error) {
      console.error('Error fetching brief:', error);
      // If failed, go back to result view
      setCurrentStep('result');
    }
  };

  const handleAddToList = async () => {
    if (!isAuthenticated) {
      onAuthPrompt('list filmowych');
      return;
    }

    if (!currentMovie) return;

    // 🔍 DEBUG: Log the movie being added to list
    console.log('📝 QuickShot: Adding movie to list:', {
      id: currentMovie.id,
      title: currentMovie.title,
      oscar_year: currentMovie.oscar_year,
      tmdb_id: currentMovie.tmdb_id
    });

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ QuickShot: User not authenticated');
        setActionFeedback({ type: 'error', message: 'Nie jesteś zalogowany' });
        return;
      }

      // Add movie to watchlist
      const success = await addMovieToWatchlist(user.id, currentMovie.id);
      if (success) {
        console.log('✅ QuickShot: Successfully added movie to watchlist');
        setActionFeedback({ type: 'success', message: `"${currentMovie.title}" dodano do listy "Do obejrzenia"!` });
      } else {
        console.error('❌ QuickShot: Failed to add movie to watchlist');
        setActionFeedback({ type: 'error', message: 'Nie udało się dodać filmu do listy "Do obejrzenia"' });
      }
    } catch (error) {
      console.error('Error adding to list:', error);
      console.error('❌ QuickShot: Exception in handleAddToList:', error);
      setActionFeedback({ type: 'error', message: 'Wystąpił błąd podczas dodawania do listy' });
    }
  };

  const handleWatched = async () => {
    if (!isAuthenticated) {
      onAuthPrompt('oznaczania filmów jako obejrzane');
      return;
    }

    if (!currentMovie) return;

    // 🔍 DEBUG: Log the movie being marked as watched
    console.log('✅ QuickShot: Marking movie as watched:', {
      id: currentMovie.id,
      title: currentMovie.title,
      oscar_year: currentMovie.oscar_year
    });

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActionFeedback({ type: 'error', message: 'Nie jesteś zalogowany' });
        return;
      }

      // Mark movie as watched
      const success = await markMovieAsWatched(user.id, currentMovie.id);
      if (success) {
        console.log('✅ QuickShot: Successfully marked movie as watched');
        setActionFeedback({ type: 'success', message: `"${currentMovie.title}" oznaczono jako obejrzany!` });
      } else {
        console.error('❌ QuickShot: Failed to mark movie as watched');
        setActionFeedback({ type: 'error', message: 'Nie udało się oznaczyć filmu jako obejrzany' });
      }
    } catch (error) {
      console.error('Error marking as watched:', error);
      console.error('❌ QuickShot: Exception in handleWatched:', error);
      setActionFeedback({ type: 'error', message: 'Wystąpił błąd podczas oznaczania filmu' });
    }
  };

  const formatPosterUrl = (posterPath: string | null | undefined) => {
    if (!posterPath) return '/jpiDCxkCbo0.movieposter_maxres.jpg'; // fallback
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  return (
    <div className="min-h-screen bg-[#070000] flex flex-col">
      {/* Back Button */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1c1e] text-white rounded-lg border border-neutral-700 hover:bg-neutral-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Powrót</span>
        </button>
      </div>

      {/* Action Feedback */}
      {actionFeedback && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          actionFeedback.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{actionFeedback.message}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-0 px-0 md:py-20 md:px-6">
        <div className="w-full md:max-w-4xl mx-auto">
          
          {/* Initial Loading Sequence */}
          {(currentStep === 'initial' || currentStep === 'searching' || currentStep === 'ready') && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-8">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-8 border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  {currentStep === 'initial' && '30 sekund do odkrycia klasyki'}
                  {currentStep === 'searching' && 'Szukamy idealnego filmu...'}
                  {currentStep === 'ready' && 'Gotowe!'}
                </h2>
              </div>
            </div>
          )}

          {/* Brief Loading State */}
          {currentStep === 'generatingBrief' && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-8">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-8 border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    Przygotowujemy Twój 5-minutowy brief...
                  </h2>
                  <p className="text-neutral-400 text-lg">
                    Analizujemy film i tworzymy spersonalizowany przewodnik
                  </p>
                </div>

                {/* Movie info during loading */}
                {currentMovie && (
                  <div 
                    className="mt-8 p-4 md:rounded-lg md:border md:border-neutral-700 max-w-md mx-auto"
                    style={{
                      background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <OptimizedImage 
                        src={formatPosterUrl(currentMovie.poster_path)}
                        alt={`${currentMovie.title} Poster`}
                        className="w-12 h-16 object-cover rounded"
                        priority={true}
                      />
                      <div className="text-left">
                        <h3 className="text-white font-semibold text-sm">{currentMovie.title}</h3>
                        <p className="text-neutral-400 text-xs">
                          {currentMovie.oscar_year} • {currentMovie.is_best_picture_winner ? 'Zwycięzca' : 'Nominowany'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Movie Result */}
          {currentStep === 'result' && !showExplanation && (
            currentMovie && (
            <div 
              className="p-8 md:p-12 md:rounded-2xl md:border md:border-neutral-700"
              style={{
                background: '#0a0a0a',
              }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-[#DFBD69] mb-2">
                  TWÓJ OSCAR WINNER
                </h2>
              </div>

              {/* Main Movie Section */}
              <div className="grid lg:grid-cols-5 gap-8 mb-8">
                {/* Movie Poster */}
                <div className="lg:col-span-2">
                  <OptimizedImage 
                    src={formatPosterUrl(currentMovie.poster_path)}
                    alt={`${currentMovie.title} Poster`}
                    className="w-full h-full object-cover rounded-lg"
                    priority={true}
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>

                {/* Movie Info */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Movie Title and Details */}
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{currentMovie.title.toUpperCase()}</h1>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-neutral-300 mb-4">
                      <span className="flex items-center gap-1">
                        🏆 <strong className="text-[#DFBD69]">Oscary:</strong> 
                        {currentMovie.is_best_picture_winner ? ' Zwycięzca' : ' Nominowany'} 
                        ({currentMovie.oscar_year})
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-neutral-300 mb-4">
                      <span>⏰ <strong>Czas:</strong> {currentMovie.runtime ? `${Math.floor(currentMovie.runtime / 60)}h ${currentMovie.runtime % 60}min` : 'Nieznany'}</span>
                      <span>🎭 <strong>Gatunek:</strong> {formatThematicTags(currentMovie.thematic_tags)}</span>
                      <span>⭐ <strong>Ocena:</strong> {currentMovie.vote_average ?`${currentMovie.vote_average}/10` : 'N/A'}</span>
                    </div>

                    {/* Expectation Section */}
                    <div className="p-4 rounded-lg mb-4" style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(223, 189, 105, 0.15) 100%)',
                    }}>
                      <div className="mb-3">
                        <span className="text-white font-semibold">Czego możesz się spodziewać:</span>
                      </div>
                      <p className="text-neutral-300 text-sm leading-relaxed">
                        {recommendationText || `"${currentMovie.title}" to klasyczny film oscarowy, który oferuje niezapomniane doświadczenie kinowe pełne emocji i mistrzowskiego rzemiosła filmowego.`}
                      </p>
                    </div>

                    {/* Streaming Availability and Brief Button */}
                    <div className="mb-4">
                      <h3 className="text-white font-semibold mb-3">📺 Gdzie obejrzeć:</h3>
                      <p className="text-neutral-400 text-sm mb-4">Funkcja dostępna wkrótce</p>
                      
                      {/* 5-Minute Brief Button - Full width on mobile, golden gradient */}
                      <button 
                        onClick={handleBriefClick}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all hover:scale-105 transform duration-200 bg-gradient-to-r from-[#DFBD69]/20 to-transparent border border-[#DFBD69]/30 text-[#DFBD69] hover:from-[#DFBD69]/30 hover:to-transparent"
                      >
                        <BookOpen className="w-5 h-5" />
                        5-min Brief
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nominees and Buttons Section */}
              <div className="grid lg:grid-cols-3 gap-8 mb-8">
                {/* Other Nominees Section - Left Side */}
                <div className="lg:col-span-2">
                  {otherNominees.length > 0 && (
                    <div>
                      <h3 className="text-white font-semibold mb-4 text-sm">
                        🏆 Pozostali nominowani {currentMovie.oscar_year}:
                      </h3>
                      <div className={`max-h-96 overflow-y-auto ${
                        otherNominees.length > 5 
                          ? 'grid grid-cols-2 gap-3' 
                          : 'space-y-3'
                      }`}>
                        {otherNominees.map((nominee) => (
                          <div 
                            key={nominee.id}
                            className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
                              nominee.is_best_picture_winner 
                                ? 'bg-[#DFBD69]/10' 
                                : 'bg-neutral-800/50'
                            }`}
                          >
                            <OptimizedImage 
                              src={formatPosterUrl(nominee.poster_path)}
                              alt={`${nominee.title} Poster`}
                              className="w-6 h-9 object-cover rounded flex-shrink-0"
                              sizes="24px"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium leading-tight mb-1 ${
                                nominee.is_best_picture_winner ? 'text-[#DFBD69]' : 'text-white'
                              }`}>
                                {nominee.title}
                                {nominee.is_best_picture_winner && ' 🏆'}
                              </p>
                              <p className="text-neutral-400 text-xs truncate">
                                {nominee.year}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Main Buttons - Right Side, Stacked Vertically */}
                <div className="lg:col-span-1 space-y-4">
                  <button 
                    onClick={handleAddToList}
                    className="w-full bg-neutral-700 text-white font-semibold py-4 px-6 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <img src="/ulubione.png" alt="Dodaj do listy" className="w-5 h-5" />
                    Do obejrzenia
                  </button>
                  <button 
                    onClick={handleWatched}
                    className="w-full bg-neutral-700 text-white font-semibold py-4 px-6 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Obejrzałem
                  </button>
                  <button 
                    onClick={handleShuffle}
                    className="w-full bg-neutral-700 text-white font-semibold py-4 px-6 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <img src="/losowanie.png" alt="Losuj ponownie" className="w-5 h-5" />
                    Losuj ponownie
                  </button>
                </div>
              </div>
            </div>
            )
          )}

          {/* Brief View */}
          {currentStep === 'brief' && (
            <div 
              className="p-8 md:p-12 md:rounded-2xl md:border md:border-neutral-700"
              style={{
                background: '#0a0a0a',
              }}
            >
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => setCurrentStep('result')}
                  className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  ← Powrót do rezultatu
                </button>
                <button
                  onClick={() => setCurrentStep('result')}
                  className="p-2 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  📖 5-MINUTOWY BRIEF: "{currentMovie?.title?.toUpperCase()}"
                </h2>
                <p className="text-neutral-400">Przygotuj się do seansu • Bez spoilerów</p>
              </div>

              <div className="max-w-4xl mx-auto">
                {briefText ? (
                  <div className="space-y-6">
                    {parseBriefSections(briefText).map((section, index) => (
                      <div 
                        key={index}
                        className="p-6 rounded-lg border border-neutral-700"
                        style={{
                          background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                        }}
                      >
                        {section.title && (
                          <h3 className="text-[#DFBD69] font-bold text-lg mb-4 flex items-center gap-2">
                            {section.title}
                          </h3>
                        )}
                        <div className="text-neutral-200 leading-relaxed space-y-4">
                          {section.content.split('\n\n').filter(paragraph => paragraph.trim()).map((paragraph, pIndex) => (
                            <p 
                              key={pIndex}
                              className="text-neutral-200"
                              style={{ 
                                fontSize: '15px',
                                lineHeight: '1.6'
                              }}
                            >
                              {paragraph.trim()}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-4 border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
                      <p className="text-neutral-400">Ładowanie briefu...</p>
                    </div>
                  </div>
                )}

                <div className="text-center mt-8">
                  <button 
                    onClick={() => setCurrentStep('result')}
                    className="bg-[#DFBD69] text-black font-semibold py-3 px-8 rounded-lg hover:bg-[#E8C573] transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <Play className="w-5 h-5" />
                    Gotowy do oglądania
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Explanation View */}
        </div>
      </div>
    </div>
  );
};

// Helper function to parse brief text into sections
const parseBriefSections = (briefText: string) => {
  if (!briefText) return [];
  
  // Split by lines and process
  const lines = briefText.split('\n');
  const sections = [];
  let currentSection = { title: '', content: '' };
  
  for (const line of lines) {
    // Check if line is a header (starts with emoji and has ** around text)
    const headerMatch = line.match(/^(.+?)\s*\*\*(.+?)\*\*/);
    
    if (headerMatch) {
      // Save previous section if it has content
      if (currentSection.title || currentSection.content.trim()) {
        sections.push({
          title: currentSection.title,
          content: currentSection.content.trim()
        });
      }
      
      // Start new section
      currentSection = {
        title: headerMatch[2], // Only use the text part, skip the emoji
        content: ''
      };
    } else if (line.trim()) {
      // Add content to current section
      if (currentSection.content) {
        currentSection.content += '\n';
      }
      currentSection.content += line;
    }
  }
  
  // Add the last section
  if (currentSection.title || currentSection.content.trim()) {
    sections.push({
      title: currentSection.title,
      content: currentSection.content.trim()
    });
  }
  
  // If no sections were found (no headers), return the entire text as one section
  if (sections.length === 0) {
    sections.push({
      title: '',
      content: briefText.trim()
    });
  }
  
  return sections;
};

export default QuickShotScreen;