import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { getPdfJsDoc, renderPageToCanvas } from '@/utils/pdfHelper';
import { readFileAsArrayBuffer } from '@/utils/formatters';
import { removeBackground } from '@/utils/imageHelper';
import { PDFDocument } from 'pdf-lib';
import {
  FileSignature,
  PenTool,
  Type,
  Upload,
  Download,
  CheckCircle,
  Trash2,
  Move,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const SignPdfTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [signMode, setSignMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState<string>('John Doe');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const [sigPosition, setSigPosition] = useState<{ x: number; y: number }>({ x: 150, y: 300 });
  const [sigScale, setSigScale] = useState<number>(1.0);
  const [isDraggingSig, setIsDraggingSig] = useState<boolean>(false);

  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfViewCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingSig, setIsDrawingSig] = useState<boolean>(false);

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
    if (!pdfDoc || !pdfViewCanvasRef.current) return;
    (async () => {
      const pageCanvas = await renderPageToCanvas(pdfDoc, currentPage, 1.2);
      bgCanvasRef.current = pageCanvas;
      renderPdfWithSignature();
    })();
  }, [pdfDoc, currentPage, signatureDataUrl, sigPosition, sigScale]);

  const renderPdfWithSignature = () => {
    const canvas = pdfViewCanvasRef.current;
    if (!canvas || !bgCanvasRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = bgCanvasRef.current.width;
    canvas.height = bgCanvasRef.current.height;

    ctx.drawImage(bgCanvasRef.current, 0, 0);

    if (signatureDataUrl) {
      const img = new Image();
      img.onload = () => {
        const w = (img.width || 180) * sigScale;
        const h = (img.height || 70) * sigScale;
        ctx.save();
        ctx.drawImage(img, sigPosition.x, sigPosition.y, w, h);

        ctx.strokeStyle = '#6366f1';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.strokeRect(sigPosition.x - 2, sigPosition.y - 2, w + 4, h + 4);
        ctx.restore();
      };
      img.src = signatureDataUrl;
    }
  };

  const handleSigMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawingSig(true);
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleSigMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleSigMouseUp = () => {
    if (!isDrawingSig) return;
    setIsDrawingSig(false);
    if (sigCanvasRef.current) {
      setSignatureDataUrl(sigCanvasRef.current.toDataURL('image/png'));
    }
  };

  const clearSigPad = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  const generateTypedSignature = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 120;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'italic 42px "Brush Script MT", cursive, sans-serif';
    ctx.fillText(typedName, 20, 75);
    setSignatureDataUrl(canvas.toDataURL('image/png'));
  };

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const cleanedCanvas = removeBackground(canvas, {
          targetColor: { r: 255, g: 255, b: 255 },
          tolerance: 35,
        });

        setSignatureDataUrl(cleanedCanvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePdfCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!signatureDataUrl) return;
    const canvas = pdfViewCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    setSigPosition({ x: Math.max(0, x - 70), y: Math.max(0, y - 30) });
    setIsDraggingSig(true);
  };

  const handlePdfCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingSig || !signatureDataUrl) return;
    const canvas = pdfViewCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    setSigPosition({ x: Math.max(0, x - 70), y: Math.max(0, y - 30) });
  };

  const handlePdfCanvasMouseUp = () => {
    setIsDraggingSig(false);
  };

  const handleSaveSignedPdf = async () => {
    if (!pdfDoc || !signatureDataUrl) return;

    try {
      setProcState({
        status: 'processing',
        progress: 25,
        message: 'Applying digital signature stamp to PDF page...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = pdf.getPages();
      const targetPage = pages[currentPage - 1];

      const sigImage = await pdf.embedPng(signatureDataUrl);

      const { width: pageWidth, height: pageHeight } = targetPage.getSize();
      const canvas = pdfViewCanvasRef.current!;
      const scaleX = pageWidth / canvas.width;
      const scaleY = pageHeight / canvas.height;

      const drawWidth = (sigImage.width || 180) * sigScale * scaleX;
      const drawHeight = (sigImage.height || 70) * sigScale * scaleY;
      const drawX = sigPosition.x * scaleX;
      const drawY = pageHeight - (sigPosition.y * scaleY + drawHeight);

      targetPage.drawImage(sigImage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });

      setProcState({
        status: 'processing',
        progress: 80,
        message: 'Finalizing signed document...',
      });

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      setProcState({
        status: 'success',
        progress: 100,
        message: 'Signed PDF is ready for download!',
        resultUrl: url,
        resultFileName: `${baseName}_signed.pdf`,
      });

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to apply signature to PDF.',
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
        title="Sign PDF"
        description="Create your digital signature (draw, type cursive, or upload) and stamp it onto any page. 100% private and legally binding ready."
        iconName="FileSignature"
        color="from-purple-500 to-indigo-600"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Embedding signature into PDF vector layer..."
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
              Signature Applied!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Your signature is sealed onto page {currentPage}.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={downloadResult}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Download Signed PDF
            </button>
            <button
              onClick={() => setProcState({ status: 'idle', progress: 0 })}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition-all"
            >
              Adjust Signature
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
              title="Select PDF document to sign"
              subtitle="Contracts, NDAs, leases, invoices. No limits, completely secure in browser."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  1. Create Your Signature
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSignMode('draw')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      signMode === 'draw'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Draw
                  </button>
                  <button
                    onClick={() => setSignMode('type')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      signMode === 'type'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Type
                  </button>
                  <button
                    onClick={() => setSignMode('upload')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      signMode === 'upload'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Upload
                  </button>
                </div>

                {signMode === 'draw' && (
                  <div className="space-y-2">
                    <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
                      <canvas
                        ref={sigCanvasRef}
                        width={300}
                        height={120}
                        onMouseDown={handleSigMouseDown}
                        onMouseMove={handleSigMouseMove}
                        onMouseUp={handleSigMouseUp}
                        className="w-full cursor-crosshair bg-white"
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Draw with mouse / pen</span>
                      <button
                        onClick={clearSigPad}
                        className="text-red-500 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                      </button>
                    </div>
                  </div>
                )}

                {signMode === 'type' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="Your full name..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
                    />
                    <button
                      onClick={generateTypedSignature}
                      className="w-full py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
                    >
                      Use Typed Signature
                    </button>
                  </div>
                )}

                {signMode === 'upload' && (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-purple-500">
                      <Upload className="w-6 h-6 text-purple-500 mb-1" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Upload signature photo
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Auto white-background removal
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadSignature}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {signatureDataUrl && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Signature Size:
                      </span>
                      <span className="text-slate-400 font-mono">
                        {Math.round(sigScale * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="2.0"
                      step="0.05"
                      value={sigScale}
                      onChange={(e) => setSigScale(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    disabled={!signatureDataUrl}
                    onClick={handleSaveSignedPdf}
                    className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all hover:scale-102 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Seal & Download PDF
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-purple-500" />
                    Click or drag on the page to position your signature
                  </span>

                  <div className="flex items-center gap-2">
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
                </div>

                <div className="bg-slate-200 dark:bg-slate-950/90 rounded-3xl p-4 flex items-center justify-center overflow-auto max-h-[68vh] shadow-inner border border-slate-200 dark:border-slate-800">
                  <canvas
                    ref={pdfViewCanvasRef}
                    onMouseDown={handlePdfCanvasMouseDown}
                    onMouseMove={handlePdfCanvasMouseMove}
                    onMouseUp={handlePdfCanvasMouseUp}
                    className="shadow-2xl rounded-lg bg-white cursor-move max-w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
