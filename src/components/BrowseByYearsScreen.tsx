import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Play, BookOpen, Trophy, Check, ChevronDown, ChevronUp, X, TrendingUp } from 'lucide-react';
import { 
  getAvailableOscarYears, 
  getBestPictureWinner, 
  getAllNomineesForYear,
  getDecadeStats,
  getMovieRecommendation,
  addMovieToWatchlist,
  markMovieAsWatched,
  Movie,
  DecadeStats
} from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { formatThematicTags } from '../lib/utils';

interface BrowseByYearsScreenProps {
  onBack: () => void;
  isAuthenticated: boolean;
  onAuthPrompt: (featureName: string) => void;
  onGoToJourney: () => void;
}

type ViewMode = 'timeline' | 'brief';

const BrowseByYearsScreen: React.FC<BrowseByYearsScreenProps> = ({ onBack, isAuthenticated, onAuthPrompt, onGoToJourney }) => {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [allNominees, setAllNominees] = useState<Movie[]>([]);
  const [decadeStats, setDecadeStats] = useState<DecadeStats[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [isLoading, setIsLoading] = useState(false);
  const [briefText, setBriefText] = useState<string>('');
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // NEW: State for smooth nominees expansion
  const [showNominees, setShowNominees] = useState(false);
  
  const yearSliderRef = useRef<HTMLDivElement>(null);
  const nomineesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        const [years, decades] = await Promise.all([
          getAvailableOscarYears(),
          getDecadeStats()
        ]);
        
        setAvailableYears(years);
        setDecadeStats(decades);
        
        // Set initial year to the most recent one
        if (years.length > 0) {
          const mostRecentYear = years[years.length - 1];
          setSelectedYear(mostRecentYear);
          await loadMovieForYear(mostRecentYear);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
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

  const loadMovieForYear = async (year: number) => {
    try {
      const [winner, nominees] = await Promise.all([
        getBestPictureWinner(year),
        getAllNomineesForYear(year)
      ]);
      
      setCurrentMovie(winner);
      setAllNominees(nominees);
      setBriefText(''); // Clear brief when changing movies
      setShowNominees(false); // Hide nominees when changing year
      
      // Generate AI recommendation if not exists
      if (winner && !winner.ai_recommendation_text) {
        const recommendation = await getMovieRecommendation('quick-shot', winner.id);
        if (recommendation && recommendation.recommendation) {
          setCurrentMovie(prev => prev ? { ...prev, ai_recommendation_text: recommendation.recommendation } : null);
        }
      }
    } catch (error) {
      console.error('Error loading movie for year:', error);
    }
  };

  const handleYearChange = async (year: number) => {
    setSelectedYear(year);
    setViewMode('timeline');
    await loadMovieForYear(year);
    
    // Scroll selected year into view
    if (yearSliderRef.current) {
      const selectedButton = yearSliderRef.current.querySelector(`[data-year="${year}"]`) as HTMLElement;
      if (selectedButton) {
        selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  const handlePreviousYear = () => {
    if (!selectedYear) return;
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex > 0) {
      handleYearChange(availableYears[currentIndex - 1]);
    }
  };

  const handleNextYear = () => {
    if (!selectedYear) return;
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex < availableYears.length - 1) {
      handleYearChange(availableYears[currentIndex + 1]);
    }
  };

  // Handle decade click with availability check
  const handleDecadeClick = (decade: DecadeStats) => {
    if (decade.isAvailable && decade.movieCount > 0) {
      handleYearChange(decade.startOscarYear);
    }
  };

  // NEW: Handle nominees toggle with smooth scrolling
  const handleNomineesToggle = () => {
    const newShowState = !showNominees;
    setShowNominees(newShowState);
    
    // If showing nominees, scroll to them after a short delay for animation
    if (newShowState && nomineesRef.current) {
      setTimeout(() => {
        nomineesRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 300); // Wait for animation to start
    }
  };

  const handleBriefClick = async () => {
    if (!currentMovie) return;
    
    setIsGeneratingBrief(true);
    setViewMode('brief');
    
    try {
      const response = await getMovieRecommendation('brief', currentMovie.id);
      if (response && response.brief) {
        setBriefText(response.brief);
      }
    } catch (error) {
      console.error('Error fetching brief:', error);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleAddToList = async () => {
    if (!isAuthenticated) {
      onAuthPrompt('list filmowych');
      return;
    }

    if (!currentMovie) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActionFeedback({ type: 'error', message: 'Nie jesteś zalogowany' });
        return;
      }

      // Add movie to watchlist
      const success = await addMovieToWatchlist(user.id, currentMovie.id);
      if (success) {
        setActionFeedback({ type: 'success', message: `"${currentMovie.title}" dodano do listy "Do obejrzenia"!` });
      } else {
        setActionFeedback({ type: 'error', message: 'Nie udało się dodać filmu do listy "Do obejrzenia"' });
      }
    } catch (error) {
      console.error('Error adding to list:', error);
      setActionFeedback({ type: 'error', message: 'Wystąpił błąd podczas dodawania do listy' });
    }
  };

  const handleWatched = async () => {
    if (!isAuthenticated) {
      onAuthPrompt('oznaczania filmów jako obejrzane');
      return;
    }

    if (!currentMovie) return;

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
        setActionFeedback({ type: 'success', message: `"${currentMovie.title}" oznaczono jako obejrzany!` });
      } else {
        setActionFeedback({ type: 'error', message: 'Nie udało się oznaczyć filmu jako obejrzany' });
      }
    } catch (error) {
      console.error('Error marking as watched:', error);
      setActionFeedback({ type: 'error', message: 'Wystąpił błąd podczas oznaczania filmu' });
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

  // Get nominees excluding the winner for display
  const otherNominees = allNominees.filter(movie => !movie.is_best_picture_winner);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070000] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
          <p className="text-white text-lg">Ładowanie historii Oscarów...</p>
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
          actionFeedback.type ===  'success' 
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

      {/* Main Content - FIXED: No padding on mobile */}
      <div className="flex-1 py-0 px-0 md:py-20 md:px-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <>
              {/* Header */}
              <div className="text-center mb-16 px-6">
                <h1 className="text-4xl md:text-5xl font-bold text-[#DFBD69] mb-4">
                  Przemierz historię kina rok po roku
                </h1>
                <p className="text-neutral-400 text-xl">
                  Wybierz rok, który najbardziej Cię intryguje
                </p>
              </div>

              {/* Decade Selection */}
              <div className="mb-12 px-6">
                <div className="max-w-6xl mx-auto">
                  <div className="flex overflow-x-auto scrollbar-hide gap-x-4 lg:justify-center lg:gap-x-4">
                    {decadeStats.map((decade) => (
                      <button
                        key={decade.id}
                        onClick={() => handleDecadeClick(decade)}
                        disabled={!decade.isAvailable}
                        className={`
                          px-3 py-2 rounded-lg border text-center transition-colors flex flex-col items-center justify-center flex-shrink-0
                          ${decade.isAvailable 
                            ? 'border-[#DFBD69] text-[#DFBD69] font-medium hover:bg-[#DFBD69]/10 cursor-pointer' 
                            : 'border-neutral-600 text-neutral-500 opacity-50 cursor-not-allowed'
                          }
                        `}
                      >
                        <span className="text-sm font-semibold whitespace-nowrap">
                          {decade.id}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Year Slider */}
              <div className="mb-12 px-6">
                <div className="relative">
                  {/* Navigation Arrows - Hidden on mobile */}
                  <button
                    onClick={handlePreviousYear}
                    disabled={!selectedYear || availableYears.indexOf(selectedYear) === 0}
                    className="hidden lg:block absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-3 text-[#DFBD69] hover:text-[#E8C573] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  
                  <button
                    onClick={handleNextYear}
                    disabled={!selectedYear || availableYears.indexOf(selectedYear) === availableYears.length - 1}
                    className="hidden lg:block absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-3 text-[#DFBD69] hover:text-[#E8C573] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>

                  {/* Year Slider Container */}
                  <div className="lg:mx-16 overflow-hidden">
                    <div 
                      ref={yearSliderRef}
                      className="flex space-x-6 lg:space-x-8 overflow-x-auto scrollbar-hide py-4"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {availableYears.map((year) => (
                        <div key={year} className="flex flex-col items-center flex-shrink-0">
                          <button
                            data-year={year}
                            onClick={() => handleYearChange(year)}
                            className={`transition-all duration-300 text-lg lg:text-xl ${
                              selectedYear === year
                                ? 'text-[#DFBD69] font-semibold transform scale-105'
                                : 'text-[#DFBD69] font-medium hover:text-[#E8C573]'
                            }`}
                          >
                            {year}
                          </button>
                          
                          {/* Golden Dot Indicator */}
                          <div 
                            className={`w-1.5 h-1.5 rounded-full bg-[#DFBD69] mt-1 transition-opacity duration-300 ${
                              selectedYear === year ? 'opacity-100' : 'opacity-0'
                            }`}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Gradient Separator */}
                <div className="mt-4">
                  <div 
                    className="h-0.5 w-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(223, 189, 105, 0.3), transparent)'
                    }}
                  ></div>
                </div>
              </div>

              {/* Reset Button */}
              <div className="mb-12 text-center px-6">
                <button
                  onClick={() => {
                    setSelectedYear(null);
                    setCurrentMovie(null);
                    setAllNominees([]);
                    setShowNominees(false);
                  }}
                  className="px-6 py-3 rounded-lg border border-[#DFBD69] text-[#DFBD69] font-medium hover:bg-[#DFBD69]/10 transition-colors"
                >
                  Resetuj rok
                </button>
              </div>

              {/* Current Movie Display */}
              {currentMovie && selectedYear && (
                <div className="space-y-8">
                  {/* FIXED: Removed background - no bg color, border, or rounded corners */}
                  <div className="p-8">
                    {/* FIXED: Title section - removed px-6 */}
                    <div className="text-center mb-6">
                      <h2 className="text-2xl md:text-3xl font-bold text-[#DFBD69] mb-2">
                        🏆 {selectedYear} - {currentMovie.title.toUpperCase()}
                      </h2>
                      <p className="text-neutral-400">
                        Zwycięzca Najlepszy Film
                      </p>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-8">
                      {/* Movie Poster - NO additional padding, relies on card padding */}
                      <div className="lg:col-span-2">
                        <img 
                          src={formatPosterUrl(currentMovie.poster_path)}
                          alt={`${currentMovie.title} Poster`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>

                      {/* FIXED: Movie Info - removed px-6 */}
                      <div className="lg:col-span-3 flex flex-col space-y-6">
                        <div className="flex-shrink-0">
                          <div className="flex flex-wrap gap-4 text-sm text-neutral-300 mb-4">
                            <span>⏰ {formatRuntime(currentMovie.runtime)}</span>
                            <span>🎭 {formatThematicTags(currentMovie.thematic_tags)}</span>
                            {currentMovie.vote_average && (
                              <span>⭐ {currentMovie.vote_average}/10</span>
                            )}
                          </div>

                          {/* Description with gradient matching QuickShotScreen */}
                          <div 
                            className="p-4 rounded-lg mb-6"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(223, 189, 105, 0.15) 100%)',
                            }}
                          >
                            <h3 className="text-white font-semibold mb-2">Czego możesz się spodziewać:</h3>
                            <p className="text-neutral-300 text-sm leading-relaxed">
                              {currentMovie.ai_recommendation_text || 
                               `"${currentMovie.title}" to klasyczny film oscarowy z ${currentMovie.year} roku, który oferuje niezapomniane doświadczenie kinowe pełne emocji i mistrzowskiego rzemiosła filmowego.`}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={handleBriefClick}
                                className="h-14 sm:h-12 bg-gradient-to-r from-[#DFBD69]/20 to-transparent border border-[#DFBD69]/30 text-[#DFBD69] font-semibold px-4 rounded-lg hover:from-[#DFBD69]/30 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                              >
                                <BookOpen className="w-5 h-5" />
                                5-min Brief
                              </button>
                              
                              <button 
                                onClick={onGoToJourney}
                                className="h-14 sm:h-12 bg-neutral-700 text-white font-semibold px-4 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                              >
                                <TrendingUp className="w-5 h-5" />
                                Moja droga
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={handleAddToList}
                                className="h-14 sm:h-12 bg-neutral-700 text-white font-semibold px-4 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                              >
                                <img src="/ulubione.png" alt="Dodaj do listy" className="w-4 h-4" />
                                Do obejrzenia
                              </button>
                              <button 
                                onClick={handleWatched}
                                className="h-14 sm:h-12 bg-neutral-700 text-white font-semibold px-4 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                              >
                                <Check className="w-4 h-4" />
                                Obejrzałem
                              </button>
                            </div>
                            
                            {/* Nominees Toggle Button - Hidden on desktop */}
                            {otherNominees.length > 0 && (
                              <button 
                                onClick={handleNomineesToggle}
                                className="w-full h-14 sm:h-12 bg-neutral-700 text-white font-semibold px-4 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2 xl:hidden text-xs sm:text-sm"
                              >
                                <Trophy className="w-4 h-4" />
                                {showNominees ? 'Ukryj inne nominacje' : 'Inne nominacje'}
                                {showNominees ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Desktop Nominees Display - Visible on large screens */}
                        {otherNominees.length > 0 && (
                          <div className="hidden xl:block flex-1 mt-6">
                            <h3 className="text-white font-semibold mb-4 text-sm">
                              🏆 Pozostali nominowani {selectedYear}:
                            </h3>
                            <div className={`max-h-96 overflow-y-auto ${
                              otherNominees.length > 5 
                                ? 'grid grid-cols-2 gap-3' 
                                : 'space-y-3'
                            }`}>
                              {otherNominees.map((nominee) => (
                                <div 
                                  key={nominee.id}
                                  className="flex items-start gap-2 p-2 rounded-lg transition-colors bg-gradient-to-r from-neutral-700/50 to-neutral-800/30 hover:from-neutral-600/60 hover:to-neutral-700/40"
                                >
                                  <img 
                                    src={formatPosterUrl(nominee.poster_path)}
                                    alt={`${nominee.title} Poster`}
                                    className="w-6 h-9 object-cover rounded flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs font-medium leading-tight mb-1">
                                      {nominee.title}
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
                    </div>
                  </div>

                  {/* FIXED: Mobile Nominees - Consistent padding with main card */}
                  {otherNominees.length > 0 && (
                    <div 
                      ref={nomineesRef}
                      className={`overflow-hidden transition-all duration-500 ease-in-out xl:hidden ${
                        showNominees ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      {/* FIXED: Changed px-6 to p-8 for consistency */}
                      <div className="grid md:grid-cols-2 gap-4 p-8">
                        {otherNominees.map((movie) => (
                          <div 
                            key={movie.id}
                            className="flex gap-4 p-4 rounded-lg transition-colors bg-gradient-to-r from-neutral-700/50 to-neutral-800/30 hover:from-neutral-600/60 hover:to-neutral-700/40"
                          >
                            <img 
                              src={formatPosterUrl(movie.poster_path)}
                              alt={`${movie.title} Poster`}
                              className="w-16 h-24 object-cover rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-semibold mb-2 text-sm leading-tight">
                                {movie.title}
                              </h4>
                              <p className="text-neutral-400 text-xs mb-1">
                                {movie.year} • {formatRuntime(movie.runtime)}
                              </p>
                              {movie.vote_average && (
                                <p className="text-neutral-400 text-xs">
                                  ⭐ {movie.vote_average}/10
                                </p>
                              )}
                              <p className="text-neutral-500 text-xs mt-1 truncate">
                                {formatThematicTags(movie.thematic_tags)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Brief View - UPDATED: Identical to QuickShotScreen and SmartMatchScreen */}
          {viewMode === 'brief' && currentMovie && (
            <div 
              className="p-8 md:p-12 md:rounded-2xl md:border md:border-neutral-700"
              style={{
                background: '#0a0a0a',
              }}
            >
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => setViewMode('timeline')}
                  className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  ← Powrót do rezultatu
                </button>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  📖 5-MINUTOWY BRIEF: "{currentMovie.title.toUpperCase()}"
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
                      onClick={() => setViewMode('timeline')}
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

// Helper function to parse brief text into sections - IDENTICAL to QuickShotScreen and SmartMatchScreen
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

export default BrowseByYearsScreen;