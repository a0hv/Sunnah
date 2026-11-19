'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Compass,
  Calendar,
  MapPin,
  Sparkles,
  Lightbulb,
  Users,
  CheckCircle2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Search,
  X,
  Filter,
  Clock,
  ArrowRight,
  BookOpen,
  Award,
  RotateCcw,
  Eye,
  Scroll,
} from 'lucide-react';
import seerahRaw from '@/data/seerah.json';
import type { SeerahMilestone, SeerahEra, SeerahData, SeerahCategory } from '@/types/seerah';
import { normalizeArabic } from '@/lib/arabic-search';
import { getQuranComUrl } from '@/lib/external-refs';
import { FormattedArabicText } from './FormattedArabicText';
import { ShareCardModal, type ShareCardData } from './ShareCardModal';

const seerahData = seerahRaw as unknown as SeerahData;
const ERAS: SeerahEra[] = seerahData.eras || [];
const MILESTONES: SeerahMilestone[] = seerahData.milestones || [];

const CATEGORIES: { label: string; value: 'all' | SeerahCategory }[] = [
  { label: 'الكل', value: 'all' },
  { label: 'غزوات', value: 'غزوة' },
  { label: 'أحداث مفصلية', value: 'حدث مفصلي' },
  { label: 'معاهدات وبيعات', value: 'معاهدة وبيعة' },
  { label: 'مراحل كبرى', value: 'مرحلة' },
];

