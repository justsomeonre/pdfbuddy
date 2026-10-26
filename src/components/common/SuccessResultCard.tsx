import React from 'react';
import { Download, ExternalLink, RefreshCw, CheckCircle, Share2, Eye } from 'lucide-react';
import { triggerFileDownload, openInNewTab } from '@/utils/formatters';

interface SuccessResultCardProps {
  title?: string;
  message?: string;
  resultUrl: string;
  resultFileName: string;
  onReset: () => void;
  accentColor?: string; // e.g. "bg-rose-600 hover:bg-rose-700"
}

export const SuccessResultCard: React.FC<SuccessResultCardProps> = ({
  title = 'Processing Complete!',
  message = 'Your file is ready to download or view.',
  resultUrl,
  resultFileName,
  onReset,
  accentColor = 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30',
}) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerFileDownload(resultUrl, resultFileName);
  };

  const handleOpenPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    openInNewTab(resultUrl);
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const response = await fetch(resultUrl);
        const blob = await response.blob();
        const file = new File([blob], resultFileName, { type: blob.type || 'application/octet-stream' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: resultFileName,
          });
          return;
        }
      } catch (err) {
        console.warn('File share unsupported or dismissed', err);
      }
    }
    // Fallback: trigger download
    triggerFileDownload(resultUrl, resultFileName);
  };

  const isZip = resultFileName.toLowerCase().endsWith('.zip');
  const isDocx = resultFileName.toLowerCase().endsWith('.docx');
  const isXlsx = resultFileName.toLowerCase().endsWith('.xlsx');
  const isPdf = resultFileName.toLowerCase().endsWith('.pdf');
  const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(resultFileName);

  const getFileBadge = () => {
    if (isZip) return 'ZIP Archive';
    if (isDocx) return 'Word Document';
    if (isXlsx) return 'Excel Spreadsheet';
    if (isPdf) return 'PDF Document';
    if (isImage) return 'Image File';
    return 'Document';
  };

  return (
    <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto space-y-6 animate-fade-in my-4">
      {/* Success Icon */}
      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
        <CheckCircle className="w-9 h-9" />
      </div>

      {/* Title & Message */}
      <div className="space-y-1">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
          {message}
        </p>
      </div>

      {/* File Info Chip */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between gap-3 text-left">
        <div className="min-w-0 flex-1">
          <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold block truncate" title={resultFileName}>
            📄 {resultFileName}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            {getFileBadge()} • Ready
          </span>
        </div>
      </div>

      {/* Primary & Secondary Action Buttons */}
      <div className="flex flex-col gap-3">
        {/* Main Download Button: native <a> link styled as button with fallback */}
        <a
          href={resultUrl}
          download={resultFileName}
          onClick={handleDownload}
          className={`w-full min-h-[50px] py-3.5 px-6 rounded-2xl ${accentColor} text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-98 cursor-pointer select-none`}
        >
          <Download className="w-5 h-5 flex-shrink-0" />
          <span>Download {isZip ? 'ZIP Archive' : 'File'}</span>
        </a>

        {/* Secondary buttons grid: Open in Tab & Share */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleOpenPreview}
            className="min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors active:scale-98"
            title="Open in a new tab (useful for iPhone / iPad preview)"
          >
            <Eye className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>Open in Tab</span>
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator ? (
            <button
              type="button"
              onClick={handleShare}
              className="min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors active:scale-98"
              title="Share or save to device"
            >
              <Share2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span>Share</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onReset}
              className="min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors active:scale-98"
            >
              <RefreshCw className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span>Convert Again</span>
            </button>
          )}
        </div>

        {/* Start Fresh / Process Another link */}
        <button
          type="button"
          onClick={onReset}
          className="min-h-[40px] text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 pt-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Process Another File</span>
        </button>
      </div>
    </div>
  );
};
