import React, { useState } from 'react';

import { CaseStudy, PharmacologyMemoFiche, ExhaustiveMemoFiche } from '../types';
import Spinner from './Spinner';
import MemoFicheView from './MemoFicheView';
import DetailedMemoFicheView from './DetailedMemoFicheView';
import { ChevronLeftIcon, SparklesIcon } from './icons';
import { TOPIC_CATEGORIES } from '../constants';

interface GeneratorViewProps {
  onBack: () => void;
  onSaveCaseStudy: (caseStudy: CaseStudy | PharmacologyMemoFiche | ExhaustiveMemoFiche) => void;
}

const GeneratorView: React.FC<GeneratorViewProps> = ({ onBack, onSaveCaseStudy }) => {
  const [sourceText, setSourceText] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCase, setGeneratedCase] = useState<CaseStudy | PharmacologyMemoFiche | ExhaustiveMemoFiche | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memoFicheType, setMemoFicheType] = useState<'maladie' | 'pharmacologie' | 'exhaustive'>('maladie');
  const [pharmaTheme, setPharmaTheme] = useState('');
  const [pharmaPathology, setPharmaPathology] = useState('');

  const handleGenerate = async () => {
    if (memoFicheType === 'maladie' && (!sourceText.trim() || !selectedTheme || !selectedSystem)) return;
    if (memoFicheType === 'pharmacologie' && (!sourceText.trim() || !pharmaTheme.trim() || !pharmaPathology.trim())) return;
    if (memoFicheType === 'exhaustive' && !sourceText.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedCase(null);

    const requestBody = {
      memoFicheType,
      sourceText,
      coverImageUrl: coverImageUrl.trim() || undefined,
      youtubeUrl: youtubeUrl.trim() || undefined,
      ...(memoFicheType === 'maladie' && { theme: selectedTheme, system: selectedSystem }),
      ...(memoFicheType === 'pharmacologie' && { theme: pharmaTheme, pathology: pharmaPathology }),
      // No extra params for exhaustive for now
    };

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to generate case study');
      }

      const result = await response.json();
      
      const finalMemoFiche = {
        ...result,
        ...(memoFicheType === 'maladie' && { 
          theme: selectedTheme, 
          system: selectedSystem 
        }),
        ...(memoFicheType === 'pharmacologie' && { 
          theme: pharmaTheme, 
          pathology: pharmaPathology 
        }),
        // No extra params for exhaustive for now
        coverImageUrl: coverImageUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        creationDate: new Date().toISOString(),
      };
      setGeneratedCase(finalMemoFiche as CaseStudy | PharmacologyMemoFiche | ExhaustiveMemoFiche);
    } catch (err) {
      console.error(err);
      setError("La génération de la mémofiche a échoué. Vérifiez les données d'entrée et réessayez.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
      setGeneratedCase(null);
      setSourceText('');
      setSelectedTheme('');
      setSelectedSystem('');
      setCoverImageUrl('');
      setYoutubeUrl('');
      setError(null);
  }
  
  const handleSaveAndExit = () => {
      if(generatedCase) {
          onSaveCaseStudy(generatedCase);
      }
  }

  if (generatedCase) {
    return (
      <div className="animate-fade-in">
        <h2 className="text-3xl font-bold text-slate-800 mb-6 text-center">Aperçu de la Mémofiche Générée</h2>
        {memoFicheType === 'maladie' ? (
          <MemoFicheView caseStudy={generatedCase as CaseStudy} onStartQuiz={() => {}} onBack={handleReset} isPreview={true} />
        ) : (
          <DetailedMemoFicheView memoFiche={generatedCase as PharmacologyMemoFiche | ExhaustiveMemoFiche} onBack={handleReset} />
        )}
        <div className="text-center mt-8 flex justify-center items-center space-x-4">
             <button 
                onClick={handleReset} 
                className="text-lg bg-slate-200 text-slate-800 font-bold py-3 px-8 rounded-lg shadow-md hover:bg-slate-300 transition-all duration-300"
            >
              Générer une autre
            </button>
            <button 
                onClick={handleSaveAndExit} 
                className="text-lg bg-teal-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-teal-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
            >
              Sauvegarder et Publier
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-teal-600 hover:text-teal-800 mb-6 transition-colors">
        <ChevronLeftIcon className="h-4 w-4 mr-2" />
        Retour à l'accueil
      </button>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Générateur de Mémofiches (Admin)</h2>
        <p className="text-lg text-slate-600">Choisissez un contexte, collez un texte source, et générez une mémofiche structurée.</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert">
            <strong className="font-bold">Erreur : </strong>
            <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
            <label htmlFor="memofiche-type-select" className="block text-lg font-medium text-slate-700 mb-2">
            Type de Mémofiche
            </label>
            <select
            id="memofiche-type-select"
            value={memoFicheType}
            onChange={(e) => setMemoFicheType(e.target.value as any)}
            className="w-full border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-base"
            disabled={isLoading}
            >
            <option value="maladie">Maladie courante</option>
            <option value="pharmacologie">Pharmacologie</option>
            <option value="exhaustive">Synthèse exhaustive</option>
            </select>
        </div>

        {memoFicheType === 'maladie' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label htmlFor="theme-select" className="block text-lg font-medium text-slate-700 mb-2">
                    Thème
                    </label>
                    <select
                    id="theme-select"
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="w-full border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-base"
                    disabled={isLoading}
                    >
                    <option value="">Sélectionnez un thème</option>
                    {TOPIC_CATEGORIES[0].topics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                    ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="system-select" className="block text-lg font-medium text-slate-700 mb-2">
                    Système/Organe
                    </label>
                    <select
                    id="system-select"
                    value={selectedSystem}
                    onChange={(e) => setSelectedSystem(e.target.value)}
                    className="w-full border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-base"
                    disabled={isLoading}
                    >
                    <option value="">Sélectionnez un système/organe</option>
                    {TOPIC_CATEGORIES[1].topics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                    ))}
                    </select>
                </div>
            </div>
        )}

        {memoFicheType === 'pharmacologie' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label htmlFor="pharma-theme-input" className="block text-lg font-medium text-slate-700 mb-2">
                    Thème de la mémofiche
                    </label>
                    <input
                    id="pharma-theme-input"
                    type="text"
                    value={pharmaTheme}
                    onChange={(e) => setPharmaTheme(e.target.value)}
                    placeholder="Ex: Les antiulcéreux"
                    className="w-full border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-base"
                    disabled={isLoading}
                    />
                </div>
                <div>
                    <label htmlFor="pharma-pathology-input" className="block text-lg font-medium text-slate-700 mb-2">
                    Pathologie cible
                    </label>
                    <input
                    id="pharma-pathology-input"
                    type="text"
                    value={pharmaPathology}
                    onChange={(e) => setPharmaPathology(e.target.value)}
                    placeholder="Ex: Le reflux gastro-œsophagien"
                    className="w-full border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-base"
                    disabled={isLoading}
                    />
                </div>
            </div>
        )}

        <div className="mb-6">
            <label htmlFor="source-text" className="block text-lg font-medium text-slate-700 mb-2">
            Texte d'origine
            </label>
            <textarea
            id="source-text"
            rows={10}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Collez votre texte ici..."
            className="w-full border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-base"
            disabled={isLoading}
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <label htmlFor="cover-image-url" className="block text-lg font-medium text-slate-700 mb-2">
                URL de l'image de couverture (Optionnel)
                </label>
                <input
                id="cover-image-url"
                type="text"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://exemple.com/image.jpg"
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-base"
                disabled={isLoading}
                />
            </div>
            <div>
                <label htmlFor="youtube-url" className="block text-lg font-medium text-slate-700 mb-2">
                URL de la vidéo YouTube (Optionnel)
                </label>
                <input
                id="youtube-url"
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-base"
                disabled={isLoading}
                />
            </div>
        </div>

      </div>

      <div className="mt-6 text-center">
        <button
          onClick={handleGenerate}
          disabled={isLoading || !sourceText.trim() || (memoFicheType === 'maladie' && (!selectedTheme || !selectedSystem)) || (memoFicheType === 'pharmacologie' && (!pharmaTheme.trim() || !pharmaPathology.trim()))}
        >
          {isLoading ? (
            <>
              <Spinner />
              <span className="ml-3">Génération en cours...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-6 w-6 mr-2" />
              Générer la mémofiche
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GeneratorView;