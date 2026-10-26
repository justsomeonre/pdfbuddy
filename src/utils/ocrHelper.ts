import { createWorker } from 'tesseract.js';

export interface OcrProgressUpdate {
  status: string;
  progress: number;
}

/**
 * Run OCR on an image data URL or Canvas element using client-side Tesseract.js WebAssembly
 */
export async function performOcr(
  imageSource: string | HTMLCanvasElement,
  language: string = 'eng',
  onProgress?: (info: OcrProgressUpdate) => void
): Promise<{ text: string; confidence: number; words: { text: string; bbox: any }[] }> {
  const worker = await createWorker(language, 1, {
    logger: (m) => {
      if (onProgress && m.status && typeof m.progress === 'number') {
        onProgress({
          status: m.status,
          progress: Math.round(m.progress * 100),
        });
      }
    },
  });

  try {
    const ret: any = await worker.recognize(imageSource);
    await worker.terminate();

    return {
      text: ret.data.text || '',
      confidence: ret.data.confidence || 0,
      words: (ret.data.words || []).map((w: any) => ({
        text: w.text,
        bbox: w.bbox,
      })),
    };
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}
