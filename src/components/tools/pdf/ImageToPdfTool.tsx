import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { imagesToPdf } from '@/utils/pdfHelper';
import { loadImage } from '@/utils/imageHelper';
import { ArrowUp, ArrowDown, Trash2, FileText } from 'lucide-react';
import { SuccessResultCard } from '@/components/common/SuccessResultCard';

export const ImageToPdfTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('auto');
  const [margin, setMargin] = useState<number>(20);
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

  const handleConvert = async () => {
    if (files.length === 0) return;

    try {
      setProcState({
        status: 'processing',
        progress: 15,
        message: 'Reading images and calculating dimensions...',
      });

      const imageDataList: { dataUrl: string; type: string; width: number; height: number }[] = [];

      for (let i = 0; i < files.length; i++) {
        const fileObj = files[i];
        let dataUrl = fileObj.previewUrl;
        if (!dataUrl) {
          const reader = new FileReader();
          dataUrl = await new Promise<string>((res) => {
            reader.onload = () => res(reader.result as string);
            reader.readAsDataURL(fileObj.file);
          });
        }

        const img = await loadImage(dataUrl);

        imageDataList.push({
          dataUrl,
          type: fileObj.file.type || 'image/jpeg',
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });

        setProcState({
          status: 'processing',
          progress: 15 + Math.round(((i + 1) / files.length) * 45),
          message: `Loaded image ${i + 1} of ${files.length}...`,
        });
      }

      setProcState({
        status: 'processing',
        progress: 75,
        message: 'Assembling pages into formatted PDF...',
      });

      const pdfBytes = await imagesToPdf(imageDataList, {
        pageSize,
        orientation,
        margin,
      });

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const defaultName = `pdfbuddy_images_${new Date().toISOString().slice(0, 10)}.pdf`;

      setProcState({
        status: 'success',
        progress: 100,
        message: `Converted ${files.length} images into PDF!`,
        resultUrl: url,
        resultFileName: defaultName,
      });

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to convert images to PDF.',
      });
    }
  };

  const reset = () => {
    setFiles([]);
    setProcState({ status: 'idle', progress: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ToolHeader
        title="JPG / Images to PDF"
        description="Convert photos, screenshots, and scans (JPG, PNG, WebP) into an organized, publication-ready PDF document."
        iconName="FileImage"
        color="from-violet-500 to-purple-600"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Composing layout and embedding raster graphics..."
          />
        </div>
      )}

      {procState.status === 'success' && procState.resultUrl && procState.resultFileName && (
        <SuccessResultCard
          title="PDF Created!"
          message={`Your ${files.length} images have been assembled into a single clean PDF.`}
          resultUrl={procState.resultUrl}
          resultFileName={procState.resultFileName}
          onReset={reset}
          accentColor="bg-violet-600 hover:bg-violet-700 shadow-violet-600/30"
        />
      )}

      {procState.status === 'idle' && (
        <div className="space-y-6">
          <FileUploader
            accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp"
            multiple={true}
            files={files}
            onFilesChange={setFiles}
            title="Drop JPG, PNG, or WebP images here"
            subtitle="Select one or multiple photos to convert into PDF."
          />

          {files.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Page Size:
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none"
                  >
                    <option value="a4">A4 (Standard 210 x 297 mm)</option>
                    <option value="letter">US Letter (8.5 x 11 in)</option>
                    <option value="fit">Fit to Image Size</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Orientation:
                  </label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none"
                  >
                    <option value="auto">Auto (Match Image Aspect)</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Margins:
                  </label>
                  <select
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none"
                  >
                    <option value={0}>No Margin (Borderless)</option>
                    <option value={20}>Small Margin (20 pt)</option>
                    <option value={40}>Big Margin (40 pt)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Page Sequence ({files.length} Pages)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {files.map((file, idx) => (
                    <div
                      key={file.id}
                      className="relative p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col group"
                    >
                      <div className="relative aspect-video bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden mb-2">
                        {file.previewUrl && (
                          <img
                            src={file.previewUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-slate-950/70 text-white text-[10px] font-bold">
                          #{idx + 1}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mb-1">
                        {file.name}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-400 mt-auto">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveUp(idx)}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDown(idx)}
                            disabled={idx === files.length - 1}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleConvert}
                  className="px-8 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-xl shadow-violet-600/30 transition-all hover:scale-102 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generate PDF ({files.length} Pages)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
