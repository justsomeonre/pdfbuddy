import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { getPdfJsDoc, renderPageToCanvas } from '@/utils/pdfHelper';
import { readFileAsArrayBuffer } from '@/utils/formatters';
import { PDFDocument } from 'pdf-lib';
import { EyeOff, Download, CheckCircle, Undo2, ChevronLeft, ChevronRight, Save } from 'lucide-react';

interface RedactBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const RedactPdfTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [boxes, setBoxes] = useState<{ [page: number]: RedactBox[] }>({});

  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

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
          setBoxes({});
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
      const pageCanvas = await renderPageToCanvas(pdfDoc, currentPage, 1.4);
      bgCanvasRef.current = pageCanvas;
      redrawCanvas();
    })();
  }, [pdfDoc, currentPage]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !bgCanvasRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = bgCanvasRef.current.width;
    canvas.height = bgCanvasRef.current.height;

    ctx.drawImage(bgCanvasRef.current, 0, 0);

    const list = boxes[currentPage] || [];
    ctx.fillStyle = '#000000';
    for (const b of list) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPoint(coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    redrawCanvas();

    const w = coords.x - startPoint.x;
    const h = coords.y - startPoint.y;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(startPoint.x, startPoint.y, w, h);
    ctx.strokeStyle = '#e11d48';
    ctx.strokeRect(startPoint.x, startPoint.y, w, h);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    setIsDrawing(false);
    const coords = getCanvasCoords(e);

    const x = Math.min(startPoint.x, coords.x);
    const y = Math.min(startPoint.y, coords.y);
    const w = Math.abs(coords.x - startPoint.x);
    const h = Math.abs(coords.y - startPoint.y);

    if (w > 5 && h > 5) {
      const cur = boxes[currentPage] || [];
      setBoxes({
        ...boxes,
        [currentPage]: [...cur, { x, y, w, h }],
      });
    }

    setStartPoint(null);
    setTimeout(redrawCanvas, 10);
  };

  const handleUndo = () => {
    const cur = boxes[currentPage] || [];
    if (cur.length === 0) return;
    setBoxes({ ...boxes, [currentPage]: cur.slice(0, -1) });
    setTimeout(redrawCanvas, 10);
  };

  const handleSaveRedactedPdf = async () => {
    if (!pdfDoc) return;

    try {
      setProcState({
        status: 'processing',
        progress: 25,
        message: 'Permanently burning blackout redactions into PDF...',
      });

      const newPdf = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        const pageCanvas = await renderPageToCanvas(pdfDoc, i, 1.5);
        const ctx = pageCanvas.getContext('2d')!;

        const list = boxes[i] || [];
        ctx.fillStyle = '#000000';
        for (const b of list) {
          ctx.fillRect(b.x, b.y, b.w, b.h);
        }

        const dataUrl = pageCanvas.toDataURL('image/jpeg', 0.92);
        const embeddedImg = await newPdf.embedJpg(dataUrl);

        const originalPage = await pdfDoc.getPage(i);
        const viewport = originalPage.getViewport({ scale: 1.0 });

        const page = newPdf.addPage([viewport.width, viewport.height]);
        page.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      setProcState({
        status: 'success',
        progress: 100,
        message: 'Redacted PDF created! Text is permanently obscured.',
        resultUrl: url,
        resultFileName: `${baseName}_redacted.pdf`,
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to save redacted PDF.',
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <ToolHeader
        title="Redact PDF"
        description="Permanently blackout sensitive information, SSNs, credit card numbers, addresses, or confidential corporate secrets."
        iconName="EyeOff"
        color="from-slate-700 to-slate-900"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Burning redaction pixels permanently..."
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
              Redaction Applied!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Blacked-out areas cannot be highlighted or recovered.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={downloadResult}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Download Redacted PDF
            </button>
            <button
              onClick={() => setProcState({ status: 'idle', progress: 0 })}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition-all"
            >
              Redact More
            </button>
          </div>
        </div>
      )}

      {procState.status === 'idle' && (
        <div className="space-y-6">
          {files.length === 0 ? (
            <FileUploader
              accept=".pdf,application/pdf"
              multiple={false}
              files={files}
              onFilesChange={setFiles}
              title="Select PDF file to redact"
              subtitle="Drag boxes over text to censor and permanently blackout confidential areas."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Click and drag boxes over text to blackout.
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleUndo}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1"
                  >
                    <Undo2 className="w-3.5 h-3.5" /> Undo Box
                  </button>

                  <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleSaveRedactedPdf}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Redacted PDF
                  </button>
                </div>
              </div>

              <div className="bg-slate-200 dark:bg-slate-950/90 rounded-3xl p-4 sm:p-8 flex items-center justify-center overflow-auto max-h-[70vh] shadow-inner border border-slate-200 dark:border-slate-800">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="shadow-2xl rounded-lg bg-white cursor-crosshair max-w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
