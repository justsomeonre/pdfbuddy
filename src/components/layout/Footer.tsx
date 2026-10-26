import React from 'react';
import { ShieldCheck, Zap, Lock, Heart, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-24 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-sm">
                PDF
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-rose-600 to-indigo-600 bg-clip-text text-transparent">
                pdfbuddy
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              The next-generation document & creative media workspace. 100% free, client-side, with zero upload limits, no subscription paywalls, and maximum privacy.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" /> Zero Data Collection
              </span>
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                <Zap className="w-4 h-4" /> 0MB to 1GB+ Ready
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                <Lock className="w-4 h-4" /> 100% Private In-Browser
              </span>
            </div>
          </div>

          {/* Core Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Essential Tools
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>Merge PDF</li>
              <li>Split PDF</li>
              <li>Compress PDF</li>
              <li>PDF to JPG / PNG</li>
              <li>JPG to PDF</li>
              <li>PDF to OCR</li>
            </ul>
          </div>

          {/* Creative Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Creative Studio
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>Emoji Maker Studio</li>
              <li>Sticker Creator (Die-Cut)</li>
              <li>GIF Studio (Image/Video/PDF)</li>
              <li>Meme Generator</li>
              <li>Sign & Watermark PDF</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} PDFBuddy. Built with pure love for free open productivity.</p>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Better than iLovePDF, forever free with zero limits</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
