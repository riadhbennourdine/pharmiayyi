import React from 'react';
import { LogoIcon, SparklesIcon } from './icons';
import { UserRole } from '../types';

interface HeaderProps {
  userRole: UserRole;
  isAuthenticated: boolean;
  onSwitchRole: (role: UserRole) => void;
  onNavigateToGenerator: () => void;
  onGoHome: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ userRole, isAuthenticated, onSwitchRole, onNavigateToGenerator, onGoHome, onLogout }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <button onClick={onGoHome} className="flex items-center" aria-label="Retour à l'accueil">
          <LogoIcon className="h-8 w-8 text-teal-600 mr-3" />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Pharm<span className="text-teal-600">IA</span>
          </h1>
        </button>
        <div className="flex items-center space-x-4">
          {isAuthenticated && userRole === UserRole.ADMIN && (
            <button 
              onClick={onNavigateToGenerator} 
              className="hidden sm:inline-flex items-center bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors duration-200"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              Générateur
            </button>
          )}
          {isAuthenticated && (
            <>
              <div className="relative">
                <select 
                  onChange={(e) => onSwitchRole(e.target.value as UserRole)} 
                  value={userRole} 
                  className="appearance-none bg-white border border-slate-300 rounded-md py-2 pl-3 pr-8 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  aria-label="Changer de rôle utilisateur"
                >
                  <option value={UserRole.USER}>Utilisateur</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="text-sm font-semibold bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors duration-200"
              >
                Déconnexion
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;