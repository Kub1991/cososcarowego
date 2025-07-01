import React, { useState, useEffect } from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface HeaderProps {
  isAuthenticated?: boolean;
  user?: SupabaseUser | null;
  onGoToDashboard?: () => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  isAuthenticated = false, 
  user, 
  onGoToDashboard, 
  onLogout 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        
        // Show navbar when scrolling up or at top
        if (currentScrollY < lastScrollY || currentScrollY < 10) {
          setIsVisible(true);
        } else {
          // Hide navbar when scrolling down
          setIsVisible(false);
        }
        
        setLastScrollY(currentScrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => window.removeEventListener('scroll', controlNavbar);
    }
  }, [lastScrollY]);

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Użytkownik';
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 w-full bg-white/5 backdrop-blur-lg border-b border-white/10 shadow-lg shadow-black/25 transition-transform duration-300 ease-in-out ${
        isVisible ? 'transform translate-y-0' : 'transform -translate-y-full'
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderImage: 'linear-gradient(90deg, transparent, rgba(223, 189, 105, 0.3), transparent) 1'
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Coś Oscarowego Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-bold text-white drop-shadow-sm">Coś Oscarowego</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#quick-shot" className="text-sm font-medium text-white/80 hover:text-[#DFBD69] transition-colors duration-200 drop-shadow-sm">
              Szybki strzał
            </a>
            <a href="#personalized" className="text-sm font-medium text-white/80 hover:text-[#DFBD69] transition-colors duration-200 drop-shadow-sm">
              Dopasowany wybór
            </a>
            <a href="#browse-years" className="text-sm font-medium text-white/80 hover:text-[#DFBD69] transition-colors duration-200 drop-shadow-sm">
              Przeszukaj lata
            </a>
            <a href="#mood-filter" className="text-sm font-medium text-white/80 hover:text-[#DFBD69] transition-colors duration-200 drop-shadow-sm">
              Czego potrzebujesz?
            </a>
            
            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#DFBD69]/20 text-[#DFBD69] hover:bg-[#DFBD69]/30 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{getUserDisplayName()}</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-12 w-48 bg-[#1a1c1e] rounded-lg border border-neutral-700 shadow-lg py-2 z-50">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onGoToDashboard?.();
                      }}
                      className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700 transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Panel użytkownika
                    </button>
                    <hr className="border-neutral-700 my-1" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout?.();
                      }}
                      className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Wyloguj się
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onGoToDashboard}
                className="px-4 py-2 rounded-lg bg-[#DFBD69] text-black font-medium hover:bg-[#E8C573] transition-colors text-sm"
              >
                Zaloguj się
              </button>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white/80 hover:text-[#DFBD69] transition-colors duration-200"
          >
            <Menu className="w-6 h-6" />
          </button>
        </nav>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10">
            <nav className="flex flex-col gap-4 pt-4">
              <a 
                href="#quick-shot" 
                className="text-sm font-medium text-white/80 hover:text-[#DFBD69] transition-colors duration-200 drop-shadow-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Szybki strzał
              </a>
              <a 
                href="#personalized" 
                className="text-sm font-medium text-white/80 hover:text-[#DFBD69] transition-colors duration-200 drop-shadow-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dopasowany wybór
              </a>
              <a 
                href="#browse-years" 
                className="text-sm font-medium text-white/80 hover:text-[#DFBD69] transition-colors duration-200 drop-shadow-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Przeszukaj lata
              </a>
              <a 
                href="#mood-filter" 
                className="text-sm font-medium text-white/80 hover:text-[#DFBD69] transition-colors duration-200 drop-shadow-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Czego potrzebujesz?
              </a>
              
              {isAuthenticated && user ? (
                <>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onGoToDashboard?.();
                    }}
                    className="text-sm font-medium text-[#DFBD69] hover:text-white transition-colors duration-200 text-left"
                  >
                    Panel użytkownika
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout?.();
                    }}
                    className="text-sm font-medium text-white/80 hover:text-[#DFBD69] transition-colors duration-200 text-left"
                  >
                    Wyloguj się
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onGoToDashboard?.();
                  }}
                  className="text-sm font-medium text-[#DFBD69] hover:text-white transition-colors duration-200 text-left"
                >
                  Zaloguj się
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;