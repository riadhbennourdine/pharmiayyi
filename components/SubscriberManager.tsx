import React, { useState, useEffect } from 'react';

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

    fetchSubscribers();
  }, []);

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
                {/* Actions buttons will go here */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubscriberManager;
