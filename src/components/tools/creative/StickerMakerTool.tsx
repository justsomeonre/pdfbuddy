import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { applyStickerOutline, removeBackground, loadImage } from '@/utils/imageHelper';
import { downloadDataUrl } from '@/utils/formatters';
import {
  Sparkles,
  Download,
  Copy,
  Scissors,
  Check,
} from 'lucide-react';

export const StickerMakerTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [outlineWidth, setOutlineWidth] = useState<number>(14);
  const [outlineColor, setOutlineColor] = useState<string>('#ffffff');
  const [hasShadow, setHasShadow] = useState<boolean>(true);
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
  const [bgTolerance, setBgTolerance] = useState<number>(25);
  const [stickerCaption, setStickerCaption] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (files.length > 0) {
      const url = files[0].previewUrl || URL.createObjectURL(files[0].file);
      loadImage(url).then((img) => {
        sourceImageRef.current = img;
        renderSticker();
      });
    } else {
      sourceImageRef.current = null;
    }
  }, [files]);

  useEffect(() => {
    if (sourceImageRef.current) {
      renderSticker();
    }
  }, [outlineWidth, outlineColor, hasShadow, autoRemoveBg, bgTolerance, stickerCaption]);

  const renderSticker = () => {
    const img = sourceImageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const baseCanvas = document.createElement('canvas');
    const maxDim = 500;
    let w = img.width;
    let h = img.height;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    baseCanvas.width = w;
    baseCanvas.height = h;
    const baseCtx = baseCanvas.getContext('2d')!;
    baseCtx.drawImage(img, 0, 0, w, h);

    if (autoRemoveBg) {
      removeBackground(baseCanvas, {
        targetColor: { r: 255, g: 255, b: 255 },
        tolerance: bgTolerance,
      });
    }

    const stickerCanvas = applyStickerOutline(baseCanvas, {
      outlineWidth,
      outlineColor,
      shadow: hasShadow,
      shadowBlur: 14,
      padding: outlineWidth + 24,
    });

    if (stickerCaption.trim()) {
      const sCtx = stickerCanvas.getContext('2d')!;
      const text = stickerCaption.toUpperCase();
      sCtx.save();
      sCtx.font = "900 24px 'Plus Jakarta Sans', sans-serif";
      const textW = sCtx.measureText(text).width;
      const bX = (stickerCanvas.width - textW - 32) / 2;
      const bY = stickerCanvas.height - 40;

      sCtx.fillStyle = '#e11d48';
      sCtx.beginPath();
      sCtx.roundRect(bX, bY, textW + 32, 34, 17);
      sCtx.fill();
      sCtx.strokeStyle = '#ffffff';
      sCtx.lineWidth = 3;
      sCtx.stroke();

      sCtx.fillStyle = '#ffffff';
      sCtx.fillText(text, bX + 16, bY + 24);
      sCtx.restore();
    }

    canvas.width = stickerCanvas.width;
    canvas.height = stickerCanvas.height;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(stickerCanvas, 0, 0);
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    downloadDataUrl(url, `pdfbuddy_sticker_${Date.now()}.png`);
    confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
  };

  const copyStickerToClipboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <ToolHeader
        title="Sticker Creator"
        description="Turn any photo, logo, or drawing into a die-cut sticker with a clean white contour border and drop shadow. Ready for WhatsApp, Telegram, or PDF stamps."
        iconName="Sparkles"
        badge="Creative"
        color="from-fuchsia-500 to-pink-600"
        onBack={onBack}
      />

      {files.length === 0 ? (
        <FileUploader
          accept="image/*"
          multiple={false}
          files={files}
          onFilesChange={setFiles}
          title="Select photo or drawing to turn into a sticker"
          subtitle="Works with PNG, JPG, or WebP. Auto-removes white background and adds die-cut outline."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center">
            <div
              className="relative w-full aspect-square rounded-3xl overflow-hidden flex items-center justify-center p-6 border border-slate-200 dark:border-slate-700 shadow-inner mb-6"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(148, 163, 184, 0.25) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                backgroundColor: 'rgba(241, 245, 249, 0.4)',
              }}
            >
              <canvas ref={canvasRef} className="max-w-full max-h-full object-contain drop-shadow-xl" />
            </div>

            <div className="w-full space-y-2">
              <button
                onClick={downloadPng}
                className="w-full py-3.5 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-600/30 transition-all hover:scale-102"
              >
                <Download className="w-4 h-4" /> Download Transparent PNG Sticker
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={copyStickerToClipboard}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied to Clipboard!' : 'Copy Sticker'}
                </button>

                <button
                  onClick={() => setFiles([])}
                  className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Scissors className="w-3.5 h-3.5" /> Upload New Photo
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-5">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Die-Cut Outline & Border
              </h4>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Border Thickness:
                  </span>
                  <span className="font-mono text-fuchsia-600 font-bold">{outlineWidth}px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="32"
                  value={outlineWidth}
                  onChange={(e) => setOutlineWidth(Number(e.target.value))}
                  className="w-full accent-fuchsia-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Border Outline Color:
                </label>
                <div className="flex items-center gap-2">
                  {['#ffffff', '#fde047', '#38bdf8', '#f43f5e', '#0f172a'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setOutlineColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 transition-transform ${
                        outlineColor === c ? 'scale-125 ring-2 ring-fuchsia-500' : ''
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={outlineColor}
                    onChange={(e) => setOutlineColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="shadowToggle"
                  checked={hasShadow}
                  onChange={(e) => setHasShadow(e.target.checked)}
                  className="w-4 h-4 rounded accent-fuchsia-600 cursor-pointer"
                />
                <label htmlFor="shadowToggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Enable 3D Sticker Drop Shadow
                </label>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Smart Background Removal
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoBgToggle"
                    checked={autoRemoveBg}
                    onChange={(e) => setAutoRemoveBg(e.target.checked)}
                    className="w-4 h-4 rounded accent-fuchsia-600 cursor-pointer"
                  />
                  <label htmlFor="autoBgToggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Enabled
                  </label>
                </div>
              </div>

              {autoRemoveBg && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Color Tolerance (Chroma):
                    </span>
                    <span className="font-mono text-slate-400">{bgTolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="65"
                    value={bgTolerance}
                    onChange={(e) => setBgTolerance(Number(e.target.value))}
                    className="w-full accent-fuchsia-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Increase slider to remove more off-white or noisy background areas.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Sticker Caption Banner (Optional):
              </label>
              <input
                type="text"
                maxLength={20}
                value={stickerCaption}
                onChange={(e) => setStickerCaption(e.target.value)}
                placeholder="e.g. APPROVED, TOP SECRET, 100%"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
