import React from 'react';
import { Link } from 'react-router-dom';
import { MemoFiche } from '../types/MemoFiche';
import { useAuth } from '../components/contexts/AuthContext';
import { PencilIcon, TrashIcon } from '../components/icons';
import { deleteMemoFiche } from '../services/memoFicheService'; // Import the new service

interface MemoFicheViewProps {
  memoFiche: MemoFiche;
  onDeleteSuccess?: () => void; // Callback to refresh the list after deletion
}

const MemoFicheView: React.FC<MemoFicheViewProps> = ({ memoFiche, onDeleteSuccess }) => {
  const { user } = useAuth();

  const handleDelete = async (event: React.MouseEvent) => {
    event.preventDefault(); // Prevent navigating to the fiche detail page
    event.stopPropagation(); // Stop event propagation

    if (window.confirm(`Are you sure you want to delete the memo fiche "${memoFiche.title}"?`)) {
      try {
        await deleteMemoFiche(memoFiche._id);
        alert('Memo fiche deleted successfully!');
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      } catch (error) {
        console.error('Error deleting memo fiche:', error);
        alert('Failed to delete memo fiche.');
      }
    }
  };

  return (
    <div className="relative p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
      <Link to={`/memofiche/${memoFiche._id}`} className="block">
        <h3 className="text-lg font-semibold text-gray-800">{memoFiche.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{memoFiche.description}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {memoFiche.tags && memoFiche.tags.map((tag, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Créée le: {new Date(memoFiche.createdAt).toLocaleDateString()}
        </div>
      </Link>
      {user && user.role === 'ADMIN' && (
        <div className="absolute top-2 right-2 flex space-x-2">
          <Link to={`/edit-memofiche/${memoFiche._id}`} onClick={(e) => e.stopPropagation()}>
            <PencilIcon className="h-5 w-5 text-gray-500 hover:text-blue-600" />
          </Link>
          <button onClick={handleDelete} className="p-0 m-0 bg-transparent border-none">
            <TrashIcon className="h-5 w-5 text-gray-500 hover:text-red-600" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MemoFicheView;
