import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { UserRole } from '../types';

const Header: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium px-3 py-2 rounded-md transition-colors ${
      isActive
        ? 'text-teal-600 font-semibold'
        : 'text-gray-500 hover:text-teal-600'
    }`;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const LoggedOutLinks: React.FC<{isMobile?: boolean}> = ({ isMobile }) => (
    <>
        <NavLink to="/" className={navLinkClass} onClick={() => isMobile && setIsMenuOpen(false)} end>
            Accueil
        </NavLink>
        <NavLink to="/tarifs" className={navLinkClass} onClick={() => isMobile && setIsMenuOpen(false)}>
            Tarifs
        </NavLink>
        <NavLink to="/connexion" className={navLinkClass} onClick={() => isMobile && setIsMenuOpen(false)}>
            Connexion
        </NavLink>
    </>
  );

  const LoggedInLinks: React.FC<{isMobile?: boolean}> = ({ isMobile }) => (
      <>
        <NavLink to="/dashboard" className={navLinkClass} onClick={() => isMobile && setIsMenuOpen(false)}>
            Mémofiches
        </NavLink>
        <NavLink to="/tarifs" className={navLinkClass} onClick={() => isMobile && setIsMenuOpen(false)}>
            Tarifs
        </NavLink>
        {isAdmin && (
            <NavLink to="/generateur" className={navLinkClass} onClick={() => isMobile && setIsMenuOpen(false)}>
            Générateur
            </NavLink>
        )}
        <NavLink to="/learner-space" className={navLinkClass} onClick={() => isMobile && setIsMenuOpen(false)}>
            Mon espace
        </NavLink>
        <button onClick={() => { handleLogout(); isMobile && setIsMenuOpen(false); }} className="text-sm font-medium px-3 py-2 rounded-md transition-colors text-gray-500 hover:text-teal-600">
            Déconnexion
        </button>
      </>
  );

  return (
    <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 h-16 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold">
            <span className="animated-gradient-text font-extrabold text-transparent">PharmIA</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {isAuthenticated ? <LoggedInLinks /> : <LoggedOutLinks />}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-500 hover:text-teal-600 focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200" ref={menuRef}>
          <nav className="flex flex-col space-y-1 px-2 pt-2 pb-3">
            {isAuthenticated ? <LoggedInLinks isMobile={true} /> : <LoggedOutLinks isMobile={true} />}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;