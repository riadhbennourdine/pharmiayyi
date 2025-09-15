import React from 'react';
import { PharmacologyMemoFiche, ExhaustiveMemoFiche } from '../types';

interface DetailedMemoFicheViewProps {
  memoFiche: PharmacologyMemoFiche | ExhaustiveMemoFiche;
  onBack: () => void;
}

const isPharmacologyMemoFiche = (fiche: any): fiche is PharmacologyMemoFiche => {
  return 'pharmacologicalClasses' in fiche;
};

const PharmacologyMemoFicheComponent: React.FC<{ fiche: PharmacologyMemoFiche, onBack: () => void }> = ({ fiche, onBack }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{fiche.title}</h2>
            <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-700 mb-2">Pathologie: {fiche.pathology}</h3>
                <p className="text-slate-600">{fiche.pathologyOverview}</p>
            </div>
            <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-700 mb-2">Introduction</h3>
                <p className="text-slate-600">{fiche.introduction}</p>
            </div>

            {fiche.pharmacologicalClasses.map((pharmaClass, index) => (
                <div key={index} className="mb-6 p-4 border border-slate-200 rounded-lg">
                    <h4 className="text-lg font-bold text-teal-700 mb-2">{pharmaClass.className}</h4>
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
                </div>
            ))}
            
            {/* TODO: Render summaryTable, keyPoints, glossary, media, quiz, flashcards */}

            <button onClick={onBack} className="mt-4 text-lg bg-slate-200 text-slate-800 font-bold py-3 px-8 rounded-lg shadow-md hover:bg-slate-300 transition-all duration-300">
                Retour
            </button>
        </div>
    )
}

const ExhaustiveMemoFicheComponent: React.FC<{ fiche: ExhaustiveMemoFiche, onBack: () => void }> = ({ fiche, onBack }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{fiche.title}</h2>
            <p className="text-sm text-slate-500 mb-2">Public cible: {fiche.targetAudience}</p>
            <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-700 mb-2">Objectifs</h3>
                <ul className="list-disc list-inside">
                    {fiche.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                </ul>
            </div>

            <div className="mb-6 p-4 border border-slate-200 rounded-lg">
                <h3 className="text-lg font-bold text-teal-700 mb-2">{fiche.introductionToPathology.title}</h3>
                <p><span className="font-semibold">Définition et diagnostic:</span> {fiche.introductionToPathology.definitionAndDiagnosis}</p>
                <p><span className="font-semibold">Prévalence et importance:</span> {fiche.introductionToPathology.prevalenceAndImportance}</p>
                <p><span className="font-semibold">Facteurs de risque et causes:</span> {fiche.introductionToPathology.riskFactorsAndCauses}</p>
                <p><span className="font-semibold">Complications:</span> {fiche.introductionToPathology.complications}</p>
                <p><span className="font-semibold">Objectifs du traitement:</span> {fiche.introductionToPathology.treatmentGoals}</p>
                <p><span className="font-semibold">Mesures hygiéno-diététiques:</span> {fiche.introductionToPathology.lifestyleMeasures}</p>
            </div>

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
