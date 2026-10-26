import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { addWatermarkToPdf } from '@/utils/pdfHelper';
import { readFileAsArrayBuffer } from '@/utils/formatters';
import { Stamp } from 'lucide-react';
import { SuccessResultCard } from '@/components/common/SuccessResultCard';

export const WatermarkPdfTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState<string>('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState<number>(44);
  const [opacity, setOpacity] = useState<number>(0.25);
  const [rotation, setRotation] = useState<number>(45);
  const [isTiled, setIsTiled] = useState<boolean>(false);
  const [color, setColor] = useState<string>('#e11d48');

  const [procState, setProcState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
  });

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  };

  const handleApply = async () => {
    if (files.length === 0) return;

    try {
      setProcState({
        status: 'processing',
        progress: 25,
        message: 'Applying watermark layers to all pages...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);
      const rgbColor = hexToRgb(color);

      const watermarkedBytes = await addWatermarkToPdf(buffer, {
        type: watermarkType,
        text,
        fontSize,
        opacity,
        rotation,
        color: rgbColor,
        isTiled,
      });

      const blob = new Blob([watermarkedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      setProcState({
        status: 'success',
        progress: 100,
        message: 'Watermark applied to all pages!',
        resultUrl: url,
        resultFileName: `${baseName}_watermarked.pdf`,
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to apply watermark.',
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
        title="Watermark PDF"
        description="Stamp custom text or logo watermarks across every page with transparency, angle rotation, and tiled repeat patterns."
        iconName="Stamp"
        color="from-blue-500 to-indigo-600"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Stamping high-resolution vector watermarks..."
          />
        </div>
      )}

      {procState.status === 'success' && procState.resultUrl && procState.resultFileName && (
        <SuccessResultCard
          title="Watermark Applied!"
          message="All pages in your document have been branded with your watermark."
          resultUrl={procState.resultUrl}
          resultFileName={procState.resultFileName}
          onReset={reset}
          accentColor="bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
        />
      )}

      {procState.status === 'idle' && (
        <div className="space-y-6">
          <FileUploader
            accept=".pdf,application/pdf"
            multiple={false}
            files={files}
            onFilesChange={setFiles}
            title="Select PDF document to watermark"
            subtitle="Stamp 'CONFIDENTIAL', 'DRAFT', copyright notice, or your company name."
          />

          {files.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Watermark Text:
                    </label>
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL, DRAFT, SAMPLE"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Color & Preset:
                    </label>
                    <div className="flex items-center gap-2">
                      {['#e11d48', '#2563eb', '#64748b', '#0f172a'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-7 h-7 rounded-full transition-transform ${
                            color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : ''
                          }`}
                        />
                      ))}
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="tiledGrid"
                      checked={isTiled}
                      onChange={(e) => setIsTiled(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                    />
                    <label htmlFor="tiledGrid" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Repeat as Tiled Grid Pattern across whole page
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Opacity:
                      </span>
                      <span className="font-mono text-slate-400">{Math.round(opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.05"
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Rotation Angle:
                      </span>
                      <span className="font-mono text-slate-400">{rotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Font Size:
                      </span>
                      <span className="font-mono text-slate-400">{fontSize} pt</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="90"
                      step="2"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-102 flex items-center gap-2"
                >
                  <Stamp className="w-4 h-4" />
                  Apply Watermark Now
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
