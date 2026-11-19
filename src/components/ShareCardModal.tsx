'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  Square,
  Image as ImageIcon,
} from 'lucide-react';
import {
  renderShareCardToCanvas,
  type CardTemplate,
  type CardAspectRatio,
  type ShareCardRenderOptions,
} from '@/lib/render-share-card';

export interface ShareCardData {
  type?: 'hadith' | 'adhkar' | 'fake-hadith' | string;
  category?: string;
  sectionTitle?: string;
  title?: string;
  text: string;
  citation?: string;
  narrator?: string;
  source?: string;
  ruling?: string;
  explanation?: string;
  hadithNumber?: number;
  repeatCount?: number;
}

interface ShareCardModalProps {
  isOpen?: boolean;
  onClose: () => void;
  data: ShareCardData | null;
}

export function ShareCardModal({ isOpen = true, onClose, data }: ShareCardModalProps) {
  const [template, setTemplate] = useState<CardTemplate>('paper');
  const [aspectRatio, setAspectRatio] = useState<CardAspectRatio>('square');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [canDirectShare, setCanDirectShare] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check if browser supports sharing files
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator) {
      setCanDirectShare(true);
    }
  }, []);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Re-render card whenever template, aspect ratio, or data changes
  useEffect(() => {
    if (!isOpen || !data) return;

    let isSubscribed = true;
    setIsRendering(true);

    const render = async () => {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      const categoryLabel =
        data.category ||
        (data.type === 'adhkar'
          ? 'حصن المسلم'
          : data.type === 'fake-hadith'
          ? 'تثبّت الحديثي'
          : 'رياض الصالحين');

      const sourceLabel =
        data.source ||
        (data.type === 'adhkar'
          ? 'حصن المسلم'
          : data.type === 'fake-hadith'
          ? 'تثبّت — الدرر السنية'
          : 'رياض الصالحين للإمام النووي');

      const citationLabel =
        data.citation ||
        (data.narrator
          ? `الراوي: ${data.narrator}`
          : data.ruling
          ? `الحكم: ${data.ruling}`
          : '');

      await renderShareCardToCanvas(canvasRef.current, {
        category: categoryLabel,
        sectionTitle: data.sectionTitle || data.source || '',
        source: sourceLabel,
        text: data.text,
        citation: citationLabel,
        template,
        aspectRatio,
      });

      if (isSubscribed && canvasRef.current) {
        setPreviewUrl(canvasRef.current.toDataURL('image/png'));
        setIsRendering(false);
      }
    };

    render();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, data, template, aspectRatio]);

  if (!isOpen || !data) return null;

  // Download action
  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `sunnah-${template}-${aspectRatio}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Direct share action
  const handleShare = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'sunnah-card.png', {
          type: 'image/png',
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: data.source || 'منصة السنة',
            text: `${data.text}\n\n— منصة السنة (${data.source || ''})`,
            files: [file],
          });
        } else {
          // Fallback to basic download
          handleDownload();
        }
      }, 'image/png');
    } catch {
      handleDownload();
    }
  };

  // Copy text for WhatsApp
  const handleCopyFormattedText = async () => {
    const citationLine =
      data.citation ||
      (data.narrator ? `الراوي: ${data.narrator}` : data.ruling ? `الحكم: ${data.ruling}` : '');
    const sourceLine = data.source ? `\n📚 المصدر: ${data.source}` : '';
    const formatted = `${data.text}${citationLine ? `\n— ${citationLine}` : ''}${sourceLine}\n\n— منصة السنة`;

    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-card-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl p-5 sm:p-6 rounded-3xl border border-subtle-light dark:border-subtle-dark bg-surface-light dark:bg-surface-dark shadow-2xl text-start space-y-5 my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle-light dark:border-subtle-dark pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold-accent/15 text-gold-accent dark:text-gold-accent-dark flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 id="share-card-title" className="text-base sm:text-lg font-bold font-sans text-slate-900 dark:text-white">
                توليد بطاقة مشاركة فاخرة
              </h3>
              <span className="text-[11px] text-muted-light dark:text-muted-dark block">
                صورة عالية الدقة (1080px) جاهزة لواتساب ومنصات التواصل
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="p-1.5 rounded-lg text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Toolbar: Templates & Aspect Ratios */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-subtle-light/70 dark:border-subtle-dark/70 pb-3">
          {/* Template Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-light dark:text-muted-dark font-medium me-1">
              القالب:
            </span>

            <button
              type="button"
              onClick={() => setTemplate('paper')}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                template === 'paper'
                  ? 'border-emerald-brand bg-emerald-brand text-white shadow-2xs'
                  : 'border-subtle-light dark:border-subtle-dark text-charcoal-light dark:text-charcoal-dark'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#FAF9F5] border border-amber-600" />
              <span>ورقي دافئ</span>
            </button>

            <button
              type="button"
              onClick={() => setTemplate('night')}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                template === 'night'
                  ? 'border-emerald-brand bg-emerald-brand text-white shadow-2xs'
                  : 'border-subtle-light dark:border-subtle-dark text-charcoal-light dark:text-charcoal-dark'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#0E1412] border border-emerald-400" />
              <span>زمردي ليلي</span>
            </button>

            <button
              type="button"
              onClick={() => setTemplate('cream')}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                template === 'cream'
                  ? 'border-emerald-brand bg-emerald-brand text-white shadow-2xs'
                  : 'border-subtle-light dark:border-subtle-dark text-charcoal-light dark:text-charcoal-dark'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#F4EFE6] border border-emerald-800" />
              <span>كريمي تراثي</span>
            </button>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-light dark:text-muted-dark font-medium me-1">
              المقاس:
            </span>

            <button
              type="button"
              onClick={() => setAspectRatio('square')}
              title="مقاس مربع 1080×1080 (مثالي للواتساب وتويتر)"
              className={`p-1.5 rounded-lg border flex items-center gap-1 transition-all ${
                aspectRatio === 'square'
                  ? 'border-emerald-brand bg-emerald-brand text-white shadow-2xs'
                  : 'border-subtle-light dark:border-subtle-dark text-muted-light'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium hidden sm:inline">مربع (1:1)</span>
            </button>

            <button
              type="button"
              onClick={() => setAspectRatio('story')}
              title="مقاس عمودي 1080×1350 (مثالي لستوري إنستغرام وواتساب)"
              className={`p-1.5 rounded-lg border flex items-center gap-1 transition-all ${
                aspectRatio === 'story'
                  ? 'border-emerald-brand bg-emerald-brand text-white shadow-2xs'
                  : 'border-subtle-light dark:border-subtle-dark text-muted-light'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium hidden sm:inline">ستوري (4:5)</span>
            </button>
          </div>
        </div>

        {/* Live Canvas Preview */}
        <div className="relative flex items-center justify-center p-3 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light/70 dark:border-subtle-dark/70 min-h-[260px] max-h-[380px] overflow-hidden">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="معاينة بطاقة المشاركة"
              className="max-h-[350px] w-auto rounded-xl object-contain shadow-lg"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-xs text-muted-light">
              <ImageIcon className="w-8 h-8 animate-pulse text-emerald-brand" />
              <span>جاري رسم وتجهيز البطاقة...</span>
            </div>
          )}

          {isRendering && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-2xs flex items-center justify-center rounded-2xl">
              <span className="text-xs bg-black/70 text-white px-3 py-1 rounded-lg">
                جاري التحديث...
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* Download PNG */}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-brand text-white font-medium text-xs hover:opacity-95 shadow-sm transition-opacity"
            >
              <Download className="w-4 h-4" />
              <span>تحميل الصورة (PNG)</span>
            </button>

            {/* Direct Share */}
            {canDirectShare && (
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-subtle-light dark:border-subtle-dark text-charcoal-light dark:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>مشاركة</span>
              </button>
            )}
          </div>

          {/* Copy WhatsApp Text */}
          <button
            type="button"
            onClick={handleCopyFormattedText}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium transition-colors"
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">تم نسخ النص</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ نصاً لواتساب</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
