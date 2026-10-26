import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { downloadDataUrl } from '@/utils/formatters';
import { loadImage } from '@/utils/imageHelper';
import { PDFDocument } from 'pdf-lib';
import { Download, FileText } from 'lucide-react';

export const MemeGeneratorTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [topText, setTopText] = useState<string>('WHEN THE PDF TOOL');
  const [bottomText, setBottomText] = useState<string>('IS 100% FREE WITH NO LIMITS');
  const [fontSize, setFontSize] = useState<number>(36);
  const [styleMode, setStyleMode] = useState<'classic' | 'modern'>('classic');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (files.length > 0) {
      const url = files[0].previewUrl || URL.createObjectURL(files[0].file);
      loadImage(url).then((img) => {
        imgRef.current = img;
        renderMeme();
      });
    } else {
      loadImage('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231e293b"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="28" fill="%2394a3b8">Drop an image or select file</text></svg>').then((img) => {
        imgRef.current = img;
        renderMeme();
      });
    }
  }, [files]);

  useEffect(() => {
    if (imgRef.current) {
      renderMeme();
    }
  }, [topText, bottomText, fontSize, styleMode]);

  const renderMeme = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext('2d')!;
    const maxW = 600;
    const aspect = img.height / img.width;
    const width = maxW;
    const height = Math.round(width * aspect);

    const modernBannerHeight = styleMode === 'modern' ? 100 : 0;

    canvas.width = width;
    canvas.height = height + modernBannerHeight;

    if (styleMode === 'modern') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, modernBannerHeight);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(topText, 20, 45);
      if (bottomText) {
        ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(bottomText, 20, 75);
      }

      ctx.drawImage(img, 0, modernBannerHeight, width, height);
    } else {
      ctx.drawImage(img, 0, 0, width, height);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(3, fontSize / 7);
      ctx.textAlign = 'center';
      ctx.font = `900 ${fontSize}px Impact, "Arial Black", sans-serif`;

      if (topText) {
        ctx.strokeText(topText.toUpperCase(), width / 2, fontSize + 15);
        ctx.fillText(topText.toUpperCase(), width / 2, fontSize + 15);
      }

      if (bottomText) {
        ctx.strokeText(bottomText.toUpperCase(), width / 2, height - 20);
        ctx.fillText(bottomText.toUpperCase(), width / 2, height - 20);
      }
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/jpeg', 0.95);
    downloadDataUrl(url, `pdfbuddy_meme_${Date.now()}.jpg`);
    confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
  };

  const exportAsPdf = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/jpeg', 0.95);

    const pdfDoc = await PDFDocument.create();
    const imgEmbed = await pdfDoc.embedJpg(url);
    const page = pdfDoc.addPage([canvas.width, canvas.height]);
    page.drawImage(imgEmbed, {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    downloadDataUrl(downloadUrl, `pdfbuddy_meme_${Date.now()}.pdf`);
    confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <ToolHeader
        title="Meme Studio"
        description="Make viral top & bottom caption memes or modern header memes in seconds. Export as JPG, PNG, or formatted PDF."
        iconName="Laugh"
        badge="Creative"
        color="from-lime-500 to-emerald-600"
        onBack={onBack}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center">
          <div className="relative w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 mb-6 bg-slate-900">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>

          <div className="w-full space-y-2">
            <button
              onClick={downloadImage}
              className="w-full py-3.5 rounded-2xl bg-lime-500 hover:bg-lime-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-500/25 transition-all hover:scale-102"
            >
              <Download className="w-4 h-4" /> Download Meme (JPG)
            </button>

            <button
              onClick={exportAsPdf}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4" /> Save as PDF Document
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-5">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <FileUploader
              accept="image/*"
              multiple={false}
              files={files}
              onFilesChange={setFiles}
              title="Upload your meme picture"
              subtitle="Photos, screenshots, templates."
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Top Text:
              </label>
              <input
                type="text"
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                placeholder="TOP CAPTION..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Bottom Text:
              </label>
              <input
                type="text"
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                placeholder="BOTTOM CAPTION..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Meme Style:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setStyleMode('classic')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      styleMode === 'classic'
                        ? 'bg-lime-500 text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Classic Impact
                  </button>
                  <button
                    onClick={() => setStyleMode('modern')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      styleMode === 'modern'
                        ? 'bg-lime-500 text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Modern Box
                  </button>
                </div>
              </div>

              {styleMode === 'classic' && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Font Size:
                    </span>
                    <span className="font-mono text-slate-400">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="64"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-lime-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
