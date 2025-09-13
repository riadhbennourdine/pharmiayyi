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
    if (!editedCase._id) {
      alert("Cannot save a case study without an ID.");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/memofiches/${editedCase._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editedCase),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save the edited case study.');
      }

      const savedCase = await response.json();
      console.log("Successfully saved edited case study:", savedCase);
      setCurrentCase(savedCase);
      navigate(`/memofiche/${savedCase._id}`);

    } catch (error) {
      console.error("Error saving edited case study:", error);
      alert(`Erreur lors de la sauvegarde : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [navigate]);

  const saveNewCaseStudy = useCallback(async (caseStudy: CaseStudy) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/memofiches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(caseStudy),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save the new case study.');
      }

      // The backend returns the saved case study with its new _id
      const savedCase = await response.json();
      console.log("Successfully saved new case study:", savedCase);
      
      // After saving, navigate to the dashboard where the new list will be fetched.
      navigate('/dashboard');

    } catch (error) {
      console.error("Error saving new case study:", error);
      // Optionally, handle the error in the UI, e.g., show a notification
      alert(`Erreur lors de la sauvegarde : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [navigate]);

  const value = useMemo(() => ({
    currentCase, quizQuestions, selectCase, startQuiz, goHome, saveEditedCase, saveNewCaseStudy, navigateToGenerator, backToMemoFiche, editCase
  }), [currentCase, quizQuestions, selectCase, startQuiz, goHome, saveEditedCase, saveNewCaseStudy, navigateToGenerator, backToMemoFiche, editCase]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
