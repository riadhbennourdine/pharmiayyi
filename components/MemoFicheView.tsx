import React from 'react';
import { Link } from 'react-router-dom';
import { MemoFiche } from '../types/MemoFiche';
import { useAuth } from '../components/contexts/AuthContext';
import { PencilIcon, TrashIcon, CapsuleIcon, LockClosedIcon } from '../components/icons';
import { deleteMemoFiche } from '../services/memoFicheService';

interface MemoFicheViewProps {
  memoFiche: MemoFiche;
  onDeleteSuccess?: () => void;
  onSelectCase: (memoFiche: MemoFiche) => void;
}

const MemoFicheView: React.FC<MemoFicheViewProps> = ({ memoFiche, onDeleteSuccess, onSelectCase }) => {
  const { user } = useAuth();

  if (!memoFiche) {
    console.warn("MemoFicheView received undefined or null memoFiche prop.");
    return null; // Don't render if memoFiche is not provided
  }

  const handleDelete = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

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
    <div
      key={memoFiche._id}
      onClick={() => onSelectCase(memoFiche)}
      className="group bg-white rounded-lg shadow-md text-left flex flex-col items-start h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
    >
      {memoFiche.coverImageUrl && ( // Explicitly check if coverImageUrl exists
        <div className="relative w-full h-40">
          <img src={memoFiche.coverImageUrl} alt={memoFiche.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors"></div>
          {memoFiche.isLocked && (
            <div className="absolute top-2 right-2 bg-slate-800 bg-opacity-50 p-2 rounded-full">
              <LockClosedIcon className="h-5 w-5 text-white" />
            </div>
          )}
        </div>
      )}
      {!memoFiche.coverImageUrl && ( // Render CapsuleIcon if no coverImageUrl
        <div className="bg-teal-100 p-3 rounded-full m-6 mb-4">
          <CapsuleIcon className="h-6 w-6 text-teal-600" />
        </div>
      )}
      <div className="p-6 pt-4 flex-grow flex flex-col w-full">
        <Link to={`/memofiche/${memoFiche._id}`} className="block">
          <h3 className="text-lg font-semibold text-gray-800 flex-grow group-hover:text-teal-600 transition-colors">{memoFiche.title}</h3>
          <p className="text-xs text-slate-500 mt-1">Créé le {new Date(memoFiche.createdAt).toLocaleDateString('fr-FR')}</p>
          {(memoFiche.theme || memoFiche.system) && (
            <p className="text-xs text-slate-500">
              {memoFiche.theme && memoFiche.theme}
              {memoFiche.theme && memoFiche.system && <span className="mx-1">&bull;</span>}
              {memoFiche.system && memoFiche.system}
            </p>
          )}
          <div className="mt-4 w-full">
            <span className="text-xs font-semibold text-white bg-teal-500 px-3 py-1 rounded-full">
              Consulter
            </span>
          </div>
        </Link>
        {user && user.role === 'ADMIN' && (
          <div className="mt-4 flex justify-end space-x-2">
            <Link to={`/edit-memofiche/${memoFiche._id}`} onClick={(e) => e.stopPropagation()}>
              <PencilIcon className="h-5 w-5 text-gray-500 hover:text-blue-600" />
            </Link>
            <button onClick={handleDelete} className="p-0 m-0 bg-transparent border-none">
              <TrashIcon className="h-5 w-5 text-gray-500 hover:text-red-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoFicheView;
