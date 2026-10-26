import saveAs from 'file-saver';

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Foolproof cross-platform file downloader.
 * Supports desktop browsers, iOS Safari, Android Chrome, and PWA environments.
 */
export function triggerFileDownload(blobOrUrl: Blob | string, filename: string): void {
  let target: Blob | string = blobOrUrl;

  // If it's a data URL, convert to real Blob for reliable mobile downloading
  if (typeof blobOrUrl === 'string' && blobOrUrl.startsWith('data:')) {
    try {
      const arr = blobOrUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      target = new Blob([u8arr], { type: mime });
    } catch (e) {
      console.warn('Could not convert dataUrl to Blob, falling back to string URL', e);
      target = blobOrUrl;
    }
  }

  // 1. Try file-saver (engineered specifically for cross-browser file downloads)
  try {
    saveAs(target, filename);
    return;
  } catch (err) {
    console.warn('saveAs failed, falling back to manual anchor download', err);
  }

  // 2. Direct Anchor Click Fallback attached to DOM
  const url = typeof target === 'string' ? target : URL.createObjectURL(target);
  const a = document.createElement('a');
  a.style.position = 'fixed';
  a.style.left = '-9999px';
  a.style.top = '-9999px';
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);

  try {
    const clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    a.dispatchEvent(clickEvt);
  } catch (e) {
    a.click();
  }

  setTimeout(() => {
    if (a.parentNode) {
      a.parentNode.removeChild(a);
    }
    if (typeof target !== 'string') {
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  }, 1000);
}

/**
 * Open a Blob or DataURL in a new browser tab (vital for mobile users who want to view or use native share sheet)
 */
export function openInNewTab(blobOrUrl: Blob | string): void {
  let url: string;
  if (typeof blobOrUrl === 'string') {
    url = blobOrUrl;
  } else {
    url = URL.createObjectURL(blobOrUrl);
  }
  const win = window.open(url, '_blank');
  if (!win) {
    // Popup was blocked, direct navigate fallback
    window.location.href = url;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  triggerFileDownload(blob, filename);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  triggerFileDownload(dataUrl, filename);
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
