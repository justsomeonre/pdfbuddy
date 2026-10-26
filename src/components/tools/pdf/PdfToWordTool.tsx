import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { convertPdfToDocx } from '@/utils/officeHelper';
import { readFileAsArrayBuffer } from '@/utils/formatters';
import { FileText } from 'lucide-react';
import { SuccessResultCard } from '@/components/common/SuccessResultCard';

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

      {procState.status === 'success' && procState.resultUrl && procState.resultFileName && (
        <SuccessResultCard
          title="Conversion Complete!"
          message="Your editable Microsoft Word document (.docx) is ready."
          resultUrl={procState.resultUrl}
          resultFileName={procState.resultFileName}
          onReset={reset}
          accentColor="bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
        />
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
