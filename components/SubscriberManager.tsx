import React, { useState, useEffect } from 'react';
import GroupManagementModal from './GroupManagementModal';

interface Subscriber {
  _id: string;
  email: string;
  subscribedAt: string;
  groups?: string[];
}

const SubscriberManager: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allGroups, setAllGroups] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/subscribers', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch subscribers');
        }
        const data = await response.json();
        setSubscribers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/subscribers/groups', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch groups');
        const data = await response.json();
        setAllGroups(data);
      } catch (err: any) {
        setError(err.message); // Or handle group fetch error separately
      }
    };

    fetchSubscribers();
    fetchGroups();
  }, []);

  const handleOpenModal = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubscriber(null);
  };

  const handleSaveGroups = async (updatedGroups: string[]) => {
    if (!selectedSubscriber) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/subscribers/${selectedSubscriber._id}/groups`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ groups: updatedGroups }),
        });

        if (!response.ok) {
            throw new Error('Failed to update groups');
        }

        // Update local state
        setSubscribers(subscribers.map(sub =>
            sub._id === selectedSubscriber._id ? { ...sub, groups: updatedGroups } : sub
        ));
        // also update allGroups if a new group was created
        updatedGroups.forEach(group => {
            if (!allGroups.includes(group)) {
                setAllGroups([...allGroups, group]);
            }
        });


    } catch (err: any) {
        setError(err.message);
    } finally {
        handleCloseModal();
    }
  };

  if (loading) {
    return <div>Chargement des abonnés...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erreur: {error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Gestion des Abonnés</h2>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Date d'abonnement</th>
            <th className="py-2 px-4 border-b">Groupes</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map((subscriber) => (
            <tr key={subscriber._id}>
              <td className="py-2 px-4 border-b">{subscriber.email}</td>
              <td className="py-2 px-4 border-b">{new Date(subscriber.subscribedAt).toLocaleDateString()}</td>
              <td className="py-2 px-4 border-b">{subscriber.groups?.join(', ') || 'Aucun'}</td>
              <td className="py-2 px-4 border-b">
                <button onClick={() => handleOpenModal(subscriber)} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-2 rounded">
                  Gérer les groupes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isModalOpen && selectedSubscriber && (
        <GroupManagementModal
          subscriber={selectedSubscriber}
          allGroups={allGroups}
          onClose={handleCloseModal}
          onSave={handleSaveGroups}
        />
      )}
    </div>
  );
};

export default SubscriberManager;