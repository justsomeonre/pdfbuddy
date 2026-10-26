import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { loadImage } from './imageHelper';

export interface GifFrameOptions {
  delay?: number; // milliseconds per frame (e.g. 200ms = 5fps)
  repeat?: number; // 0 for infinite loop, -1 for no loop
}

/**
 * Generate animated GIF from array of image elements or canvas elements using gifenc
 */
export async function createGifFromCanvases(
  canvases: HTMLCanvasElement[],
  options: {
    delayMs?: number;
    repeat?: number;
    width?: number;
    height?: number;
    onProgress?: (frame: number, total: number) => void;
  } = {}
): Promise<Blob> {
  if (canvases.length === 0) throw new Error('No frames provided for GIF');

  const targetWidth = options.width || canvases[0].width;
  const targetHeight = options.height || canvases[0].height;
  const delayMs = options.delayMs || 200;
  const repeat = options.repeat ?? 0;

  const gif = GIFEncoder();

  // Resize canvas helper
  const renderCanvas = document.createElement('canvas');
  renderCanvas.width = targetWidth;
  renderCanvas.height = targetHeight;
  const renderCtx = renderCanvas.getContext('2d', { willReadFrequently: true })!;

  for (let i = 0; i < canvases.length; i++) {
    renderCtx.clearRect(0, 0, targetWidth, targetHeight);
    renderCtx.drawImage(canvases[i], 0, 0, targetWidth, targetHeight);

    const imgData = renderCtx.getImageData(0, 0, targetWidth, targetHeight);
    const palette = quantize(imgData.data, 256);
    const index = applyPalette(imgData.data, palette);

    gif.writeFrame(index, targetWidth, targetHeight, {
      palette,
      delay: delayMs,
      repeat: i === 0 ? repeat : undefined,
    });

    if (options.onProgress) {
      options.onProgress(i + 1, canvases.length);
    }
  }

  gif.finish();
  const bytes = gif.bytes();
  return new Blob([bytes], { type: 'image/gif' });
}

/**
 * Convert an array of image data URLs into an animated GIF
 */
export async function createGifFromImageUrls(
  imageUrls: string[],
  options: {
    delayMs?: number;
    width?: number;
    height?: number;
    onProgress?: (frame: number, total: number) => void;
  } = {}
): Promise<Blob> {
  const canvases: HTMLCanvasElement[] = [];

  for (const url of imageUrls) {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    canvases.push(canvas);
  }

  return await createGifFromCanvases(canvases, options);
}

/**
 * Convert a Video file to an animated GIF by capturing canvas frames
 */
export async function convertVideoToGif(
  videoFile: File,
  options: {
    fps?: number; // e.g. 10 fps
    maxDurationSec?: number; // max seconds
    maxWidth?: number;
    onProgress?: (percent: number) => void;
  } = {}
): Promise<Blob> {
  const { fps = 10, maxDurationSec = 8, maxWidth = 480 } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.crossOrigin = 'anonymous';

    video.onloadedmetadata = async () => {
      try {
        const duration = Math.min(video.duration, maxDurationSec);
        const aspect = video.videoHeight / video.videoWidth;
        const width = Math.min(video.videoWidth, maxWidth);
        const height = Math.round(width * aspect);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

        const frames: HTMLCanvasElement[] = [];
        const interval = 1 / fps;
        const totalFrames = Math.floor(duration * fps);

        for (let t = 0; t < duration; t += interval) {
          video.currentTime = t;
          await new Promise((r) => {
            video.onseeked = r;
          });

          const frameCanvas = document.createElement('canvas');
          frameCanvas.width = width;
          frameCanvas.height = height;
          const frameCtx = frameCanvas.getContext('2d')!;
          frameCtx.drawImage(video, 0, 0, width, height);
          frames.push(frameCanvas);

          if (options.onProgress) {
            options.onProgress(Math.round((frames.length / totalFrames) * 50));
          }
        }

        URL.revokeObjectURL(video.src);

        const gifBlob = await createGifFromCanvases(frames, {
          delayMs: Math.round(1000 / fps),
          width,
          height,
          onProgress: (cur, tot) => {
            if (options.onProgress) {
              options.onProgress(50 + Math.round((cur / tot) * 50));
            }
          },
        });

        resolve(gifBlob);
      } catch (err) {
        reject(err);
      }
    };

    video.onerror = (e) => reject(new Error('Failed to load video file'));
  });
}
