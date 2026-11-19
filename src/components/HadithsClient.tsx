'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  Lightbulb,
  X,
  RotateCcw,
  Compass,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import hadeethRaw from '@/data/hadeethenc.json';
import type { ExplainedHadith, HadeethEncData, HadeethCategory } from '@/types/hadith';
import { normalizeArabic } from '@/lib/arabic-search';
import { getDorarHadithUrl } from '@/lib/external-refs';
import { FormattedArabicText } from './FormattedArabicText';
import { ShareCardModal, type ShareCardData } from './ShareCardModal';

const hadeethData = hadeethRaw as unknown as HadeethEncData;
const HADITHS: ExplainedHadith[] = hadeethData.hadiths || [];
const CATEGORIES: HadeethCategory[] = hadeethData.categories || [];

const ITEMS_PER_PAGE = 15;

export function HadithsClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [shareCardData, setShareCardData] = useState<ShareCardData | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Load favorites from localStorage
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('hadeethenc_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch {
      // LocalStorage access handled gracefully
    }
  }, []);

  const saveFavorites = useCallback((newFavs: Record<string, boolean>) => {
    setFavorites(newFavs);
    try {
      localStorage.setItem('hadeethenc_favorites', JSON.stringify(newFavs));
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = (id: string, title: string) => {
    const isNowFav = !favorites[id];
    const updated = { ...favorites, [id]: isNowFav };
    saveFavorites(updated);
    showToast(isNowFav ? `تمت إضافة «${title}» إلى المفضلة` : `تمت إزالة الحديث من المفضلة`);
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((cur) => (cur === msg ? null : cur));
    }, 2200);
  };

  const toggleExplanation = (id: string) => {
    setExpandedExplanation((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (h: ExplainedHadith) => {
    const topHints = h.hints.slice(0, 3).map((hint, i) => `${i + 1}. ${hint}`).join('\n');
    const textToCopy = `«${h.title}»\n\nمتن الحديث:\n${h.hadeeth}\n\nالدرجة والتخريج: ${h.grade} • ${h.attribution}\n\nالشرح المبسط:\n${h.explanation}\n\nمن فوائد الحديث:\n${topHints}\n\n— منصة السنة | المصدر: موسوعة الأحاديث النبوية (HadeethEnc.com)`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(h.id);
    showToast('تم نسخ الحديث وشرحه وفوائده إلى الحافظة');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter hadiths
  const filteredHadiths = useMemo(() => {
    const normQ = normalizeArabic(searchQuery);

    return HADITHS.filter((h) => {
      // 1. Favorites filter
      if (showOnlyFavorites && !favorites[h.id]) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all' && h.categoryId !== selectedCategory) {
        return false;
      }

      // 3. Search query
      if (normQ.length >= 2) {
        const normTitle = normalizeArabic(h.title);
        const normText = normalizeArabic(h.hadeeth);
        const normExpl = normalizeArabic(h.explanation);
        const normCat = normalizeArabic(h.categoryTitle);
        const normHints = normalizeArabic(h.hints.join(' '));
        const normWords = normalizeArabic(h.wordsMeanings.map((w) => `${w.word} ${w.meaning}`).join(' '));

        const matches =
          normTitle.includes(normQ) ||
          normText.includes(normQ) ||
          normExpl.includes(normQ) ||
          normCat.includes(normQ) ||
          normHints.includes(normQ) ||
          normWords.includes(normQ);

        if (!matches) return false;
      }

      return true;
    });
  }, [selectedCategory, searchQuery, showOnlyFavorites, favorites]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, showOnlyFavorites]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredHadiths.length / ITEMS_PER_PAGE) || 1;
  const paginatedHadiths = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHadiths.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHadiths, currentPage]);

  const favoritesCount = useMemo(() => {
    return Object.values(favorites).filter(Boolean).length;
  }, [favorites]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 180, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8 text-start max-w-5xl mx-auto">
      {/* Toast */}
      {feedbackToast && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-semibold shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {feedbackToast}
        </div>
      )}

      {/* Share Card Modal */}
      <ShareCardModal
        isOpen={Boolean(shareCardData)}
        onClose={() => setShareCardData(null)}
        data={shareCardData}
      />

      {/* 1. Header Hero */}
      <div className="p-6 sm:p-10 rounded-3xl bg-linear-to-b from-emerald-brand/5 via-gold-accent/5 to-transparent border border-subtle-light dark:border-subtle-dark relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-gold-accent/10 text-gold-accent dark:text-gold-accent-dark border border-gold-accent/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>المصدر: موسوعة الأحاديث النبوية — HadeethEnc.com (إشراف علمي، بدون تعديل على النص)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold font-quran text-slate-900 dark:text-white leading-tight">
            الأحاديث النبوية المشروحة
          </h1>

          <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed font-sans">
            أكثر من ٥٠٠ حديث نبوي شريف صحيح وحسن، تغطي أصول الإيمان ومحاسن الأخلاق والعبادات وفقه الأسرة والمعاملات، مشفوعة ببيان التخريج والدرجة، والشرح الميسر، والفوائد التربوية المستنبطة، ومعاني الكلمات الغريبة.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="px-3 py-1 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark font-medium text-charcoal-light dark:text-charcoal-dark">
              {HADITHS.length} حديثاً مشروحاً
            </span>
            <span className="px-3 py-1 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark font-medium text-charcoal-light dark:text-charcoal-dark">
              ١١ تصنيفاً موضوعياً
            </span>
            <span className="px-3 py-1 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark font-medium text-emerald-brand dark:text-emerald-brand-dark font-bold">
              فوائد تربوية مرقّمة
            </span>
            <span className="px-3 py-1 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark font-medium text-gold-accent dark:text-gold-accent-dark font-bold">
              معاني غريب الحديث
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted-light dark:text-muted-dark absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في المتن، الشرح، الفوائد التربوية، أو معاني الكلمات..."
            className="w-full ps-11 pe-10 py-3 rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-sm text-charcoal-light dark:text-charcoal-dark placeholder:text-muted-light/70 focus:outline-hidden focus:border-emerald-brand/50 shadow-2xs transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-light dark:text-muted-dark px-1">
            <span className="font-semibold">التصنيفات الموضوعية:</span>
            <span>{filteredHadiths.length} حديثاً معروضاً</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setShowOnlyFavorites(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedCategory === 'all' && !showOnlyFavorites
                  ? 'bg-emerald-brand text-white shadow-2xs'
                  : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-charcoal-light'
              }`}
            >
              الكل ({HADITHS.length})
            </button>

            {/* Favorites Tab */}
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                showOnlyFavorites
                  ? 'bg-gold-accent text-slate-900 font-bold shadow-2xs'
                  : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-gold-accent'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>المفضلة ({favoritesCount})</span>
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setShowOnlyFavorites(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 ${
                  selectedCategory === cat.id && !showOnlyFavorites
                    ? 'bg-emerald-brand text-white shadow-2xs'
                    : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-charcoal-light'
                }`}
              >
                <span>{cat.title}</span>
                <span className="opacity-70 text-[10px]">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Hadith Cards List */}
      {paginatedHadiths.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-3">
          <BookOpen className="w-12 h-12 text-muted-light dark:text-muted-dark mx-auto opacity-40" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            لا توجد أحاديث مطابقة للبحث أو التصفية الحالية
          </h3>
          <p className="text-xs text-muted-light dark:text-muted-dark max-w-md mx-auto">
            جرّب تقليل كلمات البحث أو إزالة فلترة المفضلة أو اختيار تصنيف آخر.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setShowOnlyFavorites(false);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-brand text-white font-bold text-xs"
          >
            إعادة تعيين المرشحات
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {paginatedHadiths.map((h) => {
            const isFav = Boolean(favorites[h.id]);
            const isExpanded = Boolean(expandedExplanation[h.id]);
            const isExplanationLong = h.explanation.length > 280;

            return (
              <article
                key={h.id}
                id={`hadith-${h.id}`}
                className="p-5 sm:p-7 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/35 transition-all duration-200 space-y-5 shadow-xs"
              >
                {/* Card Header: Badges & Favorite */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark border border-emerald-brand/20 text-[11px]">
                      {h.categoryTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-medium bg-gold-accent/10 text-gold-accent dark:text-gold-accent-dark border border-gold-accent/20 text-[11px]">
                      {h.grade} • {h.attribution}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleFavorite(h.id, h.title)}
                      className={`p-1.5 rounded-xl transition-colors ${
                        isFav
                          ? 'text-gold-accent bg-gold-accent/15'
                          : 'text-muted-light hover:text-gold-accent hover:bg-gold-accent/10'
                      }`}
                      title={isFav ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                    >
                      {isFav ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Hadith Title */}
                <h2 className="text-lg sm:text-xl font-bold font-quran text-slate-900 dark:text-white leading-snug">
                  {h.title}
                </h2>

                {/* Hadith Text Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark">
                  <p className="font-quran text-base sm:text-xl leading-loose sm:leading-[2.3] text-charcoal-light dark:text-charcoal-dark select-text">
                    <FormattedArabicText text={h.hadeeth} />
                  </p>
                </div>

                {/* Words Meanings (غريب الحديث) if present */}
                {h.wordsMeanings && h.wordsMeanings.length > 0 && (
                  <div className="space-y-2 p-3.5 rounded-2xl bg-gold-accent/5 border border-gold-accent/20 text-xs">
                    <div className="flex items-center gap-1.5 text-gold-accent dark:text-gold-accent-dark font-bold text-[11px]">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>معاني الكلمات الغريبة:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {h.wordsMeanings.map((wm, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-surface-light dark:bg-surface-dark border border-gold-accent/30 text-charcoal-light dark:text-charcoal-dark"
                        >
                          <strong className="text-gold-accent dark:text-gold-accent-dark font-bold font-quran text-sm">
                            «{wm.word}»:
                          </strong>{' '}
                          <span className="text-[11px] leading-relaxed">{wm.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Simplified Explanation (الشرح الميسر) */}
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-muted-light dark:text-muted-dark font-semibold text-xs">
                    <span className="flex items-center gap-1 text-emerald-brand dark:text-emerald-brand-dark">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>الشرح المبسّط:</span>
                    </span>
                    {isExplanationLong && (
                      <button
                        onClick={() => toggleExplanation(h.id)}
                        className="text-[11px] text-emerald-brand hover:underline font-bold flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>طي الشرح</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>قراءة الشرح كاملاً</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <p
                    className={`leading-relaxed text-charcoal-light dark:text-charcoal-dark ${
                      isExplanationLong && !isExpanded ? 'line-clamp-3' : ''
                    }`}
                  >
                    {h.explanation}
                  </p>
                </div>

                {/* Pedagogical Hints & Benefits (الفوائد المستفادة) */}
                {h.hints && h.hints.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-brand/5 border border-emerald-brand/15 space-y-2.5">
                    <h3 className="font-bold text-xs text-emerald-brand dark:text-emerald-brand-dark flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-gold-accent" />
                      <span>الفوائد التربوية المستنبطة ({h.hints.length} فوائد):</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-charcoal-light dark:text-charcoal-dark">
                      {h.hints.map((hint, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="w-5 h-5 rounded-md bg-emerald-brand/15 text-emerald-brand dark:text-emerald-brand-dark font-bold text-[11px] font-sans flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{hint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <a
                      href={getDorarHadithUrl(h.hadeeth)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-light hover:text-emerald-brand transition-colors"
                      title="تحقق من طرق الحديث ورواياته في الموسوعة الحديثية (الدرر السنية)"
                    >
                      <span>التحقق في الدرر السنية</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopy(h)}
                      className="p-2 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-charcoal-light transition-colors"
                      title="نسخ الحديث وشرحه وفوائده"
                    >
                      {copiedId === h.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* Share Card Modal Button */}
                    <button
                      onClick={() =>
                        setShareCardData({
                          type: 'hadith',
                          title: h.title,
                          sectionTitle: h.categoryTitle,
                          text: h.hadeeth,
                          citation: `${h.grade} • ${h.attribution}`,
                          source: 'منصة السنة — المصدر: HadeethEnc.com',
                          explanation: h.hints[0] ? `• الفائدة: ${h.hints[0]}` : undefined,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-brand text-white font-bold text-xs hover:bg-emerald-brand/90 transition-colors shadow-2xs"
                      title="تصدير كبطاقة صورة أنيقة لواتساب"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>مشاركة كبطاقة</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 4. Pagination */}
      {totalPages > 1 && (
        <div className="p-4 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-muted-light dark:text-muted-dark font-medium">
            صفحة <span className="font-bold text-charcoal-light dark:text-charcoal-dark">{currentPage}</span> من{' '}
            <span className="font-bold text-charcoal-light dark:text-charcoal-dark">{totalPages}</span> (إجمالي{' '}
            {filteredHadiths.length} حديثاً)
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-charcoal-light disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-0" />
            </button>

            {/* Numeric page pills */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-muted-light">...</span>}
                    <button
                      onClick={() => handlePageChange(p)}
                      className={`w-8 h-8 rounded-xl font-bold font-sans text-xs transition-colors ${
                        currentPage === p
                          ? 'bg-emerald-brand text-white shadow-2xs'
                          : 'bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-charcoal-light'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-charcoal-light disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-0" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Scientific Attribution & Navigation Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-4">
        <div className="flex items-center gap-2.5 text-emerald-brand dark:text-emerald-brand-dark font-bold text-sm">
          <BookOpen className="w-4 h-4" />
          <span>الأمانة العلمية والتوثيق المرجعي:</span>
        </div>
        <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed">
          جميع متون الأحاديث النبوية وشروحها وفوائدها التربوية ومعاني كلماتها في هذا القسم مأخوذة حرفيًا ومباشرة من <strong>«موسوعة الأحاديث النبوية» (HadeethEnc.com)</strong> التابعة لشبكة <strong>IslamHouse.com</strong>، تحت إشراف نخبة من أهل العلم والمحدثين، والمحتوى منشور برخصة النشر المفتوح لنشر سنة المصطفى ﷺ مع عزو الفضل لأهله.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/nawawi40"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand text-xs font-semibold text-charcoal-light dark:text-charcoal-dark transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-accent" />
            <span>الأربعون النووية والتسميع</span>
          </Link>
          <Link
            href="/adhkar"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand text-xs font-semibold text-charcoal-light dark:text-charcoal-dark transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-brand" />
            <span>أذكار حصن المسلم</span>
          </Link>
          <Link
            href="/seerah"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand text-xs font-semibold text-charcoal-light dark:text-charcoal-dark transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-gold-accent" />
            <span>السيرة النبوية (الرحيق المختوم)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
