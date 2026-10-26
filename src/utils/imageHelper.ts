/**
 * Load an image from a URL or data URL into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Remove background (white/light or custom color) from an image canvas
 */
export function removeBackground(
  canvas: HTMLCanvasElement,
  options: {
    targetColor?: { r: number; g: number; b: number };
    tolerance?: number; // 0 to 100
  } = {}
): HTMLCanvasElement {
  const { targetColor = { r: 255, g: 255, b: 255 }, tolerance = 25 } = options;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const maxDist = (tolerance / 100) * 441.67; // max Euclidean distance in RGB

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue;

    // Euclidean distance to target color
    const dist = Math.sqrt(
      Math.pow(r - targetColor.r, 2) +
      Math.pow(g - targetColor.g, 2) +
      Math.pow(b - targetColor.b, 2)
    );

    if (dist <= maxDist) {
      // Soft feathering near the threshold boundary
      if (dist < maxDist * 0.75) {
        data[i + 3] = 0;
      } else {
        const factor = (dist - maxDist * 0.75) / (maxDist * 0.25);
        data[i + 3] = Math.round(a * factor);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Generate a die-cut sticker effect with a thick white contour outline and optional drop shadow
 */
export function applyStickerOutline(
  sourceCanvas: HTMLCanvasElement,
  options: {
    outlineWidth?: number; // pixels (e.g. 10 to 30)
    outlineColor?: string; // default white '#ffffff'
    shadow?: boolean;
    shadowBlur?: number;
    shadowColor?: string;
    padding?: number;
  } = {}
): HTMLCanvasElement {
  const {
    outlineWidth = 14,
    outlineColor = '#ffffff',
    shadow = true,
    shadowBlur = 12,
    shadowColor = 'rgba(0, 0, 0, 0.25)',
    padding = outlineWidth + 20,
  } = options;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = sourceCanvas.width + padding * 2;
  outCanvas.height = sourceCanvas.height + padding * 2;
  const ctx = outCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  const offsetX = padding;
  const offsetY = padding;

  // 1. Draw drop shadow if enabled
  if (shadow) {
    ctx.save();
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 6;

    // Draw outline silhouette for shadow
    const steps = 36;
    for (let i = 0; i < steps; i++) {
      const angle = (i * 2 * Math.PI) / steps;
      const x = offsetX + Math.cos(angle) * outlineWidth;
      const y = offsetY + Math.sin(angle) * outlineWidth;
      ctx.drawImage(sourceCanvas, x, y);
    }
    ctx.restore();
  }

  // 2. Draw thick white contour outline by stamping the source image in a circle
  ctx.save();
  const dSteps = 48;
  for (let radius = 1; radius <= outlineWidth; radius += 2) {
    for (let i = 0; i < dSteps; i++) {
      const angle = (i * 2 * Math.PI) / dSteps;
      const x = offsetX + Math.cos(angle) * radius;
      const y = offsetY + Math.sin(angle) * radius;
      ctx.drawImage(sourceCanvas, x, y);
    }
  }

  // Tint the stamp region to the outline color
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = outlineColor;
  ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
  ctx.restore();

  // 3. Draw the original crisp image centered on top
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(sourceCanvas, offsetX, offsetY);
  ctx.restore();

  return outCanvas;
}
