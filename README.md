# PDFBuddy 🚀

> **The 100% Free, Zero-Limit, Client-Side Document & Creative Media Suite.**  
> *Better than iLovePDF, forever free without limits, completely private.*

---

## ✨ Why PDFBuddy is Better than iLovePDF

| Feature | iLovePDF / Smallpdf | **PDFBuddy** |
| :--- | :--- | :--- |
| **Price** | Paid subscriptions ($48–$84/yr) | **100% Free Forever** |
| **File Size Limit** | Strict 15MB cap on free tier | **Zero Limits (50MB, 200MB, 1GB+)** |
| **Privacy & Security** | Files uploaded to third-party servers | **100% Private (Runs locally in your browser)** |
| **Daily Quotas** | Strict hourly & daily task limits | **Unlimited Tasks & Unlimited Conversions** |
| **Offline Support** | Requires continuous internet | **Works Offline (WebAssembly & Web Workers)** |
| **Creative Media Suite** | ❌ None | **Built-in Emoji, Sticker & GIF Studios** |
| **Speed** | Slow file upload & queue times | **Instant Local CPU/GPU Processing** |

---

## 🛠️ Complete Feature Suite (24 Tools)

### 📄 PDF Organization & Core
1. **Merge PDF**: Combine multiple PDF documents into a single file with custom drag-and-drop sequencing.
2. **Split PDF**: Extract custom page ranges (`1-3, 5, 8-12`) or burst every page into individual single-page PDFs in a ZIP.
3. **Compress PDF**: 3 smart compression modes (Extreme, Recommended, High Fidelity) with real-time size reduction counter.
4. **Organize PDF**: Visual page grid; reorder pages, duplicate, delete, and rearrange.
5. **Rotate PDF**: Rotate individual pages or all pages clockwise/counterclockwise by 90°, 180°, or 270°.

### 🔄 Conversions & Smart AI Extraction
6. **PDF to JPG / PNG / WebP**: High-resolution page rendering (150 to 450 DPI) with single-page and bulk ZIP downloads.
7. **JPG / Images to PDF**: Convert photos, scans, and graphics into formatted PDFs with custom page sizes (A4, US Letter, Fit to image) and margins.
8. **PDF to OCR (Optical Character Recognition)**: Client-side neural network OCR powered by Tesseract.js. Supports English, Spanish, French, German, Italian, Portuguese, Hindi, Chinese, Japanese. Export to TXT or editable Word (.docx).
9. **PDF to Word (.docx)**: Converts PDF text and paragraphs into editable Microsoft Word documents.
10. **PDF to Excel / CSV**: Extracts tables and structured tabular data into clean `.xlsx` or `.csv` sheets.
11. **Extract Images**: Scans and extracts all embedded raster photos and illustrations in native resolution.

### ✍️ Visual Canvas, Editing & Security
12. **Edit PDF Canvas**: Visual drawing studio with freehand pen, highlighter, text annotations, rectangles, and shapes.
13. **Sign PDF**: Create digital signatures by drawing, typing cursive script, or uploading signature photos with automatic background white-removal. Drag and stamp onto any page.
14. **Watermark PDF**: Text watermarks with opacity, angle, and tiled repeat grid; or image/logo stamps.
15. **Page Numbers**: Format options (`Page {n} of {total}`, `{n}/{total}`), 6 page positions, and cover page skipping.
16. **Protect & Unlock PDF**: Encrypt documents with password protection or remove restrictions.
17. **Redact PDF**: Permanently blackout confidential text, personal data, and secrets.
18. **Crop PDF**: Trim margins and page boundaries visually.
19. **Flatten PDF**: Solidifies interactive form fields, buttons, and annotations so they cannot be altered or corrupted.

### 🎨 Creative Media Studio (Bonus Suite)
20. **Emoji Maker Studio**: Layered SVG custom emoji builder. Customize face shapes, skin tones, eye expressions, mouths, hats, accessories, and caption badges. Export as transparent PNG or vector SVG.
21. **Sticker Creator**: Turn any photo into a die-cut sticker with smart background removal, adjustable white contour border, and 3D drop shadow.
22. **GIF Studio**:
    - **Images to GIF**: Create animated GIFs from photos with custom FPS and loop settings.
    - **Video to GIF**: Convert short video clips (MP4/WebM) to lightweight GIFs.
    - **PDF to GIF**: Turn PDF slide decks or documents into animated flipbook GIFs.
23. **Meme Studio**: Make classic top/bottom Impact font memes or modern social media banner memes. Export as JPG or PDF document.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm or yarn

### Installation & Run

```bash
# 1. Navigate to project folder
cd C:\Users\DELL\pdfbuddy

# 2. Start development server
npm run dev

# 3. Or build and serve optimized production build
npm run build
npm run preview
```

Open your browser at **`http://localhost:3000`**.

---

## 🔒 100% Client-Side Privacy Guarantee

Unlike traditional cloud PDF services that upload your confidential tax returns, medical files, and legal contracts to remote cloud servers, **PDFBuddy runs 100% locally in your browser memory**:
- Powered by `pdf-lib`, `pdfjs-dist`, `tesseract.js`, and HTML5 Canvas.
- No network uploads of your document data.
- Works offline as a Progressive Web App (PWA).

---

## 📜 License
MIT — 100% Free to use, modify, distribute, and self-host anytime.
