import React from 'react';

const LearnerSpaceView: React.FC = () => {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-4">
        Bienvenue dans votre espace <span style={{ color: '#34D399' }}>apprenant</span> !
      </h1>
      <p className="text-lg text-slate-600">
        C'est ici que vous retrouverez bientôt toutes vos mémofiches, vos scores et votre progression.
      </p>
    </div>
  );
};

export default LearnerSpaceView;
