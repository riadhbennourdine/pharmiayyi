import React, { useState, useCallback, createContext, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaseStudy, QuizQuestion } from '../../types'; // Adjusted path for nesting

// --- DATA CONTEXT ---
interface DataContextType {
  currentCase: CaseStudy | null;
  quizQuestions: QuizQuestion[];
  selectCase: (caseData: CaseStudy) => void;
  startQuiz: () => void;
  goHome: () => void;
  saveEditedCase: (editedCase: CaseStudy) => Promise<void>;
  saveNewCaseStudy: (caseStudy: CaseStudy) => Promise<void>;
  navigateToGenerator: () => void;
  backToMemoFiche: () => void;
  editCase: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentCase, setCurrentCase] = useState<CaseStudy | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const navigate = useNavigate();

  const selectCase = useCallback((caseData: CaseStudy) => {
    setCurrentCase(caseData);
    navigate(`/memofiche/${caseData._id}`);
  }, [navigate]);

  const goHome = useCallback(() => {
    setCurrentCase(null);
    setQuizQuestions([]);
    navigate('/dashboard');
  }, [navigate]);

  const navigateToGenerator = useCallback(() => {
    setCurrentCase(null);
    setQuizQuestions([]);
    navigate('/generateur');
  }, [navigate]);

  const startQuiz = useCallback(() => {
    if (!currentCase || !currentCase.quiz) return;
    setQuizQuestions(currentCase.quiz);
    navigate(`/quiz/${currentCase._id}`);
  }, [currentCase, navigate]);

  const backToMemoFiche = useCallback(() => {
    if (!currentCase) return;
    navigate(`/memofiche/${currentCase._id}`);
    setQuizQuestions([]);
  }, [currentCase, navigate]);

  const editCase = useCallback(() => {
      if(!currentCase) return;
      navigate(`/edit-memofiche/${currentCase._id}`);
  }, [currentCase, navigate]);

  const saveEditedCase = useCallback(async (editedCase: CaseStudy) => {
    // In a real app, you'd have API call logic here.
    console.log("Saving edited case", editedCase);
    setCurrentCase(editedCase);
    navigate(`/memofiche/${editedCase._id}`);
  }, [navigate]);

  const saveNewCaseStudy = useCallback(async (caseStudy: CaseStudy) => {
    // In a real app, you'd have API call logic here.
    console.log("Saving new case", caseStudy);
    navigate('/dashboard');
  }, [navigate]);

  const value = useMemo(() => ({
    currentCase, quizQuestions, selectCase, startQuiz, goHome, saveEditedCase, saveNewCaseStudy, navigateToGenerator, backToMemoFiche, editCase
  }), [currentCase, quizQuestions, selectCase, startQuiz, goHome, saveEditedCase, saveNewCaseStudy, navigateToGenerator, backToMemoFiche, editCase]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
