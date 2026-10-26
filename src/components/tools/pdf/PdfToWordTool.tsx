import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { convertPdfToDocx } from '@/utils/officeHelper';
import { readFileAsArrayBuffer } from '@/utils/formatters';
import { FileText, Download, CheckCircle } from 'lucide-react';

export const PdfToWordTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [procState, setProcState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
  });

  const handleConvert = async () => {
    if (files.length === 0) return;

    try {
      setProcState({
        status: 'processing',
        progress: 20,
        message: 'Parsing PDF text streams and layouts...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      setProcState({
        status: 'processing',
        progress: 60,
        message: 'Formatting headings, paragraphs, and styles into DOCX...',
      });

      const docxBlob = await convertPdfToDocx(buffer, baseName);
      const url = URL.createObjectURL(docxBlob);

      setProcState({
        status: 'success',
        progress: 100,
        message: 'Successfully converted to editable Word document!',
        resultUrl: url,
        resultFileName: `${baseName}.docx`,
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to convert PDF to Word document.',
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

  const reset = () => {
    setFiles([]);
    setProcState({ status: 'idle', progress: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ToolHeader
        title="PDF to Word"
        description="Convert PDF documents into editable Microsoft Word (.docx) files. Easily edit text, paragraphs, and sections."
        iconName="FileText"
        color="from-blue-600 to-sky-700"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Converting PDF vector text into OpenXML Word format..."
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
              Conversion Complete!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Your editable Microsoft Word document (.docx) is ready.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={downloadResult}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Download Word (.docx)
            </button>
            <button
              onClick={reset}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-all"
            >
              Convert Another PDF
            </button>
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
            title="Select PDF file to convert to Word"
            subtitle="Extracted text and paragraphs will be formatted into a standard .docx document."
          />

          {files.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleConvert}
                className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-102 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Convert to Word (.docx)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
