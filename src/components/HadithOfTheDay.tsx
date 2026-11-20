'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Shuffle,
  Copy,
  Check,
  Scroll,
  ArrowRight,
  Quote,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import nawawiRaw from '@/data/nawawi40.json';
import { getDorarHadithUrl } from '@/lib/external-refs';
import { HadithText } from './HadithText';
import { ShareCardModal, type ShareCardData } from './ShareCardModal';

interface NawawiItem {
  id: number;
  title: string;
  text: string;
  narrator: string;
  source: string;
}

const HADITHS: NawawiItem[] = (nawawiRaw as { hadiths: NawawiItem[] }).hadiths || [];

export function HadithOfTheDay() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareCardData, setShareCardData] = useState<ShareCardData | null>(null);
  const [, setIsMounted] = useState<boolean>(false);

  // Compute deterministic daily hadith based on calendar date
  useEffect(() => {
    setIsMounted(true);
    if (HADITHS.length === 0) return;

    const d = new Date();
    // Deterministic daily seed: YYYYMMDD
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    const dailyIndex = seed % HADITHS.length;
    setCurrentIndex(dailyIndex);
  }, []);

  const currentHadith = HADITHS[currentIndex] || HADITHS[0];

  const handleShuffle = () => {
    if (HADITHS.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * HADITHS.length);
    if (nextIdx === currentIndex) {
      nextIdx = (currentIndex + 1) % HADITHS.length;
    }
    setCurrentIndex(nextIdx);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const handleCopy = async () => {
    if (!currentHadith) return;
    try {
      const textToCopy = `«الحديث ${currentHadith.id}: ${currentHadith.title}»\n\n${currentHadith.text}\n\n[الراوي: ${currentHadith.narrator} • ${currentHadith.source}]\n\n— الباحث في السنة | الأربعون النووية للإمام النووي`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleOpenShare = () => {
    if (!currentHadith) return;
    setShareCardData({
      type: 'hadith',
      title: `الحديث ${currentHadith.id}: ${currentHadith.title}`,
      sectionTitle: 'الأربعون النووية',
      text: currentHadith.text,
      citation: `الراوي: ${currentHadith.narrator} • ${currentHadith.source}`,
      source: 'الباحث في السنة — الأربعون النووية للإمام النووي',
    });
  };

  if (!currentHadith) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-paper-light via-surface-light to-emerald-brand/5 dark:from-paper-dark dark:via-surface-dark dark:to-emerald-brand-dark/10 border border-subtle-light dark:border-subtle-dark p-6 sm:p-8 shadow-xs space-y-6 text-start">
      {/* Decorative Quote Mark */}
      <div className="absolute top-4 end-6 text-emerald-brand/10 dark:text-emerald-brand-dark/10 select-none pointer-events-none">
        <Quote className="w-20 h-20 -rotate-12" />
      </div>

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle-light/70 dark:border-subtle-dark/70 pb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-gold-accent/15 text-gold-accent dark:text-gold-accent-dark flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gold-accent dark:text-gold-accent-dark">
                حديث اليوم
              </span>
              <span className="text-[11px] text-muted-light dark:text-muted-dark font-sans">
                • الأربعون النووية (الحديث رقم {currentHadith.id})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-light dark:text-muted-dark font-sans">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-brand dark:text-emerald-brand-dark shrink-0" />
              <span>الراوي: {currentHadith.narrator}</span>
              <span className="opacity-60">•</span>
              <span>{currentHadith.source}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShuffle}
            title="اختيار حديث آخر عشوائيًا"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-subtle-light dark:border-subtle-dark bg-paper-light dark:bg-paper-dark text-xs font-bold text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark hover:border-emerald-brand/40 transition-colors shadow-2xs"
          >
            <Shuffle className="w-3.5 h-3.5 text-emerald-brand" />
            <span>حديث آخر</span>
          </button>

          <button
            type="button"
            onClick={handleOpenShare}
            title="توليد بطاقة مشاركة للصورة"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-subtle-light dark:border-subtle-dark bg-paper-light dark:bg-paper-dark text-xs font-bold text-gold-accent dark:text-gold-accent-dark hover:bg-gold-accent/10 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">بطاقة مشاركة</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="نسخ نص الحديث"
            className="p-2 rounded-xl border border-subtle-light dark:border-subtle-dark bg-paper-light dark:bg-paper-dark text-xs text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark transition-colors shadow-2xs"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Hadith Title & Arabic Text */}
      <div className="relative z-10 space-y-3 py-1">
        <h3 className="font-display font-bold text-base sm:text-lg text-emerald-brand dark:text-emerald-brand-dark">
          الحديث {currentHadith.id}: {currentHadith.title}
        </h3>
        <HadithText
          text={currentHadith.text}
          className="text-lg sm:text-xl md:text-2xl"
        />
      </div>

      {/* Footer Info & Link to Nawawi Section */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 text-xs text-muted-light dark:text-muted-dark relative z-10">
        <div className="flex items-center gap-3">
          <span>المصدر: الأربعون النووية — الإمام النووي</span>
          <a
            href={getDorarHadithUrl(currentHadith.text)}
            target="_blank"
            rel="noopener noreferrer"
            title="تخريج وتحقيق الحديث في الموسوعة الحديثية — الدرر السنية"
            className="inline-flex items-center gap-1 font-bold text-emerald-brand dark:text-emerald-brand-dark hover:underline"
          >
            <span>التحقق في الدرر السنية</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <Link
          href={`/nawawi40#hadith-${currentHadith.id}`}
          className="inline-flex items-center gap-1.5 font-bold text-emerald-brand dark:text-emerald-brand-dark hover:underline"
        >
          <Scroll className="w-3.5 h-3.5 text-emerald-brand" />
          <span>تصفح الحديث في الأربعين النووية</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </Link>
      </div>

      {/* Share Card Modal */}
      <ShareCardModal
        isOpen={Boolean(shareCardData)}
        onClose={() => setShareCardData(null)}
        data={shareCardData}
      />
    </div>
  );
}
