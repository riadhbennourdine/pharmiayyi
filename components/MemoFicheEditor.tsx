import React, { useState, useEffect, useMemo } from 'react';
import { CaseStudy } from '../types';
import { ensureArray } from '../utils/array';

interface MemoFicheEditorProps {
  initialCaseStudy?: CaseStudy;
  onSave: (caseStudy: CaseStudy) => void;
  onCancel: () => void;
}

const createSafeCaseStudy = (caseStudy: CaseStudy | undefined): CaseStudy => {
  const safeCaseStudy: CaseStudy = {
    _id: caseStudy?._id || '',
    title: caseStudy?.title || '',
    theme: caseStudy?.theme || '',
    system: caseStudy?.system || '',
    patientSituation: caseStudy?.patientSituation || '',
    keyQuestions: ensureArray(caseStudy?.keyQuestions),
    pathologyOverview: caseStudy?.pathologyOverview || '',
    redFlags: ensureArray(caseStudy?.redFlags),
    recommendations: {
      mainTreatment: ensureArray(caseStudy?.recommendations?.mainTreatment),
      associatedProducts: ensureArray(caseStudy?.recommendations?.associatedProducts),
      lifestyleAdvice: ensureArray(caseStudy?.recommendations?.lifestyleAdvice),
      dietaryAdvice: ensureArray(caseStudy?.recommendations?.dietaryAdvice),
    },
    keyPoints: ensureArray(caseStudy?.keyPoints),
    references: ensureArray(caseStudy?.references),
    flashcards: ensureArray(caseStudy?.flashcards),
    glossary: ensureArray(caseStudy?.glossary),
    media: ensureArray(caseStudy?.media),
    quiz: ensureArray(caseStudy?.quiz),
    creationDate: caseStudy?.creationDate || new Date().toISOString(),
    sourceText: caseStudy?.sourceText || '',
    memoSections: ensureArray(caseStudy?.memoSections),
    coverImageUrl: caseStudy?.coverImageUrl || '',
    youtubeUrl: caseStudy?.youtubeUrl || '',
    level: caseStudy?.level || '',
    shortDescription: caseStudy?.shortDescription || '',
    kahootUrl: caseStudy?.kahootUrl || '',
    knowledgeBaseUrl: caseStudy?.knowledgeBaseUrl || '',
    isLocked: caseStudy?.isLocked || false,
    isFree: caseStudy?.isFree || false,
  };
  return safeCaseStudy;
};

