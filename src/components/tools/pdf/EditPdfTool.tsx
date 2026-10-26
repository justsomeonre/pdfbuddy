import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { getPdfJsDoc, renderPageToCanvas } from '@/utils/pdfHelper';
import { readFileAsArrayBuffer } from '@/utils/formatters';
import { PDFDocument } from 'pdf-lib';
import {
  PenTool,
  Type,
  Highlighter,
  Square,
  Undo2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Save,
} from 'lucide-react';
import { SuccessResultCard } from '@/components/common/SuccessResultCard';

interface Annotation {
  type: 'pen' | 'highlighter' | 'text' | 'rect';
  points?: { x: number; y: number }[];
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
  size: number;
}

export const EditPdfTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTool, setActiveTool] = useState<'pen' | 'highlighter' | 'text' | 'rect'>('pen');
  const [color, setColor] = useState<string>('#e11d48');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [textInput, setTextInput] = useState<string>('Sample Text');

  const [pageAnnotations, setPageAnnotations] = useState<{ [page: number]: Annotation[] }>({});
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);

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
          setPageAnnotations({});
        } catch (e) {
          console.error(e);
        }
      })();
    } else {
      setPdfDoc(null);
      setTotalPages(1);
    }
  }, [files]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    (async () => {
      const pageCanvas = await renderPageToCanvas(pdfDoc, currentPage, 1.5);
      bgCanvasRef.current = pageCanvas;
      redrawAll();
    })();
  }, [pdfDoc, currentPage]);

  const redrawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas || !bgCanvasRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = bgCanvasRef.current.width;
    canvas.height = bgCanvasRef.current.height;

    ctx.drawImage(bgCanvasRef.current, 0, 0);

    const currentList = pageAnnotations[currentPage] || [];
    for (const ann of currentList) {
      drawAnnotation(ctx, ann);
    }
  };

  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation) => {
    ctx.save();
    if (ann.type === 'pen') {
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (ann.points && ann.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
      }
    } else if (ann.type === 'highlighter') {
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.size * 3;
      ctx.globalAlpha = 0.35;
      ctx.lineCap = 'square';
      if (ann.points && ann.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
      }
    } else if (ann.type === 'text' && ann.text && ann.x !== undefined && ann.y !== undefined) {
      ctx.font = `bold ${ann.size * 5}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = ann.color;
      ctx.fillText(ann.text, ann.x, ann.y);
    } else if (ann.type === 'rect' && ann.x !== undefined && ann.y !== undefined) {
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.size;
      ctx.strokeRect(ann.x, ann.y, ann.width || 140, ann.height || 70);
    }
    ctx.restore();
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0) : e.clientX;
    const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0) : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    if (activeTool === 'text') {
      const newAnn: Annotation = {
        type: 'text',
        text: textInput,
        x: coords.x,
        y: coords.y,
        color,
        size: brushSize,
      };
      const cur = pageAnnotations[currentPage] || [];
      const updated = { ...pageAnnotations, [currentPage]: [...cur, newAnn] };
      setPageAnnotations(updated);
      setTimeout(redrawAll, 10);
      return;
    }

    if (activeTool === 'rect') {
      const newAnn: Annotation = {
        type: 'rect',
        x: coords.x,
        y: coords.y,
        width: 140,
        height: 70,
        color,
        size: brushSize,
      };
      const cur = pageAnnotations[currentPage] || [];
      const updated = { ...pageAnnotations, [currentPage]: [...cur, newAnn] };
      setPageAnnotations(updated);
      setTimeout(redrawAll, 10);
      return;
    }

    setIsDrawing(true);
    setCurrentPoints([coords]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    const newPoints = [...currentPoints, coords];
    setCurrentPoints(newPoints);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    redrawAll();
    drawAnnotation(ctx, {
      type: activeTool as any,
      points: newPoints,
      color,
      size: brushSize,
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.length > 1) {
      const newAnn: Annotation = {
        type: activeTool as any,
        points: currentPoints,
        color,
        size: brushSize,
      };
      const cur = pageAnnotations[currentPage] || [];
      setPageAnnotations({
        ...pageAnnotations,
        [currentPage]: [...cur, newAnn],
      });
    }
    setCurrentPoints([]);
    setTimeout(redrawAll, 10);
  };

  const handleUndo = () => {
    const cur = pageAnnotations[currentPage] || [];
    if (cur.length === 0) return;
    const updated = cur.slice(0, -1);
    setPageAnnotations({ ...pageAnnotations, [currentPage]: updated });
    setTimeout(redrawAll, 10);
  };

  const handleClearPage = () => {
    const updated = { ...pageAnnotations, [currentPage]: [] };
    setPageAnnotations(updated);
    setTimeout(redrawAll, 10);
  };

  const handleSavePdf = async () => {
    if (!pdfDoc) return;

    try {
      setProcState({
        status: 'processing',
        progress: 20,
        message: 'Baking annotations and drawings into PDF pages...',
      });

      const newPdf = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        setProcState({
          status: 'processing',
          progress: 20 + Math.round((i / totalPages) * 70),
          message: `Flattening edited page ${i} of ${totalPages}...`,
        });

        const pageCanvas = await renderPageToCanvas(pdfDoc, i, 1.5);
        const ctx = pageCanvas.getContext('2d')!;

        const annList = pageAnnotations[i] || [];
        for (const ann of annList) {
          drawAnnotation(ctx, ann);
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
        message: 'Edited PDF saved successfully!',
        resultUrl: url,
        resultFileName: `${baseName}_edited.pdf`,
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to save edited PDF.',
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <ToolHeader
        title="Edit PDF Canvas"
        description="Add text annotations, freehand drawings, highlighters, shapes, and stamps directly onto your PDF pages."
        iconName="PenTool"
        badge="Visual Studio"
        color="from-cyan-500 to-blue-600"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Baking all drawings and typography into high-res PDF layers..."
          />
        </div>
      )}

      {procState.status === 'success' && procState.resultUrl && procState.resultFileName && (
        <SuccessResultCard
          title="Edits Saved!"
          message="Your modifications and annotations are compiled into the PDF."
          resultUrl={procState.resultUrl}
          resultFileName={procState.resultFileName}
          onReset={() => setProcState({ status: 'idle', progress: 0 })}
          accentColor="bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/30"
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
              title="Select PDF file to edit"
              subtitle="Draw, highlight, add text, or stamp graphics. 100% private in browser."
            />
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                  <button
                    onClick={() => setActiveTool('pen')}
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeTool === 'pen'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <PenTool className="w-4 h-4" /> Pen
                  </button>
                  <button
                    onClick={() => setActiveTool('highlighter')}
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeTool === 'highlighter'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Highlighter className="w-4 h-4" /> Highlight
                  </button>
                  <button
                    onClick={() => setActiveTool('text')}
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeTool === 'text'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Type className="w-4 h-4" /> Text
                  </button>
                  <button
                    onClick={() => setActiveTool('rect')}
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeTool === 'rect'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Square className="w-4 h-4" /> Box
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {['#e11d48', '#2563eb', '#16a34a', '#ca8a04', '#000000'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                        }`}
                      />
                    ))}
                  </div>

                  {activeTool === 'text' ? (
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type text, then click canvas..."
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs w-48 outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Size:</span>
                      <input
                        type="range"
                        min="2"
                        max="24"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-20 accent-rose-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndo}
                    title="Undo last stroke"
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleClearPage}
                    title="Clear page drawings"
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 bg-slate-100 dark:bg-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSavePdf}
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition-all hover:scale-105"
                  >
                    <Save className="w-3.5 h-3.5" /> Save PDF
                  </button>
                </div>
              </div>

              <div className="relative bg-slate-200 dark:bg-slate-950/90 rounded-3xl p-4 sm:p-8 flex items-center justify-center overflow-auto max-h-[70vh] shadow-inner border border-slate-200 dark:border-slate-800">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleMouseDown(e);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    handleMouseMove(e);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleMouseUp();
                  }}
                  style={{ touchAction: 'none' }}
                  className="shadow-2xl rounded-lg bg-white cursor-crosshair max-w-full"
                />
              </div>

              <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-30 text-xs font-semibold flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Page
                </button>
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-30 text-xs font-semibold flex items-center gap-1"
                >
                  Next Page <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
