import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ActivateAccountView: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const username = location.state?.username;

    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!username) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center p-8">
                    <h2 className="text-xl text-slate-600">Erreur : Pseudo non trouvé.</h2>
                    <p className="text-sm text-slate-500 mt-2">
                        Veuillez recommencer le processus de récupération de mot de passe.
                    </p>
                    <button
                        onClick={() => navigate('/forgot-password')}
                        className="mt-4 font-medium text-teal-600 hover:text-teal-500"
                    >
                        Retour
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email !== confirmEmail) {
            setError('Les adresses email ne correspondent pas.');
            return;
        }
        setIsLoading(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch('/api/auth/initiate-activation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || `Un lien d'activation a été envoyé à ${email}. Veuillez consulter votre boîte de réception.`);
                // Disable form after success
            } else {
                setError(data.message || 'Une erreur est survenue. Veuillez réessayer.');
            }
        } catch (err) {
            console.error('Network error during account activation:', err);
            setError('Une erreur réseau est survenue. Veuillez vérifier votre connexion.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="mt-2 text-xl text-slate-600">
                        Activer votre compte
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">
                        Pour réactiver votre compte <span className="font-bold">{username}</span>, veuillez fournir l'adresse email que vous souhaitez y associer.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {message && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md relative" role="alert">
                            <span className="block sm:inline">{message}</span>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    
                    {!message && (
                        <>
                            <div>
                                <label htmlFor="email" className="sr-only">Adresse email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                    placeholder="Adresse email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-email" className="sr-only">Confirmer l'adresse email</label>
                                <input
                                    id="confirm-email"
                                    name="confirm-email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                    placeholder="Confirmer l'adresse email"
                                    value={confirmEmail}
                                    onChange={(e) => setConfirmEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-slate-400"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Envoi en cours...' : "Envoyer le lien d'activation"}
                                </button>
                            </div>
                        </>
                    )}

                    <div className="text-sm text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="font-medium text-teal-600 hover:text-teal-500"
                        >
                            Retour à la connexion
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ActivateAccountView;
