import React, { useState, useEffect, useMemo } from 'react';
import { useData } from './contexts/DataContext'; // Import the hook
import { TOPIC_CATEGORIES } from '../constants';
import { CapsuleIcon } from './icons';
import { CaseStudy } from '../types';

const Dashboard: React.FC = () => {
  const { selectCase } = useData(); // Use the context
  const [memofiches, setMemofiches] = useState<CaseStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');

  const activeCategory = TOPIC_CATEGORIES[activeCategoryIndex];
  
  const getCasesForTopic = (topic: string) => {
      const isSystemTopic = TOPIC_CATEGORIES[1].topics.includes(topic);
      if (isSystemTopic) {
        return filteredMemofiches.filter(cs => cs.system === topic);
      }
      return filteredMemofiches.filter(cs => cs.theme === topic);
  };

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

        <div className="mb-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <input
                type="text"
                placeholder="Rechercher une mémofiche..."
                className="w-full sm:w-1/2 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
                className="w-full sm:w-1/4 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
            >
                <option value="">Filtrer par Thème</option>
                {TOPIC_CATEGORIES[0].topics.map(theme => (
                    <option key={theme} value={theme}>{theme}</option>
                ))}
            </select>
            <select
                className="w-full sm:w-1/4 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={selectedSystem}
                onChange={(e) => setSelectedSystem(e.target.value)}
            >
                <option value="">Filtrer par Système/Organe</option>
                {TOPIC_CATEGORIES[1].topics.map(system => (
                    <option key={system} value={system}>{system}</option>
                ))}
            </select>
        </div>

        <div className="mb-8 flex justify-center border-b border-slate-200">
          {TOPIC_CATEGORIES.map((category, index) => (
            <button
              key={category.name}
              onClick={() => setActiveCategoryIndex(index)}
              className={`px-4 sm:px-6 py-3 text-base sm:text-lg font-medium transition-colors duration-300 focus:outline-none ${
                activeCategoryIndex === index
                  ? 'border-b-2 border-teal-600 text-teal-600'
                  : 'text-slate-500 hover:text-teal-500'
              }`}
              aria-current={activeCategoryIndex === index ? 'page' : undefined}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {activeCategory.topics.map((topic) => {
              const topicCases = getCasesForTopic(topic);
              if (topicCases.length > 0) {
                  return topicCases.map(study => (
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
                              {activeCategory.name === "Par Thèmes de la Formation" && study.system && (
                                  <p className="text-xs text-slate-500">Système: {study.system}</p>
                              )}
                              {activeCategory.name === "Par Systèmes et Organes" && study.theme && (
                                  <p className="text-xs text-slate-500">Thème: {study.theme}</p>
                              )}
                              <div className="mt-4 w-full">
                                  <span className="text-xs font-semibold text-white bg-teal-500 px-3 py-1 rounded-full">
                                  Consulter
                                  </span>
                              </div>
                          </div>
                      </div>
                  ));
              } else {
                  return (
                      <div
                          key={topic}
                          className="group bg-white p-6 rounded-lg shadow-md text-left flex flex-col items-start h-full opacity-60"
                          aria-label={`Les fiches sur ${topic} ne sont pas encore disponibles.`}
                      >
                          <div className="bg-teal-100 p-3 rounded-full mb-4">
                          <CapsuleIcon className="h-6 w-6 text-teal-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800 flex-grow">{topic}</h3>
                          <div className="mt-4 w-full">
                              <span className="text-xs font-semibold text-white bg-slate-400 px-3 py-1 rounded-full">
                              Bientôt disponible
                              </span>
                          </div>
                      </div>
                  );
              }
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
