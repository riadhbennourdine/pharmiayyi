import React from 'react';
import { useAuth } from './contexts/AuthContext';

const LearnerSpaceView: React.FC = () => {
  const { user } = useAuth();
  const username = user?.username || 'cher apprenant';

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-4">
        <span style={{ color: '#34D399' }}>{username}</span>, bienvenue dans votre espace apprenant !
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Suivez ici votre parcours d'apprentissage !
      </p>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Votre Coach IA</h2>
        <p className="text-lg text-slate-600 mb-4">
          Je suis Votre Coach IA pour vous accompagner dans votre parcours d'apprentissage. Voici votre État d'avancement à la date du {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}.
        </p>
    </div>
  );
};

export default LearnerSpaceView;
