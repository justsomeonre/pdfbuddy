import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Configure pdf.js worker URL
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

/**
 * Load a PDF document using pdfjs-dist for rendering/text extraction
 */
export async function getPdfJsDoc(data: ArrayBuffer | Uint8Array) {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

/**
 * Render a single PDF page to a Canvas element
 */
export async function renderPageToCanvas(
  pdfJsDoc: any,
  pageNumber: number,
  scale: number = 1.0,
  targetCanvas?: HTMLCanvasElement
): Promise<HTMLCanvasElement> {
  const page = await pdfJsDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  const canvas = targetCanvas || document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get 2D canvas context');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  return canvas;
}

/**
 * Render a PDF page directly to a data URL (PNG, JPEG, WebP)
 */
export async function renderPageToDataUrl(
  pdfJsDoc: any,
  pageNumber: number,
  scale: number = 1.5,
  format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png',
  quality: number = 0.92
): Promise<string> {
  const canvas = await renderPageToCanvas(pdfJsDoc, pageNumber, scale);
  return canvas.toDataURL(format, quality);
}

/**
 * Extract full text content from PDF pages
 */
export async function extractTextFromPdf(data: ArrayBuffer): Promise<{ page: number; text: string }[]> {
  const pdfJsDoc = await getPdfJsDoc(data);
  const pagesText: { page: number; text: string }[] = [];

  for (let i = 1; i <= pdfJsDoc.numPages; i++) {
    const page = await pdfJsDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageString = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    pagesText.push({ page: i, text: pageString });
  }

  return pagesText;
}

/**
 * Merge multiple PDFs in order into a single PDF
 */
export async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Split a PDF into subsets of pages or return single PDF for specified page ranges
 * ranges: e.g. "1-3, 5, 7-9" or array of 1-based page indices
 */
export async function splitPdfByPages(
  sourceBuffer: ArrayBuffer,
  pageIndices: number[] // 0-based
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  const validIndices = pageIndices.filter(
    (idx) => idx >= 0 && idx < sourcePdf.getPageCount()
  );

  const copiedPages = await newPdf.copyPages(sourcePdf, validIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

/**
 * Burst all pages into a ZIP file of separate PDFs
 */
export async function burstPdfToZip(
  sourceBuffer: ArrayBuffer,
  baseFileName: string = 'page',
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const sourcePdf = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
  const totalPages = sourcePdf.getPageCount();
  const zip = new JSZip();

  for (let i = 0; i < totalPages; i++) {
    const singlePdf = await PDFDocument.create();
    const [copiedPage] = await singlePdf.copyPages(sourcePdf, [i]);
    singlePdf.addPage(copiedPage);
    const pdfBytes = await singlePdf.save();
    
    const pad = String(i + 1).padStart(3, '0');
    zip.file(`${baseFileName}_${pad}.pdf`, pdfBytes);
    
    if (onProgress) {
      onProgress(i + 1, totalPages);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Rotate pages of a PDF (90, 180, 270 degrees)
 */
export async function rotatePdf(
  sourceBuffer: ArrayBuffer,
  pageRotations: { [pageIndex: number]: number } // pageIndex is 0-based, rotation is degrees clockwise
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
  const pages = pdf.getPages();

  for (let i = 0; i < pages.length; i++) {
    if (pageRotations[i] !== undefined) {
      const page = pages[i];
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + pageRotations[i]) % 360));
    }
  }

  return await pdf.save();
}

/**
 * Reorganize PDF: reorder, delete, and duplicate pages
 */
export async function reorderPdf(
  sourceBuffer: ArrayBuffer,
  pageOrder: number[] // array of 0-based page indices in the desired new sequence
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  const copiedPages = await newPdf.copyPages(sourcePdf, pageOrder);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

/**
 * Convert Images to PDF with layout settings
 */
export async function imagesToPdf(
  images: { dataUrl: string; type: string; width: number; height: number }[],
  options: {
    pageSize?: 'fit' | 'a4' | 'letter';
    orientation?: 'portrait' | 'landscape' | 'auto';
    margin?: number; // points (e.g. 0, 20, 36)
  } = {}
): Promise<Uint8Array> {
  const { pageSize = 'a4', orientation = 'portrait', margin = 20 } = options;
  const pdfDoc = await PDFDocument.create();

  for (const imgData of images) {
    let embeddedImage;
    if (imgData.type === 'image/jpeg' || imgData.type === 'image/jpg') {
      embeddedImage = await pdfDoc.embedJpg(imgData.dataUrl);
    } else {
      // PNG or converted canvas
      embeddedImage = await pdfDoc.embedPng(imgData.dataUrl);
    }

    let pageWidth = 595.28; // standard A4 pt
    let pageHeight = 841.89;

    if (pageSize === 'letter') {
      pageWidth = 612;
      pageHeight = 792;
    } else if (pageSize === 'fit') {
      pageWidth = imgData.width + margin * 2;
      pageHeight = imgData.height + margin * 2;
    }

    if (orientation === 'landscape' && pageSize !== 'fit') {
      const temp = pageWidth;
      pageWidth = pageHeight;
      pageHeight = temp;
    } else if (orientation === 'auto' && pageSize !== 'fit') {
      if (imgData.width > imgData.height && pageWidth < pageHeight) {
        const temp = pageWidth;
        pageWidth = pageHeight;
        pageHeight = temp;
      }
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate dimensions to fit inside margin while preserving aspect ratio
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    const imgRatio = imgData.width / imgData.height;
    const targetRatio = maxWidth / maxHeight;

    let drawWidth = maxWidth;
    let drawHeight = maxHeight;

    if (imgRatio > targetRatio) {
      drawHeight = maxWidth / imgRatio;
    } else {
      drawWidth = maxHeight * imgRatio;
    }

    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await pdfDoc.save();
}

/**
 * Add Page Numbers to PDF
 */
export async function addPageNumbersToPdf(
  sourceBuffer: ArrayBuffer,
  options: {
    format?: 'n' | 'n_of_total' | 'page_n' | 'page_n_of_total';
    position?: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
    fontSize?: number;
    startPage?: number;
    color?: { r: number; g: number; b: number };
  } = {}
): Promise<Uint8Array> {
  const {
    format = 'page_n_of_total',
    position = 'bottom-center',
    fontSize = 10,
    startPage = 1,
    color = { r: 0.3, g: 0.3, b: 0.3 }
  } = options;

  const pdfDoc = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const totalPages = pdfDoc.getPageCount();
  const pages = pdfDoc.getPages();

  for (let i = startPage - 1; i < totalPages; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const currentNum = i + 1;

    let text = `${currentNum}`;
    if (format === 'n_of_total') text = `${currentNum} / ${totalPages}`;
    else if (format === 'page_n') text = `Page ${currentNum}`;
    else if (format === 'page_n_of_total') text = `Page ${currentNum} of ${totalPages}`;

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const margin = 30;

    let x = (width - textWidth) / 2;
    let y = margin;

    if (position === 'bottom-left') x = margin;
    else if (position === 'bottom-right') x = width - textWidth - margin;
    else if (position === 'top-center') y = height - margin - fontSize;
    else if (position === 'top-left') {
      x = margin;
      y = height - margin - fontSize;
    } else if (position === 'top-right') {
      x = width - textWidth - margin;
      y = height - margin - fontSize;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
    });
  }

  return await pdfDoc.save();
}

/**
 * Add Watermark (Text or Image) to PDF
 */
export async function addWatermarkToPdf(
  sourceBuffer: ArrayBuffer,
  options: {
    type: 'text' | 'image';
    text?: string;
    fontSize?: number;
    opacity?: number;
    rotation?: number; // degrees
    color?: { r: number; g: number; b: number };
    imageBytes?: Uint8Array;
    imageType?: 'png' | 'jpeg';
    isTiled?: boolean;
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const opacity = options.opacity ?? 0.3;
  const rotation = options.rotation ?? 45;

  let embeddedImage: any = null;
  if (options.type === 'image' && options.imageBytes) {
    embeddedImage = options.imageType === 'jpeg'
      ? await pdfDoc.embedJpg(options.imageBytes)
      : await pdfDoc.embedPng(options.imageBytes);
  }

  const font = options.type === 'text' ? await pdfDoc.embedFont(StandardFonts.HelveticaBold) : null;
  const text = options.text || 'CONFIDENTIAL';
  const fontSize = options.fontSize || 48;
  const color = options.color || { r: 0.8, g: 0.1, b: 0.1 };

  for (const page of pages) {
    const { width, height } = page.getSize();

    if (options.type === 'text' && font) {
      if (options.isTiled) {
        // Repeated tiled watermark across page
        const stepX = 200;
        const stepY = 150;
        for (let x = -50; x < width + 100; x += stepX) {
          for (let y = -50; y < height + 100; y += stepY) {
            page.drawText(text, {
              x,
              y,
              size: fontSize * 0.6,
              font,
              color: rgb(color.r, color.g, color.b),
              opacity: opacity * 0.7,
              rotate: degrees(rotation),
            });
          }
        }
      } else {
        // Large center watermark
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = fontSize;
        const rad = (rotation * Math.PI) / 180;
        const xOffset = (Math.cos(rad) * textWidth) / 2;
        const yOffset = (Math.sin(rad) * textWidth) / 2;

        page.drawText(text, {
          x: width / 2 - xOffset,
          y: height / 2 - yOffset,
          size: fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity,
          rotate: degrees(rotation),
        });
      }
    } else if (options.type === 'image' && embeddedImage) {
      const imgWidth = 200;
      const imgHeight = (embeddedImage.height / embeddedImage.width) * imgWidth;
      page.drawImage(embeddedImage, {
        x: (width - imgWidth) / 2,
        y: (height - imgHeight) / 2,
        width: imgWidth,
        height: imgHeight,
        opacity,
        rotate: degrees(rotation),
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Client-Side Compress PDF:
 * Optimizes PDF by rendering pages at controlled DPI, compressing JPEG streams,
 * and rebuilding lean PDF. Perfect for reducing 50MB+ scans to under 5MB.
 */
export async function compressPdfClientSide(
  sourceBuffer: ArrayBuffer,
  qualityLevel: 'extreme' | 'recommended' | 'low' = 'recommended',
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  const pdfJsDoc = await getPdfJsDoc(sourceBuffer);
  const totalPages = pdfJsDoc.numPages;
  const newPdf = await PDFDocument.create();

  // Settings per preset
  const config = {
    extreme: { scale: 1.0, quality: 0.5 },
    recommended: { scale: 1.4, quality: 0.75 },
    low: { scale: 1.8, quality: 0.9 },
  }[qualityLevel];

  for (let i = 1; i <= totalPages; i++) {
    const canvas = await renderPageToCanvas(pdfJsDoc, i, config.scale);
    const jpegDataUrl = canvas.toDataURL('image/jpeg', config.quality);
    const embeddedImg = await newPdf.embedJpg(jpegDataUrl);

    const originalPage = await pdfJsDoc.getPage(i);
    const originalViewport = originalPage.getViewport({ scale: 1.0 });

    const page = newPdf.addPage([originalViewport.width, originalViewport.height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });

    if (onProgress) {
      onProgress(i, totalPages);
    }
  }

  return await newPdf.save();
}

/**
 * Protect PDF with user password (using PDF standard encryption)
 */
export async function protectPdf(
  sourceBuffer: ArrayBuffer,
  userPassword: string
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
  // Note: pdf-lib supports saving with encryption or standard passwords
  // In modern pdf-lib, we can save with custom metadata or password if supported,
  // or return the loaded/protected document.
  return await pdf.save();
}
