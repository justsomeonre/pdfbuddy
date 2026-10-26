import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { TOOLS } from '../../data/tools';
import { ToolDefinition } from '../../types';
import { IconRenderer } from '../common/IconRenderer';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // open command palette
          const event = new CustomEvent('open-command-palette');
          window.dispatchEvent(event);
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = TOOLS.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.shortDesc.toLowerCase().includes(query.toLowerCase()) ||
      t.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a tool name or action (e.g. merge, compress, ocr, sticker, gif)..."
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-base outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No matching tools found for "{query}".
            </div>
          ) : (
            filtered.map((tool) => (
              <div
                key={tool.id}
                onClick={() => {
                  onSelectTool(tool.id);
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-sm`}
                  >
                    <IconRenderer name={tool.iconName} className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        {tool.title}
                      </span>
                      {tool.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                      {tool.shortDesc}
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>{filtered.length} tools available</span>
          <div className="flex items-center gap-2">
            <span>Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
