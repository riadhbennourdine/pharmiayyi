import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { MemoFiche, UserRole, User } from '../types'; // Assuming MemoFiche type is available
import AdminPanel from './AdminPanel'; // Import AdminPanel
import PreparerLearningJourneyPopup from './PreparerLearningJourneyPopup'; // Import the popup component

const LearnerSpaceView: React.FC = () => {
  const { user } = useAuth();
  const username = user?.firstName || user?.username || 'cher apprenant';

  const [totalMemofiches, setTotalMemofiches] = useState<number>(0);
  const [readMemoficheIds, setReadMemoficheIds] = useState<string[]>([]);
  const [viewedMediaIds, setViewedMediaIds] = useState<string[]>([]);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [readMemofichesDetails, setReadMemofichesDetails] = useState<MemoFiche[]>([]);
  const [unreadMemofichesDetails, setUnreadMemofichesDetails] = useState<MemoFiche[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [referentPharmacistName, setReferentPharmacistName] = useState<string | null>(null);

  // State for Pharmacist Dashboard functionality
  const [preparateurs, setPreparateurs] = useState<User[]>([]);
  const [pharmacistDashboardLoading, setPharmacistDashboardLoading] = useState<boolean>(true);
  const [pharmacistDashboardError, setPharmacistDashboardError] = useState<string | null>(null);
  const [showPreparerPopup, setShowPreparerPopup] = useState<boolean>(false);
  const [selectedPreparerId, setSelectedPreparerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatsAndPharmacist = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch total memo fiches count
        const countResponse = await fetch('/api/memofiches/count');
        if (!countResponse.ok) throw new Error('Failed to fetch memo fiches count');
        const { count } = await countResponse.json();
        setTotalMemofiches(count);

        // Fetch user progress
        const progressResponse = await fetch('/api/user/progress', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!progressResponse.ok) throw new Error('Failed to fetch user progress');
        const progressData = await progressResponse.json();
        setReadMemoficheIds(progressData.readFicheIds || []);
        setViewedMediaIds(progressData.viewedMediaIds || []);
        setQuizHistory(progressData.quizHistory || []);

        // Fetch all memo fiches details to determine read/unread
        const allMemofichesResponse = await fetch('/api/memofiches'); // Assuming this endpoint returns all memofiches
        if (!allMemofichesResponse.ok) throw new Error('Failed to fetch all memo fiches');
        const allMemofiches: MemoFiche[] = await allMemofichesResponse.json();

        const readIds = new Set(progressData.readFicheIds || []);
        const existingReadFiches = allMemofiches.filter(fiche => readIds.has(fiche._id));
        const unreadFiches = allMemofiches.filter(fiche => !readIds.has(fiche._id));

        setReadMemofichesDetails(existingReadFiches);
        setUnreadMemofichesDetails(unreadFiches);

        // Fetch referent pharmacist details if user is PREPARATEUR and has a pharmacistId
        if (user?.role === UserRole.PREPARATEUR && user.pharmacistId) {
          const pharmacistResponse = await fetch(`/api/users/${user.pharmacistId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (pharmacistResponse.ok) {
            const pharmacistData = await pharmacistResponse.json();
            setReferentPharmacistName(`${pharmacistData.firstName} ${pharmacistData.lastName}`);
          } else {
            console.error('Failed to fetch referent pharmacist details');
            setReferentPharmacistName(null); // Clear if fetch fails
          }
        }

      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching learner stats:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPreparateursForPharmacist = async () => {
      if (user?.role !== UserRole.PHARMACIEN || !user?._id) {
        setPharmacistDashboardError('Accès non autorisé ou ID pharmacien manquant.');
        setPharmacistDashboardLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/preparateurs-by-pharmacist/${user._id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch preparateurs.');
        }

        const data: User[] = await response.json();
        setPreparateurs(data);
      } catch (err: any) {
        setPharmacistDashboardError(err.message);
        console.error('Error fetching preparateurs for pharmacist:', err);
      } finally {
        setPharmacistDashboardLoading(false);
      }
    };

    fetchStatsAndPharmacist();
    if (user?.role === UserRole.PHARMACIEN) {
      fetchPreparateursForPharmacist();
    }
  }, [user]);

  const handleViewPreparateurJourney = (preparerId: string) => {
    setSelectedPreparerId(preparerId);
    setShowPreparerPopup(true);
  };

  const handleClosePreparerPopup = () => {
    setShowPreparerPopup(false);
    setSelectedPreparerId(null);
  };

  const totalQuizzesCompleted = quizHistory.length;
  const totalScore = quizHistory.reduce((sum, quiz) => sum + quiz.score, 0);
  const averageScore = totalQuizzesCompleted > 0 ? (totalScore / totalQuizzesCompleted).toFixed(2) : 'N/A';

  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center text-slate-600">
        Chargement de votre espace apprenant...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center text-red-600">
        Erreur lors du chargement de votre espace apprenant : {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          Bienvenue, <span className="text-teal-600">{user?.firstName || username}</span> !
        </h1>
        {user?.role === UserRole.PHARMACIEN && (
          <p className="text-lg text-gray-600 mb-2">
            Gérez et suivez la progression de vos préparateurs.
          </p>
        )}
        <p className="text-lg text-gray-600 mb-2">
          Votre tableau de bord personnalisé pour suivre votre progression.
        </p>

        {/* Pharmacist Dashboard Section (visible only for PHARMACIEN) */}
        {user?.role === UserRole.PHARMACIEN && (
          <div className="mt-8">
            {pharmacistDashboardLoading ? (
              <div className="text-center text-slate-600">Chargement des préparateurs...</div>
            ) : pharmacistDashboardError ? (
              <div className="text-center text-red-600">Erreur: {pharmacistDashboardError}</div>
            ) : preparateurs.length === 0 ? (
              <p className="text-gray-600 italic">Aucun préparateur attribué pour le moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {preparateurs.map(prep => (
                  <div
                    key={prep._id?.toString()}
                    className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-200"
                    onClick={() => handleViewPreparateurJourney(prep._id?.toString() || '')}
                  >
                    <h3 className="text-xl font-bold text-teal-600 mb-2">{prep.firstName} {prep.lastName}</h3>
                    <p className="text-gray-600">{prep.email}</p>
                    <p className="text-sm text-gray-500 mt-2">Cliquez pour voir le parcours d'apprentissage</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Panel Section (visible only for ADMIN) */}
        {user?.role === UserRole.ADMIN && <AdminPanel />}

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
            <div className="bg-gradient-to-r from-[#0D9488] to-[#0A7C72] rounded-lg shadow-md p-5 text-white flex flex-col justify-between min-h-[120px]">
              <h3 className="text-lg font-semibold mb-2">Fiches lues</h3>
              <p className="text-4xl font-bold">{readMemoficheIds.length} / {totalMemofiches}</p>
              <p className="text-sm opacity-80">MémoFiches uniques consultées</p>
            </div>

            {/* Quiz et Scores */}
            <div className="bg-gradient-to-r from-[#0D9488] to-[#0A7C72] rounded-lg shadow-md p-5 text-white flex flex-col justify-between min-h-[120px]">
              <h3 className="text-lg font-semibold mb-2">Quiz et Scores</h3>
              <p className="text-2xl font-bold">Quiz Réalisés: {totalQuizzesCompleted}</p>
              <p className="text-2xl font-bold">Score Moyen: {averageScore}%</p>
              <p className="text-sm opacity-80">Tests de connaissances & Performance moyenne</p>
            </div>

            {/* Médias consultés (Placeholder) */}
            <div className="bg-gradient-to-r from-[#0D9488] to-[#0A7C72] rounded-lg shadow-md p-5 text-white flex flex-col justify-between min-h-[120px]">
              <h3 className="text-lg font-semibold mb-2">Médias consultés</h3>
              <p className="text-4xl font-bold">{viewedMediaIds.length}</p>
              <p className="text-sm opacity-80">Vidéos et autres médias consultés</p>
            </div>

            {/* Flashcards visionnées (Placeholder) */}
            <div className="bg-gradient-to-r from-[#0D9488] to-[#0A7C72] rounded-lg shadow-md p-5 text-white flex flex-col justify-between min-h-[120px]">
              <h3 className="text-lg font-semibold mb-2">Flashcards visionnées</h3>
              <p className="text-4xl font-bold">0</p>
              <p className="text-sm opacity-80">Nécessite un suivi backend</p>
            </div>
          </div>

          {/* Fiches Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mémofiches lues */}
            <div className="bg-gray-50 rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-teal-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Mémofiches lues
              </h3>
              {readMemofichesDetails.length > 0 ? (
                <ul className="space-y-3">
                  {readMemofichesDetails.map(fiche => (
                    <li key={fiche._id} className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                      <Link to={`/memofiche/${fiche._id}`} className="text-teal-600 hover:text-teal-800 font-medium">
                        {fiche.title} <span className="text-gray-500 text-sm">({fiche.theme})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 italic">Vous n'avez pas encore lu de mémofiches. Commencez votre apprentissage dès maintenant !</p>
              )}
            </div>

            {/* Fiches à découvrir */}
            <div className="bg-gray-50 rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                MémoFiches à découvrir
              </h3>
              {unreadMemofichesDetails.length > 0 ? (
                <ul className="space-y-3">
                  {unreadMemofichesDetails.map(fiche => (
                    <li key={fiche._id} className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                      <Link to={`/memofiche/${fiche._id}`} style={{ color: '#0D9488' }} className="hover:text-green-700 font-medium">
                        {fiche.title} <span className="text-gray-500 text-sm">({fiche.theme})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 italic">Félicitations ! Vous avez lu toutes les mémofiches disponibles. Continuez à explorer !</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {showPreparerPopup && selectedPreparerId && (
        <PreparerLearningJourneyPopup 
          preparerId={selectedPreparerId} 
          preparerName={`${preparateurs.find(p => p._id?.toString() === selectedPreparerId)?.firstName} ${preparateurs.find(p => p._id?.toString() === selectedPreparerId)?.lastName}`}
          onClose={handleClosePreparerPopup} 
        />
      )}
    </div>
  );
};

export default LearnerSpaceView;