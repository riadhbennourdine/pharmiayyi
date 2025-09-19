import React from 'react';
import { useAuth } from './contexts/AuthContext';

const LearnerSpaceView: React.FC = () => {
  const { user } = useAuth();
  const username = user?.username || 'cher apprenant';

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-4">
        <span style={{ color: '#34D399' }}>{username}</span>, bienvenue dans votre espace <span style={{ color: '#34D399' }}>apprenant</span> !
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        C'est ici que vous retrouverez bientôt toutes vos mémofiches, vos scores et votre progression.
      </p>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Votre Coach IA</h2>
        <p className="text-slate-600 mb-4">
          Votre Coach IA est là pour vous accompagner dans votre parcours d'apprentissage. Il vous fournira des rappels, des statistiques et des recommandations personnalisées.
        </p>
        <ul className="list-disc pl-5 text-slate-700 space-y-2">
          <li>Rappels sur les fiches lues</li>
          <li>Fiches restantes à lire</li>
          <li>% d'acquisition des connaissances</li>
          <li>Recommandations de mémofiches</li>
        </ul>
      </div>
    </div>
  );
};

export default LearnerSpaceView;
