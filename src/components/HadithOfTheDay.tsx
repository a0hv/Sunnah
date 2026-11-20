'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shuffle,
  Copy,
  Check,
  Scroll,
  ArrowLeft,
  ExternalLink,
  Share2,
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

  // حساب الحديث اليومي الحتمي بناء على تاريخ اليوم
  useEffect(() => {
    if (HADITHS.length === 0) return;
    const d = new Date();
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
    <div className="rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light/70 dark:border-subtle-dark/70 border-s-2 border-s-emerald-brand dark:border-s-emerald-brand-dark p-6 sm:p-8 space-y-5 text-start shadow-2xs">
      {/* الرأس التحريري والأزرار */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle-light/50 dark:border-subtle-dark/50 pb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-brand dark:bg-emerald-brand-dark shrink-0" />
          <span className="text-xs font-semibold text-emerald-brand dark:text-emerald-brand-dark font-display">
            حديث اليوم
          </span>
          <span className="text-xs text-muted-light dark:text-muted-dark">
            • الأربعون النووية (الحديث {currentHadith.id})
          </span>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShuffle}
            title="حديث آخر عشوائيًا"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-subtle-light dark:border-subtle-dark bg-paper-light dark:bg-paper-dark text-xs text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark hover:border-emerald-brand/40 transition-colors duration-200"
          >
            <Shuffle className="w-3.5 h-3.5 text-emerald-brand" strokeWidth={1.6} />
            <span className="hidden sm:inline">حديث آخر</span>
          </button>

          <button
            type="button"
            onClick={handleOpenShare}
            title="مشاركة الحديث كبطاقة"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-subtle-light dark:border-subtle-dark bg-paper-light dark:bg-paper-dark text-xs text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark hover:border-emerald-brand/40 transition-colors duration-200"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-brand" strokeWidth={1.6} />
            <span className="hidden sm:inline">بطاقة مشاركة</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="نسخ نص الحديث"
            className="p-1.5 rounded-lg border border-subtle-light dark:border-subtle-dark bg-paper-light dark:bg-paper-dark text-xs text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark hover:border-emerald-brand/40 transition-colors duration-200"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.6} />
            ) : (
              <Copy className="w-3.5 h-3.5" strokeWidth={1.6} />
            )}
          </button>
        </div>
      </div>

      {/* عنوان الحديث ومتنه بخط لوتس التحريري */}
      <div className="space-y-3">
        <h3 className="font-display font-semibold text-base sm:text-lg text-slate-900 dark:text-white">
          {currentHadith.title}
        </h3>
        <div className="py-1">
          <HadithText
            text={currentHadith.text}
            className="text-lg sm:text-xl md:text-2xl leading-loose"
          />
        </div>
      </div>

      {/* معلومات الإسناد والتخريج وروابط القسم */}
      <div className="pt-3 border-t border-subtle-light/50 dark:border-subtle-dark/50 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-light dark:text-muted-dark">
        <div className="flex flex-wrap items-center gap-2">
          <span>الراوي: {currentHadith.narrator}</span>
          <span className="opacity-40">•</span>
          <span>المصدر: {currentHadith.source}</span>
          <span className="opacity-40">•</span>
          <a
            href={getDorarHadithUrl(currentHadith.text)}
            target="_blank"
            rel="noopener noreferrer"
            title="تخريج الحديث في موسوعة الدرر السنية"
            className="inline-flex items-center gap-1 text-emerald-brand dark:text-emerald-brand-dark hover:underline font-medium"
          >
            <span>الدرر السنية</span>
            <ExternalLink className="w-3 h-3" strokeWidth={1.6} />
          </a>
        </div>

        <Link
          href={`/nawawi40#hadith-${currentHadith.id}`}
          className="inline-flex items-center gap-1.5 font-medium text-emerald-brand dark:text-emerald-brand-dark hover:underline group"
        >
          <Scroll className="w-3.5 h-3.5 text-emerald-brand" strokeWidth={1.6} />
          <span>تصفح في الأربعين النووية</span>
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" strokeWidth={1.6} />
        </Link>
      </div>

      {/* نافذة بطاقة المشاركة */}
      <ShareCardModal
        isOpen={Boolean(shareCardData)}
        onClose={() => setShareCardData(null)}
        data={shareCardData}
      />
    </div>
  );
}
