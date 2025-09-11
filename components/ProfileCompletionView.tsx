import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { UserRole, User } from '../types';

const ProfileCompletionView: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState(user?.email || '');
    const [role, setRole] = useState<UserRole>(user?.role || UserRole.PREPARATEUR);
    const [pharmacistId, setPharmacistId] = useState(user?.pharmacistId?.toString() || '');
    const [pharmacists, setPharmacists] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            navigate('/login'); // Redirect if no user is logged in
            return;
        }
        // If user is a PREPARATEUR, fetch pharmacists
        if (user.role === UserRole.PREPARATEUR) {
            const fetchPharmacists = async () => {
                try {
                    const response = await fetch('/api/users/pharmacists');
                    if (!response.ok) {
                        throw new Error('Failed to fetch pharmacists');
                    }
                    const data: User[] = await response.json();
                    setPharmacists(data);
                } catch (err) {
                    console.error('Error fetching pharmacists:', err);
                    setError('Impossible de charger la liste des pharmaciens.');
                }
            };
            fetchPharmacists();
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        if (!user?._id) {
            setError('Utilisateur non authentifié.');
            setIsLoading(false);
            return;
        }

        if (role === UserRole.PREPARATEUR && !pharmacistId) {
            setError('Veuillez sélectionner un pharmacien référent.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Send token for authMiddleware
                },
                body: JSON.stringify({ email, role, pharmacistId }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'Profil mis à jour avec succès.');
                // Update user in localStorage and AuthContext
                localStorage.setItem('user', JSON.stringify(data.user));
                // Force AuthContext to re-evaluate user state (e.g., by logging out and logging back in, or a custom context update)
                // For simplicity, we'll just navigate to dashboard, assuming AuthContext will re-read from localStorage
                navigate('/dashboard');
            } else {
                setError(data.message || 'Échec de la mise à jour du profil.');
            }
        } catch (err) {
            console.error('Network error during profile update:', err);
            setError('Une erreur réseau est survenue. Veuillez vérifier votre connexion.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return null; // Or a loading spinner, or redirect to login
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="mt-2 text-xl text-slate-600">
                        Complétez votre profil
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">
                        Veuillez fournir les informations manquantes pour accéder à l'application.
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
                    <div className="rounded-md shadow-sm -space-y-px">
                        {/* Email Field - always displayed, but pre-filled */}
                        <div>
                            <label htmlFor="email-profile" className="sr-only">Adresse email</label>
                            <input
                                id="email-profile"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                                placeholder="Adresse email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        {/* Role Display - not editable here, just for context */}
                        <div>
                            <label htmlFor="role-display" className="sr-only">Votre rôle</label>
                            <input
                                id="role-display"
                                type="text"
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 text-slate-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm bg-slate-100 cursor-not-allowed"
                                value={role === UserRole.PHARMACIEN ? 'Pharmacien' : 'Préparateur'}
                                disabled
                            />
                        </div>
                        {/* Pharmacist Referent Field - conditional */}
                        {role === UserRole.PREPARATEUR && (
                            <div>
                                <label htmlFor="pharmacist-select-profile" className="sr-only">Pharmacien Référent</label>
                                <select
                                    id="pharmacist-select-profile"
                                    name="pharmacistId"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                                    value={pharmacistId}
                                    onChange={(e) => setPharmacistId(e.target.value)}
                                    disabled={isLoading || pharmacists.length === 0}
                                >
                                    <option value="">Sélectionnez un pharmacien référent</option>
                                    {pharmacists.map(p => (
                                        <option key={p._id?.toString()} value={p._id?.toString()}>{p.email}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-slate-400"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Mise à jour...' : 'Mettre à jour le profil'}
                        </button>
                    </div>
                    <div className="text-sm text-center">
                        <button
                            type="button"
                            onClick={logout} // Allow user to logout if they can't complete profile
                            className="font-medium text-slate-600 hover:text-slate-500"
                        >
                            Se déconnecter
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileCompletionView;