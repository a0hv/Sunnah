'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  BookOpen,
  Sparkles,
  ShieldAlert,
  Scroll,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Share2,
  X,
  Compass,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  searchPlatform,
  HighlightArabicText,
  type PlatformSearchResults,
  type HadeethSearchResult,
  type HisnSearchResult,
  type FakeHadithSearchResult,
  type NawawiSearchResult,
  type SeerahSearchResult,
} from '@/lib/arabic-search';
import { ShareCardModal, type ShareCardData } from './ShareCardModal';
import { FormattedArabicText } from './FormattedArabicText';

const SAMPLE_QUERIES = [
  'مخنوق وحزين',
  'عندي دين وعايز رزق',
  'مشاكل مع مراتي',
  'كابوس في النوم',
  'متعصب واتخانقت',
  'إنما الأعمال بالنيات',
  'سيد الاستغفار',
  'دعاء السفر',
  'صلاة الاستخارة',
  'غزوة بدر',
];

type SearchTab = 'all' | 'hadiths' | 'hisn' | 'nawawi' | 'seerah' | 'fake';

export function SearchClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [shareCardData, setShareCardData] = useState<ShareCardData | null>(null);
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  // Keep debounced query up to date
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedQuery(query);
      });
    }, 180);
    return () => clearTimeout(handler);
  }, [query]);

  // Synchronize with URL query if changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== query) {
      setQuery(q);
      setDebouncedQuery(q);
    }
  }, [searchParams]);

  // Perform search
  const results: PlatformSearchResults = useMemo(() => {
    return searchPlatform(debouncedQuery);
  }, [debouncedQuery]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((cur) => (cur === msg ? null : cur));
    }, 2200);
  };

  const copyText = (id: string | number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('تم نسخ النص إلى الحافظة');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExplanation = (id: string) => {
    setExpandedExplanation((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-8 text-start max-w-5xl mx-auto">
      {/* Toast */}
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

      {/* 1. Search Box */}
      <div className="space-y-3">
        <div className="relative flex items-center shadow-md rounded-2xl overflow-hidden bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark focus-within:ring-2 focus-within:ring-emerald-brand transition-all">
          <div className="ps-4 text-muted-light dark:text-muted-dark pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في الأحاديث المشروحة، الفوائد، أذكار حصن المسلم، أو اكتب حالتك (مخنوق، قلقان، دين، مراتي، كابوس...)"
            className="w-full py-4 px-3.5 bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-muted-light/60 dark:placeholder:text-muted-dark/60 focus:outline-hidden font-sans"
            autoFocus
          />
          {query && (
            <div className="pe-3">
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-full text-muted-light hover:text-charcoal-light hover:bg-black/5 dark:hover:bg-white/5"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Suggested Queries */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-light dark:text-muted-dark pt-1">
          <span className="text-[11px] font-semibold me-1">حالات وعبارات شائعة:</span>
          {SAMPLE_QUERIES.map((sample) => (
            <button
              key={sample}
              onClick={() => setQuery(sample)}
              className="px-2.5 py-1 rounded-lg bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/50 text-charcoal-light dark:text-charcoal-dark transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Best Match Section: «أفضل ما يناسب بحثك» (Hadith + Hisn Dhikr Unified) */}
      {debouncedQuery.trim().length >= 2 && results.bestMatch && (results.bestMatch.hadith || results.bestMatch.dhikr) && (
        <section className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-emerald-brand/10 via-surface-light to-gold-accent/10 dark:from-emerald-brand-dark/20 dark:via-surface-dark dark:to-gold-accent-dark/15 border border-emerald-brand/30 dark:border-emerald-brand-dark/40 shadow-xs space-y-5 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle-light/70 dark:border-subtle-dark/70 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-brand text-white flex items-center justify-center shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-bold text-base text-slate-900 dark:text-white font-display">
                  أفضل ما يناسب بحثك في السنة والأذكار
                </h2>
                {results.bestMatch.situationTitle && (
                  <span className="text-xs font-semibold text-emerald-brand dark:text-emerald-brand-dark">
                    الموضوع: {results.bestMatch.situationTitle}
                  </span>
                )}
              </div>
            </div>

            {results.expandedTerms.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-light dark:text-muted-dark">
                <span>توسيع دلالي ذكي:</span>
                <span className="font-medium text-emerald-brand dark:text-emerald-brand-dark">
                  {results.expandedTerms.slice(0, 4).join(' • ')}
                </span>
              </div>
            )}
          </div>

          {results.bestMatch.guidanceText && (
            <p className="text-xs sm:text-sm text-charcoal-light dark:text-charcoal-dark leading-relaxed bg-surface-light/80 dark:bg-surface-dark/80 p-3.5 rounded-2xl border border-subtle-light/60 dark:border-subtle-dark/60">
              💡 <strong>الإرشاد النبوي:</strong> {results.bestMatch.guidanceText}
            </p>
          )}

          {/* Unified Grid: Top Hadith + Top Hisn Dhikr */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Explained Hadith */}
            {results.bestMatch.hadith && (
              <div className="p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-emerald-brand/30 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-brand/10 text-emerald-brand dark:text-emerald-brand-dark">
                      حديث نبوي مشروح
                    </span>
                    <span className="text-[11px] text-muted-light dark:text-muted-dark">
                      {results.bestMatch.hadith.grade} • {results.bestMatch.hadith.attribution}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white leading-snug">
                    {results.bestMatch.hadith.title}
                  </h3>

                  <p className="font-hadith text-sm sm:text-base leading-[2.2] text-charcoal-light dark:text-charcoal-dark line-clamp-3">
                    <HighlightArabicText text={results.bestMatch.hadith.hadeeth} query={debouncedQuery} />
                  </p>

                  <div className="p-3 rounded-xl bg-paper-light dark:bg-paper-dark text-xs space-y-1 border border-subtle-light dark:border-subtle-dark">
                    <span className="font-bold text-emerald-brand dark:text-emerald-brand-dark block text-[11px]">
                      من الشرح المبسط:
                    </span>
                    <p className="line-clamp-2 text-muted-light dark:text-muted-dark leading-relaxed">
                      {results.bestMatch.hadith.explanation}
                    </p>
                  </div>

                  {results.bestMatch.hadith.hints[0] && (
                    <div className="flex items-start gap-1.5 text-xs text-charcoal-light dark:text-charcoal-dark pt-1">
                      <Lightbulb className="w-3.5 h-3.5 text-gold-accent shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        <strong>فائدة:</strong> {results.bestMatch.hadith.hints[0]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 flex items-center justify-between text-xs">
                  <Link
                    href={`/hadiths#hadith-${results.bestMatch.hadith.id}`}
                    className="inline-flex items-center gap-1 font-bold text-emerald-brand hover:underline"
                  >
                    <span>فتح الشرح الكامل والفوائد</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        copyText(
                          `bm-h-${results.bestMatch?.hadith?.id}`,
                          `${results.bestMatch?.hadith?.title}\n\n${results.bestMatch?.hadith?.hadeeth}\n\nالشرح: ${results.bestMatch?.hadith?.explanation}\n— منصة السنة | HadeethEnc.com`
                        )
                      }
                      className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                      title="نسخ الحديث"
                    >
                      {copiedId === `bm-h-${results.bestMatch.hadith.id}` ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setShareCardData({
                          type: 'hadith',
                          title: results.bestMatch?.hadith?.title,
                          sectionTitle: results.bestMatch?.hadith?.categoryTitle,
                          text: results.bestMatch?.hadith?.hadeeth || '',
                          citation: `${results.bestMatch?.hadith?.grade} • ${results.bestMatch?.hadith?.attribution}`,
                          source: 'منصة السنة — المصدر: HadeethEnc.com',
                        })
                      }
                      className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                      title="مشاركة كبطاقة"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Top Hisn al-Muslim Dhikr */}
            {results.bestMatch.dhikr && (
              <div className="p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-gold-accent/30 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-gold-accent/15 text-gold-accent dark:text-amber-300">
                      الذكر المأثور من حصن المسلم
                    </span>
                    <Link
                      href={`/adhkar?cat=${results.bestMatch.dhikr.categoryId}`}
                      className="text-[11px] font-bold text-emerald-brand hover:underline"
                    >
                      {results.bestMatch.dhikr.categoryTitle}
                    </Link>
                  </div>

                  <p className="font-hadith text-base sm:text-lg leading-[2.2] text-charcoal-light dark:text-charcoal-dark line-clamp-4 pt-1">
                    <HighlightArabicText text={results.bestMatch.dhikr.text} query={debouncedQuery} />
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-light dark:text-muted-dark pt-1">
                    <span className="text-[11px]">
                      التخريج: <strong>{results.bestMatch.dhikr.reference || 'صحيح الأذكار'}</strong>
                    </span>
                    {results.bestMatch.dhikr.count > 1 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-brand/10 text-emerald-brand font-bold text-[11px]">
                        يكرر {results.bestMatch.dhikr.count} مرات
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 flex items-center justify-between text-xs">
                  <Link
                    href={`/adhkar?cat=${results.bestMatch.dhikr.categoryId}`}
                    className="inline-flex items-center gap-1 font-bold text-emerald-brand hover:underline"
                  >
                    <span>فتح الباب في حصن المسلم والعدّاد</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        copyText(
                          `bm-d-${results.bestMatch?.dhikr?.id}`,
                          `${results.bestMatch?.dhikr?.text}\n\n[${results.bestMatch?.dhikr?.reference || 'حصن المسلم'}]`
                        )
                      }
                      className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                      title="نسخ الذكر"
                    >
                      {copiedId === `bm-d-${results.bestMatch.dhikr.id}` ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setShareCardData({
                          type: 'adhkar',
                          category: results.bestMatch?.dhikr?.categoryTitle,
                          text: results.bestMatch?.dhikr?.text || '',
                          citation: results.bestMatch?.dhikr?.reference || 'حصن المسلم',
                          repeatCount: results.bestMatch?.dhikr?.count,
                        })
                      }
                      className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                      title="مشاركة كبطاقة"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. Result Tabs */}
      {debouncedQuery.trim().length >= 2 && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle-light dark:border-subtle-dark pb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-emerald-brand text-white shadow-2xs font-semibold'
                    : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light'
                }`}
              >
                الكل ({results.totalCount})
              </button>
              <button
                onClick={() => setActiveTab('hadiths')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'hadiths'
                    ? 'bg-emerald-brand text-white shadow-2xs font-semibold'
                    : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light'
                }`}
              >
                الأحاديث المشروحة ({results.hadiths.length})
              </button>
              <button
                onClick={() => setActiveTab('hisn')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'hisn'
                    ? 'bg-emerald-brand text-white shadow-2xs font-semibold'
                    : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light'
                }`}
              >
                حصن المسلم ({results.hisn.length})
              </button>
              <button
                onClick={() => setActiveTab('nawawi')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'nawawi'
                    ? 'bg-emerald-brand text-white shadow-2xs font-semibold'
                    : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light'
                }`}
              >
                الأربعون النووية ({results.nawawi.length})
              </button>
              <button
                onClick={() => setActiveTab('seerah')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'seerah'
                    ? 'bg-emerald-brand text-white shadow-2xs font-semibold'
                    : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light'
                }`}
              >
                السيرة النبوية ({results.seerah.length})
              </button>
              <button
                onClick={() => setActiveTab('fake')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'fake'
                    ? 'bg-emerald-brand text-white shadow-2xs font-semibold'
                    : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light'
                }`}
              >
                تثبّت ({results.fake.length})
              </button>
            </div>

            <span className="text-xs text-muted-light dark:text-muted-dark">
              نتائج فورية داخل المتصفح (Zero API)
            </span>
          </div>

          {/* 4. Empty State */}
          {results.totalCount === 0 && (
            <div className="p-12 text-center rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-3">
              <Search className="w-12 h-12 text-muted-light dark:text-muted-dark mx-auto opacity-50" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                لم نجد نتائج مطابقة لـ «{debouncedQuery}»
              </h3>
              <p className="text-xs text-muted-light dark:text-muted-dark max-w-md mx-auto">
                جرب البحث بكلمات أخرى أو استخدام أحد الاقتراحات أعلاه.
              </p>
              <div className="pt-2">
                <a
                  href={`https://www.dorar.net/hadith/search?q=${encodeURIComponent(debouncedQuery)}&st=w`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light hover:border-emerald-brand text-xs font-semibold text-emerald-brand"
                >
                  <span>ابحث عنها مباشرة في الموسوعة الحديثية (الدرر السنية)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* LAYER 1: الأحاديث المشروحة (HadeethEnc.com) */}
          {(activeTab === 'all' || activeTab === 'hadiths') && results.hadiths.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-brand dark:text-emerald-brand-dark">
                <BookOpen className="w-4 h-4" />
                <h3 className="font-bold text-sm font-sans">
                  الأحاديث النبوية المشروحة ({results.hadiths.length})
                </h3>
              </div>

              <div className="space-y-4">
                {results.hadiths.slice(0, activeTab === 'all' ? 8 : 40).map((h) => {
                  const isExp = Boolean(expandedExplanation[h.id]);
                  return (
                    <div
                      key={`hadith-${h.id}`}
                      className="p-5 sm:p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-3 shadow-xs hover:border-emerald-brand/40 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-light dark:text-muted-dark">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-brand/10 text-emerald-brand dark:text-emerald-brand-dark text-[11px]">
                            {h.categoryTitle}
                          </span>
                          <span className="font-semibold text-charcoal-light dark:text-charcoal-dark">
                            {h.grade} • {h.attribution}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                        <HighlightArabicText text={h.title} query={debouncedQuery} />
                      </h4>

                      <p className="font-hadith text-base sm:text-lg leading-[2.2] text-charcoal-light dark:text-charcoal-dark">
                        <HighlightArabicText text={h.hadeeth} query={debouncedQuery} />
                      </p>

                      {/* Explanation Snippet */}
                      <div className="p-3.5 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-emerald-brand dark:text-emerald-brand-dark">
                          <span>الشرح المبسط:</span>
                          {h.explanation.length > 250 && (
                            <button
                              onClick={() => toggleExplanation(h.id)}
                              className="text-[11px] text-emerald-brand hover:underline font-semibold flex items-center gap-1"
                            >
                              {isExp ? (
                                <>
                                  <ChevronUp className="w-3.5 h-3.5" />
                                  <span>طي</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                  <span>توسيع</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <p
                          className={`text-charcoal-light dark:text-charcoal-dark leading-relaxed ${
                            h.explanation.length > 250 && !isExp ? 'line-clamp-2' : ''
                          }`}
                        >
                          <HighlightArabicText text={h.explanation} query={debouncedQuery} />
                        </p>
                      </div>

                      {/* Pedagogical Hint */}
                      {h.hints && h.hints.length > 0 && (
                        <div className="flex items-start gap-1.5 text-xs text-charcoal-light dark:text-charcoal-dark pt-1">
                          <Lightbulb className="w-3.5 h-3.5 text-gold-accent shrink-0 mt-0.5" />
                          <span>
                            <strong>فائدة:</strong> {h.hints[0]}
                          </span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-xs">
                          <Link
                            href={`/hadiths#hadith-${h.id}`}
                            className="inline-flex items-center gap-1 font-bold text-emerald-brand hover:underline"
                          >
                            <span>فتح في الأحاديث المشروحة</span>
                            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                          </Link>
                          <a
                            href={h.dorarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-muted-light hover:text-emerald-brand transition-colors"
                          >
                            <span>الدرر السنية</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyText(`h-${h.id}`, `${h.title}\n\n${h.hadeeth}\n\n${h.explanation}`)}
                            className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                            title="نسخ الحديث"
                          >
                            {copiedId === `h-${h.id}` ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              setShareCardData({
                                type: 'hadith',
                                title: h.title,
                                sectionTitle: h.categoryTitle,
                                text: h.hadeeth,
                                citation: `${h.grade} • ${h.attribution}`,
                                source: 'منصة السنة — المصدر: HadeethEnc.com',
                              })
                            }
                            className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                            title="مشاركة كبطاقة"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LAYER 2: Hisn al-Muslim (أذكار) */}
          {(activeTab === 'all' || activeTab === 'hisn') && results.hisn.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-brand dark:text-emerald-brand-dark">
                <Sparkles className="w-4 h-4" />
                <h3 className="font-bold text-sm font-sans">
                  أذكار حصن المسلم ({results.hisn.length})
                </h3>
              </div>

              <div className="space-y-3">
                {results.hisn.slice(0, activeTab === 'all' ? 8 : 40).map((d) => (
                  <div
                    key={`hisn-${d.id}`}
                    className="p-5 sm:p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-3 shadow-xs hover:border-emerald-brand/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-light dark:text-muted-dark">
                      <Link
                        href={`/adhkar?cat=${d.categoryId}`}
                        className="font-bold text-emerald-brand dark:text-emerald-brand-dark hover:underline"
                      >
                        {d.categoryTitle}
                      </Link>
                      {d.count > 1 && (
                        <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          يكرر {d.count} مرات
                        </span>
                      )}
                    </div>

                    <p className="font-hadith text-base sm:text-lg leading-[2.2] text-charcoal-light dark:text-charcoal-dark">
                      <HighlightArabicText text={d.text} query={debouncedQuery} />
                    </p>

                    <div className="text-xs text-muted-light dark:text-muted-dark">
                      <span>التخريج: </span>
                      <span className="font-semibold">{d.reference}</span>
                    </div>

                    <div className="pt-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/adhkar?cat=${d.categoryId}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-brand hover:underline"
                        >
                          <span>فتح الباب في حصن المسلم</span>
                          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                        </Link>
                        <a
                          href={d.dorarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-light hover:text-emerald-brand transition-colors"
                        >
                          <span>الدرر السنية</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyText(`hisn-${d.id}`, d.text)}
                          className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                          title="نسخ الذكر"
                        >
                          {copiedId === `hisn-${d.id}` ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            setShareCardData({
                              type: 'adhkar',
                              category: d.categoryTitle,
                              text: d.text,
                              citation: d.reference,
                              repeatCount: d.count,
                            })
                          }
                          className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                          title="مشاركة كبطاقة"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LAYER 3: Nawawi 40 */}
          {(activeTab === 'all' || activeTab === 'nawawi') && results.nawawi.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-brand dark:text-emerald-brand-dark">
                <Scroll className="w-4 h-4" />
                <h3 className="font-bold text-sm font-sans">
                  أحاديث الأربعين النووية ({results.nawawi.length})
                </h3>
              </div>

              <div className="space-y-3">
                {results.nawawi.slice(0, activeTab === 'all' ? 5 : 42).map((n) => (
                  <div
                    key={`nawawi-${n.id}`}
                    className="p-5 sm:p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-3 shadow-xs hover:border-emerald-brand/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-light dark:text-muted-dark">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark font-bold font-sans flex items-center justify-center">
                          {n.id}
                        </span>
                        <Link
                          href={`/nawawi40#hadith-${n.id}`}
                          className="font-bold text-charcoal-light dark:text-charcoal-dark hover:text-emerald-brand transition-colors text-sm"
                        >
                          {n.title}
                        </Link>
                      </div>
                      {n.narrator && (
                        <span>
                          الراوي: <strong>{n.narrator}</strong>
                        </span>
                      )}
                    </div>

                    <p className="font-hadith text-base sm:text-lg leading-[2.2] text-charcoal-light dark:text-charcoal-dark">
                      <HighlightArabicText text={n.text} query={debouncedQuery} />
                    </p>

                    <div className="pt-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/nawawi40#hadith-${n.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-brand hover:underline"
                        >
                          <span>فتح في الأربعين النووية والتسميع</span>
                          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                        </Link>
                        <a
                          href={n.dorarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-light hover:text-emerald-brand transition-colors"
                        >
                          <span>الدرر السنية</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyText(`nawawi-${n.id}`, n.text)}
                          className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                          title="نسخ الحديث"
                        >
                          {copiedId === `nawawi-${n.id}` ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            setShareCardData({
                              type: 'hadith',
                              text: n.text,
                              title: n.title,
                              narrator: n.narrator,
                              source: `الأربعون النووية — الحديث ${n.id} (${n.title})`,
                              hadithNumber: n.id,
                            })
                          }
                          className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                          title="مشاركة كبطاقة"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LAYER 4: Seerah (السيرة النبوية) */}
          {(activeTab === 'all' || activeTab === 'seerah') && results.seerah.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-brand dark:text-emerald-brand-dark">
                <Compass className="w-4 h-4" />
                <h3 className="font-bold text-sm font-sans">
                  محطات السيرة النبوية ({results.seerah.length})
                </h3>
              </div>

              <div className="space-y-3">
                {results.seerah.slice(0, activeTab === 'all' ? 5 : 30).map((m) => (
                  <div
                    key={`seerah-${m.id}`}
                    className="p-5 sm:p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-3 shadow-xs hover:border-emerald-brand/40 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-light dark:text-muted-dark">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark font-bold font-sans flex items-center justify-center">
                          {m.order}
                        </span>
                        <Link
                          href={`/seerah#${m.id}`}
                          className="font-bold text-charcoal-light dark:text-charcoal-dark hover:text-emerald-brand transition-colors text-sm"
                        >
                          {m.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark font-medium text-[11px]">
                          {m.eraTitle}
                        </span>
                        <span className="font-medium text-emerald-brand dark:text-emerald-brand-dark">
                          {m.hijriDate}
                        </span>
                      </div>
                    </div>

                    <p className="font-text text-sm sm:text-base leading-relaxed text-charcoal-light dark:text-charcoal-dark">
                      <HighlightArabicText text={m.summary} query={debouncedQuery} />
                    </p>

                    <div className="pt-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/seerah#${m.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-brand hover:underline"
                        >
                          <span>عرض المحطة وتفاصيلها والدروس</span>
                          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyText(`seerah-${m.id}`, `${m.title}\n${m.summary}\n— السيرة النبوية (الرحيق المختوم)`)}
                          className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                          title="نسخ المحطة"
                        >
                          {copiedId === `seerah-${m.id}` ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            setShareCardData({
                              type: 'seerah',
                              title: m.title,
                              sectionTitle: m.eraTitle,
                              text: m.summary,
                              citation: `${m.hijriDate} • ${m.location}`,
                              source: 'السيرة النبوية — الرحيق المختوم',
                            })
                          }
                          className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                          title="مشاركة كبطاقة"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LAYER 5: تثبّت (أحاديث لا تصح) */}
          {(activeTab === 'all' || activeTab === 'fake') && results.fake.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-rose-500">
                <ShieldAlert className="w-4 h-4" />
                <h3 className="font-bold text-sm font-sans">
                  أحاديث منتشرة لا تصح من قسم «تثبّت» ({results.fake.length})
                </h3>
              </div>

              <div className="space-y-3">
                {results.fake.slice(0, activeTab === 'all' ? 5 : 40).map((f) => (
                  <div
                    key={`fake-${f.id}`}
                    className="p-5 sm:p-6 rounded-3xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        حكم المحدثين: {f.ruling}
                      </span>
                      <Link href="/verify" className="text-muted-light hover:text-rose-500 transition-colors">
                        قسم تثبّت
                      </Link>
                    </div>

                    <p className="font-hadith text-base sm:text-lg leading-[2.2] text-charcoal-light dark:text-charcoal-dark">
                      «<HighlightArabicText text={f.hadithText} query={debouncedQuery} />»
                    </p>

                    <div className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                      <strong>بيان التحقيق: </strong>
                      {f.explanation}
                    </div>

                    <div className="pt-3 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
                      <a
                        href={f.dorarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        <span>تحقيق الحديث في الدرر السنية</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => copyText(`fake-${f.id}`, `حديث لا يصح: «${f.hadithText}»\nالحكم: ${f.ruling}\n${f.explanation}\n— منصة السنة (تثبّت)`)}
                        className="p-1.5 rounded-lg text-muted-light hover:text-charcoal-light transition-colors"
                        title="نسخ التنبيه"
                      >
                        {copiedId === `fake-${f.id}` ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
