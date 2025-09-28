import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useData } from './contexts/DataContext'; // Import the hook
import { useAuth } from './contexts/AuthContext';
import { UserRole } from '../types';
import { TOPIC_CATEGORIES } from '../constants';
import { CapsuleIcon, LockClosedIcon } from './icons';
import { CaseStudy, MemoFiche } from '../types';
import MemoFicheView from './MemoFicheView'; // Import MemoFicheView

const Dashboard: React.FC = () => {
  const { selectCase } = useData(); // Use the context
  const { user } = useAuth();
  const [memofiches, setMemofiches] = useState<CaseStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  const fetchMemofiches = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      console.log('Fetching memofiches with token:', token ? 'present' : 'absent');
      const response = await fetch('/api/memofiches', { 
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch memofiches, response not OK:', response.status, errorText);
        throw new Error(`Failed to fetch memofiches: ${response.statusText}`);
      }
      const data: CaseStudy[] = await response.json();
      console.log('Successfully fetched memofiches:', data);
      setMemofiches(data);
    } catch (err) {
      console.error('Error fetching memofiches:', err);
      setError(`Failed to load memo fiches: ${err instanceof Error ? err.message : String(err)}. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    fetchMemofiches();
  }, [fetchMemofiches]);

  // Initialize filteredMemofiches as a mutable variable
  let currentFilteredMemofiches = memofiches;

  // Apply filters directly
  if (searchTerm) {
      currentFilteredMemofiches = currentFilteredMemofiches.filter(cs =>
          cs.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cs.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cs.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cs.system.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }

  if (selectedTheme) {
      currentFilteredMemofiches = currentFilteredMemofiches.filter(cs => cs.theme === selectedTheme);
  }

  if (selectedSystem) {
      currentFilteredMemofiches = currentFilteredMemofiches.filter(cs => cs.system === selectedSystem);
  }

  const displayTopics = useMemo(() => {
      const topics = new Set<string>();
      // If a specific theme or system is selected, only show that one as a "topic"
      if (selectedTheme) {
          topics.add(selectedTheme);
      } else if (selectedSystem) {
          topics.add(selectedSystem);
      } else {
          // If no specific theme or system is selected, group by all themes and systems present in filtered data
          currentFilteredMemofiches.forEach(cs => {
              topics.add(cs.theme);
              topics.add(cs.system);
          });
      }
      // Sort topics alphabetically for consistent display
      return Array.from(topics).sort();
  }, [currentFilteredMemofiches, selectedTheme, selectedSystem]); // Dependencies changed

  const getCasesForTopic = (topic: string) => {
      // This function now needs to decide if the topic is a theme or a system
      // based on whether selectedTheme or selectedSystem is active, or by checking TOPIC_CATEGORIES
      const isSystemTopic = TOPIC_CATEGORIES[1].topics.includes(topic);
      const isThemeTopic = TOPIC_CATEGORIES[0].topics.includes(topic);

      if (selectedTheme && topic === selectedTheme) {
          return currentFilteredMemofiches.filter(cs => cs.theme === topic);
      } else if (selectedSystem && topic === selectedSystem) {
          return currentFilteredMemofiches.filter(cs => cs.system === topic);
      } else if (!selectedTheme && !selectedSystem) {
          // If no specific filter is active, group by both theme and system
          if (isThemeTopic) {
              return currentFilteredMemofiches.filter(cs => cs.theme === topic);
          } else if (isSystemTopic) {
              return currentFilteredMemofiches.filter(cs => cs.system === topic);
          }
      }
      return []; // Should not happen if displayTopics is correct
  };

  // Logic for "9 most recent memo fiches" if no filters are applied
  const recentMemofiches = useMemo(() => {
      if (!selectedTheme && !selectedSystem && !searchTerm) {
          return [...memofiches].sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()).slice(0, 9);
      }
      return [];
  }, [memofiches, selectedTheme, selectedSystem, searchTerm]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-slate-600">Loading memo fiches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Bienvenue sur PharmIA</h2>
          <p className="text-lg text-slate-600">Explorez les thèmes disponibles et consultez les mémofiches générées.</p>
        </div>

        {/* Removed AdminPanel rendering */}

        <div className="mb-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className="relative w-full sm:w-1/2">
                <input
                    type="text"
                    placeholder="Rechercher une mémofiche..."
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="relative w-full sm:w-1/4">
                <select
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10"
                    value={selectedTheme}
                    onChange={(e) => { setSelectedTheme(e.target.value); setSelectedSystem(''); }} // Clear system when theme is selected
                >
                    <option value="">Filtrer par Thème</option>
                    {TOPIC_CATEGORIES[0].topics.map(theme => (
                        <option key={theme} value={theme}>{theme}</option>
                    ))}
                </select>
                {selectedTheme && (
                    <button
                        onClick={() => setSelectedTheme('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="relative w-full sm:w-1/4">
                <select
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10"
                    value={selectedSystem}
                    onChange={(e) => { setSelectedSystem(e.target.value); setSelectedTheme(''); }} // Clear theme when system is selected
                >
                    <option value="">Filtrer par Système/Organe</option>
                    {TOPIC_CATEGORIES[1].topics.map(system => (
                        <option key={system} value={system}>{system}</option>
                    ))}
                </select>
                {selectedSystem && (
                    <button
                        onClick={() => setSelectedSystem('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                        )}
                      </div>
                      {showSubscribeModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" onClick={() => setShowSubscribeModal(false)}>
                          <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-sm mx-auto" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-2xl font-bold text-slate-800 mb-4">Contenu réservé aux abonnés</h3>
                            <p className="text-slate-600 mb-6">Cette mémofiche est réservée aux abonnés. Passez à un plan supérieur pour débloquer tout le contenu.</p>
                            <div className="flex justify-center gap-4">
                              <button onClick={() => setShowSubscribeModal(false)} className="px-6 py-2 font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300">
                                Plus tard
                              </button>
                              <Link to="/pricing" className="px-6 py-2 font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700">
                                Voir les offres
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
        {/* Removed category buttons div */}

        {/* Conditional rendering based on filters */}
        {recentMemofiches.length > 0 ? (
            <>
                <h3 className="text-2xl font-bold text-slate-800 mb-4 mt-8 text-center">Mémofiches Récentes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {recentMemofiches.map(study => (
                        <MemoFicheView
                            key={study._id}
                            memoFiche={study as MemoFiche}
                            onDeleteSuccess={fetchMemofiches}
                            onSelectCase={(selectedFiche) => selectedFiche.isLocked ? setShowSubscribeModal(true) : selectCase(selectedFiche)}
                        />
                    ))}
                </div>
            </>
        ) : (
            // Render grouped by theme/system if filters are active or if recentMemofiches is empty
            displayTopics.length > 0 ? (
                displayTopics.map((topic) => {
                    const topicCases = getCasesForTopic(topic);
                    if (topicCases.length > 0) {
                        return (
                            <div key={topic} className="mb-8">
                                <h3 className="text-2xl font-bold text-slate-800 mb-4">{topic}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                                    {topicCases.map(study => (
                                        <MemoFicheView
                                            key={study._id}
                                            memoFiche={study as MemoFiche}
                                            onDeleteSuccess={fetchMemofiches}
                                            onSelectCase={(selectedFiche) => selectedFiche.isLocked ? setShowSubscribeModal(true) : selectCase(selectedFiche)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    }
                    return null; // Don't render topic if no cases
                })
            ) : (
                <div className="text-center text-slate-600 mt-8">Aucune mémofiche trouvée pour les filtres sélectionnés.</div>
            )
        )}
      </div>
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" onClick={() => setShowSubscribeModal(false)}>
          <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-sm mx-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Contenu réservé aux abonnés</h3>
            <p className="text-slate-600 mb-6">Cette mémofiche est réservée aux abonnés. Passez à un plan supérieur pour débloquer tout le contenu.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShowSubscribeModal(false)} className="px-6 py-2 font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300">
                Plus tard
              </button>
              <Link to="/pricing" className="px-6 py-2 font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700">
                Voir les offres
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;