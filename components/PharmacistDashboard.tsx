import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { User, UserRole } from '../types';
import { Link } from 'react-router-dom';
import PreparerLearningJourneyPopup from './PreparerLearningJourneyPopup'; // Import the popup component

interface PharmacistDashboardProps {
  // Add any props if needed
}

const PharmacistDashboard: React.FC<PharmacistDashboardProps> = () => {
  const { user } = useAuth();
  const [preparateurs, setPreparateurs] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [selectedPreparerId, setSelectedPreparerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreparateurs = async () => {
      if (!user || user.role !== UserRole.PHARMACIEN || !user._id) {
        setError('Accès non autorisé ou ID pharmacien manquant.');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/preparateurs-by-pharmacist/${user._id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch preparateurs.');
        }

        const data: User[] = await response.json();
        setPreparateurs(data);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching preparateurs for pharmacist:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreparateurs();
  }, [user]);

  const handleViewPreparateurJourney = (preparerId: string) => {
    setSelectedPreparerId(preparerId);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedPreparerId(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center text-slate-600">
        Chargement du tableau de bord Pharmacien...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center text-red-600">
        Erreur lors du chargement du tableau de bord : {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {preparateurs.length === 0 ? (
            <p className="text-gray-600 italic">Aucun préparateur attribué pour le moment.</p>
          ) : (
            preparateurs.map(prep => (
              <div
                key={prep._id?.toString()}
                className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-200"
                onClick={() => handleViewPreparateurJourney(prep._id?.toString() || '')}
              >
                <h3 className="text-xl font-bold text-teal-600 mb-2">{prep.firstName} {prep.lastName}</h3>
                <p className="text-gray-600">{prep.email}</p>
                <p className="text-sm text-gray-500 mt-2">Cliquez pour voir le parcours d'apprentissage</p>
              </div>
            ))
          )}
        </div>
      </div>
      {showPopup && selectedPreparerId && (
        <PreparerLearningJourneyPopup 
          preparerId={selectedPreparerId} 
          preparerName={`${preparateurs.find(p => p._id?.toString() === selectedPreparerId)?.firstName} ${preparateurs.find(p => p._id?.toString() === selectedPreparerId)?.lastName}`}
          onClose={handleClosePopup} 
        />
      )}
    </div>
  );
};

export default PharmacistDashboard;
