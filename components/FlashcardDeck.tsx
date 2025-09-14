import React, { useState } from 'react';
import type { Flashcard } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import FlashcardView from './FlashcardView';

interface FlashcardDeckProps {
  flashcards: Flashcard[];
}


const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ flashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEncouragement, setShowEncouragement] = useState(false);

  const goToPrevious = () => {
    setShowEncouragement(false);
    setCurrentIndex(prevIndex => (prevIndex === 0 ? flashcards.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setShowEncouragement(false);
    setCurrentIndex(prevIndex => {
      const nextIndex = (prevIndex === flashcards.length - 1 ? 0 : prevIndex + 1);
      if ((nextIndex % 10 === 0) && nextIndex !== 0) { // Show encouragement every 10 cards, but not at the very beginning
        setShowEncouragement(true);
      }
      return nextIndex;
    });
  };

  const continueFlashcards = () => {
    setShowEncouragement(false);
  };

  if (!flashcards || flashcards.length === 0) {
    return <p className="text-center text-slate-500">Pas de flashcards disponibles pour ce cas.</p>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {showEncouragement ? (
        <div className="bg-white border-2 border-teal-500 rounded-lg shadow-lg flex flex-col items-center justify-center p-6 h-64 text-center">
          <p className="text-2xl font-bold text-teal-700 mb-4">Félicitations !</p>
          <p className="text-lg text-slate-800 mb-6">Vous avez parcouru {currentIndex} flashcards. Continuez sur cette lancée pour maîtriser le sujet !</p>
          <button onClick={continueFlashcards} className="px-6 py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 transition-colors">
            Continuer les flashcards
          </button>
        </div>
      ) : (
        <FlashcardView flashcard={flashcards[currentIndex]} />
      )}
      
      <div className="flex items-center justify-between mt-4">
        <button onClick={goToPrevious} className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 transition focus:outline-none focus:ring-2 focus:ring-teal-500" aria-label="Fiche précédente">
          <ChevronLeftIcon className="w-6 h-6 text-slate-700" />
        </button>
        <p className="text-sm font-medium text-slate-600">Carte {currentIndex + 1} sur {flashcards.length}</p>
        <button onClick={goToNext} className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 transition focus:outline-none focus:ring-2 focus:ring-teal-500" aria-label="Fiche suivante">
          <ChevronRightIcon className="w-6 h-6 text-slate-700" />
        </button>
      </div>
    </div>
  );
};

export default FlashcardDeck;
