import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';

const ProfileView: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        const payload: any = { firstName, lastName, email };
        if (password) {
            payload.password = password;
        }

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Profil mis à jour avec succès !');
                setPassword('');
                setConfirmPassword('');
                if (refreshUser) {
                    refreshUser(); // Refresh user data in AuthContext
                }
            } else {
                setError(data.message || 'Échec de la mise à jour.');
            }
        } catch (err) {
            setError('Une erreur réseau est survenue.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Mon Profil</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>}
                {success && <div className="bg-green-100 text-green-700 p-3 rounded-md">{success}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">Prénom</label>
                        <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">Nom</label>
                        <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
                </div>

                <hr className="my-4"/>

                <p className="text-sm text-slate-500">Laissez les champs suivants vides si vous ne souhaitez pas changer votre mot de passe.</p>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirmer le nouveau mot de passe</label>
                    <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
                </div>

                <div className="text-right">
                    <button type="submit" disabled={isLoading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-slate-400">
                        {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileView;
