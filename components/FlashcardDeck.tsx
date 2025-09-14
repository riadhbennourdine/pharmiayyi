import React, { useState } from 'react';
import type { Flashcard } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface FlashcardDeckProps {
  flashcards: Flashcard[];
}

const FlashcardView: React.FC<{ flashcard: Flashcard; onFlip: (question: string) => void }> = ({ flashcard, onFlip }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    // Reset flip state when card changes
    React.useEffect(() => {
        setIsFlipped(false);
    }, [flashcard]);

    const handleCardClick = () => {
        setIsFlipped(!isFlipped);
        if (!isFlipped) { // Only call onFlip when flipping from front to back
            onFlip(flashcard.question);
        }
    };

    return (
        <div className="w-full h-64 perspective-1000" onClick={handleCardClick}>
            <div
                className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
            >
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden bg-white border-2 border-teal-500 rounded-lg shadow-lg flex items-center justify-center p-6 cursor-pointer">
                    <p className="text-xl font-semibold text-center text-slate-800">{flashcard.question}</p>
                </div>
                {/* Back */}
                <div className="absolute w-full h-full backface-hidden bg-teal-600 rounded-lg shadow-lg flex items-center justify-center p-6 transform rotate-y-180 cursor-pointer">
                    <p className="text-lg text-center text-white">{flashcard.answer}</p>
                </div>
            </div>
        </div>
    );
};


const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ flashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [flippedCardIds, setFlippedCardIds] = useState<Set<string>>(new Set());

  const handleFlip = (question: string) => {
    setFlippedCardIds(prev => new Set(prev.add(question)));
  };

  const goToPrevious = () => {
    setShowEncouragement(false);
    setCurrentIndex(prevIndex => (prevIndex === 0 ? flashcards.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setShowEncouragement(false);
    setCurrentIndex(prevIndex => {
      const nextIndex = (prevIndex === flashcards.length - 1 ? 0 : prevIndex + 1);
      if (nextIndex % 10 === 0 && flashcards.length > 0) {
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
          <p className="text-lg text-slate-800 mb-6">
            {flippedCardIds.size === 0 && "Continuez à explorer les flashcards pour maîtriser le sujet !"}
            {flippedCardIds.size >= 1 && flippedCardIds.size <= 5 && `Bon début ! Vous avez parcouru ${flippedCardIds.size} flashcards. Continuez sur cette lancée pour maîtriser le sujet !`}
            {flippedCardIds.size >= 6 && flippedCardIds.size <= 9 && `Très bien ! Vous avez parcouru ${flippedCardIds.size} flashcards. Vous progressez rapidement !`}
            {flippedCardIds.size >= 10 && `Excellent ! Vous avez parcouru ${flippedCardIds.size} flashcards. Vous êtes un expert sur ce sujet !`}
          </p>
          <button onClick={continueFlashcards} className="px-6 py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 transition-colors">
            Continuer les flashcards
          </button>
        </div>
      ) : (
        <FlashcardView flashcard={flashcards[currentIndex]} onFlip={handleFlip} />
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
       <style>{`
            .perspective-1000 { perspective: 1000px; }
            .transform-style-preserve-3d { transform-style: preserve-3d; }
            .rotate-y-180 { transform: rotateY(180deg); }
            .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        `}</style>
    </div>
  );
};

export default FlashcardDeck;
