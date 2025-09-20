import React, { useState, useEffect, useMemo } from 'react';
import { useData } from './contexts/DataContext'; // Import the hook
import { useAuth } from './contexts/AuthContext';
import { UserRole } from '../types';
import { TOPIC_CATEGORIES } from '../constants';
import { CapsuleIcon } from './icons';
import { CaseStudy } from '../types';

const AdminPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [preparateurs, setPreparateurs] = useState<User[]>([]);
  const [pharmacists, setPharmacists] = useState<User[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentFeedback, setAssignmentFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { user } = useAuth();

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Fetch Preparateurs
      const preparateursResponse = await fetch('/api/users/preparateurs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (preparateursResponse.ok) {
        const data = await preparateursResponse.json();
        setPreparateurs(data);
      } else {
        console.error('Failed to fetch preparateurs');
      }

      // Fetch Pharmacists
      const pharmacistsResponse = await fetch('/api/users/pharmacists', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (pharmacistsResponse.ok) {
        const data = await pharmacistsResponse.json();
        setPharmacists(data);
      } else {
        console.error('Failed to fetch pharmacists');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdate = async () => {
    setIsLoading(true);
    setFeedback(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setFeedback({ message: 'Erreur: Token d\'authentification introuvable.', type: 'error' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/update-knowledge-base', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue lors de la mise à jour.');
      }

      setFeedback({ message: `Mise à jour terminée ! ${data.processed} fiches traitées, ${data.chunks} morceaux créés.`, type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      setFeedback({ message: `Erreur: ${errorMessage}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignPharmacist = async (preparateurId: string, newPharmacistId: string) => {
    setAssignmentLoading(true);
    setAssignmentFeedback(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setAssignmentFeedback({ message: 'Erreur: Token d\'authentification introuvable.', type: 'error' });
      setAssignmentLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/${preparateurId}/assign-pharmacist`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pharmacistId: newPharmacistId || null }), // Send null if unassigning
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue lors de l\'attribution.');
      }

      setAssignmentFeedback({ message: 'Attribution mise à jour avec succès.', type: 'success' });
      fetchUsers(); // Re-fetch users to update the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      setAssignmentFeedback({ message: `Erreur: ${errorMessage}`, type: 'error' });
    } finally {
      setAssignmentLoading(false);
    }
  };

  return (
    <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-lg my-8">
      <h3 className="font-bold text-lg">Panneau d\'Administration</h3>
      <p className="text-sm mb-4">Cette section n'est visible que par les administrateurs.</p>
      <button
        onClick={handleUpdate}
        disabled={isLoading}
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded disabled:bg-orange-300 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Mise à jour en cours...' : 'Lancer la mise à jour de la base de connaissances'}
      </button>
      {feedback && (
        <p className={`mt-4 text-sm font-semibold ${feedback.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
          {feedback.message}
        </p>
      )}

      <div className="mt-8 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg">
        <h3 className="font-bold text-lg mb-4">Gestion des Attributions Préparateur-Pharmacien</h3>
        {assignmentFeedback && (
          <p className={`mb-4 text-sm font-semibold ${assignmentFeedback.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {assignmentFeedback.message}
          </p>
        )}
        {preparateurs.length === 0 ? (
          <p>Aucun préparateur trouvé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-2 px-4 text-left">Préparateur</th>
                  <th className="py-2 px-4 text-left">Pharmacien Référent Actuel</th>
                  <th className="py-2 px-4 text-left">Attribuer un Pharmacien</th>
                  <th className="py-2 px-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {preparateurs.map((prep) => (
                  <tr key={prep._id?.toString()} className="border-b border-blue-200 last:border-b-0">
                    <td className="py-2 px-4">{prep.firstName} {prep.lastName} ({prep.email})</td>
                    <td className="py-2 px-4">
                      {pharmacists.find(p => p._id?.toString() === prep.pharmacistId?.toString())?.firstName || 'Non attribué'}
                      {' '}
                      {pharmacists.find(p => p._id?.toString() === prep.pharmacistId?.toString())?.lastName || ''}
                    </td>
                    <td className="py-2 px-4">
                      <select
                        value={prep.pharmacistId?.toString() || ''}
                        onChange={(e) => handleAssignPharmacist(prep._id?.toString() || '', e.target.value)}
                        className="p-2 border border-blue-300 rounded-md w-full"
                        disabled={assignmentLoading}
                      >
                        <option value="">-- Sélectionner --</option>
                        {pharmacists.map((ph) => (
                          <option key={ph._id?.toString()} value={ph._id?.toString()}>
                            {ph.firstName} {ph.lastName} ({ph.email})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => handleAssignPharmacist(prep._id?.toString() || '', prep.pharmacistId?.toString() || '')}
                        disabled={assignmentLoading}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded disabled:bg-blue-300 disabled:cursor-not-allowed"
                      >
                        {assignmentLoading ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { selectCase } = useData(); // Use the context
  const { user } = useAuth();
  const [memofiches, setMemofiches] = useState<CaseStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');

  useEffect(() => {
    const fetchMemofiches = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/memofiches', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to fetch memofiches');
        }
        const data: CaseStudy[] = await response.json();
        setMemofiches(data);
      } catch (err) {
        console.error('Error fetching memofiches:', err);
        setError('Failed to load memo fiches. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemofiches();
  }, []);

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

        {user?.role === UserRole.ADMIN && <AdminPanel />}

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
        </div>

        {/* Removed category buttons div */}

        {/* Conditional rendering based on filters */}
        {recentMemofiches.length > 0 ? (
            <>
                <h3 className="text-2xl font-bold text-slate-800 mb-4 mt-8 text-center">Mémofiches Récentes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {recentMemofiches.map(study => (
                        <div
                            key={study.title}
                            onClick={() => selectCase(study)} // Use selectCase from context
                            className="group bg-white rounded-lg shadow-md text-left flex flex-col items-start h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                        >
                            {study.coverImageUrl ? (
                                <div className="relative w-full h-40">
                                    <img src={study.coverImageUrl} alt={study.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors"></div>
                                </div>
                            ) : (
                                <div className="bg-teal-100 p-3 rounded-full m-6 mb-4">
                                    <CapsuleIcon className="h-6 w-6 text-teal-600" />
                                </div>
                            )}
                            <div className="p-6 pt-4 flex-grow flex flex-col w-full">
                                <h3 className="text-lg font-semibold text-slate-800 flex-grow group-hover:text-teal-600 transition-colors">{study.title}</h3>
                                <p className="text-xs text-slate-500 mt-1">Créé le {new Date(study.creationDate).toLocaleDateString('fr-FR')}</p>
                                {(study.theme || study.system) && (
                                    <p className="text-xs text-slate-500">
                                        {study.theme && study.theme}
                                        {study.theme && study.system && <span className="mx-1">&bull;</span>}
                                        {study.system && study.system}
                                    </p>
                                )}
                                <div className="mt-4 w-full">
                                    <span className="text-xs font-semibold text-white bg-teal-500 px-3 py-1 rounded-full">
                                    Consulter
                                    </span>
                                </div>
                            </div>
                        </div>
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
                                        <div
                                            key={study.title}
                                            onClick={() => selectCase(study)} // Use selectCase from context
                                            className="group bg-white rounded-lg shadow-md text-left flex flex-col items-start h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                                        >
                                            {study.coverImageUrl ? (
                                                <div className="relative w-full h-40">
                                                    <img src={study.coverImageUrl} alt={study.title} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors"></div>
                                                </div>
                                            ) : (
                                                <div className="bg-teal-100 p-3 rounded-full m-6 mb-4">
                                                    <CapsuleIcon className="h-6 w-6 text-teal-600" />
                                                </div>
                                            )}
                                            <div className="p-6 pt-4 flex-grow flex flex-col w-full">
                                                <h3 className="text-lg font-semibold text-slate-800 flex-grow group-hover:text-teal-600 transition-colors">{study.title}</h3>
                                                <p className="text-xs text-slate-500 mt-1">Créé le {new Date(study.creationDate).toLocaleDateString('fr-FR')}</p>
                                                {(study.theme || study.system) && (
                                                    <p className="text-xs text-slate-500">
                                                        {study.theme && study.theme}
                                                        {study.theme && study.system && <span className="mx-1">&bull;</span>}
                                                        {study.system && study.system}
                                                    </p>
                                                )}
                                                <div className="mt-4 w-full">
                                                    <span className="text-xs font-semibold text-white bg-teal-500 px-3 py-1 rounded-full">
                                                    Consulter
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
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
    </div>
  );
};

export default Dashboard;