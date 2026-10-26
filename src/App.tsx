import React, { useState, useEffect } from 'react';
import { TOOLS } from './data/tools';
import { ToolCategory, ToolDefinition } from './types';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CommandPalette } from './components/layout/CommandPalette';
import { IconRenderer } from './components/common/IconRenderer';

// PDF Tools
import { MergePdfTool } from './components/tools/pdf/MergePdfTool';
import { SplitPdfTool } from './components/tools/pdf/SplitPdfTool';
import { CompressPdfTool } from './components/tools/pdf/CompressPdfTool';
import { OrganizePdfTool } from './components/tools/pdf/OrganizePdfTool';
import { RotatePdfTool } from './components/tools/pdf/RotatePdfTool';
import { PdfToImageTool } from './components/tools/pdf/PdfToImageTool';
import { ImageToPdfTool } from './components/tools/pdf/ImageToPdfTool';
import { OcrPdfTool } from './components/tools/pdf/OcrPdfTool';
import { PdfToWordTool } from './components/tools/pdf/PdfToWordTool';
import { PdfToExcelTool } from './components/tools/pdf/PdfToExcelTool';
import { EditPdfTool } from './components/tools/pdf/EditPdfTool';
import { SignPdfTool } from './components/tools/pdf/SignPdfTool';
import { WatermarkPdfTool } from './components/tools/pdf/WatermarkPdfTool';
import { PageNumbersTool } from './components/tools/pdf/PageNumbersTool';
import { ProtectUnlockTool } from './components/tools/pdf/ProtectUnlockTool';
import { RedactPdfTool } from './components/tools/pdf/RedactPdfTool';
import { CropPdfTool } from './components/tools/pdf/CropPdfTool';
import { ExtractImagesTool } from './components/tools/pdf/ExtractImagesTool';
import { FlattenPdfTool } from './components/tools/pdf/FlattenPdfTool';

// Creative Tools
import { EmojiMakerTool } from './components/tools/creative/EmojiMakerTool';
import { StickerMakerTool } from './components/tools/creative/StickerMakerTool';
import { GifStudioTool } from './components/tools/creative/GifStudioTool';
import { MemeGeneratorTool } from './components/tools/creative/MemeGeneratorTool';

