import React, { useState, useMemo, useEffect } from 'react';
import type { CaseStudy, GlossaryTerm } from '../types';
import { VideoCameraIcon, KeyIcon, CheckCircleIcon, PencilIcon, TrashIcon } from './icons'; // Ajout de TrashIcon
import FlashcardDeck from './FlashcardDeck';
import CustomChatBot from './CustomChatBot';
import { useAuth } from './contexts/AuthContext'; // Ajout de useAuth

interface MemoFicheViewProps {
  caseStudy: CaseStudy;
  onBack: () => void;
  onStartQuiz: () => void;
  onEdit: () => void; // Nouvelle prop
  isPreview?: boolean;
}

type TabName = 'memo' | 'flashcards' | 'quiz' | 'glossary' | 'media';

const GlossaryTermWrapper: React.FC<{ term: string; definition: string; children: React.ReactNode }> = ({ term, definition, children }) => (
    <span className="glossary-term" aria-label={`Définition de ${term}`}>
        {children}
        <span className="tooltip">{definition}</span>
    </span>
);

const AccordionSection: React.FC<{ 
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isAlert?: boolean;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ title, icon, children, isAlert = false, isOpen, onToggle }) => (
    <div className="mb-2 bg-white rounded-lg shadow-sm border border-slate-200/80 overflow-hidden transition-all duration-300">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
            aria-expanded={isOpen}
        >
            <div className="flex items-center">
                {icon}
                <h3 className={`text-lg font-bold ${isAlert ? 'text-red-600' : 'text-slate-800'}`}>{title}</h3>
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

const MemoFicheView: React.FC<MemoFicheViewProps> = ({ caseStudy: rawCaseStudy, onBack, onStartQuiz, onEdit, isPreview = false }) => {
  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); // Empty dependency array ensures this runs only once on mount

  const { user } = useAuth();

  // Track memo fiche as read
  useEffect(() => {
    const trackReadFiche = async () => {
      if (user && rawCaseStudy._id) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/user/track-read-fiche', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ ficheId: rawCaseStudy._id }),
          });

          if (!response.ok) {
            console.error('Failed to track read fiche:', await response.text());
          }
        } catch (error) {
          console.error('Error tracking read fiche:', error);
        }
      }
    };
    trackReadFiche();
  }, [user, rawCaseStudy._id]); // Re-run when user or caseStudy changes

  const userRole = user?.role?.toUpperCase();
  const isAuthorized = userRole === 'ADMIN' || userRole === 'FORMATEUR';
  const canEdit = isAuthorized && !isPreview;
  const canDelete = userRole === 'ADMIN' && !isPreview;
  console.log("User:", user);
  console.log("isAuthorized:", isAuthorized);

  const caseStudy = useMemo(() => ({
    ...rawCaseStudy,
    keyQuestions: rawCaseStudy.keyQuestions || [],
    redFlags: rawCaseStudy.redFlags || [],
    references: rawCaseStudy.references || [],
    recommendations: rawCaseStudy.recommendations || {
        mainTreatment: [],
        associatedProducts: [],
        lifestyleAdvice: [],
        dietaryAdvice: [],
    },
    glossary: rawCaseStudy.glossary || [],
    flashcards: rawCaseStudy.flashcards || [],
    media: rawCaseStudy.media || [],
    quiz: rawCaseStudy.quiz || [],
    keyPoints: rawCaseStudy.keyPoints || [],
  }), [rawCaseStudy]);

  const [openSection, setOpenSection] = useState<string | null>('patientSituation');
  const [activeTab, setActiveTab] = useState<TabName>('memo');
  const [isYoutubeModalOpen, setYoutubeModalOpen] = useState(false);

  const handleToggle = (title: string) => {
    setOpenSection(openSection === title ? null : title);
  };

  const handleMarkAsSeen = async () => {
    if (user && caseStudy.youtubeUrl) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/track-media-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ mediaId: caseStudy.youtubeUrl }),
        });
        if (response.ok) {
          alert('Média marqué comme vu !');
        } else {
          alert('Erreur lors du marquage comme vu.');
        }
      } catch (error) {
        console.error('Error tracking media view:', error);
        alert('Erreur lors du marquage comme vu.');
      }
    }
  };

  const handleMediaView = async () => {
    setYoutubeModalOpen(true);
  };

  const handleDelete = async () => {
    // @ts-ignore
    if (!rawCaseStudy._id) return;

    const isConfirmed = window.confirm("Êtes-vous sûr de vouloir supprimer cette mémofiche ? Cette action est irréversible.");

    if (isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        // @ts-ignore
        const response = await fetch(`/api/memofiches/${rawCaseStudy._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          alert('Mémofiche supprimée avec succès.');
          onBack(); // Go back to the previous view
        } else {
          const errorData = await response.json();
          alert(`Erreur lors de la suppression : ${errorData.message || 'Erreur inconnue'}`);
        }
      } catch (error) {
        console.error('Failed to delete memo fiche:', error);
        alert('Une erreur réseau est survenue lors de la tentative de suppression.');
      }
    }
  };

  const getYoutubeEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId = '';
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v') || '';
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch (error) {
        console.error("Invalid YouTube URL:", error);
        return null;
    }
  };

  const youtubeEmbedUrl = getYoutubeEmbedUrl(caseStudy.youtubeUrl);
  console.log('youtubeEmbedUrl:', youtubeEmbedUrl);
  
  const formattedDate = caseStudy.creationDate 
    ? new Date(caseStudy.creationDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const memoContent = useMemo(() => {
    const highlightGlossaryTerms = (text: any): React.ReactNode[] => {
        let textAsString = String(text || '');
        if (!textAsString) {
            return [''];
        }

        // Handle markdown bolding
        textAsString = textAsString.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Return the text with bolding applied
        return [<span dangerouslySetInnerHTML={{ __html: textAsString }} />];
    };

    return [
        {
            id: 'patientSituation', 
            title: 'Cas comptoir', 
            icon: <img src="https://pharmaconseilbmb.com/photos/site/icone/14.png" className="h-6 w-6 mr-3" alt="Cas comptoir" />,
            content: <p>{highlightGlossaryTerms(caseStudy.patientSituation)}</p>
        },
        {
            id: 'keyQuestions',
            title: 'Questions clés à poser',
            icon: <img src="https://pharmaconseilbmb.com/photos/site/icone/15.png" className="h-6 w-6 mr-3" alt="Questions clés" />,
            content: (
                <ul className="list-disc pl-5 space-y-1">
                {caseStudy.keyQuestions.map((q: any, i: number) => <li key={i}>{highlightGlossaryTerms(q.question || q)}</li>)}
                </ul>
            )
        },
        {
            id: "pathologyOverview",
            title: "Aperçu pathologie",
            icon: <img src="https://pharmaconseilbmb.com/photos/site/icone/16.png" className="h-6 w-6 mr-3" alt="Aperçu pathologie" />,
            content: (
                <ul className="list-disc pl-5 space-y-1">
                    {(Array.isArray(caseStudy.pathologyOverview) ? caseStudy.pathologyOverview : [caseStudy.pathologyOverview]).map((item: any, i: number) => <li key={i}>{highlightGlossaryTerms(item)}</li>)}
                </ul>
            )
        },
        {
            id: "redFlags",
            title: "Signaux d'alerte",
            icon: <img src="https://pharmaconseilbmb.com/photos/site/icone/17.png" className="h-6 w-6 mr-3" alt="Signaux d'alerte" />,
            isAlert: true,
            content: (
                <ul className="list-disc pl-5 space-y-1 text-red-700 font-medium">
                {caseStudy.redFlags.map((flag: any, i: number) => <li key={i}>{highlightGlossaryTerms(flag.redFlag || flag)}</li>)}
                </ul>
            )
        },
        {
            id: 'mainTreatment',
            title: 'Traitement principal',
            icon: <img src="https://pharmaconseilbmb.com/photos/site/icone/18.png" className="h-6 w-6 mr-3" alt="Traitement principal" />,
            content: (
                <ul className="list-disc pl-5 space-y-1">
                    {caseStudy.recommendations.mainTreatment.map((item: any, i: number) => <li key={i}>{highlightGlossaryTerms(item)}</li>)}
                </ul>
            )
        },
        {
            id: 'associatedProducts',
            title: 'Produits associés',
            icon: <img src="https://pharmaconseilbmb.com/photos/site/icone/19.png" className="h-6 w-6 mr-3" alt="Produits associés" />,
            content: (
                <ul className="list-disc pl-5 space-y-1">
                    {caseStudy.recommendations.associatedProducts.map((item: any, i: number) => <li key={i}>{highlightGlossaryTerms(item)}</li>)}
                </ul>
            )
        },
        {
            id: 'lifestyleAdvice',
            title: 'Hygiène de vie',
            icon: <img src="https://pharmaconseilbmb.com/photos/site/icone/20.png" className="h-6 w-6 mr-3" alt="Hygiène de vie" />,
            content: (
                <ul className="list-disc pl-5 space-y-1">
                    {caseStudy.recommendations.lifestyleAdvice.map((item, i) => <li key={i}>{highlightGlossaryTerms(item)}</li>)}
                </ul>
            )
        },
        {
            id: 'dietaryAdvice',
            title: 'Conseils alimentaires',
            icon: <img src="https://pharmaconseilbmb.com/photos/site/icone/21.png" className="h-6 w-6 mr-3" alt="Conseils alimentaires" />,
            content: (
                <ul className="list-disc pl-5 space-y-1">
                    {caseStudy.recommendations.dietaryAdvice.map((item, i) => <li key={i}>{highlightGlossaryTerms(item)}</li>)}
                </ul>
            )
        },
        {
            id: "references",
            title: "Références bibliographiques",
            icon: <img src="https://pharmaconseilbmb.com/photos/site/icone/22.png" className="h-6 w-6 mr-3" alt="Références bibliographiques" />,
            content: (
                <ul className="list-disc pl-5 space-y-1 text-sm">
                {caseStudy.references.map((ref: any, i: number) => <li key={i}>{highlightGlossaryTerms(ref.reference || ref)}</li>)}
                </ul>
            )
        }
    ];
  }, [caseStudy]);
  
  const menuItems: { id: TabName; label: string; icon: React.ReactNode }[] = [
      { id: 'memo', label: 'Mémo', icon: <img src="https://pharmaconseilbmb.com/photos/site/icone/9.png" className="h-8 w-8" alt="Mémo" /> },
      { id: 'flashcards', label: 'Flashcards', icon: <img src="https://pharmaconseilbmb.com/photos/site/icone/10.png" className="h-8 w-8" alt="Flashcards" /> },
  ];

  if (!isPreview) {
      menuItems.push({ id: 'quiz', label: 'Quiz', icon: <img src="https://pharmaconseilbmb.com/photos/site/quiz-2.png" className="h-8 w-8" alt="Quiz" /> });
      menuItems.push({ id: 'kahoot', label: 'Kahoot', icon: <img src="https://pharmaconseilbmb.com/photos/site/icons8-kahoot-48.png" className="h-8 w-8" alt="Kahoot" /> });
  }

  menuItems.push(
      { id: 'glossary', label: 'Glossaire', icon: <img src="https://pharmaconseilbmb.com/photos/site/icone/12.png" className="h-8 w-8" alt="Glossaire" /> },
      { id: 'media', label: 'Médias', icon: <img src="https://pharmaconseilbmb.com/photos/site/icone/13.png" className="h-8 w-8" alt="Médias" /> }
  );

  const renderContent = () => {
      switch (activeTab) {
          case 'memo':
              return memoContent.map(section => (
                  <AccordionSection
                    key={section.id}
                    title={section.title}
                    icon={section.icon}
                    isAlert={!!section.isAlert}
                    isOpen={openSection === section.id}
                    onToggle={() => handleToggle(section.id)}
                  >
                    {section.content}
                  </AccordionSection>
                ));
          case 'flashcards':
              return <FlashcardDeck flashcards={caseStudy.flashcards} />;
          case 'glossary':
              return (
                  <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                      {caseStudy.glossary.map((item, i) => (
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
                      {youtubeEmbedUrl ? (
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h4 className="font-bold text-slate-800 mb-4">Vidéo associée</h4>
                            <div className="w-full">
                                <iframe 
                                    src={youtubeEmbedUrl} 
                                    title="YouTube video player" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                    className="w-full rounded-md" 
                                    style={{ height: '80vh' }}
                                ></iframe>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleMarkAsSeen}
                                    className="px-4 py-2 bg-[#0B8278] text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                                >
                                    Marquer comme vu
                                </button>
                            </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-500">
                          Aucun média disponible pour cette mémofiche.
                        </div>
                      )}
                  </div>
              );
        case 'quiz':
            return (
                <div className="text-center bg-white p-8 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">Testez vos connaissances !</h3>
                    <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                        Évaluez votre compréhension du cas avec un quiz interactif. Les questions sont générées par l'IA pour couvrir les points essentiels.
                    </p>
                    <button
                        onClick={onStartQuiz}
                        className="inline-flex items-center bg-[#0B8278] text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                        <CheckCircleIcon className="h-6 w-6 mr-2" />
                        Démarrer le Quiz
                    </button>
                </div>
            );
        case 'kahoot':
            return (
                <div className="space-y-4">
                    {caseStudy.kahootUrl ? (
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h4 className="font-bold text-slate-800 mb-4">Jeu Kahoot!</h4>
                            <div className="aspect-w-16 aspect-h-9">
                                <iframe 
                                    src={caseStudy.kahootUrl} 
                                    title="Kahoot! Game" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                    className="w-full h-full rounded-md"
                                ></iframe>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-4 rounded-lg shadow-md text-center text-slate-600">
                            Aucun lien Kahoot! disponible pour cette mémofiche.
                        </div>
                    )}
                </div>
            );
      }
  };

  return (
    <div className="animate-fade-in">
        <style>{`
            .glossary-term {
                position: relative;
                text-decoration: underline dotted;
                cursor: help;
            }
            .glossary-term .tooltip {
                visibility: hidden;
                width: 250px;
                background-color: #334155;
                color: #fff;
                text-align: left;
                border-radius: 6px;
                padding: 8px 12px;
                position: absolute;
                z-index: 10;
                bottom: 125%;
                left: 50%;
                margin-left: -125px;
                opacity: 0;
                transition: opacity 0.3s;
                font-size: 0.875rem;
                line-height: 1.25rem;
                font-weight: 400;
                text-decoration: none;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .glossary-term .tooltip::after {
                content: "";
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -5px;
                border-width: 5px;
                border-style: solid;
                border-color: #334155 transparent transparent transparent;
            }
            .glossary-term:hover .tooltip {
                visibility: visible;
                opacity: 1;
            }
        `}</style>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {caseStudy.coverImageUrl ? (
                <div className="mb-8 rounded-lg overflow-hidden shadow-lg relative h-64 flex items-end p-8 text-white bg-slate-800">
                    <img src={caseStudy.coverImageUrl} alt={`Image de couverture pour ${caseStudy.title}`} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10"></div>
                    <div className="relative z-20">
                        <h2 className="text-4xl font-extrabold tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            {caseStudy.title}
                        </h2>
                        <div className="mt-2 text-sm font-medium opacity-90" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                            <span>{caseStudy.theme}</span>
                            <span className="mx-2">&bull;</span>
                            <span>{caseStudy.system}</span>
                            {formattedDate && (
                                <>
                                    <span className="mx-2">&bull;</span>
                                    <span>{`Créé le ${formattedDate}`}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                 <div className="text-center mb-8">
                    <div className="flex items-center justify-center">
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{caseStudy.title}</h2>
                        {youtubeEmbedUrl && (
                            <button
                                onClick={handleMediaView}
                                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                            >
                                <VideoCameraIcon className="h-5 w-5 mr-2" />
                                Voir la vidéo
                            </button>
                        )}
                    </div>
                 </div>
            )}

            {isYoutubeModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={() => setYoutubeModalOpen(false)}>
                    <div className="bg-white p-4 rounded-lg shadow-lg relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setYoutubeModalOpen(false)} className="absolute -top-2 -right-2 bg-white rounded-full p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="aspect-w-16 aspect-h-9">
                            <iframe
                                src={youtubeEmbedUrl}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full rounded-md"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
            
            {caseStudy.keyPoints && caseStudy.keyPoints.length > 0 && (
                <div className="mb-8 p-6 bg-teal-50 border-l-4 border-teal-500 rounded-r-lg shadow-sm">
                    <h3 className="text-xl font-bold text-teal-800 mb-3 flex items-center">
                        <KeyIcon className="h-6 w-6 mr-3" />
                        Points Clés à Retenir
                    </h3>
                    <ul className="space-y-2 pl-5 list-disc text-teal-900">
                        {caseStudy.keyPoints.map((point, i) => (
                            <li key={i} className="text-base">{point}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="mb-6 border-b border-slate-200 flex space-x-0.5 sm:space-x-1 overflow-x-auto pb-px">
                       {menuItems.map(item => (
                           <button
                             key={item.id}
                             onClick={() => setActiveTab(item.id)}
                             className={`flex flex-col items-center px-2 sm:px-3 py-2 text-sm sm:text-base font-medium rounded-t-md transition-colors duration-300 focus:outline-none ${ 
                                 activeTab === item.id
                                 ? 'border-b-2 border-teal-600 text-teal-600 bg-teal-50/50'
                                 : 'text-slate-500 hover:text-teal-500 hover:bg-slate-100/50'
                             }`}
                             aria-current={activeTab === item.id ? 'page' : undefined}
                           >
                               {React.cloneElement(item.icon as React.ReactElement, { className: `${(item.icon as React.ReactElement).props.className} flex-shrink-0` })} <span className="text-xs mt-1 text-center">{item.label}</span>
                           </button>
                       ))}
                    </div>
                    
                    <div className="min-h-[300px]">
                      {renderContent()}
                    </div>
                     <div className="mt-8 flex items-center justify-center space-x-4"> 
                        <button 
                            onClick={onBack} 
                            className="px-6 py-3 text-base font-bold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                          {isPreview ? "Générer une autre fiche" : "Retour à l'accueil"}
                        </button>
                        {!isPreview && canEdit && (
                            <button
                                onClick={onEdit}
                                className="px-6 py-3 text-base font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                                <PencilIcon className="h-5 w-5 mr-2" /> Modifier
                            </button>
                        )}
                        {!isPreview && canDelete && (
                            <button
                                onClick={handleDelete}
                                className="px-6 py-3 text-base font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                            >
                                <TrashIcon className="h-5 w-5 mr-2" /> Supprimer
                            </button>
                        )}
                    </div>
                </div>
                
                <aside className="lg:col-span-1 z-50">
                    <div className="sticky top-24">
                        <CustomChatBot context={JSON.stringify(caseStudy)} />
                    </div>
                </aside>
            </div>
        </div>
    </div>
  );
};

export default MemoFicheView;
