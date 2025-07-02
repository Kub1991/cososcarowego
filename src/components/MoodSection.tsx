import React from 'react';

interface MoodSectionProps {
  onMoodClick?: (mood: string) => void;
}

const MoodSection: React.FC<MoodSectionProps> = ({ onMoodClick }) => {
  const moods = [
    {
      id: 'Inspiracja',
      name: 'Inspiracja',
      image: '/inspiracja.jpg'
    },
    {
      id: 'Adrenalina',
      name: 'Adrenalina',
      image: '/adrenalina.jpg'
    },
    {
      id: 'Głębokie emocje',
      name: 'Głębokie emocje',
      image: '/glebokie-emocje.jpg'
    },
    {
      id: 'Humor',
      name: 'Humor',
      image: '/humor.jpg'
    },
    {
      id: 'Coś ambitnego',
      name: 'Coś ambitnego',
      image: '/cos-ambitnego.jpg'
    },
    {
      id: 'Romantyczny wieczór',
      name: 'Romantyczny wieczór',
      image: '/romantyczny-wieczor.jpg'
    }
  ];

  const handleMoodClick = (mood: string) => {
    if (onMoodClick) {
      onMoodClick(mood);
    }
  };

  return (
    <section className="py-20 bg-[#070000]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Czego dzisiaj potrzebujesz?
          </h2>
          <p className="text-neutral-400 text-lg font-normal max-w-3xl mx-auto leading-relaxed">
            Wybierz nastrój, a my znajdziemy idealny Oscarowy klasyk<br />
            dopasowany do Twojego stanu ducha.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {moods.map((mood, index) => (
            <button
              key={index}
              onClick={() => handleMoodClick(mood.id)}
              className="group relative bg-[#1a1c1e] text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 border border-neutral-700 hover:border-transparent overflow-hidden h-64"
            >
              {/* Background Image - Always Visible */}
              <div 
                className="absolute inset-0 transition-all duration-300 ease-out group-hover:scale-110"
                style={{
                  backgroundImage: `url(${mood.image})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20 group-hover:from-black/70 group-hover:via-black/20 group-hover:to-black/10 transition-all duration-300"></div>
              </div>
              
              {/* Mood Name at Bottom */}
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <h3 className="text-white text-xl font-bold text-left drop-shadow-lg">
                  {mood.name}
                </h3>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-[#DFBD69]/0 group-hover:bg-[#DFBD69]/10 transition-all duration-300"></div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MoodSection;