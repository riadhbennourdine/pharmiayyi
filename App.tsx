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
import MemoFicheEditor from './components/MemoFicheEditor';


type AuthView = 'landing' | 'login' | 'register';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authView, setAuthView] = useState<AuthView>('landing');
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER);
  const [currentCase, setCurrentCase] = useState<CaseStudy | null>(null);
  
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Nouvelle fonction pour passer en mode édition
  const handleEditCase = useCallback(() => {
    setView(ViewState.EDIT_MEMO_FICHE);
  }, []);

  // Nouvelle fonction pour sauvegarder les modifications d'une mémofiche
  const handleSaveEditedCase = useCallback(async (editedCase: CaseStudy) => {
    try {
      const method = editedCase._id ? 'PUT' : 'POST'; // PUT pour mise à jour, POST pour nouvelle création
      const url = editedCase._id ? `/api/memofiches/${editedCase._id}` : '/api/memofiches';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedCase),
      });

      if (!response.ok) {
        throw new Error(`Failed to save memo fiche: ${response.statusText}`);
      }

      const savedCase = await response.json();
      alert('Mémofiche sauvegardée avec succès !');
      setCurrentCase(savedCase); // Mettre à jour le cas courant avec la version sauvegardée
      setView(ViewState.MEMO_FICHE); // Revenir à la vue de la mémofiche
    } catch (err) {
      console.error('Error saving memo fiche:', err);
      setError('Erreur lors de la sauvegarde de la mémofiche.');
    }
  }, []);

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

  const handleSaveCaseStudy = useCallback(async (caseStudy: CaseStudy) => {
    try {
      const response = await fetch('/api/memofiches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseStudy),
      });

      if (!response.ok) {
        throw new Error('Failed to save memo fiche');
      }

      // Optionally, show a success message
      alert('Mémofiche sauvegardée avec succès !');
      setView(ViewState.DASHBOARD); // Go back to dashboard after saving
    } catch (err) {
      console.error('Error saving memo fiche:', err);
      setError('Erreur lors de la sauvegarde de la mémofiche.');
    }
  }, []);


  const renderContent = () => {
    switch (view) {
      case ViewState.MEMO_FICHE:
        return currentCase && <MemoFicheView caseStudy={currentCase} onBack={handleGoHome} onStartQuiz={handleStartQuiz} onEdit={handleEditCase} />;
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
      case ViewState.EDIT_MEMO_FICHE: // Nouveau cas pour l'édition
        return currentCase && <MemoFicheEditor initialCaseStudy={currentCase} onSave={handleSaveEditedCase} onCancel={() => setView(ViewState.MEMO_FICHE)} />;
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