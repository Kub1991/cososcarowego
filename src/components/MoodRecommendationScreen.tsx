import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, BookOpen, Check, X } from 'lucide-react';
import { getMoviesByMood, getMovieRecommendation, addMovieToWatchlist, markMovieAsWatched, Movie } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import OptimizedImage from './OptimizedImage';

interface MoodRecommendationScreenProps {
  selectedMood: string;
  onBack: () => void;
  isAuthenticated: boolean;
  onAuthPrompt: (featureName: string) => void;
  onGoToJourney: () => void;
}

type ViewMode = 'results' | 'brief';

const MoodRecommendationScreen: React.FC<MoodRecommendationScreenProps> = ({ 
  selectedMood, 
  onBack, 
  isAuthenticated, 
  onAuthPrompt, 
  onGoToJourney 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('results');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovieForBrief, setSelectedMovieForBrief] = useState<Movie | null>(null);
  const [briefText, setBriefText] = useState<string>('');
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    if (selectedMood) {
      fetchMoviesForMood();
    }
  }, [selectedMood]);

  // Clear feedback after 3 seconds
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => {
        setActionFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  const fetchMoviesForMood = async () => {
    setIsLoading(true);
    try {
      console.log(`🎭 MoodRecommendation: Fetching movies for mood "${selectedMood}"`);
      const fetchedMovies = await getMoviesByMood(selectedMood, 3);
      
      if (fetchedMovies.length === 0) {
        console.log(`❌ MoodRecommendation: No movies found for mood "${selectedMood}"`);
      } else {
        console.log(`✅ MoodRecommendation: Found ${fetchedMovies.length} movies for mood "${selectedMood}"`);
      }
      
      setMovies(fetchedMovies);
    } catch (error) {
      console.error('Error fetching movies for mood:', error);
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBriefClick = async (movie: Movie) => {
    setSelectedMovieForBrief(movie);
    setViewMode('brief');
    setIsGeneratingBrief(true);
    setBriefText('');
    
    try {
      const response = await getMovieRecommendation('brief', movie.id);
      if (response && response.brief) {
        setBriefText(response.brief);
      }
    } catch (error) {
      console.error('Error fetching brief:', error);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleAddToWatchlist = async (movieId: string, movieTitle: string) => {
    if (!isAuthenticated) {
      onAuthPrompt('list filmowych');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActionFeedback({ type: 'error', message: 'Nie jesteś zalogowany' });
        return;
      }

      const success = await addMovieToWatchlist(user.id, movieId);
      if (success) {
        setActionFeedback({ type: 'success', message: `"${movieTitle}" dodano do listy "Do obejrzenia"!` });
      } else {
        setActionFeedback({ type: 'error', message: 'Nie udało się dodać filmu do listy "Do obejrzenia"' });
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      setActionFeedback({ type: 'error', message: 'Wystąpił błąd podczas dodawania do listy' });
    }
  };

  const handleWatched = async (movieId: string, movieTitle: string) => {
    if (!isAuthenticated) {
      onAuthPrompt('oznaczania filmów jako obejrzane');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActionFeedback({ type: 'error', message: 'Nie jesteś zalogowany' });
        return;
      }

      const success = await markMovieAsWatched(user.id, movieId);
      if (success) {
        setActionFeedback({ type: 'success', message: `"${movieTitle}" oznaczono jako obejrzany!` });
      } else {
        setActionFeedback({ type: 'error', message: 'Nie udało się oznaczyć filmu jako obejrzany' });
      }
    } catch (error) {
      console.error('Error marking as watched:', error);
      setActionFeedback({ type: 'error', message: 'Wystąpił błąd podczas oznaczania filmu' });
    }
  };

  const handleMyJourney = () => {
    if (isAuthenticated) {
      onGoToJourney();
    } else {
      onAuthPrompt('śledzenia swojej Oscarowej podróży');
    }
  };

  const formatPosterUrl = (posterPath: string | null | undefined) => {
    if (!posterPath) return '/jpiDCxkCbo0.movieposter_maxres.jpg';
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  const formatRuntime = (runtime: number | null | undefined) => {
    if (!runtime) return 'Nieznany czas';
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return `${hours}h ${minutes}min`;
  };

  const formatOscarStatus = (movie: Movie) => {
    if (movie.is_best_picture_winner) {
      return `Zwycięzca Oscara ${movie.oscar_year}`;
    } else {
      return `Nominowany do Oscara ${movie.oscar_year}`;
    }
  };

  const getMoodDisplayName = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      'Inspiracja': 'inspiracji',
      'Adrenalina': 'adrenaliny',
      'Głębokie emocje': 'głębokich emocji',
      'Humor': 'humoru',
      'Coś ambitnego': 'intelektualnego wyzwania',
      'Romantyczny wieczór': 'romantycznego nastroju'
    };
    return moodMap[mood] || mood.toLowerCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070000] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
          <p className="text-white text-lg">Szukamy filmów pełnych {getMoodDisplayName(selectedMood)}...</p>
        </div>
      </div>
    );
  }

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
      <div className="flex-1 py-0 px-0 md:py-20 md:px-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Results View */}
          {viewMode === 'results' && (
            <>
              {/* Header */}
              <div className="text-center mb-16 px-6">
                <h1 className="text-4xl md:text-5xl font-bold text-[#DFBD69] mb-4">
                  Filmy pełne {getMoodDisplayName(selectedMood)}
                </h1>
                <p className="text-neutral-400 text-xl">
                  Trzy Oscarowe klasyki dopasowane do Twojego nastroju
                </p>
              </div>

              {movies.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div 
                    className="p-8 rounded-xl border border-neutral-700 max-w-2xl mx-auto"
                    style={{
                      background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                    }}
                  >
                    <h3 className="text-white font-semibold text-xl mb-4">
                      Brak filmów dla nastroju "{selectedMood}"
                    </h3>
                    <p className="text-neutral-400 mb-6">
                      Nie znaleźliśmy filmów oscarowych oznaczonych tym nastrojem. 
                      Spróbuj wybrać inny nastrój lub skorzystaj z innych opcji rekomendacji.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button 
                        onClick={onBack}
                        className="bg-[#DFBD69] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#E8C573] transition-colors"
                      >
                        Wybierz inny nastrój
                      </button>
                      <button 
                        onClick={handleMyJourney}
                        className="bg-neutral-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-neutral-600 transition-colors"
                      >
                        Moja podróż
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 px-6">
                  {movies.map((movie, index) => (
                    <div
                      key={movie.id}
                      className={`p-6 md:p-8 rounded-xl border ${
                        index === 0 
                          ? 'border-[#DFBD69] bg-gradient-to-r from-[#DFBD69]/20 to-transparent' 
                          : 'border-neutral-700 bg-[#1a1c1e]'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-6">
                        <span className="text-2xl md:text-3xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                        <div>
                          <h3 className="text-white font-bold text-lg md:text-xl">
                            {index === 0 ? 'GŁÓWNA REKOMENDACJA' : `ALTERNATYWA #${index}`}
                          </h3>
                          <p className="text-[#DFBD69] font-semibold text-sm md:text-base">
                            Idealny dla nastroju "{selectedMood}"
                          </p>
                        </div>
                      </div>

                      <div className="grid lg:grid-cols-5 gap-6 md:gap-8">
                        {/* Movie Poster */}
                        <div className="lg:col-span-2">
                          <OptimizedImage 
                            src={formatPosterUrl(movie.poster_path)}
                            alt={`${movie.title} Poster`}
                            className="w-full h-64 md:h-80 object-cover rounded-lg mx-auto"
                            priority={index === 0}
                            sizes="(max-width: 1024px) 100vw, 40vw"
                          />
                        </div>

                        {/* Movie Info */}
                        <div className="lg:col-span-3 space-y-4 md:space-y-6">
                          <div>
                            <h4 className="text-xl md:text-2xl font-bold text-white mb-3 leading-tight">
                              {movie.title} ({movie.year})
                            </h4>
                            
                            <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-neutral-300 mb-4">
                              <span className="whitespace-nowrap">{formatOscarStatus(movie)}</span>
                              <span className="whitespace-nowrap">{formatRuntime(movie.runtime)}</span>
                              {movie.vote_average && (
                                <span className="whitespace-nowrap">⭐ {movie.vote_average}/10</span>
                              )}
                            </div>
                          </div>

                          {/* Movie Description */}
                          {movie.overview && (
                            <div 
                              className="p-4 rounded-lg border border-neutral-700"
                              style={{
                                background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                              }}
                            >
                              <h5 className="text-[#DFBD69] font-semibold mb-2 text-sm md:text-base">
                                O filmie:
                              </h5>
                              <p className="text-neutral-200 text-xs md:text-sm leading-relaxed">
                                {movie.overview}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                              onClick={() => handleAddToWatchlist(movie.id, movie.title)}
                              className="flex-1 bg-neutral-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                            >
                              <img src="/ulubione.png" alt="Do obejrzenia" className="w-4 h-4" />
                              Do obejrzenia
                            </button>
                            
                            <button 
                              onClick={() => handleWatched(movie.id, movie.title)}
                              className="flex-1 bg-neutral-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                            >
                              <Check className="w-4 h-4" />
                              Obejrzałem
                            </button>
                            
                            <button 
                              onClick={() => handleBriefClick(movie)}
                              className="flex-1 bg-gradient-to-r from-[#DFBD69]/20 to-transparent border border-[#DFBD69]/30 text-[#DFBD69] font-semibold py-3 px-4 rounded-lg hover:from-[#DFBD69]/30 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                            >
                              <BookOpen className="w-4 h-4" />
                              5-MIN BRIEF
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Footer Buttons */}
                  <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 pt-8">
                    <button 
                      onClick={onBack}
                      className="bg-neutral-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2"
                    >
                      Wybierz inny nastrój
                    </button>
                    
                    <button 
                      onClick={handleMyJourney}
                      className="bg-neutral-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <img src="/moja-podroz.png" alt="Moja podróż" className="w-4 h-4" />
                      Moja Oscar podróż
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Brief View */}
          {viewMode === 'brief' && selectedMovieForBrief && (
            <div 
              className="p-8 md:p-12 md:rounded-2xl md:border md:border-neutral-700"
              style={{
                background: '#0a0a0a',
              }}
            >
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => setViewMode('results')}
                  className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  ← Powrót do rezultatów
                </button>
                <button
                  onClick={() => setViewMode('results')}
                  className="p-2 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  📖 5-MINUTOWY BRIEF: "{selectedMovieForBrief.title?.toUpperCase()}"
                </h2>
                <p className="text-neutral-400">Przygotuj się do seansu • Bez spoilerów</p>
              </div>

              {isGeneratingBrief ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="w-8 h-8 mx-auto border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
                    <p className="text-neutral-400">Przygotowujemy Twój brief...</p>
                  </div>
                </div>
              ) : (
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
                      onClick={() => setViewMode('results')}
                      className="bg-[#DFBD69] text-black font-semibold py-3 px-8 rounded-lg hover:bg-[#E8C573] transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                      <Play className="w-5 h-5" />
                      Gotowy do oglądania
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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

export default MoodRecommendationScreen;