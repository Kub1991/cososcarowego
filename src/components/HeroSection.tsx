import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-center md:bg-[0%_-30%] bg-cover bg-no-repeat"
        style={{
          backgroundImage: 'url("/hero-background-v2.jpg")'
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#070000] to-transparent"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20">
        <div className="text-center space-y-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
            Filmy warte <span className="text-[#DFBD69]">Twojego czasu</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-neutral-300 max-w-3xl mx-auto leading-relaxed font-light">
            Inteligentne rekomendacje Oscarowych klasyków<br className="hidden md:block" />
            dopasowane do Twojego oczekiwania.
          </p>
          
          <div className="pt-4">
            <button className="inline-flex items-center justify-center bg-[#DFBD69] text-black px-10 py-5 rounded-xl font-semibold text-lg hover:bg-[#E8C573] transition-all duration-300 transform hover:scale-105 shadow-lg">
              Odkryj swój następny film
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;