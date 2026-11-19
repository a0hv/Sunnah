'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Scroll,
  CheckCircle2,
  Bookmark,
  Eye,
  EyeOff,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Search,
  X,
  RotateCcw,
  Sparkles,
  Award,
  Filter,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import nawawiRaw from '@/data/nawawi40.json';
import { normalizeArabic } from '@/lib/arabic-search';
import { getDorarHadithUrl } from '@/lib/external-refs';
import { FormattedArabicText } from './FormattedArabicText';
import { HadithText } from './HadithText';
import { ShareCardModal, type ShareCardData } from './ShareCardModal';
import type { NawawiHadith, Nawawi40Data } from '@/types/book';

const nawawiData = nawawiRaw as unknown as Nawawi40Data;
const HADITHS: NawawiHadith[] = nawawiData.hadiths || [];

export type MemorizationStatus = 'unmemorized' | 'in_progress' | 'memorized';

type FilterTab = 'all' | 'memorized' | 'in_progress' | 'unmemorized';

export function NawawiClient() {
  const [statuses, setStatuses] = useState<Record<number, MemorizationStatus>>({});
  const [globalTestingMode, setGlobalTestingMode] = useState<boolean>(false);
  const [revealedIds, setRevealedIds] = useState<Record<number, boolean>>({});
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [shareCardData, setShareCardData] = useState<ShareCardData | null>(null);

  // Load memorization statuses from localStorage
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('nawawi40_memorization_progress');
      if (saved) {
        setStatuses(JSON.parse(saved));
      }
    } catch {
      // LocalStorage error handled gracefully
    }
  }, []);

  const saveStatuses = useCallback((newStatuses: Record<number, MemorizationStatus>) => {
    setStatuses(newStatuses);
    try {
      localStorage.setItem('nawawi40_memorization_progress', JSON.stringify(newStatuses));
    } catch {
      // ignore
    }
  }, []);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((cur) => (cur === msg ? null : cur));
    }, 2200);
  };

  const setStatus = (hadithId: number, status: MemorizationStatus) => {
    const updated = { ...statuses, [hadithId]: status };
    saveStatuses(updated);
    if (status === 'memorized') {
      showToast(`ما شاء الله! تم تعليم الحديث ${hadithId} كمحفوظ`);
    }
  };

  const toggleReveal = (hadithId: number) => {
    setRevealedIds((prev) => ({
      ...prev,
      [hadithId]: !prev[hadithId],
    }));
  };

  const handleCopy = (h: NawawiHadith) => {
    const textToCopy = `الحديث ${h.id}: «${h.title}»\n\n${h.text}\n\nالراوي: ${h.narrator || 'صحابي'}\nالتخريج: ${h.source || ''}\n— الأربعون النووية للإمام النووي`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(h.id);
    showToast('تم نسخ الحديث وتخريجه إلى الحافظة');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    if (confirm('هل ترغب بإعادة تصفير جميع علامات الحفظ للأربعين النووية؟')) {
      saveStatuses({});
      showToast('تمت إعادة ضبط سجل الحفظ');
    }
  };

  // Stats calculation
  const totalCount = HADITHS.length;
  const memorizedCount = useMemo(() => {
    return Object.values(statuses).filter((s) => s === 'memorized').length;
  }, [statuses]);

  const inProgressCount = useMemo(() => {
    return Object.values(statuses).filter((s) => s === 'in_progress').length;
  }, [statuses]);

  const unmemorizedCount = totalCount - memorizedCount - inProgressCount;
  const percentage = Math.round((memorizedCount / totalCount) * 100);

  // Filtered hadiths
  const filteredHadiths = useMemo(() => {
    const q = normalizeArabic(searchQuery.trim());

    return HADITHS.filter((h) => {
      // 1. Status Filter
      const status = statuses[h.id] || 'unmemorized';
      if (filterTab === 'memorized' && status !== 'memorized') return false;
      if (filterTab === 'in_progress' && status !== 'in_progress') return false;
      if (filterTab === 'unmemorized' && status !== 'unmemorized') return false;

      // 2. Search query filter
      if (q) {
        const idMatch = String(h.id) === q || q === `الحديث ${h.id}`;
        const normTitle = normalizeArabic(h.title);
        const normText = normalizeArabic(h.text);
        const normNarrator = normalizeArabic(h.narrator || '');
        const normSource = normalizeArabic(h.source || '');

        return (
          idMatch ||
          normTitle.includes(q) ||
          normText.includes(q) ||
          normNarrator.includes(q) ||
          normSource.includes(q)
        );
      }

      return true;
    });
  }, [searchQuery, filterTab, statuses]);

  return (
    <div className="space-y-8 text-start max-w-5xl mx-auto">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-20 md:bottom-8 start-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Share Card Modal */}
      {shareCardData && (
        <ShareCardModal
          data={shareCardData}
          onClose={() => setShareCardData(null)}
        />
      )}

      {/* 1. Progress & Memorization Dashboard */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-b from-surface-light to-emerald-brand/5 dark:from-surface-dark dark:to-emerald-brand-dark/10 border border-emerald-brand/20 dark:border-emerald-brand-dark/30 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-brand dark:text-emerald-brand-dark font-sans font-semibold">
              <Scroll className="w-3.5 h-3.5" />
              <span>متابعة الحفظ والتسميع الذاتي للأربعين النووية</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 dark:text-white">
              سجل حفظ الأحاديث الـ ٤٢
            </h2>
            <p className="text-xs text-muted-light dark:text-muted-dark max-w-xl leading-relaxed">
              احفظ جوامع الكلم التي عليها مدار الإسلام خطوة بخطوة، مع إمكانية إخفاء المتن للتسميع الذاتي ورصد تقدمك محلياً في متصفحك.
            </p>
          </div>

          {/* Quick Action: Global Testing Mode & Reset */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setGlobalTestingMode(!globalTestingMode)}
              className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 shadow-2xs ${
                globalTestingMode
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-surface-light dark:bg-surface-dark border-subtle-light dark:border-subtle-dark text-charcoal-light dark:text-charcoal-dark hover:border-amber-500/50'
              }`}
              title="إخفاء جميع المتون لاختبار الحفظ"
            >
              {globalTestingMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{globalTestingMode ? 'إلغاء وضع التسميع' : 'وضع التسميع للكل'}</span>
            </button>

            <button
              onClick={handleReset}
              title="إعادة تصفير سجل الحفظ"
              className="p-2 rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-rose-500 hover:border-rose-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Counters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-3">
              <span className="text-slate-800 dark:text-slate-200">
                المحفوظ: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{memorizedCount}</strong> من أصل {totalCount} حديثاً
              </span>
              <span className="text-muted-light dark:text-muted-dark">•</span>
              <span className="text-amber-600 dark:text-amber-300">
                قيد الحفظ: <strong className="font-mono">{inProgressCount}</strong>
              </span>
            </div>
            <span className="font-mono text-emerald-brand dark:text-emerald-brand-dark text-sm font-bold">
              {percentage}%
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-brand via-teal-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Quick Jump Hadiths Numbers Grid (1 - 42) */}
        <div className="space-y-2 pt-2 border-t border-subtle-light/70 dark:border-subtle-dark/70">
          <div className="flex items-center justify-between text-xs text-muted-light dark:text-muted-dark">
            <span className="font-semibold">فهرس الانتقال السريع للأحاديث (١ - ٤٢):</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>محفوظ</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>قيد الحفظ</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>غير محفوظ</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-21 gap-1.5">
            {HADITHS.map((h) => {
              const status = statuses[h.id] || 'unmemorized';
              const colorClass =
                status === 'memorized'
                  ? 'bg-emerald-500 text-white font-bold shadow-2xs'
                  : status === 'in_progress'
                  ? 'bg-amber-500 text-white font-bold'
                  : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:border-emerald-brand/50';

              return (
                <a
                  key={`quick-${h.id}`}
                  href={`#hadith-${h.id}`}
                  title={`الحديث ${h.id}: ${h.title}`}
                  className={`h-7 rounded-lg text-xs flex items-center justify-center transition-all hover:scale-105 font-mono ${colorClass}`}
                >
                  {h.id}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              filterTab === 'all'
                ? 'bg-emerald-brand text-white shadow-2xs font-semibold'
                : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light'
            }`}
          >
            الكل ({totalCount})
          </button>
          <button
            onClick={() => setFilterTab('memorized')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              filterTab === 'memorized'
                ? 'bg-emerald-brand text-white shadow-2xs font-semibold'
                : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light'
            }`}
          >
            المحفوظة ({memorizedCount})
          </button>
          <button
            onClick={() => setFilterTab('in_progress')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              filterTab === 'in_progress'
                ? 'bg-emerald-brand text-white shadow-2xs font-semibold'
                : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light'
            }`}
          >
            قيد الحفظ ({inProgressCount})
          </button>
          <button
            onClick={() => setFilterTab('unmemorized')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              filterTab === 'unmemorized'
                ? 'bg-emerald-brand text-white shadow-2xs font-semibold'
                : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light'
            }`}
          >
            المتبقية ({unmemorizedCount})
          </button>
        </div>

        {/* Local Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الحديث، العنوان، أو المتن..."
            className="w-full py-2 ps-9 pe-8 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-muted-light/60 focus:outline-hidden focus:ring-2 focus:ring-emerald-brand font-sans transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-light hover:text-charcoal-light"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Hadiths List */}
      <div className="space-y-6">
        {filteredHadiths.map((h) => {
          const status = statuses[h.id] || 'unmemorized';
          const isIndividualRevealed = revealedIds[h.id];
          const isBlurred = globalTestingMode && !isIndividualRevealed;
          const dorarUrl = getDorarHadithUrl(h.text);

          return (
            <article
              id={`hadith-${h.id}`}
              key={h.id}
              className={`p-6 sm:p-7 rounded-3xl border transition-all duration-200 scroll-mt-20 ${
                status === 'memorized'
                  ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-surface-light dark:bg-surface-dark border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/40 shadow-xs'
              }`}
            >
              {/* Header: Number, Title, Memorization Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-light/70 dark:border-subtle-dark/70 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark font-bold font-sans text-sm flex items-center justify-center">
                    {h.id}
                  </span>
                  <div>
                    <h3 className="font-sans font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                      {h.title}
                    </h3>
                    {h.narrator && (
                      <span className="text-xs text-muted-light dark:text-muted-dark font-sans block -mt-0.5">
                        الراوي: <strong>{h.narrator}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Memorization Selector */}
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setStatus(h.id, 'unmemorized')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      status === 'unmemorized'
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold'
                        : 'text-muted-light hover:text-charcoal-light'
                    }`}
                  >
                    غير محفوظ
                  </button>
                  <button
                    onClick={() => setStatus(h.id, 'in_progress')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                      status === 'in_progress'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30'
                        : 'text-muted-light hover:text-amber-600'
                    }`}
                  >
                    <Bookmark className="w-3 h-3" />
                    <span>قيد الحفظ</span>
                  </button>
                  <button
                    onClick={() => setStatus(h.id, 'memorized')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                      status === 'memorized'
                        ? 'bg-emerald-500 text-white font-bold shadow-2xs'
                        : 'text-muted-light hover:text-emerald-600'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>تم الحفظ</span>
                  </button>
                </div>
              </div>

              {/* Hadith Matn with Testing Blur Feature */}
              <div className="py-5 relative">
                {isBlurred ? (
                  <div className="space-y-3">
                    <p className="font-hadith text-lg sm:text-xl leading-[2.2] select-none filter blur-sm transition-all duration-300 opacity-60">
                      {h.text}
                    </p>
                    <div className="text-center pt-2">
                      <button
                        onClick={() => toggleReveal(h.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold hover:bg-amber-500/25 transition-all shadow-2xs"
                      >
                        <Eye className="w-4 h-4" />
                        <span>انقر لإظهار المتن والتحقق من حفظك</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <HadithText
                      text={h.text}
                      className="text-lg sm:text-xl"
                    />

                    {globalTestingMode && isIndividualRevealed && (
                      <div className="text-end">
                        <button
                          onClick={() => toggleReveal(h.id)}
                          className="text-[11px] text-muted-light hover:text-charcoal-light inline-flex items-center gap-1"
                        >
                          <EyeOff className="w-3 h-3" />
                          <span>إعادة إخفاء المتن للتسميع</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer: Takhrij & Action Buttons */}
              <div className="pt-4 border-t border-subtle-light/70 dark:border-subtle-dark/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Source / Takhrij */}
                <div className="text-muted-light dark:text-muted-dark font-sans">
                  {h.source && <span>التخريج: <strong>{h.source}</strong></span>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Dorar.net external link */}
                  <a
                    href={dorarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-muted-light hover:text-emerald-brand transition-colors px-2 py-1 rounded-lg"
                    title="تخريج الحديث في الموسوعة الحديثية (الدرر السنية)"
                  >
                    <span>الدرر السنية</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(h)}
                    className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                    title="نسخ الحديث كاملاً"
                  >
                    {copiedId === h.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* Share Card Button */}
                  <button
                    onClick={() =>
                      setShareCardData({
                        type: 'hadith',
                        text: h.text,
                        title: h.title,
                        narrator: h.narrator,
                        source: `الأربعون النووية — الحديث ${h.id} (${h.title})`,
                        hadithNumber: h.id,
                      })
                    }
                    className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                    title="مشاركة كبطاقة أنيقة"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {filteredHadiths.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-3">
            <Search className="w-12 h-12 text-muted-light mx-auto opacity-50" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              لم يتم العثور على أحاديث مطابقة
            </h3>
            <p className="text-xs text-muted-light">
              جرب البحث بكلمة أخرى أو تعديل خيارات التصفية أعلاه.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
