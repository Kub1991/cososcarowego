import React, { useState } from 'react';
import { Check, Trophy, Star, Users, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase, signUpUser } from '../lib/supabase';

interface BucketListSectionProps {
  isAuthenticated?: boolean;
}

const BucketListSection: React.FC<BucketListSectionProps> = ({ isAuthenticated = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const features = [
    {
      icon: Check,
      title: 'Własne Oscarowe listy',
      description: 'Twórz i zarządzaj swoimi listami filmów do obejrzenia'
    },
    {
      icon: Trophy,
      title: 'Challenge dekad',
      description: 'Podejmij wyzwanie obejrzenia najlepszych filmów z każdej dekady'
    },
    {
      icon: Star,
      title: 'Spersonalizowane sugestie',
      description: 'Otrzymuj rekomendacje bazujące na Twoich wcześniejszych wyborach'
    },
    {
      icon: Users,
      title: 'Społeczność kinomanów',
      description: 'Dziel się swoimi listami i odkryj co oglądają inni'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Imię i nazwisko są wymagane');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Adres email jest wymagany');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await signUpUser(formData.email, formData.password, formData.name);
      
      if (result.error) {
        if (result.error.message.includes('already registered')) {
          setError('Ten adres email jest już zarejestrowany. Spróbuj się zalogować.');
        } else {
          setError(result.error.message);
        }
      } else {
        // Success - user will be redirected to dashboard by App.tsx auth state change
        console.log('User registered successfully:', result.user);
      }
    } catch (err) {
      setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <section className="py-20 bg-[#070000]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <div 
              className="inline-flex items-center gap-3 px-8 py-6 rounded-xl border border-[#DFBD69]/30"
              style={{
                background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
              }}
            >
              <Check className="w-8 h-8 text-[#DFBD69]" />
              <div className="text-left">
                <h3 className="text-white font-bold text-xl">Jesteś już zalogowany!</h3>
                <p className="text-neutral-300">Korzystaj z pełni możliwości platformy</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-[#070000]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Side - Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Stwórz Oscarową<br />
              <span className="text-[#DFBD69]">Bucket Listę</span>
            </h2>
            
            <p className="text-neutral-400 text-lg font-normal mb-12 leading-relaxed">
              Twórz własne listy, podejmuj wyzwania filmowe i 
              otrzymuj spersonalizowane rekomendacje bazujące na 
              Twoich preferencjach.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex flex-col p-6 rounded-lg border border-neutral-800 h-40"
                    style={{
                      background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                    }}
                  >
                    <div className="text-[#DFBD69] mb-3">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-white font-semibold mb-3 text-sm leading-tight">
                        {feature.title}
                      </h3>
                      <p className="text-neutral-400 text-xs font-normal leading-relaxed flex-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Right Side - Form */}
        <div className="p-8 rounded-xl border border-neutral-800 flex flex-col justify-between lg:min-h-[600px]"
          style={{
            background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
          }}
        >
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 text-center">
                Rozpocznij swoją przygodę
              </h3>
              <p className="text-neutral-400 font-normal mb-8 text-center text-sm">
                Dołącz do tysięcy kinomanów już dziś
              </p>
              
              {error && (
                <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white mb-3">
                    Imię i nazwisko
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-[#070000] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-[#DFBD69] focus:outline-none transition-colors duration-200 font-normal disabled:opacity-50"
                    placeholder="Jan Kowalski"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-3">
                    Adres email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-[#070000] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-[#DFBD69] focus:outline-none transition-colors duration-200 font-normal disabled:opacity-50"
                    placeholder="jan@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white mb-3">
                    Hasło
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="w-full px-4 py-3 pr-12 bg-[#070000] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-[#DFBD69] focus:outline-none transition-colors duration-200 font-normal disabled:opacity-50"
                      placeholder="Minimum 6 znaków"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#DFBD69] text-black font-semibold py-4 rounded-lg hover:bg-[#E8C573] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Tworzenie konta...
                    </>
                  ) : (
                    'Utwórz darmowe konto'
                  )}
                </button>
              </form>
            </div>
            
            <p className="text-neutral-500 text-xs font-normal text-center leading-relaxed mt-6">
              Darmowe na zawsze • Bez ukrytych opłat • Anuluj w każdej chwili
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BucketListSection;