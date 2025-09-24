import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { User, UserRole } from '../types';
import SubscriptionManagement from './SubscriptionManagement'; // Import SubscriptionManagement
import Newsletter from './Newsletter'; // Import Newsletter

const AdminPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [preparateurs, setPreparateurs] = useState<User[]>([]);
  const [pharmacists, setPharmacists] = useState<User[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentFeedback, setAssignmentFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('subscriptions'); // Set subscriptions as default

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Fetch Preparateurs
      const preparateursResponse = await fetch('/api/users/preparateurs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (preparateursResponse.ok) {
        const data = await preparateursResponse.json();
        setPreparateurs(data);
      } else {
        console.error('Failed to fetch preparateurs');
      }

      // Fetch Pharmacists
      const pharmacistsResponse = await fetch('/api/users/pharmacists', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (pharmacistsResponse.ok) {
        const data = await pharmacistsResponse.json();
        setPharmacists(data);
      } else {
        console.error('Failed to fetch pharmacists');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'assignment') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleUpdate = async () => {
    setIsLoading(true);
    setFeedback(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setFeedback({ message: 'Erreur: Token d\'authentification introuvable.', type: 'error' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/update-knowledge-base', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue lors de la mise à jour.');
      }

      setFeedback({ message: `Mise à jour terminée ! ${data.processed} fiches traitées, ${data.chunks} morceaux créés.`, type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      setFeedback({ message: `Erreur: ${errorMessage}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignPharmacist = async (preparateurId: string, newPharmacistId: string) => {
    setAssignmentLoading(true);
    setAssignmentFeedback(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setAssignmentFeedback({ message: 'Erreur: Token d\'authentification introuvable.', type: 'error' });
      setAssignmentLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/${preparateurId}/assign-pharmacist`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pharmacistId: newPharmacistId || null }), // Send null if unassigning
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue lors de l\'attribution.');
      }

      setAssignmentFeedback({ message: 'Attribution mise à jour avec succès.', type: 'success' });
      fetchUsers(); // Re-fetch users to update the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      setAssignmentFeedback({ message: `Erreur: ${errorMessage}`, type: 'error' });
    } finally {
      setAssignmentLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <svg className="w-6 h-6 text-teal-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        Panneau d'Administration
      </h2>
      <p className="text-gray-700 mb-4">Gérez les fonctionnalités administratives de l'application.</p>

      <div className="mb-6">
        <div className="sm:hidden">
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 focus:border-teal-500 focus:ring-teal-500"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            <option value="subscriptions">Abonnements</option>
            <option value="assignment">Attributions</option>
            <option value="newsletter">Newsletter</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`px-3 py-2 font-medium text-sm rounded-md cursor-pointer transition-colors ${activeTab === 'subscriptions' ? 'bg-teal-600 text-white shadow' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              >
                Abonnements
              </button>
              <button
                onClick={() => setActiveTab('assignment')}
                className={`px-3 py-2 font-medium text-sm rounded-md cursor-pointer transition-colors ${activeTab === 'assignment' ? 'bg-teal-600 text-white shadow' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              >
                Attributions
              </button>
              <button
                onClick={() => setActiveTab('newsletter')}
                className={`px-3 py-2 font-medium text-sm rounded-md cursor-pointer transition-colors ${activeTab === 'newsletter' ? 'bg-teal-600 text-white shadow' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              >
                Newsletter
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'subscriptions' && (
          <SubscriptionManagement />
        )}

        {activeTab === 'assignment' && (
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm"> 
            <h3 className="text-xl font-bold text-gray-800 mb-3">Gestion des Attributions Préparateur-Pharmacien</h3>
            <p className="text-gray-600 mb-4">Attribuez un pharmacien référent à chaque préparateur.</p>
            {assignmentFeedback && (
              <p className={`mb-4 text-sm font-semibold ${assignmentFeedback.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {assignmentFeedback.message}
              </p>
            )}
            {preparateurs.length === 0 ? (
              <p className="text-gray-600 italic">Aucun préparateur trouvé.</p>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Préparateur</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Pharmacien Référent Actuel</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Attribuer un Pharmacien</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preparateurs.map((prep) => (
                      <tr key={prep._id?.toString()} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800">{prep.firstName} {prep.lastName} ({prep.email})</td>
                        <td className="py-3 px-4 text-gray-600">
                          {pharmacists.find(p => p._id?.toString() === prep.pharmacistId?.toString())?.firstName || 'Non attribué'}
                          {' '}
                          {pharmacists.find(p => p._id?.toString() === prep.pharmacistId?.toString())?.lastName || ''}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={prep.pharmacistId?.toString() || ''}
                            onChange={(e) => handleAssignPharmacist(prep._id?.toString() || '', e.target.value)}
                            className="p-2 border border-gray-300 rounded-md w-full focus:ring-teal-500 focus:border-teal-500"
                            disabled={assignmentLoading}
                          >
                            <option value="">-- Sélectionner --</option>
                            {pharmacists.map((ph) => (
                              <option key={ph._id?.toString()} value={ph._id?.toString()}>
                                {ph.firstName} {ph.lastName} ({ph.email})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleAssignPharmacist(prep._id?.toString() || '', prep.pharmacistId?.toString() || '')}
                            disabled={assignmentLoading}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-3 rounded-lg transition-colors disabled:bg-teal-300 disabled:cursor-not-allowed"
                          >
                            {assignmentLoading ? 'Enregistrement...' : 'Enregistrer'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'newsletter' && (
          <Newsletter />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;