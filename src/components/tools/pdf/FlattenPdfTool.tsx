import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { readFileAsArrayBuffer } from '@/utils/formatters';
import { PDFDocument } from 'pdf-lib';
import { Layers2 } from 'lucide-react';
import { SuccessResultCard } from '@/components/common/SuccessResultCard';

export const FlattenPdfTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [procState, setProcState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
  });

  const handleFlatten = async () => {
    if (files.length === 0) return;

    try {
      setProcState({
        status: 'processing',
        progress: 25,
        message: 'Reading PDF form fields and annotation dictionary...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

      setProcState({
        status: 'processing',
        progress: 60,
        message: 'Locking all interactive form fields into static vector page content...',
      });

      const form = pdf.getForm();
      if (form) {
        form.flatten();
      }

      const flattenedBytes = await pdf.save();
      const blob = new Blob([flattenedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      setProcState({
        status: 'success',
        progress: 100,
        message: 'PDF successfully flattened!',
        resultUrl: url,
        resultFileName: `${baseName}_flattened.pdf`,
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to flatten PDF forms.',
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
        title="Flatten PDF"
        description="Merge interactive form fields, checkboxes, digital signatures, and comments into permanent static page graphics so they can never be altered."
        iconName="Layers2"
        color="from-teal-600 to-cyan-700"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar progress={procState.progress} message={procState.message} />
        </div>
      )}

      {procState.status === 'success' && procState.resultUrl && procState.resultFileName && (
        <SuccessResultCard
          title="PDF Flattened!"
          message="All form fields and layers have been solidified into permanent uneditable content."
          resultUrl={procState.resultUrl}
          resultFileName={procState.resultFileName}
          onReset={reset}
          accentColor="bg-teal-600 hover:bg-teal-700 shadow-teal-600/30"
        />
      )}

      {procState.status === 'idle' && (
        <div className="space-y-6">
          <FileUploader
            accept=".pdf,application/pdf"
            multiple={false}
            files={files}
            onFilesChange={setFiles}
            title="Select PDF form to flatten"
            subtitle="Solidifies fillable PDF forms into non-editable documents."
          />

          {files.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleFlatten}
                className="px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-xl shadow-teal-600/30 transition-all hover:scale-102 flex items-center gap-2"
              >
                <Layers2 className="w-4 h-4" />
                Flatten PDF Forms Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
