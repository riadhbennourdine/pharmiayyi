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

        <div className="space-y-4">
          <div>
            <p className="text-sm opacity-80">Fiches lues</p>
            <p className="text-2xl font-semibold">5 / 16</p>
          </div>
          <div>
            <p className="text-sm opacity-80">MémoFiches uniques consultées</p>
            <p className="text-2xl font-semibold">--</p>
          </div>
          <div>
            <p className="text-sm opacity-80">Quiz réalisés</p>
            <p className="text-2xl font-semibold">2</p>
          </div>
          <div>
            <p className="text-sm opacity-80">Tests de connaissances terminés</p>
            <p className="text-2xl font-semibold">--</p>
          </div>
          <div>
            <p className="text-sm opacity-80">Score moyen aux quiz</p>
            <p className="text-2xl font-semibold">53.00%</p>
          </div>
          <div>
            <p className="text-sm opacity-80">Performance moyenne</p>
            <p className="text-2xl font-semibold">--</p>
          </div>
          <div>
            <p className="text-sm opacity-80">Flashcards visionnées</p>
            <p className="text-2xl font-semibold">0</p>
          </div>
          <div>
            <p className="text-sm opacity-80">Médias consultés</p>
            <p className="text-2xl font-semibold">0</p>
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
