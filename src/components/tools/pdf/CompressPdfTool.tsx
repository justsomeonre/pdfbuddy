import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { compressPdfClientSide } from '@/utils/pdfHelper';
import { readFileAsArrayBuffer, formatBytes } from '@/utils/formatters';
import { Minimize2 } from 'lucide-react';
import { SuccessResultCard } from '@/components/common/SuccessResultCard';

export const CompressPdfTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [preset, setPreset] = useState<'extreme' | 'recommended' | 'low'>('recommended');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [procState, setProcState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
  });

  const handleCompress = async () => {
    if (files.length === 0) return;

    try {
      setOriginalSize(files[0].size);
      setProcState({
        status: 'processing',
        progress: 10,
        message: 'Reading and parsing PDF structure...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);

      const compressedBytes = await compressPdfClientSide(
        buffer,
        preset,
        (current, total) => {
          const pct = Math.round((current / total) * 85);
          setProcState({
            status: 'processing',
            progress: 10 + pct,
            message: `Optimizing page ${current} of ${total}...`,
          });
        }
      );

      setCompressedSize(compressedBytes.byteLength);

      const blob = new Blob([compressedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      setProcState({
        status: 'success',
        progress: 100,
        message: 'Compression complete!',
        resultUrl: url,
        resultFileName: `${baseName}_compressed.pdf`,
      });

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to compress PDF.',
      });
    }
  };

  const reset = () => {
    setFiles([]);
    setProcState({ status: 'idle', progress: 0 });
    setOriginalSize(0);
    setCompressedSize(0);
  };

  const savingsPct =
    originalSize > 0 && compressedSize > 0
      ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
      : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ToolHeader
        title="Compress PDF"
        description="Reduce PDF file size dramatically while preserving high visual quality. Zero upload limits, 100% private in-browser compression."
        iconName="Minimize2"
        badge="Zero Limits"
        color="from-emerald-500 to-green-600"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Compressing streams and downsampling images locally on your CPU..."
          />
        </div>
      )}

      {procState.status === 'success' && procState.resultUrl && procState.resultFileName && (
        <div className="space-y-4">
          <div className="max-w-lg mx-auto grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <div>
              <p className="text-xs text-slate-400">Original Size</p>
              <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 font-mono mt-0.5">
                {formatBytes(originalSize)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Compressed</p>
              <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {formatBytes(compressedSize)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Reduction</p>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {savingsPct > 0 ? `-${savingsPct}%` : 'Optimized'}
              </span>
            </div>
          </div>

          <SuccessResultCard
            title="Compression Successful!"
            message={`Your PDF was compressed from ${formatBytes(originalSize)} down to ${formatBytes(compressedSize)}.`}
            resultUrl={procState.resultUrl}
            resultFileName={procState.resultFileName}
            onReset={reset}
            accentColor="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
          />
        </div>
      )}

      {procState.status === 'idle' && (
        <div className="space-y-6">
          <FileUploader
            accept=".pdf,application/pdf"
            multiple={false}
            files={files}
            onFilesChange={setFiles}
            title="Select PDF file to compress"
            subtitle="Any file size allowed: 50MB, 200MB, 500MB+! No 15MB cloud limit."
          />

          {files.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Choose Compression Level
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your desired trade-off between file size reduction and image resolution.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => setPreset('extreme')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    preset === 'extreme'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Extreme Compression
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Maximum size reduction, decent quality. Perfect for government portals & email attachments.
                  </p>
                </div>

                <div
                  onClick={() => setPreset('recommended')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    preset === 'recommended'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Recommended
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      Best Value
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Great size reduction with sharp text and crisp images. Recommended for most documents.
                  </p>
                </div>

                <div
                  onClick={() => setPreset('low')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    preset === 'low'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Less Compression
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Ultra-high visual fidelity with moderate file size reduction. Ideal for photo-heavy documents.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleCompress}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all hover:scale-102 flex items-center gap-2"
                >
                  <Minimize2 className="w-4 h-4" />
                  Compress PDF Now
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
