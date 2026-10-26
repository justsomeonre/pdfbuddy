import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { getPdfJsDoc, renderPageToDataUrl, rotatePdf } from '@/utils/pdfHelper';
import { readFileAsArrayBuffer } from '@/utils/formatters';
import { RotateCw, RotateCcw, Download, CheckCircle, RefreshCw } from 'lucide-react';

export const RotatePdfTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pagesThumbnails, setPagesThumbnails] = useState<string[]>([]);
  const [rotations, setRotations] = useState<{ [pageIndex: number]: number }>({});
  const [procState, setProcState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
  });

  useEffect(() => {
    if (files.length > 0) {
      (async () => {
        try {
          const buf = await readFileAsArrayBuffer(files[0].file);
          const doc = await getPdfJsDoc(buf);
          const thumbs: string[] = [];
          for (let i = 1; i <= doc.numPages; i++) {
            const url = await renderPageToDataUrl(doc, i, 0.8, 'image/jpeg', 0.8);
            thumbs.push(url);
          }
          setPagesThumbnails(thumbs);
          setRotations({});
        } catch (e) {
          console.error(e);
        }
      })();
    } else {
      setPagesThumbnails([]);
      setRotations({});
    }
  }, [files]);

  const rotatePage = (pageIndex: number, delta: number) => {
    const current = rotations[pageIndex] || 0;
    setRotations({ ...rotations, [pageIndex]: (current + delta + 360) % 360 });
  };

  const rotateAll = (delta: number) => {
    const updated: { [k: number]: number } = {};
    for (let i = 0; i < pagesThumbnails.length; i++) {
      const cur = rotations[i] || 0;
      updated[i] = (cur + delta + 360) % 360;
    }
    setRotations(updated);
  };

  const handleSave = async () => {
    if (files.length === 0) return;

    try {
      setProcState({
        status: 'processing',
        progress: 30,
        message: 'Applying orientation matrices to PDF pages...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);
      const rotatedBytes = await rotatePdf(buffer, rotations);

      const blob = new Blob([rotatedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      setProcState({
        status: 'success',
        progress: 100,
        message: 'Pages rotated successfully!',
        resultUrl: url,
        resultFileName: `${baseName}_rotated.pdf`,
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to rotate PDF pages.',
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
    setPagesThumbnails([]);
    setRotations({});
    setProcState({ status: 'idle', progress: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ToolHeader
        title="Rotate PDF Pages"
        description="Rotate pages clockwise or counterclockwise. Rotate specific pages or all pages at once."
        iconName="RotateCw"
        color="from-indigo-500 to-purple-600"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Updating orientation tags..."
          />
        </div>
      )}

      {procState.status === 'success' && (
        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center max-w-xl mx-auto space-y-6 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Rotation Saved!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Your rotated PDF is ready for download.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={downloadResult}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Download Rotated PDF
            </button>
            <button
              onClick={reset}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition-all"
            >
              Rotate Another
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
            title="Select PDF file to rotate"
            subtitle="Rotate sideways scans or upside-down pages effortlessly."
          />

          {files.length > 0 && pagesThumbnails.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Total Pages: {pagesThumbnails.length}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => rotateAll(-90)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Rotate All Left
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateAll(90)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Rotate All Right
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pagesThumbnails.map((thumb, idx) => {
                  const angle = rotations[idx] || 0;
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center group"
                    >
                      <div className="relative w-full aspect-[3/4] bg-white dark:bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-2 mb-3">
                        <img
                          src={thumb}
                          alt={`Page ${idx + 1}`}
                          style={{ transform: `rotate(${angle}deg)` }}
                          className="max-w-full max-h-full object-contain transition-transform duration-300"
                        />
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/70 text-white text-[10px] font-bold">
                          #{idx + 1}
                        </span>
                        {angle !== 0 && (
                          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold">
                            {angle}°
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => rotatePage(idx, -90)}
                          title="Rotate Left"
                          className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 shadow-sm"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => rotatePage(idx, 90)}
                          title="Rotate Right"
                          className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 shadow-sm"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-102 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Save & Apply Rotation
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
