export type ToolCategory = 
  | 'all'
  | 'organize'
  | 'convert'
  | 'security'
  | 'edit'
  | 'creative';

export interface ToolDefinition {
  id: string;
  title: string;
  shortDesc: string;
  iconName: string;
  category: ToolCategory;
  badge?: string;
  color: string;
  keywords: string[];
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  pageCount?: number;
}

export interface PdfPagePreview {
  pageNumber: number;
  thumbnailUrl: string;
  width: number;
  height: number;
  rotation: number;
  deleted?: boolean;
}

export interface ProcessingState {
  status: 'idle' | 'loading' | 'processing' | 'success' | 'error';
  progress: number;
  message?: string;
  resultUrl?: string;
  resultFileName?: string;
  error?: string;
}
