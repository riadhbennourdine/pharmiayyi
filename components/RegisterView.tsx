import React, { useState } from 'react';
import { LogoIcon } from './icons';

interface RegisterViewProps {
    onRegisterSuccess: () => void;
    onSwitchToLogin: () => void;
    onGoHome: () => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onRegisterSuccess, onSwitchToLogin, onGoHome }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        setError(null);
        setIsLoading(true);
        // Simule un appel réseau pour l'inscription
        setTimeout(() => {
            console.log("Inscription réussie pour:", email);
            setIsLoading(false);
            onRegisterSuccess(); // This will trigger the navigation back to login
        }, 1500);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <button onClick={onGoHome} className="inline-flex items-center mb-4 focus:outline-none group" aria-label="Retour à l'accueil">
                        <LogoIcon className="h-12 w-12 text-teal-600 mr-3 transition-transform duration-300 group-hover:scale-110" />
                        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
                            Pharm<span className="text-teal-600">IA</span>
                        </h1>
                    </button>
                    <h2 className="mt-2 text-xl text-slate-600">
                        Créez votre compte
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address-register" className="sr-only">Adresse email</label>
                            <input
                                id="email-address-register"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-t-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                                placeholder="Adresse email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password-register" className="sr-only">Mot de passe</label>
                            <input
                                id="password-register"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                                placeholder="Mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                         <div>
                            <label htmlFor="confirm-password" className="sr-only">Confirmer le mot de passe</label>
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-b-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                                placeholder="Confirmer le mot de passe"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-slate-400"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Inscription en cours...' : "S'inscrire"}
                        </button>
                    </div>
                     <div className="text-sm text-center">
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="font-medium text-teal-600 hover:text-teal-500"
                        >
                            Déjà un compte ? Se connecter
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterView;