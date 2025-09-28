import React, { useState, useEffect, useMemo } from 'react';
import { CaseStudy } from '../types';

interface MemoFicheEditorProps {
  initialCaseStudy?: CaseStudy;
  onSave: (caseStudy: CaseStudy) => void;
  onCancel: () => void;
}

const MemoFicheEditor: React.FC<MemoFicheEditorProps> = ({ initialCaseStudy, onSave, onCancel }) => {
  const [caseStudy, setCaseStudy] = useState<CaseStudy>(initialCaseStudy ? {
    ...initialCaseStudy,
    keyQuestions: initialCaseStudy.keyQuestions || [],
    redFlags: initialCaseStudy.redFlags || [],
    references: initialCaseStudy.references || [],
    recommendations: initialCaseStudy.recommendations || { // Assurer que recommendations est un objet
        mainTreatment: [],
        associatedProducts: [],
        lifestyleAdvice: [],
        dietaryAdvice: [],
    },
    flashcards: initialCaseStudy.flashcards || [],
    glossary: initialCaseStudy.glossary || [],
    media: initialCaseStudy.media || [],
    quiz: initialCaseStudy.quiz || [],
    // Assurer que les champs optionnels sont des chaînes vides si null/undefined
    coverImageUrl: initialCaseStudy.coverImageUrl || '',
    youtubeUrl: initialCaseStudy.youtubeUrl || '',
    level: initialCaseStudy.level || '',
    shortDescription: initialCaseStudy.shortDescription || '',
    kahootUrl: initialCaseStudy.kahootUrl || '',
    sourceText: initialCaseStudy.sourceText || '',
    memoSections: initialCaseStudy.memoSections || [],
} : {
    _id: '',
    title: '',
    theme: '',
    system: '',
    patientSituation: '',
    keyQuestions: [],
    pathologyOverview: '',
    redFlags: [],
    recommendations: {
        mainTreatment: [],
        associatedProducts: [],
        lifestyleAdvice: [],
        dietaryAdvice: [],
    },
    keyPoints: [],
    references: [],
    flashcards: [],
    glossary: [],
    media: [],
    quiz: [],
    creationDate: new Date().toISOString(),
    sourceText: '',
    memoSections: [],
});

  useEffect(() => {
    if (initialCaseStudy) {
      setCaseStudy(initialCaseStudy);
    }
  }, [initialCaseStudy]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Gérer les champs JSON
    if (['flashcards', 'glossary', 'media', 'quiz'].includes(name)) {
      try {
        setCaseStudy(prev => ({ ...prev, [name]: JSON.parse(value) }));
      } catch (error) {
        console.error(`Invalid JSON for ${name}:`, error);
        // Optionnel: afficher une erreur à l'utilisateur, par exemple:
        // alert(`Erreur de format JSON pour le champ ${name}. Veuillez vérifier la syntaxe.`);
        // Ou ne pas mettre à jour l'état pour ce champ si le JSON est invalide
      }
    } else {
      setCaseStudy(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayChange = (name: keyof CaseStudy | string, value: string) => {
    console.log(`handleArrayChange: name=${name}, value=`, value);
    const arrayValue = value.split('\n').map(s => s.trim());
    console.log(`handleArrayChange: arrayValue=`, arrayValue);
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCaseStudy(prev => {
        const newState = {
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]: arrayValue,
          },
        };
        console.log(`handleArrayChange: new state for ${name}=`, newState);
        return newState;
      });
    } else {
      setCaseStudy(prev => {
        const newState = { ...prev, [name as keyof CaseStudy]: arrayValue as any };
        console.log(`handleArrayChange: new state for ${name}=`, newState);
        return newState;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(caseStudy);
  };

  const handleMemoSectionChange = (index: number, field: 'title' | 'content', value: string) => {
    const newMemoSections = [...(caseStudy.memoSections || [])];
    newMemoSections[index] = { ...newMemoSections[index], [field]: value };
    setCaseStudy(prev => ({ ...prev, memoSections: newMemoSections }));
  };

  const addMemoSection = () => {
    const newMemoSections = [...(caseStudy.memoSections || []), { title: '', content: '' }];
    setCaseStudy(prev => ({ ...prev, memoSections: newMemoSections }));
  };

  const moveMemoSection = (index: number, direction: 'up' | 'down') => {
    const newMemoSections = [...(caseStudy.memoSections || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newMemoSections.length) {
      const temp = newMemoSections[index];
      newMemoSections[index] = newMemoSections[newIndex];
      newMemoSections[newIndex] = temp;
      setCaseStudy(prev => ({ ...prev, memoSections: newMemoSections }));
    }
  };

  const deleteMemoSection = (index: number) => {
    const newMemoSections = [...(caseStudy.memoSections || [])];
    newMemoSections.splice(index, 1);
    setCaseStudy(prev => ({ ...prev, memoSections: newMemoSections }));
  };

  const handleFillWithAI = async () => {
    if (!caseStudy.sourceText) {
      alert('Veuillez fournir le texte source complet pour générer les sections.');
      return;
    }

    try {
      // Appel à l'API pour générer la CaseStudy à partir du texte source
      const response = await fetch('/api/generate-case-study-from-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sourceText: caseStudy.sourceText,
          theme: caseStudy.theme, // Envoyer le thème et le système pour un meilleur contexte
          system: caseStudy.system,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Gérer le cas où la réponse n'est pas du JSON
        throw new Error(errorData.details || `Failed to generate sections from AI: ${response.statusText}`);
      }

      const generatedCaseStudy: CaseStudy = await response.json();

      // Fusionner les champs générés par l'IA avec les champs existants de la mémofiche
      // Prioriser les champs générés par l'IA s'ils ne sont pas vides
      setCaseStudy(prev => {
        const newRecommendations = generatedCaseStudy.recommendations ? {
          mainTreatment: generatedCaseStudy.recommendations.mainTreatment?.length > 0 ? generatedCaseStudy.recommendations.mainTreatment : prev.recommendations.mainTreatment,
          associatedProducts: generatedCaseStudy.recommendations.associatedProducts?.length > 0 ? generatedCaseStudy.recommendations.associatedProducts : prev.recommendations.associatedProducts,
          lifestyleAdvice: generatedCaseStudy.recommendations.lifestyleAdvice?.length > 0 ? generatedCaseStudy.recommendations.lifestyleAdvice : prev.recommendations.lifestyleAdvice,
          dietaryAdvice: generatedCaseStudy.recommendations.dietaryAdvice?.length > 0 ? generatedCaseStudy.recommendations.dietaryAdvice : prev.recommendations.dietaryAdvice,
        } : prev.recommendations;

        return {
          ...prev,
          title: generatedCaseStudy.title || prev.title,
          patientSituation: generatedCaseStudy.patientSituation || prev.patientSituation,
          keyQuestions: generatedCaseStudy.keyQuestions?.length > 0 ? generatedCaseStudy.keyQuestions : prev.keyQuestions,
          pathologyOverview: generatedCaseStudy.pathologyOverview || prev.pathologyOverview,
          redFlags: generatedCaseStudy.redFlags?.length > 0 ? generatedCaseStudy.redFlags : prev.redFlags,
          recommendations: newRecommendations,
          keyPoints: generatedCaseStudy.keyPoints?.length > 0 ? generatedCaseStudy.keyPoints : prev.keyPoints,
          references: generatedCaseStudy.references?.length > 0 ? generatedCaseStudy.references : prev.references,
          flashcards: generatedCaseStudy.flashcards?.length > 0 ? generatedCaseStudy.flashcards : prev.flashcards,
          glossary: generatedCaseStudy.glossary?.length > 0 ? generatedCaseStudy.glossary : prev.glossary,
          media: generatedCaseStudy.media?.length > 0 ? generatedCaseStudy.media : prev.media,
          quiz: generatedCaseStudy.quiz?.length > 0 ? generatedCaseStudy.quiz : prev.quiz,
          coverImageUrl: generatedCaseStudy.coverImageUrl || prev.coverImageUrl,
          youtubeUrl: generatedCaseStudy.youtubeUrl || prev.youtubeUrl,
        }
      });
      alert("Sections remplies avec l'IA ! Veuillez vérifier et sauvegarder.");
    } catch (error) {
      console.error('Error in handleFillWithAI:', error);
      alert("Erreur lors du remplissage des sections avec l'IA. Voir la console pour plus de détails.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">{initialCaseStudy ? 'Modifier la Mémofiche' : 'Créer une Nouvelle Mémofiche'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Titre</label>
          <input type="text" name="title" value={caseStudy.title} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Thème</label>
          <input type="text" name="theme" value={caseStudy.theme} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Système</label>
          <input type="text" name="system" value={caseStudy.system} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Situation Patient</label>
          <textarea name="patientSituation" value={caseStudy.patientSituation} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Questions Clés (une par ligne)</label>
          <textarea name="keyQuestions" value={useMemo(() => caseStudy.keyQuestions.map(q => (typeof q === 'string' ? q : q.question)).join('\n'), [caseStudy.keyQuestions])} onChange={(e) => handleArrayChange('keyQuestions', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Aperçu Pathologie</label>
          <textarea name="pathologyOverview" value={caseStudy.pathologyOverview} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Signaux d'Alerte (un par ligne)</label>
          <textarea name="redFlags" value={useMemo(() => caseStudy.redFlags.map(f => (typeof f === 'string' ? f : f.redFlag)).join('\n'), [caseStudy.redFlags])} onChange={(e) => handleArrayChange('redFlags', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
        
        <h3 className="text-xl font-bold mt-6 mb-2">Recommandations</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">Traitement Principal (une par ligne)</label>
          <textarea name="recommendations.mainTreatment" value={useMemo(() => caseStudy.recommendations.mainTreatment.join('\n'), [caseStudy.recommendations.mainTreatment])} onChange={(e) => handleArrayChange('recommendations.mainTreatment', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Produits Associés (une par ligne)</label>
          <textarea name="recommendations.associatedProducts" value={useMemo(() => caseStudy.recommendations.associatedProducts.join('\n'), [caseStudy.recommendations.associatedProducts])} onChange={(e) => handleArrayChange('recommendations.associatedProducts', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Conseils Hygiène de Vie (une par ligne)</label>
          <textarea name="recommendations.lifestyleAdvice" value={useMemo(() => caseStudy.recommendations.lifestyleAdvice.join('\n'), [caseStudy.recommendations.lifestyleAdvice])} onChange={(e) => handleArrayChange('recommendations.lifestyleAdvice', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Conseils Alimentaires (une par ligne)</label>
          <textarea name="recommendations.dietaryAdvice" value={useMemo(() => caseStudy.recommendations.dietaryAdvice.join('\n'), [caseStudy.recommendations.dietaryAdvice])} onChange={(e) => handleArrayChange('recommendations.dietaryAdvice', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Points Clés (un par ligne)</label>
          <textarea name="keyPoints" value={useMemo(() => caseStudy.keyPoints.join('\n'), [caseStudy.keyPoints])} onChange={(e) => handleArrayChange('keyPoints', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Références (une par ligne)</label>
          <textarea name="references" value={useMemo(() => caseStudy.references.map(r => (typeof r === 'string' ? r : r.reference)).join('\n'), [caseStudy.references])} onChange={(e) => handleArrayChange('references', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
        
        {/* Champs pour flashcards, glossary, media, quiz - simplifiés pour l'édition initiale */}
        {/* Vous pouvez ajouter des éditeurs plus complexes pour ces types si nécessaire */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Flashcards (JSON)</label>
          <textarea name="flashcards" value={JSON.stringify(caseStudy.flashcards, null, 2)} onChange={handleChange} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Glossaire (JSON)</label>
          <textarea name="glossary" value={JSON.stringify(caseStudy.glossary, null, 2)} onChange={handleChange} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Médias (JSON)</label>
          <textarea name="media" value={JSON.stringify(caseStudy.media, null, 2)} onChange={handleChange} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Quiz (JSON)</label>
          <textarea name="quiz" value={JSON.stringify(caseStudy.quiz, null, 2)} onChange={handleChange} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">URL Image de Couverture</label>
          <input type="text" name="coverImageUrl" value={caseStudy.coverImageUrl || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">URL YouTube</label>
          <input type="text" name="youtubeUrl" value={caseStudy.youtubeUrl || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Niveau</label>
          <input type="text" name="level" value={caseStudy.level || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Courte Description</label>
          <textarea name="shortDescription" value={caseStudy.shortDescription || ''} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">URL Kahoot</label>
          <input type="text" name="kahootUrl" value={caseStudy.kahootUrl || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">URL Base de Connaissances (Google Doc)</label>
          <input type="text" name="knowledgeBaseUrl" value={caseStudy.knowledgeBaseUrl || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Texte Source Complet</label>
          <textarea name="sourceText" value={caseStudy.sourceText || ''} onChange={handleChange} rows={10} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>

        <h3 className="text-xl font-bold mt-6 mb-2">Sections Mémo</h3>
        {caseStudy.memoSections && caseStudy.memoSections.map((section, index) => (
          <div key={index} className="border p-4 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-semibold">Section {index + 1}</h4>
              <div>
                <button type="button" onClick={() => moveMemoSection(index, 'up')} disabled={index === 0} className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50">Monter</button>
                <button type="button" onClick={() => moveMemoSection(index, 'down')} disabled={index === caseStudy.memoSections.length - 1} className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50">Descendre</button>
                <button type="button" onClick={() => deleteMemoSection(index)} className="px-2 py-1 text-sm text-red-600 hover:text-red-900">Supprimer</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Titre de la Section</label>
              <input type="text" value={section.title} onChange={(e) => handleMemoSectionChange(index, 'title', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contenu de la Section</label>
              <textarea value={section.content} onChange={(e) => handleMemoSectionChange(index, 'content', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
            </div>
          </div>
        ))}
        <button type="button" onClick={addMemoSection} className="mt-2 px-4 py-2 border border-dashed border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
          Ajouter une section Mémo
        </button>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={handleFillWithAI} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
            Remplir avec l'IA
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            Sauvegarder
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemoFicheEditor;