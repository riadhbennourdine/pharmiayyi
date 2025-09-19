import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { MemoFiche } from '../types'; // Assuming MemoFiche type is available

const LearnerSpaceView: React.FC = () => {
  const { user } = useAuth();
  const username = user?.username || 'cher apprenant';

  const [totalMemofiches, setTotalMemofiches] = useState<number>(0);
  const [readMemoficheIds, setReadMemoficheIds] = useState<string[]>([]);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [readMemofichesDetails, setReadMemofichesDetails] = useState<MemoFiche[]>([]);
  const [unreadMemofichesDetails, setUnreadMemofichesDetails] = useState<MemoFiche[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
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

        // Update readMemoficheIds to only include existing fiches for accurate count
        setReadMemoficheIds(existingReadFiches.map(fiche => fiche._id));

      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching learner stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

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
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-4">
        <span style={{ color: '#0D9488' }}>{username}</span>, bienvenue dans votre espace apprenant !
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Suivez ici votre parcours d'apprentissage !
      </p>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Votre Coach IA</h2>
        <p className="text-lg text-slate-600 mb-4">
          Je suis Votre Coach IA pour vous accompagner dans votre parcours d'apprentissage. Voici votre État d'avancement à la date du {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-teal-50 p-4 rounded-lg shadow-sm">
            <h3 className="font-bold text-teal-800">Fiches lues</h3>
            <p className="text-2xl text-teal-600">{readMemoficheIds.length} / {totalMemofiches}</p>
          </div>
          <div className="bg-teal-50 p-4 rounded-lg shadow-sm">
            <h3 className="font-bold text-teal-800">Quiz réalisés</h3>
            <p className="text-2xl text-teal-600">{totalQuizzesCompleted}</p>
          </div>
          <div className="bg-teal-50 p-4 rounded-lg shadow-sm">
            <h3 className="font-bold text-teal-800">Score moyen aux quiz</h3>
            <p className="text-2xl text-teal-600">{averageScore}%</p>
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-3">Vos fiches lues</h3>
        {readMemofichesDetails.length > 0 ? (
          <ul className="list-disc pl-5 text-slate-700 mb-6">
            {readMemofichesDetails.map(fiche => (
              <li key={fiche._id}>{fiche.title} ({fiche.theme})</li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-600 mb-6">Vous n'avez pas encore lu de mémofiches.</p>
        )}

        <h3 className="text-xl font-bold text-slate-800 mb-3">Fiches à découvrir</h3>
        {unreadMemofichesDetails.length > 0 ? (
          <ul className="list-disc pl-5 text-slate-700">
            {unreadMemofichesDetails.map(fiche => (
              <li key={fiche._id}>{fiche.title} ({fiche.theme})</li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-600">Vous avez lu toutes les mémofiches disponibles ! Bravo !</p>
        )}
      </div>
    </div>
  );
};

export default LearnerSpaceView;
