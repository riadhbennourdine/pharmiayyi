import React, { useState } from 'react';
import Newsletter from './Newsletter';
// import SubscriberManager from './SubscriberManager'; // Will be created later

const NewsletterManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'subscribers'>('editor');

  return (
    <div className="container mx-auto p-8">
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('editor')}
          className={`py-2 px-4 text-lg ${activeTab === 'editor' ? 'border-b-2 border-teal-600 font-semibold text-teal-600' : 'text-gray-500'}`}
        >
          Éditeur d'email
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`py-2 px-4 text-lg ${activeTab === 'subscribers' ? 'border-b-2 border-teal-600 font-semibold text-teal-600' : 'text-gray-500'}`}
        >
          Gestion des Abonnés
        </button>
      </div>

      {activeTab === 'editor' && <Newsletter />}
      {activeTab === 'subscribers' && <div className="p-4">Gestion des abonnés (à venir)</div> /* <SubscriberManager /> */}
    </div>
  );
};

export default NewsletterManager;
