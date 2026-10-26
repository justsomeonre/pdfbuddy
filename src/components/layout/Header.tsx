import React, { useState, useEffect } from 'react';
import { Search, Moon, Sun, Sparkles, Shield, Heart } from 'lucide-react';
import { ToolCategory } from '../../types';

interface HeaderProps {
  currentCategory: ToolCategory;
  onSelectCategory: (cat: ToolCategory) => void;
  onOpenCommandPalette: () => void;
  onHomeClick: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCategory,
  onSelectCategory,
  onOpenCommandPalette,
  onHomeClick,
  isDark,
  onToggleTheme,
}) => {
  const categories: { id: ToolCategory; label: string }[] = [
    { id: 'all', label: 'All Tools' },
    { id: 'organize', label: 'Organize & Compress' },
    { id: 'convert', label: 'Convert & OCR' },
    { id: 'edit', label: 'Edit & Sign' },
    { id: 'security', label: 'Security' },
    { id: 'creative', label: 'Emojis & GIFs' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo */}
          <div
            onClick={onHomeClick}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/25 group-hover:scale-105 transition-transform">
              <span className="font-black text-lg tracking-wider">PDF</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                  pdfbuddy
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Unlimited
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Free, private & zero upload limits
              </p>
            </div>
          </div>

          {/* Quick Search / Command Palette Bar */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-900/90 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-400 text-sm w-64 lg:w-80 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-inner"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 text-xs flex-1 text-left">
              Search any PDF or media tool...
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500 shadow-xs">
              Ctrl K
            </kbd>
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenCommandPalette}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Search tools"
            >
              <Search className="w-5 h-5" />
            </button>

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 px-3 py-1.5 rounded-full font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>100% Client-Side Privacy</span>
            </div>

            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 scrollbar-none border-t border-slate-100 dark:border-slate-900">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                currentCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
