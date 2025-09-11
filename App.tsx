import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { UserRole } from './types';

// Import Providers
import { AuthProvider, useAuth } from './components/contexts/AuthContext';
import { DataProvider, useData } from './components/contexts/DataContext';

// Import all view/page components
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import MemoFicheView from './components/MemoFicheView';
import GeneratorView from './components/GeneratorView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import LandingPage from './components/LandingPage';
import QuizView from './components/QuizView';
import MemoFicheEditor from './components/MemoFicheEditor';
import PricingPage from './components/PricingPage';
import ForgotPasswordView from './components/ForgotPasswordView';
import ResetPasswordView from './components/ResetPasswordView';
import ActivateAccountView from './components/ActivateAccountView';
import ProfileCompletionView from './components/ProfileCompletionView';

// --- ROUTE GUARDS & LAYOUT ---
const AppLayout: React.FC = () => (
  <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
    <Header />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const LoggedInRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuth(); // Need user to check profileIncomplete

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user profile is incomplete and redirect to complete-profile
  // This assumes user object from useAuth() is updated after login with profileIncomplete flag
  if (user && user.profileIncomplete) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <AppLayout />;
};

const AdminRoute: React.FC = () => {
    const { userRole } = useAuth();
    return userRole === UserRole.ADMIN ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

// --- PAGE WRAPPERS (to connect legacy components to new context/router) ---
const DashboardPage = () => {
    const { selectCase } = useData();
    return <Dashboard onSelectCase={selectCase} />
}

const MemoFichePage = () => {
    const { currentCase, startQuiz, goHome, editCase } = useData();
    // In a real app, you would fetch the case based on useParams('id') if not in context
    if (!currentCase) return <Navigate to="/dashboard" replace />;
    return <MemoFicheView caseStudy={currentCase} onStartQuiz={startQuiz} onBack={goHome} onEdit={editCase} />
}

const GeneratorPage = () => {
    const { goHome, saveNewCaseStudy } = useData();
    return <GeneratorView onBack={goHome} onSaveCaseStudy={saveNewCaseStudy} />
}

const QuizPage = () => {
    const { quizQuestions, currentCase, backToMemoFiche } = useData();
    if (!currentCase) return <Navigate to="/dashboard" replace />;
    return <QuizView questions={quizQuestions} caseTitle={currentCase.title} onBack={backToMemoFiche} />
}

const MemoFicheEditorPage = () => {
    const { currentCase, saveEditedCase, backToMemoFiche } = useData();
    if (!currentCase) return <Navigate to="/dashboard" replace />;
    return <MemoFicheEditor initialCaseStudy={currentCase} onSave={saveEditedCase} onCancel={backToMemoFiche} />
}

// --- MAIN APP COMPONENT ---
const App: React.FC = () => (
  <AuthProvider>
    <HashRouter>
        <DataProvider> {/* DataProvider needs to be inside HashRouter to use navigate */}
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginView />} />
                <Route path="/register" element={<RegisterView />} />
                <Route path="/forgot-password" element={<ForgotPasswordView />} />
                <Route path="/reset-password" element={<ResetPasswordView />} />
                <Route path="/activate-account" element={<ActivateAccountView />} />
                <Route path="/complete-profile" element={<ProfileCompletionView />} />
                <Route element={<LoggedInRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/tarifs" element={<PricingPage />} />
                    <Route path="/memofiche/:id" element={<MemoFichePage />} />
                    <Route path="/quiz/:id" element={<QuizPage />} />
                    <Route path="/coach-accueil" element={<div className="container mx-auto p-8">Coach IA Page - Coming Soon</div>} />
                    <Route path="/learner-space" element={<div className="container mx-auto p-8">Learner Space Page - Coming Soon</div>} />
                    <Route path="/fiches" element={<div className="container mx-auto p-8">Mémofiches Page - Coming Soon</div>} />

                    <Route element={<AdminRoute />}>
                        <Route path="/generateur" element={<GeneratorPage />} />
                        <Route path="/edit-memofiche/:id" element={<MemoFicheEditorPage />} />
                    </Route>
                </Route>
            </Routes>
        </DataProvider>
    </HashRouter>
  </AuthProvider>
);

export default App;
