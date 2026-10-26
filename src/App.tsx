import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { TOOLS } from './data/tools';
import { ToolCategory, ToolDefinition } from './types';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CommandPalette } from './components/layout/CommandPalette';
import { IconRenderer } from './components/common/IconRenderer';

// Lazy-loaded PDF Tools for ultra-fast mobile loading
const MergePdfTool = lazy(() => import('./components/tools/pdf/MergePdfTool').then((m) => ({ default: m.MergePdfTool })));
const SplitPdfTool = lazy(() => import('./components/tools/pdf/SplitPdfTool').then((m) => ({ default: m.SplitPdfTool })));
const CompressPdfTool = lazy(() => import('./components/tools/pdf/CompressPdfTool').then((m) => ({ default: m.CompressPdfTool })));
const OrganizePdfTool = lazy(() => import('./components/tools/pdf/OrganizePdfTool').then((m) => ({ default: m.OrganizePdfTool })));
const RotatePdfTool = lazy(() => import('./components/tools/pdf/RotatePdfTool').then((m) => ({ default: m.RotatePdfTool })));
const PdfToImageTool = lazy(() => import('./components/tools/pdf/PdfToImageTool').then((m) => ({ default: m.PdfToImageTool })));
const ImageToPdfTool = lazy(() => import('./components/tools/pdf/ImageToPdfTool').then((m) => ({ default: m.ImageToPdfTool })));
const OcrPdfTool = lazy(() => import('./components/tools/pdf/OcrPdfTool').then((m) => ({ default: m.OcrPdfTool })));
const PdfToWordTool = lazy(() => import('./components/tools/pdf/PdfToWordTool').then((m) => ({ default: m.PdfToWordTool })));
const PdfToExcelTool = lazy(() => import('./components/tools/pdf/PdfToExcelTool').then((m) => ({ default: m.PdfToExcelTool })));
const EditPdfTool = lazy(() => import('./components/tools/pdf/EditPdfTool').then((m) => ({ default: m.EditPdfTool })));
const SignPdfTool = lazy(() => import('./components/tools/pdf/SignPdfTool').then((m) => ({ default: m.SignPdfTool })));
const WatermarkPdfTool = lazy(() => import('./components/tools/pdf/WatermarkPdfTool').then((m) => ({ default: m.WatermarkPdfTool })));
const PageNumbersTool = lazy(() => import('./components/tools/pdf/PageNumbersTool').then((m) => ({ default: m.PageNumbersTool })));
const ProtectUnlockTool = lazy(() => import('./components/tools/pdf/ProtectUnlockTool').then((m) => ({ default: m.ProtectUnlockTool })));
const RedactPdfTool = lazy(() => import('./components/tools/pdf/RedactPdfTool').then((m) => ({ default: m.RedactPdfTool })));
const CropPdfTool = lazy(() => import('./components/tools/pdf/CropPdfTool').then((m) => ({ default: m.CropPdfTool })));
const ExtractImagesTool = lazy(() => import('./components/tools/pdf/ExtractImagesTool').then((m) => ({ default: m.ExtractImagesTool })));
const FlattenPdfTool = lazy(() => import('./components/tools/pdf/FlattenPdfTool').then((m) => ({ default: m.FlattenPdfTool })));

// Lazy-loaded Creative Tools
const EmojiMakerTool = lazy(() => import('./components/tools/creative/EmojiMakerTool').then((m) => ({ default: m.EmojiMakerTool })));
const StickerMakerTool = lazy(() => import('./components/tools/creative/StickerMakerTool').then((m) => ({ default: m.StickerMakerTool })));
const GifStudioTool = lazy(() => import('./components/tools/creative/GifStudioTool').then((m) => ({ default: m.GifStudioTool })));
const MemeGeneratorTool = lazy(() => import('./components/tools/creative/MemeGeneratorTool').then((m) => ({ default: m.MemeGeneratorTool })));

import {
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Home,
  CheckCircle2,
  XCircle,
  FolderOpen,
  ArrowLeftRight,
  PenLine,
  Palette,
  Search,
} from 'lucide-react';

