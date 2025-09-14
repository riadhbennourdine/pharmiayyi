import React, { useState, useEffect } from 'react';
import type { Flashcard } from '../types';

interface FlashcardViewProps {
  flashcard: Flashcard;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ flashcard }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    // Reset flip state when card changes
    useEffect(() => {
        setIsFlipped(false);
    }, [flashcard]);

    return (
        <div className="w-full h-64 perspective-1000" onClick={() => setIsFlipped(!isFlipped)}>
            <div
                className="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d"
            >
                {/* Front */}
                <div className={`absolute w-full h-full backface-hidden bg-white border-2 border-teal-500 rounded-lg shadow-lg flex items-center justify-center p-6 cursor-pointer ${isFlipped ? 'rotate-y-180' : 'rotate-y-0'}`}>
                    <p className="text-xl font-semibold text-center text-slate-800">{flashcard.question}</p>
                </div>
                {/* Back */}
                <div className={`absolute w-full h-full backface-hidden bg-teal-600 rounded-lg shadow-lg flex items-center justify-center p-6 cursor-pointer ${isFlipped ? 'rotate-y-0' : 'rotate-y-180'}`}>
                    <p className="text-lg text-center text-white">{flashcard.answer}</p>
                </div>
            </div>
        </div>
    );
};

export default FlashcardView;
