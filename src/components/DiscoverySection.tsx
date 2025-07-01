import React from 'react';
import { Shuffle, FileText, Clock } from 'lucide-react';

interface DiscoverySectionProps {
  onQuickShotClick: () => void;
  onSmartMatchClick: () => void;
  onBrowseByYearsClick: () => void;
}

const DiscoverySection: React.FC<DiscoverySectionProps> = ({ 
  onQuickShotClick, 
  onSmartMatchClick, 
  onBrowseByYearsClick 
}) => {
  const discoveryModes = [
    {
      title: 'Szybki strzał',
      subtitle: 'Losowy zwycięzca Oscara',
      description: 'Nie masz czasu na długie wybieranie? Pozwól nam wybrać za Ciebie jeden z tysięcy nagrodzonych filmów.',
      badge: '30s',
      icon: '/ikona-szybki-strzal.png',
      buttonText: 'Losuj',
      buttonIcon: Shuffle,
      onClick: onQuickShotClick
    },
    {
      title: 'Dopasowany wybór',
      subtitle: 'Kwestionariusz AI',
      description: 'Odpowiedz na kilka pytań o swoich preferencjach, a AI znajdzie filmy idealne dla Ciebie.',
      badge: '2 min',
      icon: '/ikona-kwestionariusz.png',
      buttonText: 'Wypełnij',
      buttonIcon: FileText,
      onClick: onSmartMatchClick
    },
    {
      title: 'Przeszukaj latami',
      subtitle: 'Eksploruj według dekad',
      description: 'Przeglądaj najlepsze filmy z każdej dekady - od początków Hollywood po współczesne arcydzieła.',
      badge: 'Bez limitu',
      icon: '/ikona-dekady.png',
      buttonText: 'Oś czasu',
      buttonIcon: Clock,
      onClick: onBrowseByYearsClick
    }
  ];

  return (
    <section className="py-20 bg-[#070000]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Jak chcesz odkrywać filmy?
          </h2>
          <p className="text-neutral-400 text-lg font-normal max-w-2xl mx-auto">
            Wybierz sposób, który najlepiej odpowiada Twoim potrzebom i znajdź idealny Oscarowy klasyk.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {discoveryModes.map((mode, index) => {
            const ButtonIcon = mode.buttonIcon;
            return (
            <div 
              key={index}
              className="p-6 rounded-xl group relative shadow-lg shadow-black/25 flex flex-col justify-between min-h-[320px]"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(223, 189, 105, 0.15) 100%)',
              }}
            >
              {/* Permanent golden overlay effect - moved to the top so it's behind other elements */}
              <div 
                className="absolute inset-0 rounded-xl opacity-100 pointer-events-none"
                style={{
                  background: 'rgba(223, 189, 105, 0.05)',
                }}
              ></div>
              
              {/* Top section with badge, title, subtitle and description */}
              <div className="relative z-10">
                {/* Time Badge */}
                <div className="mb-4">
                  <span 
                    className="text-white px-3 py-1 rounded-md text-xs font-medium"
                    style={{
                      background: 'rgba(223, 189, 105, 0.08)',
                    }}
                  >
                    {mode.badge}
                  </span>
                </div>
                
                {/* Title and Icon on the same line */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">
                    {mode.title}
                  </h3>
                  <img 
                    src={mode.icon} 
                    alt={`${mode.title} icon`}
                    className="w-12 h-12 opacity-80 group-hover:opacity-100 transition-opacity duration-300 ml-6"
                  />
                </div>
                
                <p className="text-white/80 text-sm font-medium mb-4" style={{ textShadow: 'none' }}>
                  {mode.subtitle}
                </p>
                
                <p className="text-white/60 text-xs font-normal leading-snug" style={{ textShadow: 'none' }}>
                  {mode.description}
                </p>
              </div>
              
              {/* Button at the bottom */}
              <div className="relative z-20">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#DFBD69] text-black hover:bg-[#E8C573] transition-all duration-200 hover:scale-105 w-full justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (mode.onClick) mode.onClick();
                  }}
                >
                  <ButtonIcon className="w-4 h-4" />
                  {mode.buttonText}
                </button>
              </div>
              
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DiscoverySection;