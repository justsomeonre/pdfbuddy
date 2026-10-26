import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { createGifFromCanvases, createGifFromImageUrls, convertVideoToGif } from '@/utils/gifHelper';
import { getPdfJsDoc, renderPageToCanvas } from '@/utils/pdfHelper';
import { readFileAsArrayBuffer } from '@/utils/formatters';
import {
  Film,
  Download,
  CheckCircle,
  FileImage,
  Video,
  BookOpen,
} from 'lucide-react';

export const GifStudioTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [studioMode, setStudioMode] = useState<'images' | 'video' | 'pdf'>('images');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [fps, setFps] = useState<number>(6);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [procState, setProcState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
  });

  const handleGenerateGif = async () => {
    if (files.length === 0) return;

    try {
      setGifUrl(null);
      setProcState({
        status: 'processing',
        progress: 10,
        message: 'Initializing GIF encoder...',
      });

      let gifBlob: Blob;
      const delayMs = Math.round(1000 / fps);

      if (studioMode === 'images') {
        const urls = files.map((f) => f.previewUrl || URL.createObjectURL(f.file));
        gifBlob = await createGifFromImageUrls(urls, {
          delayMs,
          onProgress: (cur, tot) => {
            setProcState({
              status: 'processing',
              progress: Math.round((cur / tot) * 90),
              message: `Encoding frame ${cur} of ${tot}...`,
            });
          },
        });
      } else if (studioMode === 'video') {
        gifBlob = await convertVideoToGif(files[0].file, {
          fps,
          maxDurationSec: 8,
          onProgress: (p) => {
            setProcState({
              status: 'processing',
              progress: p,
              message: `Capturing and quantizing video frames (${p}%)...`,
            });
          },
        });
      } else {
        const buffer = await readFileAsArrayBuffer(files[0].file);
        const doc = await getPdfJsDoc(buffer);
        const total = doc.numPages;
        const canvases: HTMLCanvasElement[] = [];

        for (let i = 1; i <= total; i++) {
          setProcState({
            status: 'processing',
            progress: Math.round((i / total) * 60),
            message: `Rendering PDF page ${i} of ${total}...`,
          });
          const c = await renderPageToCanvas(doc, i, 1.2);
          canvases.push(c);
        }

        gifBlob = await createGifFromCanvases(canvases, {
          delayMs: Math.max(400, delayMs * 2),
          onProgress: (cur, tot) => {
            setProcState({
              status: 'processing',
              progress: 60 + Math.round((cur / tot) * 35),
              message: `Stitching GIF flipbook frame ${cur} of ${tot}...`,
            });
          },
        });
      }

      const url = URL.createObjectURL(gifBlob);
      setGifUrl(url);

      setProcState({
        status: 'success',
        progress: 100,
        message: 'Animated GIF created successfully!',
        resultUrl: url,
        resultFileName: `pdfbuddy_animation_${Date.now()}.gif`,
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to create animated GIF.',
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
    setGifUrl(null);
    setProcState({ status: 'idle', progress: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ToolHeader
        title="GIF Studio"
        description="Create animated GIFs from photos, video clips, or PDF flipbooks with customizable frame rate (FPS) and loop controls. 100% free and client-side."
        iconName="Film"
        badge="Creative"
        color="from-indigo-500 to-blue-600"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar progress={procState.progress} message={procState.message} />
        </div>
      )}

      {procState.status === 'success' && gifUrl && (
        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center max-w-xl mx-auto space-y-6 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              GIF Generated!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Your animated GIF is ready to download or share.
            </p>
          </div>

          <div className="max-w-xs mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg">
            <img src={gifUrl} alt="Generated GIF" className="w-full h-auto object-contain" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={downloadResult}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Download Animated GIF
            </button>
            <button
              onClick={reset}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition-all"
            >
              Create Another GIF
            </button>
          </div>
        </div>
      )}

      {procState.status === 'idle' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              onClick={() => {
                setStudioMode('images');
                setFiles([]);
              }}
              className={`py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                studioMode === 'images'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileImage className="w-4 h-4 text-indigo-500" />
              Images to GIF
            </button>

            <button
              onClick={() => {
                setStudioMode('video');
                setFiles([]);
              }}
              className={`py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                studioMode === 'video'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Video className="w-4 h-4 text-indigo-500" />
              Video to GIF
            </button>

            <button
              onClick={() => {
                setStudioMode('pdf');
                setFiles([]);
              }}
              className={`py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                studioMode === 'pdf'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-500" />
              PDF Flipbook GIF
            </button>
          </div>

          <FileUploader
            accept={
              studioMode === 'images'
                ? 'image/*'
                : studioMode === 'video'
                ? 'video/mp4,video/webm'
                : '.pdf,application/pdf'
            }
            multiple={studioMode === 'images'}
            files={files}
            onFilesChange={setFiles}
            title={
              studioMode === 'images'
                ? 'Select multiple photos to animate'
                : studioMode === 'video'
                ? 'Select MP4 or WebM video to convert'
                : 'Select PDF document to turn into flipbook GIF'
            }
            subtitle="Processed right in your browser memory with zero upload limits."
          />

          {files.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Playback Speed / FPS:
                  </span>
                  <span className="font-mono text-indigo-600 font-bold">{fps} Frames / Sec</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleGenerateGif}
                  className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-102 flex items-center gap-2"
                >
                  <Film className="w-4 h-4" />
                  Generate Animated GIF Now
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
