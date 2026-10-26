import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { splitPdfByPages, burstPdfToZip, getPdfJsDoc } from '@/utils/pdfHelper';
import { readFileAsArrayBuffer, formatBytes } from '@/utils/formatters';
import { Scissors, Download, CheckCircle, Archive, Layers } from 'lucide-react';

export const SplitPdfTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pageCount, setPageCount] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<'range' | 'burst'>('range');
  const [rangeInput, setRangeInput] = useState<string>('1-2');
  const [procState, setProcState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
  });

  useEffect(() => {
    if (files.length > 0) {
      (async () => {
        try {
          const buf = await readFileAsArrayBuffer(files[0].file);
          const pdfDoc = await getPdfJsDoc(buf);
          setPageCount(pdfDoc.numPages);
          if (pdfDoc.numPages > 1) {
            setRangeInput(`1-${Math.min(3, pdfDoc.numPages)}`);
          } else {
            setRangeInput('1');
          }
        } catch (e) {
          console.error(e);
        }
      })();
    } else {
      setPageCount(0);
    }
  }, [files]);

  const parseRanges = (input: string, maxPages: number): number[] => {
    const indices: Set<number> = new Set();
    const parts = input.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(maxPages, Math.max(start, end));
          for (let p = min; p <= max; p++) {
            indices.add(p - 1);
          }
        }
      } else {
        const p = parseInt(part, 10);
        if (!isNaN(p) && p >= 1 && p <= maxPages) {
          indices.add(p - 1);
        }
      }
    }

    return Array.from(indices).sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (files.length === 0 || pageCount === 0) return;

    try {
      setProcState({
        status: 'processing',
        progress: 20,
        message: 'Reading PDF document...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      if (splitMode === 'burst') {
        setProcState({
          status: 'processing',
          progress: 30,
          message: 'Extracting every page into individual PDFs...',
        });

        const zipBlob = await burstPdfToZip(buffer, baseName, (cur, total) => {
          setProcState({
            status: 'processing',
            progress: 30 + Math.round((cur / total) * 60),
            message: `Extracting page ${cur} of ${total}...`,
          });
        });

        const url = URL.createObjectURL(zipBlob);
        setProcState({
          status: 'success',
          progress: 100,
          message: 'All pages extracted into ZIP successfully!',
          resultUrl: url,
          resultFileName: `${baseName}_all_pages.zip`,
        });
      } else {
        const targetIndices = parseRanges(rangeInput, pageCount);
        if (targetIndices.length === 0) {
          throw new Error('Please enter a valid page range within 1 to ' + pageCount);
        }

        setProcState({
          status: 'processing',
          progress: 60,
          message: `Extracting ${targetIndices.length} selected pages...`,
        });

        const splitBytes = await splitPdfByPages(buffer, targetIndices);
        const blob = new Blob([splitBytes as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        setProcState({
          status: 'success',
          progress: 100,
          message: `Extracted ${targetIndices.length} pages successfully!`,
          resultUrl: url,
          resultFileName: `${baseName}_pages_${rangeInput.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
        });
      }

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to split PDF. Check page ranges.',
      });
    }
  };

  const downloadResult = () => {
    if (procState.resultUrl && procState.resultFileName) {
      const a = document.createElement('a');
      a.href = procState.resultUrl;
      a.download = procState.resultFileName;
      a.click();
    }
  };

  const reset = () => {
    setFiles([]);
    setProcState({ status: 'idle', progress: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ToolHeader
        title="Split PDF"
        description="Extract specific page ranges, pick pages, or burst the entire PDF into individual single-page documents in a ZIP. 100% free and unlimited."
        iconName="Scissors"
        color="from-orange-500 to-amber-600"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Extracting pages client-side..."
          />
        </div>
      )}

      {procState.status === 'success' && (
        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Split Complete!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {procState.message}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={downloadResult}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Download Result
            </button>
            <button
              onClick={reset}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-all"
            >
              Split Another PDF
            </button>
          </div>
        </div>
      )}

      {procState.status === 'idle' && (
        <div className="space-y-6">
          <FileUploader
            accept=".pdf,application/pdf"
            multiple={false}
            files={files}
            onFilesChange={setFiles}
            title="Choose a PDF file to split"
            subtitle="Upload document to extract or burst pages. Unlimited file size."
          />

          {files.length > 0 && pageCount > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Document contains <strong className="text-orange-500">{pageCount} pages</strong> ({formatBytes(files[0].size)})
                </span>
              </div>

              {/* Split Mode Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setSplitMode('range')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    splitMode === 'range'
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Custom Page Ranges
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Extract specific pages (e.g. 1-3, 5, 8-10) into a single PDF.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setSplitMode('burst')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    splitMode === 'burst'
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Burst All Pages to ZIP
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Split every page into its own individual PDF and package into a ZIP.
                    </p>
                  </div>
                </div>
              </div>

              {/* Range Input */}
              {splitMode === 'range' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Enter Page Ranges (e.g., 1-2, 4, 6-8):
                  </label>
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder={`e.g. 1-${Math.min(5, pageCount)}`}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                  <p className="text-xs text-slate-400">
                    Total pages available: 1 to {pageCount}. Pages will be saved in order.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleSplit}
                  className="px-8 py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-xl shadow-orange-600/30 transition-all hover:scale-102 flex items-center gap-2"
                >
                  <Scissors className="w-4 h-4" />
                  {splitMode === 'burst' ? `Burst All ${pageCount} Pages` : 'Extract Pages Now'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
