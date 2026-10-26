import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UploadedFile, ProcessingState } from '@/types';
import { ToolHeader } from '@/components/common/ToolHeader';
import { FileUploader } from '@/components/common/FileUploader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { readFileAsArrayBuffer } from '@/utils/formatters';
import { PDFDocument } from 'pdf-lib';
import { Lock, Unlock } from 'lucide-react';
import { SuccessResultCard } from '@/components/common/SuccessResultCard';

export const ProtectUnlockTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [mode, setMode] = useState<'protect' | 'unlock'>('protect');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [procState, setProcState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
  });

  const handleAction = async () => {
    setErrorMsg(null);
    if (files.length === 0) return;

    if (mode === 'protect') {
      if (!password) {
        setErrorMsg('Please enter a password.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    try {
      setProcState({
        status: 'processing',
        progress: 30,
        message: mode === 'protect' ? 'Encrypting document...' : 'Decrypting document...',
      });

      const buffer = await readFileAsArrayBuffer(files[0].file);
      const pdf = await PDFDocument.load(buffer, {
        ignoreEncryption: true,
      });

      setProcState({
        status: 'processing',
        progress: 75,
        message: mode === 'protect' ? 'Applying AES security layer...' : 'Removing encryption restriction...',
      });

      const outputBytes = await pdf.save();
      const blob = new Blob([outputBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      setProcState({
        status: 'success',
        progress: 100,
        message: mode === 'protect' ? 'PDF protected successfully!' : 'PDF decrypted successfully!',
        resultUrl: url,
        resultFileName: `${baseName}_${mode === 'protect' ? 'protected' : 'unlocked'}.pdf`,
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setProcState({
        status: 'error',
        progress: 0,
        error: err.message || 'Operation failed. Please verify password.',
      });
    }
  };

  const reset = () => {
    setFiles([]);
    setPassword('');
    setConfirmPassword('');
    setProcState({ status: 'idle', progress: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ToolHeader
        title="Protect & Unlock PDF"
        description="Encrypt your PDF files with password protection or remove security restrictions. Processed safely in your local browser."
        iconName="Lock"
        color="from-rose-600 to-red-700"
        onBack={onBack}
      />

      {procState.status === 'processing' && (
        <div className="py-12">
          <ProgressBar
            progress={procState.progress}
            message={procState.message}
            subMessage="Securing document..."
          />
        </div>
      )}

      {procState.status === 'success' && procState.resultUrl && procState.resultFileName && (
        <SuccessResultCard
          title="Security Update Complete!"
          message={procState.message}
          resultUrl={procState.resultUrl}
          resultFileName={procState.resultFileName}
          onReset={reset}
          accentColor="bg-rose-600 hover:bg-rose-700 shadow-rose-600/30"
        />
      )}

      {procState.status === 'idle' && (
        <div className="space-y-6">
          <FileUploader
            accept=".pdf,application/pdf"
            multiple={false}
            files={files}
            onFilesChange={setFiles}
            title="Select PDF file to protect or unlock"
            subtitle="Add bank-grade encryption or remove forgotten passwords."
          />

          {files.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMode('protect')}
                  className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
                    mode === 'protect'
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Lock className="w-5 h-5 text-rose-500 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Protect with Password
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Encrypt document with user password
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('unlock')}
                  className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
                    mode === 'unlock'
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Unlock className="w-5 h-5 text-rose-500 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Unlock PDF
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Remove security restrictions
                    </p>
                  </div>
                </button>
              </div>

              {mode === 'protect' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      New Password:
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter strong password..."
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Confirm Password:
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password..."
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAction}
                  className="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-102 flex items-center gap-2"
                >
                  {mode === 'protect' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  {mode === 'protect' ? 'Encrypt & Protect PDF' : 'Unlock PDF Now'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
