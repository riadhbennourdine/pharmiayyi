import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import { DataContext } from './contexts/DataContext';

const LearnerSpaceView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const { user } = useContext(AuthContext); // Assuming AuthContext provides user info
  // const { learnerStats, fetchLearnerStats } = useContext(DataContext); // Assuming DataContext provides learner stats

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      setLoading(false);
      // setError("Failed to load data."); // Uncomment to test error state
    }, 1500);

    // In a real application, you would fetch data here:
    // if (user && fetchLearnerStats) {
    //   fetchLearnerStats(user.id)
    //     .catch((err: Error) => setError(err.message));
    // }

    return () => clearTimeout(timer);
  }, []); // Add user.id to dependency array if fetching based on user

  if (loading) {
    return <div className="text-center py-8">Chargement de votre espace...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Erreur: {error}</div>;
  }

  return (
    <div className="flex h-full">
      {/* Left Column - Darker Green */}
      <div className="w-1/4 bg-[#0A7C72] text-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Mon Espace Apprenant</h1>
        <p className="text-lg mb-8">Bienvenue dans votre espace personnel. Suivez vos progrès ici.</p>

        {/* AI Coach Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <svg className="w-6 h-6 text-teal-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Votre Coach IA
          </h2>
          <p className="text-gray-700 mb-4">
            Je suis Votre Coach IA, prêt à vous guider. Voici un aperçu de votre parcours au {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Fiches lues */}
            <div className="bg-gradient-to-r from-[#0D9488] to-[#0A7C72] rounded-lg shadow-md p-5 text-white flex flex-col justify-between">
              <h3 className="text-lg font-semibold mb-2">Fiches lues</h3>
              <p className="text-4xl font-bold">5 / 16</p>
              <p className="text-sm opacity-80">MémoFiches uniques consultées</p>
            </div>

            {/* Quiz réalisés */}
            <div className="bg-gradient-to-r from-[#0D9488] to-[#0A7C72] rounded-lg shadow-md p-5 text-white flex flex-col justify-between">
              <h3 className="text-lg font-semibold mb-2">Quiz réalisés</h3>
              <p className="text-4xl font-bold">2</p>
              <p className="text-sm opacity-80">Tests de connaissances terminés</p>
            </div>

            {/* Score moyen aux quiz */}
            <div className="bg-gradient-to-r from-[#0D9488] to-[#0A7C72] rounded-lg shadow-md p-5 text-white flex flex-col justify-between">
              <h3 className="text-lg font-semibold mb-2">Score moyen aux quiz</h3>
              <p className="text-4xl font-bold">53.00%</p>
              <p className="text-sm opacity-80">Performance moyenne</p>
            </div>

            {/* Flashcards visionnées (Placeholder) */}
            <div className="bg-gradient-to-r from-[#0D9488] to-[#0A7C72] rounded-lg shadow-md p-5 text-white flex flex-col justify-between">
              <h3 className="text-lg font-semibold mb-2">Flashcards visionnées</h3>
              <p className="text-4xl font-bold">0</p>
              <p className="text-sm opacity-80">Nécessite un suivi backend</p>
            </div>
          </div>

          {/* Médias consultés (Placeholder) */}
          <div className="bg-gradient-to-r from-[#0D9488] to-[#0A7C72] rounded-xl shadow-lg p-6 mb-8 text-white">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <svg className="w-6 h-6 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.555-4.555A1 1 0 0121 6v12a1 1 0 01-1.445.895L15 14m-6 4h6a2 2 0 002-2V6a2 2 0 00-2-2H9a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Médias consultés
            </h2>
            <p className="text-4xl font-bold mb-2">0</p>
            <p className="text-sm opacity-80">Nécessite un suivi backend</p>
          </div>
        </div>
      </div>

      {/* Right Column - Lighter Green/Main Content */}
      <div className="w-3/4 bg-[#1AD9CC] p-6">
        <h2 className="text-2xl font-bold text-[#0D9488] mb-4">Tableau de Bord</h2>
        <p className="text-[#0D9488]">Contenu principal de l'espace apprenant (graphiques, activités récentes, etc.) viendra ici.</p>
        {/* Future content goes here */}
      </div>
    </div>
  );
};

export default LearnerSpaceView;