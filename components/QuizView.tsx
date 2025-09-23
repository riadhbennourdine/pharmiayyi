import React, { useState } from 'react';
import type { QuizQuestion } from '../types';
import { CheckCircleIcon, XCircleIcon, ChevronLeftIcon } from './icons';
import { useAuth } from './contexts/AuthContext';

interface QuizViewProps {
  questions: QuizQuestion[];
  caseTitle: string;
  onBack: () => void;
  quizId: string; // Add quizId prop
}

const QuizView: React.FC<QuizViewProps> = ({ questions, caseTitle, onBack, quizId }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [submittedAnswer, setSubmittedAnswer] = useState<number | null>(null);
  const { user } = useAuth();

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg animate-fade-in text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Quiz non disponible</h2>
        <p className="text-slate-600 mb-6">Il n'y a pas de questions pour ce quiz pour le moment.</p>
        <button onClick={onBack} className="mt-4 bg-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-700 transition-colors">
          Retour
        </button>
      </div>
    );
  }


  const handleAnswerSelect = (optionIndex: number) => {
    if (submittedAnswer !== null) return;

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
    setSubmittedAnswer(optionIndex);
  };

  const handleNext = async () => {
    setSubmittedAnswer(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
      // Track quiz completion
      if (user && quizId) {
        const rawScore = calculateScore();
        const percentageScore = Math.round((rawScore / questions.length) * 100);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/user/track-quiz-completion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ quizId, score: percentageScore, ficheId: quizId }),
          });

          if (!response.ok) {
            console.error('Failed to track quiz completion:', await response.text());
          }
        } catch (error) {
          console.error('Error tracking quiz completion:', error);
        }
      }
    }
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((score, answer, index) => {
      return answer === questions[index].correctAnswerIndex ? score + 1 : score;
    }, 0);
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg animate-fade-in text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Résultats du Quiz</h2>
        <p className="text-slate-600 mb-6">Pour le cas : "{caseTitle}"</p>
        <div className={`mb-6 text-6xl font-bold ${percentage >= 80 ? 'text-green-500' : percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
          {percentage}%
        </div>
        <p className="text-xl text-slate-700 mb-4">Vous avez répondu correctement à {score} question(s) sur {questions.length}.</p>
        <p className="text-lg text-slate-600 mb-8">
          {percentage === 100 && "Parfait ! Vous êtes un expert sur ce sujet !"}
          {percentage >= 80 && percentage < 100 && "Excellent ! Vous maîtrisez bien le sujet."}
          {percentage >= 50 && percentage < 80 && "Bon travail ! Continuez à approfondir vos connaissances."}
          {percentage < 50 && "Continuez à réviser, vous êtes sur la bonne voie !"}
        </p>
        <div className="text-left space-y-6">
          {questions.map((q, index) => (
            <div key={index} className="p-4 border rounded-md">
              <p className="font-semibold mb-2">{index + 1}. {q.question}</p>
              <p className={`flex items-center ${selectedAnswers[index] === q.correctAnswerIndex ? 'text-green-600' : 'text-red-600'}`}>
                {selectedAnswers[index] === q.correctAnswerIndex ? <CheckCircleIcon className="h-5 w-5 mr-2" /> : <XCircleIcon className="h-5 w-5 mr-2" />}
                Votre réponse : {selectedAnswers[index] !== null ? q.options[selectedAnswers[index] as number] : 'Pas de réponse'}
              </p>
              {selectedAnswers[index] !== q.correctAnswerIndex && (
                <p className="text-green-700 mt-1">Bonne réponse : {q.options[q.correctAnswerIndex]}</p>
              )}
              <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded"><strong>Explication :</strong> {q.explanation}</p>
            </div>
          ))}
        </div>
        <button onClick={onBack} className="mt-8 bg-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-700 transition-colors">
          Retour à l'étude de cas
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg animate-fade-in">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-teal-600 hover:text-teal-800 mb-4 transition-colors">
        <ChevronLeftIcon className="h-4 w-4 mr-2" />
        Retour à l'étude de cas
      </button>
      <div className="mb-6">
        <p className="text-sm text-slate-500">Question {currentQuestionIndex + 1} sur {questions.length}</p>
        <h2 className="text-2xl font-bold text-slate-800 mt-1">{currentQuestion.question}</h2>
      </div>
      <div className="space-y-4 mb-8">
        {currentQuestion.options.map((option, index) => {
          const isCorrect = index === currentQuestion.correctAnswerIndex;
          const isSelected = submittedAnswer === index;
          let buttonClass = 'bg-slate-50 hover:bg-teal-100 hover:border-teal-300';

          if (submittedAnswer !== null) {
            if (isCorrect) {
              buttonClass = 'bg-green-100 border-green-500 text-green-800 ring-2 ring-green-500';
            } else if (isSelected) {
              buttonClass = 'bg-red-100 border-red-500 text-red-800 ring-2 ring-red-500';
            } else {
              buttonClass = 'bg-slate-50 border-slate-200 opacity-70 cursor-not-allowed';
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={submittedAnswer !== null}
              className={`w-full text-left p-4 border rounded-lg transition-all duration-200 flex items-center justify-between ${buttonClass}`}
            >
              <span>{option}</span>
              {submittedAnswer !== null && isCorrect && <CheckCircleIcon className="h-6 w-6 text-green-600" />}
              {submittedAnswer !== null && isSelected && !isCorrect && <XCircleIcon className="h-6 w-6 text-red-600" />}
            </button>
          );
        })}
      </div>

      {submittedAnswer !== null && (
        <div className="mt-6 p-4 bg-slate-50 rounded-lg animate-fade-in border border-slate-200">
          <h4 className="font-bold text-slate-800">Explication :</h4>
          <p className="text-slate-700 mt-2">{currentQuestion.explanation}</p>
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={submittedAnswer === null}
        className="w-full mt-8 bg-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        {currentQuestionIndex < questions.length - 1 ? 'Question suivante' : 'Terminer & voir les résultats'}
      </button>
    </div>
  );
};

export default QuizView;