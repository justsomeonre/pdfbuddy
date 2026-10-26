import React from 'react';

interface ProgressBarProps {
  progress: number;
  message?: string;
  subMessage?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, message, subMessage }) => {
  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {message || 'Processing...'}
        </span>
        <span className="text-sm font-mono font-bold text-rose-500">
          {Math.min(100, Math.max(0, Math.round(progress)))}%
        </span>
      </div>
      
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {subMessage && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center animate-pulse">
          {subMessage}
        </p>
      )}
    </div>
  );
};
