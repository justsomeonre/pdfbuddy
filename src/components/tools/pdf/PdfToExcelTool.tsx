import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { convertPdfToExcel } from '@/utils/officeHelper';
import { readFileAsArrayBuffer } from '@/utils/formatters';
import { Table, Download, CheckCircle } from 'lucide-react';

export const PdfToExcelTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [procState, setProcState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
  });

  const handleConvert = async () => {
    if (files.length === 0) return;

    try {
      setProcState({
        status: 'processing',
        progress: 25,
        message: 'Parsing PDF tables, columns, and data cells...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      setProcState({
        status: 'processing',
        progress: 65,
        message: `Building ${format.toUpperCase()} spreadsheet workbook...`,
      });

      const blob = await convertPdfToExcel(buffer, format);
      const url = URL.createObjectURL(blob);

      setProcState({
        status: 'success',
        progress: 100,
        message: `Extracted table data to ${format.toUpperCase()}!`,
        resultUrl: url,
        resultFileName: `${baseName}.${format}`,
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Failed to extract data into spreadsheet.',
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
        title="PDF to Excel / CSV"
        description="Extract tables, financial sheets, invoices, and structured tabular data into clean Excel (.xlsx) or CSV spreadsheets."
        iconName="Table"
        color="from-emerald-600 to-green-700"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Extracting tabular rows and building OpenXML spreadsheet..."
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
              Spreadsheet Ready!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Your tables have been converted to {format.toUpperCase()}.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={downloadResult}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Download {format.toUpperCase()}
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
            title="Select PDF file containing tables"
            subtitle="Converts statement tables, forms, and lists into rows and columns."
          />

          {files.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Output Format:
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-xs">
                  <button
                    type="button"
                    onClick={() => setFormat('xlsx')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      format === 'xlsx'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('csv')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      format === 'csv'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    CSV (.csv)
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleConvert}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all hover:scale-102 flex items-center gap-2"
                >
                  <Table className="w-4 h-4" />
                  Extract to {format.toUpperCase()}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
