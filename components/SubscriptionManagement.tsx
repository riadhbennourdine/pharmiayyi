import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { User, UserRole } from '../types';
import { PencilIcon } from './icons';

interface Subscriber extends User {
  duration?: string; // For display purposes
}

const SubscriptionManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [durationInDays, setDurationInDays] = useState<string>('30');
  const [planName, setPlanName] = useState<string>('Free Trial');

  const fetchSubscribers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/subscribers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch subscribers.');
      }
      const data: User[] = await response.json();
      const processedSubscribers: Subscriber[] = data.map(sub => {
        let duration = 'N/A';
        if (sub.subscriptionEndDate && sub.createdAt) {
          const diffTime = Math.abs(new Date(sub.subscriptionEndDate).getTime() - new Date(sub.createdAt).getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          duration = `${diffDays} jours`;
        }
        return { ...sub, duration };
      });
      setSubscribers(processedSubscribers);
    } catch (err: any) {
      console.error('Error fetching subscribers:', err);
      setError(err.message || 'Failed to load subscribers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === UserRole.ADMIN) {
      fetchSubscribers();
    }
  }, [currentUser]);

  const handleGrantSubscription = async () => {
    if (!selectedUser || !durationInDays || !planName) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/grant-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedUser._id, durationInDays: parseInt(durationInDays), planName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to grant subscription.');
      }

      alert('Abonnement octroyé avec succès !');
      setShowGrantModal(false);
      fetchSubscribers(); // Refresh list
    } catch (err: any) {
      console.error('Error granting subscription:', err);
      alert(`Erreur: ${err.message || 'Échec de l\'octroi de l\'abonnement.'}`);
    }
  };

  if (loading) return <div className="text-center p-4">Chargement des abonnés...</div>;
  if (error) return <div className="text-center p-4 text-red-600">Erreur: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Gestion des Abonnements</h2>
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abonné</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Début</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durée</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subscribers.map(sub => (
              <tr key={sub._id?.toString()}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.firstName} {sub.lastName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.hasActiveSubscription ? 'Oui' : 'Non'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.planName || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.subscriptionEndDate ? new Date(sub.subscriptionEndDate).toLocaleDateString() : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.duration}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => { setSelectedUser(sub); setShowGrantModal(true); }}
                    className="text-teal-600 hover:text-teal-900 mr-2"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showGrantModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Octroyer un abonnement à {selectedUser.firstName} {selectedUser.lastName}</h3>
            <div className="mb-4">
              <label htmlFor="planName" className="block text-sm font-medium text-gray-700">Nom du plan</label>
              <input
                type="text"
                id="planName"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Durée (jours)</label>
              <input
                type="number"
                id="duration"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                value={durationInDays}
                onChange={(e) => setDurationInDays(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowGrantModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleGrantSubscription}
                className="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700"
              >
                Octroyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;