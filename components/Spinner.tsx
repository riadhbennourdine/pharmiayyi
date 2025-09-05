
import React from 'react';

const Spinner: React.FC<{ isLarge?: boolean }> = ({ isLarge = false }) => {
  const sizeClasses = isLarge ? 'h-16 w-16' : 'h-5 w-5';
  const borderClasses = isLarge ? 'border-4' : 'border-2';
  return (
    <div className={`animate-spin rounded-full ${sizeClasses} ${borderClasses} border-t-teal-500 border-r-teal-500 border-b-slate-200 border-l-slate-200`}></div>
  );
};

export default Spinner;
