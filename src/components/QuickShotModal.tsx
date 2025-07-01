import React, { useState, useEffect } from 'react';
import { X, Play, BookOpen, Star, Shuffle, Target, BarChart3, Check, ExternalLink } from 'lucide-react';

interface QuickShotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LoadingStep = 'initial' | 'searching' | 'ready' | 'result' | 'explanation';

const QuickShotModal: React.FC<QuickShotModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<LoadingStep>('initial');
  const [showExplanation, setShowExplanation] = useState(false);

  const loadingSequence = [
    { step: 'initial', text: '30 sekund do odkrycia klasyki', duration: 1000 },
    { step: 'searching', text: 'Szukamy idealnego filmu...', duration: 2000 },
    { step: 'ready', text: 'Gotowe!', duration: 800 }
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('initial');
      setShowExplanation(false);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    
    const runSequence = async () => {
      for (const item of loadingSequence) {
        setCurrentStep(item.step as LoadingStep);
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, item.duration);
        });
      }
      setCurrentStep('result');
    };

    runSequence();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen]);

  const handleShuffle = () => {
    setCurrentStep('initial');
    setShowExplanation(false);
    
    const runSequence = async () => {
      for (const item of loadingSequence) {
        setCurrentStep(item.step as LoadingStep);
        await new Promise(resolve => setTimeout(resolve, item.duration));
      }
      setCurrentStep('result');
    };

    runSequence();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1c1e] rounded-2xl border border-neutral-700">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Loading Sequence */}
        {(currentStep === 'initial' || currentStep === 'searching' || currentStep === 'ready') && (
          <div className="flex items-center justify-center min-h-[400px] p-12">
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

        {/* Movie Result */}
        {currentStep === 'result' && !showExplanation && (
          <div className="p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-[#DFBD69] mb-2">
                TWÓJ OSCAR WINNER
              </h2>
            </div>

            <div className="grid lg:grid-cols-5 gap-8 mb-8">
              {/* Movie Poster */}
              <div className="lg:col-span-2">
                <div className="aspect-[2/3] bg-neutral-800 rounded-lg overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1489599316636-1c3d81bf8941?w=400&h=600&fit=crop"
                    alt="The Departed Poster"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Movie Info */}
              <div className="lg:col-span-3 space-y-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">THE DEPARTED</h1>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-neutral-300 mb-6">
                    <span className="flex items-center gap-1">
                      🏆 <strong className="text-[#DFBD69]">Oscary:</strong> Wygrał 4 (Best Picture, Director)
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-6 text-sm text-neutral-300 mb-6">
                    <span>⏰ <strong>Czas:</strong> 2h 31min</span>
                    <span>🎭 <strong>Gatunek:</strong> Crime Thriller</span>
                    <span>⭐ <strong>Ocena:</strong> 8.5/10</span>
                  </div>

                  <div className="bg-[#070000] p-4 rounded-lg mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">AI Dopasowanie:</span>
                      <span className="text-[#DFBD69] font-bold text-xl">89%</span>
                    </div>
                    <p className="text-neutral-300 text-sm">
                      💡 "Idealny dla fanów skomplikowanych thrillerów"
                    </p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-white font-semibold mb-3">📺 Gdzie obejrzeć:</h3>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-md flex items-center gap-1">
                        Netflix ✅
                      </span>
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-md flex items-center gap-1">
                        HBO Max ✅
                      </span>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-md flex items-center gap-1">
                        Amazon Prime ($3.99)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Buttons */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <button className="bg-[#DFBD69] text-black font-semibold py-4 px-6 rounded-lg hover:bg-[#E8C573] transition-colors flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                OGLĄDAJ TERAZ
              </button>
              <button className="bg-neutral-700 text-white font-semibold py-4 px-6 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2">
                <BookOpen className="w-5 h-5" />
                5-MIN BRIEF
              </button>
              <button className="bg-neutral-700 text-white font-semibold py-4 px-6 rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2">
                <Star className="w-5 h-5" />
                DODAJ DO LISTY
              </button>
            </div>

            {/* Additional Options */}
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={handleShuffle}
                className="text-neutral-300 hover:text-[#DFBD69] transition-colors flex items-center gap-2 text-sm"
              >
                <Shuffle className="w-4 h-4" />
                Losuj ponownie
              </button>
              <button 
                onClick={() => setShowExplanation(true)}
                className="text-neutral-300 hover:text-[#DFBD69] transition-colors flex items-center gap-2 text-sm"
              >
                <Target className="w-4 h-4" />
                Dlaczego ten film?
              </button>
              <button className="text-neutral-300 hover:text-[#DFBD69] transition-colors flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4" />
                Moja podróż Oscar
              </button>
            </div>
          </div>
        )}

        {/* Explanation View */}
        {showExplanation && (
          <div className="p-8 md:p-12">
            <button
              onClick={() => setShowExplanation(false)}
              className="mb-6 text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
            >
              ← Powrót do rezultatu
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                🎯 DLACZEGO "THE DEPARTED"?
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-[#070000] p-6 rounded-lg">
                <h3 className="text-[#DFBD69] font-semibold mb-4 text-lg">AI wybrało na podstawie:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-300"><strong>Twoja historia</strong> - lubisz złożone narracje</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-300"><strong>Długość</strong> - masz dziś wieczór dla siebie</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-300"><strong>Gatunek</strong> - ostatnio oglądałeś thrillery</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-300"><strong>Dostępność</strong> - na Twojej platformie Netflix</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#DFBD69]/10 to-transparent p-6 rounded-lg border border-[#DFBD69]/20">
                <h3 className="text-[#DFBD69] font-semibold mb-3 flex items-center gap-2">
                  🎬 Oscar Context:
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                  "Departed" wygrał po latach prób Scorsese. To jego pierwszy Oscar 
                  za reżyserię mimo legendarnej kariery.
                </p>
              </div>

              <div className="text-center pt-4">
                <button className="bg-[#DFBD69] text-black font-semibold py-3 px-8 rounded-lg hover:bg-[#E8C573] transition-colors flex items-center justify-center gap-2 mx-auto">
                  <Target className="w-5 h-5" />
                  SMART MATCH dla lepszego dopasowania
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickShotModal;