import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { getPdfJsDoc, renderPageToDataUrl, reorderPdf } from '@/utils/pdfHelper';
import { readFileAsArrayBuffer } from '@/utils/formatters';
import { Grid, ArrowLeft, ArrowRight, Trash2, Copy, Save } from 'lucide-react';
import { SuccessResultCard } from '@/components/common/SuccessResultCard';

interface PageItem {
  id: string;
  originalIndex: number;
  thumbnailUrl: string;
}

export const OrganizePdfTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
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
          const pageList: PageItem[] = [];
          for (let i = 1; i <= doc.numPages; i++) {
            const url = await renderPageToDataUrl(doc, i, 0.8, 'image/jpeg', 0.8);
            pageList.push({
              id: Math.random().toString(36).substring(2, 9),
              originalIndex: i - 1,
              thumbnailUrl: url,
            });
          }
          setPages(pageList);
        } catch (e) {
          console.error(e);
        }
      })();
    } else {
      setPages([]);
    }
  }, [files]);

  const moveLeft = (index: number) => {
    if (index === 0) return;
    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[index - 1];
    newPages[index - 1] = temp;
    setPages(newPages);
  };

  const moveRight = (index: number) => {
    if (index === pages.length - 1) return;
    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[index + 1];
    newPages[index + 1] = temp;
    setPages(newPages);
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, idx) => idx !== index);
    setPages(newPages);
  };

  const duplicatePage = (index: number) => {
    const item = pages[index];
    const newPages = [...pages];
    newPages.splice(index + 1, 0, {
      id: Math.random().toString(36).substring(2, 9),
      originalIndex: item.originalIndex,
      thumbnailUrl: item.thumbnailUrl,
    });
    setPages(newPages);
  };

  const handleSave = async () => {
    if (files.length === 0 || pages.length === 0) return;

    try {
      setProcState({
        status: 'processing',
        progress: 30,
        message: 'Reordering pages and creating new PDF structure...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);
      const pageIndices = pages.map((p) => p.originalIndex);

      const reorganizedBytes = await reorderPdf(buffer, pageIndices);

      const blob = new Blob([reorganizedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      setProcState({
        status: 'success',
        progress: 100,
        message: 'PDF successfully organized!',
        resultUrl: url,
        resultFileName: `${baseName}_organized.pdf`,
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to reorganize PDF.',
      });
    }
  };

  const reset = () => {
    setFiles([]);
    setPages([]);
    setProcState({ status: 'idle', progress: 0 });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <ToolHeader
        title="Organize PDF"
        description="Sort, reorder, delete, and duplicate pages visually. Click and move pages to get the exact layout you need."
        iconName="Grid"
        color="from-blue-500 to-cyan-600"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Rearranging page trees and references..."
          />
        </div>
      )}

      {procState.status === 'success' && procState.resultUrl && procState.resultFileName && (
        <SuccessResultCard
          title="Organized PDF Ready!"
          message={`Your document now contains ${pages.length} pages in your chosen order.`}
          resultUrl={procState.resultUrl}
          resultFileName={procState.resultFileName}
          onReset={reset}
          accentColor="bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
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
              title="Select PDF file to organize"
              subtitle="Drag & drop pages, delete blank sheets, or clone pages."
            />
          ) : (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {pages.length} Pages (Drag/reorder using arrows)
                </span>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all hover:scale-105"
                >
                  <Save className="w-3.5 h-3.5" /> Save New PDF
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {pages.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col group hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-[3/4] bg-white dark:bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-2 mb-2 border border-slate-200 dark:border-slate-700">
                      <img
                        src={item.thumbnailUrl}
                        alt={`Page ${idx + 1}`}
                        className="max-w-full max-h-full object-contain"
                      />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/70 text-white text-[10px] font-bold">
                        #{idx + 1}
                      </span>
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[9px] text-slate-600 dark:text-slate-400">
                        Orig: #{item.originalIndex + 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveLeft(idx)}
                          title="Move Left"
                          className="p-1 rounded bg-white dark:bg-slate-800 disabled:opacity-20 text-slate-600 dark:text-slate-300"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === pages.length - 1}
                          onClick={() => moveRight(idx)}
                          title="Move Right"
                          className="p-1 rounded bg-white dark:bg-slate-800 disabled:opacity-20 text-slate-600 dark:text-slate-300"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => duplicatePage(idx)}
                          title="Duplicate Page"
                          className="p-1 rounded bg-white dark:bg-slate-800 text-blue-600"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={pages.length <= 1}
                          onClick={() => deletePage(idx)}
                          title="Delete Page"
                          className="p-1 rounded bg-white dark:bg-slate-800 text-red-500 disabled:opacity-20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
