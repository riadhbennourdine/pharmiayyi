
import React from 'react';
import Spinner from './Spinner';

interface LoadingViewProps {
  message: string;
}

const LoadingView: React.FC<LoadingViewProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full py-20 animate-fade-in">
      <div className="w-16 h-16 mb-4">
          <Spinner isLarge={true} />
      </div>
      <h2 className="text-2xl font-semibold text-slate-700">{message}</h2>
      <p className="text-slate-500 mt-2">Veuillez patienter un instant...</p>
    </div>
  );
};

export default LoadingView;