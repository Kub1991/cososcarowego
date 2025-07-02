import React, { useState } from 'react';
import { X, Star, Heart, TrendingUp, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signInUser } from '../lib/supabase';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  onLoginSuccess?: () => void;
}

const AuthPromptModal: React.FC<AuthPromptModalProps> = ({ 
  isOpen, 
  onClose, 
  featureName = "tej funkcji",
  onLoginSuccess
}) => {
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const validateLoginForm = () => {
    if (!loginData.email.trim()) {
      setError('Adres email jest wymagany');
      return false;
    }
    if (!loginData.password.trim()) {
      setError('Hasło jest wymagane');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLoginForm()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInUser(loginData.email, loginData.password);
      
      if (result.error) {
        if (result.error.message.includes('Invalid login credentials')) {
          setError('Nieprawidłowy email lub hasło');
        } else {
          setError(result.error.message);
        }
      } else {
        // Success - user will be redirected by App.tsx auth state change
        console.log('User logged in successfully:', result.user);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (err) {
      setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setShowLogin(false);
    setLoginData({ email: '', password: '' });
    setError(null);
    setIsLoading(false);
    setShowPassword(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-auto bg-[#1a1c1e] rounded-2xl border border-neutral-700 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
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
            {showLogin ? 'Zaloguj się do konta' : 'Rozpocznij swoją Oscarową podróż!'}
          </h2>
          <p className="text-neutral-300 text-sm">
            {showLogin 
              ? 'Wprowadź swoje dane logowania' 
              : `Aby korzystać z ${featureName}, utwórz darmowe konto i odkryj pełnię możliwości naszej platformy.`
            }
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showLogin ? (
            // Registration/Benefits View
            <>
              {/* Benefits */}
              <div className="space-y-4 mb-6">
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
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={onClose}
                  className="w-full bg-[#DFBD69] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#E8C573] transition-colors"
                >
                  Utwórz darmowe konto
                </button>
                
                <button
                  onClick={() => setShowLogin(true)}
                  className="w-full bg-transparent border border-[#DFBD69] text-[#DFBD69] font-medium py-3 px-6 rounded-lg hover:bg-[#DFBD69]/10 transition-colors"
                >
                  Zaloguj się
                </button>
                
                <button
                  onClick={handleClose}
                  className="w-full bg-transparent border border-neutral-600 text-white font-medium py-3 px-6 rounded-lg hover:border-neutral-500 transition-colors"
                >
                  Może później
                </button>
              </div>
            </>
          ) : (
            // Login Form View
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-white mb-3">
                    Adres email
                  </label>
                  <input
                    type="email"
                    id="login-email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginInputChange}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-[#070000] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-[#DFBD69] focus:outline-none transition-colors duration-200 font-normal disabled:opacity-50"
                    placeholder="jan@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-white mb-3">
                    Hasło
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="login-password"
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginInputChange}
                      disabled={isLoading}
                      className="w-full px-4 py-3 pr-12 bg-[#070000] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-[#DFBD69] focus:outline-none transition-colors duration-200 font-normal disabled:opacity-50"
                      placeholder="Twoje hasło"
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
                      Logowanie...
                    </>
                  ) : (
                    'Zaloguj się'
                  )}
                </button>
              </form>

              {/* Back to Registration */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowLogin(false)}
                  className="text-neutral-400 hover:text-[#DFBD69] transition-colors text-sm"
                >
                  ← Powrót do rejestracji
                </button>
              </div>
            </>
          )}

          {/* Footer Note */}
          <p className="text-neutral-500 text-xs text-center pt-6">
            Darmowe na zawsze • Bez ukrytych opłat • Anuluj w każdej chwili
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPromptModal;