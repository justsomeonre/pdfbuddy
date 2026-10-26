import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { getPdfJsDoc, renderPageToDataUrl } from '@/utils/pdfHelper';
import { readFileAsArrayBuffer, downloadBlob, downloadDataUrl } from '@/utils/formatters';
import { Image, Download, CheckCircle, Archive, FileImage } from 'lucide-react';

export const PdfToImageTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [dpiScale, setDpiScale] = useState<number>(2.0);
  const [renderedPages, setRenderedPages] = useState<string[]>([]);
  const [procState, setProcState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
  });

  const handleConvert = async () => {
    if (files.length === 0) return;

    try {
      setRenderedPages([]);
      setProcState({
        status: 'processing',
        progress: 10,
        message: 'Initializing PDF document renderer...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);
      const pdfJsDoc = await getPdfJsDoc(buffer);
      const totalPages = pdfJsDoc.numPages;
      const images: string[] = [];

      for (let i = 1; i <= totalPages; i++) {
        setProcState({
          status: 'processing',
          progress: 10 + Math.round((i / totalPages) * 75),
          message: `Rendering page ${i} of ${totalPages} at high resolution...`,
        });

        const dataUrl = await renderPageToDataUrl(pdfJsDoc, i, dpiScale, format, 0.92);
        images.push(dataUrl);
      }

      setRenderedPages(images);

      setProcState({
        status: 'success',
        progress: 100,
        message: `Successfully converted ${totalPages} pages to ${format === 'image/jpeg' ? 'JPG' : format === 'image/png' ? 'PNG' : 'WebP'}!`,
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to convert PDF pages to images.',
      });
    }
  };

  const downloadAllAsZip = async () => {
    if (renderedPages.length === 0) return;

    const zip = new JSZip();
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';
    const baseName = files[0].name.replace(/\.pdf$/i, '');

    for (let i = 0; i < renderedPages.length; i++) {
      const dataUrl = renderedPages[i];
      const base64Data = dataUrl.split(',')[1];
      const pad = String(i + 1).padStart(3, '0');
      zip.file(`${baseName}_page_${pad}.${ext}`, base64Data, { base64: true });
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${baseName}_images.zip`);
  };

  const downloadSinglePage = (dataUrl: string, pageNum: number) => {
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';
    const baseName = files[0].name.replace(/\.pdf$/i, '');
    const pad = String(pageNum).padStart(3, '0');
    downloadDataUrl(dataUrl, `${baseName}_page_${pad}.${ext}`);
  };

  const reset = () => {
    setFiles([]);
    setRenderedPages([]);
    setProcState({ status: 'idle', progress: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ToolHeader
        title="PDF to JPG / PNG"
        description="Convert every page of a PDF document into high-resolution JPG, PNG, or WebP pictures. Download pages individually or all in a ZIP."
        iconName="Image"
        color="from-pink-500 to-rose-600"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Rendering vector PDF elements to crisp raster images..."
          />
        </div>
      )}

      {procState.status === 'success' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Rendered {renderedPages.length} Pages
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You can download the entire set as a ZIP or download individual pages below.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={downloadAllAsZip}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
              >
                <Archive className="w-4 h-4" />
                Download All in ZIP
              </button>
              <button
                onClick={reset}
                className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
              >
                New File
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {renderedPages.map((dataUrl, idx) => (
              <div
                key={idx}
                className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
              >
                <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-800 mb-2">
                  <img
                    src={dataUrl}
                    alt={`Page ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => downloadSinglePage(dataUrl, idx + 1)}
                      className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-lg hover:scale-105 transition-transform"
                    >
                      <Download className="w-3.5 h-3.5" /> Save Image
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                  <span>Page {idx + 1}</span>
                  <button
                    onClick={() => downloadSinglePage(dataUrl, idx + 1)}
                    className="text-rose-600 hover:underline"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {procState.status === 'idle' && (
        <div className="space-y-6">
          <FileUploader
            accept=".pdf,application/pdf"
            multiple={false}
            files={files}
            onFilesChange={setFiles}
            title="Select PDF file to convert to images"
            subtitle="Converts every page into crystal clear images with customizable DPI."
          />

          {files.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Image Format:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'image/jpeg', label: 'JPG' },
                      { id: 'image/png', label: 'PNG' },
                      { id: 'image/webp', label: 'WebP' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFormat(f.id as any)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                          format === f.id
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Image Quality / Resolution:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { scale: 1.5, label: 'Standard (150 DPI)' },
                      { scale: 2.0, label: 'High (300 DPI)' },
                      { scale: 3.0, label: 'Ultra (450 DPI)' },
                    ].map((r) => (
                      <button
                        key={r.scale}
                        type="button"
                        onClick={() => setDpiScale(r.scale)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                          dpiScale === r.scale
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleConvert}
                  className="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-102 flex items-center gap-2"
                >
                  <FileImage className="w-4 h-4" />
                  Convert PDF to Images Now
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
