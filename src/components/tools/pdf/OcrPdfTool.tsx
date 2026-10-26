import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { getPdfJsDoc, renderPageToCanvas } from '@/utils/pdfHelper';
import { performOcr } from '@/utils/ocrHelper';
import { readFileAsArrayBuffer, downloadBlob } from '@/utils/formatters';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import { ScanText, Download, Copy, Check, FileText, Globe } from 'lucide-react';

export const OcrPdfTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [language, setLanguage] = useState<string>('eng');
  const [extractedText, setExtractedText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [procState, setProcState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
  });

  const languages = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'hin', name: 'Hindi' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'jpn', name: 'Japanese' },
  ];

  const handleOcr = async () => {
    if (files.length === 0) return;

    try {
      setExtractedText('');
      setProcState({
        status: 'processing',
        progress: 10,
        message: 'Initializing Tesseract OCR engine in browser...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);
      const pdfJsDoc = await getPdfJsDoc(buffer);
      const totalPages = pdfJsDoc.numPages;

      let fullDocText = '';

      for (let i = 1; i <= totalPages; i++) {
        setProcState({
          status: 'processing',
          progress: 10 + Math.round(((i - 1) / totalPages) * 80),
          message: `Rendering page ${i} of ${totalPages} for OCR...`,
        });

        const canvas = await renderPageToCanvas(pdfJsDoc, i, 2.0);

        setProcState({
          status: 'processing',
          progress: 15 + Math.round(((i - 0.5) / totalPages) * 80),
          message: `Scanning text on page ${i} of ${totalPages} (${language})...`,
        });

        const result = await performOcr(canvas, language);
        fullDocText += `=== Page ${i} ===\n\n${result.text.trim()}\n\n`;
      }

      setExtractedText(fullDocText);
      setProcState({
        status: 'success',
        progress: 100,
        message: `OCR complete! Extracted text from ${totalPages} pages.`,
      });

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'OCR extraction failed. Check language and file.',
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const baseName = files[0]?.name.replace(/\.pdf$/i, '') || 'ocr_extracted';
    downloadBlob(blob, `${baseName}_ocr.txt`);
  };

  const downloadWordDoc = async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: 'OCR Extracted Document',
              heading: HeadingLevel.TITLE,
              spacing: { after: 300 },
            }),
            ...extractedText.split('\n\n').map(
              (p) =>
                new Paragraph({
                  children: [new TextRun(p)],
                  spacing: { after: 120 },
                })
            ),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const baseName = files[0]?.name.replace(/\.pdf$/i, '') || 'ocr_extracted';
    downloadBlob(blob, `${baseName}_ocr.docx`);
  };

  const reset = () => {
    setFiles([]);
    setExtractedText('');
    setProcState({ status: 'idle', progress: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ToolHeader
        title="PDF to OCR (Optical Character Recognition)"
        description="Convert scanned PDFs, documents, or photos into selectable, editable text. Powered by client-side WebAssembly OCR."
        iconName="ScanText"
        badge="Zero Limits"
        color="from-teal-500 to-emerald-600"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Running neural network optical character recognition inside your browser..."
          />
        </div>
      )}

      {procState.status === 'success' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                OCR Text Extracted!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You can copy the extracted text or download it as TXT or Word (.docx).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
              <button
                onClick={downloadTxt}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" /> TXT
              </button>
              <button
                onClick={downloadWordDoc}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/30 transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" /> Word (.docx)
              </button>
              <button
                onClick={reset}
                className="px-3 py-2.5 text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Scan Another
              </button>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
            <textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              rows={16}
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Extracted text will appear here..."
            />
          </div>
        </div>
      )}

      {procState.status === 'idle' && (
        <div className="space-y-6">
          <FileUploader
            accept=".pdf,application/pdf,image/*"
            multiple={false}
            files={files}
            onFilesChange={setFiles}
            title="Select scanned PDF or Image for OCR"
            subtitle="Tesseract.js extracts all text without sending documents over the web."
          />

          {files.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Select Document Language:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLanguage(l.code)}
                      className={`p-3 rounded-xl text-xs font-bold text-left transition-all flex items-center gap-2 ${
                        language === l.code
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 opacity-70" />
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleOcr}
                  className="px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-xl shadow-teal-600/30 transition-all hover:scale-102 flex items-center gap-2"
                >
                  <ScanText className="w-4 h-4" />
                  Start OCR Recognition
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
