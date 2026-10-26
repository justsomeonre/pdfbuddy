import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { addPageNumbersToPdf } from '@/utils/pdfHelper';
import { readFileAsArrayBuffer } from '@/utils/formatters';
import { Hash } from 'lucide-react';
import { SuccessResultCard } from '@/components/common/SuccessResultCard';

export const PageNumbersTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [position, setPosition] = useState<
    'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'
  >('bottom-center');
  const [format, setFormat] = useState<'n' | 'n_of_total' | 'page_n' | 'page_n_of_total'>('page_n_of_total');
  const [startPage, setStartPage] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(10);
  const [procState, setProcState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
  });

  const handleApply = async () => {
    if (files.length === 0) return;

    try {
      setProcState({
        status: 'processing',
        progress: 30,
        message: 'Calculating page bounds and stamping page numbers...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);

      const numberedBytes = await addPageNumbersToPdf(buffer, {
        position,
        format,
        startPage,
        fontSize,
      });

      const blob = new Blob([numberedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      setProcState({
        status: 'success',
        progress: 100,
        message: 'Page numbers successfully inserted!',
        resultUrl: url,
        resultFileName: `${baseName}_numbered.pdf`,
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to add page numbers to PDF.',
      });
    }
  };

  const reset = () => {
    setFiles([]);
    setProcState({ status: 'idle', progress: 0 });
  };

  const positionsList: { id: any; label: string }[] = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-center', label: 'Top Center' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-center', label: 'Bottom Center' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ToolHeader
        title="Page Numbers"
        description="Insert formatted page numbers into your PDF. Customize numbering style, position, margins, and skip cover pages."
        iconName="Hash"
        color="from-sky-500 to-blue-600"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Stamping pagination marks..."
          />
        </div>
      )}

      {procState.status === 'success' && procState.resultUrl && procState.resultFileName && (
        <SuccessResultCard
          title="Page Numbers Added!"
          message="Your document has been numbered cleanly according to your settings."
          resultUrl={procState.resultUrl}
          resultFileName={procState.resultFileName}
          onReset={reset}
          accentColor="bg-sky-600 hover:bg-sky-700 shadow-sky-600/30"
        />
      )}

      {procState.status === 'idle' && (
        <div className="space-y-6">
          <FileUploader
            accept=".pdf,application/pdf"
            multiple={false}
            files={files}
            onFilesChange={setFiles}
            title="Select PDF file to number"
            subtitle="Add pagination to books, reports, dissertations, and agreements."
          />

          {files.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Numbering Position:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {positionsList.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPosition(p.id)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all ${
                          position === p.id
                            ? 'bg-sky-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Format Style:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'page_n_of_total', label: 'Page 1 of 12' },
                      { id: 'n_of_total', label: '1 / 12' },
                      { id: 'page_n', label: 'Page 1' },
                      { id: 'n', label: '1' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFormat(f.id as any)}
                        className={`py-2 px-2 text-center rounded-xl text-xs font-semibold transition-all ${
                          format === f.id
                            ? 'bg-sky-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Start Numbering from Page:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={startPage}
                    onChange={(e) => setStartPage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Set to 2 to skip the first cover page.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Font Size:
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-8 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-xl shadow-sky-600/30 transition-all hover:scale-102 flex items-center gap-2"
                >
                  <Hash className="w-4 h-4" />
                  Insert Page Numbers
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
