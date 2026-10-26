import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { getPdfJsDoc, renderPageToCanvas } from '@/utils/pdfHelper';
import { readFileAsArrayBuffer } from '@/utils/formatters';
import { PDFDocument } from 'pdf-lib';
import { Crop, Save } from 'lucide-react';
import { SuccessResultCard } from '@/components/common/SuccessResultCard';

export const CropPdfTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.1,
    y: 0.1,
    w: 0.8,
    h: 0.8,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
        } catch (e) {
          console.error(e);
        }
      })();
    } else {
      setPdfDoc(null);
    }
  }, [files]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    (async () => {
      const pageCanvas = await renderPageToCanvas(pdfDoc, currentPage, 1.2);
      bgCanvasRef.current = pageCanvas;
      redrawCrop();
    })();
  }, [pdfDoc, currentPage, cropBox]);

  const redrawCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || !bgCanvasRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = bgCanvasRef.current.width;
    canvas.height = bgCanvasRef.current.height;

    ctx.drawImage(bgCanvasRef.current, 0, 0);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = cropBox.x * canvas.width;
    const cy = cropBox.y * canvas.height;
    const cw = cropBox.w * canvas.width;
    const ch = cropBox.h * canvas.height;

    ctx.clearRect(cx, cy, cw, ch);
    ctx.drawImage(bgCanvasRef.current, cx, cy, cw, ch, cx, cy, cw, ch);

    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(cx, cy, cw, ch);
  };

  const handleSaveCrop = async () => {
    if (!pdfDoc) return;

    try {
      setProcState({
        status: 'processing',
        progress: 25,
        message: 'Cropping page viewports and bounding boxes...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = pdf.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();
        const cropX = cropBox.x * width;
        const cropY = (1 - (cropBox.y + cropBox.h)) * height;
        const cropW = cropBox.w * width;
        const cropH = cropBox.h * height;

        page.setCropBox(cropX, cropY, cropW, cropH);
      }

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      setProcState({
        status: 'success',
        progress: 100,
        message: 'Cropped PDF saved successfully!',
        resultUrl: url,
        resultFileName: `${baseName}_cropped.pdf`,
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to crop PDF.',
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
        title="Crop PDF"
        description="Trim margins, adjust page borders, and remove white borders from PDF documents visually."
        iconName="Crop"
        color="from-stone-500 to-zinc-700"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar progress={procState.progress} message={procState.message} />
        </div>
      )}

      {procState.status === 'success' && procState.resultUrl && procState.resultFileName && (
        <SuccessResultCard
          title="PDF Cropped!"
          message="Margins and viewport trimmed to your selection."
          resultUrl={procState.resultUrl}
          resultFileName={procState.resultFileName}
          onReset={reset}
          accentColor="bg-stone-700 hover:bg-stone-800 shadow-stone-700/30"
        />
      )}

      {procState.status === 'idle' && (
        <div className="space-y-6">
          {files.length === 0 ? (
            <FileUploader
              accept=".pdf,application/pdf"
              multiple={false}
              files={files}
              onFilesChange={setFiles}
              title="Select PDF file to crop"
              subtitle="Trim margins and crop extra space."
            />
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Margin Trimmer:
                  </span>
                  <button
                    onClick={() => setCropBox({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 })}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                  >
                    Tight (5%)
                  </button>
                  <button
                    onClick={() => setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                  >
                    Medium (10%)
                  </button>
                  <button
                    onClick={() => setCropBox({ x: 0.15, y: 0.15, w: 0.7, h: 0.7 })}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                  >
                    Large (15%)
                  </button>
                </div>

                <button
                  onClick={handleSaveCrop}
                  className="px-6 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
                >
                  <Save className="w-3.5 h-3.5" /> Save Cropped PDF
                </button>
              </div>

              <div className="bg-slate-200 dark:bg-slate-950/90 rounded-3xl p-4 flex items-center justify-center overflow-auto max-h-[70vh] shadow-inner border border-slate-200 dark:border-slate-800">
                <canvas ref={canvasRef} className="shadow-2xl rounded-lg bg-white max-w-full" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
