import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PricingPage: React.FC = () => {
  const [showAnnual, setShowAnnual] = useState(false);

  const pricing = {
    solo: {
      name: 'Solo',
      description: 'Licence unique Pharmacien',
      monthly: 29.900,
      annual: 269.100, // 29.900 * 9
      features: [
        'Accès complet aux mémofiches',
        'Mises à jour régulières',
        'Support standard'
      ]
    },
    starter: {
      name: 'Starter',
      description: 'Pharmacien + 5 licences Préparateurs',
      monthly: 79.400,
      annual: 714.600, // 79.400 * 9
      features: [
        'Toutes les fonctionnalités Solo',
        '5 comptes Préparateurs inclus',
        'Gestion d\'équipe simplifiée',
        'Support prioritaire'
      ],
      popular: true
    },
    gold: {
      name: 'Gold',
      description: 'Pharmacien + 10 licences Préparateurs',
      monthly: 108.900,
      annual: 980.100, // 108.900 * 9
      features: [
        'Toutes les fonctionnalités Starter',
        '10 comptes Préparateurs inclus',
        'Rapports d\'activité détaillés',
        'Formation personnalisée'
      ]
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">Nos Formules d\'Abonnement</h1>

      <div className="flex justify-center mb-8">
        <div className="relative p-1 bg-gray-200 rounded-full">
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${!showAnnual ? 'bg-green-600 text-white shadow' : 'text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setShowAnnual(false)}
          >
            Mensuel
          </button>
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${showAnnual ? 'bg-green-600 text-white shadow' : 'text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setShowAnnual(true)}
          >
            Annuel (-3 mois offerts)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Object.values(pricing).map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-xl shadow-lg p-8 flex flex-col border-2 ${plan.popular ? 'border-green-600 scale-105' : 'border-gray-200'} transition-all duration-300`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                Le plus populaire
              </div>
            )}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h2>
            <p className="text-gray-500 mb-6">{plan.description}</p>
            <div className="text-4xl font-extrabold text-green-600 mb-4">
              {showAnnual ? `${plan.annual.toFixed(3)} DT` : `${plan.monthly.toFixed(3)} DT`}
              <span className="text-lg font-medium text-gray-500"> {showAnnual ? '/ an' : '/ mois'} HT</span>
            </div>
            <ul className="text-gray-700 space-y-3 flex-grow">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              to="/contact" // Assuming a contact page for subscription
              className={`mt-8 block text-center py-3 rounded-lg font-semibold transition-colors duration-300 ${plan.popular ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-green-600 hover:bg-gray-200'}`}
            >
              Choisir {plan.name}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
