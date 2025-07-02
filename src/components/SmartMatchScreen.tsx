import React, { useState } from 'react';
import { ArrowLeft, Target, Play, BookOpen, Check, X } from 'lucide-react';
import { getSmartMatchRecommendations, getMovieRecommendation, addMovieToWatchlist, markMovieAsWatched, UserPreferences, MovieRecommendation } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { formatThematicTags } from '../lib/utils';

interface SmartMatchScreenProps {
  onBack: () => void;
  isAuthenticated: boolean;
  onAuthPrompt: (featureName: string) => void;
  onGoToJourney: () => void;
}

// UPDATED: Added 'popularity' step - now 5 steps total
type Step = 'intro' | 'mood' | 'time' | 'genre' | 'decade' | 'popularity' | 'platforms' | 'processing' | 'results' | 'brief';

const SmartMatchScreen: React.FC<SmartMatchScreenProps> = ({ onBack, isAuthenticated, onAuthPrompt, onGoToJourney }) => {
  const [currentStep, setCurrentStep] = useState<Step>('mood');
  const [preferences, setPreferences] = useState<UserPreferences>({
    mood: '',
    time: '',
    genres: [],
    decade: '', // decade preference
    popularity: '', // NEW: popularity preference
    platforms: [],
    allowRental: false,
    showAll: false
  });
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovieForBrief, setSelectedMovieForBrief] = useState<MovieRecommendation | null>(null);
  const [briefText, setBriefText] = useState<string>('');
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const moods = [
    { id: 'inspiration', name: 'Inspiracja', description: 'Motywacja i nadzieja', image: '/inspiracja.jpg' },
    { id: 'adrenaline', name: 'Adrenalina', description: 'Akcja i suspens', image: '/adrenalina.jpg' },
    { id: 'emotions', name: 'Głębokie emocje', description: 'Poruszające historie', image: '/glebokie-emocje.jpg' },
    { id: 'humor', name: 'Humor', description: 'Lekkość i zabawa', image: '/humor.jpg' },
    { id: 'ambitious', name: 'Intelektualne wyzwanie', description: 'Coś do myślenia', image: '/cos-ambitnego.jpg' },
    { id: 'romance', name: 'Romantyczny wieczór', description: 'Miłość i uczucia', image: '/romantyczny-wieczor.jpg' }
  ];

  const timeOptions = [
    { id: 'short', label: 'Szybka sesja', description: '60-90 min' },
    { id: 'normal', label: 'Normalny seans', description: '90-150 min' },
    { id: 'long', label: 'Długi wieczór', description: '150+ min' },
    { id: 'any', label: 'Nie ma znaczenia', description: 'Dowolna długość' }
  ];

  const genreOptions = [
    { id: 'Dramat', label: 'Dramat' },
    { id: 'Komedia', label: 'Komedia' },
    { id: 'Akcja', label: 'Akcja' },
    { id: 'Horror', label: 'Horror' },
    { id: 'Science Fiction', label: 'Science Fiction' },
    { id: 'Romans', label: 'Romans' },
    { id: 'Thriller', label: 'Thriller' },
    { id: 'Fantasy', label: 'Fantasy' },
    { id: 'Western', label: 'Western' },
    { id: 'Wojenny', label: 'Wojenny' },
    { id: 'Kryminał', label: 'Kryminał' },
    { id: 'Historyczny', label: 'Historyczny' },
    { id: 'Biograficzny', label: 'Biograficzny' },
    { id: 'Przygodowy', label: 'Przygodowy' },
    { id: 'Psychologiczny', label: 'Psychologiczny' },
    { id: 'Musical', label: 'Musical' },
    { id: 'Adaptacje teatralne', label: 'Adaptacje teatralne' }
  ];

  // Decade options
  const decadeOptions = [
    { 
      id: '2000s', 
      label: 'Lata 2000-2009', 
      description: 'Klasyczne blockbustery i przełomowe dramaty',
      count: '55 filmów',
      highlights: 'Gladiator, LotR, No Country for Old Men'
    },
    { 
      id: '2010s', 
      label: 'Lata 2010-2019', 
      description: 'Współczesne arcydzieła i różnorodność gatunków',
      count: '90 filmów',
      highlights: 'Parasite, La La Land, Moonlight'
    },
    { 
      id: 'both', 
      label: 'Obie dekady', 
      description: 'Pełna różnorodność z dwóch dekad',
      count: '145 filmów',
      highlights: 'Wszystkie nagrody 2000-2019'
    }
  ];

  // UPDATED: Popularity options without icons
  const popularityOptions = [
    { 
      id: 'blockbuster', 
      label: 'Bardzo znany film', 
      description: 'Popularne hity, które zna każdy kinoman',
      details: 'Top 25% najczęściej głosowanych filmów',
      threshold: 'high'
    },
    { 
      id: 'classic', 
      label: 'Popularny klasyk', 
      description: 'Uznane dzieła o średniej popularności',
      details: 'Filmy o umiarkowanej liczbie głosów',
      threshold: 'medium'
    },
    { 
      id: 'hidden-gem', 
      label: 'Mniej znana perełka', 
      description: 'Niedocenione skarby kinematografii',
      details: 'Bottom 25% - filmy dla prawdziwych odkrywców',
      threshold: 'low'
    },
    { 
      id: 'any', 
      label: 'Dowolna popularność', 
      description: 'Jestem otwarty na wszystko',
      details: 'Pełny zakres od hitów po perełki',
      threshold: 'any'
    }
  ];

  const MAX_GENRES = 3; // Maximum number of genres user can select

  // Clear feedback after 3 seconds
  React.useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => {
        setActionFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  // UPDATED: Now 5 steps (mood, time, genre, decade, popularity)
  const getStepNumber = () => {
    const stepMap = { 
      intro: 0, 
      mood: 1, 
      time: 2, 
      genre: 3, 
      decade: 4, 
      popularity: 5, 
      platforms: 5, 
      processing: 5, 
      results: 5,
      brief: 5
    };
    return stepMap[currentStep];
  };

  const getProgressBar = () => {
    const current = getStepNumber();
    return Array.from({ length: 5 }, (_, i) => ( // 5 steps now
      <div
        key={i}
        className={`w-8 h-2 rounded-full ${i < current ? 'bg-[#DFBD69]' : 'bg-neutral-700'}`}
      />
    ));
  };

  const handleMoodSelect = (moodId: string) => {
    setPreferences({ ...preferences, mood: moodId });
    setCurrentStep('time');
  };

  const handleTimeSelect = (timeId: string) => {
    setPreferences({ ...preferences, time: timeId });
    setCurrentStep('genre');
  };

  const handleGenreToggle = (genreId: string) => {
    if (genreId === 'surprise') {
      // "Zaskocz mnie" clears all other selections and sets only itself
      setPreferences({ ...preferences, genres: ['surprise'] });
    } else {
      // Regular genre selection - remove 'surprise' if it was selected
      let newGenres;
      if (preferences.genres.includes(genreId)) {
        // Deselecting this genre
        newGenres = preferences.genres.filter(g => g !== genreId);
      } else {
        // Check if we would exceed the maximum number of genres
        const currentGenresWithoutSurprise = preferences.genres.filter(g => g !== 'surprise');
        if (currentGenresWithoutSurprise.length >= MAX_GENRES) {
          // Don't allow more than MAX_GENRES genres to be selected
          return;
        }
        
        // Selecting this genre - remove 'surprise' and add this genre
        newGenres = preferences.genres.filter(g => g !== 'surprise');
        newGenres = [...newGenres, genreId];
      }
      setPreferences({ ...preferences, genres: newGenres });
    }
  };

  // Handle decade selection - goes to popularity step
  const handleDecadeSelect = (decadeId: string) => {
    setPreferences({ ...preferences, decade: decadeId });
    setCurrentStep('popularity');
  };

  // NEW: Handle popularity selection - now goes directly to processing
  const handlePopularitySelect = async (popularityId: string) => {
    const updatedPreferences = { ...preferences, popularity: popularityId };
    setPreferences(updatedPreferences);
    setCurrentStep('processing');
    setIsLoading(true);
    setError(null);

    try {
      // Call the Smart Match API with all preferences including popularity
      const result = await getSmartMatchRecommendations(updatedPreferences);

      if (result && result.success && result.recommendations) {
        setRecommendations(result.recommendations);
        setCurrentStep('results');
      } else {
        throw new Error('Failed to get recommendations');
      }
    } catch (error) {
      console.error('Smart Match error:', error);
      setError('Nie udało się pobrać rekomendacji. Spróbuj ponownie.');
      setCurrentStep('popularity'); // Go back to popularity selection
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Handle brief click
  const handleBriefClick = async (recommendation: MovieRecommendation) => {
    setSelectedMovieForBrief(recommendation);
    setCurrentStep('brief');
    setIsGeneratingBrief(true);
    setBriefText('');
    
    try {
      const response = await getMovieRecommendation('brief', recommendation.movie.id);
      if (response && response.brief) {
        setBriefText(response.brief);
      }
    } catch (error) {
      console.error('Error fetching brief:', error);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleAddToList = async (movieId?: string) => {
    if (!isAuthenticated) {
      onAuthPrompt('list filmowych');
      return;
    }

    const targetMovieId = movieId || selectedMovieForBrief?.movie.id;
    if (!targetMovieId) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActionFeedback({ type: 'error', message: 'Nie jesteś zalogowany' });
        return;
      }

      // Add movie to watchlist
      const success = await addMovieToWatchlist(user.id, targetMovieId);
      if (success) {
        const movieTitle = movieId ? 
          (recommendations.find(r => r.movie.id === movieId)?.movie.title || 'Film') : 
          (selectedMovieForBrief?.movie.title || 'Film');
        setActionFeedback({ type: 'success', message: `"${movieTitle}" dodano do listy "Do obejrzenia"!` });
      } else {
        setActionFeedback({ type: 'error', message: 'Nie udało się dodać filmu do listy "Do obejrzenia"' });
      }
    } catch (error) {
      console.error('Error adding to list:', error);
      setActionFeedback({ type: 'error', message: 'Wystąpił błąd podczas dodawania do listy' });
    }
  };

  const handleWatched = async (movieId?: string) => {
    if (!isAuthenticated) {
      onAuthPrompt('oznaczania filmów jako obejrzane');
      return;
    }

    const targetMovieId = movieId || selectedMovieForBrief?.movie.id;
    if (!targetMovieId) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActionFeedback({ type: 'error', message: 'Nie jesteś zalogowany' });
        return;
      }

      // Mark movie as watched
      const success = await markMovieAsWatched(user.id, targetMovieId);
      if (success) {
        const movieTitle = movieId ? 
          (recommendations.find(r => r.movie.id === movieId)?.movie.title || 'Film') : 
          (selectedMovieForBrief?.movie.title || 'Film');
        setActionFeedback({ type: 'success', message: `"${movieTitle}" oznaczono jako obejrzany!` });
      } else {
        setActionFeedback({ type: 'error', message: 'Nie udało się oznaczyć filmu jako obejrzany' });
      }
    } catch (error) {
      console.error('Error marking as watched:', error);
      setActionFeedback({ type: 'error', message: 'Wystąpił błąd podczas oznaczania filmu' });
    }
  };

  const formatPosterUrl = (posterPath: string | null | undefined) => {
    if (!posterPath) return '/jpiDCxkCbo0.movieposter_maxres.jpg'; // fallback
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  const formatRuntime = (runtime: number | null | undefined) => {
    if (!runtime) return 'Nieznany czas';
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return `${hours}h ${minutes}min`;
  };

  const formatOscarStatus = (movie: any) => {
    if (movie.is_best_picture_winner) {
      return `Zwycięzca Oscara ${movie.oscar_year}`;
    } else {
      return `Nominowany do Oscara ${movie.oscar_year}`;
    }
  };

  const restartQuiz = () => {
    setCurrentStep('mood');
    setPreferences({
      mood: '',
      time: '',
      genres: [],
      decade: '', // Reset decade preference
      popularity: '', // Reset popularity preference
      platforms: [],
      allowRental: false,
      showAll: false
    });
    setRecommendations([]);
    setError(null);
    setBriefText('');
    setSelectedMovieForBrief(null);
    setActionFeedback(null);
  };

  const getGenreSelectionMessage = () => {
    const currentGenresWithoutSurprise = preferences.genres.filter(g => g !== 'surprise');
    const remaining = MAX_GENRES - currentGenresWithoutSurprise.length;
    
    if (preferences.genres.includes('surprise')) {
      return 'Wybrano: "Zaskocz mnie" - wszystkie gatunki są uwzględnione';
    } else if (currentGenresWithoutSurprise.length === 0) {
      return `Wybierz maksymalnie ${MAX_GENRES} gatunki lub "Zaskocz mnie"`;
    } else if (currentGenresWithoutSurprise.length === MAX_GENRES) {
      return `Wybrano maksymalną liczbę gatunków (${MAX_GENRES}). Możesz odznaczyć gatunki, aby wybrać inne.`;
    } else {
      return `Wybrano: ${currentGenresWithoutSurprise.length}/${MAX_GENRES} gatunków. Możesz wybrać jeszcze ${remaining}.`;
    }
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
      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="w-full max-w-4xl mx-auto">

          {/* Mood Step */}
          {currentStep === 'mood' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  Pytanie 1/5
                </h2>
                <p className="text-xl text-neutral-300">
                  Jakich emocji oczekujesz?
                </p>
                <div className="flex justify-center gap-2">
                  {getProgressBar()}
                </div>
                <p className="text-neutral-400 text-sm">
                  Postęp: (1/5)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => handleMoodSelect(mood.id)}
                    className="group relative bg-[#1a1c1e] rounded-xl border border-neutral-700 hover:border-[#DFBD69] transition-all duration-300 transform hover:scale-105 overflow-hidden h-48"
                  >
                    {/* Background Image */}
                    <div 
                      className="absolute inset-0 transition-all duration-300 ease-out group-hover:scale-110"
                      style={{
                        backgroundImage: `url(${mood.image})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20 group-hover:from-black/70 group-hover:via-black/20 group-hover:to-black/10 transition-all duration-300"></div>
                    </div>
                    
                    {/* Selection Circle */}
                    <div className="absolute top-4 right-4 z-20">
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-transparent group-hover:border-[#DFBD69]"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="absolute bottom-6 left-6 right-6 z-20">
                      <h3 className="text-white text-lg font-bold mb-1">
                        {mood.name}
                      </h3>
                      <p className="text-neutral-300 text-sm">
                        {mood.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time Step */}
          {currentStep === 'time' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  Pytanie 2/5
                </h2>
                <p className="text-xl text-neutral-300 flex items-center justify-center gap-2">
                  <span>Ile masz czasu?</span>
                </p>
                <div className="flex justify-center gap-2">
                  {getProgressBar()}
                </div>
                <p className="text-neutral-400 text-sm">
                  Postęp: (2/5)
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-4">
                {timeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleTimeSelect(option.id)}
                    className="w-full p-6 bg-[#1a1c1e] rounded-lg border border-neutral-700 hover:border-[#DFBD69] transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold text-lg mb-1">
                          {option.label}
                        </h3>
                        <p className="text-neutral-400 text-sm">
                          {option.description}
                        </p>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 border-neutral-500 group-hover:border-[#DFBD69]"></div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center">
                <p className="text-neutral-400 text-sm flex items-center justify-center gap-2">
                  <span>💡</span>
                  <span>Rada: Większość klasycznych Oscarów to 120-150 min</span>
                </p>
              </div>
            </div>
          )}

          {/* Genre Step */}
          {currentStep === 'genre' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  Pytanie 3/5
                </h2>
                <p className="text-xl text-neutral-300">
                  Co Cię pociąga?
                </p>
                <div className="flex justify-center gap-2">
                  {getProgressBar()}
                </div>
                <p className="text-neutral-400 text-sm">
                  Postęp: (3/5)
                </p>
              </div>

              {/* Genre Selection Info */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1c1e] rounded-lg border border-neutral-700">
                  <span className="text-sm text-neutral-300">
                    {getGenreSelectionMessage()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {genreOptions.map((genre) => {
                  const isSelected = preferences.genres.includes(genre.id);
                  const isDisabled = !isSelected && 
                    !preferences.genres.includes('surprise') && 
                    preferences.genres.filter(g => g !== 'surprise').length >= MAX_GENRES;
                  
                  return (
                    <button
                      key={genre.id}
                      onClick={() => !isDisabled && handleGenreToggle(genre.id)}
                      disabled={isDisabled}
                      className={`p-4 rounded-lg border transition-all duration-200 text-center h-16 flex items-center justify-center ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#DFBD69]/30 to-[#DFBD69]/10 border-[#DFBD69] text-[#DFBD69] shadow-lg shadow-[#DFBD69]/20'
                          : isDisabled
                          ? 'bg-neutral-800 border-neutral-600 text-neutral-500 cursor-not-allowed opacity-50'
                          : 'bg-[#1a1c1e] border-neutral-700 hover:border-[#DFBD69] text-white cursor-pointer'
                      }`}
                    >
                      <span className="font-medium text-sm">{genre.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="text-center">
                <button
                  onClick={() => handleGenreToggle('surprise')}
                  className={`px-6 py-3 rounded-lg border transition-colors ${
                    preferences.genres.includes('surprise')
                      ? 'bg-[#DFBD69]/20 border-[#DFBD69] text-white'
                      : 'bg-[#1a1c1e] border-neutral-700 hover:border-[#DFBD69] text-white'
                  }`}
                >
                  ✨ Zaskocz mnie - nie mam preferencji
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setCurrentStep('decade')}
                  disabled={preferences.genres.length === 0}
                  className="bg-[#DFBD69] text-black font-semibold py-3 px-8 rounded-lg hover:bg-[#E8C573] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Dalej
                </button>
              </div>

              {preferences.genres.length > 0 && !preferences.genres.includes('surprise') && (
                <div className="text-center">
                  <p className="text-neutral-400 text-xs">
                    💡 Im mniej gatunków wybierzesz, tym bardziej precyzyjne będą rekomendacje
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Decade Step */}
          {currentStep === 'decade' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  Pytanie 4/5
                </h2>
                <p className="text-xl text-neutral-300">
                  Z której dekady chcesz filmy?
                </p>
                <div className="flex justify-center gap-2">
                  {getProgressBar()}
                </div>
                <p className="text-neutral-400 text-sm">
                  Postęp: (4/5)
                </p>
              </div>

              <div className="max-w-3xl mx-auto space-y-4">
                {decadeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleDecadeSelect(option.id)}
                    className="w-full p-6 bg-[#1a1c1e] rounded-lg border border-neutral-700 hover:border-[#DFBD69] transition-colors text-left group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold text-lg">
                            {option.label}
                          </h3>
                          <span className="bg-[#DFBD69]/20 text-[#DFBD69] px-2 py-1 rounded-md text-xs font-medium">
                            {option.count}
                          </span>
                        </div>
                        <p className="text-neutral-400 text-sm mb-2">
                          {option.description}
                        </p>
                        <p className="text-neutral-500 text-xs">
                          🎬 {option.highlights}
                        </p>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 border-neutral-500 group-hover:border-[#DFBD69] mt-1 flex-shrink-0"></div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center">
                <p className="text-neutral-400 text-sm flex items-center justify-center gap-2">
                  <span>💡</span>
                  <span>Każda dekada ma swój unikalny styl i tematykę</span>
                </p>
              </div>
            </div>
          )}

          {/* NEW: Popularity Step - UPDATED: Removed icons */}
          {currentStep === 'popularity' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  Pytanie 5/5
                </h2>
                <p className="text-xl text-neutral-300">
                  Jaki poziom popularności filmu preferujesz?
                </p>
                <div className="flex justify-center gap-2">
                  {getProgressBar()}
                </div>
                <p className="text-neutral-400 text-sm">
                  Postęp: (5/5)
                </p>
                {error && (
                  <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>

              <div className="max-w-3xl mx-auto space-y-4">
                {popularityOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handlePopularitySelect(option.id)}
                    disabled={isLoading}
                    className="w-full p-6 bg-[#1a1c1e] rounded-lg border border-neutral-700 hover:border-[#DFBD69] transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-2">
                          {option.label}
                        </h3>
                        <p className="text-neutral-400 text-sm leading-relaxed mb-2">
                          {option.description}
                        </p>
                        <p className="text-neutral-500 text-xs">
                          📊 {option.details}
                        </p>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 border-neutral-500 group-hover:border-[#DFBD69] mt-1"></div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center">
                <p className="text-neutral-400 text-sm flex items-center justify-center gap-2">
                  <span>🎯</span>
                  <span>Oparte na rzeczywistych danych popularności z TMDB</span>
                </p>
              </div>
            </div>
          )}

          {/* Processing Step - UPDATED: Shows popularity preference */}
          {currentStep === 'processing' && (
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  AI ANALIZUJE TWOJE PREFERENCJE...
                </h2>
                <div className="w-16 h-16 mx-auto border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
              </div>

              <div className="max-w-2xl mx-auto space-y-4">
                <div className="p-4 bg-[#1a1c1e] rounded-lg border border-neutral-700">
                  <p className="text-neutral-300">Dopasowuję nastrój "{preferences.mood}" do Oscar winners...</p>
                </div>
                <div className="p-4 bg-[#1a1c1e] rounded-lg border border-neutral-700">
                  <p className="text-neutral-300">Filtruję filmy według czasu "{preferences.time}"...</p>
                </div>
                <div className="p-4 bg-[#1a1c1e] rounded-lg border border-neutral-700">
                  <p className="text-neutral-300">
                    Analizuję wybrane gatunki: {preferences.genres.includes('surprise') ? 'wszystkie' : preferences.genres.join(', ')}
                  </p>
                </div>
                <div className="p-4 bg-[#1a1c1e] rounded-lg border border-neutral-700">
                  <p className="text-neutral-300">
                    Uwzględniam dekadę: {
                      preferences.decade === '2000s' ? 'Lata 2000-2009' :
                      preferences.decade === '2010s' ? 'Lata 2010-2019' :
                      preferences.decade === 'both' ? 'Obie dekady (2000-2019)' : 
                      preferences.decade
                    }
                  </p>
                </div>
                <div className="p-4 bg-[#1a1c1e] rounded-lg border border-neutral-700">
                  <p className="text-neutral-300">
                    Szukam filmów o poziomie popularności: "{
                      preferences.popularity === 'blockbuster' ? 'Bardzo znany film' :
                      preferences.popularity === 'classic' ? 'Popularny klasyk' :
                      preferences.popularity === 'hidden-gem' ? 'Mniej znana perełka' :
                      preferences.popularity === 'any' ? 'Dowolna popularność' :
                      preferences.popularity
                    }"
                  </p>
                </div>
              </div>

              <div className="text-[#DFBD69] text-xl font-semibold">
                ✨ Analizuję filmy oscarowe z Twoimi preferencjami popularności...
              </div>
            </div>
          )}

          {/* Results Step - FIXED: Better responsive design */}
          {currentStep === 'results' && (
            <div className="space-y-6 md:space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-[#DFBD69]">
                  TWOJE SMART MATCHES
                </h2>
                <p className="text-neutral-400">
                  Dopasowano na podstawie Twoich preferencji
                  {preferences.decade && preferences.decade !== 'both' && (
                    <span className="block text-sm mt-1">
                      📅 Dekada: {preferences.decade === '2000s' ? '2000-2009' : '2010-2019'}
                    </span>
                  )}
                  {preferences.popularity && preferences.popularity !== 'any' && (
                    <span className="block text-sm mt-1">
                      🎯 Popularność: {
                        preferences.popularity === 'blockbuster' ? 'Bardzo znane filmy' :
                        preferences.popularity === 'classic' ? 'Popularne klasyki' :
                        preferences.popularity === 'hidden-gem' ? 'Mniej znane perełki' :
                        preferences.popularity
                      }
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-6 md:space-y-8">
                {recommendations.map((recommendation, index) => (
                  <div
                    key={recommendation.movie.id}
                    className={`p-4 md:p-6 rounded-xl border ${
                      index === 0 
                        ? 'border-[#DFBD69] bg-gradient-to-r from-[#DFBD69]/20 to-transparent' 
                        : 'border-neutral-700 bg-[#1a1c1e]'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-4">
                      <span className="text-xl md:text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                      <div>
                        <h3 className="text-white font-bold text-base md:text-lg">
                          {index === 0 ? 'GŁÓWNA REKOMENDACJA' : `ALTERNATYWA #${index}`}
                        </h3>
                        <span className="text-[#DFBD69] font-semibold text-sm md:text-base">
                          ({recommendation.matchScore}% dopasowanie)
                        </span>
                      </div>
                    </div>

                    {/* FIXED: Mobile-first responsive grid */}
                    <div className="flex flex-col md:grid md:grid-cols-5 gap-4 md:gap-6">
                      {/* Poster - FIXED: Better mobile sizing */}
                      <div className="md:col-span-2">
                        <img 
                          src={formatPosterUrl(recommendation.movie.poster_path)}
                          alt={`${recommendation.movie.title} Poster`}
                          className="w-full h-48 md:h-64 object-cover rounded-lg mx-auto"
                          style={{ maxWidth: '200px' }}
                        />
                      </div>

                      {/* Movie Info - FIXED: Better mobile layout */}
                      <div className="md:col-span-3 space-y-3 md:space-y-4">
                        <div>
                          {/* FIXED: Responsive title size */}
                          <h4 className="text-lg md:text-2xl font-bold text-white mb-2 leading-tight">
                            {recommendation.movie.title} ({recommendation.movie.year})
                          </h4>
                          
                          {/* FIXED: Better mobile text wrapping */}
                          <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-neutral-300 mb-3 md:mb-4">
                            <span className="whitespace-nowrap">{formatOscarStatus(recommendation.movie)}</span>
                            <span className="whitespace-nowrap">{formatRuntime(recommendation.movie.runtime)}</span>
                            {recommendation.movie.vote_average && (
                              <span className="whitespace-nowrap">⭐ {recommendation.movie.vote_average}/10</span>
                            )}
                            {recommendation.movie.vote_count && (
                              <span className="whitespace-nowrap">👥 {recommendation.movie.vote_count.toLocaleString()} głosów</span>
                            )}
                          </div>
                        </div>

                        {/* Reason - FIXED: Added golden gradient */}
                        <div 
                          className="p-3 md:p-4 rounded-lg border border-neutral-700"
                          style={{
                            background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                          }}
                        >
                          <h5 className="text-[#DFBD69] font-semibold mb-2 text-sm md:text-base">
                            Dlaczego {index === 0 ? 'idealny' : 'pasuje'}:
                          </h5>
                          <p className="text-neutral-200 text-xs md:text-sm leading-relaxed">
                            {recommendation.reason}
                          </p>
                        </div>

                        {/* FIXED: Mobile-responsive button layout */}
                        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                          <button 
                            onClick={() => handleAddToList(recommendation.movie.id)}
                            className="flex-1 bg-neutral-700 text-white font-semibold py-2 md:py-3 px-3 md:px-6 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                          >
                            <img src="/ulubione.png" alt="Dodaj do listy" className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden sm:inline text-xs">Do obejrzenia</span>
                            <span className="sm:hidden">Dodaj</span>
                          </button>
                          
                          <button 
                            onClick={() => handleWatched(recommendation.movie.id)}
                            className="flex-1 bg-neutral-700 text-white font-semibold py-2 md:py-3 px-3 md:px-6 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                          >
                            <Check className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">Obejrzałem</span>
                            <span className="sm:hidden">✓</span>
                          </button>
                          
                          <button 
                            onClick={() => handleBriefClick(recommendation)}
                            className="flex-1 bg-gradient-to-r from-[#DFBD69]/20 to-transparent border border-[#DFBD69]/30 text-[#DFBD69] font-semibold py-2 md:py-3 px-3 md:px-6 rounded-lg hover:from-[#DFBD69]/30 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                          >
                            <BookOpen className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">5-MIN BRIEF</span>
                            <span className="sm:hidden">Brief</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* FIXED: Mobile-responsive footer buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4 px-2">
                <button className="bg-neutral-700 text-white font-semibold py-2 md:py-3 px-4 md:px-6 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2 text-sm md:text-base">
                  <Target className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Więcej rekomendacji</span>
                  <span className="sm:hidden">Więcej</span>
                </button>
                
                <button 
                  onClick={restartQuiz}
                  className="bg-neutral-700 text-white font-semibold py-2 md:py-3 px-4 md:px-6 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <img src="/losowanie.png" alt="Nowy match" className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Nowy Smart Match</span>
                  <span className="sm:hidden">Nowy</span>
                </button>
              </div>
            </div>
          )}

          {/* Brief View - Identical to QuickShotScreen */}
          {currentStep === 'brief' && selectedMovieForBrief && (
            <div 
              className="p-8 md:p-12 md:rounded-2xl md:border md:border-neutral-700"
              style={{
                background: '#0a0a0a',
              }}
            >
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => setCurrentStep('results')}
                  className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  ← Powrót do rezultatów
                </button>
                <button
                  onClick={() => setCurrentStep('results')}
                  className="p-2 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  📖 5-MINUTOWY BRIEF: "{selectedMovieForBrief.movie.title?.toUpperCase()}"
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
                      onClick={() => setCurrentStep('results')}
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

export default SmartMatchScreen;