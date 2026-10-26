import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ToolHeader } from '@/components/common/ToolHeader';
import { downloadDataUrl } from '@/utils/formatters';
import { Download, Copy, RefreshCw, Check } from 'lucide-react';

export const EmojiMakerTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [baseColor, setBaseColor] = useState<string>('#fbbf24');
  const [faceShape, setFaceShape] = useState<'circle' | 'square' | 'heart' | 'cat'>('circle');
  const [eyeType, setEyeType] = useState<string>('happy');
  const [mouthType, setMouthType] = useState<string>('smile');
  const [hatType, setHatType] = useState<string>('none');
  const [accessoryType, setAccessoryType] = useState<string>('none');
  const [customBadge, setCustomBadge] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement>(null);

  const baseColors = [
    { color: '#fbbf24', name: 'Classic Yellow' },
    { color: '#f87171', name: 'Angry Red' },
    { color: '#60a5fa', name: 'Cool Blue' },
    { color: '#4ade80', name: 'Alien Green' },
    { color: '#c084fc', name: 'Vibrant Purple' },
    { color: '#f472b6', name: 'Cute Pink' },
  ];

  const eyeTypes = [
    { id: 'happy', label: '😊 Happy' },
    { id: 'sunglasses', label: '😎 Cool Shades' },
    { id: 'hearts', label: '😍 Hearts' },
    { id: 'stars', label: '🤩 Stars' },
    { id: 'wink', label: '😉 Winking' },
    { id: 'crying', label: '😭 Tears' },
    { id: 'cross', label: '😵 Dizzy' },
    { id: 'rolling', label: '🙄 Roll Eyes' },
  ];

  const mouthTypes = [
    { id: 'smile', label: '😀 Smile' },
    { id: 'grin', label: '😁 Big Grin' },
    { id: 'tongue', label: '😋 Tongue Out' },
    { id: 'shocked', label: '😮 Shocked' },
    { id: 'smirk', label: '😏 Smirk' },
    { id: 'vampire', label: '🧛 Vampire' },
    { id: 'mask', label: '😷 Mask' },
  ];

  const hatTypes = [
    { id: 'none', label: 'None' },
    { id: 'crown', label: '👑 Golden Crown' },
    { id: 'party', label: '🎉 Party Hat' },
    { id: 'halo', label: '😇 Angel Halo' },
    { id: 'cowboy', label: '🤠 Cowboy Hat' },
  ];

  const accessoryTypes = [
    { id: 'none', label: 'None' },
    { id: 'sweat', label: '💧 Sweat Drop' },
    { id: 'flame', label: '🔥 Fire Aura' },
    { id: 'monocle', label: '🧐 Monocle' },
    { id: 'bandage', label: '🩹 Bandage' },
  ];

  const randomizeEmoji = () => {
    const randomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    setBaseColor(randomItem(baseColors).color);
    setEyeType(randomItem(eyeTypes).id);
    setMouthType(randomItem(mouthTypes).id);
    setHatType(randomItem(hatTypes).id);
    setAccessoryType(randomItem(accessoryTypes).id);
  };

  const exportAsPng = (size: number = 512) => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0, size, size);

      const pngData = canvas.toDataURL('image/png');
      downloadDataUrl(pngData, `pdfbuddy_emoji_${Date.now()}.png`);
      URL.revokeObjectURL(blobURL);

      confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
    };
    image.src = blobURL;
  };

  const exportAsSvg = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, `pdfbuddy_emoji_${Date.now()}.svg`);
  };

  const copyToClipboard = async () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0, 512, 512);

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (e) {
            console.error(e);
          }
        }
      });
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <ToolHeader
        title="Emoji Maker Studio"
        description="Design your own custom emojis, stickers, and avatars. Layer faces, eyes, mouths, hats, and accessories. Export as transparent PNG or SVG vector."
        iconName="Smile"
        badge="Creative"
        color="from-yellow-400 to-amber-500"
        onBack={onBack}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center sticky top-24">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/60 rounded-3xl shadow-inner border border-slate-100 dark:border-slate-800/80 mb-6 group">
            <svg
              ref={svgRef}
              viewBox="0 0 200 200"
              className="w-full h-full drop-shadow-2xl transition-transform duration-200 group-hover:scale-105"
            >
              <defs>
                <radialGradient id="emojiGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                  <stop offset="50%" stopColor={baseColor} />
                  <stop offset="100%" stopColor={baseColor} stopOpacity="0.85" />
                </radialGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.25" />
                </filter>
              </defs>

              {hatType === 'halo' && (
                <ellipse
                  cx="100"
                  cy="35"
                  rx="60"
                  ry="18"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="12"
                  filter="url(#shadow)"
                />
              )}

              {accessoryType === 'flame' && (
                <path
                  d="M100 20 C120 50 140 60 130 90 C125 105 110 115 100 120 C90 115 75 105 70 90 C60 60 80 50 100 20 Z"
                  fill="#ef4444"
                  opacity="0.75"
                />
              )}

              {faceShape === 'circle' && (
                <circle cx="100" cy="110" r="70" fill="url(#emojiGrad)" filter="url(#shadow)" />
              )}
              {faceShape === 'square' && (
                <rect x="35" y="45" width="130" height="130" rx="36" fill="url(#emojiGrad)" filter="url(#shadow)" />
              )}
              {faceShape === 'cat' && (
                <g filter="url(#shadow)">
                  <polygon points="45,70 65,30 90,65" fill={baseColor} />
                  <polygon points="155,70 135,30 110,65" fill={baseColor} />
                  <polygon points="52,65 67,38 83,62" fill="#f472b6" />
                  <polygon points="148,65 133,38 117,62" fill="#f472b6" />
                  <circle cx="100" cy="110" r="70" fill="url(#emojiGrad)" />
                </g>
              )}

              {eyeType === 'happy' && (
                <g stroke="#1e293b" strokeWidth="6" strokeLinecap="round" fill="none">
                  <path d="M65 95 Q75 80 85 95" />
                  <path d="M115 95 Q125 80 135 95" />
                </g>
              )}

              {eyeType === 'hearts' && (
                <g fill="#e11d48">
                  <path d="M75 85 C65 70 50 80 75 105 C100 80 85 70 75 85 Z" transform="scale(0.8) translate(20, 15)" />
                  <path d="M75 85 C65 70 50 80 75 105 C100 80 85 70 75 85 Z" transform="scale(0.8) translate(75, 15)" />
                </g>
              )}

              {eyeType === 'stars' && (
                <g fill="#f59e0b">
                  <polygon points="75,80 79,90 90,90 81,96 84,107 75,100 66,107 69,96 60,90 71,90" />
                  <polygon points="125,80 129,90 140,90 131,96 134,107 125,100 116,107 119,96 110,90 121,90" />
                </g>
              )}

              {eyeType === 'sunglasses' && (
                <g fill="#0f172a" filter="url(#shadow)">
                  <path d="M50 85 Q75 80 100 85 Q125 80 150 85 L145 105 Q125 115 105 105 L100 95 L95 105 Q75 115 55 105 Z" />
                  <path d="M45 88 L60 88" stroke="#0f172a" strokeWidth="5" />
                  <path d="M140 88 L155 88" stroke="#0f172a" strokeWidth="5" />
                  <line x1="60" y1="90" x2="85" y2="105" stroke="#ffffff" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
                  <line x1="110" y1="90" x2="135" y2="105" stroke="#ffffff" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
                </g>
              )}

              {eyeType === 'wink' && (
                <g>
                  <circle cx="75" cy="95" r="9" fill="#1e293b" />
                  <circle cx="72" cy="92" r="3" fill="#ffffff" />
                  <path d="M115 95 Q125 82 135 95" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" fill="none" />
                </g>
              )}

              {eyeType === 'crying' && (
                <g>
                  <circle cx="75" cy="95" r="9" fill="#1e293b" />
                  <circle cx="125" cy="95" r="9" fill="#1e293b" />
                  <path d="M75 105 Q70 135 75 150 Q80 135 75 105 Z" fill="#38bdf8" opacity="0.85" />
                  <path d="M125 105 Q120 135 125 150 Q130 135 125 105 Z" fill="#38bdf8" opacity="0.85" />
                </g>
              )}

              {eyeType === 'cross' && (
                <g stroke="#1e293b" strokeWidth="6" strokeLinecap="round">
                  <line x1="68" y1="88" x2="82" y2="102" />
                  <line x1="82" y1="88" x2="68" y2="102" />
                  <line x1="118" y1="88" x2="132" y2="102" />
                  <line x1="132" y1="88" x2="118" y2="102" />
                </g>
              )}

              {eyeType === 'rolling' && (
                <g>
                  <circle cx="75" cy="95" r="14" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
                  <circle cx="125" cy="95" r="14" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
                  <circle cx="75" cy="88" r="6" fill="#1e293b" />
                  <circle cx="125" cy="88" r="6" fill="#1e293b" />
                </g>
              )}

              {mouthType === 'smile' && (
                <path d="M72 130 Q100 160 128 130" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" fill="none" />
              )}

              {mouthType === 'grin' && (
                <path d="M70 125 Q100 165 130 125 Z" fill="#ffffff" stroke="#1e293b" strokeWidth="5" />
              )}

              {mouthType === 'tongue' && (
                <g>
                  <path d="M70 125 Q100 155 130 125 Z" fill="#1e293b" />
                  <path d="M90 135 Q100 165 110 135 Z" fill="#f43f5e" stroke="#be123c" strokeWidth="2" />
                </g>
              )}

              {mouthType === 'shocked' && (
                <ellipse cx="100" cy="140" rx="15" ry="20" fill="#1e293b" />
              )}

              {mouthType === 'smirk' && (
                <path d="M80 135 Q105 142 125 125" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" fill="none" />
              )}

              {mouthType === 'vampire' && (
                <g>
                  <path d="M75 130 Q100 155 125 130 Z" fill="#1e293b" />
                  <polygon points="85,130 90,144 95,130" fill="#ffffff" />
                  <polygon points="105,130 110,144 115,130" fill="#ffffff" />
                </g>
              )}

              {mouthType === 'mask' && (
                <g filter="url(#shadow)">
                  <rect x="60" y="115" width="80" height="50" rx="10" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="45" y1="125" x2="60" y2="128" stroke="#cbd5e1" strokeWidth="3" />
                  <line x1="45" y1="150" x2="60" y2="148" stroke="#cbd5e1" strokeWidth="3" />
                  <line x1="140" y1="128" x2="155" y2="125" stroke="#cbd5e1" strokeWidth="3" />
                  <line x1="140" y1="148" x2="155" y2="150" stroke="#cbd5e1" strokeWidth="3" />
                  <line x1="68" y1="130" x2="132" y2="130" stroke="#f1f5f9" strokeWidth="2" />
                  <line x1="68" y1="142" x2="132" y2="142" stroke="#f1f5f9" strokeWidth="2" />
                </g>
              )}

              {hatType === 'party' && (
                <g filter="url(#shadow)">
                  <polygon points="100,10 65,65 135,65" fill="#ec4899" />
                  <circle cx="100" cy="10" r="8" fill="#eab308" />
                  <line x1="75" y1="50" x2="125" y2="50" stroke="#3b82f6" strokeWidth="5" />
                  <line x1="85" y1="35" x2="115" y2="35" stroke="#eab308" strokeWidth="5" />
                </g>
              )}

              {hatType === 'crown' && (
                <g filter="url(#shadow)">
                  <polygon points="65,65 70,35 85,50 100,25 115,50 130,35 135,65" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
                  <circle cx="70" cy="35" r="4" fill="#ef4444" />
                  <circle cx="100" cy="25" r="4" fill="#3b82f6" />
                  <circle cx="130" cy="35" r="4" fill="#10b981" />
                </g>
              )}

              {hatType === 'cowboy' && (
                <g filter="url(#shadow)">
                  <ellipse cx="100" cy="65" rx="65" ry="14" fill="#78350f" />
                  <path d="M75 65 Q70 25 100 25 Q130 25 125 65 Z" fill="#92400e" />
                  <rect x="75" y="58" width="50" height="7" fill="#451a03" />
                </g>
              )}

              {accessoryType === 'sweat' && (
                <path d="M145 65 C135 80 155 80 145 65 Z" fill="#38bdf8" filter="url(#shadow)" />
              )}

              {accessoryType === 'monocle' && (
                <g>
                  <circle cx="125" cy="95" r="18" fill="none" stroke="#eab308" strokeWidth="3" />
                  <line x1="135" y1="108" x2="148" y2="135" stroke="#ca8a04" strokeWidth="2" />
                </g>
              )}

              {accessoryType === 'bandage' && (
                <rect x="110" y="130" width="35" height="15" rx="3" fill="#fde047" transform="rotate(-20 110 130)" stroke="#eab308" strokeWidth="1.5" />
              )}

              {customBadge && (
                <g filter="url(#shadow)">
                  <rect x="50" y="160" width="100" height="26" rx="13" fill="#0f172a" />
                  <text x="100" y="178" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    {customBadge.toUpperCase()}
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="w-full space-y-2">
            <button
              onClick={() => exportAsPng(512)}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-102"
            >
              <Download className="w-4 h-4" /> Download PNG (512px Transparent)
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copyToClipboard}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied Image!' : 'Copy to Clipboard'}
              </button>

              <button
                onClick={exportAsSvg}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" /> Vector SVG
              </button>
            </div>

            <button
              onClick={randomizeEmoji}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors mt-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Randomize Combination
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Base Color & Head Shape
            </h4>

            <div className="flex items-center gap-3">
              {baseColors.map((c) => (
                <button
                  key={c.color}
                  onClick={() => setBaseColor(c.color)}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                  className={`w-10 h-10 rounded-2xl shadow-sm transition-transform ${
                    baseColor === c.color ? 'scale-115 ring-4 ring-offset-2 ring-amber-400' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { id: 'circle', label: 'Classic Round' },
                { id: 'square', label: 'Cute Rounded Box' },
                { id: 'cat', label: 'Cat Ears' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setFaceShape(s.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    faceShape === s.id
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Eyes & Glasses
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {eyeTypes.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEyeType(e.id)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold text-left transition-all ${
                    eyeType === e.id
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Mouth & Expression
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {mouthTypes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMouthType(m.id)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold text-left transition-all ${
                    mouthType === m.id
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hats & Crowns
              </h4>
              <div className="space-y-1.5">
                {hatTypes.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setHatType(h.id)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-left transition-all ${
                      hatType === h.id
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Accessories & Flair
              </h4>
              <div className="space-y-1.5">
                {accessoryTypes.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAccessoryType(a.id)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-left transition-all ${
                      accessoryType === a.id
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Custom Caption Badge (Optional):
            </label>
            <input
              type="text"
              maxLength={12}
              value={customBadge}
              onChange={(e) => setCustomBadge(e.target.value)}
              placeholder="e.g. APPROVED, COOL, LOL"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
