import React, { useRef, useState } from 'react';
import { UploadCloud, File, Trash2, Plus, AlertCircle, FileCheck } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';
import { UploadedFile } from '../../types';

interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  title?: string;
  subtitle?: string;
  maxFiles?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  accept = '.pdf,application/pdf',
  multiple = true,
  files,
  onFilesChange,
  title = 'Select or drop your PDF files here',
  subtitle = 'No file size limit. Your files are processed entirely in your browser.',
  maxFiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processIncomingFiles = (incomingList: FileList | File[]) => {
    setErrorMessage(null);
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < incomingList.length; i++) {
      const file = incomingList[i];
      
      // Simple validation if accept is specified
      if (accept && accept !== '*') {
        const acceptList = accept.split(',').map((s) => s.trim().toLowerCase());
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        const matchesType = acceptList.some(
          (acc) =>
            acc === ext ||
            (acc.endsWith('/*') && file.type.startsWith(acc.replace('/*', ''))) ||
            acc === file.type
        );
        if (!matchesType && !acceptList.includes('*')) {
          setErrorMessage(`File "${file.name}" has an unsupported format.`);
          continue;
        }
      }

      newFiles.push({
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      });
    }

    if (newFiles.length === 0) return;

    if (!multiple) {
      onFilesChange([newFiles[0]]);
    } else {
      let combined = [...files, ...newFiles];
      if (maxFiles && combined.length > maxFiles) {
        combined = combined.slice(0, maxFiles);
        setErrorMessage(`Only up to ${maxFiles} files can be uploaded for this tool.`);
      }
      onFilesChange(combined);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processIncomingFiles(e.target.files);
    }
    // reset input so the same file can be re-uploaded if desired
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    onFilesChange([]);
  };

  return (
    <div className="w-full">
      {/* Drag & Drop Zone */}
      {files.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-10 md:p-14 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/20 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 hover:border-rose-400 dark:hover:border-rose-500 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-tr from-rose-500/10 via-pink-500/10 to-indigo-500/10 flex items-center justify-center text-rose-500">
            <UploadCloud className="w-10 h-10 animate-subtle" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            {subtitle}
          </p>

          <button
            type="button"
            className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-sm shadow-lg shadow-rose-600/25 transition-all"
          >
            Choose Files
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Selected Files ({files.length})
            </span>
            <div className="flex items-center gap-2">
              {multiple && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add More Files
                </button>
              )}
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Files List / Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map((fileObj, idx) => (
              <div
                key={fileObj.id}
                className="relative flex items-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group"
              >
                {fileObj.previewUrl ? (
                  <img
                    src={fileObj.previewUrl}
                    alt={fileObj.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0">
                    <File className="w-6 h-6" />
                  </div>
                )}

                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {fileObj.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400 font-mono">
                      {formatBytes(fileObj.size)}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <FileCheck className="w-3 h-3" /> Ready
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(fileObj.id)}
                  title="Remove file"
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-80 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
