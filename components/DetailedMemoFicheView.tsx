
import React, { useMemo } from 'react';
import { CaseStudy } from '../types';

interface DetailedMemoFicheViewProps {
  memoFiche: CaseStudy;
  onBack: () => void;
}

const AccordionSection: React.FC<{ 
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ title, icon, children, isOpen, onToggle }) => (
    <div className="mb-2 bg-white rounded-lg shadow-sm border border-slate-200/80 overflow-hidden transition-all duration-300">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
            aria-expanded={isOpen}
        >
            <div className="flex items-center">
                {icon}
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            </div>
            <svg
                className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
        </button>
        <div
            className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}
        >
            <div className="p-4 pt-0 pl-12 text-slate-700 space-y-2">
                {children}
            </div>
        </div>
    </div>
);

export const DetailedMemoFicheView: React.FC<DetailedMemoFicheViewProps> = ({ memoFiche, onBack }) => {
  const [openSection, setOpenSection] = React.useState<string | null>(null);

  const handleToggle = (title: string) => {
    setOpenSection(openSection === title ? null : title);
  };

  const sections = useMemo(() => {
    if (!memoFiche) return [];

    const parseJsonOrDefault = <T,>(jsonString: string | T | undefined, defaultValue: T): T => {
      if (typeof jsonString === 'string') {
        try {
          return JSON.parse(jsonString) as T;
        } catch (e) {
          console.error('Error parsing JSON:', e, jsonString);
          return defaultValue;
        }
      }
      return jsonString !== undefined ? jsonString as T : defaultValue;
    };

    const parseMultiLineStringToArray = (text: string | string[] | undefined): string[] => {
      if (Array.isArray(text)) {
        return text;
      }
      if (typeof text === 'string' && text.trim() !== '') {
        return text.split(/\r?\n/).filter(line => line.trim() !== '');
      }
      return [];
    };

    const parsedFlashcards = parseJsonOrDefault(memoFiche.flashcards, []);
    const parsedGlossary = parseJsonOrDefault(memoFiche.glossary, []);
    const parsedMedia = parseJsonOrDefault(memoFiche.media, []);
    const parsedQuiz = parseJsonOrDefault(memoFiche.quiz, []);
    const parsedKeyQuestions = parseMultiLineStringToArray(memoFiche.keyQuestions);
    const parsedPathologyOverview = parseMultiLineStringToArray(memoFiche.pathologyOverview);
    const parsedRedFlags = parseMultiLineStringToArray(memoFiche.redFlags);
    const parsedKeyPoints = parseMultiLineStringToArray(memoFiche.keyPoints);
    const parsedReferences = parseMultiLineStringToArray(memoFiche.references);

    const renderContent = (content: any) => {
        if (Array.isArray(content)) {
            return (
                <ul className="list-disc pl-5 space-y-1">
                    {content.map((item, index) => <li key={index}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>)}
                </ul>
            );
        }
        return <p>{content}</p>;
    };

    const caseStudySections = [
      { id: 'patientSituation', title: 'Situation Patient', content: memoFiche.patientSituation || '' },
      { id: 'keyQuestions', title: 'Questions Clés', content: renderContent(parsedKeyQuestions) },
      { id: 'pathologyOverview', title: 'Aperçu Pathologie', content: renderContent(parsedPathologyOverview) },
      { id: 'redFlags', title: 'Signaux d\'Alerte', content: renderContent(parsedRedFlags) },
      { id: 'recommendations.mainTreatment', title: 'Traitement Principal', content: renderContent(memoFiche.recommendations?.mainTreatment) },
      { id: 'recommendations.associatedProducts', title: 'Produits Associés', content: renderContent(memoFiche.recommendations?.associatedProducts) },
      { id: 'recommendations.lifestyleAdvice', title: 'Conseils Hygiène de Vie', content: renderContent(memoFiche.recommendations?.lifestyleAdvice) },
      { id: 'recommendations.dietaryAdvice', title: 'Conseils Alimentaires', content: renderContent(memoFiche.recommendations?.dietaryAdvice) },
      { id: 'keyPoints', title: 'Points Clés', content: renderContent(parsedKeyPoints) },
      { id: 'references', title: 'Références', content: renderContent(parsedReferences) },
      { id: 'flashcards', title: 'Flashcards', content: (
        <div className="space-y-2">
          {parsedFlashcards?.map((flashcard: any, index: number) => (
            <div key={index} className="p-3 bg-slate-50 rounded-md">
              <p className="font-semibold">Q: {flashcard.question}</p>
              <p>A: {flashcard.answer}</p>
            </div>
          ))}
        </div>
      ) },
      { id: 'glossary', title: 'Glossaire', content: (
        <ul className="list-disc pl-5 space-y-1">
          {parsedGlossary?.map((term: any, index: number) => (
            <li key={index}>
              <span className="font-semibold">{term.term}</span>: {term.definition}
            </li>
          ))}
        </ul>
      ) },
      { id: 'media', title: 'Médias', content: (
        <div className="space-y-2">
          {parsedMedia?.map((mediaItem: any, index: number) => (
            <div key={index} className="p-3 bg-slate-50 rounded-md">
              <p className="font-semibold">Titre: {mediaItem.title}</p>
              <p>Type: {mediaItem.type}</p>
              <p>URL: <a href={mediaItem.url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">{mediaItem.url}</a></p>
            </div>
          ))}
        </div>
      ) },
      { id: 'quiz', title: 'Quiz', content: (
        <div className="space-y-4">
          {parsedQuiz?.map((quizQuestion: any, index: number) => (
            <div key={index} className="p-4 bg-slate-50 rounded-md">
              <p className="font-semibold">Question {index + 1}: {quizQuestion.question}</p>
              <ul className="list-decimal pl-5 mt-2">
                {quizQuestion.options.map((option: any, optIndex: number) => (
                  <li key={optIndex} className={optIndex === quizQuestion.correctAnswerIndex ? "font-medium text-teal-700" : ""}>
                    {option}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-slate-600">Explication: {quizQuestion.explanation}</p>
            </div>
          ))}
        </div>
      ) }
    ];

    const memoSections = memoFiche.memoSections?.map((section, index) => ({
      id: `memoSection-${index}`,
      title: section.title,
      content: renderContent(section.content),
    })) || [];

    return [...caseStudySections, ...memoSections].map(section => ({
        ...section,
        icon: <span className="mr-3">📄</span>, // Placeholder icon
    }));
  }, [memoFiche]);

  if (!memoFiche) {
    return <div>Loading...</div>;
  }

  return (
    <div className="animate-fade-in container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{memoFiche.title}</h2>
      </div>
      
      <div className="lg:col-span-2">
        {sections.map(section => (
          <AccordionSection
            key={section.id}
            title={section.title}
            icon={section.icon}
            isOpen={openSection === section.id}
            onToggle={() => handleToggle(section.id)}
          >
            {section.content}
          </AccordionSection>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center">
        <button 
            onClick={onBack} 
            className="px-6 py-3 text-base font-bold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
        >
          Retour
        </button>
      </div>
    </div>
  );
};
