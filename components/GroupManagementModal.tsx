import React, { useState } from 'react';

interface Subscriber {
  _id: string;
  email: string;
  groups?: string[];
}

interface Props {
  subscriber: Subscriber;
  allGroups: string[];
  onClose: () => void;
  onSave: (updatedGroups: string[]) => void;
}

const GroupManagementModal: React.FC<Props> = ({ subscriber, allGroups, onClose, onSave }) => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>(subscriber.groups || []);
  const [newGroup, setNewGroup] = useState('');

  const handleGroupToggle = (group: string) => {
    if (selectedGroups.includes(group)) {
      setSelectedGroups(selectedGroups.filter(g => g !== group));
    } else {
      setSelectedGroups([...selectedGroups, group]);
    }
  };

  const handleAddNewGroup = () => {
    if (newGroup && !selectedGroups.includes(newGroup) && !allGroups.includes(newGroup)) {
      setSelectedGroups([...selectedGroups, newGroup]);
      setNewGroup('');
    }
  };

  const handleSave = () => {
    onSave(selectedGroups);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Gérer les groupes pour {subscriber.email}</h3>
        
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Groupes existants</h4>
          <div className="flex flex-wrap gap-2">
            {allGroups.map(group => (
              <div key={group} className="flex items-center">
                <input
                  type="checkbox"
                  id={`group-${group}`}
                  checked={selectedGroups.includes(group)}
                  onChange={() => handleGroupToggle(group)}
                  className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor={`group-${group}`} className="ml-2 text-sm text-gray-700">{group}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold mb-2">Ajouter un nouveau groupe</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              placeholder="Nom du nouveau groupe"
              className="flex-grow p-2 border border-gray-300 rounded-md"
            />
            <button onClick={handleAddNewGroup} className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700">
              Ajouter
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">Annuler</button>
          <button onClick={handleSave} className="bg-teal-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-teal-700">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupManagementModal;
