
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
      { id: 'keyQuestions', title: 'Questions Clés', content: Array.isArray(memoFiche.keyQuestions) ? memoFiche.keyQuestions : [] },
      { id: 'pathologyOverview', title: 'Aperçu Pathologie', content: memoFiche.pathologyOverview || '' },
      { id: 'redFlags', title: 'Signaux d\'Alerte', content: renderContent(memoFiche.redFlags) },
      { id: 'recommendations.mainTreatment', title: 'Traitement Principal', content: renderContent(memoFiche.recommendations?.mainTreatment) },
      { id: 'recommendations.associatedProducts', title: 'Produits Associés', content: renderContent(memoFiche.recommendations?.associatedProducts) },
      { id: 'recommendations.lifestyleAdvice', title: 'Conseils Hygiène de Vie', content: renderContent(memoFiche.recommendations?.lifestyleAdvice) },
      { id: 'recommendations.dietaryAdvice', title: 'Conseils Alimentaires', content: renderContent(memoFiche.recommendations?.dietaryAdvice) },
      { id: 'keyPoints', title: 'Points Clés', content: renderContent(memoFiche.keyPoints) },
      { id: 'references', title: 'Références', content: renderContent(memoFiche.references) },
      { id: 'flashcards', title: 'Flashcards', content: renderContent(JSON.stringify(memoFiche.flashcards, null, 2)) },
      { id: 'glossary', title: 'Glossaire', content: renderContent(JSON.stringify(memoFiche.glossary, null, 2)) },
      { id: 'media', title: 'Médias', content: renderContent(JSON.stringify(memoFiche.media, null, 2)) },
      { id: 'quiz', title: 'Quiz', content: renderContent(JSON.stringify(memoFiche.quiz, null, 2)) },
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
