import React from 'react';
import { X, Star, Heart, TrendingUp } from 'lucide-react';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

const AuthPromptModal: React.FC<AuthPromptModalProps> = ({ 
  isOpen, 
  onClose, 
  featureName = "tej funkcji" 
}) => {
  if (!isOpen) return null;

  const scrollToBucketList = () => {
    onClose();
    // Scroll to the bucket list section
    const bucketListSection = document.querySelector('[data-section="bucket-list"]');
    if (bucketListSection) {
      bucketListSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-auto bg-[#1a1c1e] rounded-2xl border border-neutral-700 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div 
          className="p-8 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
          }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#DFBD69]/20 flex items-center justify-center">
            <Star className="w-8 h-8 text-[#DFBD69]" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">
            Rozpocznij swoją Oscarową podróż!
          </h2>
          <p className="text-neutral-300 text-sm">
            Aby korzystać z {featureName}, utwórz darmowe konto i odkryj pełnię możliwości naszej platformy.
          </p>
        </div>

        {/* Benefits */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50">
              <Heart className="w-5 h-5 text-[#DFBD69] flex-shrink-0" />
              <div>
                <h4 className="text-white font-medium text-sm">Osobiste listy filmów</h4>
                <p className="text-neutral-400 text-xs">Twórz i zarządzaj swoimi listami do obejrzenia</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50">
              <TrendingUp className="w-5 h-5 text-[#DFBD69] flex-shrink-0" />
              <div>
                <h4 className="text-white font-medium text-sm">Śledź swój postęp</h4>
                <p className="text-neutral-400 text-xs">Monitoruj swoją podróż przez historię kina</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50">
              <Star className="w-5 h-5 text-[#DFBD69] flex-shrink-0" />
              <div>
                <h4 className="text-white font-medium text-sm">Spersonalizowane rekomendacje</h4>
                <p className="text-neutral-400 text-xs">Otrzymuj lepsze sugestie na podstawie preferencji</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={scrollToBucketList}
              className="w-full bg-[#DFBD69] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#E8C573] transition-colors"
            >
              Utwórz darmowe konto
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-transparent border border-neutral-600 text-white font-medium py-3 px-6 rounded-lg hover:border-neutral-500 transition-colors"
            >
              Może później
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-neutral-500 text-xs text-center pt-2">
            Darmowe na zawsze • Bez ukrytych opłat • Anuluj w każdej chwili
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPromptModal;