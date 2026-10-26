import React from 'react';
import { ArrowLeft, ShieldCheck, Zap } from 'lucide-react';
import { IconRenderer } from './IconRenderer';

interface ToolHeaderProps {
  title: string;
  description: string;
  iconName: string;
  badge?: string;
  color?: string;
  onBack: () => void;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
  title,
  description,
  iconName,
  badge,
  color = 'from-rose-500 to-red-600',
  onBack,
}) => {
  return (
    <div className="mb-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 mb-4 shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        ← Back to All Tools
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg shadow-rose-500/20`}>
            <IconRenderer name={iconName} className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h1>
              {badge && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base mt-1 max-w-2xl">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Private (Runs Locally)</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
            <Zap className="w-4 h-4" />
            <span>Zero Limits</span>
          </div>
        </div>
      </div>
    </div>
  );
};