export default function App() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
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

  const contentRef = useRef<HTMLDivElement>(null);

  // Sync hash routing without jarring page jumps
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && TOOLS.some((t) => t.id === hash)) {
        setActiveToolId((prev) => (prev === hash ? prev : hash));
      } else if (!hash) {
        setActiveToolId((prev) => (prev === null ? prev : null));
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
    window.scrollTo(0, 0);
  };

  const handleBackHome = () => {
    setActiveToolId(null);
    window.location.hash = '';
    window.scrollTo(0, 0);
  };

  // Grouped tool sections for organized layout
  const toolGroups = [
    {
      id: 'organize',
      title: 'Organize & Compress',
      subtitle: 'Merge, split, resize, rotate, and sort PDF pages with zero file caps',
      icon: FolderOpen,
      tools: TOOLS.filter((t) => t.category === 'organize'),
    },
    {
      id: 'convert',
      title: 'Convert & Extract',
      subtitle: 'Convert between PDF and JPG, Word, Excel, plus client-side OCR text extraction',
      icon: ArrowLeftRight,
      tools: TOOLS.filter((t) => t.category === 'convert'),
    },
    {
      id: 'edit-security',
      title: 'Edit, Sign & Secure',
      subtitle: 'Draw, highlight, redact secrets, sign contracts, and protect documents',
      icon: PenLine,
      tools: TOOLS.filter((t) => t.category === 'edit' || t.category === 'security'),
    },
    {
      id: 'creative',
      title: 'Creative Media Studio',
      subtitle: 'Custom Emoji builder, die-cut sticker creator, animated GIFs & memes',
      icon: Palette,
      tools: TOOLS.filter((t) => t.category === 'creative'),
    },
  ];

  // Active tool object
  const activeToolDef = activeToolId ? TOOLS.find((t) => t.id === activeToolId) : null;

  // Filtered tools when searching or category filtering
  const filteredTools = TOOLS.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch =
      !searchFilter ||
      tool.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tool.shortDesc.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tool.keywords.some((k) => k.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

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
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          if (activeToolId) handleBackHome();
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onHomeClick={handleBackHome}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Sticky Breadcrumb Bar when tool is active (Eliminates page disorientation) */}
      {activeToolId && activeToolDef && (
        <div className="sticky top-16 sm:top-20 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 transition-colors">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={handleBackHome}
                className="flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                {activeToolDef.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBackHome}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                ← All Tools
              </button>
            </div>
          </div>
        </div>
      )}

      <main ref={contentRef} className="flex-1">
        {activeToolId ? (
          <div className="transition-opacity duration-200 ease-in-out min-h-[70vh]">
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Loading tool studio...
                  </p>
                </div>
              }
            >
              {renderActiveTool()}
            </Suspense>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            {/* Compact, Clean Hero Section */}
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero Limits • 100% Free • Works on PC, Phone & Tablet</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                The Free PDF & Media Suite{' '}
                <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                  Without Limits
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                No 15MB file caps. No subscription paywalls. Completely private in your browser.
              </p>

              {/* Mobile & Desktop Instant Search Bar */}
              <div className="relative max-w-md mx-auto pt-2">
                <Search className="w-4 h-4 absolute left-3.5 top-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Find a tool (e.g. merge, compress, ocr, sticker, gif)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm shadow-sm outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* If searching or filtering by category, show simple flat grid */}
            {searchFilter || selectedCategory !== 'all' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{searchFilter ? `Search Results for "${searchFilter}"` : 'Filtered Tools'}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {filteredTools.length}
                    </span>
                  </h2>
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredTools.map((tool) => (
                    <div
                      key={tool.id}
                      onClick={() => selectTool(tool.id)}
                      className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-lg hover:border-rose-400 dark:hover:border-rose-500 cursor-pointer transition-all flex flex-col group active:scale-98"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`p-3 rounded-2xl bg-gradient-to-br ${tool.color} text-white shadow-sm group-hover:scale-105 transition-transform`}
                        >
                          <IconRenderer name={tool.iconName} className="w-5 h-5" />
                        </div>
                        {tool.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50">
                            {tool.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors mb-1 flex items-center justify-between">
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
            ) : (
              /* Highly Organised Grouped Layout */
              <div className="space-y-12">
                {toolGroups.map((group) => {
                  const GroupIcon = group.icon;
                  return (
                    <section key={group.id} className="space-y-4">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <GroupIcon className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            {group.title}
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                            {group.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {group.tools.map((tool) => (
                          <div
                            key={tool.id}
                            onClick={() => selectTool(tool.id)}
                            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-lg hover:border-rose-400 dark:hover:border-rose-500 cursor-pointer transition-all flex flex-col group active:scale-98"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div
                                className={`p-3 rounded-2xl bg-gradient-to-br ${tool.color} text-white shadow-sm group-hover:scale-105 transition-transform`}
                              >
                                <IconRenderer name={tool.iconName} className="w-5 h-5" />
                              </div>
                              {tool.badge && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50">
                                  {tool.badge}
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors mb-1 flex items-center justify-between">
                              <span>{tool.title}</span>
                              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-rose-500" />
                            </h3>

                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex-1">
                              {tool.shortDesc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {/* Feature Comparison */}
            <div className="mt-16 p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white shadow-2xl border border-slate-800">
              <div className="max-w-2xl mx-auto text-center mb-8 space-y-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Feature Comparison
                </span>
                <h3 className="text-xl sm:text-2xl font-black">
                  Why PDFBuddy is Better
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-xs">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span>Traditional Websites</span>
                  </div>
                  <ul className="space-y-2 text-slate-300">
                    <li>✕ Strict 15MB file size limits on free plans</li>
                    <li>✕ Your confidential files uploaded to 3rd party servers</li>
                    <li>✕ Hourly task limits and subscription popups</li>
                    <li>✕ No emoji, sticker, or animated GIF tools</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>PDFBuddy (100% Free)</span>
                  </div>
                  <ul className="space-y-2 text-slate-200">
                    <li>✓ <strong>Zero Limits:</strong> Process 50MB, 200MB, 1GB+ freely</li>
                    <li>✓ <strong>100% Client-Side:</strong> Files never leave your device</li>
                    <li>✓ <strong>Forever Free:</strong> No paywalls, accounts, or popups</li>
                    <li>✓ <strong>Creative Media:</strong> Emojis, Stickers, GIFs built-in</li>
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
