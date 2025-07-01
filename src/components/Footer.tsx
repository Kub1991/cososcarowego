import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0a0a0a]">
      {/* Gradientowy separator zamiast border-t */}
      <div className="bg-[#070000]">
        <div className="max-w-6xl mx-auto px-6">
          <div 
            className="h-px w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(223, 189, 105, 0.3), transparent)'
            }}
          ></div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Left Section - Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white">Coś oscarowego</span>
            </div>
            
            <p className="text-neutral-400 text-sm font-normal leading-relaxed max-w-sm">
              Odkrywaj najlepsze filmy w historii kina dzięki 
              inteligentnym rekomendacjom opartym na Oscarowych 
              nominacjach i zwycięstwach.
            </p>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">10,000+</span>
                <span className="text-neutral-400 text-xs">filmów</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">95</span>
                <span className="text-neutral-400 text-xs">lat historii</span>
              </div>
            </div>
          </div>
          
          {/* Middle Section - Discover */}
          <div className="space-y-6">
            <h3 className="text-white font-semibold text-lg">Odkrywaj</h3>
            <nav className="space-y-3">
              <a href="#best-movies" className="block text-neutral-400 text-sm font-normal hover:text-[#DFBD69] transition-colors duration-200">
                Najlepsze filmy
              </a>
              <a href="#by-decades" className="block text-neutral-400 text-sm font-normal hover:text-[#DFBD69] transition-colors duration-200">
                Według dekad
              </a>
              <a href="#by-genres" className="block text-neutral-400 text-sm font-normal hover:text-[#DFBD69] transition-colors duration-200">
                Według gatunków
              </a>
              <a href="#directors" className="block text-neutral-400 text-sm font-normal hover:text-[#DFBD69] transition-colors duration-200">
                Reżyserzy
              </a>
            </nav>
          </div>
          
          {/* Right Section - About */}
          <div className="space-y-6">
            <h3 className="text-white font-semibold text-lg">O nas</h3>
            <nav className="space-y-3">
              <a href="#how-it-works" className="block text-neutral-400 text-sm font-normal hover:text-[#DFBD69] transition-colors duration-200">
                Jak działamy
              </a>
              <a href="#contact" className="block text-neutral-400 text-sm font-normal hover:text-[#DFBD69] transition-colors duration-200">
                Kontakt
              </a>
              <a href="#privacy" className="block text-neutral-400 text-sm font-normal hover:text-[#DFBD69] transition-colors duration-200">
                Polityka prywatności
              </a>
              <a href="#terms" className="block text-neutral-400 text-sm font-normal hover:text-[#DFBD69] transition-colors duration-200">
                Regulamin
              </a>
            </nav>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-neutral-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-neutral-500 text-sm font-normal">
              © 2025 Coś oscarowego. Wszystkie prawa zastrzeżone.
            </p>
            <p className="text-neutral-500 text-sm font-normal">
              Stworzone dla miłośników kina klasycznego
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;