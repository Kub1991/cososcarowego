import React, { useState } from 'react';
import { X, Star, Heart, TrendingUp, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signInUser, signUpUser } from '../lib/supabase';

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
  const [showRegister, setShowRegister] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isOpen) return null;

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({
      ...registerData,
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

  const validateRegisterForm = () => {
    if (!registerData.email.trim()) {
      setError('Adres email jest wymagany');
      return false;
    }
    if (!registerData.password.trim()) {
      setError('Hasło jest wymagane');
      return false;
    }
    if (registerData.password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków');
      return false;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setError('Hasła nie są identyczne');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await signUpUser(registerData.email, registerData.password, registerData.fullName);
      
      if (result.error) {
        if (result.error.message.includes('already registered')) {
          setError('Ten adres email jest już zarejestrowany');
        } else {
          setError(result.error.message);
        }
      } else {
        // Success - user will be redirected by App.tsx auth state change
        console.log('User registered successfully:', result.user);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (err) {
      setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setShowLogin(false);
    setShowRegister(false);
    setLoginData({ email: '', password: '' });
    setRegisterData({ email: '', password: '', confirmPassword: '', fullName: '' });
    setError(null);
    setIsLoading(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-auto overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 z-10 p-2 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main Content Container */}
        <div 
          className="p-8 md:p-12 md:rounded-2xl md:border md:border-neutral-700"
          style={{
            background: '#0a0a0a',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#DFBD69]/20 flex items-center justify-center">
              <Star className="w-8 h-8 text-[#DFBD69]" />
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {showLogin ? 'Zaloguj się do konta' : showRegister ? 'Utwórz nowe konto' : 'Rozpocznij swoją Oscarową podróż!'}
            </h2>
            <p className="text-neutral-300">
              {showLogin 
                ? 'Wprowadź swoje dane logowania' 
                : showRegister
                ? 'Wypełnij formularz, aby utworzyć konto'
                : `Aby korzystać z ${featureName}, utwórz darmowe konto i odkryj pełnię możliwości naszej platformy.`
              }
            </p>
          </div>

          {!showLogin && !showRegister ? (
            // Registration/Benefits View
            <>
              {/* Benefits */}
              <div className="space-y-4 mb-8">
                <div className="space-y-3">
                  <div 
                    className="flex items-center gap-3 p-4 rounded-lg border border-neutral-700"
                    style={{
                      background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                    }}
                  >
                    <Heart className="w-5 h-5 text-[#DFBD69] flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium text-sm">Osobiste listy filmów</h4>
                      <p className="text-neutral-400 text-xs">Twórz i zarządzaj swoimi listami do obejrzenia</p>
                    </div>
                  </div>
                  
                  <div 
                    className="flex items-center gap-3 p-4 rounded-lg border border-neutral-700"
                    style={{
                      background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                    }}
                  >
                    <TrendingUp className="w-5 h-5 text-[#DFBD69] flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium text-sm">Śledź swój postęp</h4>
                      <p className="text-neutral-400 text-xs">Monitoruj swoją podróż przez historię kina</p>
                    </div>
                  </div>
                  
                  <div 
                    className="flex items-center gap-3 p-4 rounded-lg border border-neutral-700"
                    style={{
                      background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                    }}
                  >
                    <Star className="w-5 h-5 text-[#DFBD69] flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium text-sm">Spersonalizowane rekomendacje</h4>
                      <p className="text-neutral-400 text-xs">Otrzymuj lepsze sugestie na podstawie preferencji</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={() => setShowRegister(true)}
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
          ) : showLogin ? (
            // Login Form View
            <>
              {error && (
                <div className="mb-8 p-4 bg-red-600/20 border border-red-600/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleLogin} className="space-y-8">
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
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowLogin(false)}
                  className="text-neutral-400 hover:text-[#DFBD69] transition-colors text-sm"
                >
                  ← Powrót do rejestracji
                </button>
              </div>
            </>
          ) : (
            // Registration Form View
            <>
              {error && (
                <div className="mb-8 p-4 bg-red-600/20 border border-red-600/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleRegister} className="space-y-8">
                <div>
                  <label htmlFor="register-fullname" className="block text-sm font-medium text-white mb-3">
                    Imię i nazwisko
                  </label>
                  <input
                    type="text"
                    id="register-fullname"
                    name="fullName"
                    value={registerData.fullName}
                    onChange={handleRegisterInputChange}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-[#070000] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-[#DFBD69] focus:outline-none transition-colors duration-200 font-normal disabled:opacity-50"
                    placeholder="Jan Kowalski"
                  />
                </div>
                
                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-white mb-3">
                    Adres email
                  </label>
                  <input
                    type="email"
                    id="register-email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterInputChange}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-[#070000] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-[#DFBD69] focus:outline-none transition-colors duration-200 font-normal disabled:opacity-50"
                    placeholder="jan@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium text-white mb-3">
                    Hasło
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="register-password"
                      name="password"
                      value={registerData.password}
                      onChange={handleRegisterInputChange}
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
                  <label htmlFor="register-confirm-password" className="block text-sm font-medium text-white mb-3">
                    Potwierdź hasło
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="register-confirm-password"
                      name="confirmPassword"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterInputChange}
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
                  className="w-full bg-[#DFBD69] text-black font-semibold py-4 rounded-lg hover:bg-[#E8C573] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Rejestracja...
                    </>
                  ) : (
                    'Zarejestruj się'
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => {
                    setShowRegister(false);
                    setShowLogin(true);
                  }}
                  className="text-neutral-400 hover:text-[#DFBD69] transition-colors text-sm"
                >
                  Masz już konto? Zaloguj się
                </button>
              </div>
              
              {/* Back to Benefits */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setShowRegister(false);
                    setShowLogin(false);
                  }}
                  className="text-neutral-400 hover:text-[#DFBD69] transition-colors text-sm"
                >
                  ← Powrót
                </button>
              </div>
            </>
          )}

          {/* Footer Note */}
          <p className="text-neutral-500 text-xs text-center pt-8">
            Darmowe na zawsze • Bez ukrytych opłat • Anuluj w każdej chwili
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPromptModal;