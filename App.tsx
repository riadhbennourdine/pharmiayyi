import React, { useState, useCallback, useEffect } from 'react';
import { ViewState, CaseStudy, UserRole, QuizQuestion } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import MemoFicheView from './components/MemoFicheView';
import GeneratorView from './components/GeneratorView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import LandingPage from './components/LandingPage';
import QuizView from './components/QuizView';
import LoadingView from './components/LoadingView';


type AuthView = 'landing' | 'login' | 'register';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authView, setAuthView] = useState<AuthView>('landing');
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER);
  const [currentCase, setCurrentCase] = useState<CaseStudy | null>(null);
  
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback((identifier: string, password: string) => {
    // Simule une connexion réussie
    // Compte de test admin
    if (identifier.toLowerCase() === 'admin' && password === 'admin') {
        setIsAuthenticated(true);
        setUserRole(UserRole.ADMIN);
        setView(ViewState.DASHBOARD);
    } else if (identifier && password) { // Simule un utilisateur normal
        setIsAuthenticated(true);
        setUserRole(UserRole.USER);
        setView(ViewState.DASHBOARD);
    }
    // On pourrait ajouter un cas d'échec pour des identifiants invalides
  }, []);

  const handleLogout = useCallback(() => {
    // Simule une déconnexion
    setIsAuthenticated(false);
    resetState();
    setAuthView('landing'); // Reset to landing page on logout
  }, []);
  
  const handleRegisterSuccess = useCallback(() => {
    // After successful registration, switch to the login view
    setAuthView('login');
    // You could also add a success message to be displayed on the login screen
  }, []);

  const resetState = () => {
    setCurrentCase(null);
    setQuizQuestions([]);
    setError(null);
    setView(ViewState.DASHBOARD);
  };
  
  const handleSelectCase = useCallback((caseData: CaseStudy) => {
    setCurrentCase(caseData);
    setView(ViewState.MEMO_FICHE);
  }, []);
  
  

  const handleGoHome = useCallback(() => {
    resetState();
  }, []);
  
  const handleNavigateToGenerator = useCallback(() => {
    resetState();
    setView(ViewState.GENERATOR);
  }, []);

  const handleStartQuiz = useCallback(() => {
    if (!currentCase || !currentCase.quiz) return;
    setQuizQuestions(currentCase.quiz);
    setView(ViewState.QUIZ);
  }, [currentCase]);
  
  const handleBackToMemoFiche = useCallback(() => {
    setView(ViewState.MEMO_FICHE);
    setQuizQuestions([]);
  }, []);


  const renderContent = () => {
    switch (view) {
      case ViewState.MEMO_FICHE:
        return currentCase && <MemoFicheView caseStudy={currentCase} onBack={handleGoHome} onStartQuiz={handleStartQuiz} />;
      case ViewState.GENERATOR:
        return <GeneratorView onBack={handleGoHome} onSaveCaseStudy={handleSaveCaseStudy} />;
      case ViewState.QUIZ:
        return currentCase && quizQuestions.length > 0 && (
            <QuizView 
                questions={quizQuestions} 
                caseTitle={currentCase.title}
                onBack={handleBackToMemoFiche} 
            />
        );
      case ViewState.DASHBOARD:
      default:
        return <Dashboard onSelectCase={handleSelectCase} />;
    }
  };

  if (!isAuthenticated) {
    switch (authView) {
      case 'login':
        return <LoginView onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} onGoHome={() => setAuthView('landing')} />;
      case 'register':
        return <RegisterView onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={() => setAuthView('login')} onGoHome={() => setAuthView('landing')} />;
      case 'landing':
      default:
        return <LandingPage onStartLearning={() => setAuthView('login')} />;
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
      <Header 
        userRole={userRole} 
        onSwitchRole={setUserRole} 
        onNavigateToGenerator={handleNavigateToGenerator}
        onGoHome={handleGoHome}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;