import {
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Lock,
  Flame,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function App() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('pdfbuddy_theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
    return false;
  });

  // Sync hash routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && TOOLS.some((t) => t.id === hash)) {
        setActiveToolId(hash);
      } else if (!hash) {
        setActiveToolId(null);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);

    const handleCustomOpen = () => setIsCommandPaletteOpen(true);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, []);

  // Sync theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pdfbuddy_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pdfbuddy_theme', 'light');
    }
  }, [isDark]);

  const selectTool = (toolId: string) => {
    setActiveToolId(toolId);
    window.location.hash = toolId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackHome = () => {
    setActiveToolId(null);
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter tools by category
  const filteredTools = TOOLS.filter((tool) => {
    if (selectedCategory === 'all') return true;
    return tool.category === selectedCategory;
  });

  // Render active tool component
  const renderActiveTool = () => {
    switch (activeToolId) {
      case 'merge-pdf':
        return <MergePdfTool onBack={handleBackHome} />;
      case 'split-pdf':
        return <SplitPdfTool onBack={handleBackHome} />;
      case 'compress-pdf':
        return <CompressPdfTool onBack={handleBackHome} />;
      case 'organize-pdf':
        return <OrganizePdfTool onBack={handleBackHome} />;
      case 'rotate-pdf':
        return <RotatePdfTool onBack={handleBackHome} />;
      case 'pdf-to-image':
        return <PdfToImageTool onBack={handleBackHome} />;
      case 'image-to-pdf':
        return <ImageToPdfTool onBack={handleBackHome} />;
      case 'pdf-to-ocr':
        return <OcrPdfTool onBack={handleBackHome} />;
      case 'pdf-to-word':
        return <PdfToWordTool onBack={handleBackHome} />;
      case 'pdf-to-excel':
        return <PdfToExcelTool onBack={handleBackHome} />;
      case 'edit-pdf':
        return <EditPdfTool onBack={handleBackHome} />;
      case 'sign-pdf':
        return <SignPdfTool onBack={handleBackHome} />;
      case 'watermark-pdf':
        return <WatermarkPdfTool onBack={handleBackHome} />;
      case 'page-numbers':
        return <PageNumbersTool onBack={handleBackHome} />;
      case 'protect-pdf':
        return <ProtectUnlockTool onBack={handleBackHome} />;
      case 'redact-pdf':
        return <RedactPdfTool onBack={handleBackHome} />;
      case 'crop-pdf':
        return <CropPdfTool onBack={handleBackHome} />;
      case 'extract-images':
        return <ExtractImagesTool onBack={handleBackHome} />;
      case 'flatten-pdf':
        return <FlattenPdfTool onBack={handleBackHome} />;
      case 'emoji-maker':
        return <EmojiMakerTool onBack={handleBackHome} />;
      case 'sticker-maker':
        return <StickerMakerTool onBack={handleBackHome} />;
      case 'gif-studio':
        return <GifStudioTool onBack={handleBackHome} />;
      case 'meme-generator':
        return <MemeGeneratorTool onBack={handleBackHome} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        currentCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onHomeClick={handleBackHome}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      <main className="flex-1">
        {activeToolId ? (
          renderActiveTool()
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto mb-14 md:mb-20 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero Limits • 100% Free Forever • Client-Side Security</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Every PDF tool you need.{' '}
                <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                  Plus Emojis, Stickers & GIFs.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
                No 15MB file size caps. No daily usage limits. No subscriptions. PDFBuddy processes your documents directly in your browser using high-speed WebAssembly.
              </p>

              {/* Value Badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Files Never Leave Your Device</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Unlimited File Size (500MB+)</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>24 Powerful Tools</span>
                </div>
              </div>
            </div>

            {/* Tools Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Available Tools</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {filteredTools.length}
                  </span>
                </h2>
                <span className="text-xs text-slate-500 hidden sm:block">
                  Click any tool to launch instantly
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => selectTool(tool.id)}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all duration-200 flex flex-col group hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`p-3.5 rounded-2xl bg-gradient-to-br ${tool.color} text-white shadow-md shadow-rose-500/10 group-hover:scale-110 transition-transform`}
                      >
                        <IconRenderer name={tool.iconName} className="w-6 h-6" />
                      </div>
                      {tool.badge && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50">
                          {tool.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors mb-1.5 flex items-center justify-between">
                      <span>{tool.title}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-rose-500" />
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex-1">
                      {tool.shortDesc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Why PDFBuddy is Better Comparison Section */}
            <div className="mt-24 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white shadow-2xl border border-slate-800">
              <div className="max-w-3xl mx-auto text-center mb-10 space-y-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Feature Comparison
                </span>
                <h3 className="text-2xl sm:text-3xl font-black">
                  Why PDFBuddy beats traditional PDF sites
                </h3>
                <p className="text-sm text-slate-400">
                  Built to solve the frustrations of subscription paywalls, slow uploads, and privacy risks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>Traditional Websites (iLovePDF, Smallpdf)</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✕</span> Strict 15MB file size limits on free plans
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✕</span> Your sensitive files are uploaded to 3rd party cloud servers
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✕</span> Hourly task limits and annoying subscription popups
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✕</span> No emoji, sticker, or animated GIF tools
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>PDFBuddy (100% Free & Unlimited)</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-200">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> <strong>Zero Limits:</strong> Process 50MB, 200MB, 1GB+ with zero caps
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> <strong>100% Client-Side:</strong> Files never leave your browser
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> <strong>Forever Free:</strong> No accounts, no paywalls, no ads
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> <strong>Creative Media:</strong> Full Emoji, Sticker & GIF Studios built-in
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTool={selectTool}
      />
    </div>
  );
}