const MemoFicheEditor: React.FC<MemoFicheEditorProps> = ({ initialCaseStudy, onSave, onCancel }) => {
  const [caseStudy, setCaseStudy] = useState<CaseStudy>(createSafeCaseStudy(initialCaseStudy));
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    const newCaseStudy = createSafeCaseStudy(initialCaseStudy);
    setCaseStudy(newCaseStudy);

    const initialSections = [
      { id: 'title', title: 'Titre', render: () => <input type="text" name="title" value={newCaseStudy.title} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required /> },
      { id: 'theme', title: 'Thème', render: () => <input type="text" name="theme" value={newCaseStudy.theme} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required /> },
      { id: 'system', title: 'Système', render: () => <input type="text" name="system" value={newCaseStudy.system} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required /> },
      { id: 'patientSituation', title: 'Situation Patient', render: () => <textarea name="patientSituation" value={newCaseStudy.patientSituation} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'keyQuestions', title: 'Questions Clés (une par ligne)', render: () => <textarea name="keyQuestions" value={newCaseStudy.keyQuestions.join('\n')} onChange={(e) => handleArrayChange('keyQuestions', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'pathologyOverview', title: 'Aperçu Pathologie', render: () => <textarea name="pathologyOverview" value={newCaseStudy.pathologyOverview} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'redFlags', title: 'Signaux d\'Alerte (un par ligne)', render: () => <textarea name="redFlags" value={newCaseStudy.redFlags.join('\n')} onChange={(e) => handleArrayChange('redFlags', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'recommendations.mainTreatment', title: 'Traitement Principal (une par ligne)', render: () => <textarea name="recommendations.mainTreatment" value={newCaseStudy.recommendations.mainTreatment.join('\n')} onChange={(e) => handleArrayChange('recommendations.mainTreatment', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'recommendations.associatedProducts', title: 'Produits Associés (une par ligne)', render: () => <textarea name="recommendations.associatedProducts" value={newCaseStudy.recommendations.associatedProducts.join('\n')} onChange={(e) => handleArrayChange('recommendations.associatedProducts', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'recommendations.lifestyleAdvice', title: 'Conseils Hygiène de Vie (une par ligne)', render: () => <textarea name="recommendations.lifestyleAdvice" value={newCaseStudy.recommendations.lifestyleAdvice.join('\n')} onChange={(e) => handleArrayChange('recommendations.lifestyleAdvice', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'recommendations.dietaryAdvice', title: 'Conseils Alimentaires (une par ligne)', render: () => <textarea name="recommendations.dietaryAdvice" value={newCaseStudy.recommendations.dietaryAdvice.join('\n')} onChange={(e) => handleArrayChange('recommendations.dietaryAdvice', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'keyPoints', title: 'Points Clés (un par ligne)', render: () => <textarea name="keyPoints" value={newCaseStudy.keyPoints.join('\n')} onChange={(e) => handleArrayChange('keyPoints', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'references', title: 'Références (une par ligne)', render: () => <textarea name="references" value={newCaseStudy.references.join('\n')} onChange={(e) => handleArrayChange('references', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'flashcards', title: 'Flashcards (JSON)', render: () => <textarea name="flashcards" value={JSON.stringify(newCaseStudy.flashcards, null, 2)} onChange={handleChange} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'glossary', title: 'Glossaire (JSON)', render: () => <textarea name="glossary" value={JSON.stringify(newCaseStudy.glossary, null, 2)} onChange={handleChange} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'media', title: 'Médias (JSON)', render: () => <textarea name="media" value={JSON.stringify(newCaseStudy.media, null, 2)} onChange={handleChange} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'quiz', title: 'Quiz (JSON)', render: () => <textarea name="quiz" value={JSON.stringify(newCaseStudy.quiz, null, 2)} onChange={handleChange} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'coverImageUrl', title: 'URL Image de Couverture', render: () => <input type="text" name="coverImageUrl" value={newCaseStudy.coverImageUrl || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /> },
      { id: 'youtubeUrl', title: 'URL YouTube', render: () => <input type="text" name="youtubeUrl" value={newCaseStudy.youtubeUrl || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /> },
      { id: 'level', title: 'Niveau', render: () => <input type="text" name="level" value={newCaseStudy.level || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /> },
      { id: 'shortDescription', title: 'Courte Description', render: () => <textarea name="shortDescription" value={newCaseStudy.shortDescription || ''} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
      { id: 'kahootUrl', title: 'URL Kahoot', render: () => <input type="text" name="kahootUrl" value={newCaseStudy.kahootUrl || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /> },
      { id: 'knowledgeBaseUrl', title: 'URL Base de Connaissances (Google Doc)', render: () => <input type="text" name="knowledgeBaseUrl" value={newCaseStudy.knowledgeBaseUrl || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /> },
      { id: 'sourceText', title: 'Texte Source Complet', render: () => <textarea name="sourceText" value={newCaseStudy.sourceText || ''} onChange={handleChange} rows={10} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea> },
    ];

    newCaseStudy.memoSections?.forEach((section, index) => {
      initialSections.push({
        id: `memoSection-${index}`,
        title: section.title,
        render: () => (
          <div>
            <label className="block text-sm font-medium text-gray-700">Titre de la Section</label>
            <input type="text" value={section.title} onChange={(e) => handleMemoSectionChange(index, 'title', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            <label className="block text-sm font-medium text-gray-700">Contenu de la Section</label>
            <textarea value={section.content} onChange={(e) => handleMemoSectionChange(index, 'content', e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
          </div>
        ),
      });
    });

    setSections(initialSections);
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

    const newCaseStudy: CaseStudy = { ...caseStudy };

    sections.forEach(section => {
      if (section.id.startsWith('memoSection-')) {
        const index = parseInt(section.id.split('-')[1]);
        if (!newCaseStudy.memoSections) {
          newCaseStudy.memoSections = [];
        }
        newCaseStudy.memoSections[index] = { title: section.title, content: section.render().props.children[1].props.value };
      } else if (section.id.includes('.')) {
        const [parent, child] = section.id.split('.');
        if (!newCaseStudy[parent]) {
          newCaseStudy[parent] = {};
        }
        newCaseStudy[parent][child] = section.render().props.value.split('\n');
      } else {
        newCaseStudy[section.id] = section.render().props.value;
      }
    });

    onSave(newCaseStudy);
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

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newSections.length) {
      const temp = newSections[index];
      newSections[index] = newSections[newIndex];
      newSections[newIndex] = temp;
      setSections(newSections);
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
        {sections.map((section, index) => (
          <div key={section.id} className="border p-4 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">{section.title}</h3>
              <div>
                <button type="button" onClick={() => moveSection(index, 'up')} disabled={index === 0} className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50">Monter</button>
                <button type="button" onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50">Descendre</button>
              </div>
            </div>
            {section.render()}
          </div>
        ))}

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