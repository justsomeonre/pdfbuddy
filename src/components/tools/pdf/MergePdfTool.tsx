import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { mergePdfs } from '@/utils/pdfHelper';
import { readFileAsArrayBuffer, formatBytes } from '@/utils/formatters';
import { ArrowUp, ArrowDown, Trash2, Download, CheckCircle } from 'lucide-react';

export const MergePdfTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [procState, setProcState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
  });

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index - 1];
    newFiles[index - 1] = temp;
    setFiles(newFiles);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index + 1];
    newFiles[index + 1] = temp;
    setFiles(newFiles);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;

    try {
      setProcState({
        status: 'processing',
        progress: 15,
        message: 'Reading PDF documents...',
      });

      const buffers: ArrayBuffer[] = [];
      for (let i = 0; i < files.length; i++) {
        const buf = await readFileAsArrayBuffer(files[0].file);
        buffers.push(buf);
        setProcState({
          status: 'processing',
          progress: 20 + Math.round(((i + 1) / files.length) * 30),
          message: `Loaded ${files[i].name}...`,
        });
      }

      setProcState({
        status: 'processing',
        progress: 60,
        message: 'Combining pages into unified document...',
      });

      const mergedBytes = await mergePdfs(buffers);

      setProcState({
        status: 'processing',
        progress: 90,
        message: 'Finalizing PDF output...',
      });

      const mergedBlob = new Blob([mergedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(mergedBlob);
      const defaultName = `pdfbuddy_merged_${new Date().toISOString().slice(0, 10)}.pdf`;

      setProcState({
        status: 'success',
        progress: 100,
        message: 'PDFs merged successfully!',
        resultUrl: url,
        resultFileName: defaultName,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to merge PDF files. Please ensure files are valid PDFs.',
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

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ToolHeader
        title="Merge PDF Files"
        description="Combine two or more PDF files into a single document in whatever order you prefer. Unlimited file size, processed 100% locally."
        iconName="Layers"
        color="from-rose-500 to-red-600"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Processing locally on your device with zero upload limit..."
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
              Merge Complete!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Your {files.length} PDF files have been combined into a single file.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={downloadResult}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Download Merged PDF
            </button>
            <button
              onClick={reset}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-all"
            >
              Merge More PDFs
            </button>
          </div>
        </div>
      )}

      {procState.status === 'idle' && (
        <div className="space-y-6">
          <FileUploader
            accept=".pdf,application/pdf"
            multiple={true}
            files={files}
            onFilesChange={setFiles}
            title="Drop PDF files here to merge"
            subtitle="Add all files you want to combine. You can reorder them easily below."
          />

          {files.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Merge Sequence (Total: {formatBytes(totalSize)})
                </span>
                <span className="text-xs text-slate-400">
                  Use arrows to change order
                </span>
              </div>

              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(idx)}
                        disabled={idx === files.length - 1}
                        title="Move Down"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        title="Remove"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleMerge}
                  disabled={files.length < 2}
                  className="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-102 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Merge {files.length} PDFs Now
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
