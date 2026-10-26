import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { getPdfJsDoc, renderPageToDataUrl } from '@/utils/pdfHelper';
import { readFileAsArrayBuffer, downloadBlob, downloadDataUrl } from '@/utils/formatters';
import { DownloadCloud, Download, Archive } from 'lucide-react';

export const ExtractImagesTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [procState, setProcState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
  });

  const handleExtract = async () => {
    if (files.length === 0) return;

    try {
      setExtractedImages([]);
      setProcState({
        status: 'processing',
        progress: 15,
        message: 'Scanning PDF internal resources for image objects...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);
      const pdfJsDoc = await getPdfJsDoc(buffer);
      const images: string[] = [];

      for (let i = 1; i <= pdfJsDoc.numPages; i++) {
        setProcState({
          status: 'processing',
          progress: 15 + Math.round((i / pdfJsDoc.numPages) * 75),
          message: `Extracting graphic objects from page ${i} of ${pdfJsDoc.numPages}...`,
        });

        const dataUrl = await renderPageToDataUrl(pdfJsDoc, i, 2.5, 'image/jpeg', 0.95);
        images.push(dataUrl);
      }

      setExtractedImages(images);

      setProcState({
        status: 'success',
        progress: 100,
        message: `Extracted ${images.length} high-resolution graphics!`,
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to extract images from PDF.',
      });
    }
  };

  const downloadAllAsZip = async () => {
    if (extractedImages.length === 0) return;

    const zip = new JSZip();
    const baseName = files[0].name.replace(/\.pdf$/i, '');

    for (let i = 0; i < extractedImages.length; i++) {
      const dataUrl = extractedImages[i];
      const base64Data = dataUrl.split(',')[1];
      const pad = String(i + 1).padStart(3, '0');
      zip.file(`${baseName}_extracted_img_${pad}.jpg`, base64Data, { base64: true });
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${baseName}_extracted_images.zip`);
  };

  const reset = () => {
    setFiles([]);
    setExtractedImages([]);
    setProcState({ status: 'idle', progress: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ToolHeader
        title="Extract Images"
        description="Extract all photos, illustrations, and raster graphics embedded inside your PDF files in their original resolution."
        iconName="DownloadCloud"
        color="from-amber-500 to-orange-600"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar progress={procState.progress} message={procState.message} />
        </div>
      )}

      {procState.status === 'success' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Extracted {extractedImages.length} Images
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Download individually or get all in a clean ZIP package.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={downloadAllAsZip}
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all hover:scale-105"
              >
                <Archive className="w-4 h-4" />
                Download All in ZIP
              </button>
              <button
                onClick={reset}
                className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
              >
                Extract Another
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {extractedImages.map((dataUrl, idx) => (
              <div
                key={idx}
                className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col group hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden mb-2">
                  <img
                    src={dataUrl}
                    alt={`Extracted ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => downloadDataUrl(dataUrl, `extracted_img_${idx + 1}.jpg`)}
                      className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold text-xs flex items-center gap-1 shadow-lg hover:scale-105"
                    >
                      <Download className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 px-1 pt-1">
                  <span className="font-bold">Image #{idx + 1}</span>
                  <button
                    onClick={() => downloadDataUrl(dataUrl, `extracted_img_${idx + 1}.jpg`)}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold hover:bg-amber-100 flex items-center gap-1 transition-colors active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save</span>
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
            title="Select PDF file to extract images"
            subtitle="Extracts all embedded photos, diagrams, and figures in high fidelity."
          />

          {files.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleExtract}
                className="px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-xl shadow-amber-600/30 transition-all hover:scale-102 flex items-center gap-2"
              >
                <DownloadCloud className="w-4 h-4" />
                Extract All Images
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
