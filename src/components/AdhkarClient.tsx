'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  BookOpen,
} from 'lucide-react';
import hisnDataRaw from '@/data/hisn-al-muslim.json';
import { normalizeArabic } from '@/lib/arabic-search';
import { getDorarHadithUrl } from '@/lib/external-refs';
import { ShareCardModal, type ShareCardData } from './ShareCardModal';
import type {
  HisnAlMuslimData,
  HisnCategory,
  HisnDhikr,
} from '@/types/book';

function getTodayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const adhkarData = hisnDataRaw as unknown as HisnAlMuslimData;

// Quick jump highlight chapters
const POPULAR_CHAPTER_IDS = [
  { id: 1, label: 'الاستيقاظ' },
  { id: 27, label: 'الصباح والمساء' },
  { id: 28, label: 'النوم والأحلام' },
  { id: 14, label: 'الركوع والسجود' },
  { id: 25, label: 'دبر الصلوات' },
  { id: 36, label: 'الكرب والهم' },
  { id: 95, label: 'السفر والركوب' },
  { id: 101, label: 'الطعام والشراب' },
  { id: 131, label: 'الاستغفار والتوبة' },
];

export function AdhkarClient() {
  const [activeCategoryId, setActiveCategoryId] = useState<number>(1);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI State
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [shareCardData, setShareCardData] = useState<ShareCardData | null>(null);

  const categories: HisnCategory[] = adhkarData.categories || [];
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === activeCategoryId) || categories[0];
  }, [categories, activeCategoryId]);

  // Load saved state from localStorage and read ?cat=ID on mount
  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const catParam = params.get('cat');
        if (catParam) {
          const parsedId = parseInt(catParam, 10);
          if (!isNaN(parsedId) && parsedId > 0) {
            setActiveCategoryId(parsedId);
          }
        }
      } catch {
        // ignore
      }
    }

    const today = getTodayKey();

    try {
      const raw = localStorage.getItem('adhkar_daily_progress');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today && parsed.counts) {
          setCounts(parsed.counts);
        } else {
          setCounts({});
          localStorage.setItem(
            'adhkar_daily_progress',
            JSON.stringify({ date: today, counts: {} })
          );
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((cur) => (cur === msg ? null : cur));
    }, 2200);
  }, []);

  const getDhikrKey = (catId: number, itemId: number) => `${catId}_${itemId}`;

  // Tap Dhikr Counter
  const handleTapDhikr = (catId: number, item: HisnDhikr) => {
    const key = getDhikrKey(catId, item.id);
    const target = item.count > 0 ? item.count : 1;
    const current = counts[key] || 0;
    if (current >= target) return;

    const next = current + 1;
    const nextCounts = { ...counts, [key]: next };
    setCounts(nextCounts);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    if (next === target) {
      showToast(`تمّ بحمد الله إتمام الذكر ✓`);
    }

    try {
      const today = getTodayKey();
      localStorage.setItem(
        'adhkar_daily_progress',
        JSON.stringify({ date: today, counts: nextCounts })
      );
    } catch {
      // ignore
    }
  };

  // Reset single item
  const handleResetSingle = (e: React.MouseEvent, catId: number, itemId: number) => {
    e.stopPropagation();
    const key = getDhikrKey(catId, itemId);
    const nextCounts = { ...counts, [key]: 0 };
    setCounts(nextCounts);
    try {
      const today = getTodayKey();
      localStorage.setItem(
        'adhkar_daily_progress',
        JSON.stringify({ date: today, counts: nextCounts })
      );
      showToast('تمت إعادة تصفير عدّاد هذا الذكر');
    } catch {
      // ignore
    }
  };

  // Reset current category
  const handleResetCategory = () => {
    if (!activeCategory) return;
    const nextCounts = { ...counts };
    activeCategory.items.forEach((it) => {
      delete nextCounts[getDhikrKey(activeCategory.id, it.id)];
    });
    setCounts(nextCounts);
    try {
      const today = getTodayKey();
      localStorage.setItem(
        'adhkar_daily_progress',
        JSON.stringify({ date: today, counts: nextCounts })
      );
      showToast(`تمت إعادة تصفير أذكار: ${activeCategory.title}`);
    } catch {
      // ignore
    }
  };

  // Copy Dhikr Text
  const handleCopyText = async (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('تم نسخ نص الذكر بنجاح');
      setTimeout(() => {
        setCopiedId((cur) => (cur === id ? null : cur));
      }, 2000);
    } catch {
      showToast('تعذر النسخ إلى الحافظة');
    }
  };

  // Progress computation for active category
  const categoryStats = useMemo(() => {
    if (!activeCategory) return { completedCount: 0, total: 0, percent: 0 };
    const total = activeCategory.items.length;
    let completedCount = 0;
    activeCategory.items.forEach((it) => {
      const key = getDhikrKey(activeCategory.id, it.id);
      const target = it.count > 0 ? it.count : 1;
      const c = counts[key] || 0;
      if (c >= target) completedCount += 1;
    });
    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    return { completedCount, total, percent };
  }, [activeCategory, counts]);

  // Search filter across all 133 categories
  const searchResults = useMemo(() => {
    const q = normalizeArabic(searchQuery.trim());
    if (!q) return null;

    const matchedCats: { category: HisnCategory; matchedItems: HisnDhikr[] }[] = [];
    for (const cat of categories) {
      const catTitleNorm = normalizeArabic(cat.title);
      const matchesTitle = catTitleNorm.includes(q);
      const matchedItems = cat.items.filter((it) => {
        const itemNorm = normalizeArabic(it.text);
        const refNorm = normalizeArabic(it.reference || '');
        return itemNorm.includes(q) || refNorm.includes(q);
      });

      if (matchesTitle || matchedItems.length > 0) {
        matchedCats.push({
          category: cat,
          matchedItems: matchesTitle && matchedItems.length === 0 ? cat.items : matchedItems,
        });
      }
    }
    return matchedCats;
  }, [searchQuery, categories]);

  // Sequential navigation
  const currentCategoryIndex = useMemo(() => {
    return categories.findIndex((c) => c.id === activeCategoryId);
  }, [categories, activeCategoryId]);

  const prevCategory = currentCategoryIndex > 0 ? categories[currentCategoryIndex - 1] : null;
  const nextCategory =
    currentCategoryIndex < categories.length - 1
      ? categories[currentCategoryIndex + 1]
      : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header & Quick Search Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-light dark:border-subtle-dark pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 dark:text-white">
                الأذكار
              </h2>
            </div>
            <p className="text-xs text-muted-light dark:text-muted-dark">
              مجموع الأذكار النبوية المشكولة بالكامل بأسانيدها الصحيحة وتخريجها المعتمد.
            </p>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-xs font-bold text-muted-light dark:text-muted-dark">
              {categories.length} باباً
            </span>
            <span className="px-3 py-1 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-xs font-bold text-emerald-brand dark:text-emerald-brand-dark">
              {adhkarData.meta.totalDhikrsCount} ذكراً مشكولاً
            </span>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-light dark:text-muted-dark">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الأبواب والأذكار (مثلاً: استيقاظ، سفر، صلاة، استغفار، نوم)..."
            className="w-full ps-10 pe-10 py-3 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-sm placeholder:text-muted-light/60 dark:placeholder:text-muted-dark/60 focus:outline-hidden focus:ring-2 focus:ring-emerald-brand transition-all text-slate-900 dark:text-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Popular Chapters Chips */}
        {!searchQuery && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-muted-light dark:text-muted-dark">
              أبواب سريعة الوصول:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {POPULAR_CHAPTER_IDS.map((p) => {
                const isSelected = p.id === activeCategoryId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveCategoryId(p.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium ${
                      isSelected
                        ? 'bg-emerald-brand text-white shadow-2xs font-bold'
                        : 'bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================= Search Results View ================= */}
      {searchResults ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-muted-light dark:text-muted-dark px-1">
            <span>
              نتائج البحث عن «{searchQuery}»: وجدنا {searchResults.length} باباً مطابقاً
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-emerald-brand hover:underline font-bold"
            >
              مسح البحث والعودة للتصفح
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-2">
              <p className="text-base font-bold text-charcoal-light dark:text-charcoal-dark">
                لم يُعثر على أذكار مطابقة لبحثك
              </p>
              <p className="text-xs text-muted-light dark:text-muted-dark">
                جرّب البحث بكلمة أخرى مثل «صلاة»، «صباح»، «سفر»، أو تصفح الأبواب مباشرة.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {searchResults.map(({ category, matchedItems }) => (
                <div
                  key={category.id}
                  className="p-5 sm:p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-subtle-light dark:border-subtle-dark pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-emerald-brand/10 text-emerald-brand dark:text-emerald-brand-dark font-sans font-bold text-xs flex items-center justify-center">
                        {category.id}
                      </span>
                      <h3 className="font-sans font-bold text-lg text-slate-900 dark:text-white">
                        {category.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategoryId(category.id);
                        setSearchQuery('');
                      }}
                      className="text-xs font-bold text-emerald-brand hover:underline"
                    >
                      فتح هذا الباب كاملاً ←
                    </button>
                  </div>

                  <div className="space-y-4">
                    {matchedItems.map((item) => {
                      const key = getDhikrKey(category.id, item.id);
                      const currentCount = counts[key] || 0;
                      const targetCount = item.count > 0 ? item.count : 1;
                      const isCompleted = currentCount >= targetCount && isMounted;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleTapDhikr(category.id, item)}
                          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                            isCompleted
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-400 dark:border-emerald-800'
                              : 'bg-paper-light dark:bg-paper-dark border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/40'
                          } space-y-3`}
                        >
                          <div className="flex items-center justify-between text-xs text-muted-light dark:text-muted-dark border-b border-subtle-light/50 dark:border-subtle-dark/50 pb-2">
                            <span>
                              العدد: {targetCount}{' '}
                              {targetCount === 1
                                ? 'مرة واحدة'
                                : targetCount === 3
                                  ? 'ثلاث مرات'
                                  : 'مرة'}
                            </span>
                            {item.reference && (
                              <span className="text-[11px] truncate max-w-[220px]">
                                {item.reference}
                              </span>
                            )}
                          </div>
                          <p className="font-hadith text-base sm:text-lg leading-[2.2] text-slate-900 dark:text-white text-justify">
                            {item.text}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span
                              className={`text-xs px-3 py-1 rounded-xl font-bold ${
                                isCompleted
                                  ? 'bg-emerald-brand text-white'
                                  : 'bg-emerald-brand/10 text-emerald-brand'
                              }`}
                            >
                              {isCompleted
                                ? 'تمّ بحمد الله ✓'
                                : `انقر للتسبيح (${currentCount} / ${targetCount})`}
                            </span>
                            <div
                              className="flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShareCardData({
                                    category: 'الأذكار',
                                    sectionTitle: category.title,
                                    text: item.text,
                                    citation: item.reference || 'صحيح الأذكار النبوية',
                                  });
                                }}
                                title="بطاقة مشاركة"
                                className="p-1 rounded-md text-muted-light dark:text-muted-dark hover:text-gold-accent"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleCopyText(e, item.text, `dhikr_${category.id}_${item.id}`)
                                }
                                title="نسخ"
                                className="p-1 rounded-md text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark"
                              >
                                {copiedId === `dhikr_${category.id}_${item.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ================= Normal Sequential Chapter View ================= */
        <div className="space-y-6">
          {/* Category Selector Dropdown & Sequential Navigation */}
          <div className="p-4 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Select Box for 133 Chapters */}
              <div className="flex-1">
                <label
                  htmlFor="dhikr-chapter-select"
                  className="block text-xs font-bold text-muted-light dark:text-muted-dark mb-1"
                >
                  اختر الباب من الفهرس (١٣٣ باباً):
                </label>
                <select
                  id="dhikr-chapter-select"
                  value={activeCategoryId}
                  onChange={(e) => setActiveCategoryId(Number(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-brand cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id}. {c.title} ({c.items.length} أذكار)
                    </option>
                  ))}
                </select>
              </div>

              {/* Sequential Prev / Next Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center pt-1 sm:pt-4">
                <button
                  type="button"
                  disabled={!prevCategory}
                  onClick={() => prevCategory && setActiveCategoryId(prevCategory.id)}
                  className="py-2 px-3 rounded-xl border border-subtle-light dark:border-subtle-dark text-xs font-bold text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>السابق</span>
                </button>

                <button
                  type="button"
                  disabled={!nextCategory}
                  onClick={() => nextCategory && setActiveCategoryId(nextCategory.id)}
                  className="py-2 px-3 rounded-xl border border-subtle-light dark:border-subtle-dark text-xs font-bold text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chapter Title & Counter Summary */}
            {activeCategory && (
              <div className="pt-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-brand text-white font-sans font-bold text-xs flex items-center justify-center">
                      {activeCategory.id}
                    </span>
                    <h3 className="font-sans font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                      {activeCategory.title}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-light dark:text-muted-dark">
                    يحتوي هذا الباب على {activeCategory.items.length} أذكار موثّقة
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-end">
                    <div className="text-xs text-muted-light dark:text-muted-dark font-sans">
                      أُنجز {categoryStats.completedCount} من {categoryStats.total}
                    </div>
                    <div className="text-sm font-bold font-mono text-emerald-brand dark:text-emerald-brand-dark">
                      {categoryStats.percent}%
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetCategory}
                    title="إعادة تصفير عدّادات هذا الباب"
                    className="p-2 rounded-xl border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Progress bar for chapter */}
            {activeCategory && (
              <div className="w-full h-1.5 rounded-full bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-emerald-brand transition-all duration-300"
                  style={{ width: `${categoryStats.percent}%` }}
                />
              </div>
            )}
          </div>

          {/* Dhikr Cards List for Selected Chapter */}
          {activeCategory && (
            <div className="space-y-4">
              {activeCategory.items.map((item, index) => {
                const key = getDhikrKey(activeCategory.id, item.id);
                const currentCount = counts[key] || 0;
                const targetCount = item.count > 0 ? item.count : 1;
                const isCompleted = currentCount >= targetCount && isMounted;
                const itemPercent = Math.min(
                  Math.round((currentCount / targetCount) * 100),
                  100
                );

                return (
                  <div
                    key={item.id}
                    onClick={() => handleTapDhikr(activeCategory.id, item)}
                    className={`cursor-pointer group p-5 sm:p-6 rounded-3xl border transition-all duration-150 select-none space-y-4 ${
                      isCompleted
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-400 dark:border-emerald-800/80 shadow-md'
                        : 'bg-surface-light dark:bg-surface-dark border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/50 dark:hover:border-emerald-brand-dark/50'
                    }`}
                  >
                    {/* Top Bar: Dhikr Index, Target Count, Reference, and Actions */}
                    <div className="flex items-center justify-between gap-3 border-b border-subtle-light/70 dark:border-subtle-dark/70 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark font-sans font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-semibold text-muted-light dark:text-muted-dark">
                          العدد المطلوب: {targetCount}{' '}
                          {targetCount === 1
                            ? 'مرة واحدة'
                            : targetCount === 3
                              ? 'ثلاث مرات'
                              : 'مرة'}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Share Card Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareCardData({
                              category: 'الأذكار',
                              sectionTitle: activeCategory.title,
                              text: item.text,
                              citation: item.reference || 'صحيح الأذكار النبوية',
                            });
                          }}
                          title="توليد بطاقة مشاركة للذكر"
                          className="p-1.5 rounded-lg border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-gold-accent hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-gold-accent" />
                        </button>

                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyText(e, item.text, key)}
                          title="نسخ نص الذكر"
                          className="p-1.5 rounded-lg border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors"
                        >
                          {copiedId === key ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Reset Single Button */}
                        {currentCount > 0 && (
                          <button
                            type="button"
                            onClick={(e) =>
                              handleResetSingle(e, activeCategory.id, item.id)
                            }
                            title="إعادة تصفير هذا الذكر"
                            className="p-1.5 rounded-lg border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-rose-600 hover:border-rose-300 text-xs transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Main Dhikr Text */}
                    <p className="font-hadith text-lg sm:text-xl md:text-2xl leading-[2.2] text-slate-900 dark:text-white text-justify">
                      {item.text}
                    </p>

                    {/* Reference / Takhrij if present */}
                    {item.reference && (
                      <div className="p-3 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light/70 dark:border-subtle-dark/70 text-xs text-muted-light dark:text-muted-dark leading-relaxed flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-gold-accent dark:text-gold-accent-dark me-1">
                            التخريج والمصدر:
                          </span>
                          <span>{item.reference}</span>
                        </div>
                        <a
                          href={getDorarHadithUrl(item.text)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-emerald-brand hover:underline inline-flex items-center gap-1 text-[11px]"
                          title="تخريج الحديث في موسوعة الدرر السنية"
                        >
                          <span>تخريج في الدرر السنية ↗</span>
                        </a>
                      </div>
                    )}

                    {/* Counter & Progress Action Bar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`px-4 py-2 rounded-2xl font-bold font-sans text-sm flex items-center gap-2 transition-all ${
                            isCompleted
                              ? 'bg-emerald-brand text-white shadow-xs'
                              : 'bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark border border-emerald-brand/20 group-hover:bg-emerald-brand group-hover:text-white'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>تمّ بحمد الله ✓</span>
                            </>
                          ) : (
                            <>
                              <span>انقر للتسبيح</span>
                              <span className="font-mono text-xs">
                                ({currentCount} / {targetCount})
                              </span>
                            </>
                          )}
                        </div>

                        {!isCompleted && (
                          <span className="text-xs text-muted-light dark:text-muted-dark hidden sm:inline">
                            متبقٍ: {targetCount - currentCount}
                          </span>
                        )}
                      </div>

                      {/* Micro progress indicator */}
                      <div className="w-28 sm:w-36 h-2 rounded-full bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-emerald-brand'
                          }`}
                          style={{ width: `${itemPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating Feedback Toast */}
      {feedbackToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 sm:bottom-10 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-charcoal-light dark:bg-charcoal-dark text-white text-xs font-medium shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Share Card Modal */}
      <ShareCardModal
        isOpen={Boolean(shareCardData)}
        onClose={() => setShareCardData(null)}
        data={shareCardData}
      />
    </div>
  );
}
