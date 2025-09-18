import React, { useState } from 'react';
import { PharmacologyMemoFiche, ExhaustiveMemoFiche } from '../types';
import FlashcardDeck from './FlashcardDeck';
import { VideoCameraIcon } from './icons';
import CustomChatBot from './CustomChatBot'; // Import the chatbot component

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
                <h3 className={`text-lg font-bold text-slate-800`}>{title}</h3>
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
  onStartQuiz: () => void;
}

const isPharmacologyMemoFiche = (fiche: any): fiche is PharmacologyMemoFiche => {
  return 'pharmacologicalClasses' in fiche;
};

const PharmacologyMemoFicheComponent: React.FC<{ fiche: PharmacologyMemoFiche, onBack: () => void, onStartQuiz: () => void }> = ({ fiche, onBack, onStartQuiz }) => {
    const [openSection, setOpenSection] = useState<string | null>('introduction');
    const [activeTab, setActiveTab] = useState<'memo' | 'flashcards' | 'quiz' | 'glossary' | 'media'>('memo');

    const handleToggle = (title: string) => {
        setOpenSection(openSection === title ? null : title);
    };

    const menuItems = [
        { id: 'memo', label: 'Mémo' },
        { id: 'flashcards', label: 'Flashcards' },
        { id: 'quiz', label: 'Quiz' },
        { id: 'glossary', label: 'Glossaire' },
        { id: 'media', label: 'Médias' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'memo':
                return (
                    <>
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
                    </>
                );
            case 'flashcards':
                return <FlashcardDeck flashcards={fiche.flashcards} />;
            case 'glossary':
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                        {fiche.glossary.map((item, i) => (
                            <div key={i} className="border-b border-slate-200 pb-2">
                                <h4 className="font-bold text-slate-800">{item.term}</h4>
                                <p className="text-slate-600">{item.definition}</p>
                            </div>
                        ))}
                    </div>
                );
            case 'media':
                return (
                    <div className="space-y-4">
                        {fiche.media.map((item, i) => (
                            <div key={i} className="bg-white p-6 rounded-lg shadow-md flex items-start">
                                <div className="bg-teal-100 p-3 rounded-full mr-4">
                                    <VideoCameraIcon className="h-6 w-6 text-teal-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{item.title} ({item.type})</h4>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">{item.url}</a>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'quiz':
                return (
                    <div className="text-center bg-white p-8 rounded-lg shadow-md">
                        <h3 className="text-2xl font-bold text-slate-800 mb-4">Testez vos connaissances !</h3>
                        <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                            Évaluez votre compréhension de cette mémofiche avec un quiz interactif.
                        </p>
                        <button
                            onClick={onStartQuiz}
                            className="inline-flex items-center bg-green-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                        >
                            Démarrer le Quiz
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{fiche.title}</h2>
            
            <div className="mb-6 border-b border-slate-200 flex space-x-1 sm:space-x-2 overflow-x-auto pb-px">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`flex items-center space-x-2 px-3 sm:px-4 py-3 text-sm sm:text-base font-medium rounded-t-md transition-colors duration-300 focus:outline-none ${ 
                            activeTab === item.id
                            ? 'border-b-2 border-teal-600 text-teal-600 bg-teal-50/50'
                            : 'text-slate-500 hover:text-teal-500 hover:bg-slate-100/50'
                        }`}
                        aria-current={activeTab === item.id ? 'page' : undefined}
                    >
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="min-h-[300px]">
                {renderContent()}
            </div>

            <button onClick={onBack} className="mt-4 text-lg bg-slate-200 text-slate-800 font-bold py-3 px-8 rounded-lg shadow-md hover:bg-slate-300 transition-all duration-300">
                Retour
            </button>
        </div>
    )
}

const ExhaustiveMemoFicheComponent: React.FC<{ fiche: ExhaustiveMemoFiche, onBack: () => void, onStartQuiz: () => void }> = ({ fiche, onBack, onStartQuiz }) => {
    const [openSection, setOpenSection] = useState<string | null>('introductionToPathology');
    const [activeTab, setActiveTab] = useState<'memo' | 'flashcards' | 'quiz' | 'glossary' | 'media'>('memo');

    const handleToggle = (title: string) => {
        setOpenSection(openSection === title ? null : title);
    };

    const menuItems = [
        { id: 'memo', label: 'Synthèse' },
        { id: 'flashcards', label: 'Flashcards' },
        { id: 'quiz', label: 'Quiz' },
        { id: 'glossary', label: 'Glossaire' },
        { id: 'media', label: 'Médias' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'memo':
                return (
                    <>
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

                        <AccordionSection
                            title={fiche.drugClasses.title}
                            isOpen={openSection === 'drugClasses'}
                            onToggle={() => handleToggle('drugClasses')}
                        >
                            <p>{fiche.drugClasses.generalPrinciples}</p>
                            {fiche.drugClasses.classes.map((drugClass, i) => (
                                <div key={i} className="mt-4">
                                    <h5 className="font-bold mb-2">{drugClass.name}</h5>
                                    <p><span className="font-semibold">Exemples:</span> {drugClass.examples}</p>
                                    <p><span className="font-semibold">Mécanisme d'action:</span> {drugClass.mechanismOfAction}</p>
                                    <p><span className="font-semibold">Effets secondaires principaux:</span> {drugClass.mainSideEffects}</p>
                                    <p><span className="font-semibold">Conseils pour le patient:</span> {drugClass.patientAdvice}</p>
                                    <p><span className="font-semibold">Contre-indications:</span> {drugClass.contraindications}</p>
                                    <p><span className="font-semibold">Interactions médicamenteuses:</span> {drugClass.drugInteractions}</p>
                                </div>
                            ))}
                        </AccordionSection>

                        <AccordionSection
                            title={fiche.dispensingAndCounseling.title}
                            isOpen={openSection === 'dispensingAndCounseling'}
                            onToggle={() => handleToggle('dispensingAndCounseling')}
                        >
                            <div className="mb-4">
                                <h4 className="font-bold text-md mb-2">{fiche.dispensingAndCounseling.essentialDispensingAdvice.title}</h4>
                                <p><span className="font-semibold">Explication du traitement:</span> {fiche.dispensingAndCounseling.essentialDispensingAdvice.medicationExplanation}</p>
                                <p><span className="font-semibold">Rappel MHD:</span> {fiche.dispensingAndCounseling.essentialDispensingAdvice.lifestyleReminder}</p>
                                <p><span className="font-semibold">Surveillance et Automesure:</span> {fiche.dispensingAndCounseling.essentialDispensingAdvice.monitoringAndSelfMeasurement}</p>
                                <p><span className="font-semibold">Gestion des événements intercurrents:</span> {fiche.dispensingAndCounseling.essentialDispensingAdvice.intercurrentEventManagement}</p>
                            </div>
                            <div className="mb-4">
                                <h4 className="font-bold text-md mb-2">{fiche.dispensingAndCounseling.additionalSalesAndServices.title}</h4>
                                <p><span className="font-semibold">Produits:</span> {fiche.dispensingAndCounseling.additionalSalesAndServices.products.join(', ')}</p>
                                <p><span className="font-semibold">Services:</span> {fiche.dispensingAndCounseling.additionalSalesAndServices.services.join(', ')}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-md mb-2">{fiche.dispensingAndCounseling.pharmacistRoleValorization.title}</h4>
                                <p><span className="font-semibold">Expertise médication:</span> {fiche.dispensingAndCounseling.pharmacistRoleValorization.medicationExpertise}</p>
                                <p><span className="font-semibold">Éducation patient:</span> {fiche.dispensingAndCounseling.pharmacistRoleValorization.patientEducation}</p>
                                <p><span className="font-semibold">Collaboration interprofessionnelle:</span> {fiche.dispensingAndCounseling.pharmacistRoleValorization.interprofessionalCollaboration}</p>
                            </div>
                        </AccordionSection>

                        <AccordionSection
                            title="Conclusion"
                            isOpen={openSection === 'conclusion'}
                            onToggle={() => handleToggle('conclusion')}
                        >
                            <p>{fiche.conclusion}</p>
                        </AccordionSection>
                    </>
                );
            case 'flashcards':
                return <FlashcardDeck flashcards={fiche.flashcards} />;
            case 'glossary':
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                        {fiche.glossary.map((item, i) => (
                            <div key={i} className="border-b border-slate-200 pb-2">
                                <h4 className="font-bold text-slate-800">{item.term}</h4>
                                <p className="text-slate-600">{item.definition}</p>
                            </div>
                        ))}
                    </div>
                );
            case 'media':
                return (
                    <div className="space-y-4">
                        {fiche.media.map((item, i) => (
                            <div key={i} className="bg-white p-6 rounded-lg shadow-md flex items-start">
                                <div className="bg-teal-100 p-3 rounded-full mr-4">
                                    <VideoCameraIcon className="h-6 w-6 text-teal-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{item.title} ({item.type})</h4>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">{item.url}</a>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'quiz':
                return (
                    <div className="text-center bg-white p-8 rounded-lg shadow-md">
                        <h3 className="text-2xl font-bold text-slate-800 mb-4">Testez vos connaissances !</h3>
                        <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                            Évaluez votre compréhension de cette synthèse avec un quiz interactif.
                        </p>
                        <button
                            onClick={onStartQuiz}
                            className="inline-flex items-center bg-green-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                        >
                            Démarrer le Quiz
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{fiche.title}</h2>
            <p className="text-sm text-slate-500 mb-2">Public cible: {fiche.targetAudience}</p>
            
            <div className="mb-6 border-b border-slate-200 flex space-x-1 sm:space-x-2 overflow-x-auto pb-px">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`flex items-center space-x-2 px-3 sm:px-4 py-3 text-sm sm:text-base font-medium rounded-t-md transition-colors duration-300 focus:outline-none ${ 
                            activeTab === item.id
                            ? 'border-b-2 border-teal-600 text-teal-600 bg-teal-50/50'
                            : 'text-slate-500 hover:text-teal-500 hover:bg-slate-100/50'
                        }`}
                        aria-current={activeTab === item.id ? 'page' : undefined}
                    >
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="min-h-[300px]">
                {renderContent()}
            </div>

            <button onClick={onBack} className="mt-4 text-lg bg-slate-200 text-slate-800 font-bold py-3 px-8 rounded-lg shadow-md hover:bg-slate-300 transition-all duration-300">
                Retour
            </button>
        </div>
    )
}

const DetailedMemoFicheView: React.FC<DetailedMemoFicheViewProps> = ({ memoFiche, onBack, onStartQuiz }) => {
  return (
    <div>
      {isPharmacologyMemoFiche(memoFiche) ? (
        <PharmacologyMemoFicheComponent fiche={memoFiche} onBack={onBack} onStartQuiz={onStartQuiz} />
      ) : (
        <ExhaustiveMemoFicheComponent fiche={memoFiche as ExhaustiveMemoFiche} onBack={onBack} onStartQuiz={onStartQuiz} />
      )}
      <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <h3 style={{ marginBottom: '15px', fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>Posez une question sur cette fiche !</h3>
        <CustomChatBot context={JSON.stringify(memoFiche)} />
      </div>
    </div>
  );
};

export default DetailedMemoFicheView;