export function SeerahClient() {
  const [selectedEraId, setSelectedEraId] = useState<number>(0); // 0 means all eras
  const [selectedCategory, setSelectedCategory] = useState<'all' | SeerahCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>({});
  const [showOnlyCompleted, setShowOnlyCompleted] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [shareCardData, setShareCardData] = useState<ShareCardData | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Load completed milestones from localStorage
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('seerah_completed_milestones');
      if (saved) {
        setCompletedIds(JSON.parse(saved));
      }
    } catch {
      // LocalStorage access handled gracefully
    }
  }, []);

  const saveCompleted = useCallback((newCompleted: Record<string, boolean>) => {
    setCompletedIds(newCompleted);
    try {
      localStorage.setItem('seerah_completed_milestones', JSON.stringify(newCompleted));
    } catch {
      // ignore
    }
  }, []);

  const toggleCompleted = (id: string, title: string) => {
    const isNowDone = !completedIds[id];
    const updated = { ...completedIds, [id]: isNowDone };
    saveCompleted(updated);
    showToast(isNowDone ? `ما شاء الله! عُلّمت محطة «${title}» كمقروءة` : `أُزيلت علامة القراءة`);
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((cur) => (cur === msg ? null : cur));
    }, 2200);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    for (const m of MILESTONES) {
      allExpanded[m.id] = true;
    }
    setExpandedIds(allExpanded);
    showToast('تم توسيع جميع المحطات وتفاصيلها');
  };

  const collapseAll = () => {
    setExpandedIds({});
    showToast('تم طي جميع المحطات');
  };

  const handleResetProgress = () => {
    if (confirm('هل ترغب بإعادة ضبط تقدم قراءة محطات السيرة النبوية؟')) {
      saveCompleted({});
      showToast('تمت إعادة ضبط سجل القراءة');
    }
  };

  const handleCopy = (m: SeerahMilestone) => {
    const lessonsText = m.lessons.map((l, i) => `${i + 1}. ${l}`).join('\n');
    const textToCopy = `المحطة ${m.order}: «${m.title}»\nالتاريخ: ${m.hijriDate} (${m.gregorianYear})\nالمكان: ${m.location}\nالمرحلة: ${m.eraTitle}\n\nخلاصة الحدث:\n${m.summary}\n\nأبرز الدروس والعبر:\n${lessonsText}\n\n— السيرة النبوية من «الرحيق المختوم» للمباركفوري | منصة السنة`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(m.id);
    showToast('تم نسخ خلاصة المحطة ودروسها إلى الحافظة');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    const normQ = normalizeArabic(searchQuery);

    return MILESTONES.filter((m) => {
      // 1. Era filter
      if (selectedEraId !== 0 && m.eraId !== selectedEraId) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all' && m.category !== selectedCategory) {
        return false;
      }

      // 3. Completed only filter
      if (showOnlyCompleted && !completedIds[m.id]) {
        return false;
      }

      // 4. Search query
      if (normQ.length >= 2) {
        const normTitle = normalizeArabic(m.title);
        const normSummary = normalizeArabic(m.summary);
        const normLocation = normalizeArabic(m.location);
        const normEra = normalizeArabic(m.eraTitle);
        const normFigures = normalizeArabic(m.keyFigures.join(' '));
        const normLessons = normalizeArabic(m.lessons.join(' '));
        const normDetails = normalizeArabic(m.details.join(' '));

        const matches =
          normTitle.includes(normQ) ||
          normSummary.includes(normQ) ||
          normLocation.includes(normQ) ||
          normEra.includes(normQ) ||
          normFigures.includes(normQ) ||
          normLessons.includes(normQ) ||
          normDetails.includes(normQ);

        if (!matches) return false;
      }

      return true;
    });
  }, [selectedEraId, selectedCategory, searchQuery, showOnlyCompleted, completedIds]);

  // Statistics
  const totalCount = MILESTONES.length;
  const completedCount = useMemo(() => {
    return Object.values(completedIds).filter(Boolean).length;
  }, [completedIds]);
  const percentage = Math.round((completedCount / totalCount) * 100);

  const selectedEra = useMemo(() => {
    if (selectedEraId === 0) return null;
    return ERAS.find((e) => e.id === selectedEraId) || null;
  }, [selectedEraId]);

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
            <Compass className="w-3.5 h-3.5" />
            <span>مستند إلى كتاب «الرحيق المختوم» الحائز على الجائزة الأولى لرابطة العالم الإسلامي</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 dark:text-white leading-tight">
            السيرة النبوية العطرة: دراسةٌ وعبرةٌ واقتداء
          </h1>

          <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed font-text">
            ثلاثون محطة تاريخية متسلسلة بدقة تغطي حياة الحبيب المصطفى ﷺ من المولد الشريف حتى الرفيق الأعلى، تجمع بين التوثيق الزماني والمكاني، واستخراج العبر التربوية والعملية المعاصرة، مع ربط الأحداث بشواهدها القرآنية.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="px-3 py-1 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark font-medium text-charcoal-light dark:text-charcoal-dark">
              ٦ مراحل كبرى
            </span>
            <span className="px-3 py-1 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark font-medium text-charcoal-light dark:text-charcoal-dark">
              ٣٠ محطة متسلسلة
            </span>
            <span className="px-3 py-1 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark font-medium text-charcoal-light dark:text-charcoal-dark">
              ٧ غزوات فاصلة
            </span>
            <span className="px-3 py-1 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark font-medium text-gold-accent dark:text-gold-accent-dark font-bold">
              شواهد قرآنية موثقة
            </span>
          </div>
        </div>
      </div>

      {/* 2. Reading Progress Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  متتبع قراءة وتدبر السيرة النبوية
                </h3>
                {isMounted && completedCount === totalCount && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gold-accent/15 text-gold-accent dark:text-gold-accent-dark">
                    أتممت السيرة كاملة بارك الله لك!
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-light dark:text-muted-dark">
                {isMounted
                  ? `أتممت قراءة وتدبر ${completedCount} من ${totalCount} محطة (${percentage}%)`
                  : 'جاري تحميل سجل القراءة...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOnlyCompleted(!showOnlyCompleted)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                showOnlyCompleted
                  ? 'bg-emerald-brand text-white'
                  : 'bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-charcoal-light'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>المقروء فقط ({completedCount})</span>
            </button>
            {completedCount > 0 && (
              <button
                onClick={handleResetProgress}
                className="p-1.5 rounded-xl text-muted-light hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="إعادة ضبط تقدم القراءة"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-subtle-light dark:bg-subtle-dark overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-emerald-brand to-gold-accent transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 3. Filters & Search Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted-light dark:text-muted-dark absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في أسماء المحطات، التواريخ، المواقع، الشخصيات، أو الدروس المستفادة..."
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

        {/* Eras Navigation Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-light dark:text-muted-dark px-1">
            <span className="font-semibold">المراحل التاريخية الكبرى:</span>
            <span>{filteredMilestones.length} محطة معروضة</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedEraId(0)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedEraId === 0
                  ? 'bg-emerald-brand text-white shadow-2xs'
                  : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-charcoal-light'
              }`}
            >
              جميع المراحل (٣٠)
            </button>
            {ERAS.map((era) => (
              <button
                key={era.id}
                onClick={() => setSelectedEraId(era.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 ${
                  selectedEraId === era.id
                    ? 'bg-emerald-brand text-white shadow-2xs'
                    : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-charcoal-light'
                }`}
              >
                <span>{era.id}. {era.title}</span>
                <span className="opacity-70 text-[10px]">({era.milestonesCount})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Era Banner */}
        {selectedEra && (
          <div className="p-4 rounded-2xl bg-emerald-brand/5 border border-emerald-brand/15 space-y-1 text-xs">
            <div className="flex items-center justify-between font-bold text-emerald-brand dark:text-emerald-brand-dark">
              <span>المرحلة {selectedEra.id}: {selectedEra.title}</span>
              <span className="text-[11px] font-sans opacity-80">{selectedEra.period}</span>
            </div>
            <p className="text-muted-light dark:text-muted-dark leading-relaxed">
              {selectedEra.description}
            </p>
          </div>
        )}

        {/* Categories & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-subtle-light/70 dark:border-subtle-dark/70">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-light dark:text-muted-dark me-1">التصنيف:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-gold-accent/20 text-gold-accent dark:text-gold-accent-dark font-bold border border-gold-accent/40'
                    : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-charcoal-light'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 rounded-lg text-xs bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-charcoal-light transition-colors flex items-center gap-1"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>توسيع الكل</span>
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 rounded-lg text-xs bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-charcoal-light transition-colors flex items-center gap-1"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>طي الكل</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Milestones List */}
      {filteredMilestones.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-3">
          <Compass className="w-12 h-12 text-muted-light dark:text-muted-dark mx-auto opacity-40" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            لا توجد محطات مطابقة للبحث أو التصفية الحالية
          </h3>
          <p className="text-xs text-muted-light dark:text-muted-dark max-w-md mx-auto">
            جرّب تغيير كلمات البحث أو إلغاء تصفية التصنيف أو عرض جميع المراحل.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedEraId(0);
              setSelectedCategory('all');
              setShowOnlyCompleted(false);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-brand text-white font-bold text-xs"
          >
            إعادة تعيين كافة المرشحات
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredMilestones.map((milestone) => {
            const isExpanded = Boolean(expandedIds[milestone.id]);
            const isDone = Boolean(completedIds[milestone.id]);

            // Category color helpers
            let categoryStyle = 'bg-surface-light text-muted-light border-subtle-light';
            if (milestone.category === 'غزوة') {
              categoryStyle = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
            } else if (milestone.category === 'حدث مفصلي') {
              categoryStyle = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            } else if (milestone.category === 'معاهدة وبيعة') {
              categoryStyle = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            } else if (milestone.category === 'مرحلة') {
              categoryStyle = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
            }

            return (
              <article
                key={milestone.id}
                id={milestone.id}
                className={`p-5 sm:p-7 rounded-3xl bg-surface-light dark:bg-surface-dark border transition-all duration-200 space-y-4 shadow-xs ${
                  isDone
                    ? 'border-emerald-brand/40 bg-emerald-500/5'
                    : 'border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/30'
                }`}
              >
                {/* Milestone Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    {/* Milestone Order Badge */}
                    <span className="w-8 h-8 rounded-xl bg-emerald-brand text-white font-bold font-sans flex items-center justify-center text-sm shadow-2xs">
                      {milestone.order}
                    </span>

                    {/* Category Pill */}
                    <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${categoryStyle}`}>
                      {milestone.category}
                    </span>

                    {/* Era Tag */}
                    <span className="text-muted-light dark:text-muted-dark font-medium hidden sm:inline">
                      {milestone.eraTitle}
                    </span>
                  </div>

                  {/* Read/Done Toggle Button */}
                  <button
                    onClick={() => toggleCompleted(milestone.id, milestone.title)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                      isDone
                        ? 'bg-emerald-brand text-white shadow-2xs'
                        : 'bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-emerald-brand'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isDone ? 'تمت القراءة والتدبر' : 'عَلِّم كمقروء'}</span>
                  </button>
                </div>

                {/* Milestone Title & Summary */}
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white leading-snug">
                    {milestone.title}
                  </h2>

                  {/* Date & Location Badges */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-light dark:text-muted-dark">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gold-accent dark:text-gold-accent-dark" />
                      <strong className="font-semibold text-charcoal-light dark:text-charcoal-dark">
                        {milestone.hijriDate}
                      </strong>
                      <span className="font-sans opacity-75">({milestone.gregorianYear})</span>
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-brand dark:text-emerald-brand-dark" />
                      <span>{milestone.location}</span>
                    </span>
                  </div>

                  {/* Summary */}
                  <p className="text-sm sm:text-base text-charcoal-light dark:text-charcoal-dark leading-relaxed pt-1">
                    {milestone.summary}
                  </p>
                </div>

                {/* Details Section (Expandable) */}
                {isExpanded && (
                  <div className="space-y-5 pt-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 animate-in fade-in duration-200">
                    {/* 1. Historical Details */}
                    <div className="space-y-2.5">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-muted-light dark:text-muted-dark flex items-center gap-1.5">
                        <Scroll className="w-3.5 h-3.5 text-emerald-brand" />
                        <span>تفاصيل الحدث وسياقه التاريخي:</span>
                      </h3>
                      <div className="space-y-2 text-xs sm:text-sm text-charcoal-light dark:text-charcoal-dark leading-relaxed ps-2 border-s-2 border-emerald-brand/30">
                        {milestone.details.map((paragraph, idx) => (
                          <p key={idx} className="leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* 2. Quranic Verse Box (if present) */}
                    {milestone.quranVerse && (
                      <div className="p-4 rounded-2xl bg-gold-accent/5 border border-gold-accent/20 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-gold-accent dark:text-gold-accent-dark flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>شاهدٌ قرآني مرتبط بالمحطة:</span>
                          </span>
                          <a
                            href={getQuranComUrl(milestone.quranVerse)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-gold-accent dark:text-gold-accent-dark hover:underline"
                          >
                            <span>تفسير الآية في Quran.com</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="font-quran text-base sm:text-lg leading-loose text-charcoal-light dark:text-charcoal-dark">
                          <FormattedArabicText text={milestone.quranVerse} />
                        </div>
                      </div>
                    )}

                    {/* 3. Lessons & Educational Takeaways */}
                    {milestone.lessons && milestone.lessons.length > 0 && (
                      <div className="p-4 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark space-y-2.5">
                        <h4 className="font-bold text-xs text-emerald-brand dark:text-emerald-brand-dark flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-gold-accent" />
                          <span>الدروس والعبر التربوية والعملية:</span>
                        </h4>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-charcoal-light dark:text-charcoal-dark">
                          {milestone.lessons.map((lesson, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-brand mt-2 shrink-0" />
                              <span>{lesson}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 4. Key Figures */}
                    {milestone.keyFigures && milestone.keyFigures.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="inline-flex items-center gap-1 text-muted-light dark:text-muted-dark font-medium">
                          <Users className="w-3.5 h-3.5" />
                          <span>شخصيات ارتبطت بالحدث:</span>
                        </span>
                        {milestone.keyFigures.map((fig) => (
                          <span
                            key={fig}
                            className="px-2.5 py-0.5 rounded-lg bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-charcoal-light dark:text-charcoal-dark font-medium text-[11px]"
                          >
                            {fig}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Milestone Footer / Actions Bar */}
                <div className="pt-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 flex flex-wrap items-center justify-between gap-3">
                  {/* Expand/Collapse Toggle Button */}
                  <button
                    onClick={() => toggleExpand(milestone.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-brand dark:text-emerald-brand-dark hover:underline"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>طي التفاصيل والدروس</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>عرض التفاصيل التاريخية والدروس التربوية ({milestone.lessons.length} دروس)</span>
                      </>
                    )}
                  </button>

                  {/* Share & Copy Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(milestone)}
                      className="p-2 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-muted-light hover:text-charcoal-light transition-colors"
                      title="نسخ ملخص المحطة والدروس"
                    >
                      {copiedId === milestone.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() =>
                        setShareCardData({
                          type: 'seerah',
                          title: milestone.title,
                          sectionTitle: milestone.eraTitle,
                          text: milestone.summary,
                          citation: `${milestone.hijriDate} • ${milestone.location}`,
                          source: 'السيرة النبوية — الرحيق المختوم',
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-brand text-white font-bold text-xs hover:bg-emerald-brand/90 transition-colors shadow-2xs"
                      title="مشاركة كبطاقة صورة عالية الدقة"
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

      {/* 5. Scientific Attribution & Navigation Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-4">
        <div className="flex items-center gap-2.5 text-emerald-brand dark:text-emerald-brand-dark font-bold text-sm">
          <BookOpen className="w-4 h-4" />
          <span>عن مادة هذا القسم والأمانة العلمية:</span>
        </div>
        <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed">
          تم استخلاص وتحرير هذه المحطات الثلاثين التاريخية بدقة بالغة استنادًا إلى كتاب <strong>«الرحيق المختوم»</strong> لفضيلة الشيخ صفي الرحمن المباركفوري رحمه الله، والذي نال المركز الأول في مسابقة رابطة العالم الإسلامي لبحوث السيرة النبوية المطهرة. وتم ربط الآيات الكريمة بمواضعها المعتمدة في المصحف الشريف عبر <strong>Quran.com</strong>.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/hadiths"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand text-xs font-semibold text-charcoal-light dark:text-charcoal-dark transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-brand" />
            <span>تصفح الأحاديث المشروحة</span>
          </Link>
          <Link
            href="/nawawi40"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand text-xs font-semibold text-charcoal-light dark:text-charcoal-dark transition-colors"
          >
            <Award className="w-3.5 h-3.5 text-gold-accent" />
            <span>الأربعون النووية والحفظ</span>
          </Link>
          <Link
            href="/daily-tracker"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand text-xs font-semibold text-charcoal-light dark:text-charcoal-dark transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-brand" />
            <span>متتبع سنن اليوم والليلة</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
