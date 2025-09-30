import React from 'react';

const MaintenancePage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans text-slate-800">
            <div className="text-center p-8 max-w-lg mx-auto bg-white rounded-xl shadow-md border border-slate-200/80">
                <div className="flex justify-center mb-6">
                     <span className="animated-gradient-text text-4xl font-bold tracking-tight">PharmIA</span>
                </div>
                <div className="mb-6">
                    <svg className="w-20 h-20 text-teal-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.39.39 1.024 0 1.414l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.39.39.39 1.023 0 1.414l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.894c-.09.542-.56.94-1.11.94h-1.093c-.55 0-1.02-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.855-.142-1.205.108l-.737.527a1.125 1.125 0 01-1.45-.12l-.773-.774a1.125 1.125 0 010-1.414l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.093c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.764-.384.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 010-1.414l.774-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.806.272 1.203.107.397-.165.71-.505.78-.93l.15-.894z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-3">Site en cours de maintenance</h1>
                <p className="text-slate-600 text-lg mb-8">
                    Nous effectuons des mises à jour pour améliorer votre expérience. Nous serons de retour très prochainement.
                </p>
                <p className="text-sm text-slate-500">
                    L'équipe PharmIA vous remercie de votre patience.
                </p>
            </div>
        </div>
    );
};

export default MaintenancePage;
