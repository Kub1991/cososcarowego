import React, { useState } from 'react';
import { Star, Heart, TrendingUp, Target, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { signUpUser } from '../lib/supabase';

interface RegistrationSectionProps {
  onRegistrationSuccess?: () => void;
}

const RegistrationSection: React.FC<RegistrationSectionProps> = ({ onRegistrationSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Adres email jest wymagany');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Hasło jest wymagane');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie są identyczne');
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
      const result = await signUpUser(formData.email, formData.password, formData.fullName);
      
      if (result.error) {
        if (result.error.message.includes('already registered')) {
          setError('Ten adres email jest już zarejestrowany');
        } else {
          setError(result.error.message);
        }
      } else {
        setSuccess(true);
        setFormData({ email: '', password: '', confirmPassword: '', fullName: '' });
        if (onRegistrationSuccess) {
          onRegistrationSuccess();
        }
      }
    } catch (err) {
      setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    {
      icon: Heart,
      title: 'Osobiste listy filmów',
      description: 'Twórz i zarządzaj swoimi listami do obejrzenia'
    },
    {
      icon: TrendingUp,
      title: 'Śledź swój postęp',
      description: 'Monitoruj swoją podróż przez historię kina'
    },
    {
      icon: Target,
      title: 'Lepsze rekomendacje',
      description: 'Otrzymuj sugestie dopasowane do Twoich preferencji'
    },
    {
      icon: Star,
      title: 'Osiągnięcia i nagrody',
      description: 'Zdobywaj odznaki za oglądanie filmów oscarowych'
    }
  ];

  if (success) {
    return (
      <section className="py-20 bg-[#070000]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <div 
              className="max-w-2xl mx-auto p-8 rounded-2xl border border-neutral-700"
              style={{
                background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
              }}
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-600 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Witaj w Oscarowej społeczności!
              </h2>
              <p className="text-neutral-300 text-lg mb-6">
                Twoje konto zostało utworzone. Możesz teraz rozpocząć swoją kinową podróż i odkrywać najlepsze filmy w historii.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-[#DFBD69] text-black font-semibold py-3 px-8 rounded-lg hover:bg-[#E8C573] transition-colors"
                >
                  Rozpocznij odkrywanie
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:pt-8 md:pb-20 bg-[#070000]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Side - UVP and Benefits */}
          <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 lg:mb-6">
                Rozpocznij swoją <span className="text-[#DFBD69]">Oscarową podróż</span>
              </h2>
              <p className="text-neutral-400 text-base lg:text-lg leading-relaxed mb-6 lg:mb-8">
                Dołącz do tysięcy miłośników kina, którzy odkrywają najlepsze filmy w historii dzięki naszym inteligentnym rekomendacjom.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <div 
                    key={index}
                    className="p-3 lg:p-4 rounded-lg border border-neutral-700"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(223, 189, 105, 0.15) 100%)',
                    }}
                  >
                    <div className="flex items-start gap-2 lg:gap-3">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-[#DFBD69]/20 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-4 h-4 lg:w-5 lg:h-5 text-[#DFBD69]" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-xs lg:text-sm mb-1">
                          {benefit.title}
                        </h3>
                        <p className="text-neutral-400 text-xs leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-4 lg:gap-6 pt-2 lg:pt-4">
              <div className="flex items-center gap-1 lg:gap-2">
                <span className="text-white font-semibold text-base lg:text-lg">10,000+</span>
                <span className="text-neutral-400 text-sm">użytkowników</span>
              </div>
              <div className="flex items-center gap-1 lg:gap-2">
                <span className="text-white font-semibold text-base lg:text-lg">145</span>
                <span className="text-neutral-400 text-sm">filmów oscarowych</span>
              </div>
              <div className="flex items-center gap-1 lg:gap-2">
                <span className="text-white font-semibold text-base lg:text-lg">95</span>
                <span className="text-neutral-400 text-sm">lat historii</span>
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="order-1 lg:order-2">
            <div 
              className="p-6 lg:p-8 rounded-xl lg:rounded-2xl border border-neutral-700"
              style={{
                background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
              }}
            >
              <div className="text-center mb-6 lg:mb-8">
                <div className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 lg:mb-4 rounded-full bg-[#DFBD69]/20 flex items-center justify-center">
                  <Star className="w-5 h-5 lg:w-6 lg:h-6 text-[#DFBD69]" />
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-white mb-2">
                  Utwórz darmowe konto
                </h3>
                <p className="text-neutral-300 text-sm">
                  Zacznij odkrywać najlepsze filmy w historii kina
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-white mb-2 lg:mb-3">
                    Imię i nazwisko
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-[#070000] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-[#DFBD69] focus:outline-none transition-colors duration-200 font-normal disabled:opacity-50"
                    placeholder="Jan Kowalski"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2 lg:mb-3">
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
                  <label htmlFor="password" className="block text-sm font-medium text-white mb-2 lg:mb-3">
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

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2 lg:mb-3">
                    Potwierdź hasło
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="w-full px-4 py-3 pr-12 bg-[#070000] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-[#DFBD69] focus:outline-none transition-colors duration-200 font-normal disabled:opacity-50"
                      placeholder="Powtórz hasło"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#DFBD69] text-black font-semibold py-3 lg:py-4 rounded-lg hover:bg-[#E8C573] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

              <p className="text-neutral-500 text-xs text-center mt-4 lg:mt-6">
                Darmowe na zawsze • Bez ukrytych opłat • Anuluj w każdej chwili
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegistrationSection;