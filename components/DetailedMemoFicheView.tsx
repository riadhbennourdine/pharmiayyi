import React, { useState } from 'react';
import { PharmacologyMemoFiche, ExhaustiveMemoFiche } from '../types';

const AccordionSection: React.FC<{ 
    title: string;
    icon?: React.ReactNode;
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
                <h3 className={`text-lg font-bold text-slate-800'}`}>{title}</h3>
            </div>
            <svg
                className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
        </button>
        <div
            className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}
        >
            <div className="p-4 pt-0 pl-12 text-slate-700 space-y-2">
                {children}
            </div>
        </div>
    </div>
);

interface DetailedMemoFicheViewProps {
  memoFiche: PharmacologyMemoFiche | ExhaustiveMemoFiche;
  onBack: () => void;
}

const isPharmacologyMemoFiche = (fiche: any): fiche is PharmacologyMemoFiche => {
  return 'pharmacologicalClasses' in fiche;
};

const PharmacologyMemoFicheComponent: React.FC<{ fiche: PharmacologyMemoFiche, onBack: () => void }> = ({ fiche, onBack }) => {
    const [openSection, setOpenSection] = useState<string | null>('introduction');

    const handleToggle = (title: string) => {
        setOpenSection(openSection === title ? null : title);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{fiche.title}</h2>
            
            <AccordionSection
                title={`Pathologie: ${fiche.pathology}`}
                isOpen={openSection === 'pathology'}
                onToggle={() => handleToggle('pathology')}
            >
                <p className="text-slate-600">{fiche.pathologyOverview}</p>
            </AccordionSection>

            <AccordionSection
                title="Introduction"
                isOpen={openSection === 'introduction'}
                onToggle={() => handleToggle('introduction')}
            >
                <p className="text-slate-600">{fiche.introduction}</p>
            </AccordionSection>

            {fiche.pharmacologicalClasses.map((pharmaClass, index) => (
                <AccordionSection
                    key={index}
                    title={pharmaClass.className}
                    isOpen={openSection === pharmaClass.className}
                    onToggle={() => handleToggle(pharmaClass.className)}
                >
                    <p><span className="font-semibold">Mécanisme d'action:</span> {pharmaClass.mechanismOfAction}</p>
                    <p><span className="font-semibold">Avantages différentiels:</span> {pharmaClass.differentialAdvantages}</p>
                    <p><span className="font-semibold">Rôle de l'alimentation:</span> {pharmaClass.roleOfDiet}</p>
                    <div className="mt-4">
                        <h5 className="font-bold mb-2">Médicaments:</h5>
                        {pharmaClass.drugs.map((drug, i) => (
                            <div key={i} className="ml-4 mb-2">
                                <p><span className="font-semibold">{drug.name}:</span></p>
                                <p className="ml-4">Dosages: {drug.dosages}</p>
                                <p className="ml-4">Précautions: {drug.precautionsForUse}</p>
                            </div>
                        ))}
                    </div>
                </AccordionSection>
            ))}
            
            {/* TODO: Render summaryTable, keyPoints, glossary, media, quiz, flashcards */}

            <button onClick={onBack} className="mt-4 text-lg bg-slate-200 text-slate-800 font-bold py-3 px-8 rounded-lg shadow-md hover:bg-slate-300 transition-all duration-300">
                Retour
            </button>
        </div>
    )
}

const ExhaustiveMemoFicheComponent: React.FC<{ fiche: ExhaustiveMemoFiche, onBack: () => void }> = ({ fiche, onBack }) => {
    const [openSection, setOpenSection] = useState<string | null>('introductionToPathology');

    const handleToggle = (title: string) => {
        setOpenSection(openSection === title ? null : title);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{fiche.title}</h2>
            <p className="text-sm text-slate-500 mb-2">Public cible: {fiche.targetAudience}</p>
            
            <AccordionSection
                title="Objectifs"
                isOpen={openSection === 'objectives'}
                onToggle={() => handleToggle('objectives')}
            >
                <ul className="list-disc list-inside">
                    {fiche.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                </ul>
            </AccordionSection>

            <AccordionSection
                title={fiche.introductionToPathology.title}
                isOpen={openSection === 'introductionToPathology'}
                onToggle={() => handleToggle('introductionToPathology')}
            >
                <p><span className="font-semibold">Définition et diagnostic:</span> {fiche.introductionToPathology.definitionAndDiagnosis}</p>
                <p><span className="font-semibold">Prévalence et importance:</span> {fiche.introductionToPathology.prevalenceAndImportance}</p>
                <p><span className="font-semibold">Facteurs de risque et causes:</span> {fiche.introductionToPathology.riskFactorsAndCauses}</p>
                <p><span className="font-semibold">Complications:</span> {fiche.introductionToPathology.complications}</p>
                <p><span className="font-semibold">Objectifs du traitement:</span> {fiche.introductionToPathology.treatmentGoals}</p>
                <p><span className="font-semibold">Mesures hygiéno-diététiques:</span> {fiche.introductionToPathology.lifestyleMeasures}</p>
            </AccordionSection>

            {/* TODO: Render drugClasses, dispensingAndCounseling, conclusion */}

            <button onClick={onBack} className="mt-4 text-lg bg-slate-200 text-slate-800 font-bold py-3 px-8 rounded-lg shadow-md hover:bg-slate-300 transition-all duration-300">
                Retour
            </button>
        </div>
    )
}

const DetailedMemoFicheView: React.FC<DetailedMemoFicheViewProps> = ({ memoFiche, onBack }) => {
  if (isPharmacologyMemoFiche(memoFiche)) {
    return <PharmacologyMemoFicheComponent fiche={memoFiche} onBack={onBack} />;
  } else {
    return <ExhaustiveMemoFicheComponent fiche={memoFiche as ExhaustiveMemoFiche} onBack={onBack} />;
  }
};

export default DetailedMemoFicheView;
